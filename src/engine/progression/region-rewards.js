/* Reward when a region is complete in the Pokédex (added in v4.70). */

import { PROFILE } from '../state/game-state.js';
import { writeLS, toast } from '../core/utils.js';
import { HOOKS } from '../core/hooks.js';
import { save } from '../team/team.js';
import { renderAll } from '../combat/ui.js';
import { ownedFam } from '../state/economy.js';
import { DEXS } from './pokedex.js';
import { announceSky } from './camp.js';

// Instructions run at startup, in the original order (see index.js).
export function init() {
  (() => {
    const KEY = 'res-dex-reward';
    // Only one reward per region, even if the player reopens the game
    const readClaimed = () => {
      try {
        return JSON.parse(localStorage.getItem(KEY)) || [];
      } catch (e) {
        return [];
      }
    };
    const writeClaimed = a => {
      writeLS(KEY, a);
    };
    const REGION_REWARDS = [
      { g: 1, displayName: 'Kanto' },
      { g: 2, displayName: 'Johto' },
      { g: 3, displayName: 'Hoenn' },
    ];
    const regionComplete = g => {
      const ms = DEXS.filter(m => m.gen === g);
      return ms.length > 0 && ms.every(m => ownedFam(m.id));
    };
    const verifyRewards = () => {
      if (!PROFILE || !PROFILE.dex) {
        return;
      }
      const already = readClaimed();
      let change = false;
      REGION_REWARDS.forEach(r => {
        if (already.includes(r.g) || !regionComplete(r.g)) {
          return;
        }
        already.push(r.g);
        change = true;
        PROFILE.money += 3000;
        PROFILE.gems = (PROFILE.gems || 0) + 10;
        toast(`Pokédex de ${r.displayName} complet : 3 000 ₽ et 10 Éclats !`);
        announceSky('🏆', 'Pokédex complet', `${r.displayName} est entièrement capturé.`);
      });
      if (change) {
        writeClaimed(already);
        save();
      }
    };
    HOOKS.rendered.push(verifyRewards);
    window.__dexReward = {
      verify: verifyRewards,
      readValue: readClaimed,
      P: () => PROFILE,
      dex: () => DEXS,
      ownedFam,
      renderAll,
    };
  })();
}
