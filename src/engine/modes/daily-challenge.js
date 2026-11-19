/* Daily challenge: a seeded battle with one forbidden type, streaks and fossils (added in v4.71). */

import { BY, SCEN } from '../pokemon/pokemon.js';
import { HOOKS } from '../core/hooks.js';
import { squad } from '../team/team.js';
import { OBST } from '../combat/synergies-obstacles.js';
import { scSel } from '../combat/ui.js';
import { today } from '../state/economy.js';
import { DEXS } from '../progression/pokedex.js';
import { teamSize } from '../progression/campaign-challenges.js';
import { baseScene, mkFoes, ok } from './challenge-scenes.js';
import { readChallengeState, writeChallengeState } from './challenges-hub.js';

const TYPES = ['Feu', 'Eau', 'Plante', 'Électrik', 'Psy', 'Combat', 'Insecte', 'Sol'];
const seedValue = sel => {
  let h = 7;
  for (const ch of today() + sel) {
    h = (h * 33 + ch.charCodeAt(0)) >>> 0;
  }
  return h;
};

/** Today's challenge: opponents, forbidden type, Bonus HP and level. */
export const dqDef = () => {
  const pool = ok(DEXS.map(m => m.id));
  const nb = 3 + (seedValue('n') % 2);
  const ids = [];
  for (let i = 0; i < nb; i++) {
    ids.push(pool[seedValue('f' + i) % pool.length]);
  }
  const forbiddenSet = TYPES[seedValue('t') % TYPES.length];
  const hb = 2 + (seedValue('h') % 4);
  return { ids, forbidden: forbiddenSet, hb, lv: 18 + (seedValue('l') % 10) };
};

/** (Re)builds today's scenario `dq470`. */
export const dqMake = () => {
  const D = dqDef();
  SCEN.dq470 = Object.assign(
    baseScene(
      'Défi quotidien',
      'Défi · type interdit : ' + D.forbidden,
      'Aucun Pokémon de type ' + D.forbidden + ' dans votre équipe. Adversaires renforcés.',
      D.lv,
      D.hb,
      mkFoes(D.ids)
    ),
    { dq470: D.forbidden }
  );
  try {
    OBST.dq470 = { pil: ['4,2'], grass: ['4,4', '5,1'] };
  } catch {
    /* Best effort: failure here is non-fatal. */
  }
  return D;
};

/** The first team member of the forbidden type, or null. */
export const dqViol = () => {
  const D = SCEN.dq470 && SCEN.dq470.dq470;
  return D ? squad.slice(0, teamSize()).find(id => BY[id] && BY[id].t.includes(D)) : null;
};

// Statements run at startup, in the original order (see index.js).
export function init() {
  dqMake();

  HOOKS.launchRefusal.push(() => {
    const v = scSel === 'dq470' && dqViol();
    return v ? BY[v].n + ' est de type ' + SCEN.dq470.dq470 + ' : retirez-le de l’équipe.' : null;
  });

  /* ---- victory: once a day, streak, a fossil, Pokédollars and Shards ---- */
  HOOKS.progress.unshift((S, rew, win) => {
    try {
      if (!win) {
        return null;
      }
      const X = readChallengeState();
      let m = 0,
        g = 0;
      const k = S.sc || '';
      if (k === 'dq470') {
        const D = X.dq;
        if (!(D.d === today() && D.done)) {
          const yesterdayKey = new Date(Date.now() - 864e5);
          const h =
            yesterdayKey.getFullYear() +
            '-' +
            String(yesterdayKey.getMonth() + 1).padStart(2, '0') +
            '-' +
            String(yesterdayKey.getDate()).padStart(2, '0');
          D.streak = D.last === h ? D.streak + 1 : 1;
          D.best = Math.max(D.best, D.streak);
          D.tot += 1;
          D.last = today();
          D.d = today();
          D.done = true;
          X.fossils += 1;
          m += 500 + 100 * Math.min(D.streak, 7);
          g += 2;
        }
        writeChallengeState(X);
      }
      return m || g ? [m, g] : null;
    } catch (e) {
      return null;
    }
  });
}
