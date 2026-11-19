/* Original section: v4-04-accueil.js */

import { $, RM } from './014-utils.js';
import { go } from './016-navigation.js';
import { encounter } from './017-home-route.js';
import { goFight } from './024-combat-ui.js';
import { renderWallet } from './035-interface.js';
import { renderCampBase } from './049-identity.js';
import { seasonRoute } from './050-world.js';
import { refreshHome } from '../screens/home/homeStore.js';

// The Home screen is rendered by React (src/screens/home): hero, companion, banners, team,
// quest, news, shortcuts, footer, trainer card, friends and side objective.
// Redrawing = rereading the engine's state. What remains here is the wallet and the Base Camp.
export function renderHome() {
  seasonRoute(); // data-saison (season) of the route (v4.11)
  refreshHome();
  renderWallet();
  renderCampBase(); // camp and expeditions (v4.10)
}

// Statements run at startup, in the original order (see index.js).
export function __init() {
  /* ---------- Home: adventure hub ---------- */
  /* the v4 Home grid (.v4-home) and its shortcuts are rendered by React (Home.jsx, Tiles.jsx) */
  document.addEventListener('click', e => {
    const f = e.target.closest('[data-v4fight]');
    if (f) {
      goFight(f.dataset.v4fight);
      return;
    }
    const w = e.target.closest('[data-v4wild]');
    if (w) {
      go('carte');
      const r = $('#route');
      if (r && r.scrollIntoView) {
        r.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'center' });
      }
      setTimeout(() => encounter(), RM ? 0 : 450);
    }
  });
}
