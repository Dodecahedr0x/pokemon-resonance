/* Daily challenge: a seeded battle with one forbidden type, streaks and fossils (added in v4.71). */

import { POKEMON, SCENARIOS } from '../pokemon/pokemon.js';
import { HOOKS } from '../core/hooks.js';
import { squad } from '../team/team.js';
import { OBSTACLES } from '../combat/synergies-obstacles.js';
import { selectedScenario } from '../combat/ui.js';
import { today } from '../state/economy.js';
import { DEX_SPECIES } from '../progression/pokedex.js';
import { teamSize } from '../progression/campaign-challenges.js';
import { baseScene, makeFoes, existingSpecies } from './challenge-scenes.js';
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
export const dailyChallengeSetup = () => {
  const pool = existingSpecies(DEX_SPECIES.map(m => m.id));
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
export const buildDailyChallenge = () => {
  const D = dailyChallengeSetup();
  SCENARIOS.dq470 = Object.assign(
    baseScene(
      'Défi quotidien',
      'Défi · type interdit : ' + D.forbidden,
      'Aucun Pokémon de type ' + D.forbidden + ' dans votre équipe. Adversaires renforcés.',
      D.lv,
      D.hb,
      makeFoes(D.ids)
    ),
    { dq470: D.forbidden }
  );
  try {
    OBSTACLES.dq470 = { pil: ['4,2'], grass: ['4,4', '5,1'] };
  } catch {
    /* Best effort: failure here is non-fatal. */
  }
  return D;
};

/** The first team member of the forbidden type, or null. */
export const dailyChallengeViolation = () => {
  const D = SCENARIOS.dq470 && SCENARIOS.dq470.dq470;
  return D ? squad.slice(0, teamSize()).find(id => POKEMON[id] && POKEMON[id].t.includes(D)) : null;
};

function onProgress(S, rew, win) {
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
}

// Statements run at startup, in the original order (see index.js).
export function init() {
  buildDailyChallenge();

  HOOKS.launchRefusal.push(() => {
    const v = selectedScenario === 'dq470' && dailyChallengeViolation();
    return v ? POKEMON[v].n + ' est de type ' + SCENARIOS.dq470.dq470 + ' : retirez-le de l’équipe.' : null;
  });

  /* ---- victory: once a day, streak, a fossil, Pokédollars and Shards ---- */
  HOOKS.progress.unshift(onProgress);
}
