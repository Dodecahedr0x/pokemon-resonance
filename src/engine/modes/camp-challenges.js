// Camp challenges (added in v4.31): the Camp sub-tabs, and what the « no progression » battles share
// (riddles, Deep Echo, custom arenas, local duel): profile data, imposed team, result, restoring at startup.
import { POKEMON, SCENARIOS } from '../pokemon/pokemon.js';
import { PROFILE } from '../state/game-state.js';
import { HOOKS } from '../core/hooks.js';
import { goTo } from '../core/navigation.js';
import { battleOpts, scSel } from '../combat/ui.js';
import { queueSave } from '../state/saves.js';
import { SCREEN_STATE } from '../ui/screen-state.js';
import { duelEnd, duelOpts } from './duel.js';
import { refreshCampPage } from '../../screens/camp/campStore.js';
import { PUZZLES, PUZZLE_CURRENT, puzzleAfter, puzzleDef, puzzleOpts, puzzlePrepare } from './riddles.js';
import { echoAfter, echoRun, echoScene } from './deep-echo.js';
import { gymAfter, gymClean, gymScene } from './custom-arenas.js';
import { chosenFog } from '../combat/fog-of-war.js';

/* Profile data of the Camp challenges: riddles, family mastery, Deep Echo, custom arenas. */

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
      if (POKEMON[k] && m && typeof m === 'object') {
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
        .filter(t => Array.isArray(t) && POKEMON[t[0]])
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
  const D = SCENARIOS[S.sc] || {},
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
  if (scSel === 'duel433' && SCENARIOS.duel433 && SCENARIOS.duel433.t1) {
    return { team: SCENARIOS.duel433.t1.slice(), voice: 0, opts: duelOpts() };
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

// The Camp page is rendered by React (src/screens/camp): sub-tabs, Base camp,
// open tab. Here, we validate the tab then rebuild the page.
export function renderCampPage() {
  const t = CAMP_TABS.some(x => x[0] === SCREEN_STATE.campTab) ? SCREEN_STATE.campTab : 'base';
  SCREEN_STATE.campTab = t;
  refreshCampPage();
}

/* ---------- at startup: special battles exist (resuming a saved battle) ---------- */
export function challengeSetBoot() {
  const E = PROFILE.riddleButton;
  puzzlePrepare(puzzleDef(E && PUZZLES[E.cur] ? E.cur : 0));
  const R = echoRun();
  if (R && R.cur >= 0 && R.map[R.f]) {
    echoScene(R, R.map[R.f][R.cur]);
  } else if (!SCENARIOS.echo431) {
    echoScene({ seed: 1, f: 0, path: [] }, 'combat');
  }
  const A = PROFILE.customGyms || [];
  gymScene(A[0] || { id: 'demo', n: 'Arène', author: '', t: 'gue', r: '', h: 'jour', lim: 10, hb: 10, f: ['onix'] });
}

const clampInt = (x, lo, hi) => (Number.isFinite(x) ? Math.max(lo, Math.min(hi, Math.floor(x))) : lo);

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
  HOOKS.creation.push((S, opt, D0) => {
    if (D0 && (D0.noProgress || D0.hebdo429)) {
      S.restricted = 1;
    } // no companion nor Daycare
  });

  document.addEventListener('click', e => {
    const b = e.target.closest('[data-camp-tab]');
    if (!b) {
      return;
    }
    SCREEN_STATE.campTab = b.dataset.campTab;
    renderCampPage();
  });

  challengeSetBoot();

  document.addEventListener('click', e => {
    if (!e.target.closest('[data-news="camp-challenges"]')) {
      return;
    }
    e.stopPropagation();
    SCREEN_STATE.campTab = 'enigmes';
    goTo('camp');
  });
}
