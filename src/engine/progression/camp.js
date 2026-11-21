import { goTo } from '../core/navigation.js';
import { SWIPE_TABS } from '../ui/touch-gestures.js';

/* =====================================================================
   The « Camp » tab (added in v4.30): buildings, expeditions, Daycare,
   Garden, Dojo… open in Campaign as in Free mode.
   ===================================================================== */

/** The base Camp is open in Campaign as in Free mode (v4.30). */
export function campOpen() {
  return true;
}

// The Camp page (skeleton, base Camp, tabs) is rendered by React: src/screens/camp.

// Startup statements, run in their original order (see index.js).
export function init() {
  /* icons (camp, sky, weather, doctrine): in src/components/SvgSprite.jsx */

  // the #camp page and its navigation links (sidebar, bottom bar) are rendered by React
  if (!SWIPE_TABS.includes('camp')) {
    SWIPE_TABS.push('camp');
  }

  /* ---------- what's new ---------- */
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-news="camp-news"]');
    if (!b) {
      return;
    }
    e.stopPropagation();
    goTo('camp');
  });
}
