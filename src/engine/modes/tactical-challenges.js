import { bdClass, tokCl } from '../../screens/combat/board/boardStore.js';

import { GYMS } from '../data/game-data.js';
import { BY, SCEN } from '../pokemon/pokemon.js';
import { PROFILE } from '../state/game-state.js';
import { ARENAS, TERR } from './gyms.js';
import { $, toast } from '../core/utils.js';
import { HOOKS } from '../core/hooks.js';
import { go } from '../core/navigation.js';
import { squad } from '../team/team.js';
import { EMAX, P, hdist, uAt, uk } from '../combat/engine.js';
import { OBST } from '../combat/synergies-obstacles.js';
import {
  B,
  L,
  __set_scSel,
  backToPrep,
  battleOpts,
  chooseBattle,
  finish,
  launch,
  openBattle,
  scSel,
  ui,
} from '../combat/ui.js';
import { queueSave } from '../state/saves.js';
import { PREF } from '../progression/campaign.js';
import { V4, fmt, today } from '../state/economy.js';
import { renderWallet } from '../core/interface.js';
import { RIVAL_POS } from './adventure.js';
import { hourOf, seesAtNight } from '../combat/living-board.js';
import { codeChecksum } from '../world/living-johto.js';
import { PROGRESS_KEYS, fingerprintRandom } from '../progression/quality.js';
import { PANTHEON_STORE, pantheonEngrave } from '../team/individuals.js';
import { duelEnd, duelOpts } from './duel.js';
import { refreshCampPage } from '../../screens/camp/campStore.js';
import { migrateKeys } from '../../lib/saveMigration.js';

let PUZZLE_CURRENT, GYM_EDITOR;
// read by the Camp tabs (src/screens/camp/tabs)
export {
  MASTERY_DEFS,
  RELIC_DEFS,
  ECHO_NODES,
  ECHO_EVENTS,
  GYM_EDITOR,
  puzzleState,
  puzzleOfDay,
  masteryChoice,
  randomRelic,
  GYM_RULES,
  GYM_TERRAINS,
  gymShareCode,
};

function puzzleScen(puzzle) {
  const b = SCEN[puzzle.b] || SCEN.gue;
  return {
    n: `Énigme · ${puzzle.t}`,
    lvl: 'Énigme tactique',
    lim: 1,
    time: 'jour',
    bio: b.bio,
    water: (b.water || []).slice(),
    rock: (b.rock || []).slice(),
    hb: 0,
    pb: 0,
    lv: 30,
    at: BY[puzzle.f[0][0]].t[0],
    foes: puzzle.f.map(([id, c, r]) => [id, [c, r]]),
    catch: false,
    enigme431: puzzle.id,
    noProgress: 1,
    d: 'Mettez K.O. tous les adversaires en une seule manche. Les adversaires ne jouent pas : tout se décide pendant votre tour.',
  };
}

function puzzleOpts() {
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
    challenges: [],
    characters: false,
    disobedience: false,
    dojo: 0,
    learnedTms: {},
  };
}

function puzzlePrepare(puzzle) {
  PUZZLE_CURRENT = puzzle;
  SCEN.enigme431 = puzzleScen(puzzle);
  OBST.enigme431 = {};
}

/* =====================================================================
   v4.31: tactical challenges
   1. Fog of war (setting): you only see what your Pokémon see.
      +25% Pokédollars on victory.
   2. Tactical riddles: frozen positions, KO everything in one round.
      Each riddle was built and verified with the game engine.
   3. Family mastery: after 10 battles, a bonus of your choice out of two.
   4. Deep Echo: 8-floor branching expedition, HP carried over,
      a single life, relics, merchant and events.
   5. Custom arenas: create a battle, share it through a code.
   Everything is in the Camp tab (sub-tabs).
   ===================================================================== */
export function TACTICAL_CHALLENGES_0() {
  return { riddleButton: null, masteryTrack: {}, echo431: null, customGyms: [], gymJournal: null };
}

export function tacticalChallengesClean(p) {
  const o = TACTICAL_CHALLENGES_0();
  if (!p || typeof p !== 'object') {
    return o;
  }
  const E = p.riddleButton;
  if (E && typeof E === 'object') {
    const s = {},
      n = {};
    if (E.s && typeof E.s === 'object') {
      Object.keys(E.s).forEach(k => /^\d{1,3}$/.test(k) && (s[k] = clampInt(E.s[k], 1, 3)));
    }
    if (E.n && typeof E.n === 'object') {
      Object.keys(E.n).forEach(k => /^\d{1,3}$/.test(k) && (n[k] = clampInt(E.n[k], 0, 999)));
    }
    o.riddleButton = {
      s,
      n,
      j: typeof E.j === 'string' && /^\d{4}-\d\d-\d\d$/.test(E.j) ? E.j : '',
      jd: Array.isArray(E.jd) ? E.jd.filter(x => Number.isInteger(x) && x >= 0 && x < 999).slice(0, 3) : [],
      cur: Number.isInteger(E.cur) ? clampInt(E.cur, 0, 998) : 0,
    };
  }
  if (p.masteryTrack && typeof p.masteryTrack === 'object') {
    Object.keys(p.masteryTrack).forEach(k => {
      const m = p.masteryTrack[k];
      if (BY[k] && m && typeof m === 'object') {
        o.masteryTrack[k] = {
          n: clampInt(m.n, 0, 99999),
          p: typeof m.p === 'string' && /^[a-z]{3,10}$/.test(m.p) ? m.p : '',
        };
      }
    });
  }
  const X = p.echo431;
  if (X && typeof X === 'object') {
    o.echo431 = { best: clampInt(X.best, 0, 8), wins: clampInt(X.wins, 0, 9999), run: null };
    const R = X.run;
    if (R && typeof R === 'object' && Array.isArray(R.team) && Array.isArray(R.map)) {
      const team = R.team
        .filter(t => Array.isArray(t) && BY[t[0]])
        .slice(0, 4)
        .map(t => [t[0], Math.max(0, Math.min(1, +t[1] || 0))]);
      const map = R.map
        .filter(Array.isArray)
        .slice(0, 8)
        .map(f => f.filter(x => typeof x === 'string' && /^[a-z]{2,10}$/.test(x)).slice(0, 3));
      if (team.length && map.length === 8) {
        o.echo431.run = {
          seed: clampInt(R.seed, 0, 2147483647),
          f: clampInt(R.f, 0, 8),
          team,
          relics: Array.isArray(R.relics)
            ? R.relics.filter(x => typeof x === 'string' && /^[a-z]{3,10}$/.test(x)).slice(0, 12)
            : [],
          echoes: clampInt(R.echoes, 0, 9999),
          map,
          path: Array.isArray(R.path) ? R.path.filter(Number.isInteger).slice(0, 8) : [],
          cur: Number.isInteger(R.cur) ? clampInt(R.cur, -1, 2) : -1,
          pv: Number.isFinite(R.pv) ? Math.max(0, Math.min(0.5, R.pv)) : 0,
          ev: typeof R.ev === 'string' && /^[a-z]{2,12}$/.test(R.ev) ? R.ev : '',
        };
      }
    }
  }
  if (Array.isArray(p.customGyms)) {
    o.customGyms = p.customGyms.map(gymClean).filter(Boolean).slice(0, 12);
  }
  const J = p.gymJournal;
  if (J && typeof J === 'object' && typeof J.d === 'string') {
    o.gymJournal = { d: J.d.slice(0, 10), n: clampInt(J.n, 0, 99) };
  }
  return o;
}

/** A « no progression » victory (riddle, custom arena, Deep Echo): neither counters nor ordinary rewards. */
export function noProgressResult(S) {
  const D = SCEN[S.sc] || {},
    win = S.over === 'win',
    rew = { links: [], caught: [], items: [], gifts: [], tired: [], forms: [], badgeNew: false };
  let r = [0, 0];
  try {
    if (D.duel433) {
      r = duelEnd(S, rew);
    } // local duel (v4.33)
    else if (D.enigme431 != null) {
      r = puzzleAfter(S, rew, win);
    } else if (D.perso431) {
      r = gymAfter(S, rew, win);
    } else if (D.echo431) {
      r = echoAfter(S, rew, win);
    }
  } catch {
    /* Best effort: failure here is non-fatal. */
  }
  const [m, g] = r || [0, 0];
  if (m || g) {
    PROFILE.money = Math.min(999999, (PROFILE.money || 0) + m);
    PROFILE.gems = Math.min(99999, (PROFILE.gems || 0) + g);
  }
  rew.money = D.duel433 ? null : m; // duel: no gains (v4.33)
  rew.gems = g;
  queueSave();
  return rew;
}

/** Imposed team: riddle (the riddle's team) or Deep Echo (the expedition's team). */
export function fixedTeam() {
  if (scSel === 'duel433' && SCEN.duel433 && SCEN.duel433.t1) {
    return { team: SCEN.duel433.t1.slice(), voice: 0, opts: duelOpts() };
  } // local duel (v4.33)
  if (scSel === 'enigme431' && PUZZLE_CURRENT) {
    return { team: PUZZLE_CURRENT.a.map(x => x[0]), voice: 0, opts: puzzleOpts() };
  }
  if (scSel === 'echo431') {
    const R = echoRun();
    if (!R) {
      return null;
    }
    const team = R.team.filter(t => t[1] > 0).map(t => t[0]);
    if (!team.length) {
      return null;
    }
    return {
      team,
      voice: 0,
      opts: Object.assign(battleOpts(), { mut: null, challenges: [], fatigue: {}, fogOfWar: chosenFog() }),
    };
  }
  return null;
}

/* ---------- 1. fog of war ---------- */
export function chosenFog() {
  const D = SCEN[scSel] || {};
  return !!PREF.fogOfWar && !D.tuto && !D.hebdo429 && D.enigme431 == null && !D.rentalTeam;
}

export function fogVision(S) {
  const vu = new Set(),
    isNight = hourOf(S) === 'nuit';
  S.units
    .filter(a => a.side === 'a' && !a.ko)
    .forEach(a => {
      const r = Math.max(
        1,
        2 + (a.t.includes('Vol') || a.t.includes('Psy') ? 1 : 0) - (isNight && !seesAtNight(a) ? 1 : 0)
      );
      for (const k in S.tiles) {
        if (hdist(a.pos, P(k)) <= r) {
          vu.add(k);
        }
      }
    });
  return vu;
}

export function fogHidden(S, e, vu) {
  if (!S.fogOfWar || e.side !== 'e' || e.ko) {
    return false;
  }
  const k = uk(e);
  if (!vu.has(k)) {
    return true;
  }
  // in tall grass: you have to be in contact
  return !!(S.tiles[k] && S.tiles[k].grass && !S.units.some(a => a.side === 'a' && !a.ko && hdist(a.pos, e.pos) <= 1));
}

function fogRender() {
  const on = !!(B && B.fogOfWar && !B.over),
    vu = on ? fogVision(B) : null;
  bdClass('fog-of-war', on); // class of #bBoard, rendered by React
  if (L.t) {
    for (const k in L.t) {
      L.t[k].classList.toggle('fog-of-war-t', on && !vu.has(k));
    }
  }
  if (!B) {
    return;
  }
  // the veiled plates (#bPlE): rendered by React (Plates.jsx)
  B.units
    .filter(u => u.side === 'e')
    .forEach(u => {
      const c = on && fogHidden(B, u, vu),
        T = L.u && L.u[u.uid];
      if (T) {
        tokCl(T, 'fog-of-war', c);
      } // token classes: Units.jsx
    });
}

/* ---------- 2. tactical riddles ---------- */
function puzzleState() {
  return (PROFILE.riddleButton = PROFILE.riddleButton || { s: {}, n: {}, j: '', jd: [], cur: 0 });
}

function puzzleOfDay() {
  const d = today(),
    r = fingerprintRandom('enig-' + d),
    order = PUZZLES.map((x, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order.slice(0, 3);
}

function puzzleDef(i) {
  const x = PUZZLES[i];
  if (!x) {
    return null;
  }
  return { id: i, t: `n° ${i + 1}`, b: x[0], a: x[1], f: x[2] };
}

function puzzleLaunch(i) {
  const puzzle = puzzleDef(i);
  if (!puzzle) {
    return;
  }
  const E = puzzleState();
  E.cur = i;
  puzzlePrepare(puzzle);
  chooseBattle('enigme431');
  launch();
}

function puzzleAfter(S, rew, win) {
  const E = puzzleState(),
    i = SCEN[S.sc].enigme431,
    k = String(i);
  E.n[k] = (E.n[k] || 0) + 1;
  rew.riddleButton = { i, win, attempt: E.n[k] };
  if (!win) {
    return [0, 0];
  }
  const st = 1 + ((S.stats.voice || 0) === 0 ? 1 : 0) + (E.n[k] === 1 ? 1 : 0),
    previous = E.s[k] || 0;
  E.s[k] = Math.max(previous, st);
  rew.riddleButton.st = st;
  let m = 0,
    g = 0;
  if (!previous) {
    m += 150;
  }
  if (E.j !== today()) {
    E.j = today();
    E.jd = [];
  }
  if (puzzleOfDay().includes(i) && !E.jd.includes(i)) {
    E.jd.push(i);
    g += 3;
    rew.riddleButton.jour = 1;
  }
  return [m, g];
}

function puzzleHint() {
  const puzzle = PUZZLE_CURRENT,
    x = puzzle && PUZZLES[puzzle.id];
  if (!x) {
    return '';
  }
  return `Indice : commencez par ${BY[puzzle.a[x[3]][0]].n}.`;
}

function masteryChoice(b) {
  const K = Object.keys(MASTERY_DEFS);
  let h = 0;
  for (let i = 0; i < b.length; i++) {
    h = (h * 31 + b.charCodeAt(i)) >>> 0;
  }
  const a = h % K.length;
  return [K[a], K[(a + 1 + ((h >>> 5) % (K.length - 1))) % K.length]];
}

export function masteryDamageBonus(S, u, t, d) {
  if (!(d > 0) || !S) {
    return d;
  }
  let f = 1;
  const R = S.relicBag || [];
  if (u && u.side === 'a') {
    if (u.masteryPick === 'puissance') {
      f *= 1.08;
    }
    if (R.includes('braise')) {
      f *= 1.1;
    }
  }
  if (t && t.side === 'a') {
    if (t.masteryPick === 'garde') {
      f *= 0.92;
    }
    if (R.includes('ecaille')) {
      f *= 0.9;
    }
  }
  return f === 1 ? d : Math.max(1, Math.round(d * f));
}

export function masteryMoveBonus(S, u) {
  if (!S || !u || u.side !== 'a') {
    return 0;
  }
  return (u.masteryPick === 'vif' ? 1 : 0) + ((S.relicBag || []).includes('plume') ? 1 : 0);
}

export function echoRun() {
  return PROFILE.echo431 && PROFILE.echo431.run;
}

function echoMap(seed) {
  const r = fingerprintRandom('echo-' + seed),
    T = ['combat', 'combat', 'elite', 'soin', 'marchand', 'evenement'],
    map = [];
  for (let f = 0; f < 8; f++) {
    if (f === 7) {
      map.push(['boss']);
    } else if (f === 0) {
      map.push(['combat', 'combat']);
    } else {
      const n = r() < 0.5 ? 2 : 3,
        nodes = [];
      while (nodes.length < n) {
        const t = T[Math.floor(r() * T.length)];
        if (nodes.filter(x => x === t).length < (t === 'combat' ? 2 : 1)) {
          nodes.push(t);
        }
      }
      if (!nodes.includes('combat') && !nodes.includes('elite')) {
        nodes[0] = 'combat';
      }
      map.push(nodes);
    }
  }
  return map;
}

function echoLeave() {
  const team = squad.slice(0, 4).filter(id => BY[id]);
  if (team.length < 2) {
    return toast('Il faut au moins 2 Pokémon dans l’équipe.');
  }
  const X = (PROFILE.echo431 = PROFILE.echo431 || { best: 0, wins: 0, run: null }),
    seed = Math.floor(Math.random() * 2147483647);
  X.run = {
    seed,
    f: 0,
    team: team.map(id => [id, 1]),
    relics: [],
    echoes: 20,
    map: echoMap(seed),
    path: [],
    cur: -1,
    pv: 0,
    ev: '',
  };
  queueSave();
  toast('L’Écho profond s’ouvre : 8 étages, une seule vie.');
  renderCampPage();
}

function echoScene(R, type) {
  const r = fingerprintRandom('echo-f' + R.seed + '-' + R.f + '-' + R.path.length),
    pool = ECHO_POOL[Math.min(7, R.f)].filter(k => SCEN[k] && SCEN[k].foes),
    bk = pool[Math.floor(r() * pool.length)] || 'gue',
    b = SCEN[bk],
    el = type === 'elite',
    D = Object.assign({}, b, {
      n: `Écho profond · étage ${R.f + 1}`,
      lvl: `${ECHO_NODES[type][0]} · étage ${R.f + 1} / 8`,
      d: `${el ? 'Adversaires renforcés : une relique à la clé. ' : type === 'boss' ? 'Le gardien de l’Écho profond. ' : ''}Vos PV sont conservés d’un combat à l’autre ; un Pokémon K.O. quitte l’expédition.`,
      catch: false,
      echo431: type,
      noProgress: 1,
      hb: Math.round((b.hb || 20) * (el ? 1.3 : 1)),
      pb: (b.pb || 3) + (el ? 1 : 0),
    });
  PROGRESS_KEYS.forEach(x => delete D[x]);
  SCEN.echo431 = D;
  OBST.echo431 = OBST[bk] || {};
}

function echoNode(i) {
  const R = echoRun();
  if (!R || R.ev) {
    return;
  }
  const floor = R.map[R.f],
    t = floor && floor[i];
  if (!t) {
    return;
  }
  R.cur = i;
  if (t === 'combat' || t === 'elite' || t === 'boss') {
    echoScene(R, t);
    queueSave();
    chooseBattle('echo431');
    launch();
    return;
  }
  if (t === 'soin') {
    R.team.forEach(x => x[1] > 0 && (x[1] = Math.min(1, x[1] + 0.5)));
    toast('La Source soigne votre équipe : +50 % de PV.');
    echoAdvance(R);
  } else if (t === 'marchand') {
    R.ev = 'marchand';
  } else if (t === 'evenement') {
    R.ev = ['autel', 'source', 'passe', 'pari'][Math.floor(fingerprintRandom('ev' + R.seed + R.f)() * 4)];
  }
  queueSave();
  renderCampPage();
}

function echoAdvance(R) {
  R.path.push(R.cur);
  R.cur = -1;
  R.f++;
  R.ev = '';
  const X = PROFILE.echo431;
  X.best = Math.max(X.best || 0, R.f);
  queueSave();
}

function randomRelic(R, n) {
  const relics = Object.keys(RELIC_DEFS).filter(k => !R.relics.includes(k)),
    r = fingerprintRandom('rel' + R.seed + R.f + R.relics.length);
  for (let i = relics.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [relics[i], relics[j]] = [relics[j], relics[i]];
  }
  return relics.slice(0, n);
}

function echoEnd(R, hasWon) {
  const X = PROFILE.echo431,
    f = hasWon ? 8 : R.f,
    m = f * 300 + (hasWon ? 2500 : 0),
    g = f * 2 + (hasWon ? 20 : 0);
  X.best = Math.max(X.best || 0, f);
  if (hasWon) {
    X.wins = (X.wins || 0) + 1;
  }
  X.run = null;
  return [m, g, f];
}

function echoAfter(S, rew, win) {
  const R = echoRun();
  if (!R || R.cur < 0) {
    return [0, 0];
  }
  const type = R.map[R.f][R.cur],
    alive = R.team.filter(t => t[1] > 0),
    al = S.units.filter(u => u.side === 'a');
  al.forEach((u, i) => {
    const t = alive[i];
    if (!t) {
      return;
    }
    t[0] = BY[u.id] ? u.id : t[0]; // an evolution in battle stays in effect during the expedition
    t[1] = u.ko ? 0 : Math.max(0.01, u.hp / u.mhp);
  });
  rew.echo431 = { type, f: R.f + 1, win };
  if (!win || !R.team.some(t => t[1] > 0)) {
    const [m, g, f] = echoEnd(R, false);
    rew.echo431.fin = { f, m, g };
    return [m, g];
  }
  if (R.relics.includes('baie')) {
    R.team.forEach(t => t[1] > 0 && (t[1] = Math.min(1, t[1] + 0.15)));
  }
  const payout = Math.round(
    (type === 'elite' ? 35 : type === 'boss' ? 0 : 15 + R.f * 3) * (R.relics.includes('aimant') ? 1.5 : 1)
  );
  R.echoes += payout;
  rew.echo431.echoes = payout;
  if (type === 'boss') {
    R.path.push(R.cur);
    const [m, g] = echoEnd(R, true);
    rew.echo431.fin = { f: 8, m, g, gagne: 1 };
    pantheonEngrave(
      'echo',
      PANTHEON_STORE.echo,
      S.units.filter(u => u.side === 'a').map(u => u.id),
      S
    ); // Pantheon (v4.32)
    return [m, g];
  }
  if (type === 'elite') {
    R.ev = 'relique';
  } else {
    echoAdvance(R);
  }
  if (type === 'elite') {
    R.path.push(R.cur);
    R.f++;
    R.cur = -1;
    PROFILE.echo431.best = Math.max(PROFILE.echo431.best || 0, R.f);
  }
  return [0, 0];
}

function echoChoice(k) {
  const R = echoRun();
  if (!R) {
    return;
  }
  const hp = f => R.team.forEach(t => t[1] > 0 && (t[1] = Math.max(0.05, Math.min(1, t[1] + f))));
  if (k === 'autel-ok') {
    hp(-0.2);
    const x = randomRelic(R, 1)[0];
    if (x) {
      R.relics.push(x);
    }
    toast(x ? `Relique : ${RELIC_DEFS[x][0]}.` : 'L’autel est vide.');
  } else if (k === 'source-pv') {
    hp(0.3);
  } else if (k === 'source-ech') {
    R.echoes += 25;
  } else if (k === 'passe-pv') {
    R.pv = Math.min(0.5, (R.pv || 0) + 0.1);
  } else if (k === 'passe-ech') {
    R.echoes += 30;
  } else if (k === 'pari-ok') {
    if (fingerprintRandom('pari' + R.seed + R.f)() < 0.5) {
      R.echoes += 60;
      toast('Pile : +60 Échos !');
    } else {
      hp(-0.2);
      toast('Face : chaque Pokémon perd 20 % de PV.');
    }
  } else if (k.startsWith('rel-')) {
    const x = k.slice(4);
    if (RELIC_DEFS[x] && !R.relics.includes(x)) {
      R.relics.push(x);
    }
    R.ev = '';
    queueSave();
    return renderCampPage();
  } else if (k.startsWith('achat-')) {
    const a = k.slice(6),
      price = { potion: 20, relique: 45, rappel: 60 }[a];
    if (!price || R.echoes < price) {
      return toast('Pas assez d’Échos.');
    }
    if (a === 'rappel' && !R.team.some(t => t[1] <= 0)) {
      return toast('Aucun Pokémon à rappeler.');
    }
    R.echoes -= price;
    if (a === 'potion') {
      hp(0.3);
    } else if (a === 'relique') {
      const x = randomRelic(R, 1)[0];
      if (x) {
        R.relics.push(x);
      }
      toast(x ? `Relique : ${RELIC_DEFS[x][0]}.` : 'Plus de relique à vendre.');
    } else if (a === 'rappel') {
      const t = R.team.find(y => y[1] <= 0);
      t[1] = 0.3;
      toast(`${BY[t[0]].n} revient à 30 % de PV.`);
    }
    queueSave();
    return renderCampPage();
  }
  echoAdvance(R);
  renderCampPage();
}

/* ---------- 5. custom arenas ---------- */
function gymClean(a) {
  if (!a || typeof a !== 'object') {
    return null;
  }
  const f = Array.isArray(a.f) ? a.f.filter(id => typeof id === 'string' && BY[id] && !BY[id].leg).slice(0, 5) : [];
  if (!f.length || !SCEN[a.t] || !SCEN[a.t].foes) {
    return null;
  }
  return {
    id: typeof a.id === 'string' && /^[a-z0-9]{4,12}$/.test(a.id) ? a.id : Math.random().toString(36).slice(2, 10),
    n:
      String(a.n || 'Arène')
        .replace(/[<>&"]/g, '')
        .slice(0, 22) || 'Arène',
    author: String(a.author || '')
      .replace(/[<>&"]/g, '')
      .slice(0, 14),
    t: a.t,
    r: typeof a.r === 'string' && GYM_RULES().some(x => x[0] === a.r) ? a.r : '',
    h: a.h === 'nuit' ? 'nuit' : 'jour',
    lim: [6, 8, 10, 12].includes(a.lim) ? a.lim : 10,
    hb: [0, 10, 20, 30].includes(a.hb) ? a.hb : 10,
    f,
  };
}

function GYM_RULES() {
  const rules = [['', 'Aucune']];
  ARENAS.forEach((A, i) => A.rule && GYMS[i] && rules.push([A.rule, `Arène ${GYMS[i].t}`]));
  return rules;
}

function GYM_TERRAINS() {
  return [...new Set([...TERR, ...ARENAS.map(A => A.k)])].filter(k => SCEN[k] && SCEN[k].foes).map(k => [k, SCEN[k].n]);
}

function gymScene(a) {
  const b = SCEN[a.t];
  SCEN.perso431 = {
    n: a.n,
    lvl: `Arène personnalisée${a.author ? ' · ' + a.author : ''}`,
    lim: a.lim,
    time: a.h,
    bio: b.bio,
    water: (b.water || []).slice(),
    rock: (b.rock || []).slice(),
    rule: a.r || undefined,
    hb: a.hb,
    pb: 3,
    lv: 50,
    at: BY[a.f[0]].t[0],
    foes: a.f.map((id, i) => [id, RIVAL_POS[i]]),
    catch: false,
    perso431: a.id,
    noProgress: 1,
    d: `Arène créée${a.author ? ' par ' + a.author : ''}. Ni progression ni capture : 200 ₽ par victoire (3 par jour).`,
  };
  OBST.perso431 = OBST[a.t] || {};
}

function gymAfter(S, rew, win) {
  rew.perso431 = { win };
  if (!win) {
    return [0, 0];
  }
  const J = (PROFILE.gymJournal =
    PROFILE.gymJournal && PROFILE.gymJournal.d === today() ? PROFILE.gymJournal : { d: today(), n: 0 });
  if (J.n >= 3) {
    return [0, 0];
  }
  J.n++;
  rew.perso431.m = 200;
  return [200, 0];
}

function gymShareCode(a) {
  const o = { n: a.n, author: PROFILE.name || a.author || '', t: a.t, r: a.r, h: a.h, lim: a.lim, hb: a.hb, f: a.f };
  const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(o))))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return `ARN-${b64}-${codeChecksum(b64)}`;
}

function readGym(txt) {
  const m = String(txt || '')
    .replace(/\s+/g, '')
    .match(/ARN-([A-Za-z0-9_-]+)-([a-z0-9]{4})/);
  if (!m) {
    return null;
  }
  if (codeChecksum(m[1]) !== m[2]) {
    return null;
  }
  try {
    const b = m[1].replace(/-/g, '+').replace(/_/g, '/');
    return gymClean(migrateKeys(JSON.parse(decodeURIComponent(escape(atob(b + '==='.slice((b.length + 3) % 4)))))));
  } catch (e) {
    return null;
  }
}

// The Camp page is rendered by React (src/screens/camp): sub-tabs, Base camp, Outings,
// open tab. Here, we validate the tab then rebuild the page.
export function renderCampPage() {
  const t = CAMP_TABS.some(x => x[0] === V4.campTab) ? V4.campTab : 'base';
  V4.campTab = t;
  refreshCampPage(t === 'base');
}

/* ---------- after each battle render ---------- */
export function afterRenderFog() {
  if (!B) {
    return;
  }
  try {
    fogRender();
    // relic and fog badges, riddle button and phase: rendered by React (src/screens/combat/battle)
  } catch {
    /* Best effort: failure here is non-fatal. */
  }
}

/** Riddle: bottom bar text (read by src/screens/combat/battle/Foot.jsx). */
export function riddlePhase() {
  const E = puzzleState(),
    ess = PUZZLE_CURRENT ? E.n[String(PUZZLE_CURRENT.id)] || 0 : 0;
  return `Énigme : tout mettre K.O. en une manche.${ess ? ' ' + puzzleHint() : ''}`;
}

/* ---------- at startup: special battles exist (resuming a saved battle) ---------- */
export function challengeSetBoot() {
  const E = PROFILE.riddleButton;
  puzzlePrepare(puzzleDef(E && PUZZLES[E.cur] ? E.cur : 0));
  const R = echoRun();
  if (R && R.cur >= 0 && R.map[R.f]) {
    echoScene(R, R.map[R.f][R.cur]);
  } else if (!SCEN.echo431) {
    echoScene({ seed: 1, f: 0, path: [] }, 'combat');
  }
  const A = PROFILE.customGyms || [];
  gymScene(A[0] || { id: 'demo', n: 'Arène', author: '', t: 'gue', r: '', h: 'jour', lim: 10, hb: 10, f: ['onix'] });
}

/* riddles built and verified offline with the engine (an offline generator script): [terrain, allies [id, column, row, diamonds], opponents [id, column, row, HP], first ally of the solution] */
export const PUZZLES = [
  [
    'gue',
    [
      ['aquali', 1, 0, 0],
      ['drackhaus', 3, 4, 0],
      ['cochignon', 2, 2, 1],
    ],
    [
      ['marcacrin', 4, 3, 12],
      ['xatu', 2, 1, 19],
      ['maraiste', 3, 2, 19],
    ],
    1,
  ],
  [
    'gue',
    [
      ['cotovol', 2, 4, 1],
      ['reptincel', 1, 3, 3],
      ['magneton', 0, 2, 1],
    ],
    [
      ['gardevoir', 2, 2, 15],
      ['lainergie', 5, 2, 20],
    ],
    1,
  ],
  [
    'gue',
    [
      ['noctali', 1, 1, 1],
      ['gardevoir', 2, 2, 3],
      ['floravol', 1, 0, 1],
    ],
    [
      ['demolosse', 5, 2, 20],
      ['galifeu', 3, 2, 35],
    ],
    0,
  ],
  [
    'tour',
    [
      ['feurisson', 1, 3, 1],
      ['nosferalto', 1, 1, 3],
      ['flagadoss', 3, 3, 0],
    ],
    [
      ['cotovol', 3, 5, 18],
      ['melodelfe', 4, 1, 25],
    ],
    2,
  ],
  [
    'roche',
    [
      ['flobio', 3, 0, 3],
      ['pikachu', 2, 4, 3],
      ['drackhaus', 1, 1, 0],
    ],
    [
      ['porygon2', 5, 2, 11],
      ['papilusion', 5, 3, 17],
    ],
    0,
  ],
  [
    'gue',
    [
      ['maraiste', 2, 3, 0],
      ['xatu', 3, 1, 0],
      ['kadabra', 3, 3, 1],
    ],
    [
      ['pharamp', 4, 5, 17],
      ['typhlosion', 5, 3, 22],
    ],
    2,
  ],
  [
    'tour',
    [
      ['spectrum', 3, 3, 3],
      ['carabaffe', 0, 5, 0],
      ['magneton', 1, 1, 0],
    ],
    [
      ['fantominus', 4, 4, 25],
      ['foretress', 5, 2, 16],
    ],
    1,
  ],
  [
    'gue',
    [
      ['papilusion', 2, 1, 1],
      ['nostenfer', 0, 3, 1],
      ['pikachu', 3, 5, 3],
    ],
    [
      ['mackogneur', 2, 3, 14],
      ['noctali', 2, 2, 51],
    ],
    0,
  ],
  [
    'roche',
    [
      ['carabaffe', 1, 4, 3],
      ['cochignon', 2, 4, 1],
      ['galeking', 3, 5, 1],
    ],
    [
      ['pharamp', 5, 3, 42],
      ['marcacrin', 3, 2, 21],
    ],
    1,
  ],
  [
    'tour',
    [
      ['kirlia', 1, 4, 0],
      ['herbizarre', 2, 2, 3],
      ['raichu', 2, 0, 0],
    ],
    [
      ['aligatueur', 3, 1, 37],
      ['carabaffe', 3, 3, 25],
    ],
    0,
  ],
  [
    'tour',
    [
      ['papilusion', 1, 4, 0],
      ['tetarte', 2, 1, 0],
      ['kadabra', 2, 0, 3],
    ],
    [
      ['kokiyas', 5, 4, 20],
      ['gardevoir', 2, 3, 26],
    ],
    0,
  ],
  [
    'tour',
    [
      ['flobio', 1, 1, 3],
      ['lanturn', 1, 4, 0],
      ['macronium', 1, 5, 0],
    ],
    [
      ['absol', 2, 1, 20],
      ['feurisson', 3, 5, 33],
    ],
    0,
  ],
  [
    'gue',
    [
      ['spectrum', 1, 5, 3],
      ['porygon2', 1, 1, 0],
      ['tygnon', 3, 2, 0],
    ],
    [
      ['drattak', 5, 2, 45],
      ['salameche', 4, 0, 21],
    ],
    2,
  ],
  [
    'roche',
    [
      ['galegon', 1, 0, 0],
      ['tortank', 2, 5, 1],
      ['kadabra', 2, 0, 3],
    ],
    [
      ['axoloto', 3, 0, 27],
      ['laggron', 3, 4, 21],
    ],
    1,
  ],
  [
    'tour',
    [
      ['xatu', 3, 5, 1],
      ['azumarill', 0, 5, 1],
      ['flobio', 2, 2, 3],
    ],
    [
      ['cochignon', 4, 1, 35],
      ['arcko', 5, 4, 18],
    ],
    2,
  ],
  [
    'tour',
    [
      ['kirlia', 0, 0, 3],
      ['cizayox', 0, 5, 3],
      ['volcaropod', 0, 1, 1],
    ],
    [
      ['flagadoss', 5, 2, 12],
      ['mackogneur', 3, 5, 20],
    ],
    1,
  ],
  [
    'gue',
    [
      ['flagadoss', 2, 3, 1],
      ['draco', 3, 5, 1],
      ['flobio', 3, 1, 3],
    ],
    [
      ['pyroli', 4, 2, 34],
      ['migalos', 3, 2, 38],
    ],
    1,
  ],
  [
    'tour',
    [
      ['raichu', 1, 4, 3],
      ['kirlia', 1, 5, 3],
      ['mentali', 2, 4, 3],
    ],
    [
      ['kaiminus', 5, 1, 26],
      ['kadabra', 4, 0, 23],
      ['voltali', 2, 0, 21],
    ],
    2,
  ],
  [
    'roche',
    [
      ['leviator', 2, 2, 0],
      ['drattak', 0, 3, 3],
      ['pikachu', 1, 2, 1],
    ],
    [
      ['embrylex', 3, 5, 37],
      ['cizayox', 5, 0, 24],
    ],
    1,
  ],
  [
    'gue',
    [
      ['flobio', 2, 4, 3],
      ['volcaropod', 0, 4, 3],
      ['noctali', 3, 4, 3],
    ],
    [
      ['machopeur', 5, 2, 16],
      ['kirlia', 2, 2, 34],
    ],
    0,
  ],
  [
    'gue',
    [
      ['spectrum', 1, 5, 3],
      ['galegon', 0, 2, 1],
      ['nostenfer', 2, 2, 0],
    ],
    [
      ['tarsal', 4, 4, 21],
      ['drackhaus', 3, 1, 36],
    ],
    0,
  ],
  [
    'tour',
    [
      ['reptincel', 2, 4, 3],
      ['kirlia', 1, 1, 3],
      ['galegon', 3, 2, 3],
    ],
    [
      ['hericendre', 5, 3, 10],
      ['flagadoss', 5, 0, 31],
    ],
    0,
  ],
  [
    'roche',
    [
      ['ymphect', 2, 2, 3],
      ['reptincel', 1, 5, 3],
      ['melodelfe', 3, 4, 0],
    ],
    [
      ['minidraco', 5, 5, 9],
      ['magicarpe', 4, 1, 19],
    ],
    1,
  ],
  [
    'roche',
    [
      ['reptincel', 0, 1, 3],
      ['aquali', 2, 4, 1],
      ['flobio', 3, 2, 1],
    ],
    [
      ['voltali', 2, 5, 16],
      ['debugant', 4, 1, 26],
    ],
    1,
  ],
  [
    'gue',
    [
      ['meganium', 3, 4, 3],
      ['drattak', 0, 1, 1],
      ['tortank', 0, 3, 1],
    ],
    [
      ['arcko', 3, 0, 42],
      ['alakazam', 5, 5, 21],
    ],
    0,
  ],
  [
    'roche',
    [
      ['demolosse', 1, 3, 1],
      ['cochignon', 1, 0, 1],
      ['spectrum', 0, 1, 0],
    ],
    [
      ['reptincel', 4, 5, 21],
      ['crustabri', 4, 1, 20],
    ],
    0,
  ],
  [
    'tour',
    [
      ['drackhaus', 2, 5, 0],
      ['gardevoir', 1, 1, 0],
      ['jungko', 0, 3, 0],
    ],
    [
      ['scarhino', 2, 3, 31],
      ['pyroli', 4, 1, 22],
    ],
    0,
  ],
  [
    'gue',
    [
      ['leviator', 2, 3, 0],
      ['draco', 3, 5, 3],
      ['papilusion', 0, 5, 1],
    ],
    [
      ['jungko', 3, 2, 15],
      ['evoli', 2, 1, 16],
      ['tetarte', 2, 4, 28],
    ],
    2,
  ],
  [
    'tour',
    [
      ['leviator', 2, 5, 3],
      ['gardevoir', 0, 1, 1],
      ['reptincel', 3, 3, 3],
    ],
    [
      ['wattouat', 5, 1, 14],
      ['germignon', 5, 2, 30],
      ['mackogneur', 4, 3, 16],
    ],
    0,
  ],
  [
    'roche',
    [
      ['noarfang', 0, 0, 3],
      ['gardevoir', 0, 3, 3],
      ['drackhaus', 1, 4, 3],
    ],
    [
      ['spectrum', 2, 2, 37],
      ['cotovol', 5, 1, 14],
    ],
    1,
  ],
  [
    'tour',
    [
      ['foretress', 3, 2, 3],
      ['flobio', 0, 2, 0],
      ['herbizarre', 0, 1, 3],
    ],
    [
      ['aquali', 2, 2, 44],
      ['pichu', 4, 0, 13],
    ],
    2,
  ],
  [
    'roche',
    [
      ['migalos', 2, 1, 3],
      ['porygon2', 0, 5, 0],
      ['draco', 3, 0, 3],
    ],
    [
      ['scarhino', 5, 1, 14],
      ['wattouat', 3, 2, 18],
      ['evoli', 3, 4, 21],
    ],
    1,
  ],
  [
    'roche',
    [
      ['drackhaus', 1, 0, 1],
      ['lanturn', 2, 0, 0],
      ['tortank', 3, 0, 1],
    ],
    [
      ['absol', 2, 3, 20],
      ['macronium', 5, 2, 9],
      ['raichu', 2, 1, 15],
    ],
    0,
  ],
  [
    'tour',
    [
      ['leviator', 0, 1, 3],
      ['reptincel', 1, 4, 3],
      ['alakazam', 3, 2, 0],
    ],
    [
      ['tenefix', 4, 0, 14],
      ['crocrodil', 2, 1, 39],
    ],
    1,
  ],
  [
    'tour',
    [
      ['raichu', 2, 3, 3],
      ['pyroli', 1, 1, 1],
      ['ectoplasma', 1, 2, 0],
    ],
    [
      ['tarpaud', 2, 1, 23],
      ['raichu', 3, 2, 23],
      ['galekid', 3, 3, 40],
    ],
    1,
  ],
  [
    'tour',
    [
      ['draco', 3, 5, 0],
      ['florizarre', 0, 0, 0],
      ['kadabra', 1, 4, 1],
    ],
    [
      ['natu', 2, 1, 12],
      ['malosse', 4, 1, 19],
    ],
    1,
  ],
  [
    'tour',
    [
      ['feurisson', 0, 1, 3],
      ['aquali', 2, 1, 0],
      ['galegon', 1, 1, 1],
    ],
    [
      ['noctali', 2, 0, 15],
      ['melodelfe', 4, 4, 35],
    ],
    1,
  ],
  [
    'gue',
    [
      ['cochignon', 1, 5, 1],
      ['xatu', 0, 5, 3],
      ['floravol', 2, 2, 3],
    ],
    [
      ['tenefix', 3, 5, 28],
      ['mackogneur', 3, 0, 28],
    ],
    0,
  ],
  [
    'gue',
    [
      ['lanturn', 1, 5, 1],
      ['feurisson', 3, 5, 0],
      ['draco', 2, 4, 1],
    ],
    [
      ['galeking', 4, 0, 8],
      ['galeking', 5, 4, 67],
    ],
    2,
  ],
  [
    'roche',
    [
      ['pikachu', 0, 2, 1],
      ['feurisson', 3, 0, 3],
      ['cizayox', 2, 2, 1],
    ],
    [
      ['tenefix', 5, 2, 43],
      ['galekid', 3, 4, 21],
    ],
    1,
  ],
  [
    'roche',
    [
      ['tarpaud', 2, 4, 0],
      ['draco', 0, 0, 3],
      ['crocrodil', 3, 5, 3],
    ],
    [
      ['kirlia', 2, 5, 14],
      ['meganium', 2, 2, 25],
    ],
    0,
  ],
  [
    'roche',
    [
      ['drackhaus', 2, 3, 1],
      ['kicklee', 1, 1, 0],
      ['tetarte', 1, 4, 1],
    ],
    [
      ['galifeu', 3, 4, 12],
      ['roucarnage', 5, 0, 25],
    ],
    0,
  ],
  [
    'roche',
    [
      ['raichu', 1, 1, 0],
      ['tartard', 2, 0, 3],
      ['drattak', 2, 1, 3],
    ],
    [
      ['chenipan', 3, 2, 36],
      ['porygon2', 4, 3, 27],
    ],
    0,
  ],
  [
    'gue',
    [
      ['mentali', 0, 1, 0],
      ['crocrodil', 0, 2, 3],
      ['ymphect', 1, 0, 1],
    ],
    [
      ['volcaropod', 3, 1, 31],
      ['natu', 2, 2, 17],
      ['evoli', 4, 4, 26],
    ],
    1,
  ],
  [
    'roche',
    [
      ['kapoera', 0, 1, 0],
      ['nostenfer', 2, 1, 0],
      ['migalos', 0, 5, 0],
    ],
    [
      ['mentali', 3, 4, 23],
      ['absol', 3, 2, 41],
    ],
    2,
  ],
  [
    'roche',
    [
      ['alakazam', 1, 5, 0],
      ['ectoplasma', 1, 1, 1],
      ['dracaufeu', 2, 4, 0],
    ],
    [
      ['lanturn', 4, 5, 31],
      ['galeking', 2, 2, 19],
    ],
    0,
  ],
  [
    'gue',
    [
      ['raichu', 2, 1, 1],
      ['brasegali', 1, 2, 1],
      ['kicklee', 1, 0, 1],
    ],
    [
      ['arcanin', 4, 2, 35],
      ['granivol', 3, 0, 22],
    ],
    0,
  ],
  [
    'roche',
    [
      ['flobio', 3, 4, 3],
      ['floravol', 2, 4, 1],
      ['meganium', 1, 4, 3],
    ],
    [
      ['phanpy', 4, 0, 10],
      ['roucoups', 2, 0, 17],
    ],
    1,
  ],
  [
    'roche',
    [
      ['leviator', 1, 1, 1],
      ['voltali', 1, 3, 0],
      ['massko', 0, 1, 3],
    ],
    [
      ['kapoera', 2, 1, 25],
      ['pyroli', 2, 4, 35],
    ],
    1,
  ],
  [
    'roche',
    [
      ['feurisson', 1, 0, 3],
      ['flobio', 1, 1, 3],
      ['noarfang', 3, 5, 1],
    ],
    [
      ['nosferapti', 3, 2, 10],
      ['brasegali', 3, 4, 35],
    ],
    2,
  ],
  [
    'roche',
    [
      ['spectrum', 0, 1, 3],
      ['nosferalto', 2, 0, 3],
      ['tortank', 2, 3, 3],
    ],
    [
      ['tarsal', 2, 2, 17],
      ['phanpy', 5, 2, 20],
    ],
    1,
  ],
  [
    'roche',
    [
      ['feurisson', 3, 4, 3],
      ['noctali', 2, 4, 3],
      ['draco', 2, 2, 0],
    ],
    [
      ['aquali', 3, 5, 24],
      ['insecateur', 5, 3, 15],
    ],
    1,
  ],
  [
    'gue',
    [
      ['aquali', 1, 3, 1],
      ['carabaffe', 0, 0, 1],
      ['floravol', 1, 4, 3],
    ],
    [
      ['demolosse', 3, 3, 33],
      ['insecateur', 5, 5, 20],
      ['nosferapti', 3, 2, 18],
    ],
    2,
  ],
  [
    'tour',
    [
      ['reptincel', 0, 5, 1],
      ['typhlosion', 0, 1, 3],
      ['herbizarre', 2, 3, 3],
    ],
    [
      ['limagma', 3, 2, 10],
      ['pikachu', 2, 2, 29],
      ['leviator', 2, 4, 18],
    ],
    1,
  ],
  [
    'gue',
    [
      ['dracaufeu', 2, 3, 0],
      ['nosferalto', 1, 1, 1],
      ['tetarte', 3, 0, 1],
    ],
    [
      ['drackhaus', 5, 1, 28],
      ['voltali', 5, 0, 23],
    ],
    1,
  ],
  [
    'gue',
    [
      ['melodelfe', 2, 2, 1],
      ['nosferalto', 0, 2, 3],
      ['kapoera', 3, 2, 1],
    ],
    [
      ['laggron', 4, 0, 38],
      ['mentali', 5, 2, 19],
    ],
    0,
  ],
  [
    'gue',
    [
      ['tyranocif', 3, 4, 0],
      ['aquali', 3, 2, 1],
      ['feurisson', 0, 3, 0],
    ],
    [
      ['tarsal', 4, 3, 21],
      ['drattak', 2, 4, 20],
    ],
    1,
  ],
  [
    'tour',
    [
      ['floravol', 0, 0, 0],
      ['herbizarre', 2, 5, 3],
      ['roigada', 2, 2, 1],
    ],
    [
      ['magneti', 2, 0, 8],
      ['machopeur', 5, 3, 21],
    ],
    0,
  ],
  [
    'tour',
    [
      ['draco', 2, 3, 3],
      ['florizarre', 1, 2, 3],
      ['steelix', 2, 0, 0],
    ],
    [
      ['kicklee', 5, 3, 24],
      ['tarpaud', 3, 1, 24],
    ],
    0,
  ],
  [
    'tour',
    [
      ['aligatueur', 1, 5, 0],
      ['feurisson', 3, 3, 3],
      ['kirlia', 0, 0, 0],
    ],
    [
      ['roucarnage', 4, 1, 15],
      ['jungko', 4, 4, 22],
      ['crustabri', 2, 0, 16],
    ],
    0,
  ],
];

const clampInt = (x, lo, hi) => (Number.isFinite(x) ? Math.max(lo, Math.min(hi, Math.floor(x))) : lo);

/* ---------- 3. family mastery ---------- */
const MASTERY_DEFS = {
  puissance: ['Puissance', '+8 % de dégâts infligés'],
  robuste: ['Robustesse', '+10 % de PV maximum'],
  vif: ['Vivacité', '+1 Mouvement'],
  eveil: ['Éveil précoce', 'Commence avec 1 losange de plus'],
  garde: ['Garde', '−8 % de dégâts subis'],
};

export const MASTERY_THRESHOLD = 10;

/* ---------- 4. Deep Echo ---------- */
const RELIC_DEFS = {
  plume: ['Plume vive', '+1 Mouvement pour toute l’équipe.'],
  braise: ['Cœur ardent', '+10 % de dégâts infligés.'],
  ecaille: ['Écaille', '−10 % de dégâts subis.'],
  diapason: ['Diapason', 'Chaque Pokémon commence avec 1 losange de plus.'],
  cloche: ['Cloche claire', '+1 Voix maximum.'],
  baie: ['Baie dorée', 'Après chaque combat, +15 % de PV.'],
  aimant: ['Aimant à Échos', '+50 % d’Échos gagnés.'],
  talisman: ['Talisman', 'Chaque Pokémon survit une fois à un coup fatal par combat.'],
};

const ECHO_POOL = [
  ['gue', 'roche', 'a1', 'a2'],
  ['a3', 'a4', 'tour', 'td1'],
  ['a5', 'a6', 'j1', 'j2'],
  ['a7', 'j3', 'j4', 'h1'],
  ['a8', 'j5', 'j6', 'h2', 'h3'],
  ['j7', 'h4', 'h5', 'jd2'],
  ['j8', 'h6', 'h7', 'jd4'],
  ['jchamp', 'hchamp', 'lgraikou', 'lgentei', 'lgsuicune'],
];

const ECHO_NODES = {
  combat: ['Combat', 'i-fight'],
  elite: ['Élite', 'i-star'],
  soin: ['Source', 'i-heal'],
  marchand: ['Marchand', 'i-shop'],
  evenement: ['Événement', 'i-quest'],
  boss: ['Gardien', 'i-trophy'],
};

const ECHO_EVENTS = {
  autel: [
    'Autel brisé',
    'Une relique repose sur un autel fissuré. La prendre coûte 20 % des PV de chaque Pokémon.',
    [
      ['Prendre la relique', 'autel-ok'],
      ['Passer son chemin', 'passer'],
    ],
  ],
  source: [
    'Source claire',
    'Une eau limpide chante doucement.',
    [
      ['Boire (+30 % de PV)', 'source-pv'],
      ['Remplir les gourdes (+25 Échos)', 'source-ech'],
    ],
  ],
  passe: [
    'Écho du passé',
    'Un souvenir de vos premiers combats vous revient.',
    [
      ['S’en inspirer (+10 % de PV max pour l’expédition)', 'passe-pv'],
      ['Le vendre (+30 Échos)', 'passe-ech'],
    ],
  ],
  pari: [
    'Le Pari',
    'Un dresseur masqué propose un jeu : pile, 60 Échos ; face, chaque Pokémon perd 20 % de PV.',
    [
      ['Jouer', 'pari-ok'],
      ['Refuser', 'passer'],
    ],
  ],
};

/* ---------- the Camp tab, in sub-tabs ---------- */
export const CAMP_TABS = [
  ['base', 'Base'],
  ['enigmes', 'Énigmes'],
  ['echo', 'Écho profond'],
  ['arenes', 'Arènes'],
  ['maitrise', 'Maîtrise'],
];

// Statements run at startup, in the original order (see index.js).
export function init() {
  /* ---------- tactical riddles: construction (shared with the generator) ---------- */
  // A riddle: P = { id, t, b (terrain), a: [[id, c, r, diamonds]], f: [[id, c, r, HP]] }
  PUZZLE_CURRENT = null;

  HOOKS.creation.push((S, opt, D0) => {
    if (D0 && (D0.noProgress || D0.hebdo429)) {
      S.restricted = 1;
    } // no companion nor Daycare
  });

  HOOKS.combat.push(S => {
    const puzzle = PUZZLE_CURRENT;
    if (S.sc !== 'enigme431' || !puzzle) {
      return;
    }
    const al = S.units.filter(u => u.side === 'a'),
      fo = S.units.filter(u => u.side === 'e');
    puzzle.a.forEach(([, c, r, en], i) => {
      const u = al[i];
      if (!u) {
        return;
      }
      u.pos = [c, r];
      u.en = Math.max(0, Math.min(EMAX, en || 0));
    });
    puzzle.f.forEach(([, c, r, hp], i) => {
      const u = fo[i];
      if (!u) {
        return;
      }
      u.pos = [c, r]; // the riddle's position, not the one chosen by the AI
      if (hp) {
        u.hp = Math.max(1, Math.min(u.mhp, hp));
      }
    });
    S.lim = 1;
  });

  HOOKS.combat.push((S, opt) => {
    if (opt && opt.fogOfWar) {
      S.fogOfWar = 1;
    }
  });

  // a hidden tile: no information about the opponent standing there (you can still aim blindly)
  $('#bSvg').addEventListener(
    'click',
    e => {
      if (!B || !B.fogOfWar || B.over || B.deployPhase || ui.mode) {
        return;
      }
      const p = e.target.closest('[data-k]');
      if (!p) {
        return;
      }
      const u = uAt(B, p.dataset.k);
      if (u && fogHidden(B, u, fogVision(B))) {
        e.stopPropagation();
        toast('Brouillard : rien en vue ici.');
      }
    },
    true
  );

  HOOKS.progress.push((S, rew, win) => {
    if (!S.fogOfWar) {
      return null;
    }
    rew.fogOfWar = 1;
    if (!win) {
      return null;
    }
    const m = Math.round(((rew.money || 0) * 0.25) / 10) * 10;
    rew.fogReward = m;
    return m ? [m, 0] : null;
  });

  HOOKS.battleResult.push(r =>
    r.fogOfWar
      ? `<div class="res-l"><h4>Brouillard de guerre</h4><div class="rl"><span>${r.fogReward ? 'Victoire à l’aveugle' : 'Combat dans le brouillard'}</span><b>${r.fogReward ? '+' + fmt(r.fogReward) + ' ₽' : ''}</b></div></div>`
      : ''
  );

  HOOKS.battleResult.push(r => {
    const e = r.riddleButton;
    if (!e) {
      return '';
    }
    const et = n => '★'.repeat(n) + '☆'.repeat(3 - n);
    return `<div class="res-l"><h4>Énigme n° ${e.i + 1}</h4><div class="rl"><span>${e.win ? `Résolue ${et(e.st)} · ${e.st === 3 ? 'du premier coup, sans Voix' : e.st === 2 ? (e.attempt === 1 ? 'du premier coup' : 'sans dépenser de Voix') : 'réussie'}${e.jour ? ' · énigme du jour : +3 Éclats' : ''}` : `Ratée (essai ${e.attempt}). Changez l’ordre de vos Pokémon et visez les mêmes cibles.`}</span><b>${e.win ? et(e.st) : ''}</b></div></div>`;
  });

  // in a riddle, ending your turn without having won means losing (opponents do not play)
  document.addEventListener(
    'click',
    e => {
      if (!B || B.over || B.sc !== 'enigme431' || !e.target.closest('#bEnd') || ui.busy) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      B.over = 'lose';
      B.timeout = true;
      finish();
    },
    true
  );

  document.addEventListener('click', e => {
    const b = e.target.closest('[data-riddle-button]');
    if (!b) {
      return;
    }
    puzzleLaunch(+b.dataset.riddleButton);
  });

  HOOKS.progress.push((S, rew) => {
    const D = SCEN[S.sc] || {};
    if (D.tuto || D.rentalTeam) {
      return null;
    }
    const M = (PROFILE.masteryTrack = PROFILE.masteryTrack || {}),
      readyList = [];
    S.units
      .filter(u => u.side === 'a' && BY[u.sp])
      .forEach(u => {
        const x = (M[u.sp] = M[u.sp] || { n: 0, p: '' });
        x.n++;
        if (x.n === MASTERY_THRESHOLD && !x.p) {
          readyList.push(u.sp);
        }
      });
    if (readyList.length) {
      rew.masteryTrack = readyList;
    }
    return null;
  });

  HOOKS.battleResult.push(r =>
    r.masteryTrack
      ? `<div class="res-l"><h4>Maîtrise</h4><div class="rl"><span>${r.masteryTrack.map(b => BY[b].n).join(', ')} : un bonus de maîtrise est à choisir (Camp › Maîtrise).</span><b>★</b></div></div>`
      : ''
  );

  HOOKS.combat.push(S => {
    if (S.restricted && S.sc !== 'echo431') {
      return;
    }
    const M = PROFILE.masteryTrack || {};
    S.units
      .filter(u => u.side === 'a')
      .forEach(u => {
        const p = M[u.sp] && M[u.sp].p;
        if (!p || !MASTERY_DEFS[p]) {
          return;
        }
        u.masteryPick = p;
        if (p === 'robuste') {
          u.mhp = Math.round(u.mhp * 1.1);
          u.hp = Math.min(u.mhp, Math.round(u.hp * 1.1));
        } else if (p === 'eveil') {
          u.en = Math.min(EMAX, (u.en || 0) + 1);
        }
      });
  });

  document.addEventListener('click', e => {
    const b = e.target.closest('[data-mastery-track]');
    if (!b) {
      return;
    }
    const base = b.dataset.masteryTrack,
      k = b.dataset.k,
      M = (PROFILE.masteryTrack = PROFILE.masteryTrack || {}),
      x = M[base];
    if (!x || x.n < MASTERY_THRESHOLD || !MASTERY_DEFS[k] || !masteryChoice(base).includes(k)) {
      return;
    }
    if (x.p && x.p !== k) {
      if ((PROFILE.money || 0) < 500) {
        return toast('Il faut 500 ₽ pour changer de maîtrise.');
      }
      PROFILE.money -= 500;
    }
    x.p = k;
    toast(`${BY[base].n} : ${MASTERY_DEFS[k][0]}.`);
    queueSave();
    renderWallet();
    renderCampPage();
  });

  HOOKS.combat.push(S => {
    if (S.sc !== 'echo431') {
      return;
    }
    const R = echoRun();
    if (!R) {
      return;
    }
    S.echo431 = 1;
    S.relicBag = R.relics.slice();
    const alive = R.team.filter(t => t[1] > 0),
      al = S.units.filter(u => u.side === 'a');
    al.forEach((u, i) => {
      const t = alive[i];
      if (!t) {
        return;
      }
      if (R.pv) {
        u.mhp = Math.round(u.mhp * (1 + R.pv));
      }
      u.hp = Math.max(1, Math.round(u.mhp * t[1]));
      if (S.relicBag.includes('diapason')) {
        u.en = Math.min(EMAX, (u.en || 0) + 1);
      }
      if (S.relicBag.includes('talisman')) {
        u.sturdy = true;
      }
    });
    if (S.relicBag.includes('cloche')) {
      S.vmax += 1;
      S.voice += 1;
    }
  });

  HOOKS.battleResult.push(r => {
    const e = r.echo431;
    if (!e) {
      return '';
    }
    if (e.fin) {
      return `<div class="res-l"><h4>Écho profond</h4><div class="rl"><span>${e.fin.gagne ? 'Le gardien est vaincu : expédition réussie !' : `Expédition terminée à l’étage ${e.fin.f + (e.fin.gagne ? 0 : 1)}.`} Récompense : ${fmt(e.fin.m)} ₽ · ${e.fin.g} Éclats.</span><b>${e.fin.gagne ? '★' : ''}</b></div></div>`;
    }
    return `<div class="res-l"><h4>Écho profond</h4><div class="rl"><span>Étage ${e.f} franchi${e.echoes ? ` · +${e.echoes} Échos` : ''}${e.type === 'elite' ? ' · une relique vous attend au Camp' : ''}. Vos PV sont conservés.</span><b>${e.f} / 8</b></div></div>`;
  });

  // after a Deep Echo battle: back to the expedition map (no « Rejouer » (Replay))
  document.addEventListener(
    'click',
    e => {
      const b = e.target.closest('#cbResult [data-res]');
      if (!b || !B || B.sc !== 'echo431') {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      backToPrep();
      __set_scSel('gue');
      V4.campTab = 'echo';
      go('camp');
    },
    true
  );

  document.addEventListener('click', e => {
    const b = e.target.closest('[data-echo431]');
    if (!b) {
      return;
    }
    const a = b.dataset.echo431;
    if (a === 'partir') {
      echoLeave();
    } else if (a === 'abandon') {
      const R = echoRun();
      if (!R) {
        return;
      }
      if (!b.dataset.ok) {
        b.dataset.ok = '1';
        b.textContent = 'Confirmer l’abandon';
        return;
      }
      const [m, g, f] = echoEnd(R, false);
      PROFILE.money = Math.min(999999, (PROFILE.money || 0) + m);
      PROFILE.gems = Math.min(99999, (PROFILE.gems || 0) + g);
      toast(`Expédition abandonnée à l’étage ${f + 1} : ${fmt(m)} ₽ · ${g} Éclats.`);
      queueSave();
      renderWallet();
      renderCampPage();
    } else if (a.startsWith('n')) {
      echoNode(+a.slice(1));
    } else {
      echoChoice(a);
    }
  });

  HOOKS.battleResult.push(r =>
    r.perso431
      ? `<div class="res-l"><h4>Arène personnalisée</h4><div class="rl"><span>${r.perso431.win ? (r.perso431.m ? 'Victoire récompensée' : 'Victoire (déjà 3 récompenses aujourd’hui)') : 'Défaite'}</span><b>${r.perso431.m ? '+200 ₽' : ''}</b></div></div>`
      : ''
  );

  GYM_EDITOR = null;

  document.addEventListener('change', e => {
    const x = e.target.closest('[data-ar]');
    if (!x || !GYM_EDITOR || !GYM_EDITOR.a) {
      return;
    }
    const k = x.dataset.ar,
      E = GYM_EDITOR.a;
    if (/^f\d$/.test(k)) {
      E.f[+k[1]] = x.value;
    } else if (k === 'lim' || k === 'hb') {
      E[k] = +x.value;
    } else {
      E[k] = x.value;
    }
  });

  document.addEventListener('input', e => {
    const x = e.target.closest('[data-ar="n"]');
    if (x && GYM_EDITOR && GYM_EDITOR.a) {
      GYM_EDITOR.a.n = x.value;
    }
  });

  document.addEventListener('click', e => {
    const b = e.target.closest('[data-gym-arena]');
    if (!b) {
      return;
    }
    const a = b.dataset.gymArena,
      i = +b.dataset.i,
      A = (PROFILE.customGyms = PROFILE.customGyms || []);
    if (a === 'new') {
      if (A.length >= 12) {
        return toast('12 arènes au plus : supprimez-en une.');
      }
      GYM_EDITOR = {
        i: -1,
        a: { n: 'Mon arène', t: 'gue', r: '', h: 'jour', lim: 10, hb: 10, f: ['onix', 'racaillou', '', '', ''] },
      };
    } else if (a === 'edit' && A[i]) {
      GYM_EDITOR = { i, a: Object.assign({}, A[i], { f: [...A[i].f, '', '', '', '', ''].slice(0, 5) }) };
    } else if (a === 'annuler') {
      GYM_EDITOR = null;
    } else if (a === 'save' && GYM_EDITOR) {
      const c = gymClean(
        Object.assign({}, GYM_EDITOR.a, { f: GYM_EDITOR.a.f.filter(Boolean), author: PROFILE.name || '' })
      );
      if (!c) {
        return toast('Choisissez au moins un adversaire.');
      }
      if (GYM_EDITOR.i >= 0) {
        A[GYM_EDITOR.i] = Object.assign(c, { id: A[GYM_EDITOR.i].id });
      } else {
        A.unshift(c);
      }
      GYM_EDITOR = null;
      queueSave();
      toast('Arène enregistrée.');
    } else if (a === 'suppr' && A[i]) {
      if (!b.dataset.ok) {
        b.dataset.ok = '1';
        b.textContent = 'Confirmer';
        return;
      }
      A.splice(i, 1);
      queueSave();
    } else if (a === 'code' && A[i]) {
      GYM_EDITOR = { code: i };
    } else if (a === 'copier' && A[i]) {
      const t = gymShareCode(A[i]);
      try {
        navigator.clipboard.writeText(t).then(
          () => toast('Code copié.'),
          () => toast('Sélectionnez le code et copiez-le.')
        );
      } catch (er) {
        toast('Sélectionnez le code et copiez-le.');
      }
      return;
    } else if (a === 'import') {
      const v = (document.getElementById('gym-code') || {}).value,
        c = readGym(v);
      if (!c) {
        return toast('Code d’arène illisible. Il commence par « ARN- ».');
      }
      if (A.length >= 12) {
        return toast('12 arènes au plus : supprimez-en une.');
      }
      A.unshift(c);
      queueSave();
      toast(`Arène « ${c.n} » ajoutée.`);
    } else if (a === 'jouer' && A[i]) {
      gymScene(A[i]);
      openBattle('perso431');
      return;
    }
    renderCampPage();
  });

  document.addEventListener('click', e => {
    const b = e.target.closest('[data-camp-tab]');
    if (!b) {
      return;
    }
    V4.campTab = b.dataset.campTab;
    renderCampPage();
  });

  challengeSetBoot();

  document.addEventListener('click', e => {
    if (!e.target.closest('[data-news="camp-challenges"]')) {
      return;
    }
    e.stopPropagation();
    V4.campTab = 'enigmes';
    go('camp');
  });
}
