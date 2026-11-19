/* Original section: v4.70: reward when a region is complete in the Pokédex */

import { PROFILE } from './011-game-state.js';
import { writeLS, toast } from './014-utils.js';
import { HOOKS } from './015-hooks.js';
import { save } from './020-team-cards.js';
import { renderAll } from './024-combat-ui.js';
import { ownedFam } from './032-v4-foundation.js';
import { DEXS } from './038-pokedex.js';
import { announce430 } from './065-camp-tactics.js';

// Instructions run at startup, in the original order (see index.js).
export function __init() {
  (() => {
    const KEY = 'res-pdx470';
    // Only one reward per region, even if the player reopens the game
    const read470 = () => {
      try {
        return JSON.parse(localStorage.getItem(KEY)) || [];
      } catch (e) {
        return [];
      }
    };
    const write470 = a => {
      writeLS(KEY, a);
    };
    const REGIONS470 = [
      { g: 1, displayName: 'Kanto' },
      { g: 2, displayName: 'Johto' },
      { g: 3, displayName: 'Hoenn' },
    ];
    const complete470 = g => {
      const ms = DEXS.filter(m => m.gen === g);
      return ms.length > 0 && ms.every(m => ownedFam(m.id));
    };
    const verify470 = () => {
      if (!PROFILE || !PROFILE.dex) {
        return;
      }
      const already = read470();
      let change = false;
      REGIONS470.forEach(r => {
        if (already.includes(r.g) || !complete470(r.g)) {
          return;
        }
        already.push(r.g);
        change = true;
        PROFILE.money += 3000;
        PROFILE.gems = (PROFILE.gems || 0) + 10;
        toast(`Pokédex de ${r.displayName} complet : 3 000 ₽ et 10 Éclats !`);
        announce430('🏆', 'Pokédex complet', `${r.displayName} est entièrement capturé.`);
      });
      if (change) {
        write470(already);
        save();
      }
    };
    HOOKS.rendered.push(verify470);
    window.__pdx470 = { verify: verify470, readValue: read470, P: () => PROFILE, dex: () => DEXS, ownedFam, renderAll };
  })();
}
