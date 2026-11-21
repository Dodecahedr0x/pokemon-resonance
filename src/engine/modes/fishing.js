/* Fishing: cast the line from the tall grass, hook at the right moment, then fight the catch (added in v4.18). */

import { POKEMON } from '../pokemon/pokemon.js';
import { RECRUIT } from '../pokemon/evolution.js';
import { PROFILE } from '../state/game-state.js';
import { paintOverlay } from '../../screens/overlays/dialogsStore.js';
import { $, toast } from '../core/utils.js';
import { goTo } from '../core/navigation.js';
import { TOD, __set_wildId } from '../world/home-route.js';
import { squad, toggle } from '../team/team.js';
import { wildScen } from '../combat/items-bonds-ai.js';
import { __set_scSel, launch } from '../combat/ui.js';
import { queueSave } from '../state/saves.js';
import { PREFERENCES } from '../ui/preferences.js';
import { renderPrep } from '../combat/battle-prep.js';
import { sfx, vibrate } from '../audio/sound-effects.js';
import { SHINY_RATE } from '../pokemon/shiny.js';
import { multChroma } from '../world/seasons.js';
import { routeName } from '../world/johto.js';
import { familyRegion, regionIndex } from '../world/catch-anywhere.js';
import { applyShinyArt } from '../assets/art-direction.js';

let FISHING;

/* =====================================================================
   Fishing: from the tall grass (Route 29, Route 32), cast the line,
   hook at the right moment, then fight the catch (capture in
   Campaign). Sometimes a big Dominant fish.
   ===================================================================== */
function fishingPool() {
  return RECRUIT.filter(m => m.t.includes('Eau') && (familyRegion(m.id) === regionIndex() || m.id === 'magicarpe')); // the region's fish, Magikarp bites everywhere (v4.21)
}

function drawFishingCatch() {
  const L = fishingPool();
  if (!L.length) {
    return null;
  }
  const w = L.map(
    m => (m.id === 'magicarpe' ? [0, 4, 2, 1][regionIndex()] : 1) * (!PROFILE.box.includes(m.id) ? 2 : 1)
  );
  return drawWeightedMon(L, w).id;
}

function castFishingLine() {
  clearTimeout(FISHING && FISHING.t);
  FISHING = { status: 'attente' };
  renderFishingPanel();
  $('#fishing-panel').hidden = false;
  FISHING.t = setTimeout(
    () => {
      if (!FISHING || FISHING.status !== 'attente') {
        return;
      }
      FISHING.status = 'mord';
      vibrate(60);
      sfx('ui');
      renderFishingPanel();
      FISHING.t = setTimeout(
        () => {
          if (!FISHING || FISHING.status !== 'mord') {
            return;
          }
          FISHING.status = 'rate';
          renderFishingPanel();
        },
        PREFERENCES.fast ? 1400 : 1150
      );
    },
    1200 + Math.random() * 2200
  );
}

function setFishingHook() {
  if (!FISHING || FISHING.status !== 'mord') {
    return;
  }
  clearTimeout(FISHING.t);
  const id = drawFishingCatch();
  if (!id) {
    return;
  }
  FISHING = { status: 'prise', id, sh: Math.random() < SHINY_RATE * multChroma(), dom: Math.random() < 0.05 };
  PROFILE.catches = (PROFILE.catches || 0) + 1;
  queueSave();
  renderFishingPanel();
}

/* fishing window: rendered by React (src/screens/overlays/FishingWindow.jsx) */
function renderFishingPanel() {
  const el = $('#fishing-panel'),
    P2 = FISHING || {};
  // the shiny artwork is recolored after rendering (v4.25)
  setTimeout(
    () => P2.status === 'prise' && P2.sh && applyShinyArt(el.querySelector('.fishing-catch img'), POKEMON[P2.id].no),
    0
  );
  paintOverlay('peche', {
    status: P2.status,
    id: P2.id,
    sh: P2.sh,
    dom: P2.dom,
    known: !!P2.id && PROFILE.box.includes(P2.id),
    route: routeName(),
    catches: PROFILE.catches || 0,
  });
}

function startFishingBattle() {
  const P2 = FISHING;
  if (!P2 || P2.status !== 'prise') {
    return;
  }
  $('#fishing-panel').hidden = true;
  __set_wildId(P2.id);
  const D = wildScen(P2.id, TOD, P2.sh, P2.dom);
  Object.assign(D, {
    water: ['4,0', '5,0', '6,0', '5,1', '6,1', '7,1', '6,3', '7,3', '5,4', '6,4', '7,5'],
    lvl: D.lvl.replace(/rencontre|Dominant/, P2.dom ? 'pêche · Dominant' : 'pêche'),
  });
  D.foes = D.foes.map(f => [f[0], f[0] === P2.id ? [6, 2] : [7, 4], f[2]]);
  FISHING = null;
  __set_scSel('sauvage');
  goTo('combat');
  if (!squad.length) {
    renderPrep();
    return void toast('Recrutez au moins un Pokémon avant de combattre.');
  }
  launch();
}

/** Weighted random draw: L[i] has weight w[i]. */
export const drawWeightedMon = (L, w) => {
  let r = Math.random() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < L.length; i++) {
    r -= w[i];
    if (r <= 0) {
      return L[i];
    }
  }
  return L[L.length - 1];
};

function onFishingClick(e) {
  if (e.target.closest('[data-fishing-start]')) {
    return void castFishingLine();
  }
  const b = e.target.closest('[data-fishing-panel]');
  if (!b) {
    if (e.target.id === 'fishing-panel') {
      clearTimeout(FISHING && FISHING.t);
      FISHING = null;
      $('#fishing-panel').hidden = true;
    }
    return;
  }
  const k = b.dataset.fishingPanel;
  if (k === 'ferrer') {
    setFishingHook();
  } else if (k === 'lancer') {
    castFishingLine();
  } else if (k === 'combat') {
    startFishingBattle();
  } else if (k === 'recruter' && FISHING && !squad.includes(FISHING.id)) {
    toggle(FISHING.id);
    $('#fishing-panel').hidden = true;
  } else if (k === 'relacher') {
    toast('Il retourne à l’eau.');
    castFishingLine();
  } else if (k === 'x') {
    clearTimeout(FISHING && FISHING.t);
    FISHING = null;
    $('#fishing-panel').hidden = true;
  }
}

// Statements run at startup, in the original order (see index.js).
export function init() {
  FISHING = null;

  // #fishingPanel: rendered by React (src/screens/overlays/FishingWindow.jsx)

  document.addEventListener('click', onFishingClick);
}
