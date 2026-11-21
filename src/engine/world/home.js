import { $, RM } from '../core/utils.js';
import { goTo } from '../core/navigation.js';
import { encounter } from './home-route.js';
import { goFight } from '../combat/ui.js';
import { renderWallet } from '../ui/wallet.js';
import { renderCampBase } from '../progression/base-camp.js';
import { seasonRoute } from './seasons.js';
import { refreshHome } from '../../screens/home/homeStore.js';

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
export function init() {
  /* ---------- Home: adventure hub ---------- */
  /* the Home grid (.home-layout) and its shortcuts are rendered by React (Home.jsx, Tiles.jsx) */
  document.addEventListener('click', e => {
    const f = e.target.closest('[data-v4fight]');
    if (f) {
      goFight(f.dataset.v4fight);
      return;
    }
    const w = e.target.closest('[data-v4wild]');
    if (w) {
      goTo('carte');
      const r = $('#route');
      if (r && r.scrollIntoView) {
        r.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'center' });
      }
      setTimeout(() => encounter(), RM ? 0 : 450);
    }
  });
}
