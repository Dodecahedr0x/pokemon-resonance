/* Original section: v4.4-01-aventure-plus.js */

import { GYMS } from './004-data.js';
import { MV } from './005-moves.js';
import { BY, EEVEE, MON, PKT, SCEN } from './009-pokemon.js';
import { ITEMS2, PROFILE } from './011-game-state.js';
import { ARENAS } from './013-gyms.js';
import { paintOverlay } from '../screens/overlays/dialogsStore.js';
import { $, medal, mulberry32 } from './014-utils.js';
import { HOOKS } from './015-hooks.js';
import { EMAX, affected, dmgOf, hasNx, markAt, mvType, uAt, uk } from './021-combat-engine.js';
import { OBST } from './023-roles-synergies-obstacles.js';
import { B, __set_scSel, backToPrep, chooseBattle, launch } from './024-combat-ui.js';
import { queueSave } from './025-saves.js';
import { __set_PREPG, renderPrep } from './026-campaign-tutorial-sound.js';
import { chosenOrder } from './044-tactical-engine.js';
import { chosenAlive } from './046-living-board.js';
import { chosenTactic } from './047-tactics.js';
import { mutOfTurn, mutInfo } from './048-replayability.js';
import { charactersChosen } from './049-identity.js';
import { RIV429, rivBuild429 } from './064-quality.js';
import { rivAdapt455 } from './086-adaptive-rival-board-themes.js';

export let wildShiny;
export function __set_wildShiny(v) { return (wildShiny = v); }


/* =====================================================================
   v4.4 · Adventure+
   Gym leaders who each play in their own way, a rival, shiny
   Pokémon to collect, six legendary bosses and the
   Resonance Tower (endlessly replayable post-game).
   ===================================================================== */

/* ---------- profile: new fields (all optional in old saves) ---------- */
export function APLUS0() {
  return { shiny: [], rival: 0, legends: [], tdr: { best: 0, run: null }, johto: [], jchamp: 0, lac: 0 };
}


export function aplusClean(p) {
  const o = APLUS0();
  if (!p || typeof p !== 'object') return o;
  if (Array.isArray(p.shiny)) o.shiny = [...new Set(p.shiny.filter(id => BY[id] && !BY[id].leg))];
  if (Number.isFinite(p.rival)) o.rival = Math.max(0, Math.min(4, Math.floor(p.rival)));
  if (Array.isArray(p.johto)) o.johto = [...new Set(p.johto.filter(i => Number.isInteger(i) && i >= 0 && i < 8))]; // v4.15
  o.jchamp = p.jchamp ? 1 : 0;
  o.lac = p.lac ? 1 : 0;
  if (Array.isArray(p.legends)) o.legends = [...new Set(p.legends.filter(id => LEGS.some(L => L.id === id)))];
  const t = p.tdr;
  if (t && typeof t === 'object') {
    if (Number.isFinite(t.best)) o.tdr.best = Math.max(0, Math.min(999, Math.floor(t.best)));
    const r = t.run;
    if (
      r &&
      typeof r === 'object' &&
      Number.isFinite(r.seed) &&
      Number.isFinite(r.floor) &&
      Array.isArray(r.team) &&
      r.team.length === 4 &&
      r.team.every(id => BY[id] && !BY[id].leg)
    ) {
      o.tdr.run = {
        seed: Math.floor(r.seed) % 1e9,
        floor: Math.max(1, Math.min(999, Math.floor(r.floor))),
        team: [...r.team],
        voix: Number.isFinite(r.voix) ? Math.max(0, Math.min(2, Math.floor(r.voix))) : 0,
        items: {},
        reward: !!r.reward
      };
      if (r.items && typeof r.items === 'object')
        for (const k in r.items) if (BY[k] && ITEMS2[r.items[k]]) o.tdr.run.items[k] = r.items[k];
    }
  }
  return o;
}


/* ---------- reproducible randomness (Tower: a floor is rebuilt identically after a save) ---------- */
function rng(seed) {
  return mulberry32(seed >>> 0 || 1);
}


/* AI bonus according to the leader's style (added to the score of an attack that hits your Pokémon) */
export function aiStyleBonus(S, e, m, k, sim) {
  const sty = (SCEN[S.sc] || {}).style;
  if (!sty) return 0;
  const hit = affected(S, sim, m, k)
    .map(x => uAt(S, x))
    .filter(v => v && v.side === 'a' && v !== e);
  if (!hit.length) return 0;
  let b = 0;
  if (sty === 'rempart') {
    if (['guard', 'gguard', 'protect', 'reflect'].includes(m.fx) || m.sh === 'self') b += 5;
    if (hit.length > 1) b += 3;
  } else if (sty === 'maree') {
    if (m.mk === 'trempe' || m.wx === 'pluie') b += 5 + affected(S, sim, m, k).length;
    if (m.t === 'Eau') b += 2;
  } else if (sty === 'chaine') {
    hit.forEach(v => {
      const mk = markAt(S, uk(v));
      if (mk === 'trempe' || mk === 'charge') b += m.t === 'Électrik' ? 9 : 3;
    });
    if (m.mk === 'charge' || m.mk === 'trempe') b += 2;
  } else if (sty === 'ronces') {
    if (IMMOBILE.includes(m.fx) || m.mk === 'enracine') b += 6;
    hit.forEach(v => {
      if (v.root > 0 || v.web > 0 || v.badge === 'SOM') b += 3;
    });
  } else if (sty === 'usure') {
    if (!m.p && !m.fix) b += 4;
    hit.forEach(v => {
      if (v.badge || v.bru > 0) b += 3;
    });
  } else if (sty === 'controle') {
    if (CTRL.includes(m.fx)) b += 6;
  } else if (sty === 'assaut') {
    hit.forEach(v => (b += (1 - v.hp / v.mhp) * 10));
  } else if (sty === 'seisme') {
    b += (hit.length - 1) * 4;
  } else if (sty === 'piege') {
    if (IMMOBILE.includes(m.fx)) b += 6;
    hit.forEach(v => {
      if (hasNx(v) && v.en >= EMAX - 1) b += 6;
    });
  } else if (sty === 'rival') {
    hit.forEach(v => {
      if (v.sp === (PROFILE.box && PROFILE.box[0])) b += 5;
      if (dmgOf(S, sim, m, v, mvType(S, sim, m), 1) >= v.hp) b += 4;
    });
  } else if (sty === 'boss') {
    b += (hit.length - 1) * 3;
    hit.forEach(v => (b += (1 - v.hp / v.mhp) * 6));
  }
  return b;
}


export function rivalStarter() {
  const b = PROFILE.box && PROFILE.box[0];
  return RIVAL_LINE[b] ? b : 'kaiminus';
}


export function rivalBuild() {
  if (RIV429) rivBuild429(); // Kael in Johto and Hoenn follows your partner (v4.29)
  const line = RIVAL_LINE[rivalStarter()];
  RIVAL_STEPS.forEach((R, i) => {
    const ace = line[R.st],
      k = RIVAL_KEYS[i];
    SCEN[k] = {
      n: `Rival · ${RIVAL.n}`,
      lvl: `Rival · combat ${i + 1} sur 4`,
      lim: 10,
      time: i % 2 ? 'nuit' : 'jour',
      bio: i < 2 ? 'gue' : 'roche',
      water: i % 2 ? ['4,2', '4,3'] : ['5,0'],
      rock: i < 2 ? ['3,4'] : ['3,1', '4,4'],
      hb: R.hb,
      pb: R.pb,
      lv: R.lv,
      rival: i + 1,
      style: 'rival',
      at: BY[ace].t[0],
      d: `Kael revient avec ${BY[ace].n}, qui a l’avantage du type sur votre partenaire de départ. Son équipe grandit en même temps que la vôtre.`,
      foes: [ace, ...R.team].map((id, j) => [id, RIVAL_POS[j]])
    };
    OBST[k] = i < 2 ? { grass: ['2,2', '2,3'] } : { pil: ['4,2'], sand: ['2,1', '2,4'] };
  });
  try {
    rivAdapt455(); // Kael adapts to your team (v4.55)
  } catch (e) {}
}


function towerIdle() {
  SCEN.tdr = {
    n: 'Tour de Résonance',
    lvl: 'Après-jeu · ascension',
    lim: 10,
    time: 'nuit',
    bio: 'tour',
    water: [],
    rock: [],
    hb: 0,
    pb: 0,
    lv: 1,
    tower: true,
    d: `Choisissez 4 Pokémon parmi 8 tirés au hasard, puis montez le plus haut possible. Chaque étage est plus dur, une légende garde tous les 5 étages, et une récompense vous attend entre deux étages. Record : étage ${(PROFILE.tdr && PROFILE.tdr.best) || 0}.`,
    foes: []
  };
  return SCEN.tdr;
}


function towerBuild(run) {
  const f = run.floor,
    r = rng(run.seed * 31 + f * 977),
    map = pickOf(r, TOWER_MAPS),
    boss = f % 5 === 0;
  let foes,
    rule = null,
    at;
  if (boss) {
    const L = LEGS[(f / 5 - 1) % LEGS.length];
    foes = [
      [L.id, [6, 2], { boss: true, hb: 30 + f * 5, pb: Math.min(10, 3 + Math.floor(f / 3)) }],
      [L.minions[0], [7, 1]],
      [L.minions[1], [7, 4]]
    ];
    rule = L.rule;
    at = L.t[0];
  } else {
    const cap = f < 3 ? 1 : f < 7 ? 2 : 3,
      pool = towerPool().filter(m => m.st <= cap && (f < 7 || m.st >= cap - 1)),
      n = Math.min(5, 2 + Math.floor((f + 1) / 3)),
      families = new Set();
    foes = [];
    for (let i = 0; foes.length < n && i < 60; i++) {
      const m = pickOf(r, pool);
      if (families.has(m.base)) continue;
      families.add(m.base);
      foes.push([m.id, RIVAL_POS[foes.length]]); // same slots as the rival
    }
    if (f % 3 === 0) rule = pickOf(r, TOWER_RULES);
    at = BY[foes[0][0]].t[0];
  }
  OBST.tdr = pickOf(r, TOWER_OBST);
  SCEN.tdr = {
    n: `Tour · étage ${f}`,
    lvl: `Tour de Résonance · étage ${f}${boss ? ' · légende' : ''}`,
    lim: boss ? 11 : 10,
    time: r() < 0.5 ? 'jour' : 'nuit',
    bio: pickOf(r, ['gue', 'roche', 'arene', 'ligue', 'tour']),
    water: map.water,
    rock: map.rock,
    // difficulty climbs fast up to floor 15, then keeps climbing endlessly, more slowly
    hb: 2 + Math.min(f, 15) * 3 + Math.max(0, f - 15) * 5,
    pb: Math.min(8, Math.floor(f / 2)) + Math.floor(Math.max(0, f - 15) / 5),
    lv: Math.min(100, 8 + f * 4),
    rule,
    style: boss ? 'boss' : null,
    tower: true,
    at,
    mut: mutOfTurn(run, f), // one mutator per floor (v4.9)
    d: `${mutOfTurn(run, f) ? `Mutateur · ${mutInfo(mutOfTurn(run, f))[0]} : ${mutInfo(mutOfTurn(run, f))[1]} ` : ''}${boss ? `Étage de légende : ${BY[foes[0][0]].n} garde le passage.` : `${foes.length} adversaires.`}${rule ? ` Règle du plateau : ${GYMS[TOWER_RULES.indexOf(rule)].r}` : ''} Votre équipe : ${run.team.map(id => BY[id].n).join(', ')}${run.voix ? ` · +${run.voix} Voix` : ''}.`,
    foes
  };
  return SCEN.tdr;
}


export function towerRestore() {
  const run = towerRun();
  return run ? towerBuild(run) : towerIdle();
}


/* team and battle options of the current ascent */
export function towerTeam() {
  const run = towerRun();
  if (!run) return null;
  const items = {};
  run.team.forEach(id => {
    const b = BY[id].base;
    if (run.items[id]) items[b] = run.items[id];
  });
  return {
    team: run.team.slice(0, 4),
    voix: run.voix,
    opts: { diff: PROFILE.diff, items, fatigue: {}, links: {}, ordre: chosenOrder(), vivant: chosenAlive(), tactique: chosenTactic(), caracteres: charactersChosen() }
  };
}


export function towerDraft() {
  const seed = Math.floor(Math.random() * 1e9),
    r = rng(seed),
    pool = towerPool().filter(m => m.st <= 2 && !m.ennemi),
    families = new Set(),
    c = [];
  for (let i = 0; c.length < 8 && i < 200; i++) {
    const m = pickOf(r, pool);
    if (families.has(m.base)) continue;
    families.add(m.base);
    c.push(m.id);
  }
  Object.assign(TOWER, { seed, cands: c, pick: [] });
  renderDraft();
  $('#tdrBox').hidden = false;
}


/* rendered by src/screens/overlays/TdrBox.jsx */
function renderDraft() {
  paintOverlay('tdr', { mode: 'draft', cands: [...TOWER.cands], pick: [...TOWER.pick] });
}


function towerOffer(run) {
  const r = rng(run.seed * 7 + run.floor * 131),
    o = [];
  if (run.voix < 2) o.push({ k: 'voix', t: '+1 Voix', d: 'Pour tout le reste de l’ascension.' });
  const free = run.team.filter(id => !run.items[id]);
  if (free.length) {
    const id = pickOf(r, free),
      it = pickOf(r, Object.keys(ITEMS2));
    o.push({ k: 'item', id, it, t: `${ITEMS2[it].n} pour ${BY[id].n}`, d: ITEMS2[it].d });
  }
  const evo = run.team.filter(id => BY[id].nx);
  if (evo.length) {
    const id = pickOf(r, evo),
      nx = BY[id].nx === 'eevee' ? Object.values(EEVEE) : Array.isArray(BY[id].nx) ? BY[id].nx : [BY[id].nx],
      to = pickOf(r, nx);
    o.push({ k: 'evo', id, to, t: `${BY[id].n} devient ${BY[to].n}`, d: 'Éveil définitif pour toute l’ascension.' });
  } else {
    const pool = towerPool().filter(m => m.st >= 2 && !m.ennemi && !run.team.some(x => BY[x].base === m.base)),
      nw = pickOf(r, pool),
      out = run.team.reduce((a, b) => (BY[a].s.reduce((x, y) => x + y) <= BY[b].s.reduce((x, y) => x + y) ? a : b));
    o.push({
      k: 'swap',
      id: out,
      to: nw.id,
      t: `${BY[nw.id].n} remplace ${BY[out].n}`,
      d: 'Une recrue confirmée rejoint l’ascension.'
    });
  }
  return o;
}


function towerReward() {
  const run = towerRun();
  if (!run) return;
  TOWER.offer = towerOffer(run);
  paintOverlay('tdr', { mode: 'reward', floor: run.floor, offer: TOWER.offer });
  $('#tdrBox').hidden = false;
}


/* climb to the current floor */
function towerClimb() {
  const run = towerRun();
  if (!run) return;
  if (run.reward) {
    towerReward();
    return;
  }
  towerBuild(run);
  queueSave();
  if (B) backToPrep();
  chooseBattle('tdr');
  launch();
}


/* =====================================================================
   Progression: rewards for the new battles (called by applyProgress)
   ===================================================================== */
export function aplusProgress(S, rew) {
  const D = SCEN[S.sc] || {},
    win = S.over === 'win';
  let m = 0,
    g = 0;
  /* shinies captured */
  (S.stats.shiny || []).forEach(id => {
    const b = BY[id] ? BY[id].id : null;
    if (!b) return;
    if (!PROFILE.shiny.includes(b)) PROFILE.shiny.push(b);
    (rew.shiny = rew.shiny || []).push(b);
  });
  if (win && D.rival && PROFILE.rival < D.rival) {
    PROFILE.rival = D.rival;
    m += 300 + D.rival * 100;
    g += 4;
    rew.rival = D.rival;
  }
  if (win && D.legend && !PROFILE.legends.includes(D.legend)) {
    PROFILE.legends.push(D.legend);
    m += 1200;
    g += 15;
    rew.legend = D.legend;
  }
  if (S.sc === 'tdr' && D.tower) {
    const run = towerRun();
    if (run) {
      const f = run.floor;
      if (win) {
        PROFILE.tdr.best = Math.max(PROFILE.tdr.best, f);
        m += 60 * f;
        if (f % 5 === 0) g += 6;
        run.floor = f + 1;
        run.reward = true;
        rew.tdr = { cleared: f, next: f + 1, best: PROFILE.tdr.best };
      } else {
        PROFILE.tdr.best = Math.max(PROFILE.tdr.best, f - 1);
        PROFILE.tdr.run = null;
        rew.tdr = { cleared: f - 1, end: true, best: PROFILE.tdr.best };
        towerIdle();
      }
    }
  }
  HOOKS.progres.forEach(h => {
    const r = h(S, rew, win); // colossi, achievements... (v4.8+)
    if (r) {
      m += r[0] || 0;
      g += r[1] || 0;
    }
  });
  if (m || g) {
    PROFILE.money = Math.min(999999, (PROFILE.money || 0) + m);
    PROFILE.gems = Math.min(99999, (PROFILE.gems || 0) + g);
    rew.money = (rew.money || 0) + m;
    rew.gems = (rew.gems || 0) + g;
  }
}


/* lines added to the result screen */
export function aplusRewHtml(r) {
  const o = [];
  if (r.shiny && r.shiny.length)
    o.push(
      `<div class="res-l"><h4>Chromatique</h4>${r.shiny.map(id => `<div class="rl shn" style="${shinyStyle(id)}">${medal(BY[id].t)}<span>${BY[id].n} chromatique rejoint votre collection</span><b>${SPARK}</b></div>`).join('')}</div>`
    );
  if (r.rival)
    o.push(
      `<div class="res-l"><h4>Rival</h4><div class="rl"><span>${r.rival < 4 ? `Kael est battu (${r.rival} / 4). Il reviendra plus fort.` : 'Kael est battu pour de bon. La Ligue vous attend.'}</span><b>${r.rival} / 4</b></div></div>`
    );
  if (r.legend)
    o.push(
      `<div class="res-l"><h4>Légende</h4><div class="rl">${medal(BY[r.legend].t)}<span>${BY[r.legend].n} vaincu · ${PROFILE.legends.length} / 6 légendes</span><b>★</b></div></div>`
    );
  if (r.tdr)
    o.push(
      `<div class="res-l"><h4>Tour de Résonance</h4><div class="rl"><span>${r.tdr.end ? `Ascension terminée à l’étage ${r.tdr.cleared}.` : `Étage ${r.tdr.cleared} franchi. Une récompense vous attend avant l’étage ${r.tdr.next}.`} Record : étage ${r.tdr.best}.</span><b>${r.tdr.cleared}</b></div></div>`
    );
  HOOKS.resultat.forEach(h => o.push(h(r) || '')); // v4.8+
  return o.join('');
}


/* Tower result screen buttons: rendered by React (src/screens/combat/battle/Result.jsx) */

const pickOf = (r, a) => a[Math.floor(r() * a.length)];


/* =====================================================================
   1. Shiny Pokémon
   ===================================================================== */
export const SHINY_RATE = 1 / 25;


/* hue specific to each species: a given shiny Pokémon always has the same color */
export const shinyHue = id => 40 + ((((BY[id] && BY[id].no) || 0) * 53) % 260);


export const shinyStyle = id => `--sh:${shinyHue(id)}deg`;


export const isShinyOwned = id => (PROFILE.shiny || []).includes(id);


export const SPARK =
  '<svg class="shn-ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l2.2 6.6L21 11l-6.8 2.4L12 20l-2.2-6.6L3 11l6.8-2.4Z"/></svg>';


/* =====================================================================
   2. Gym leaders: each with their own play style
   ===================================================================== */
const STYLES = {
  rempart: { n: 'Rempart', d: 'Il s’ancre, se protège et frappe en zone.' },
  maree: { n: 'Marée', d: 'Elle trempe tout le plateau avant de frapper.' },
  chaine: { n: 'Court-circuit', d: 'Il vise en priorité vos Pokémon trempés ou chargés.' },
  ronces: { n: 'Ronces', d: 'Elle enracine et endort, puis s’acharne sur ceux qui ne bougent plus.' },
  usure: { n: 'Usure', d: 'Il préfère altérer vos Pokémon et les épuiser à petit feu.' },
  controle: { n: 'Contrôle', d: 'Elle repousse, attire, provoque et désoriente.' },
  assaut: { n: 'Assaut', d: 'Elle achève sans pitié les Pokémon blessés.' },
  seisme: { n: 'Séisme', d: 'Il cherche à toucher plusieurs Pokémon d’un seul coup.' },
  piege: { n: 'Piège', d: 'Elle immobilise et vise ceux qui sont sur le point de s’éveiller.' },
  rival: { n: 'Rival', d: 'Kael vise votre partenaire de départ et les Pokémon qu’il peut mettre K.O.' },
  boss: { n: 'Légende', d: 'Concentre ses coups et frappe plusieurs cibles dès qu’il le peut.' }
};


const IMMOBILE = ['root', 'web', 'sleep'];


const CTRL = ['push', 'pull', 'confuse', 'turn', 'taunt', 'swap'];


export const styleOf = k => STYLES[(SCEN[k] || {}).style] || null;


/* =====================================================================
   3. The rival: Kael Ferrand
   ===================================================================== */
export const RIVAL = { n: 'Kael Ferrand', t: 'votre rival' };


/* his partner has the advantage over yours, as in the games */
export const RIVAL_LINE = {
  bulbizarre: ['salameche', 'reptincel', 'dracaufeu'],
  salameche: ['carapuce', 'carabaffe', 'tortank'],
  carapuce: ['bulbizarre', 'herbizarre', 'florizarre'],
  germignon: ['hericendre', 'feurisson', 'typhlosion'],
  hericendre: ['kaiminus', 'crocrodil', 'aligatueur'],
  kaiminus: ['germignon', 'macronium', 'meganium']
};


export const RIVAL_KEYS = ['rv1', 'rv2', 'rv3', 'rv4'];


export const RIVAL_STEPS = [
  {
    after: 2,
    lv: 20,
    hb: 7,
    pb: 1,
    st: 0,
    team: ['nosferapti', 'abra'],
    q: 'Deux badges ? Pas mal. Mais mon partenaire et moi, on a choisi le même jour que toi. Montre-moi ce que tu vaux.',
    w: 'Tch… Ton équipe tient mieux que je pensais. La prochaine fois, je serai prêt.',
    l: 'Tu vois ? Choisir le bon type, c’est déjà la moitié du combat.'
  },
  {
    after: 4,
    lv: 28,
    hb: 13,
    pb: 2,
    st: 1,
    team: ['nosferalto', 'kadabra', 'malosse'],
    q: 'Mon partenaire s’est éveillé. Le tien aussi, j’espère. Sinon, ça va être rapide.',
    w: 'Encore toi… D’accord. Tu es vraiment devenu fort.',
    l: 'Tu t’es éveillé trop tard. Le timing, c’est tout.'
  },
  {
    after: 6,
    lv: 36,
    hb: 20,
    pb: 3,
    st: 1,
    team: ['nosferalto', 'kadabra', 'demolosse', 'minidraco'],
    q: 'J’ai étudié chacun de tes combats. Cette fois, j’ai un plan pour chacun de tes Pokémon.',
    w: 'Mon plan était parfait. C’est toi qui ne l’étais pas… enfin, qui l’étais trop.',
    l: 'Un plan pour chaque Pokémon. Je te l’avais dit.'
  },
  {
    after: 8,
    lv: 44,
    hb: 28,
    pb: 4,
    st: 2,
    team: ['nostenfer', 'alakazam', 'demolosse', 'draco'],
    q: 'Huit badges, toi aussi. Avant la Ligue, il reste une chose à régler : lequel de nous deux est le meilleur.',
    w: 'Va. Bats le Conseil 4. Et ne perds pas contre quelqu’un d’autre que moi.',
    l: 'La Ligue attendra. Reviens quand tu seras prêt à me battre.'
  }
];


export const RIVAL_POS = [
  [6, 2],
  [7, 1],
  [6, 4],
  [7, 3],
  [7, 5]
];


export const rivalIdx = k => RIVAL_KEYS.indexOf(k);


/* =====================================================================
   4. Legendary bosses (post-game, never recruitable)
   ===================================================================== */
export const LEGS = [
  {
    id: 'raikou',
    n: 'Raikou',
    t: ['Électrik'],
    no: 243,
    s: [6, 5, 4, 6, 3, 2],
    mv: ['fatalfoudre', 'tonnerre'],
    tal: 'statik',
    rule: 'elec',
    time: 'nuit',
    bio: 'ligue',
    water: ['4,1', '4,4'],
    rock: ['3,2'],
    minions: ['magneton', 'raichu'],
    title: 'le Tonnerre errant',
    q: 'Un grondement traverse la plaine. Les fronts de Charge s’allument tout seuls : Raikou est là.',
    w: 'Raikou s’éloigne dans l’orage. Il vous a reconnu comme un égal.',
    l: 'La foudre a frappé avant que vous ne la voyiez venir.'
  },
  {
    id: 'entei',
    n: 'Entei',
    t: ['Feu'],
    no: 244,
    s: [7, 6, 4, 4, 2, 2],
    mv: ['feusacre', 'lanceflammes'],
    tal: 'brasier',
    rule: 'feu',
    time: 'jour',
    bio: 'roche',
    water: [],
    rock: ['3,1', '3,4'],
    minions: ['arcanin', 'demolosse'],
    title: 'le Volcan qui marche',
    q: 'La lave jaillit sous vos pas. Entei rugit, et le sol lui répond.',
    w: 'Le volcan se tait. Entei vous laisse passer.',
    l: 'Le feu a tout recouvert.'
  },
  {
    id: 'suicune',
    n: 'Suicune',
    t: ['Eau'],
    no: 245,
    s: [7, 4, 6, 4, 3, 2],
    mv: ['surf', 'blizzard'],
    tal: 'crachin',
    rule: 'eau',
    time: 'nuit',
    bio: 'gue',
    water: ['5,0', '5,5'],
    rock: ['3,3'],
    minions: ['lokhlass', 'crustabri'],
    title: 'la Brise du Nord',
    q: 'La pluie se met à tomber, et la marée monte avec elle. Suicune vous observe depuis l’eau.',
    w: 'Suicune bondit au-dessus des flots et disparaît. L’eau redevient claire.',
    l: 'La marée vous a emportés.'
  },
  {
    id: 'mewtwo',
    n: 'Mewtwo',
    t: ['Psy'],
    no: 150,
    s: [6, 6, 4, 6, 2, 3],
    mv: ['frappepsy', 'psyko'],
    tal: 'synchro',
    rule: 'psy',
    time: 'nuit',
    bio: 'tour',
    water: [],
    rock: ['3,0', '3,5'],
    minions: ['alakazam', 'mentali'],
    title: 'le Pokémon créé',
    q: 'Mon Écran Psy se lève une manche sur deux. Frappez au mauvais moment et vous ne m’égratignerez même pas.',
    w: 'Intéressant. Vous m’avez vaincu… cette fois.',
    l: 'Prévisible.'
  },
  {
    id: 'lugia',
    n: 'Lugia',
    t: ['Psy', 'Vol'],
    no: 249,
    s: [8, 5, 6, 4, 3, 2],
    mv: ['aeroblast', 'psyko'],
    tal: 'crachin',
    rule: 'eau',
    time: 'nuit',
    bio: 'gue',
    water: ['4,2', '4,3'],
    rock: [],
    minions: ['leviator', 'tartard'],
    title: 'le Gardien des mers',
    q: 'Une tempête se lève au large. Lugia déploie ses ailes et la marée suit.',
    w: 'La tempête retombe. Lugia regagne le fond des mers.',
    l: 'Le vent vous a balayés.'
  },
  {
    id: 'hooh',
    n: 'Ho-Oh',
    t: ['Feu', 'Vol'],
    no: 250,
    s: [8, 6, 5, 4, 3, 2],
    mv: ['feusacre', 'criailes'],
    tal: 'brasier',
    rule: 'feu',
    time: 'jour',
    bio: 'ligue',
    water: [],
    rock: ['3,2'],
    minions: ['dracaufeu', 'pyroli'],
    title: 'l’Oiseau arc-en-ciel',
    q: 'Un arc-en-ciel traverse le ciel, puis s’embrase. Ho-Oh se pose au centre du plateau.',
    w: 'Ho-Oh laisse tomber une plume aux reflets d’arc-en-ciel avant de s’envoler.',
    l: 'Les flammes sacrées ont tout consumé.'
  }
];


export const legKey = id => 'lg' + id;


export const legOf = k => LEGS.find(L => legKey(L.id) === k) || null;


/* =====================================================================
   5. Resonance Tower
   ===================================================================== */
const TOWER_RULES = ['roche', 'eau', 'elec', 'plante', 'poison', 'psy', 'feu', 'sol'];


const TOWER_MAPS = [
  { water: ['4,2', '4,3'], rock: ['3,0', '3,5'] },
  { water: ['5,0', '5,1'], rock: ['3,4'] },
  { water: [], rock: ['3,1', '4,4'] },
  { water: ['3,2', '4,2', '3,3'], rock: [] },
  { water: ['5,4', '5,5'], rock: ['2,2', '4,1'] }
];


const TOWER_OBST = [
  { grass: ['2,2', '2,3'] },
  { pil: ['4,2'] },
  { sand: ['2,1', '2,4', '5,2'] },
  {},
  { pil: ['4,1', '4,4'] }
];


export const towerRun = () => (PROFILE.tdr && PROFILE.tdr.run) || null;


const towerPool = () => MON.filter(m => !m.leg && m.id !== 'eevee');


/* Tower window: team choice and rewards (#tdrBox rendered by React, src/screens/overlays/TdrBox.jsx) */


const TOWER = { pick: [], cands: [], offer: [] };

// Statements run at startup, in the original order (see index.js).
export function __init() {

wildShiny = false;


['rempart', 'maree', 'chaine', 'ronces', 'usure', 'controle', 'assaut', 'seisme'].forEach((s, i) => {
  if (SCEN[ARENAS[i].k]) SCEN[ARENAS[i].k].style = s;
});


Object.assign(MV, {
  fatalfoudre: {
    n: 'Fatal-Foudre',
    t: 'Électrik',
    p: 12,
    r: 3,
    sh: 'area',
    mk: 'charge',
    d: 'Zone de 7 cases, Chargé.'
  },
  feusacre: { n: 'Feu Sacré', t: 'Feu', p: 13, r: 3, sh: 'area', mk: 'brulant', d: 'Zone de 7 cases, Brûlant.' },
  frappepsy: { n: 'Frappe Psy', t: 'Psy', p: 14, r: 3, sh: 'line', d: 'Ligne de 3 cases.' },
  aeroblast: { n: 'Aéroblast', t: 'Vol', p: 13, r: 3, sh: 'line', fx: 'push', v: 1, d: 'Ligne de 3 cases, repousse.' }
});


LEGS.forEach(L => {
  const m = {
    id: L.id,
    n: L.n,
    t: L.t,
    c: 5,
    r: 'Frappeur',
    r2: 'Rempart',
    s: L.s,
    mv: L.mv,
    tal: L.tal,
    nx: null,
    no: L.no,
    base: L.id,
    st: 1,
    prev: null,
    gen: L.no <= 151 ? 1 : 2,
    leg: true
  };
  BY[L.id] = m;
  PKT.set(m.t, m.id);
});


LEGS.forEach(L => {
  const k = legKey(L.id);
  SCEN[k] = {
    n: L.n,
    lvl: `Légende · ${L.title}`,
    lim: 11,
    time: L.time,
    bio: L.bio,
    rule: L.rule,
    legend: L.id,
    style: 'boss',
    at: L.t[0],
    water: L.water,
    rock: L.rock,
    hb: 34, // the escort
    pb: 5,
    lv: 55,
    d: `${L.n}, ${L.title}, vous attend sur un plateau à sa mesure. Il ne peut pas être capturé : on l’affronte pour l’honneur… et pour les Éclats.`,
    foes: [
      [L.id, [6, 2], { boss: true, hb: 130, pb: 7 }], // tuned to be a bit harder than the Champion
      [L.minions[0], [7, 1]],
      [L.minions[1], [7, 4]]
    ]
  };
  OBST[k] = { pil: ['4,0', '4,5'] };
});


$('#tdrBox').addEventListener('click', e => {
  const p = e.target.closest('[data-tdrp]');
  if (p) {
    const id = p.dataset.tdrp,
      i = TOWER.pick.indexOf(id);
    if (i >= 0) TOWER.pick.splice(i, 1);
    else if (TOWER.pick.length < 4) TOWER.pick.push(id);
    renderDraft();
    return;
  }
  const rw = e.target.closest('[data-tdrr]');
  if (rw) {
    const run = towerRun(),
      x = TOWER.offer[+rw.dataset.tdrr];
    if (!run || !x) return;
    if (x.k === 'voix') run.voix = Math.min(2, run.voix + 1);
    if (x.k === 'item') run.items[x.id] = x.it;
    if (x.k === 'evo' || x.k === 'swap') {
      const i = run.team.indexOf(x.id);
      if (i >= 0) run.team[i] = x.to;
      if (run.items[x.id]) {
        run.items[x.to] = run.items[x.id];
        delete run.items[x.id];
      }
    }
    run.reward = false;
    $('#tdrBox').hidden = true;
    towerClimb();
    return;
  }
  const b = e.target.closest('[data-tdr]');
  if (!b && e.target.id !== 'tdrBox') return;
  const a = b ? b.dataset.tdr : 'x';
  if (a === 'x') {
    if (!towerRun() || !towerRun().reward) $('#tdrBox').hidden = true;
    return;
  }
  if (a === 'go' && TOWER.pick.length === 4) {
    PROFILE.tdr.run = { seed: TOWER.seed, floor: 1, team: [...TOWER.pick], voix: 0, items: {}, reward: false };
    $('#tdrBox').hidden = true;
    towerClimb();
  }
});


$('#cbResult').addEventListener(
  'click',
  e => {
    const b = e.target.closest('[data-tdrn]');
    if (!b) return;
    e.stopPropagation();
    backToPrep();
    __set_scSel('tdr');
    __set_PREPG({ g: 'apres', sc: 'tdr' });
    renderPrep();
    if (b.dataset.tdrn === 'reward') towerReward();
    else towerDraft();
  },
  true
);
}
