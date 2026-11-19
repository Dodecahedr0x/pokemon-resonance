/* Original section: v4-03-interface.js */

import { PROFILE } from './011-game-state.js';
import { $, $$ } from './014-utils.js';
import { openSaves } from './025-saves.js';
import { V4, fmt } from './032-v4-foundation.js';
import { refreshWallet, setMenuOpen } from '../components/shellStore.js';

function menu(open) {
  V4.menu = open;
  setMenuOpen(open); // #v4Menu and #bnMenu (aria-expanded): src/components/Nav.jsx
  if (open) {
    const f = $('#v4Menu .v4-mi');
    if (f) {
      f.focus();
    }
  }
}

// Trainer, Pokédollars and Shards of the top bar: redrawn by React (TopBar.jsx).
export function renderWallet() {
  refreshWallet();
  $$('[data-wallet]').forEach(el => {
    el.textContent = fmt(el.dataset.wallet === 'gems' ? PROFILE.gems : PROFILE.money);
  });
}

/* extra pictograms: in src/components/SvgSprite.jsx */

/* ---------- navigation: 9 destinations on desktop, 5 on phone ---------- */
// pages and titles: TABS and TNAME (016); sidebar, bottom bar and phone
// menu (#v4Menu): src/components/Nav.jsx

// Statements run at startup, in the original order (see index.js).
export function __init() {
  document.addEventListener('click', e => {
    if (e.target.closest('#bnMenu')) {
      menu(!V4.menu);
      return;
    }
    if (e.target.closest('[data-menux]')) {
      menu(false);
      return;
    }
    if (V4.menu && e.target.closest('#v4Menu [data-t]')) {
      menu(false);
    }
    if (e.target.closest('[data-v4saves]')) {
      menu(false);
      openSaves();
    }
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && V4.menu) {
      menu(false);
    }
  });

  // top bar (trainer, Pokédollars, Shards, settings): src/components/TopBar.jsx
  // launch screen (title and button): src/components/LaunchScreen.jsx
}
