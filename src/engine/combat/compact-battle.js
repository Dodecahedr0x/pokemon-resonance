/* Battle on phone: the top banner collapses, both teams show at once and the board fills the space above the « Fin du tour » (End turn) bar. */

import { currentScreen } from '../core/navigation.js';
import { B } from './ui.js';

let COMPACT_MQ;

// Toggles body.compact-battle while the battle screen is shown on a phone; the board then takes the width of its
// frame (styles in board-host-layout.css).
export function fitPhoneBattle() {
  const cb = document.getElementById('cbBattle');
  const on = !!(COMPACT_MQ && COMPACT_MQ.matches && B && currentScreen === 'combat' && cb && !cb.hidden);
  document.body.classList.toggle('compact-battle', on);
}

// Startup statements, run in their original order (see index.js).
export function init() {
  COMPACT_MQ = window.matchMedia ? matchMedia('(max-width: 700px)') : null;
  window.addEventListener('resize', () => fitPhoneBattle());
  // the gym rule fits on one line; we touch it to read it in full
  document.addEventListener('click', e => {
    const a = e.target.closest('#bArena');
    if (a && document.body.classList.contains('compact-battle')) {
      a.classList.toggle('is-open');
    }
  });
  if (window.visualViewport) {
    visualViewport.addEventListener('resize', () => fitPhoneBattle());
  }
  const cb = document.getElementById('cbBattle');
  if (cb && window.MutationObserver) {
    new MutationObserver(() => fitPhoneBattle()).observe(cb, { attributes: true, attributeFilter: ['hidden'] });
  }
}
