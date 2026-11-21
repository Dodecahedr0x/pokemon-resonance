import { PREFERENCES, savePref } from './preferences.js';
import { renderParams } from './settings.js';

// Accessibility switches (Settings › Accessibility): toggling one re-applies the a11y-* classes.
const ACCESSIBILITY_PREFS = new Set(['highContrast', 'colorBlind', 'leftHand', 'reduceMotion']);

/* =====================================================================
   Accessibility (added in v4.32): text size, contrast, color blindness,
   left-handed layout, animations.
   ===================================================================== */
function applyAccessibility() {
  const h = document.documentElement,
    t = PREFERENCES.textSize || 'normal';
  h.classList.toggle('a11y-t1', t === 'grand');
  h.classList.toggle('a11y-t2', t === 'tgrand');
  h.classList.toggle('a11y-hc', !!PREFERENCES.highContrast);
  h.classList.toggle('a11y-cb', !!PREFERENCES.colorBlind);
  h.classList.toggle('a11y-lh', !!PREFERENCES.leftHand);
  h.classList.toggle('a11y-rm', !!PREFERENCES.reduceMotion);
}

// Startup statements, run in their original order (see index.js).
export function init() {
  applyAccessibility();

  document.addEventListener('click', e => {
    const b = e.target.closest('[data-text-size]');
    if (!b) {
      return;
    }
    PREFERENCES.textSize = b.dataset.textSize;
    savePref();
    applyAccessibility();
    renderParams();
  });

  document.addEventListener('change', e => {
    const p = e.target.closest('[data-pref]');
    if (p && ACCESSIBILITY_PREFS.has(p.dataset.pref)) {
      if (p.dataset.pref === 'reduceMotion') {
        PREFERENCES.animEnabled = !p.checked;
      }
      savePref();
      applyAccessibility();
    }
  });
}
