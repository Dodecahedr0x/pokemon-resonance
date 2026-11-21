/* Inverted Shadows: Vaskar's harder rematch, rewarded once a day (added in v4.71). */

import { SCENARIOS } from '../pokemon/pokemon.js';
import { HOOKS } from '../core/hooks.js';
import { OBSTACLES } from '../combat/synergies-obstacles.js';
import { today } from '../state/economy.js';
import { makeFoes } from './challenge-scenes.js';
import { readMoreChallenges, writeMoreChallenges } from './more-challenges.js';

// Statements run at startup, in the original order (see index.js).
export function init() {
  SCENARIOS.inv470 = Object.assign(
    {
      n: 'Ombres inversées',
      lvl: 'Revanche · Vaskar',
      lim: 14,
      time: 'nuit',
      bio: 'gue',
      d: 'Vaskar revient avec les Ombres renforcées. Une revanche sans répit, qui ne se refuse pas.',
      water: [],
      rock: ['3,0', '3,5'],
      hb: 8,
      pb: 2,
      lv: 44,
      foes: makeFoes(['absol', 'demolosse', 'tyranocif', 'noctali']),
    },
    {}
  );
  try {
    OBSTACLES.inv470 = { pil: ['4,2'], grass: ['4,4', '5,1'] };
  } catch {
    /* Best effort: failure here is non-fatal. */
  }

  /* ---- victory: rewarded once a day ---- */
  HOOKS.progress.unshift((S, rew, win) => {
    try {
      const k = S.sc || '';
      const X = readMoreChallenges();
      let m = 0,
        g = 0;
      if (win && k === 'inv470' && X.inv.d !== today()) {
        X.inv = { d: today(), done: true };
        m += 1500;
        g += 2;
      }
      writeMoreChallenges(X);
      return m || g ? [m, g] : null;
    } catch (e) {
      return null;
    }
  });
}
