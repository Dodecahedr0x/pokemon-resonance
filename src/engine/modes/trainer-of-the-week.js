/* Trainer of the week: a trainer whose team changes every week, one rewarded victory per week (added in v4.71). */

import { POKEMON, SCENARIOS } from '../pokemon/pokemon.js';
import { HOOKS } from '../core/hooks.js';
import { OBSTACLES } from '../combat/synergies-obstacles.js';
import { DEX_SPECIES } from '../progression/pokedex.js';
import { makeFoes, existingSpecies } from './challenge-scenes.js';
import { readMoreChallenges, writeMoreChallenges } from './more-challenges.js';

const hash = s => {
  let h = 17;
  for (const ch of s) {
    h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  }
  return h;
};

/** Current week key. */
export const weekKey = () => 'S' + Math.floor(Date.now() / (7 * 864e5));

const NAMES = ['Léa Ferrand', 'Marc Dalbert', 'Inès Montarbre', 'Tom Lacrête', 'Sana Verdier', 'Hugo Brisemare'];
const pool = () => existingSpecies(DEX_SPECIES.map(m => m.id)).filter(id => POKEMON[id] && !POKEMON[id].isEnemy);

/** This week's trainer: name, team and level. */
export const weekDef = () => {
  const h = hash(weekKey());
  const p = pool();
  const ids = [0, 1, 2].map(i => p[(h + i * 977) % p.length]);
  return { n: NAMES[h % NAMES.length], ids, lv: 24 + (h % 6) };
};

/** (Re)builds this week's scenario `wk470`. */
export const buildWeeklyChallenge = () => {
  const D = weekDef();
  SCENARIOS.wk470 = Object.assign(
    {
      n: 'Dresseur de la semaine',
      lvl: 'Semaine · ' + D.n,
      lim: 12,
      time: 'jour',
      bio: 'gue',
      d: D.n + ' vous attend avec une équipe qui change chaque semaine.',
      water: [],
      rock: ['3,0', '3,5'],
      hb: 4,
      pb: 1,
      lv: D.lv,
      foes: makeFoes(D.ids),
    },
    {}
  );
  try {
    OBSTACLES.wk470 = { pil: ['4,2'], grass: ['4,4'] };
  } catch {
    /* Best effort: failure here is non-fatal. */
  }
  return D;
};

// Statements run at startup, in the original order (see index.js).
export function init() {
  buildWeeklyChallenge();

  /* ---- victory: only one rewarded victory per week ---- */
  HOOKS.progress.unshift((S, rew, win) => {
    try {
      const k = S.sc || '';
      const X = readMoreChallenges();
      let m = 0,
        g = 0;
      if (win && k === 'wk470') {
        if (X.wk.k !== weekKey() || !X.wk.done) {
          X.wk = { k: weekKey(), done: true, best: Math.max(X.wk.best || 0, 1) };
          m += 2000;
          g += 5;
        }
      }
      writeMoreChallenges(X);
      return m || g ? [m, g] : null;
    } catch (e) {
      return null;
    }
  });
}
