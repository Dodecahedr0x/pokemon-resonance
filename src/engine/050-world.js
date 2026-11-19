/* Original section: v4.11-01-monde.js */

import { MV } from './005-moves.js';
import { BY, SCEN } from './009-pokemon.js';
import { PROFILE, isCamp } from './011-game-state.js';
import { $, RM, wait, toast } from './014-utils.js';
import { refreshHome, setRoute } from '../screens/home/homeStore.js';
import { HOOKS } from './015-hooks.js';
import { byUid } from './021-combat-engine.js';
import { OBST } from './023-roles-synergies-obstacles.js';
import { B, __set_B, buildBoard, log, renderAll, ui } from './024-combat-ui.js';
import { queueSave } from './025-saves.js';
import { sfx, vibe } from './026-campaign-tutorial-sound.js';
import { playEv } from './028-move-effects.js';
import { AUTO } from './030-prestige-staging.js';
import { SHOP, bagN } from './032-v4-foundation.js';

export let REPLAYS;
let REPLAY_IN_PROGRESS, DISSONANCE;


/* =====================================================================
   v4.11: the world
   ---------------------------------------------------------------------
   1. Calendar events (device date, works offline):
      Night of Specters (Oct 20 – Nov 5), December Frost (Dec 15 –
      Jan 5), Spring Bloom (Mar 20 – Apr 30), Summer Heatwave
      (July – August), and the Shiny Weekend the rest of the year.
      The season's types appear more often in tall grass, capturing them
      yields 1 Shard, weather shows up in wild battles, and a gift
      awaits on the Home screen (once per season).
   2. Best-move replay: during battle, each action of your Pokémon is
      scored (damage, KOs, reactions, chords, Awakenings). The result
      screen offers to rewatch the best one.
   3. Team Dissonance: an organization that wants to silence
      Resonance. 4 story battles in the Campaign, after badges
      1, 3, 5 and 7: Grunts, Admin Vesper, Admin Cobalt, then their
      leader, Orphée Valcourt. Each with its own rule (mutator, traps).
   ===================================================================== */

/* ---------- profile (declared functions: called as soon as the file loads) ---------- */
export function MON0() {
  return { dissonance: 0, cadeaux: {} };
}


export function monClean(p) {
  const o = MON0();
  if (!p || typeof p !== 'object') return o;
  if (Number.isFinite(p.dissonance)) o.dissonance = Math.max(0, Math.min(4, Math.floor(p.dissonance)));
  if (p.cadeaux && typeof p.cadeaux === 'object')
    {for (const k in p.cadeaux) if (/^[a-z]+-\d{4}$/.test(k)) o.cadeaux[k] = 1;}
  return o;
}


/** Today's season (declared function: encounter rolls need it). */
function seasonOf(d) {
  d = d || new Date();
  const md = (d.getMonth() + 1) * 100 + d.getDate();
  if (md >= 1020 && md <= 1105) return 'halloween';
  if (md >= 1215 || md <= 105) return 'hiver';
  if (md >= 320 && md <= 430) return 'printemps';
  if (md >= 701 && md <= 831) return 'ete';
  if (d.getDay() === 0 || d.getDay() === 6) return 'weekend';
  return null;
}


/** A species' weight in tall grass, depending on the season. */
export function seasonWeight(m) {
  const s = season();
  return s && s.types.length && m.t.some(t => s.types.includes(t)) ? 3 : 1;
}


/** Shiny chance, depending on the season. */
export function multChroma() {
  const s = season();
  return ((s && s.shiny) || 1) * (bagN('charme') ? 3 : 1); // Shiny Charm (v4.15)
}


function giftTaken() {
  return !!(PROFILE.cadeaux && PROFILE.cadeaux[giftKey()]);
}


function takeGift() {
  const s = season();
  if (!s || !s.cadeau || giftTaken()) return;
  PROFILE.cadeaux = PROFILE.cadeaux || {};
  PROFILE.cadeaux[giftKey()] = 1;
  const txt = [];
  for (const k in s.cadeau) {
    if (!SHOP[k]) continue;
    PROFILE.bag[k] = Math.min(99, bagN(k) + s.cadeau[k]);
    txt.push(`${s.cadeau[k]} × ${SHOP[k].n}`);
  }
  sfx('ui');
  vibe(30);
  toast(`Cadeau de la saison : ${txt.join(', ')} !`);
  queueSave();
  renderSeason();
}


/** Today's season on the route (data-saison of #route). */
export function seasonRoute() {
  setRoute({ saison: season() ? seasonOf() : '' });
}


/** #v4Saison block of the Home screen (src/screens/home/Footer.jsx): the season and its gift. */
export function seasonData() {
  const s = season();
  return s ? { s, pris: giftTaken() } : null;
}


export function renderSeason() {
  seasonRoute();
  refreshHome();
}


/** An action's score, based on its events. */
function currentScore(S, ev) {
  let d = 0,
    ko = 0,
    rx = 0,
    acc = '',
    evo = 0;
  ev.forEach(x => {
    const v = x.u && byUid(S, x.u);
    if (x.e === 'dmg' && v && v.side === 'e') d += x.v;
    if (x.e === 'ko' && v && v.side === 'e' && !v.seg) ko++;
    if (x.e === 'rx') rx++;
    if (x.e === 'evo') evo++;
    if (x.e === 'msg' && /^Accord de Résonance · ([^!]+)/.test(x.s)) acc = x.s.match(/^Accord de Résonance · ([^!]+)/)[1].trim();
  });
  return { s: d + ko * 30 + rx * 10 + (acc ? 25 : 0) + evo * 15, d, ko, rx, acc, evo };
}


/** Called by pAct and pAwaken: keeps the battle's best action. */
export function noteMoment(S, u, displayName, ev, previous, heading) {
  const R = REPLAYS.get(S);
  if (!R || !ev || !previous) return;
  const sc = currentScore(S, ev);
  if (sc.s <= 0 || (R.best && R.best.score >= sc.s)) return;
  const det = [
    sc.d ? `${sc.d} dégâts` : '',
    sc.ko ? `${sc.ko} K.O.` : '',
    sc.rx ? `${sc.rx} réaction${sc.rx > 1 ? 's' : ''}` : '',
    sc.acc ? `Accord ${sc.acc}` : '',
    sc.evo ? 'Éveil' : ''
  ].filter(Boolean);
  R.best = {
    score: sc.s,
    avant: previous,
    apres: JSON.stringify(S),
    ev: JSON.parse(JSON.stringify(ev)),
    label: `Manche ${S.round} · ${heading || `${u.n} · ${displayName}`}`,
    det: det.join(' · ')
  };
}


async function rebroadcast() {
  const R = B && REPLAYS.get(B);
  if (!R || !R.best || REPLAY_IN_PROGRESS) return;
  REPLAY_IN_PROGRESS = true;
  const endStep = B,
    res = $('#cbResult'),
    isSlow = RM || AUTO ? 0.2 : 1;
  try {
    res.hidden = true;
    __set_B(Object.assign(JSON.parse(R.best.avant), { over: null }));
    ui.busy = true;
    buildBoard();
    renderAll();
    log(`Rediffusion : ${R.best.label}`, 'arn');
    await wait(900 * isSlow);
    __set_B(Object.assign(JSON.parse(R.best.apres), { over: null }));
    renderAll();
    playEv(R.best.ev);
    await wait(3200 * isSlow);
  } finally {
    __set_B(endStep);
    ui.busy = false;
    buildBoard();
    renderAll();
    res.hidden = false;
    REPLAY_IN_PROGRESS = false;
  }
}


/** The Dissonance battles to place after badge n (declared function, no constant: safe at load time). */
export function dissonanceAfter(n) {
  if (!isCamp()) return [];
  return { 1: ['td1'], 3: ['td2'], 5: ['td3'], 7: ['td4'] }[n] || [];
}

/* =====================================================================
   1. Calendar events
   ===================================================================== */
const SEASONS = {
  halloween: {
    n: 'Nuit des Spectres',
    d: 'Les Pokémon Spectre, Ténèbres et Poison sortent des hautes herbes, la nuit tombe sur les combats sauvages, et chaque capture de ces types rapporte 1 Éclat.',
    types: ['Spectre', 'Ténèbres', 'Poison'],
    nuit: true,
    cadeau: { hyper: 3 },
    c: '#8a5cf6'
  },
  hiver: {
    n: 'Givre de décembre',
    d: 'Les Pokémon Glace et Eau sortent des hautes herbes, la grêle tombe sur les combats sauvages, et chaque capture de ces types rapporte 1 Éclat.',
    types: ['Glace', 'Eau'],
    wx: 'grele',
    cadeau: { super: 3, superpotion: 2 },
    c: '#8fd8ff'
  },
  printemps: {
    n: 'Floraison de printemps',
    d: 'Les Pokémon Plante, Fée et Insecte sortent des hautes herbes, et chaque capture de ces types rapporte 1 Éclat.',
    types: ['Plante', 'Fée', 'Insecte'],
    cadeau: { potion: 5 },
    c: '#7ac74c'
  },
  ete: {
    n: 'Canicule d’été',
    d: 'Les Pokémon Feu, Eau et Électrik sortent des hautes herbes, le soleil tape sur les combats sauvages, et chaque capture de ces types rapporte 1 Éclat.',
    types: ['Feu', 'Eau', 'Électrik'],
    wx: 'soleil',
    cadeau: { super: 5 },
    c: '#ee8130'
  },
  weekend: {
    n: 'Week-end chromatique',
    d: 'Le samedi et le dimanche, les Pokémon chromatiques sont deux fois plus fréquents.',
    types: [],
    shiny: 2,
    c: '#ffd75e'
  }
};


const season = () => SEASONS[seasonOf()] || null;


const giftKey = () => `${seasonOf()}-${new Date().getFullYear()}`;

export const dissonanceOf = k => DISSONANCE.find(T => T.k === k) || null;

// Instructions run at startup, in the original order (see index.js).
export function __init() {

document.addEventListener('click', e => {
  if (e.target.closest('[data-cadeau]')) takeGift();
});


/* =====================================================================
   2. Best-move replay
   ===================================================================== */
REPLAYS = new WeakMap();


REPLAY_IN_PROGRESS = false;


document.addEventListener('click', e => {
  if (e.target.closest('[data-rediff]')) rebroadcast();
});


/* =====================================================================
   3. Team Dissonance
   ===================================================================== */
DISSONANCE = [
  {
    k: 'td1',
    after: 1,
    n: 'Sbires de la Dissonance',
    who: 'Sbires de la Dissonance',
    pl: true,
    t: 'les petites mains de la Team Dissonance',
    lv: 16,
    hb: 6,
    pb: 1,
    time: 'nuit',
    bio: 'gue',
    at: 'Poison',
    water: ['5,0'],
    rock: ['3,4'],
    foes: [
      ['nosferapti', [6, 1]],
      ['fantominus', [6, 3], { mv: ['picots', 'lechouille'] }],
      ['malosse', [7, 4]]
    ],
    rew: [400, 3],
    q: 'Hé, toi ! Cette lueur, quand tes Pokémon s’éveillent… La Dissonance va l’éteindre. Écarte-toi.',
    w: 'Pff… Le chef ne va pas aimer ça.',
    l: 'Rentre chez toi. La Résonance, c’est fini.',
    d: 'Des Sbires en uniforme gris rôdent sur la route. Ils parlent d’« éteindre la Résonance ». Ils sèment des Picots.'
  },
  {
    k: 'td2',
    after: 3,
    n: 'Admin Vesper',
    who: 'Vesper',
    t: 'Admin de la Team Dissonance, la voix de l’ombre',
    lv: 26,
    hb: 12,
    pb: 2,
    time: 'nuit',
    bio: 'tour',
    at: 'Spectre',
    mut: 'eclipse',
    water: [],
    rock: ['3,1', '3,4'],
    foes: [
      ['spectrum', [6, 2]],
      ['nosferalto', [7, 1]],
      ['noctali', [6, 4]],
      ['fantominus', [7, 3], { mv: ['toilegluante', 'lechouille'] }]
    ],
    rew: [900, 6],
    q: 'La nuit, on n’entend plus rien. Ni les cris, ni la Résonance. Restons dans le noir, veux-tu ?',
    w: 'Tu brilles trop… Orphée saura te faire taire.',
    l: 'Chut. Écoute le silence.',
    d: 'Vesper a plongé la vieille tour dans une nuit sans fin : Spectre et Ténèbres y sont plus forts, et vos tirs portent moins loin.'
  },
  {
    k: 'td3',
    after: 5,
    n: 'Admin Cobalt',
    who: 'Cobalt',
    t: 'Admin de la Team Dissonance, l’ingénieur',
    lv: 34,
    hb: 18,
    pb: 3,
    time: 'jour',
    bio: 'ligue',
    at: 'Acier',
    mut: 'champ',
    water: [],
    rock: ['3,2'],
    foes: [
      ['magneton', [6, 2]],
      ['steelix', [7, 1]],
      ['cizayox', [6, 4]],
      ['magneti', [7, 3], { mv: ['piegederoc', 'eclair'] }]
    ],
    rew: [1400, 10],
    q: 'J’ai miné tout le plateau. Chaque pas que tu feras, je l’ai déjà calculé.',
    w: 'Impossible… mes calculs étaient justes. C’est ta Résonance qui fausse tout.',
    l: 'Prévisible. Comme une machine.',
    d: 'Cobalt a truffé son laboratoire de pièges qui touchent tout le monde. Regardez où vous mettez les pieds.'
  },
  {
    k: 'td4',
    after: 7,
    n: 'Orphée Valcourt',
    who: 'Orphée Valcourt',
    t: 'chef de la Team Dissonance',
    lv: 42,
    hb: 26,
    pb: 4,
    time: 'nuit',
    bio: 'arene',
    at: 'Ténèbres',
    mut: 'verre',
    water: ['4,0', '4,5'],
    rock: ['3,2', '3,3'],
    foes: [
      ['tyranocif', [6, 2], { boss: true, hb: 60, pb: 6 }],
      ['ectoplasma', [7, 1]],
      ['demolosse', [6, 4]],
      ['magneton', [7, 3]],
      ['nostenfer', [7, 5]]
    ],
    rew: [2500, 20],
    q: 'La Résonance enchaîne les Pokémon aux humains. Je vais briser ce lien, pour eux. Montre-moi qu’il vaut la peine d’exister.',
    w: 'Alors ce lien… est réel. Garde-le. La Dissonance se tait.',
    l: 'Tu vois ? Sans Résonance, il ne reste que le silence.',
    d: 'Le QG de la Dissonance. Orphée a réglé l’arène en « Canons de verre » : chaque coup compte double… pour tout le monde.'
  }
].filter(T => T.foes.every(([id]) => BY[id]));


DISSONANCE.forEach((T, i) => {
  T.foes.forEach(([, , x]) => x && x.mv && (x.mv = x.mv.filter(m => MV[m])));
  SCEN[T.k] = {
    n: T.n,
    lvl: `Team Dissonance · combat ${i + 1} sur 4`,
    lim: 11,
    time: T.time,
    bio: T.bio,
    dissonance: i + 1,
    after: T.after,
    style: i === 3 ? 'boss' : null,
    at: T.at,
    mut: T.mut || null,
    water: T.water,
    rock: T.rock,
    hb: T.hb,
    pb: T.pb,
    lv: T.lv,
    d: T.d,
    foes: T.foes
  };
  OBST[T.k] = i === 0 ? { grass: ['2,2', '3,2', '2,3'] } : {};
});


HOOKS.progres.push((S, rew, win) => {
  const D = SCEN[S.sc] || {},
    o = [0, 0];
  // season: captures of the season's types
  const s = season();
  if (s && s.types.length && rew.caught && rew.caught.length) {
    const n = rew.caught.filter(c => BY[c.id] && BY[c.id].t.some(t => s.types.includes(t))).length;
    if (n) {
      o[1] += n;
      rew.saison = n;
    }
  }
  // the Dissonance
  if (win && D.dissonance && (PROFILE.dissonance || 0) < D.dissonance) {
    PROFILE.dissonance = D.dissonance;
    const T = DISSONANCE[D.dissonance - 1];
    o[0] += T.rew[0];
    o[1] += T.rew[1];
    rew.dissonance = D.dissonance;
  }
  return o[0] || o[1] ? o : null;
});


HOOKS.resultat.push(r => {
  const o = [];
  if (r.saison)
    {o.push(`<div class="res-l"><h4>${season() ? season().n : 'Saison'}</h4><div class="rl"><span>Capture de saison : +${r.saison} Éclat${r.saison > 1 ? 's' : ''}</span><b>✦</b></div></div>`);}
  if (r.dissonance) {
    const T = DISSONANCE[r.dissonance - 1];
    o.push(
      `<div class="res-l"><h4>Team Dissonance</h4><div class="rl"><span>${T.who} ${T.pl ? 'sont battus' : 'est battu'} (${r.dissonance} / 4). « ${T.w} »${r.dissonance === 4 ? ' La Team Dissonance est dissoute.' : ''}</span><b>${r.dissonance} / 4</b></div></div>`
    );
  }
  const R = B && REPLAYS.get(B);
  if (R && R.best)
    {o.push(
      `<div class="res-l"><h4>Meilleur coup</h4><div class="rl rd"><span><b>${R.best.label}</b>${R.best.det ? ` · ${R.best.det}` : ''}</span><button type="button" class="b b-sm" data-rediff>Revoir</button></div></div>`
    );}
  return o.join('');
});


// the season shows up in wild battles
HOOKS.creation.push(S => {
  const s = season();
  if (!s || S.sc !== 'sauvage') return;
  if (s.wx && !S.wx) S.wx = { k: s.wx, n: 5 };
  if (s.nuit) {
    S.time = 'nuit';
    if (S.cyc && !S.cyc.fige) S.cyc = { ph: 'nuit', n: 0 };
  }
});
}
