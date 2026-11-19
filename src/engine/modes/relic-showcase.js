/* Relic showcase: every Boss Rush relic chosen is kept; three or more give a Shard per victory (added in v4.71). */

import { HOOKS } from '../core/hooks.js';
import { readMoreChallenges, writeMoreChallenges } from './more-challenges.js';

// Statements run at startup, in the original order (see index.js).
export function init() {
  /* ---- victory: a Shard with three or more relics ---- */
  HOOKS.progress.unshift((S, rew, win) => {
    try {
      const X = readMoreChallenges();
      let g = 0;
      if (X.relics.length >= 3 && win) {
        g += 1;
      }
      writeMoreChallenges(X);
      return g ? [0, g] : null;
    } catch (e) {
      return null;
    }
  });

  /* ---- each chosen relic is kept ---- */
  document.addEventListener(
    'click',
    e => {
      const b = e.target.closest && e.target.closest('[data-boss-rush^="rel:"]');
      if (!b) {
        return;
      }
      const id = b.dataset.bossRush.slice(4);
      const X = readMoreChallenges();
      if (!X.relics.includes(id)) {
        X.relics.push(id);
        writeMoreChallenges(X);
      }
    },
    true
  );
}
