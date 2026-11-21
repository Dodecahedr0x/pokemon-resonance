/* Challenge prestige: up to five levels of stronger opponents for bigger rewards (added in v4.71). */

import { PROFILE, isCamp } from '../state/game-state.js';
import { BADGES } from './gyms.js';
import { HOOKS } from '../core/hooks.js';
import { readChallengeState, writeChallengeState } from './challenges-hub.js';

/** Prestige unlocks after the 8 badges (or the League) in Campaign. */
export const prestigeUnlocked = () => (isCamp() ? BADGES.length >= 8 || (PROFILE.elite || 0) > 0 : true);

/** Hub buttons: `pre+` raises the level (max 5) and turns it on, `pre` toggles it. */
export const adjustPrestige = (v, X) => {
  if (v === 'pre+' && X.pre.n < 5) {
    X.pre.n += 1;
    X.pre.on = true;
    writeChallengeState(X);
  }
  if (v === 'pre') {
    X.pre.on = !X.pre.on;
    writeChallengeState(X);
  }
};

// Statements run at startup, in the original order (see index.js).
export function init() {
  HOOKS.creation.push(S => {
    const P = readChallengeState().pre;
    if (!P.on || !P.n || !S || !S.units || /^(omb470_|dq470)/.test(S.sc || '')) {
      return;
    }
    S.units.forEach(u => {
      if (u.side === 'e') {
        u.mhp += 2 * P.n;
        u.hp += 2 * P.n;
      }
    });
  });

  /* ---- victory (other than the Shadows and the daily challenge): Pokédollars, Shards from level 3 ---- */
  HOOKS.progress.unshift((S, rew, win) => {
    try {
      if (!win) {
        return null;
      }
      const X = readChallengeState();
      let m = 0,
        g = 0;
      const k = S.sc || '';
      if (!/^omb470_/.test(k) && k !== 'dq470' && X.pre.on && X.pre.n) {
        m += 150 * X.pre.n;
        g += X.pre.n >= 3 ? 1 : 0;
      }
      writeChallengeState(X);
      return m || g ? [m, g] : null;
    } catch (e) {
      return null;
    }
  });
}
