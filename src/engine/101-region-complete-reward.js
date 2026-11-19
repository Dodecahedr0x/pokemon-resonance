/* Original section: v4.70: reward when a region is complete in the Pokédex */

import { PROFILE } from './011-game-state.js';
import { writeLS, toast } from './014-utils.js';
import { HOOKS } from './015-hooks.js';
import { save } from './020-team-cards.js';
import { renderAll } from './024-combat-ui.js';
import { ownedFam } from './032-v4-foundation.js';
import { DEXS } from './038-pokedex.js';
import { announceSky } from './065-camp-tactics.js';

// Instructions run at startup, in the original order (see index.js).
export function __init() {
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
