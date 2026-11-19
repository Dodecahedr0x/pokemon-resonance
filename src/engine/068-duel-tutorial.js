/* Original section: v4.33-01-duel-et-tutoriel.js */

import { BY, DEPLOY, MON, SCEN, familyOf } from './009-pokemon.js';
import { PROFILE } from './011-game-state.js';
import { synOf } from './012-recruits-roles-synergies.js';
import { $, RM, medal } from './014-utils.js';
import { tokCl } from '../screens/combat/board/boardStore.js';
import { HOOKS } from './015-hooks.js';
import { go } from './016-navigation.js';
import { BH, BW, K, P, byUid, damage, unitEffects433, endStep, rewardIn, hasNx, mkUnit, say, uk } from './021-combat-engine.js';
import { OBST, resolve } from './023-roles-synergies-obstacles.js';
import { B, L, __set_B, __set_scSel, autoSel, backToPrep, clearAim, endOfRound, finish, launch, log, renderAll, scSel, ui } from './024-combat-ui.js';
import { esc, queueSave } from './025-saves.js';
import { PREF } from './026-campaign-tutorial-sound.js';
import { playEv } from './028-move-effects.js';
import { openGuide } from './029-streamlined-guide.js';
import { AUTO, overlay, turnBanner } from './030-prestige-staging.js';
import { shut } from '../screens/overlays/tempStore.js';
import { V4 } from './032-v4-foundation.js';
import { unloadCharges } from './047-tactics.js';
import { hasXp, rankOfValue } from './053-resonance.js';
import { vigilHit420 } from './060-intense-combat.js';
import { dl428 } from './063-combat-catches-home.js';
import { DOCTRINES430 } from './065-camp-tactics.js';
import { CAMP_TABS431, PUZZLES431, MASTERY_THRESHOLD431, renderCampPage431 } from './066-tactical-challenges.js';

export let TUTORIAL_STEPS433;
let DUEL433, DUELCUR433, STMAX433;
export { TERR433, DUEL433, STMAX433, duelOrder433, duelNew433, duelStep433 }; // read by Camp › Duel (src/screens/camp)


/* =====================================================================
   v4.33
   1. Local 2-player duel (Camp › Duel): a draw of 10 to 12 Pokémon,
      one ban each, snake-draft picks, then a battle on the same
      phone. Each player directs their team in turn, with exactly the
      same rules: no items, natures or doctrines, symmetrical terrain.
      Each player has their own Voices, synergies, round chord and
      Resonant Form; burns, durations and Vigilance follow the turn of
      their owner, so that neither is advantaged.
   2. Full tutorial (Guide › Tutorial): one chapter per mechanic, from
      the basics to the duel, with a button to try it and progress saved.
   ===================================================================== */
export function V433_0() {
  return { duel433: { n: 0, h: [], noms: ['', ''] }, tuto433: [] };
}


export function v433Clean(p) {
  const o = V433_0();
  if (!p || typeof p !== 'object') return o;
  const d = p.duel433;
  if (d && typeof d === 'object') {
    o.duel433.n = Math.max(0, Math.min(99999, Math.floor(+d.n || 0)));
    if (Array.isArray(d.noms)) o.duel433.noms = [duelName433(d.noms[0]), duelName433(d.noms[1])];
    if (Array.isArray(d.h)) {
      o.duel433.h = d.h
        .filter(x => x && typeof x === 'object' && Array.isArray(x.t) && x.t.length === 2)
        .slice(-12)
        .map(x => ({
          d: typeof x.d === 'string' && /^\d{4}-\d\d-\d\d$/.test(x.d) ? x.d : '',
          n: [duelName433((x.n || [])[0]), duelName433((x.n || [])[1])],
          g: [0, 1, 2].includes(x.g) ? x.g : 0,
          r: Math.max(0, Math.min(30, Math.floor(+x.r || 0))),
          w: x.w === 'temps' || x.w === 'forfait' ? x.w : 'ko',
          t: x.t.map(team => (Array.isArray(team) ? team : []).filter(id => typeof id === 'string' && BY[id]).slice(0, 4))
        }));
    }
  }
  if (Array.isArray(p.tuto433)) o.tuto433 = [...new Set(p.tuto433.filter(k => typeof k === 'string' && TUTORIAL_STEPS433.some(c => c.k === k)))];
  return o;
}

 // the settings of the last duel started (rematch)

function duelOrder433(n) {
  const o = [
    { a: 'ban', j: 0 },
    { a: 'ban', j: 1 }
  ];
  const s = n === 3 ? [0, 1, 1, 0, 0, 1] : [0, 1, 1, 0, 0, 1, 1, 0];
  s.forEach(j => o.push({ a: 'pick', j }));
  return o;
}


function duelNames433() {
  const N = (PROFILE.duel433 && PROFILE.duel433.noms) || ['', ''];
  return [N[0] || duelName433(PROFILE.name) || 'Joueur 1', N[1] || 'Joueur 2'];
}


function duelNew433() {
  const prev = DUEL433 || {};
  DUEL433 = {
    e: 'reglages',
    noms: prev.noms || duelNames433(),
    mode: prev.mode || 'base',
    taille: prev.taille || 4,
    terrain: prev.terrain || 'arene',
    heure: prev.heure || 'jour',
    lim: prev.lim || 10,
    pool: [],
    pas: 0,
    bans: [[], []],
    picks: [[], []],
    sel: null
  };
  return DUEL433;
}


function shuffle433(list) {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}


/** The draw: entirely different families, in base or final form. */
function duelDraw433(C) {
  const bases = MON.filter(m => m.base === m.id && !m.leg && BY[m.id] && !BY[m.id].ennemi).map(m => m.id),
    n = C.taille * 2 + 4;
  C.pool = shuffle433(bases)
    .slice(0, n)
    .map(b => {
      if (C.mode !== 'final') return b;
      const endsList = familyOf(b).filter(x => !x.nx && BY[x.id]);
      return endsList.length ? endsList[Math.floor(Math.random() * endsList.length)].id : b;
    });
  C.e = 'draft';
  C.pas = 0;
  C.bans = [[], []];
  C.picks = [[], []];
  C.sel = null;
}


function duelStep433(C) {
  return duelOrder433(C.taille)[C.pas] || null;
}


function duelTake433(C, id) {
  const st = duelStep433(C);
  if (!st || !C.pool.includes(id) || C.bans.flat().includes(id) || C.picks.flat().includes(id)) return false;
  (st.a === 'ban' ? C.bans : C.picks)[st.j].push(id);
  C.pas++;
  C.sel = null;
  if (!duelStep433(C)) C.e = 'pret';
  return true;
}


function duelCancel433(C) {
  if (!C.pas) return false;
  C.pas--;
  const st = duelOrder433(C.taille)[C.pas];
  (st.a === 'ban' ? C.bans : C.picks)[st.j].pop();
  C.e = 'draft';
  C.sel = null;
  return true;
}


/* ---------- duel: the battle ---------- */
export function duelOpts433() {
  return { diff: 'normal', items: {}, fatigue: {}, links: {}, ordre: 'equipe', vivant: false, tactique: true, mut: null, doc430: '', fog431: false, defis: [], caracteres: false, desob: false, dojo: 0, apprises: {} };
}


function duelScene433(C) {
  const T = TERR433[C.terrain] || TERR433.arene,
    t2 = C.picks[1].slice(0, C.taille);
  return {
    D: {
      n: 'Duel local',
      lvl: `${C.noms[0]} contre ${C.noms[1]}`,
      lim: C.lim,
      time: C.heure === 'nuit' ? 'nuit' : 'jour',
      bio: T.bio,
      water: two433(T.water),
      rock: two433(T.rock),
      hb: 0,
      pb: 0,
      lv: 50,
      at: BY[t2[0]] ? BY[t2[0]].t[0] : 'Normal',
      catch: false,
      sansProgres431: 1,
      duel433: 1,
      d: `Duel local · ${T.n}`,
      t1: C.picks[0].slice(0, C.taille),
      noms: C.noms.slice(),
      foes: t2.map((id, i) => [id, posJ2433(i)])
    },
    O: { pil: two433(T.pil), grass: two433(T.grass), sand: two433(T.sand) }
  };
}


function launchDuel433(C) {
  if (!C || C.picks[0].length < C.taille || C.picks[1].length < C.taille) return;
  const X = duelScene433(C);
  SCEN.duel433 = X.D;
  OBST.duel433 = X.O;
  DUELCUR433 = JSON.parse(JSON.stringify(C));
  const P0 = (PROFILE.duel433 = PROFILE.duel433 || V433_0().duel433);
  P0.noms = C.noms.map(duelName433);
  queueSave();
  if (scSel !== 'duel433') launchDuel433.prev = scSel;
  __set_scSel('duel433');
  go('combat');
  launch();
}


/** Outside a duel: go back to the battle list, on the previous choice. */
function leaveDuel433() {
  const hp = launchDuel433.prev;
  __set_B(null);
  __set_scSel(hp && SCEN[hp] && !SCEN[hp].sansProgres431 ? hp : 'gue');
  backToPrep();
  V4.campTab = 'duel';
  go('camp');
}


/** Changes the active player: their Pokémon move to the "ally" side. */
function toggle433(S, j) {
  const D = S && S.duel433;
  if (!D || D.j === j) return;
  const a = D.j - 1,
    b = j - 1,
    sw = s => (s === 'a' ? 'e' : s === 'e' ? 'a' : s);
  PERSO433.forEach(k => {
    D.etat[a][k] = S[k] === undefined ? null : S[k];
    S[k] = D.etat[b][k] === undefined ? null : D.etat[b][k];
  });
  D.j = j;
  S.units.forEach(u => (u.side = u.j433 === j ? 'a' : 'e'));
  for (const k in S.tiles) {
    const t = S.tiles[k];
    if (t.trap && t.trap.side) t.trap.side = sw(t.trap.side);
  }
  (S.presc || []).forEach(p => (p.side = sw(p.side)));
  ['arriere', 'rune'].forEach(k => {
    if (S[k] && typeof S[k] === 'object') S[k] = { a: S[k].e || 0, e: S[k].a || 0 };
  });
  S.voix = S.vmax;
  S.phase = 'player';
}


/** Start of player j's round phase (their Pokémon are "allies"). */
function turnStart433(S, j, ev) {
  if (!S || !S.duel433 || S.over) return;
  if (j === 2) {
    // Player 2's burn, poison and durations: after Player 1's turn, like Player 1's after their own
    S.units.forEach(u => {
      if (!u.ko && u.j433 === 2) unitEffects433(S, u, ev);
    });
    if (S.syn && S.syn.includes('toxines')) {
      S.units.forEach(e => {
        if (!e.ko && e.side === 'e' && (e.root > 0 || e.web > 0 || e.badge === 'SOM')) {
          say(ev, `Toxines : ${e.n} s’affaiblit.`);
          damage(S, e, 3, ev, { ind: true });
        }
      });
    }
    endStep(S, ev);
    if (S.over) return;
  }
  if (S.round > 1) {
    S.units.forEach(u => {
      if (u.j433 === j && !u.ko) rewardIn(S, u, 1, ev);
    });
  }
  S.units.forEach(u => {
    if (u.ko || u.j433 !== j) return;
    u.done = false;
    u.sn = false;
    u.vigil = 0;
    const st = STUN433.includes(u.badge) && !u.bdgVu433;
    if (u.skip > 0 || st || u.perdu) {
      if (st || u.perdu) say(ev, `${u.n} ne peut pas agir ce tour.`);
      u.skip = 0;
      u.perdu = 0;
      u.acted = true;
      u.moved = true;
      u.sn = true;
      u.bdgVu433 = st ? 1 : 0;
    } else {
      u.acted = false;
      u.moved = false;
      u.badge = null;
      u.bdgVu433 = 0;
      if (u.force) {
        u.moved = true;
        say(ev, `${u.n} est troublé : il ne peut pas se déplacer ce tour.`);
      }
    }
    u.force = null;
    u.intent = null;
  });
}


export function duelPlan433(S, ev) {
  if (S.duel433.pret && S.round > 1) turnStart433(S, 1, ev);
}


/** Vigilance in a duel: the waiting player's sentinels strike the Pokémon that arrives. */
export function vigilDuel433(S, e, ev) {
  if (!e || e.ko || S.over || e.side !== 'a') return;
  const k = uk(e);
  for (const u of S.units) {
    if (u.side !== 'e' || u.ko || !u.vigil || STUN433.includes(u.badge)) continue;
    const m = vigilHit420(S, u, k);
    if (!m) continue;
    u.vigil = 0;
    S.stats.vigil = (S.stats.vigil || 0) + 1;
    say(ev, `Vigilance : ${u.n} intercepte ${e.n} avec ${m.n} !`);
    ev.push({ e: 'vigil420', u: u.uid, t: e.uid });
    resolve(S, u, m, k).forEach(x => ev.push(x));
    if (e.ko || S.over) return;
  }
}


/** "End of turn" in a duel: Player 1 hands over, Player 2 closes the round. */
export function duelPass433() {
  if (!B || !B.duel433) return false;
  if (ui.busy || B.over || B.phase !== 'player') return true;
  const S = B,
    D = S.duel433;
  Object.assign(ui, { undo: null, tile: null, selE: null, sel: null, mode: null, mi: null, pk: null, pv: null });
  clearAim();
  if (D.j === 1) {
    const ev = [];
    log(`${D.noms[0]} termine son tour.`, 'sys');
    D.dech = 2;
    unloadCharges(S, ev); // Player 2's charged attacks fire after Player 1's turn
    endStep(S, ev);
    if (!S.over) {
      toggle433(S, 2);
      turnStart433(S, 2, ev);
      endStep(S, ev);
    }
    renderAll();
    playEv(ev);
    if (S.over) {
      finish();
      return true;
    }
    autoSel();
    renderAll();
    relay433(2);
    return true;
  }
  log(`${D.noms[1]} termine son tour.`, 'sys');
  toggle433(S, 1);
  D.dech = 1;
  ui.busy = true;
  renderAll();
  setTimeout(() => {
    if (B !== S) return;
    endOfRound(S).then(ok => {
      if (ok && B === S && !S.over) relay433(1);
    });
  }, dl428(60, 160, 380));
  return true;
}


/** Pass-over screen: the phone changes hands. */
function relay433(j, force) {
  const D = B && B.duel433;
  if (!D) return;
  if ((AUTO && !force) || PREF.relais433 === false) {
    turnBanner('Manche ' + B.round, D.noms[j - 1]);
    return;
  }
  // rendered: src/screens/overlays/transients/Duel433.jsx
  const o = overlay('duel433r', {
    mode: 'relais',
    j,
    round: B.round,
    lim: B.lim,
    nom: D.noms[j - 1],
    sub: B.round === 1 ? `Passez le téléphone. Vos Pokémon sont cerclés ${j === 1 ? 'de bleu' : 'd’orange'}.` : 'Passez le téléphone, puis touchez le bouton.',
    s: [1, 2].map(x => ({ j: x, nom: D.noms[x - 1], pv: duelHp433(B, x), n: B.units.filter(u => u.j433 === x && !u.ko).length }))
  });
  const b = o.querySelector('[data-dr433="go"]');
  if (b) b.focus();
}


/** Share of a player's remaining HP, in %. */
function duelHp433(S, j) {
  const units = S.units.filter(u => u.j433 === j),
    m = units.reduce((s, u) => s + u.mhp, 0);
  return m ? Math.round((units.reduce((s, u) => s + (u.ko ? 0 : Math.max(0, u.hp)), 0) / m) * 100) : 0;
}


function duelWinner433(S) {
  if (S.forfait433) return 3 - S.forfait433;
  const v1 = S.units.some(u => u.j433 === 1 && !u.ko),
    v2 = S.units.some(u => u.j433 === 2 && !u.ko);
  if (v1 && !v2) return 1;
  if (v2 && !v1) return 2;
  if (!v1 && !v2) return 0;
  const p1 = duelHp433(S, 1),
    p2 = duelHp433(S, 2);
  return p1 === p2 ? 0 : p1 > p2 ? 1 : 2;
}


export function duelEnd433(S, rew) {
  const D = S.duel433,
    g = duelWinner433(S),
    w = S.forfait433 ? 'forfait' : S.units.some(u => u.j433 === 1 && !u.ko) && S.units.some(u => u.j433 === 2 && !u.ko) ? 'temps' : 'ko';
  D.g = g;
  D.w = w;
  S.over = 'win';
  const J0 = (S.stats && S.stats.j430) || { d: {}, t: {}, k: {} };
  rew.duel433 = {
    g,
    w,
    noms: D.noms.slice(),
    pv: [duelHp433(S, 1), duelHp433(S, 2)],
    rows: [1, 2].map(j =>
      S.units
        .filter(u => u.j433 === j)
        .map(u => ({ id: u.id, d: J0.d[u.uid] || 0, t: J0.t[u.uid] || 0, k: J0.k[u.uid] || 0, ko: u.ko ? 1 : 0 }))
    )
  };
  const P0 = (PROFILE.duel433 = PROFILE.duel433 || V433_0().duel433);
  P0.n = (P0.n || 0) + 1;
  P0.h = (P0.h || []).concat([{ d: new Date().toISOString().slice(0, 10), n: D.noms.slice(), g, r: S.round, w, t: [1, 2].map(j => S.units.filter(u => u.j433 === j).map(u => u.id)) }]).slice(-12);
  return [0, 0];
}


export function duelUnder433(S) {
  const D = S.duel433;
  if (!D) return '';
  if (D.w === 'forfait') return `${esc(D.noms[(S.forfait433 || 1) - 1])} a déclaré forfait.`;
  if (D.w === 'temps') return `Temps écoulé : ${esc(D.noms[0])} garde ${duelHp433(S, 1)} % de ses PV, ${esc(D.noms[1])} ${duelHp433(S, 2)} %.`;
  return D.g ? `Toute l’équipe de ${esc(D.noms[2 - D.g])} est K.O. en ${S.round} manche${S.round > 1 ? 's' : ''}.` : 'Les deux équipes tombent ensemble.';
}


/* rendering: player colors, end-of-turn button, phase */
export function afterRender433() {
  if (!B || !B.duel433) return;
  for (const id in L.u) {
    const T = L.u[id],
      u = byUid(B, id);
    if (!T || !u) continue;
    tokCl(T, 'dj1', u.j433 === 1); // token classes: Units.jsx
    tokCl(T, 'dj2', u.j433 === 2);
  }
  // plates (data-dj433), end-of-turn button, phase and player name: rendered by React (src/screens/combat/battle)
}


// the Camp › Duel tab (settings, draw, teams, history) is rendered by React: src/screens/camp/tabs/Duel.jsx


function duelRender433() {
  if (V4.campTab === 'duel') renderCampPage431();
}


// the full tutorial is rendered by the React Guide (Tutorial.jsx)

const duelName433 = x =>
  String(x == null ? '' : x)
    .replace(/[<>&"`]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 14);


/* ---------- 1. duel: symmetrical terrains ---------- */
// half board described, the other half mirrored (half-turn rotation: the hex grid is symmetrical under it)
const TERR433 = {
  arene: { n: 'Arène', bio: 'arene', pil: ['3,1'], sand: ['2,3'] },
  gue: { n: 'Gué', bio: 'gue', water: ['3,0', '3,3', '3,4'], grass: ['1,0'] },
  roche: { n: 'Rocaille', bio: 'roche', rock: ['3,2'], pil: ['2,0'], sand: ['2,4'] },
  herbes: { n: 'Hautes herbes', bio: 'gue', grass: ['2,1', '2,2', '3,4', '1,4'] },
  stade: { n: 'Stade', bio: 'ligue', pil: ['3,3'], grass: ['2,0'] }
};


const mirror433 = k => {
  const [c, r] = P(k);
  return K(BW - 1 - c, BH - 1 - r);
};


const two433 = keys => [...new Set([...(keys || []), ...(keys || []).map(mirror433)])];


const posJ2433 = i => [BW - 1 - DEPLOY[i][0], BH - 1 - DEPLOY[i][1]];


const PERSO433 = ['syn', 'harmonie', 'reso417', 'acc', 'relance', 'lastAtk'];


const STUN433 = ['SOM', 'GEL', 'PAR'];


export const duelLoad433 = (S, u) => !S.duel433 || u.j433 === S.duel433.dech;


export const duelTitle433 = S => {
  const D = S.duel433;
  return D && D.g ? `Victoire de ${esc(D.noms[D.g - 1])}` : 'Match nul';
};

// Statements run at startup, in the original order (see index.js).
export function __init() {

DUEL433 = null;

 // the current draw (in memory)
DUELCUR433 = null;


HOOKS.creation.push((S, opt, D0) => {
  if (!D0 || !D0.duel433) return;
  S.duel433 = { j: 1, noms: (D0.noms || ['Joueur 1', 'Joueur 2']).slice(0, 2), etat: [{}, {}], dech: 1, pret: 0, D: JSON.parse(JSON.stringify(D0)), O: JSON.parse(JSON.stringify(OBST.duel433 || {})) };
  S.units.forEach(u => (u.j433 = u.side === 'a' ? 1 : 2));
  S.jit = true;
  S.coop = 0;
  S.noCatch = true;
});


HOOKS.combat.push((S, opt, D0) => {
  if (!S.duel433) return;
  const D = S.duel433;
  // Player 2 is built exactly like Player 1: no HP or Power bonus
  S.units.forEach(u => {
    if (u.j433 !== 2) return;
    const n = mkUnit(u.id, 'a', u.pos, u.uid, D0);
    Object.keys(u).forEach(k => delete u[k]);
    Object.assign(u, n, { side: 'e', j433: 2 });
  });
  const p2 = S.units.filter(u => u.j433 === 2);
  let h2 = null;
  if (p2.length >= 3 && new Set(p2.map(rankOfValue)).size >= 3) {
    h2 = true;
    p2.forEach(u => {
      if (hasNx(u) || hasXp(u)) u.en = Math.max(u.en || 0, 1);
    });
  }
  D.etat[0] = { syn: S.syn || [], harmonie: S.harmonie || null, reso417: null, acc: null, relance: false, lastAtk: null };
  D.etat[1] = { syn: synOf(p2.map(u => u.id)).map(s => s.k), harmonie: h2, reso417: null, acc: null, relance: false, lastAtk: null };
  S.noCatch = true;
  D.pret = 1;
});


document.addEventListener('click', e => {
  const b = e.target.closest('[data-dr433]');
  if (!b) return;
  if (b.dataset.dr433 === 'go') {
    shut('duel433r');
    if (B && B.duel433) {
      turnBanner('Manche ' + B.round, B.duel433.noms[B.duel433.j - 1]);
      renderAll();
    }
    return;
  }
  if (b.dataset.dr433 === 'non') {
    shut('duel433r');
    return;
  }
  if (b.dataset.dr433 === 'forfait' && B && B.duel433 && !B.over) {
    shut('duel433r');
    B.forfait433 = B.duel433.j;
    B.over = 'win';
    log(`${B.duel433.noms[B.duel433.j - 1]} déclare forfait.`, 'sys');
    finish();
  }
});


// Forfeit: the opponent wins
document.addEventListener(
  'click',
  e => {
    if (!e.target.closest('#bQuit') || !B || !B.duel433) return;
    e.stopPropagation();
    if (ui.busy) return;
    if (B.over) return leaveDuel433();
    const D = B.duel433,
      j = D.j;
    overlay('duel433r', { mode: 'abandon', j, nom: D.noms[j - 1], autre: D.noms[2 - j] });
  },
  true
);


HOOKS.resultat.push(r => {
  const X = r && r.duel433;
  if (!X) return '';
  const mx = Math.max(1, ...X.rows.flat().map(x => x.d));
  return `<div class="res-l du433-r"><h4>Rapport du duel</h4><div class="du433-rg">${[0, 1]
    .map(
      i => `<div class="du433-rc dj${i + 1}${X.g === i + 1 ? ' g' : ''}"><b>${esc(X.noms[i])}</b><em>${X.pv[i]} % PV restants</em>${X.rows[i]
        .map(x => {
          const m = BY[x.id];
          return `<div class="du433-rl${x.ko ? ' ko' : ''}">${medal(m.t, 'xs')}<span>${m.n}</span><i style="--w:${Math.round((x.d / mx) * 100)}%"></i><small>${x.d}${x.k ? ` · ${x.k} K.O.` : ''}</small></div>`;
        })
        .join('')}</div>`
    )
    .join('')}</div><p class="rap430-l">Dégâts infligés et K.O. par Pokémon.</p></div>`;
});


// Play again → rematch (the other player starts); Change team → new duel
document.addEventListener(
  'click',
  e => {
    const b = e.target.closest('#cbResult [data-res]');
    if (!b || !B || !B.duel433) return;
    e.stopPropagation();
    $('#cbResult').hidden = true;
    if (b.dataset.res === 'again' && DUELCUR433) {
      const C = JSON.parse(JSON.stringify(DUELCUR433));
      C.noms.reverse();
      C.picks.reverse();
      C.bans.reverse();
      DUEL433 = C;
      launchDuel433(C);
      return;
    }
    duelNew433();
    leaveDuel433();
  },
  true
);


document.addEventListener('click', e => {
  const b = e.target.closest('[data-news="duel433"],[data-news="tuto433"]');
  if (!b) return;
  e.stopPropagation();
  if (b.dataset.news === 'duel433') {
    V4.campTab = 'duel';
    go('camp');
  } else openGuide('tuto433');
});


/* ---------- duel: the Camp screen ---------- */
STMAX433 = 5;


try {
  STMAX433 = Math.max(5, ...MON.map(m => Math.max(...m.s)));
} catch { /* Best effort: failure here is non-fatal. */ }


document.addEventListener('click', e => {
  const s = e.target.closest('[data-du433s]');
  if (s && DUEL433) {
    const k = s.dataset.du433s,
      v = s.dataset.v;
    DUEL433[k] = k === 'taille' ? (v === '3' ? 3 : 4) : v === 'final' ? 'final' : 'base';
    duelRender433();
    return;
  }
  const p = e.target.closest('[data-du433p]');
  if (p && DUEL433 && DUEL433.e === 'draft') {
    const id = p.dataset.du433p;
    DUEL433.sel = DUEL433.sel === id ? null : id;
    duelRender433();
    return;
  }
  const b = e.target.closest('[data-du433]');
  if (!b) return;
  const C = DUEL433 || duelNew433(),
    a = b.dataset.du433;
  if (a === 'tirer') {
    C.noms = C.noms.map((x, i) => duelName433(x) || 'Joueur ' + (i + 1));
    if (C.noms[0] === C.noms[1]) C.noms[1] += ' 2';
    duelDraw433(C);
  } else if (a === 'ok' && C.sel) duelTake433(C, C.sel);
  else if (a === 'annuler') duelCancel433(C);
  else if (a === 'reglages') C.e = 'reglages';
  else if (a === 'lancer') return launchDuel433(C);
  duelRender433();
  const box = a === 'tirer' && document.querySelector('.du433-o');
  if (box) window.scrollTo({ top: Math.max(0, box.getBoundingClientRect().top + window.scrollY - 160), behavior: RM ? 'auto' : 'smooth' });
});


document.addEventListener('input', e => {
  const x = e.target.closest('[data-du433n]');
  if (!x || !DUEL433) return;
  DUEL433.noms[+x.dataset.du433n] = x.value.slice(0, 14);
});


document.addEventListener('change', e => {
  const x = e.target.closest('[data-du433c]');
  if (!x || !DUEL433) return;
  const k = x.dataset.du433c;
  if (k === 'lim') DUEL433.lim = [8, 10, 12].includes(+x.value) ? +x.value : 10;
  else if (k === 'heure') DUEL433.heure = x.value === 'nuit' ? 'nuit' : 'jour';
  else if (k === 'terrain' && TERR433[x.value]) DUEL433.terrain = x.value;
});


if (!CAMP_TABS431.some(x => x[0] === 'duel')) CAMP_TABS431.push(['duel', 'Duel']);


// at startup: a demo duel, so that a duel in progress resumes after a reload
(() => {
  try {
    const C = duelNew433();
    C.picks = [
      ['salameche', 'carapuce', 'bulbizarre', 'pichu'],
      ['germignon', 'hericendre', 'kaiminus', 'wattouat']
    ].map(team => team.filter(id => BY[id]));
    const X = duelScene433(C);
    SCEN.duel433 = X.D;
    OBST.duel433 = X.O;
    DUEL433 = null;
  } catch { /* Best effort: failure here is non-fatal. */ }
})();


/* ---------- 2. full tutorial ---------- */
// each chapter: key, group, icon, title, text, actions [label, attribute]
TUTORIAL_STEPS433 = [
  { k: 'tour', g: 'Les bases', ic: 'i-play', t: 'Un tour de jeu', d: 'Touchez votre Pokémon : les <b>cases bleues</b> montrent où il peut aller. Touchez ensuite une capacité et une <b>case dorée</b> : l’aperçu affiche le résultat exact avant de confirmer. Quand tout le monde a joué, « Fin du tour » : les adversaires agissent à leur tour. Touchez un adversaire pour voir sa <b>zone rouge</b>, tout ce qu’il peut frapper après s’être déplacé.', a: [['Jouer le combat guidé', 'data-hm="tuto"']] },
  { k: 'voix', g: 'Les bases', ic: 'i-bolt', t: 'Voix, marques et réactions', d: 'Chaque manche vous donne des <b>Voix</b> : elles servent à Esquiver, Relancer, Éveiller, capturer ou lancer une technique combinée. Certaines capacités laissent une <b>marque</b> de leur type sur une case pendant deux manches ; un autre élément la fait réagir (eau + électricité, feu + herbes…). Préparez avec un Pokémon, déclenchez avec un autre.', a: [['Voir les réactions', 'data-guide="reactions"']] },
  { k: 'eveil', g: 'Les bases', ic: 'i-star', t: 'Éveil, attaques Expertes, Forme Résonante', d: 'Les <b>losanges</b> se remplissent en combat. À trois, l’<b>Éveil</b> fait évoluer votre Pokémon sur-le-champ : c’est définitif, gardez-le pour le moment décisif. Au stade final, les losanges servent aux <b>attaques Expertes</b> (2 losanges, 1 pour un Pokémon Expert) et, une fois par combat, à la <b>Forme Résonante</b> : 1 Voix pour 3 manches à +2 Puissance, +1 Mouvement et +20 % de dégâts. Trois rangs différents dans l’équipe : <b>Harmonie</b>, chacun commence avec 1 losange. <b>Évoli</b> choisit librement parmi ses 5 évolutions ; celle en harmonie avec sa case ou l’heure lui laisse 1 losange.', a: [] },
  { k: 'notes', g: 'Les bases', ic: 'i-book', t: 'Notes de Résonance', d: 'Chaque Pokémon différent qui frappe la même cible dans la manche y pose une <b>note</b>. À la troisième : « Résonance ! », le coup fait ×1,5 et déclenche l’écho de son type. Concentrez vos attaques sur une seule cible : les notes s’effacent en fin de manche.', a: [] },
  { k: 'vigil', g: 'Tactique', ic: 'i-fight', t: 'Vigilance', d: 'Un Pokémon peut renoncer à attaquer pour <b>surveiller</b> : il frappe le premier adversaire qui entre dans sa portée, avant que celui-ci n’attaque. Idéal pour garder un passage ou protéger un allié fragile.', a: [] },
  { k: 'encercle', g: 'Tactique', ic: 'i-team', t: 'Encerclement', d: 'Une cible au contact de <b>deux adversaires ou plus</b> subit +20 % de dégâts et perd 1 Mouvement. La règle vaut des deux côtés : ne laissez pas un Pokémon isolé au milieu des adversaires.', a: [] },
  { k: 'tactique', g: 'Tactique', ic: 'i-league', t: 'Tactique avancée', d: 'Entrer au contact d’un adversaire arrête le déplacement (sauf volants, Spectre et Éclaireurs). Lance-Soleil et Vol partent en fin de manche, s’ils ne sont pas interrompus. Certains trios de types joués dans la même manche déclenchent un <b>Accord</b> (Éclipse, Incendie, Voltige…). Les pièges posés au sol arrêtent l’adversaire qui les traverse.', a: [] },
  { k: 'capture', g: 'Tactique', ic: 'i-quest', t: 'Capture', d: 'Dans les hautes herbes et sur les terrains d’entraînement : affaiblissez le Pokémon (sous 25 % des PV avec une Poké Ball, 40 % avec une Super ou Hyper Ball), immobilisez-le (Gel, Paralysie, Sommeil, Racines ou Toile ; inutile avec une Hyper Ball), puis un allié au contact qui n’a pas encore agi dépense 2 Voix. Un Pokémon K.O. s’enfuit.', a: [['Ouvrir la carte', 'data-news="herbes"']] },
  { k: 'deploiement', g: 'Avant le combat', ic: 'i-team', t: 'Déploiement', d: 'Avant les grands combats, placez vos Pokémon sur les <b>cases bleues</b>, puis « Lancer le combat ». Un attaquant devant, un soigneur à l’abri, un tireur sur une hauteur : le placement décide souvent du combat. Réglage : Grands combats, Tous ou Jamais (Paramètres).', a: [['Paramètres', 'data-t433="params"']] },
  { k: 'doctrine', g: 'Avant le combat', ic: 'i-fight', t: 'Doctrines', d: () => 'Choisissez une doctrine dans l’écran de préparation : un avantage contre une contrepartie. ' + Object.values(DOCTRINES430).map(x => `<b>${x.n}</b> : ${x.d} ${x.c}`).join(' '), a: [['Préparer un combat', 'data-t433="combat"']] },
  { k: 'ciel', g: 'Avant le combat', ic: 'i-sol', t: 'Ciel, météo et heure', d: 'En haut du combat, un logo annonce le <b>moment de la journée</b> (jour, aube, crépuscule, nuit) et la <b>météo</b> (pluie, grêle, tempête de sable, soleil, vent). La météo change la durée des marques et inflige des dégâts aux types qui n’y résistent pas ; la nuit avantage les Pokémon Spectre et Ténèbres et réduit la vue dans le brouillard.', a: [] },
  { k: 'brouillard', g: 'Avant le combat', ic: 'i-lune', t: 'Brouillard de guerre', d: 'Réglage facultatif : vous ne voyez que ce que voient vos Pokémon, à 2 cases (3 pour les Vol et Psy, 1 de moins la nuit). Un adversaire caché dans les hautes herbes n’apparaît qu’au contact. En échange : +25 % de Pokédollars en cas de victoire.', a: [['Paramètres', 'data-t433="params"']] },
  { k: 'journal', g: 'Après le combat', ic: 'i-book', t: 'Journal tactique', d: 'Après chaque combat, le <b>rapport tactique</b> montre les dégâts infligés et subis par Pokémon, et désigne le MVP. Toutes vos statistiques (victoires par catégorie, Pokémon les plus utilisés, séries) sont dans Quêtes › Journal.', a: [['Ouvrir le Journal', 'data-t433="journal"']] },
  { k: 'camp', g: 'Le Camp', ic: 'i-camp', t: 'Le Camp', d: 'L’onglet <b>Camp</b> réunit les bâtiments (Dojo…), les expéditions, la Pension et le Potager, en Campagne comme en Libre. Ses sous-onglets ouvrent les modes de jeu des chapitres suivants.', a: [['Ouvrir le Camp', 'data-t433="camp:base"']] },
  { k: 'enigmes', g: 'Le Camp', ic: 'i-quest', t: 'Énigmes tactiques', d: () => `${PUZZLES431.length} énigmes : positions figées, PV au plus juste, mettez tous les adversaires K.O. <b>en une seule manche</b>. Trois étoiles par énigme selon vos essais ; un indice apparaît après un échec. Une énigme du jour change chaque jour.`, a: [['Jouer une énigme', 'data-t433="camp:enigmes"']] },
  { k: 'echo', g: 'Le Camp', ic: 'i-star', t: 'Écho profond', d: 'Une expédition de <b>8 étages</b> avec une seule vie : les PV restent d’un combat à l’autre. À chaque étage, choisissez votre chemin : combat, élite (une relique à la clé), source, marchand ou événement. Le gardien vous attend au dernier étage.', a: [['Partir en expédition', 'data-t433="camp:echo"']] },
  { k: 'arenes', g: 'Le Camp', ic: 'i-league', t: 'Arènes personnalisées', d: 'Composez votre combat : terrain, règle, heure, nombre de manches, robustesse et jusqu’à 5 adversaires. Testez-le, puis envoyez son <b>code</b> (ARN-…) à un ami : il l’importe et relève le défi. Jusqu’à 12 arènes.', a: [['Créer une arène', 'data-t433="camp:arenes"']] },
  { k: 'maitrise', g: 'Le Camp', ic: 'i-trophy', t: 'Maîtrise des familles', d: () => `Après ${MASTERY_THRESHOLD431} combats dans votre équipe, une famille débloque un <b>bonus permanent</b>, à choisir entre deux (Puissance, Garde, Mouvement, PV, losange de départ…). Vous pouvez en changer contre des Pokédollars.`, a: [['Voir les maîtrises', 'data-t433="camp:maitrise"']] },
  { k: 'pantheon', g: 'Le Camp', ic: 'i-trophy', t: 'Panthéon', d: 'Chaque équipe qui bat un Champion, un Maître ou le gardien de l’Écho profond y est gravée, avec la date, la difficulté et le nombre de manches.', a: [['Voir le Panthéon', 'data-t433="camp:pantheon"']] },
  { k: 'natures', g: 'Votre équipe', ic: 'i-star', t: 'Natures et talents', d: 'Chaque Pokémon capturé a sa propre <b>nature</b> (Brave, Prudent, Vif…) et son propre <b>talent</b>, logiques avec sa famille et gardés à travers ses évolutions. Deux Salamèche ne se jouent pas forcément pareil : consultez la fiche du Pokémon.', a: [['Voir mon équipe', 'data-t433="pokedex"']] },
  { k: 'equipes', g: 'Votre équipe', ic: 'i-team', t: 'Équipes et formations', d: 'Dans la préparation d’un combat, <b>enregistrez</b> jusqu’à 8 équipes et rappelez-les d’un geste. Les <b>formations</b> proposent des équipes toutes faites, pensées pour leurs synergies de types.', a: [['Préparer un combat', 'data-t433="combat"']] },
  { k: 'hebdo', g: 'Défis et rencontres', ic: 'i-trophy', t: 'Défi de la semaine', d: 'Chaque semaine, la même équipe et la même règle pour tous les joueurs. Votre meilleur score est gardé, la première victoire est récompensée et vous pouvez comparer vos résultats avec vos amis.', a: [['Voir le défi', 'data-news="hebdo429"']] },
  { k: 'legendes', g: 'Défis et rencontres', ic: 'i-star', t: 'Légendes et Kael', d: 'Mewtwo, Raikou, Entei, Suicune, Lugia et Ho-Oh se capturent au bout de leur quête (Quêtes › Légendes). Votre rival <b>Kael</b> revient vous défier à Johto et à Hoenn, après 4 badges de chaque région : il a progressé autant que vous.', a: [['Quêtes légendaires', 'data-news="leg429"']] },
  { k: 'duel', g: 'Défis et rencontres', ic: 'i-fight', t: 'Duel local à 2', d: 'Camp › Duel : deux joueurs sur le même téléphone. Un tirage de Pokémon, un <b>bannissement</b> chacun, puis le choix en serpent (J1, J2, J2, J1…). Chacun joue son tour, puis passe le téléphone ; les Pokémon du Joueur 1 sont cerclés de bleu, ceux du Joueur 2 d’orange. Aucun objet, aucune nature, terrain symétrique : seul le jeu compte. Temps écoulé : le plus de PV restants l’emporte.', a: [['Organiser un duel', 'data-t433="camp:duel"']] },
  { k: 'reglages', g: 'Réglages', ic: 'i-gear', t: 'Partie et accessibilité', d: 'Paramètres : passez de la <b>Campagne</b> au mode <b>Libre</b> (tous les combats ouverts) avec une confirmation, la partie peut d’abord être rangée dans un emplacement. Réglez la <b>taille du texte</b>, le contraste, les couleurs pour daltoniens, le mode gaucher et les animations. Les sauvegardes se gardent sur l’appareil et sur votre compte.', a: [['Paramètres', 'data-t433="params"']] }
];


// chapters marked "read": handled by Tutorial.jsx


document.addEventListener('click', e => {
  const b = e.target.closest('[data-t433]');
  if (!b) return;
  const a = b.dataset.t433;
  if (a.startsWith('camp:')) {
    V4.campTab = a.slice(5);
    go('camp');
  } else if (a === 'journal') {
    V4.qTab = 'journal';
    go('quetes');
  } else go(a);
});

}
