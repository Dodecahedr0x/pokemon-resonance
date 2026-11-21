/* Navigation menu (#v4Menu, phone): opened from the bottom bar, closed by Escape, a destination or the saves entry. */

import { $ } from '../core/utils.js';
import { openSaves } from '../state/saves.js';
import { SCREEN_STATE } from './screen-state.js';
import { setMenuOpen } from '../../components/shellStore.js';

function menu(open) {
  SCREEN_STATE.menu = open;
  setMenuOpen(open); // #v4Menu and #bnMenu (aria-expanded): src/components/Nav.jsx
  if (open) {
    const f = $('#v4Menu .menu-item');
    if (f) {
      f.focus();
    }
  }
}

/* extra pictograms: in src/components/SvgSprite.jsx */

/* ---------- navigation: 9 destinations on desktop, 5 on phone ---------- */
// pages and titles: TABS and TNAME (016); sidebar, bottom bar and phone
// menu (#v4Menu): src/components/Nav.jsx

// Statements run at startup, in the original order (see index.js).
export function init() {
  document.addEventListener('click', e => {
    if (e.target.closest('#bnMenu')) {
      menu(!SCREEN_STATE.menu);
      return;
    }
    if (e.target.closest('[data-menux]')) {
      menu(false);
      return;
    }
    if (SCREEN_STATE.menu && e.target.closest('#v4Menu [data-t]')) {
      menu(false);
    }
    if (e.target.closest('[data-v4saves]')) {
      menu(false);
      openSaves();
    }
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && SCREEN_STATE.menu) {
      menu(false);
    }
  });

  // top bar (trainer, Pokédollars, Shards, settings): src/components/TopBar.jsx
  // launch screen (title and button): src/components/LaunchScreen.jsx
}
