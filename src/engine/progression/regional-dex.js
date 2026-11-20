/* Catch tracking: families caught per route and region (silhouettes, Pokédex counters) and a diploma rewarded for each completed region (added in v4.28). */

import { PROFILE } from '../state/game-state.js';
import { toast } from '../core/utils.js';
import { HOOKS } from '../core/hooks.js';
import { openSheet } from '../team/team.js';
import { queueSave } from '../state/saves.js';
import { sfx } from '../audio/sound-effects.js';
import { renderWallet } from '../ui/wallet.js';
import { FAMILY_REGION_NAMES, captureSite, regionPool } from '../world/catch-anywhere.js';

export function REGIONAL_DIPLOMAS_0() {
  return { regionDiplomas: [] };
}

export function regionalDiplomasClean(p) {
  const d = p && Array.isArray(p.regionDiplomas) ? p.regionDiplomas.filter(r => [1, 2, 3].includes(r)) : [];
  return { regionDiplomas: [...new Set(d)] };
}

// ₽, Shards
function findNewDiplomas() {
  PROFILE.regionDiplomas = PROFILE.regionDiplomas || [];
  const nv = [];
  [1, 2, 3].forEach(r => {
    const c = familyCaptureStats(r);
    if (c.t && c.n >= c.t && !PROFILE.regionDiplomas.includes(r)) {
      PROFILE.regionDiplomas.push(r);
      nv.push(r);
    }
  });
  return nv;
}

/** Outside battle (Safari Park, startup): the reward is paid out immediately. */
export function awardRegionDiplomas() {
  const nv = findNewDiplomas();
  if (!nv.length) {
    return;
  }
  const [m, g] = diplomaRewardTotal(nv);
  PROFILE.money = Math.min(999999, (PROFILE.money || 0) + m);
  PROFILE.gems = Math.min(99999, (PROFILE.gems || 0) + g);
  toast(`Pokédex de ${nv.map(r => FAMILY_REGION_NAMES[r]).join(' et ')} complet ! +${m} ₽ · +${g} Éclats`);
  sfx('ui');
  queueSave();
  setTimeout(renderWallet, 0);
}

// Pokédex per-region counters: src/screens/dex/DexList.jsx (DexCount)

// Families caught on the route (#regionDex, under the map): src/screens/map/Captures.jsx.

export const familyCaptureStats = r => {
  const L = regionPool(r);
  return { L, n: L.filter(m => PROFILE.box.includes(m.id)).length, t: L.length };
};

export const DIPLOMA_REWARDS = { 1: [5000, 40], 2: [6000, 50], 3: [4000, 40] };

const diplomaRewardTotal = nv =>
  nv.reduce((a, r) => [a[0] + DIPLOMA_REWARDS[r][0], a[1] + DIPLOMA_REWARDS[r][1]], [0, 0]);

// Statements run at startup, in the original order (see index.js).
export function init() {
  HOOKS.progress.push((S, rew) => {
    const nv = findNewDiplomas();
    if (!nv.length) {
      return null;
    }
    rew.regionDiplomas = nv;
    return diplomaRewardTotal(nv);
  });

  HOOKS.battleResult.push(r =>
    r.regionDiplomas
      ? `<div class="result-list"><h4>Pokédex régional</h4>${r.regionDiplomas
          .map(
            x =>
              `<div class="result-row"><span>${FAMILY_REGION_NAMES[x]} : les ${familyCaptureStats(x).t} familles sont capturées !</span><b>+${DIPLOMA_REWARDS[x][0]} ₽ · +${DIPLOMA_REWARDS[x][1]} Éclats</b></div>`
          )
          .join('')}</div>`
      : ''
  );

  document.addEventListener('click', e => {
    const b = e.target.closest('[data-region-dex]');
    if (!b) {
      return;
    }
    const id = b.dataset.regionDex;
    if (PROFILE.box.includes(id)) {
      openSheet(id);
    } else {
      toast(`Ce Pokémon vit sur la ${captureSite(id)}. Touchez « ! » quand l’herbe bouge, ou pêchez s’il aime l’eau.`);
    }
  });
}
