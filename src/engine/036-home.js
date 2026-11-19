/* Section d'origine : v4-04-accueil.js */

import { $, RM } from './014-utils.js';
import { go } from './016-navigation.js';
import { encounter } from './017-home-route.js';
import { goFight } from './024-combat-ui.js';
import { renderWallet } from './035-interface.js';
import { renderCampBase } from './049-identity.js';
import { seasonRoute } from './050-world.js';
import { refreshHome } from '../screens/home/homeStore.js';



// L'Accueil est rendu par React (src/screens/accueil) : héros, compagnon, bannières, équipe,
// quête, nouveautés, raccourcis, bas de page, carte de dresseur, amis et objectif latéral.
// Redessiner = relire l'état du moteur. Restent ici le porte-monnaie et le Camp de base.
export function renderHome() {
  seasonRoute(); // data-saison de la route (v4.11)
  refreshHome();
  renderWallet();
  renderCampBase(); // camp et expéditions (v4.10)
}

// Instructions exécutées au démarrage, dans l'ordre d'origine (voir index.js).
export function __init() {

/* ---------- Accueil : hub d’aventure ---------- */
/* la grille v4 de l'Accueil (.v4-home) et ses raccourcis sont rendus par React (Accueil.jsx, Tuiles.jsx) */
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
    if (r && r.scrollIntoView) r.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'center' });
    setTimeout(() => encounter(), RM ? 0 : 450);
  }
});
}
