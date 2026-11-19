/* Section d'origine : 4.69 : écran de résultat défilable */


// Instructions exécutées au démarrage, dans l'ordre d'origine (voir index.js).
export function __init() {

(() => {
  const R = document.getElementById('cbResult');
  if (!R) return;
  new MutationObserver(() => {
    if (!R.hidden) R.scrollTop = 0;
  }).observe(R, { attributes: true, attributeFilter: ['hidden'] });
})();

}
