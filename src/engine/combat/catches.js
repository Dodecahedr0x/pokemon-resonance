import { BY, SCEN } from '../pokemon/pokemon.js';
import { PROFILE, isCamp } from '../state/game-state.js';
import { $, RM, toast } from '../core/utils.js';
import { HOOKS } from '../core/hooks.js';
import { cur } from '../core/navigation.js';
import { TOD } from '../world/home-route.js';
import { openSheet, squad } from '../team/team.js';
import { byUid } from './engine.js';
import { B, renderAll, ui } from './ui.js';
import { queueSave } from '../state/saves.js';
import { PREF, savePref, sfx, vibe } from '../progression/campaign.js';
import { today } from '../state/economy.js';
import { renderWallet } from '../core/interface.js';
import { renderHome } from '../world/home.js';
import { isShinyOwned } from '../modes/adventure.js';
import { JCHAIN } from '../world/johto.js';
import {
  affinityHearts,
  gainCompanionAffinity,
  activeCompanionId,
  renderCompanionBox,
} from '../progression/companions.js';
import { refreshHome } from '../../screens/home/homeStore.js';
import { HCHAIN } from '../world/hoenn.js';
import { FAMILY_REGION_NAMES, captureSite, regionPool, regionIndex } from '../world/catch-anywhere.js';
import { evoSet } from '../../screens/combat/board/boardStore.js';
import { refreshBattle } from '../../screens/combat/battle/battleStore.js';

/* =====================================================================
   v4.28
   1. Catch tracking: « Route 29 · 14 / 22 families », the Pokémon
      missing on each route (silhouettes), per-region counters in the
      Pokédex and a diploma rewarded for each completed region.
   2. Quick battle: ×2 button in battle, and « Passer » (Skip) during the
      opponent turn (the opponent phase plays sped up, same rules).
   3. Living Home: the illustration follows the adventure region and the
      time of day; the companion waits there, a hug with one gesture.
   ===================================================================== */
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

export function endSkipSpeedup() {
  if (!B) {
    return;
  }
  if (!ui.busy) {
    ui.skipSpeedup = false;
  }
  refreshBattle('fast'); // #bFast (aria-pressed): rendered by React (TopBar.jsx)
}

function heroRegionInfo(g) {
  if (!isCamp()) {
    return regionIndex();
  }
  const k = g.k,
    S = SCEN[k] || {};
  if (HCHAIN.includes(k) || S.hoenn != null) {
    return 3;
  }
  if (JCHAIN.includes(k) || /^j/.test(k) || S.johto != null || S.roam) {
    return 2;
  }
  return 1;
}

/** Living Home: hero backdrop according to region and time, companion (render: src/screens/home/Hero.jsx). */
export function heroView(g) {
  const r = heroRegionInfo(g),
    id = activeCompanionId() || squad[0] || '',
    m = BY[id],
    comp = !!activeCompanionId();
  return {
    reg: ['', 'kanto', 'johto', 'hoenn'][r],
    tod: TOD,
    tag: `${FAMILY_REGION_NAMES[r]} · ${TIME_OF_DAY_NAMES[TOD] || 'Jour'}`,
    m,
    comp,
    sh: comp && isShinyOwned(m.base),
    hearts: comp ? affinityHearts(PROFILE.comp.aff || 0) : 0,
  };
}

/* ---------- 1. catch tracking ---------- */
export const familyCaptureStats = r => {
  const L = regionPool(r);
  return { L, n: L.filter(m => PROFILE.box.includes(m.id)).length, t: L.length };
};

export const DIPLOMA_REWARDS = { 1: [5000, 40], 2: [6000, 50], 3: [4000, 40] };

const diplomaRewardTotal = nv =>
  nv.reduce((a, r) => [a[0] + DIPLOMA_REWARDS[r][0], a[1] + DIPLOMA_REWARDS[r][1]], [0, 0]);

/* ---------- 2. quick battle ---------- */
export const battleDelay = (rm, fast, slow) => (RM || ui.skipSpeedup ? rm : PREF.fast ? fast : slow);

export const isEnemyTurn = () =>
  !!(
    B &&
    !B.over &&
    ui.busy &&
    !ui.cutscene &&
    (B.phase === 'enemy' || (B.order === 'vitesse' && ui.act && (byUid(B, ui.act) || {}).side === 'e'))
  );

/* ---------- 3. living home ---------- */
const TIME_OF_DAY_NAMES = { matin: 'Matin', jour: 'Jour', nuit: 'Nuit' };

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
      ? `<div class="res-l"><h4>Pokédex régional</h4>${r.regionDiplomas
          .map(
            x =>
              `<div class="rl"><span>${FAMILY_REGION_NAMES[x]} : les ${familyCaptureStats(x).t} familles sont capturées !</span><b>+${DIPLOMA_REWARDS[x][0]} ₽ · +${DIPLOMA_REWARDS[x][1]} Éclats</b></div>`
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

  document.addEventListener('click', e => {
    if (e.target.closest('#bFast')) {
      PREF.fast = !PREF.fast;
      savePref();
      endSkipSpeedup();
      toast(PREF.fast ? 'Combat rapide : animations ×2' : 'Vitesse normale');
      return;
    }
    if (e.target.closest('#bEnd') && isEnemyTurn() && !ui.skipSpeedup) {
      ui.skipSpeedup = true;
      evoSet({ fast: true }); // #evoFx (React)
      renderAll();
    }
  });

  document.addEventListener('click', e => {
    const b = e.target.closest('[data-hero-banner]');
    if (b) {
      if (b.dataset.heroBanner === 'choisir' || !activeCompanionId()) {
        renderCompanionBox();
        $('#compBox').hidden = false;
        return;
      }
      b.classList.remove('pop');
      void b.offsetWidth;
      b.classList.add('pop');
      const n = BY[activeCompanionId()].n;
      if (PROFILE.comp.j === today()) {
        toast(`${n} est déjà tout content aujourd’hui.`);
        return;
      }
      PROFILE.comp.j = today();
      const up = gainCompanionAffinity(3);
      sfx('ui');
      vibe(25);
      toast(up ? `${n} est ravi : ${up} cœur${up > 1 ? 's' : ''} !` : `${n} ferme les yeux de bonheur.`);
      queueSave();
      refreshHome();
      return;
    }
    if (e.target.closest('[data-comp-p]')) {
      setTimeout(() => cur === 'accueil' && renderHome(), 0);
    }
  });
}
