/* Challenge weather: today's weather adds a bonus to the daily challenge (added in v4.71). */

import { HOOKS } from '../core/hooks.js';
import { todayWeather } from '../world/pokegear.js';

export const WEATHER_NAME = { pluie: 'Pluie', soleil: 'Soleil', sable: 'Sable', grele: 'Grêle' };

/** Today's weather, or null. */
export const weatherKind = () => {
  try {
    return todayWeather();
  } catch (e) {
    return null;
  }
};

// Statements run at startup, in the original order (see index.js).
export function init() {
  /* ---- daily challenge victory: +1 Shard (rain, sand, hail) or +200 ₽ (sun) ---- */
  HOOKS.progress.unshift((S, rew, win) => {
    try {
      const k = S.sc || '';
      let m = 0,
        g = 0;
      if (win && k === 'dq470') {
        const w = weatherKind();
        if (w === 'pluie') {
          g += 1;
        }
        if (w === 'soleil') {
          m += 200;
        }
        if (w === 'sable' || w === 'grele') {
          g += 1;
        }
      }
      return m || g ? [m, g] : null;
    } catch (e) {
      return null;
    }
  });
}
