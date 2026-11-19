/* Rivalry: Kael reacts to the Shadows battles in the « Plus de défis » window (added in v4.71). */

import { HOOKS } from '../core/hooks.js';
import { readMoreChallenges, writeMoreChallenges } from './more-challenges.js';

// Statements run at startup, in the original order (see index.js).
export function init() {
  HOOKS.progress.unshift((S, rew, win) => {
    try {
      const k = S.sc || '';
      const X = readMoreChallenges();
      if (win && /^omb470_/.test(k)) {
        const n = +k.slice(7);
        X.rival.push(
          n < 4
            ? 'Kael : « Les Ombres reculent. Vaskar ne tardera pas à réagir. »'
            : 'Kael : « Vaskar est tombé. Je n’oublierai pas ce combat. »'
        );
        X.rival = X.rival.slice(-3);
      }
      writeMoreChallenges(X);
      return null;
    } catch (e) {
      return null;
    }
  });
}
