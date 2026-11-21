import { POKEMON, SCENARIOS, familyOf } from '../pokemon/pokemon.js';
import { RECRUIT } from '../pokemon/evolution.js';
import { PROFILE } from '../state/game-state.js';
import { mulberry32 } from '../core/utils.js';
import { HOOKS } from '../core/hooks.js';
import { goTo } from '../core/navigation.js';
import { OBSTACLES } from '../combat/synergies-obstacles.js';
import { battleOpts, selectedScenario } from '../combat/ui.js';
import { SCREEN_STATE } from '../ui/screen-state.js';
import { formatNumber } from '../state/economy.js';
import { renderQuests } from '../progression/quests-shop.js';

/* Challenge of the week: same rule and same rental team for everyone, best score kept,
   reward once a week, ranking among friends (added in v4.29). */

let WEEK_CACHE;

/** This week's score on the trainer card. */
export function sanitizeWeekly(x) {
  return x && typeof x === 'object' && typeof x.w === 'string' && /^\d{4}-S\d\d$/.test(x.w) && Number.isFinite(x.s)
    ? { w: x.w, s: Math.max(0, Math.min(99999, Math.floor(x.s))) }
    : null;
}

function weekNumber(d) {
  d = d || new Date();
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())),
    j = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - j);
  const a = new Date(Date.UTC(t.getUTCFullYear(), 0, 1)),
    n = Math.ceil(((t - a) / 864e5 + 1) / 7);
  return `${t.getUTCFullYear()}-S${String(n).padStart(2, '0')}`;
}

export function fingerprintRandom(w) {
  let a = 0;
  for (let i = 0; i < w.length; i++) {
    a = (Math.imul(a ^ w.charCodeAt(i), 2654435761) + 0x9e3779b9) | 0;
  }
  // without "|| 1" (unlike seededRng / stringSeededRng): a zero fingerprint always gives the same sequence as before
  return mulberry32(a);
}

export function buildWeeklyChallenge() {
  const w = weekNumber();
  if (WEEK_CACHE && WEEK_CACHE.w === w && SCENARIOS.hebdo429) {
    return WEEK_CACHE;
  }
  const r = fingerprintRandom(w),
    pick = L0 => L0[Math.floor(r() * L0.length)],
    R = Object.assign({}, WEEKLY_PRESETS[Math.floor(r() * WEEKLY_PRESETS.length)]),
    bases = ['a4', 'a5', 'a6', 'a7', 'a8', 'j3', 'j5', 'j6', 'j7', 'h3', 'h5', 'h6'].filter(
      k => SCENARIOS[k] && SCENARIOS[k].foes
    ),
    bk = pick(bases),
    family = RECRUIT.map(m => familyOf(m.id)).filter(f => f.length),
    endStep = f => f.filter(x => !x.nx || !POKEMON[x.nx]).sort((a, b) => b.st - a.st)[0] || f[f.length - 1],
    shuffleList = L0 => {
      const a = [...L0];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(r() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    };
  let team;
  if (R.k === 'debut') {
    team = shuffleList(RECRUIT)
      .slice(0, 4)
      .map(m => m.id);
  } else if (R.k === 'mono') {
    const types = [...new Set(family.flatMap(f => endStep(f).t))]
        .filter(t => family.filter(f => endStep(f).t.includes(t)).length >= 4)
        .sort(),
      T = pick(types);
    team = shuffleList(family.filter(f => endStep(f).t.includes(T)))
      .slice(0, 4)
      .map(f => endStep(f).id);
    R.n = `Monotype ${T}`;
    R.d = `Une équipe de location 100 % ${T}.`;
  } else {
    team = shuffleList(family)
      .slice(0, 4)
      .map(f => endStep(f).id);
  }
  const b = SCENARIOS[bk],
    D = Object.assign({}, b, {
      n: 'Défi de la semaine',
      lvl: `Semaine ${w.slice(-2)} · ${R.n}`,
      d: `${R.d} Terrain et adversaires : « ${b.n} ». Le meilleur score est gardé ; récompense à la première victoire de la semaine.`,
      hebdo429: w,
      weeklyRule: R.k,
      rentalTeam: team,
      lim: R.k === 'chrono' ? 6 : b.lim || 10,
      catch: false,
    });
  PROGRESS_KEYS.forEach(x => delete D[x]);
  SCENARIOS.hebdo429 = D;
  OBSTACLES.hebdo429 = OBSTACLES[bk] || {};
  WEEK_CACHE = { w, R, bk, team };
  return WEEK_CACHE;
}

/** The challenge's rental team, with identical settings for everyone. */
export function weeklyTeam() {
  const D = SCENARIOS[selectedScenario];
  if (selectedScenario !== 'hebdo429' || !D || !D.rentalTeam) {
    return null;
  }
  return {
    team: D.rentalTeam.slice(),
    voice: 0,
    opts: Object.assign(battleOpts(), {
      diff: 'normal',
      items: {},
      fatigue: {},
      links: {},
      mut: null,
      challenges: [],
      dojo: 0,
      learnedTms: {},
      disobedience: false,
      characters: false,
    }),
  };
}

export function weeklyProgress() {
  const h = PROFILE.hebdo429;
  return h && h.w === weekNumber() ? { w: h.w, s: h.best } : null;
}

function weeklyScore(S, win) {
  const al = S.units.filter(u => u.side === 'a'),
    livingUnits = al.filter(u => !u.ko).length,
    hp = al.reduce((a, u) => a + (u.ko ? 0 : u.hp / u.mhp), 0) / Math.max(1, al.length),
    lim = (SCENARIOS[S.sc] || {}).lim || 10,
    ko = S.units.filter(u => u.side === 'e' && u.ko).length;
  return win
    ? 1000 + Math.max(0, lim - S.round) * 60 + Math.round(hp * 400) + livingUnits * 50
    : Math.min(900, ko * 120 + S.round * 10);
}

// Quests › Event: challenge of the week rendered by React (src/screens/quests/Event.jsx)

const WEEKLY_PRESETS = [
  { k: 'location', n: 'Équipe de location', d: 'Tout le monde joue la même équipe, tirée au sort pour la semaine.' },
  { k: 'mono', n: 'Monotype', d: 'Une équipe de location d’un seul type.' },
  { k: 'debut', n: 'Premiers pas', d: 'Quatre Pokémon au premier stade : à vous de les éveiller en combat.' },
  { k: 'chrono', n: 'Contre-la-montre', d: 'Une équipe de location, et seulement 6 manches pour gagner.' },
];

// the challenge reuses a battle's opponents without its progression rewards
export const PROGRESS_KEYS = [
  'gym',
  'elite',
  'champ',
  'johto',
  'hoenn',
  'hfinal',
  'jfinal',
  'jdis',
  'roam',
  'legend',
  'rival',
  'dissonance',
  'colossus',
  'lac',
  'tower',
  'tuto',
  'ami',
  'rivalFight',
  'captureLegend',
  'dom',
  'jafter',
  'after',
  'daily',
  'tdr',
];

// Statements run at startup, in the original order (see index.js).
export function init() {
  WEEK_CACHE = null;

  HOOKS.progress.push((S, rew, win) => {
    const D = SCENARIOS[S.sc] || {};
    if (!D.hebdo429) {
      return null;
    }
    const w = D.hebdo429,
      sc = weeklyScore(S, win);
    let h = PROFILE.hebdo429;
    if (!h || h.w !== w) {
      h = PROFILE.hebdo429 = { w, best: 0, n: 0, rec: 0, win: 0 };
    }
    h.n++;
    const record = sc > h.best;
    if (record) {
      h.best = sc;
    }
    if (win) {
      h.win = 1;
    }
    rew.hebdo429 = { sc, best: h.best, record };
    if (win && !h.rec) {
      h.rec = 1;
      rew.hebdo429.prime = 1;
      return [2500, 25];
    }
    return null;
  });

  HOOKS.battleResult.push(r =>
    r.hebdo429
      ? `<div class="result-list"><h4>Défi de la semaine</h4><div class="result-row"><span>Score ${formatNumber(r.hebdo429.sc)}${r.hebdo429.record ? ' · nouveau record !' : ` · record ${formatNumber(r.hebdo429.best)}`}${r.hebdo429.prime ? ' · première victoire de la semaine : +2 500 ₽ · +25 Éclats' : ''}</span><b>${r.hebdo429.record ? '★' : ''}</b></div><p class="note">Partagez votre carte de dresseur (Amis) : vos amis verront ce score.</p></div>`
      : ''
  );

  document.addEventListener('click', e => {
    if (!e.target.closest('[data-hebdo429],[data-news="hebdo429"]')) {
      return;
    }
    e.stopPropagation();
    SCREEN_STATE.questTab = 'event';
    goTo('quetes');
    renderQuests();
  });
}
