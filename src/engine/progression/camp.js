import { $, RM } from '../core/utils.js';
import { go } from '../core/navigation.js';
import { goFight } from '../combat/ui.js';
import { V4 } from '../ui/screen-state.js';
import { renderMap } from '../world/map.js';
import { renderQuests } from './quests-shop.js';
import { SWIPE_TABS } from '../ui/touch-gestures.js';

/* =====================================================================
   The « Camp » tab (added in v4.30): buildings, expeditions, Daycare,
   Garden, Dojo… open in Campaign as in Free mode, plus the outings
   (grass, fishing, Safari Park, Tower, tournament).
   ===================================================================== */

/** The base Camp is open in Campaign as in Free mode (v4.30). */
export function campOpen() {
  return true;
}

// The Camp page (skeleton, base Camp, Outings) is rendered by React: src/screens/camp.

// Startup statements, run in their original order (see index.js).
export function init() {
  /* icons (camp, sky, weather, doctrine): in src/components/SvgSprite.jsx */

  // the #camp page and its navigation links (sidebar, bottom bar) are rendered by React
  if (!SWIPE_TABS.includes('camp')) {
    SWIPE_TABS.push('camp');
  }

  document.addEventListener('click', e => {
    const b = e.target.closest('[data-outing]');
    if (!b) {
      return;
    }
    const k = b.dataset.outing;
    if (k === 'herbes') {
      go('carte');
      const r = $('#route');
      if (r && r.scrollIntoView) {
        r.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'center' });
      }
    } else if (k === 'safari') {
      V4.region = 'kanto';
      V4.mapSel = 'safari';
      go('carte');
      renderMap();
    } else if (k === 'tour') {
      goFight('tdr');
    } else if (k === 'amis') {
      go('accueil');
      const a = document.getElementById('v4Amis');
      if (a && a.scrollIntoView) {
        a.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'start' });
      }
    } else if (k === 'hebdo') {
      V4.questTab = 'event';
      go('quetes');
      renderQuests();
    }
  });

  /* ---------- what's new ---------- */
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-news="camp-news"]');
    if (!b) {
      return;
    }
    e.stopPropagation();
    go('camp');
  });
}
