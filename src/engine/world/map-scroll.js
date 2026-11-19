import { RM } from '../core/utils.js';
import { cur } from '../core/navigation.js';

/* =====================================================================
   Regional map scrolling (added in v4.30): the maps can be scrolled
   again with arrows.
   ===================================================================== */
export function updateScrollArrows() {
  const sc = document.getElementById('mapSc');
  if (!sc) {
    return;
  }
  // the two arrows (.mapScroll) are rendered by React (src/screens/map/MapScreen.jsx); their
  // hidden attribute stays set here, based on the measured scroll
  const box = sc.parentNode;
  const max = sc.scrollWidth - sc.clientWidth;
  box.querySelectorAll('.map-scroll').forEach(b => {
    const d = +b.dataset.mapScroll;
    b.hidden = max < 8 || (d < 0 ? sc.scrollLeft < 8 : sc.scrollLeft > max - 8);
  });
}

// Startup statements, run in their original order (see index.js).
export function init() {
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-map-scroll]');
    if (!b) {
      return;
    }
    const sc = document.getElementById('mapSc');
    if (!sc) {
      return;
    }
    sc.scrollBy({ left: +b.dataset.mapScroll * sc.clientWidth * 0.7, behavior: RM ? 'auto' : 'smooth' });
    setTimeout(updateScrollArrows, RM ? 30 : 420);
  });

  document.addEventListener(
    'scroll',
    e => {
      if (e.target && e.target.id === 'mapSc') {
        clearTimeout(updateScrollArrows.t);
        updateScrollArrows.t = setTimeout(updateScrollArrows, 60);
      }
    },
    true
  );

  window.addEventListener('resize', () => setTimeout(updateScrollArrows, 100));

  document.addEventListener('click', () => {
    if (cur === 'carte') {
      setTimeout(updateScrollArrows, 90);
    }
  });
}
