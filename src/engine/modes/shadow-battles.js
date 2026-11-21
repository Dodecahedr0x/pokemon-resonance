/* Shadow battles: the four story episodes against Vaskar's Shadows (added in v4.71). */

import { SCENARIOS } from '../pokemon/pokemon.js';
import { writeLS, toast } from '../core/utils.js';
import { HOOKS } from '../core/hooks.js';
import { squad } from '../team/team.js';
import { OBSTACLES } from '../combat/synergies-obstacles.js';
import { B, backToPrep, goFight } from '../combat/ui.js';
import { shut } from '../../screens/overlays/tempStore.js';
import { routeEvent } from '../world/route-events.js';
import { baseScene, mkFoes } from './challenge-scenes.js';
import { readChallengeState, writeChallengeState } from './challenges-hub.js';

const SHADOWS = [
  { ids: ['racaillou', 'nosferapti'], lv: 12, hb: 2 },
  { ids: ['malosse', 'nosferapti', 'tenefix'], lv: 20, hb: 3 },
  { ids: ['malosse', 'absol', 'tenefix', 'noctali'], lv: 28, hb: 4 },
  { ids: ['absol', 'demolosse', 'tyranocif', 'noctali'], lv: 36, hb: 6 },
];

function onProgress(S, rew, win) {
  try {
    if (!win) {
      return null;
    }
    const X = readChallengeState();
    let m = 0,
      g = 0;
    const k = S.sc || '';
    if (/^omb470_/.test(k)) {
      const n = +k.slice(7),
        O = window.__shadowEpisodes;
      if (O && O.readValue().stepOf === n - 1) {
        O.write({ stepOf: n });
        X.fossils += 1;
        m += 400 * n;
        g += n;
        try {
          const st = routeEvent().st;
          writeLS('res-route-event', { d: st.d, done: true, res: 'Les Ombres ont été repoussées.' });
        } catch {
          /* Best effort: failure here is non-fatal. */
        }
      }
      writeChallengeState(X);
    }
    return m || g ? [m, g] : null;
  } catch (e) {
    return null;
  }
}

// Statements run at startup, in the original order (see index.js).
export function init() {
  SHADOWS.forEach((o, i) => {
    const k = 'omb470_' + (i + 1);
    SCENARIOS[k] = Object.assign(
      baseScene(
        i === 3 ? 'Vaskar, chef des Ombres' : 'Les Ombres · épisode ' + (i + 1),
        'Histoire · épisode ' + (i + 1),
        'Repoussez les Ombres de Résonance.',
        o.lv,
        o.hb,
        mkFoes(o.ids)
      ),
      { shadowStep: i + 1 }
    );
    try {
      OBSTACLES[k] = { pil: ['4,2'], grass: ['4,4'] };
    } catch {
      /* Best effort: failure here is non-fatal. */
    }
  });

  /* ---- victory: next episode, a fossil, Pokédollars and Shards ---- */
  HOOKS.progress.unshift(onProgress);

  /* ---- link with the episodes: « Affronter » (Face) button ---- */
  // returns true: the « Affronter » choice leads to battle instead of resolving the encounter
  HOOKS.beforeRouteChoice.push(j => {
    try {
      const { E, st } = routeEvent();
      if (E && E.ombre && !st.done && E.c[j] && E.c[j].fight) {
        if (!squad.length) {
          toast('Composez d’abord une équipe.');
          return true;
        }
        const k = 'omb470_' + (window.__shadowEpisodes.readValue().stepOf + 1);
        if (!SCENARIOS[k]) {
          return true;
        }
        shut('event-choice');
        if (B) {
          backToPrep();
        }
        goFight(k);
        return true;
      }
    } catch {
      /* Best effort: failure here is non-fatal. */
    }
    return false;
  });
}
