/* Section d'origine : 4.69 : écran de résultat défilable */

import { NEWS416 } from './056-v4-16-1-01-finitions.js';

// Instructions exécutées au démarrage, dans l'ordre d'origine (voir index.js).
export function __init() {

(() => {
  const R = document.getElementById('cbResult');
  if (!R) return;
  new MutationObserver(() => {
    if (!R.hidden) R.scrollTop = 0;
  }).observe(R, { attributes: true, attributeFilter: ['hidden'] });
})();


NEWS416.splice(8); // la liste « Nouveau » garde les 8 annonces les plus récentes
}
