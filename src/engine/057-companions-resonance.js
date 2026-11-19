/* Original section: v4.17-01-compagnons-et-resonance.js */

import { BY, MON, SCEN } from './009-pokemon.js';
import { BUDGET } from './010-in-battle-evolution.js';
import { PROFILE, isCamp } from './011-game-state.js';
import { RC } from './012-recruits-roles-synergies.js';
import { $, medal, toast } from './014-utils.js';
import { HOOKS } from './015-hooks.js';
import { squad, vBonus } from './020-team-cards.js';
import { brWeapon466, brBoss466 } from './097-boss-rush-relics.js';
import { EMAX, byUid, endStep, hasNx, heal, say } from './021-combat-engine.js';
import {
  B,
  backToPrep,
  battleOpts,
  cinematic,
  clearAim,
  enPips,
  finish,
  goFight,
  launch,
  renderAll,
  scSel,
  ui,
} from './024-combat-ui.js';
import { esc, queueSave } from './025-saves.js';
import { sfx, vibe } from './026-campaign-tutorial-sound.js';
import { playEv } from './028-move-effects.js';
import { AUTO, leaderOf } from './030-prestige-staging.js';
import { PROF_AV, avatar } from './031-home-journey.js';
import { SHOP, bagN, today } from './032-v4-foundation.js';
import { renderWallet } from './035-interface.js';
import { PL, placeName } from './037-map.js';
import { isShinyOwned } from './043-adventure-plus.js';
import { DAMAGE_PROVIDERS } from './044-tactical-engine.js';
import { MACHINES } from './045-tms-hms.js';
import { ACHIEVEMENTS, teamSize } from './048-replayability.js';
import { renderCampBase } from './049-identity.js';
import { hasXp } from './053-resonance.js';
import { regionJ415, routeName } from './054-johto.js';
import {
  ROAM,
  friendBuild416,
  roamActive416,
  roamState416,
  roamLeg416,
  roamOk416,
  scoreOf416,
} from './055-living-johto.js';
import { regionH419 } from './059-hoenn.js';
import { poolRegion421 } from './061-catch-anywhere.js';
import { who429 } from './064-quality.js';
import { campOk430 } from './065-camp-tactics.js';
import { refreshHome } from '../screens/home/homeStore.js';
import { paintOverlay } from '../screens/overlays/dialogsStore.js';

export let SCN;
let POT_I;
export { POTAGER, sprout417, POT_I }; // read by the Camp Garden (src/screens/camp)
export function __set_SCN(v) {
  return (SCN = v);
}

/* =====================================================================
   v4.17: companions and Resonance
   1. Resonant Form: once per battle, a final-stage Pokémon whose gauge
      is full enters resonance for 3 rounds (+2 Power, +1 Movement,
      +20 % damage, statuses cleared at the end of the round).
      Masters (Champion, Johto Master) and your friends' teams
      can use it too.
   2. Companion Pokémon: it waits for you on the Home screen, its affection
      grows with your battles and grants bonuses.
   3. Pokégear: the daily radio (roaming beasts, Dominant sighted, weather,
      tip); its announcements really change the day's gameplay.
      Story scenes: dialogues before the big Johto battles.
   4. Garden: three berry plots at the Camp (Campaign).
   5. Friends tournament: your friends' teams back to back, no healing.
   ===================================================================== */

/* ---------- profile (declared functions: called as soon as the file loads) ---------- */
export function V417_0() {
  return {
    comp: { id: '', aff: 0, j: '' },
    scenes: {},
    garden: [null, null, null],
    watered: '',
    tournoi: { run: null, best: 0, winCount: 0 },
  };
}

export function v417Clean(p) {
  const o = V417_0();
  if (!p || typeof p !== 'object') {
    return o;
  }
  const c = p.comp;
  if (c && typeof c === 'object') {
    if (BY[c.id]) {
      o.comp.id = c.id;
    }
    if (Number.isFinite(c.aff)) {
      o.comp.aff = Math.max(0, Math.min(255, Math.floor(c.aff)));
    }
    if (typeof c.j === 'string' && /^\d{4}-\d\d-\d\d$/.test(c.j)) {
      o.comp.j = c.j;
    }
  }
  if (p.scenes && typeof p.scenes === 'object') {
    for (const k in p.scenes) {
      if (/^[a-z0-9]{1,12}$/.test(k) && p.scenes[k]) {
        o.scenes[k] = 1;
      }
    }
  }
  if (Array.isArray(p.garden)) {
    o.garden = [0, 1, 2].map(i => {
      const x = p.garden[i];
      return x && POTAGER[x.g] && Number.isFinite(x.fin) ? { g: x.g, fin: Math.max(0, Math.floor(x.fin)) } : null;
    });
  }
  if (typeof p.watered === 'string' && /^\d{4}-\d\d-\d\d$/.test(p.watered)) {
    o.watered = p.watered;
  }
  const t = p.tournoi;
  if (t && typeof t === 'object') {
    if (Number.isFinite(t.best)) {
      o.tournoi.best = Math.max(0, Math.min(12, Math.floor(t.best)));
    }
    if (Number.isFinite(t.winCount)) {
      o.tournoi.winCount = Math.max(0, Math.min(999, Math.floor(t.winCount)));
    }
    const r = t.run;
    if (r && Array.isArray(r.order) && Array.isArray(r.team) && Number.isFinite(r.i)) {
      const team = r.team.filter(id => BY[id]).slice(0, 4),
        ordering = r.order.filter(id => typeof id === 'string' && /^[a-z0-9]{6,12}$/.test(id)).slice(0, 5);
      if (team.length && ordering.length && r.i >= 0 && r.i < ordering.length) {
        const hp = {};
        if (r.hp && typeof r.hp === 'object') {
          for (const k in r.hp) {
            if (BY[k] && Number.isFinite(r.hp[k])) {
              hp[k] = Math.max(0, Math.min(1, r.hp[k]));
            }
          }
        }
        o.tournoi.run = { team, order: ordering, i: Math.floor(r.i), hp };
      }
    }
  }
  return o;
}

/** Can an ally aim for the Resonant Form (final stage, not a legend, not yet used)? */
export function resoCand417(S, u) {
  return !!(
    S &&
    u &&
    u.side === 'a' &&
    !u.ko &&
    !hasNx(u) &&
    !(BY[u.id] && (BY[u.id].leg || BY[u.id].isEnemy)) &&
    !u.seg &&
    !u.colossus &&
    !S.resonance417
  );
}

function canResonance417(S, u) {
  return !!(resoCand417(S, u) && S.phase === 'player' && !u.sn && u.en >= EMAX && S.voice >= 1);
}

function enterResonance417(S, u, ev, strongSpot) {
  u.resonant = RESO_TURNS;
  u.pb = (u.pb || 0) + (strongSpot ? 2 : 1);
  u.resonancePb = strongSpot ? 2 : 1;
  const h = Math.max(1, Math.round(u.mhp * (strongSpot ? 0.2 : 0.1)));
  heal(S, u, h, ev);
  u.badge = null;
  u.skip = 0;
  u.burn = 0;
  u.web = 0;
  u.root = 0;
  ev.push({ e: 'reso417', u: u.uid });
  say(ev, `${u.n} entre en Forme Résonante !`);
}

/** The player triggers the Resonant Form: 1 Voice and the whole gauge; the action stays free. */
function pReso417(S, u) {
  if (!canResonance417(S, u)) {
    return null;
  }
  const ev = [];
  S.voice -= 1;
  S.stats.voice += 1;
  S.resonance417 = u.uid;
  S.stats.resonant = (S.stats.resonant || 0) + 1;
  u.en = 0;
  enterResonance417(S, u, ev, true);
  return endStep(S, ev);
}

/** Masters and your friends' teams use it too, once, when their best Pokémon starts to fade. */
function resoOpponent417(S, ev) {
  const D = SCEN[S.sc] || {};
  if (S.resonance417e || !(D.champ || D.jfinal || D.hfinal || D.ami)) {
    return;
  }
  const e = S.units
    .filter(x => x.side === 'e' && !x.ko && !x.seg && !hasNx(x) && x.hp <= x.mhp * 0.5)
    .sort((a, b) => b.mhp - a.mhp)[0];
  if (!e) {
    return;
  }
  S.resonance417e = e.uid;
  enterResonance417(S, e, ev, false);
}

/** The battle panel block. */
export function resoBlock417(u, gauge) {
  if (!B || u.side !== 'a' || hasNx(u)) {
    return '';
  }
  if (u.resonant > 0) {
    return `<div class="bp-en bp-fres full"><div class="en-h"><span class="lbl-s">Forme Résonante</span><b class="fres-n">${u.resonant} manche${u.resonant > 1 ? 's' : ''}</b></div><p class="bp-hint">+2 Puissance, +1 Mouvement, +20 % de dégâts, entraves dissipées en fin de manche.</p></div>`;
  }
  if (!resoCand417(B, u)) {
    return '';
  }
  const ok = canResonance417(B, u),
    why =
      u.en < EMAX
        ? `Encore ${EMAX - u.en} losange${EMAX - u.en > 1 ? 's' : ''}`
        : u.sn
          ? 'Immobilisé cette manche'
          : B.voice < 1
            ? 'Plus de Voix'
            : 'Prêt · une fois par combat';
  return `${gauge ? `<div class="bp-en${u.en >= EMAX ? ' full' : ''}"><div class="en-h"><span class="lbl-s">Résonance</span>${enPips(u.en, 'lg')}</div></div>` : ''}<button type="button" class="evb fres-b" data-reso417 ${ok ? '' : 'disabled'}><span class="evb-m fres-m"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l2.6 6.4L21 9l-5 4.4 1.6 6.6L12 16.6 6.4 20 8 13.4 3 9l6.4-.6Z" fill="currentColor"/></svg></span><span><b>Forme Résonante</b><em>${why}</em></span><span class="evb-c">1 Voix<br>+ jauge</span></button>`;
}

export function companionGain417(n) {
  const c = PROFILE.comp;
  if (!c || !c.id) {
    return 0;
  }
  const previous = hearts417(c.aff);
  c.aff = Math.min(255, (c.aff || 0) + n);
  return hearts417(c.aff) > previous ? hearts417(c.aff) : 0;
}

/** The Home screen companion (#v4Comp, rendered by src/screens/home/Companion.jsx). */
export function companionData417() {
  const id = companionId417();
  if (!id) {
    return null;
  }
  const m = BY[id],
    a = PROFILE.comp.aff || 0,
    h = hearts417(a);
  return {
    m,
    h,
    pr: h >= 5 ? 100 : Math.round(((a - (AFF_T[h - 1] || 0)) / (AFF_T[h] - (AFF_T[h - 1] || 0))) * 100),
    petting: PROFILE.comp.j === today(),
    mood: COMP_MOOD[h].replace('{n}', m.n),
    sh: isShinyOwned(m.base),
    bonus:
      h >= 2
        ? COMP_BONUS.filter(([n]) => h >= n)
            .map(([, t]) => t)
            .join(' · ')
        : '',
  };
}

/* companion choice: rendered by React (src/screens/overlays/CompBox.jsx) */
export function renderCompBox417() {
  const L = MON.filter(
    m =>
      !m.isEnemy &&
      !m.leg &&
      PROFILE.box.includes(m.base) &&
      (m.st === 1 || (isCamp() && (PROFILE.forms || []).includes(m.id)))
  ).slice(0, 80);
  paintOverlay('comp', { L: L.map(m => m.id), cur: companionId417(), bonus: COMP_BONUS });
}

/* =====================================================================
   3. Pokégear (daily radio) and story scenes
   ===================================================================== */
export function seed417(sel) {
  let h = 11;
  for (const ch of today() + sel) {
    h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  }
  return h;
}

/** The Dominant species sighted today (depending on the displayed region). */
export function domDay417() {
  const pool = poolRegion421(); // the sighted Dominant lives in the displayed region (v4.21)
  return pool.length ? pool[seed417('dom' + (regionH419() ? 'h' : regionJ415() ? 'j' : 'k')) % pool.length].id : null;
}

/** "près de l’Arène Vol" (near the Flying Gym), "près de la Route 32" (near Route 32), "près du Lac Colère" (near Lake of Rage). */
export function ofPlace417(n) {
  if (/^(Lac|Plateau|Puits|Relais)\b/.test(n)) {
    return 'du ' + n;
  }
  if (/^(Route|Tour|Antenne)\b/.test(n)) {
    return 'de la ' + n;
  }
  if (/^[AEÉÈIOUY]/i.test(n)) {
    return 'de l’' + n;
  }
  return 'de ' + n;
}

/** The Pokégear lines (#v4Radio on the Home screen, rendered by src/screens/home/Footer.jsx). */
export function radio417() {
  const L = [],
    d = domDay417(),
    w = weatherDay417();
  if (roamActive416()) {
    const b = ROAM.filter(id => !roamOk416(id)).map(
      id => `${roamLeg416(id).n} près ${ofPlace417(placeName(PL[roamState416(id).at]))}`
    );
    if (b.length) {
      L.push(['Bêtes errantes', `Aperçus ce matin : ${b.join(', ')}.`, 'johto']);
    }
  }
  if (d) {
    L.push([
      'Dominant signalé',
      `Un ${BY[d].n} Dominant rôderait sur la ${routeName()}. Il y est plus fréquent aujourd’hui, surtout la nuit.`,
      'herbes',
    ]);
  }
  L.push([
    'Météo',
    w
      ? `${WXN417[w]} sur les hautes herbes aujourd’hui : les combats sauvages commencent sous ${w === 'soleil' ? 'le soleil' : w === 'pluie' ? 'la pluie' : w === 'sable' ? 'le sable' : 'la grêle'}.`
      : 'Temps calme sur les hautes herbes aujourd’hui.',
    null,
  ]);
  L.push(['Le conseil du Prof. Sorbier', tip417(), null]);
  return L;
}

function whoScene417(who, k) {
  if (who === 'prof') {
    return { n: 'Prof. Sorbier', av: PROF_AV };
  }
  if (who === 'orphee') {
    return { n: 'Orphée Valcourt', av: avatar('Orphée Valcourt', 'Ténèbres', 'sm') };
  }
  const q429 = who429(who); // Kael, Sirène, Vesper (v4.29)
  if (q429) {
    return q429;
  }
  const L = leaderOf(who) || leaderOf(k);
  const S = SCEN[who] || SCEN[k] || {};
  return L ? { n: L.n, av: avatar(L.n, S.at || 'Normal', 'sm') } : { n: '…', av: PROF_AV };
}

export function scene417(k, force) {
  const c = sceneKey417(k),
    L = SCENES[c];
  if (!L || (PROFILE.scenes && PROFILE.scenes[c]) || (!force && AUTO)) {
    return false;
  } // no scene during automated tests
  SCN = { k, c, i: 0, L };
  renderScene417();
  $('#scene417').hidden = false;
  return true;
}

export function renderScene417() {
  if (!SCN) {
    return;
  }
  const [who, txt] = SCN.L[SCN.i],
    q = whoScene417(who, SCN.k),
    last = SCN.i === SCN.L.length - 1;
  // rendered by src/screens/overlays/Scene417.jsx
  paintOverlay('scene', {
    av: q.av,
    n: q.n,
    txt,
    i: SCN.i,
    nb: SCN.L.length,
    suite: last ? (SCN.apres ? 'Continuer' : 'Au combat !') : 'Suite',
  });
}

function endScene417() {
  if (!SCN) {
    return;
  }
  PROFILE.scenes = PROFILE.scenes || {};
  PROFILE.scenes[SCN.c] = 1;
  const ap = SCN.apres;
  SCN = null;
  $('#scene417').hidden = true;
  queueSave();
  if (!ap) {
    launch();
  } // a post-battle scene triggers nothing else (v4.29)
}

function plant417(i, g) {
  const G = POTAGER[g];
  if (!campOk430() || !G || PROFILE.garden[i]) {
    return;
  }
  if (PROFILE.money < G.p) {
    return void toast('Pas assez de Pokédollars.');
  }
  PROFILE.money -= G.p;
  PROFILE.garden[i] = { g, fin: PROFILE.battles + G.duration };
  sfx('ui');
  toast(`${G.n} plantée : récolte dans ${G.duration} combats.`);
  queueSave();
  renderWallet();
  renderCampBase();
}

function harvest417(i) {
  const x = PROFILE.garden[i];
  if (!x || sprout417(x) > 0) {
    return;
  }
  const add = (k, n) => SHOP[k] && (PROFILE.bag[k] = Math.min(99, bagN(k) + n));
  let txt = '';
  if (x.g === 'oran') {
    add('baieoran', 3);
    txt = '3 Baies Oran';
  } else if (x.g === 'sitrus') {
    if (!PROFILE.items.includes('sitrus')) {
      PROFILE.items.push('sitrus');
      txt = 'une Baie Sitrus (objet tenu)';
    } else {
      add('baieoran', 3);
      PROFILE.gems = Math.min(99999, PROFILE.gems + 2);
      txt = '3 Baies Oran et 2 Éclats';
    }
  } else {
    const r = Math.random(),
      cts = Object.keys(MACHINES).filter(k => SHOP[k] && !MACHINES[k].cs);
    if (r < 0.2 && cts.length) {
      const k = cts[Math.floor(Math.random() * cts.length)];
      add(k, 1);
      txt = SHOP[k].n;
    } else if (r < 0.6) {
      add('super', 3);
      txt = '3 Super Balls';
    } else {
      const g = 3 + Math.floor(Math.random() * 4);
      PROFILE.gems = Math.min(99999, PROFILE.gems + g);
      txt = `${g} Éclats`;
    }
  }
  PROFILE.garden[i] = null;
  sfx('ui');
  vibe(20);
  toast(`Récolte : ${txt} !`);
  queueSave();
  renderWallet();
  renderCampBase();
}

function water417() {
  if (!campOk430() || PROFILE.watered === today()) {
    return;
  }
  PROFILE.watered = today();
  let n = 0;
  PROFILE.garden.forEach(x => {
    if (x && sprout417(x) > 0) {
      x.fin--;
      n++;
    }
  });
  toast(n ? 'Le Potager est arrosé : une récolte plus tôt.' : 'Rien à arroser pour l’instant.');
  queueSave();
  renderCampBase();
}

// the base Camp Garden is rendered by React: src/screens/camp/CampBase.jsx

function tournamentOrder417() {
  return [...(PROFILE.friends || [])]
    .sort((a, b) => scoreOf416(a.s) - scoreOf416(b.s))
    .slice(0, 5)
    .map(a => a.id);
}

function tournamentLaunch417() {
  const ordering = tournamentOrder417();
  if (ordering.length < 2) {
    return void toast('Il faut au moins 2 amis pour un tournoi.');
  }
  if (!squad.length) {
    return void toast('Composez d’abord une équipe.');
  }
  PROFILE.tournoi.run = { team: squad.slice(0, teamSize()), order: ordering, i: 0, hp: {} };
  queueSave();
  tournamentBattle417();
}

function tournamentBattle417() {
  const run = tournamentRun417();
  if (!run) {
    return;
  }
  const i = (PROFILE.friends || []).findIndex(a => a.id === run.order[run.i]);
  if (i < 0) {
    PROFILE.tournoi.run = null;
    return void toast('Un ami a quitté le carnet : le tournoi s’arrête.');
  }
  friendBuild416(i);
  Object.assign(SCEN.ami, {
    tournoi: run.order[run.i],
    n: `Tournoi · ${PROFILE.friends[i].n}`,
    lvl: `Tournoi entre amis · combat ${run.i + 1} sur ${run.order.length}`,
  });
  SCEN.ami.d =
    `Combat ${run.i + 1} sur ${run.order.length}. Vos Pokémon gardent leurs PV d’un combat à l’autre, et ceux qui tombent ne reviennent pas. ` +
    SCEN.ami.d;
  if (B) {
    backToPrep();
  }
  goFight('ami');
}

/** The frozen tournament team (read when battles are launched). */
export function tournamentTeam417() {
  if (brBoss466(scSel)) {
    return { team: brWeapon466().team, voice: vBonus(), opts: battleOpts() };
  } // Boss Rush: frozen team
  const run = tournamentRun417(),
    D = SCEN.ami || {};
  if (scSel !== 'ami' || !run || D.tournoi !== run.order[run.i]) {
    return null;
  }
  const c = run.team.reduce((t, id) => t + RC(id), 0);
  return { team: run.team, voice: Math.min(2, Math.floor((BUDGET - c) / 4)), opts: battleOpts() };
}

export function tournamentHtml417() {
  const L = PROFILE.friends || [],
    run = tournamentRun417(),
    T = PROFILE.tournoi || {};
  if (L.length < 2) {
    return '';
  }
  if (run) {
    const A = L.find(a => a.id === run.order[run.i]);
    return `<div class="tn-c on"><span><b>Tournoi en cours · ${run.i} / ${run.order.length}</b><em>Prochain : ${A ? esc(A.n) : '?'} · votre équipe : ${run.team.map(id => BY[id].n).join(', ')}</em></span><span class="am-b"><button type="button" class="b b-sm b-gold" data-tournoi="suite">Continuer</button><button type="button" class="b b-sm b-ghost" data-tournoi="abandon">Abandonner</button></span></div>`;
  }
  return `<div class="tn-c"><span><b>Tournoi entre amis</b><em>${Math.min(5, L.length)} équipes à la suite, sans soin entre les combats. Record : ${T.best || 0}${T.winCount ? ` · remporté ${T.winCount} fois` : ''}.</em></span><button type="button" class="b b-sm b-gold" data-tournoi="lancer">Lancer</button></div>`;
}

/* =====================================================================
   1. Resonant Form
   ===================================================================== */
const RESO_TURNS = 3;

/* =====================================================================
   2. Companion Pokémon
   ===================================================================== */
const AFF_T = [10, 30, 60, 100, 150];

export const hearts417 = a => AFF_T.filter(t => a >= t).length;

export const companionId417 = () => {
  const c = PROFILE.comp;
  return c && BY[c.id] && PROFILE.box.includes(BY[c.id].base) ? c.id : ''; // Free mode too (v4.21)
};

const COMP_MOOD = [
  '{n} vous observe avec curiosité.',
  '{n} trottine à vos côtés.',
  '{n} se blottit contre vous.',
  '{n} rayonne de confiance.',
  '{n} vous suit partout, l’air fier.',
  '{n} et vous, vous vous comprenez sans un mot.',
];

const COMP_BONUS = [
  [2, 'Confiance', 'commence chaque combat avec 1 losange'],
  [3, 'Tenir bon', 'survit une fois à un coup fatal avec 1 PV'],
  [4, 'Complicité', '+10 % de dégâts'],
  [5, 'Lien parfait', 'se libère seul de ses statuts en fin de manche'],
];

const WEATHER_J = [null, 'pluie', 'soleil', null, 'sable', 'grele', null];

export const weatherDay417 = () => WEATHER_J[seed417('wx') % WEATHER_J.length];

const TIPS = [
  'Une case Trempée et une attaque Électrik : Court-circuit. Sortez vos Pokémon de l’eau avant de frapper !',
  'Deux coups sur la même cible dans la même manche déclenchent la Résonance : ×1,5 sur le second.',
  'Trois rangs différents dans l’équipe (Faible, Moyen, Fort…) : l’Harmonie offre 1 losange à chacun.',
  'La Forme Résonante ne coûte pas l’action : déclenchez-la, puis attaquez dans la foulée.',
  'Un Pokémon au palier Duo avec un autre débloque une technique combinée : 2 Voix, deux attaques.',
  'Les bêtes errantes gardent leurs blessures : même une fuite vous rapproche du but.',
  'La nuit, les Pokémon Dominants sont plus fréquents dans les hautes herbes.',
  'L’Esquive coûte 1 Voix et ne gaspille pas l’action : parfait pour sortir d’une zone dangereuse.',
  'Un compagnon à 3 cœurs encaisse un coup fatal avec 1 PV : mettez-le en première ligne.',
  'Les baies du Potager poussent plus vite si vous arrosez chaque jour.',
];

const tip417 = () => TIPS[seed417('tip') % TIPS.length];

const WXN417 = { pluie: 'Pluie', soleil: 'Grand soleil', sable: 'Tempête de sable', grele: 'Grêle' };

/* ---------- story scenes ---------- */
export const SCENES = {
  j1: [
    ['prof', 'Bienvenue à Johto ! Huit nouvelles arènes, et des Pokémon que vous n’avez jamais vus.'],
    ['prof', 'Votre première adversaire, Zéphyrine Altair, se bat avec le vent. Restez près des rochers.'],
    ['j1', 'Le vent ne se bat pas. Il pousse, et il attend que vous tombiez.'],
  ],
  jd1: [
    ['prof', 'Des ondes étranges brouillent la Route 32… On dirait la Team Dissonance. Mais Orphée l’avait dissoute !'],
    ['jd1', 'La Dissonance, dissoute ? Elle a juste changé de chef. Cobalt nous a promis une Résonance qui obéit.'],
    ['prof', 'Leur brouilleur aspire vos losanges. Ne les laissez pas s’accumuler sur un seul Pokémon !'],
  ],
  jd2: [
    ['jd2', 'Toi encore. Tu sens cette fumée ? La vieille tour brûle, et c’est moi qui l’ai voulu.'],
    ['prof', 'Vesper ! Sous cette tour dorment trois Pokémon légendaires… Le feu pourrait les réveiller !'],
    [
      'jd2',
      'Orphée nous avait dissous. Cobalt m’a rappelée. Je ne sais plus qui a raison… mais je sais encore me battre.',
    ],
  ],
  jd3: [
    ['jd3', 'L’Éveil ? Un caprice. Il faut attendre un lien, une émotion… Quelle perte de temps.'],
    ['jd3', 'Mon Antenne Rouge fait évoluer mes Pokémon quand je le décide. Regarde bien.'],
    ['prof', 'Frappez vite : à la fin des manches 1 et 3, ses Pokémon évolueront de force !'],
  ],
  jd4: [
    ['jd4', 'Le Relais est prêt. Une seule impulsion, et toute la Résonance de Johto se taira.'],
    ['orphee', 'Cobalt… La Dissonance devait s’éteindre avec moi. Arrête ça.'],
    ['jd4', 'Orphée a choisi le silence. Moi, je choisis le contrôle. Ta Résonance s’arrête ici, dans mon brouillage.'],
  ],
  jchamp: [
    ['prof', 'Les huit badges de Johto, et la Néo-Dissonance réduite au silence… Vous y êtes.'],
    ['jchamp', 'Kanto vous a couronné. Johto, lui, vous juge.'],
    [
      'prof',
      'Orion Céleste se sert de tout : notes de Résonance, attaques Expertes… et, s’il le faut, de la Forme Résonante.',
    ],
  ],
  roam: [
    [
      'prof',
      'Une silhouette immense bondit entre les arbres… Une bête légendaire, réveillée par l’incendie de la tour !',
    ],
    [
      'prof',
      'Elle s’enfuira au bout de 4 manches, mais ses blessures resteront. Usez-la, retrouvez-la, puis apaisez-la.',
    ],
  ],
};

const sceneKey417 = k => (SCEN[k] && SCEN[k].roam ? 'roam' : k);

/* =====================================================================
   4. The Camp Garden
   ===================================================================== */
const POTAGER = {
  oran: { n: 'Baie Oran', p: 200, duration: 3, d: '3 Baies Oran (soin en combat)' },
  sitrus: { n: 'Baie Sitrus', p: 600, duration: 5, d: 'une Baie Sitrus (objet tenu), sinon 3 Baies Oran et 2 Éclats' },
  mystere: { n: 'Graine mystère', p: 400, duration: 6, d: 'une surprise : Éclats, Balls ou une CT' },
};

const sprout417 = x => (x ? Math.max(0, x.fin - PROFILE.battles) : 0);

/* =====================================================================
   5. Friends tournament
   ===================================================================== */
const tournamentRun417 = () => (PROFILE.tournoi && PROFILE.tournoi.run) || null;

// Statements run at startup, in the original order (see index.js).
export function __init() {
  DAMAGE_PROVIDERS.push({
    id: 'formeresonante',
    provide: (c, { u }) => u.resonant > 0 && { mul: u.side === 'a' ? 1.2 : 1.1, labelText: 'Forme Résonante' },
  });

  HOOKS.beforeRoundEnd.push((S, ev) => {
    S.units.forEach(u => {
      if (u.ko || !(u.resonant > 0)) {
        return;
      }
      if (u.badge || u.burn || u.web || u.root) {
        u.badge = null;
        u.skip = 0;
        u.burn = 0;
        u.web = 0;
        u.root = 0;
        say(ev, `La résonance de ${u.n} dissipe ses entraves.`);
      }
      u.resonant--;
      if (u.resonant <= 0) {
        u.pb = Math.max(0, (u.pb || 0) - (u.resonancePb || 0));
        u.resonancePb = 0;
        say(ev, `La Forme Résonante de ${u.n} s’estompe.`);
      }
    });
    resoOpponent417(S, ev);
  });

  document.addEventListener('click', async e => {
    const b = e.target.closest('[data-reso417]');
    if (!b || !B) {
      return;
    }
    const u = ui.sel && byUid(B, ui.sel);
    if (!u || !canResonance417(B, u)) {
      return;
    }
    ui.undo = null;
    ui.busy = true;
    clearAim();
    renderAll();
    try {
      await cinematic(u.n, u.t, `${u.n} · Forme Résonante`, u.t, 'a', u.uid);
    } catch {
      /* Best effort: failure here is non-fatal. */
    }
    const ev = pReso417(B, u);
    ui.busy = false;
    renderAll();
    if (!ev) {
      return;
    }
    playEv(ev);
    if (B.over) {
      return void finish();
    }
    toast(`${u.n} résonne pour ${RESO_TURNS} manches : son action reste libre.`);
    renderAll();
  });

  HOOKS.combat.push(S => {
    if (S.fixed431) {
      return;
    } // fixed-rule battles: no companion bonus (v4.31)
    const id = companionId417();
    if (!id) {
      return;
    }
    const u = S.units.find(x => x.side === 'a' && x.sp === BY[id].base);
    if (!u) {
      return;
    }
    const h = hearts417(PROFILE.comp.aff);
    u.comp = h || 1;
    if (h >= 2 && (hasNx(u) || hasXp(u) || resoCand417(S, u))) {
      u.en = Math.max(u.en, 1);
    }
    if (h >= 3) {
      u.belt = true;
    }
  });

  DAMAGE_PROVIDERS.push({
    id: 'complicite',
    provide: (c, { u }) => u.comp >= 4 && { mul: 1.1, labelText: 'Complicité' },
  });

  HOOKS.beforeRoundEnd.push((S, ev) => {
    S.units.forEach(u => {
      if (u.ko || !(u.comp >= 5) || !(u.badge || u.burn || u.web || u.root)) {
        return;
      }
      u.badge = null;
      u.skip = 0;
      u.burn = 0;
      u.web = 0;
      u.root = 0;
      say(ev, `${u.n} se secoue pour vous : statuts dissipés.`);
    });
  });

  HOOKS.progress.push((S, rew, win) => {
    const id = companionId417(),
      D = SCEN[S.sc] || {};
    if (!id || D.tuto) {
      return null;
    }
    const u = S.units.find(x => x.side === 'a' && x.sp === BY[id].base);
    if (!u) {
      return null;
    }
    const n = win ? 3 : 2,
      up = companionGain417(n);
    rew.companion417 = { id, n, up };
    return null;
  });

  HOOKS.battleResult.push(r => {
    const c = r.companion417;
    if (!c) {
      return '';
    }
    const h = hearts417(PROFILE.comp.aff || 0),
      B2 = COMP_BONUS.find(([n]) => n === c.up);
    return `<div class="res-l"><h4>Compagnon</h4><div class="rl">${medal(BY[c.id].t)}<span>${BY[c.id].n} : +${c.n} d’affection${c.up ? ` · <b>${c.up} cœur${c.up > 1 ? 's' : ''} !</b>${B2 ? ` Nouveau bonus : ${B2[1]} (${B2[2]}).` : ''}` : ''}</span><b class="cp-h">${'♥'.repeat(h) || '♡'}</b></div></div>`;
  });

  // #compBox: rendered by React (src/screens/overlays/CompBox.jsx)

  document.addEventListener('click', e => {
    const b = e.target.closest('[data-comp]');
    if (b) {
      const k = b.dataset.comp;
      if (k === 'choisir') {
        renderCompBox417();
        $('#compBox').hidden = false;
      } else if (k === 'x') {
        $('#compBox').hidden = true;
      } else if (k === 'caresser' && companionId417() && PROFILE.comp.j !== today()) {
        PROFILE.comp.j = today();
        const up = companionGain417(3);
        sfx('ui');
        vibe(25);
        toast(
          up
            ? `${BY[companionId417()].n} est ravi : ${up} cœur${up > 1 ? 's' : ''} !`
            : `${BY[companionId417()].n} ferme les yeux de bonheur.`
        );
        queueSave();
        refreshHome();
      }
      return;
    }
    const p = e.target.closest('[data-comp-p]');
    if (p) {
      const id = p.dataset.compP;
      if (PROFILE.comp.id !== id) {
        PROFILE.comp = {
          id,
          aff:
            PROFILE.comp.id && BY[PROFILE.comp.id] && BY[PROFILE.comp.id].base === BY[id].base ? PROFILE.comp.aff : 0,
          j: PROFILE.comp.j,
        };
      }
      $('#compBox').hidden = true;
      toast(`${BY[id].n} devient votre compagnon.`);
      queueSave();
      refreshHome();
      return;
    }
    if (e.target.id === 'compBox') {
      $('#compBox').hidden = true;
    }
  });

  // today's weather spills into wild battles (unless the season already imposes one)
  HOOKS.creation.push(S => {
    if (S.sc !== 'sauvage' || S.wx) {
      return;
    }
    const w = weatherDay417();
    if (w) {
      S.wx = { k: w, n: 5 };
    }
  });

  // #scene417: rendered by React (src/screens/overlays/Scene417.jsx)

  SCN = null;

  document.addEventListener('click', e => {
    const b = e.target.closest('[data-scene]');
    if (!b && e.target.id !== 'scene417') {
      return;
    }
    if (!SCN) {
      return;
    }
    if (b && b.dataset.scene === 'passer') {
      return endScene417();
    }
    if (SCN.i < SCN.L.length - 1) {
      SCN.i++;
      renderScene417();
    } else {
      endScene417();
    }
  });

  POT_I = -1;

  document.addEventListener('click', e => {
    const i = e.target.closest('[data-pot-i]');
    if (i) {
      POT_I = +i.dataset.potI;
      renderCampBase();
      return;
    }
    const g = e.target.closest('[data-pot-g]');
    if (g && POT_I >= 0) {
      const k = POT_I;
      POT_I = -1;
      plant417(k, g.dataset.potG);
      return;
    }
    if (e.target.closest('[data-pot-x]')) {
      POT_I = -1;
      renderCampBase();
      return;
    }
    const r = e.target.closest('[data-pot-r]');
    if (r) {
      return void harvest417(+r.dataset.potR);
    }
    if (e.target.closest('[data-pot-eau]')) {
      water417();
    }
  });

  HOOKS.combat.push((S, opt, D0) => {
    const run = tournamentRun417();
    if (!D0 || !D0.tournoi || !run || D0.tournoi !== run.order[run.i]) {
      return;
    }
    S.tournament417 = D0.tournoi;
    S.units.forEach(u => {
      if (u.side !== 'a' || run.hp[u.sp] == null) {
        return;
      }
      const r = run.hp[u.sp];
      if (r <= 0) {
        u.hp = 0;
        u.ko = true;
      } else {
        u.hp = Math.max(1, Math.round(u.mhp * r));
      }
    });
  });

  HOOKS.progress.push((S, rew, win) => {
    const run = tournamentRun417();
    if (!S.tournament417 || !run || S.tournament417 !== run.order[run.i]) {
      return null;
    }
    if (SCEN.ami) {
      SCEN.ami.tournoi = null;
    } // "Rejouer" (Replay): an ordinary friendly challenge
    const T = PROFILE.tournoi;
    if (!win) {
      T.best = Math.max(T.best, run.i);
      T.run = null;
      rew.tournoi = { fin: true, i: run.i, n: run.order.length };
      return null;
    }
    S.units.filter(u => u.side === 'a').forEach(u => (run.hp[u.sp] = u.ko ? 0 : u.hp / u.mhp));
    run.i++;
    if (run.i >= run.order.length) {
      T.best = Math.max(T.best, run.order.length);
      T.winCount = (T.winCount || 0) + 1;
      T.run = null;
      rew.tournoi = { gagne: true, n: run.order.length };
      return [2000, 10];
    }
    const A = (PROFILE.friends || []).find(a => a.id === run.order[run.i]);
    rew.tournoi = { suite: true, i: run.i, n: run.order.length, displayName: A ? A.n : '' };
    return null;
  });

  HOOKS.battleResult.push(r => {
    const t = r.tournoi;
    if (!t) {
      return '';
    }
    if (t.gagne) {
      return `<div class="res-l"><h4>Tournoi entre amis</h4><div class="rl"><span><b>Tournoi remporté !</b> ${t.n} équipes battues à la suite : +10 Éclats.</span><b>🏆</b></div></div>`;
    }
    if (t.fin) {
      return `<div class="res-l"><h4>Tournoi entre amis</h4><div class="rl"><span>Le tournoi s’arrête au combat ${t.i + 1} sur ${t.n}. Record : ${PROFILE.tournoi.best} victoire${PROFILE.tournoi.best > 1 ? 's' : ''}.</span><b>${t.i} / ${t.n}</b></div></div>`;
    }
    return `<div class="res-l"><h4>Tournoi entre amis</h4><div class="rl"><span>Victoire ${t.i} sur ${t.n}. Prochain adversaire : ${esc(t.displayName)}. Vos PV restent tels quels.</span><button type="button" class="b b-sm b-gold" data-tournoi="suite">Combat suivant</button></div></div>`;
  });

  document.addEventListener('click', e => {
    const b = e.target.closest('[data-tournoi]');
    if (!b) {
      return;
    }
    const k = b.dataset.tournoi;
    if (k === 'lancer') {
      tournamentLaunch417();
    } else if (k === 'suite') {
      $('#cbResult').hidden = true;
      tournamentBattle417();
    } else if (k === 'abandon') {
      const run = tournamentRun417();
      if (run) {
        PROFILE.tournoi.best = Math.max(PROFILE.tournoi.best, run.i);
      }
      PROFILE.tournoi.run = null;
      queueSave();
      toast('Tournoi abandonné.');
      refreshHome();
    }
  });

  /* ---------- achievements ---------- */
  ACHIEVEMENTS.push(
    {
      id: 'resonant',
      n: 'Forme Résonante',
      d: 'Déclencher la Forme Résonante.',
      ok: c => (c.S.stats.resonant || 0) > 0,
    },
    {
      id: 'complice',
      n: 'Inséparables',
      d: 'Atteindre 5 cœurs avec votre compagnon.',
      t: 'Inséparables',
      ok: () => hearts417((PROFILE.comp || {}).aff || 0) >= 5,
    },
    {
      id: 'tournoi',
      n: 'Roi du tournoi',
      d: 'Remporter un tournoi entre amis.',
      t: 'Roi du tournoi',
      ok: () => ((PROFILE.tournoi || {}).winCount || 0) > 0,
    }
  );
}
