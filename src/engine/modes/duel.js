/* Local 2-player duel (Camp › Duel, added in v4.33): a draw of 10 to 12 Pokémon,
   one ban each, snake-draft picks, then a battle on the same phone. Each player
   directs their team in turn, with exactly the same rules: no items, natures or
   doctrines, symmetrical terrain. Each player has their own Voices, synergies,
   round chord and Resonant Form; burns, durations and Vigilance follow the turn
   of their owner, so that neither is advantaged.
   DUEL_TUTORIAL_0 / duelTutorialClean also sanitize the saved tutorial progress (ui/tutorial-chapters.js). */
import { BY, DEPLOY, MON, SCEN, familyOf } from '../pokemon/pokemon.js';
import { PROFILE } from '../state/game-state.js';
import { synOf } from '../pokemon/roles-synergies.js';
import { $, RM, medal } from '../core/utils.js';
import { tokCl } from '../../screens/combat/board/boardStore.js';
import { HOOKS } from '../core/hooks.js';
import { go } from '../core/navigation.js';
import {
  BH,
  BW,
  K,
  P,
  byUid,
  damage,
  unitRoundEffects,
  endStep,
  rewardIn,
  hasNx,
  mkUnit,
  say,
  uk,
} from '../combat/engine.js';
import { OBST, resolve } from '../combat/synergies-obstacles.js';
import {
  B,
  L,
  __set_B,
  __set_scSel,
  autoSel,
  backToPrep,
  clearAim,
  endOfRound,
  finish,
  launch,
  log,
  renderAll,
  scSel,
  ui,
} from '../combat/ui.js';
import { esc, queueSave } from '../state/saves.js';
import { PREF } from '../ui/preferences.js';
import { playEv } from '../combat/move-effects.js';
import { AUTO, overlay, turnBanner } from '../progression/prestige.js';
import { shut } from '../../screens/overlays/tempStore.js';
import { V4 } from '../ui/screen-state.js';
import { unloadCharges } from '../combat/tactics.js';
import { hasXp, rankOfValue } from '../combat/resonance.js';
import { vigilStrike } from '../combat/intensity.js';
import { battleDelay } from '../combat/quick-battle.js';
import { CAMP_TABS, renderCampPage } from './camp-challenges.js';
import { TUTORIAL_LIST } from '../ui/tutorial-chapters.js';

let DUEL_STATE, DUEL_CURRENT, STAT_MAX;
export { DUEL_TERRAINS, DUEL_STATE, STAT_MAX, duelOrder, duelNew, duelStep }; // read by Camp › Duel (src/screens/camp)

export function DUEL_TUTORIAL_0() {
  return { duel433: { n: 0, h: [], names: ['', ''] }, tuto433: [] };
}

export function duelTutorialClean(p) {
  const o = DUEL_TUTORIAL_0();
  if (!p || typeof p !== 'object') {
    return o;
  }
  const d = p.duel433;
  if (d && typeof d === 'object') {
    o.duel433.n = Math.max(0, Math.min(99999, Math.floor(+d.n || 0)));
    if (Array.isArray(d.names)) {
      o.duel433.names = [duelName(d.names[0]), duelName(d.names[1])];
    }
    if (Array.isArray(d.h)) {
      o.duel433.h = d.h
        .filter(x => x && typeof x === 'object' && Array.isArray(x.t) && x.t.length === 2)
        .slice(-12)
        .map(x => ({
          d: typeof x.d === 'string' && /^\d{4}-\d\d-\d\d$/.test(x.d) ? x.d : '',
          n: [duelName((x.n || [])[0]), duelName((x.n || [])[1])],
          g: [0, 1, 2].includes(x.g) ? x.g : 0,
          r: Math.max(0, Math.min(30, Math.floor(+x.r || 0))),
          w: x.w === 'temps' || x.w === 'forfait' ? x.w : 'ko',
          t: x.t.map(team =>
            (Array.isArray(team) ? team : []).filter(id => typeof id === 'string' && BY[id]).slice(0, 4)
          ),
        }));
    }
  }
  if (Array.isArray(p.tuto433)) {
    o.tuto433 = [...new Set(p.tuto433.filter(k => typeof k === 'string' && TUTORIAL_LIST.some(c => c.k === k)))];
  }
  return o;
}

// the settings of the last duel started (rematch)

function duelOrder(n) {
  const o = [
    { a: 'ban', j: 0 },
    { a: 'ban', j: 1 },
  ];
  const s = n === 3 ? [0, 1, 1, 0, 0, 1] : [0, 1, 1, 0, 0, 1, 1, 0];
  s.forEach(j => o.push({ a: 'pick', j }));
  return o;
}

function duelNames() {
  const N = (PROFILE.duel433 && PROFILE.duel433.names) || ['', ''];
  return [N[0] || duelName(PROFILE.name) || 'Joueur 1', N[1] || 'Joueur 2'];
}

function duelNew() {
  const prev = DUEL_STATE || {};
  DUEL_STATE = {
    e: 'reglages',
    names: prev.names || duelNames(),
    mode: prev.mode || 'base',
    sizeValue: prev.sizeValue || 4,
    terrain: prev.terrain || 'arene',
    timeOfDay: prev.timeOfDay || 'jour',
    lim: prev.lim || 10,
    pool: [],
    stepCount: 0,
    bans: [[], []],
    picks: [[], []],
    sel: null,
  };
  return DUEL_STATE;
}

function shuffleArray(list) {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** The draw: entirely different families, in base or final form. */
function duelDraw(C) {
  const bases = MON.filter(m => m.base === m.id && !m.leg && BY[m.id] && !BY[m.id].isEnemy).map(m => m.id),
    n = C.sizeValue * 2 + 4;
  C.pool = shuffleArray(bases)
    .slice(0, n)
    .map(b => {
      if (C.mode !== 'final') {
        return b;
      }
      const endsList = familyOf(b).filter(x => !x.nx && BY[x.id]);
      return endsList.length ? endsList[Math.floor(Math.random() * endsList.length)].id : b;
    });
  C.e = 'draft';
  C.stepCount = 0;
  C.bans = [[], []];
  C.picks = [[], []];
  C.sel = null;
}

function duelStep(C) {
  return duelOrder(C.sizeValue)[C.stepCount] || null;
}

function duelTake(C, id) {
  const st = duelStep(C);
  if (!st || !C.pool.includes(id) || C.bans.flat().includes(id) || C.picks.flat().includes(id)) {
    return false;
  }
  (st.a === 'ban' ? C.bans : C.picks)[st.j].push(id);
  C.stepCount++;
  C.sel = null;
  if (!duelStep(C)) {
    C.e = 'pret';
  }
  return true;
}

function duelCancel(C) {
  if (!C.stepCount) {
    return false;
  }
  C.stepCount--;
  const st = duelOrder(C.sizeValue)[C.stepCount];
  (st.a === 'ban' ? C.bans : C.picks)[st.j].pop();
  C.e = 'draft';
  C.sel = null;
  return true;
}

/* ---------- duel: the battle ---------- */
export function duelOpts() {
  return {
    diff: 'normal',
    items: {},
    fatigue: {},
    links: {},
    order: 'equipe',
    livingBoard: false,
    tactics: true,
    mut: null,
    doctrineChoice: '',
    fogOfWar: false,
    challenges: [],
    characters: false,
    disobedience: false,
    dojo: 0,
    learnedTms: {},
  };
}

function duelScene(C) {
  const T = DUEL_TERRAINS[C.terrain] || DUEL_TERRAINS.arene,
    t2 = C.picks[1].slice(0, C.sizeValue);
  return {
    D: {
      n: 'Duel local',
      lvl: `${C.names[0]} contre ${C.names[1]}`,
      lim: C.lim,
      time: C.timeOfDay === 'nuit' ? 'nuit' : 'jour',
      bio: T.bio,
      water: withMirror(T.water),
      rock: withMirror(T.rock),
      hb: 0,
      pb: 0,
      lv: 50,
      at: BY[t2[0]] ? BY[t2[0]].t[0] : 'Normal',
      catch: false,
      noProgress: 1,
      duel433: 1,
      d: `Duel local · ${T.n}`,
      t1: C.picks[0].slice(0, C.sizeValue),
      names: C.names.slice(),
      foes: t2.map((id, i) => [id, posJ2433(i)]),
    },
    O: { pil: withMirror(T.pil), grass: withMirror(T.grass), sand: withMirror(T.sand) },
  };
}

function launchDuel(C) {
  if (!C || C.picks[0].length < C.sizeValue || C.picks[1].length < C.sizeValue) {
    return;
  }
  const X = duelScene(C);
  SCEN.duel433 = X.D;
  OBST.duel433 = X.O;
  DUEL_CURRENT = JSON.parse(JSON.stringify(C));
  const P0 = (PROFILE.duel433 = PROFILE.duel433 || DUEL_TUTORIAL_0().duel433);
  P0.names = C.names.map(duelName);
  queueSave();
  if (scSel !== 'duel433') {
    launchDuel.prev = scSel;
  }
  __set_scSel('duel433');
  go('combat');
  launch();
}

/** Outside a duel: go back to the battle list, on the previous choice. */
function leaveDuel() {
  const hp = launchDuel.prev;
  __set_B(null);
  __set_scSel(hp && SCEN[hp] && !SCEN[hp].noProgress ? hp : 'gue');
  backToPrep();
  V4.campTab = 'duel';
  go('camp');
}

/** Changes the active player: their Pokémon move to the "ally" side. */
function toggleSide(S, j) {
  const D = S && S.duel433;
  if (!D || D.j === j) {
    return;
  }
  const a = D.j - 1,
    b = j - 1,
    sw = s => (s === 'a' ? 'e' : s === 'e' ? 'a' : s);
  SWAPPED_FIELDS.forEach(k => {
    D.status[a][k] = S[k] === undefined ? null : S[k];
    S[k] = D.status[b][k] === undefined ? null : D.status[b][k];
  });
  D.j = j;
  S.units.forEach(u => (u.side = u.duelPlayer === j ? 'a' : 'e'));
  for (const k in S.tiles) {
    const t = S.tiles[k];
    if (t.trap && t.trap.side) {
      t.trap.side = sw(t.trap.side);
    }
  }
  (S.presc || []).forEach(p => (p.side = sw(p.side)));
  ['arriere', 'rune'].forEach(k => {
    if (S[k] && typeof S[k] === 'object') {
      S[k] = { a: S[k].e || 0, e: S[k].a || 0 };
    }
  });
  S.voice = S.vmax;
  S.phase = 'player';
}

/** Start of player j's round phase (their Pokémon are "allies"). */
function duelTurnStart(S, j, ev) {
  if (!S || !S.duel433 || S.over) {
    return;
  }
  if (j === 2) {
    // Player 2's burn, poison and durations: after Player 1's turn, like Player 1's after their own
    S.units.forEach(u => {
      if (!u.ko && u.duelPlayer === 2) {
        unitRoundEffects(S, u, ev);
      }
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
    if (S.over) {
      return;
    }
  }
  if (S.round > 1) {
    S.units.forEach(u => {
      if (u.duelPlayer === j && !u.ko) {
        rewardIn(S, u, 1, ev);
      }
    });
  }
  S.units.forEach(u => {
    if (u.ko || u.duelPlayer !== j) {
      return;
    }
    u.done = false;
    u.sn = false;
    u.vigilance = 0;
    const st = STUN_BADGES.includes(u.badge) && !u.stunBadgeSeen;
    if (u.skip > 0 || st || u.isLost) {
      if (st || u.isLost) {
        say(ev, `${u.n} ne peut pas agir ce tour.`);
      }
      u.skip = 0;
      u.isLost = 0;
      u.acted = true;
      u.moved = true;
      u.sn = true;
      u.stunBadgeSeen = st ? 1 : 0;
    } else {
      u.acted = false;
      u.moved = false;
      u.badge = null;
      u.stunBadgeSeen = 0;
      if (u.force) {
        u.moved = true;
        say(ev, `${u.n} est troublé : il ne peut pas se déplacer ce tour.`);
      }
    }
    u.force = null;
    u.intent = null;
  });
}

export function duelAiPlan(S, ev) {
  if (S.duel433.ready && S.round > 1) {
    duelTurnStart(S, 1, ev);
  }
}

/** Vigilance in a duel: the waiting player's sentinels strike the Pokémon that arrives. */
export function duelVigilance(S, e, ev) {
  if (!e || e.ko || S.over || e.side !== 'a') {
    return;
  }
  const k = uk(e);
  for (const u of S.units) {
    if (u.side !== 'e' || u.ko || !u.vigilance || STUN_BADGES.includes(u.badge)) {
      continue;
    }
    const m = vigilStrike(S, u, k);
    if (!m) {
      continue;
    }
    u.vigilance = 0;
    S.stats.vigilance = (S.stats.vigilance || 0) + 1;
    say(ev, `Vigilance : ${u.n} intercepte ${e.n} avec ${m.n} !`);
    ev.push({ e: 'vigil-strike', u: u.uid, t: e.uid });
    resolve(S, u, m, k).forEach(x => ev.push(x));
    if (e.ko || S.over) {
      return;
    }
  }
}

/** "End of turn" in a duel: Player 1 hands over, Player 2 closes the round. */
export function duelPassTurn() {
  if (!B || !B.duel433) {
    return false;
  }
  if (ui.busy || B.over || B.phase !== 'player') {
    return true;
  }
  const S = B,
    D = S.duel433;
  Object.assign(ui, { undo: null, tile: null, selE: null, sel: null, mode: null, mi: null, pk: null, pv: null });
  clearAim();
  if (D.j === 1) {
    const ev = [];
    log(`${D.names[0]} termine son tour.`, 'sys');
    D.discard = 2;
    unloadCharges(S, ev); // Player 2's charged attacks fire after Player 1's turn
    endStep(S, ev);
    if (!S.over) {
      toggleSide(S, 2);
      duelTurnStart(S, 2, ev);
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
    handoff(2);
    return true;
  }
  log(`${D.names[1]} termine son tour.`, 'sys');
  toggleSide(S, 1);
  D.discard = 1;
  ui.busy = true;
  renderAll();
  setTimeout(
    () => {
      if (B !== S) {
        return;
      }
      endOfRound(S).then(ok => {
        if (ok && B === S && !S.over) {
          handoff(1);
        }
      });
    },
    battleDelay(60, 160, 380)
  );
  return true;
}

/** Pass-over screen: the phone changes hands. */
function handoff(j, force) {
  const D = B && B.duel433;
  if (!D) {
    return;
  }
  if ((AUTO && !force) || PREF.handoff === false) {
    turnBanner('Manche ' + B.round, D.names[j - 1]);
    return;
  }
  // rendered: src/screens/overlays/transients/DuelRelay.jsx
  const o = overlay('duel433r', {
    mode: 'relais',
    j,
    round: B.round,
    lim: B.lim,
    displayName: D.names[j - 1],
    sub:
      B.round === 1
        ? `Passez le téléphone. Vos Pokémon sont cerclés ${j === 1 ? 'de bleu' : 'd’orange'}.`
        : 'Passez le téléphone, puis touchez le bouton.',
    s: [1, 2].map(x => ({
      j: x,
      displayName: D.names[x - 1],
      pv: duelHp(B, x),
      n: B.units.filter(u => u.duelPlayer === x && !u.ko).length,
    })),
  });
  const b = o.querySelector('[data-forfeit-dialog="go"]');
  if (b) {
    b.focus();
  }
}

/** Share of a player's remaining HP, in %. */
function duelHp(S, j) {
  const units = S.units.filter(u => u.duelPlayer === j),
    m = units.reduce((s, u) => s + u.mhp, 0);
  return m ? Math.round((units.reduce((s, u) => s + (u.ko ? 0 : Math.max(0, u.hp)), 0) / m) * 100) : 0;
}

function duelWinner(S) {
  if (S.forfeit) {
    return 3 - S.forfeit;
  }
  const v1 = S.units.some(u => u.duelPlayer === 1 && !u.ko),
    v2 = S.units.some(u => u.duelPlayer === 2 && !u.ko);
  if (v1 && !v2) {
    return 1;
  }
  if (v2 && !v1) {
    return 2;
  }
  if (!v1 && !v2) {
    return 0;
  }
  const p1 = duelHp(S, 1),
    p2 = duelHp(S, 2);
  return p1 === p2 ? 0 : p1 > p2 ? 1 : 2;
}

export function duelEnd(S, rew) {
  const D = S.duel433,
    g = duelWinner(S),
    w = S.forfeit
      ? 'forfait'
      : S.units.some(u => u.duelPlayer === 1 && !u.ko) && S.units.some(u => u.duelPlayer === 2 && !u.ko)
        ? 'temps'
        : 'ko';
  D.g = g;
  D.w = w;
  S.over = 'win';
  const J0 = (S.stats && S.stats.journalStats) || { d: {}, t: {}, k: {} };
  rew.duel433 = {
    g,
    w,
    names: D.names.slice(),
    pv: [duelHp(S, 1), duelHp(S, 2)],
    rows: [1, 2].map(j =>
      S.units
        .filter(u => u.duelPlayer === j)
        .map(u => ({ id: u.id, d: J0.d[u.uid] || 0, t: J0.t[u.uid] || 0, k: J0.k[u.uid] || 0, ko: u.ko ? 1 : 0 }))
    ),
  };
  const P0 = (PROFILE.duel433 = PROFILE.duel433 || DUEL_TUTORIAL_0().duel433);
  P0.n = (P0.n || 0) + 1;
  P0.h = (P0.h || [])
    .concat([
      {
        d: new Date().toISOString().slice(0, 10),
        n: D.names.slice(),
        g,
        r: S.round,
        w,
        t: [1, 2].map(j => S.units.filter(u => u.duelPlayer === j).map(u => u.id)),
      },
    ])
    .slice(-12);
  return [0, 0];
}

export function duelUnder(S) {
  const D = S.duel433;
  if (!D) {
    return '';
  }
  if (D.w === 'forfait') {
    return `${esc(D.names[(S.forfeit || 1) - 1])} a déclaré forfait.`;
  }
  if (D.w === 'temps') {
    return `Temps écoulé : ${esc(D.names[0])} garde ${duelHp(S, 1)} % de ses PV, ${esc(D.names[1])} ${duelHp(S, 2)} %.`;
  }
  return D.g
    ? `Toute l’équipe de ${esc(D.names[2 - D.g])} est K.O. en ${S.round} manche${S.round > 1 ? 's' : ''}.`
    : 'Les deux équipes tombent ensemble.';
}

/* rendering: player colors, end-of-turn button, phase */
export function afterRenderDuel() {
  if (!B || !B.duel433) {
    return;
  }
  for (const id in L.u) {
    const T = L.u[id],
      u = byUid(B, id);
    if (!T || !u) {
      continue;
    }
    tokCl(T, 'dj1', u.duelPlayer === 1); // token classes: Units.jsx
    tokCl(T, 'dj2', u.duelPlayer === 2);
  }
  // plates (data-duel-player), end-of-turn button, phase and player name: rendered by React (src/screens/combat/battle)
}

// the Camp › Duel tab (settings, draw, teams, history) is rendered by React: src/screens/camp/tabs/Duel.jsx

function duelRender() {
  if (V4.campTab === 'duel') {
    renderCampPage();
  }
}

const duelName = x =>
  String(x == null ? '' : x)
    .replace(/[<>&"`]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 14);

/* ---------- symmetrical terrains ---------- */
// half board described, the other half mirrored (half-turn rotation: the hex grid is symmetrical under it)
const DUEL_TERRAINS = {
  arene: { n: 'Arène', bio: 'arene', pil: ['3,1'], sand: ['2,3'] },
  gue: { n: 'Gué', bio: 'gue', water: ['3,0', '3,3', '3,4'], grass: ['1,0'] },
  roche: { n: 'Rocaille', bio: 'roche', rock: ['3,2'], pil: ['2,0'], sand: ['2,4'] },
  herbes: { n: 'Hautes herbes', bio: 'gue', grass: ['2,1', '2,2', '3,4', '1,4'] },
  stade: { n: 'Stade', bio: 'ligue', pil: ['3,3'], grass: ['2,0'] },
};

const mirrorKey = k => {
  const [c, r] = P(k);
  return K(BW - 1 - c, BH - 1 - r);
};

const withMirror = keys => [...new Set([...(keys || []), ...(keys || []).map(mirrorKey)])];

const posJ2433 = i => [BW - 1 - DEPLOY[i][0], BH - 1 - DEPLOY[i][1]];

const SWAPPED_FIELDS = ['syn', 'harmonie', 'resonantUnit', 'acc', 'retrigger', 'lastAtk'];

const STUN_BADGES = ['SOM', 'GEL', 'PAR'];

export const duelCanCharge = (S, u) => !S.duel433 || u.duelPlayer === S.duel433.discard;

export const duelTitle = S => {
  const D = S.duel433;
  return D && D.g ? `Victoire de ${esc(D.names[D.g - 1])}` : 'Match nul';
};

function onCombat(S, opt, D0) {
  if (!S.duel433) {
    return;
  }
  const D = S.duel433;
  // Player 2 is built exactly like Player 1: no HP or Power bonus
  S.units.forEach(u => {
    if (u.duelPlayer !== 2) {
      return;
    }
    const n = mkUnit(u.id, 'a', u.pos, u.uid, D0);
    Object.keys(u).forEach(k => delete u[k]);
    Object.assign(u, n, { side: 'e', duelPlayer: 2 });
  });
  const p2 = S.units.filter(u => u.duelPlayer === 2);
  let h2 = null;
  if (p2.length >= 3 && new Set(p2.map(rankOfValue)).size >= 3) {
    h2 = true;
    p2.forEach(u => {
      if (hasNx(u) || hasXp(u)) {
        u.en = Math.max(u.en || 0, 1);
      }
    });
  }
  D.status[0] = {
    syn: S.syn || [],
    harmonie: S.harmonie || null,
    resonantUnit: null,
    acc: null,
    retrigger: false,
    lastAtk: null,
  };
  D.status[1] = {
    syn: synOf(p2.map(u => u.id)).map(s => s.k),
    harmonie: h2,
    resonantUnit: null,
    acc: null,
    retrigger: false,
    lastAtk: null,
  };
  S.noCatch = true;
  D.ready = 1;
}

function onDuelClick(e) {
  const s = e.target.closest('[data-duel-report-s]');
  if (s && DUEL_STATE) {
    const k = s.dataset.duelReportS,
      v = s.dataset.v;
    DUEL_STATE[k] = k === 'sizeValue' ? (v === '3' ? 3 : 4) : v === 'final' ? 'final' : 'base';
    duelRender();
    return;
  }
  const p = e.target.closest('[data-duel-report-p]');
  if (p && DUEL_STATE && DUEL_STATE.e === 'draft') {
    const id = p.dataset.duelReportP;
    DUEL_STATE.sel = DUEL_STATE.sel === id ? null : id;
    duelRender();
    return;
  }
  const b = e.target.closest('[data-duel-report]');
  if (!b) {
    return;
  }
  const C = DUEL_STATE || duelNew(),
    a = b.dataset.duelReport;
  if (a === 'tirer') {
    C.names = C.names.map((x, i) => duelName(x) || 'Joueur ' + (i + 1));
    if (C.names[0] === C.names[1]) {
      C.names[1] += ' 2';
    }
    duelDraw(C);
  } else if (a === 'ok' && C.sel) {
    duelTake(C, C.sel);
  } else if (a === 'annuler') {
    duelCancel(C);
  } else if (a === 'reglages') {
    C.e = 'reglages';
  } else if (a === 'lancer') {
    return launchDuel(C);
  }
  duelRender();
  const box = a === 'tirer' && document.querySelector('.duel-report-o');
  if (box) {
    window.scrollTo({
      top: Math.max(0, box.getBoundingClientRect().top + window.scrollY - 160),
      behavior: RM ? 'auto' : 'smooth',
    });
  }
}

// Statements run at startup, in the original order (see index.js).
export function init() {
  DUEL_STATE = null;

  // the current draw (in memory)
  DUEL_CURRENT = null;

  HOOKS.creation.push((S, opt, D0) => {
    if (!D0 || !D0.duel433) {
      return;
    }
    S.duel433 = {
      j: 1,
      names: (D0.names || ['Joueur 1', 'Joueur 2']).slice(0, 2),
      status: [{}, {}],
      discard: 1,
      ready: 0,
      D: JSON.parse(JSON.stringify(D0)),
      O: JSON.parse(JSON.stringify(OBST.duel433 || {})),
    };
    S.units.forEach(u => (u.duelPlayer = u.side === 'a' ? 1 : 2));
    S.jit = true;
    S.coop = 0;
    S.noCatch = true;
  });

  HOOKS.combat.push(onCombat);

  document.addEventListener('click', e => {
    const b = e.target.closest('[data-forfeit-dialog]');
    if (!b) {
      return;
    }
    if (b.dataset.forfeitDialog === 'go') {
      shut('duel433r');
      if (B && B.duel433) {
        turnBanner('Manche ' + B.round, B.duel433.names[B.duel433.j - 1]);
        renderAll();
      }
      return;
    }
    if (b.dataset.forfeitDialog === 'non') {
      shut('duel433r');
      return;
    }
    if (b.dataset.forfeitDialog === 'forfait' && B && B.duel433 && !B.over) {
      shut('duel433r');
      B.forfeit = B.duel433.j;
      B.over = 'win';
      log(`${B.duel433.names[B.duel433.j - 1]} déclare forfait.`, 'sys');
      finish();
    }
  });

  // Forfeit: the opponent wins
  document.addEventListener(
    'click',
    e => {
      if (!e.target.closest('#bQuit') || !B || !B.duel433) {
        return;
      }
      e.stopPropagation();
      if (ui.busy) {
        return;
      }
      if (B.over) {
        return leaveDuel();
      }
      const D = B.duel433,
        j = D.j;
      overlay('duel433r', { mode: 'abandon', j, displayName: D.names[j - 1], other: D.names[2 - j] });
    },
    true
  );

  HOOKS.battleResult.push(r => {
    const X = r && r.duel433;
    if (!X) {
      return '';
    }
    const mx = Math.max(1, ...X.rows.flat().map(x => x.d));
    return `<div class="res-l duel-report-r"><h4>Rapport du duel</h4><div class="duel-report-rg">${[0, 1]
      .map(
        i =>
          `<div class="duel-report-rc dj${i + 1}${X.g === i + 1 ? ' g' : ''}"><b>${esc(X.names[i])}</b><em>${X.pv[i]} % PV restants</em>${X.rows[
            i
          ]
            .map(x => {
              const m = BY[x.id];
              return `<div class="duel-report-rl${x.ko ? ' ko' : ''}">${medal(m.t, 'xs')}<span>${m.n}</span><i style="--w:${Math.round((x.d / mx) * 100)}%"></i><small>${x.d}${x.k ? ` · ${x.k} K.O.` : ''}</small></div>`;
            })
            .join('')}</div>`
      )
      .join('')}</div><p class="battle-report-l">Dégâts infligés et K.O. par Pokémon.</p></div>`;
  });

  // Play again → rematch (the other player starts); Change team → new duel
  document.addEventListener(
    'click',
    e => {
      const b = e.target.closest('#cbResult [data-res]');
      if (!b || !B || !B.duel433) {
        return;
      }
      e.stopPropagation();
      $('#cbResult').hidden = true;
      if (b.dataset.res === 'again' && DUEL_CURRENT) {
        const C = JSON.parse(JSON.stringify(DUEL_CURRENT));
        C.names.reverse();
        C.picks.reverse();
        C.bans.reverse();
        DUEL_STATE = C;
        launchDuel(C);
        return;
      }
      duelNew();
      leaveDuel();
    },
    true
  );

  document.addEventListener('click', e => {
    if (!e.target.closest('[data-news="duel433"]')) {
      return;
    }
    e.stopPropagation();
    V4.campTab = 'duel';
    go('camp');
  });

  /* ---------- duel: the Camp screen ---------- */
  STAT_MAX = 5;

  try {
    STAT_MAX = Math.max(5, ...MON.map(m => Math.max(...m.s)));
  } catch {
    /* Best effort: failure here is non-fatal. */
  }

  document.addEventListener('click', onDuelClick);

  document.addEventListener('input', e => {
    const x = e.target.closest('[data-duel-report-n]');
    if (!x || !DUEL_STATE) {
      return;
    }
    DUEL_STATE.names[+x.dataset.duelReportN] = x.value.slice(0, 14);
  });

  document.addEventListener('change', e => {
    const x = e.target.closest('[data-duel-report-c]');
    if (!x || !DUEL_STATE) {
      return;
    }
    const k = x.dataset.duelReportC;
    if (k === 'lim') {
      DUEL_STATE.lim = [8, 10, 12].includes(+x.value) ? +x.value : 10;
    } else if (k === 'heure') {
      DUEL_STATE.timeOfDay = x.value === 'nuit' ? 'nuit' : 'jour';
    } else if (k === 'terrain' && DUEL_TERRAINS[x.value]) {
      DUEL_STATE.terrain = x.value;
    }
  });

  if (!CAMP_TABS.some(x => x[0] === 'duel')) {
    CAMP_TABS.push(['duel', 'Duel']);
  }

  // at startup: a demo duel, so that a duel in progress resumes after a reload
  (() => {
    try {
      const C = duelNew();
      C.picks = [
        ['salameche', 'carapuce', 'bulbizarre', 'pichu'],
        ['germignon', 'hericendre', 'kaiminus', 'wattouat'],
      ].map(team => team.filter(id => BY[id]));
      const X = duelScene(C);
      SCEN.duel433 = X.D;
      OBST.duel433 = X.O;
      DUEL_STATE = null;
    } catch {
      /* Best effort: failure here is non-fatal. */
    }
  })();
}
