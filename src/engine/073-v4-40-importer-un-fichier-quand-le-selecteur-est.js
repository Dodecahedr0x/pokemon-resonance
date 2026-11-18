/* Section d'origine : v4.40 : « Importer un fichier » quand le sélecteur est bloqué */

import { $, toast } from './014-08-outils.js';
import { SV, renderSaves } from './025-19-sauvegardes.js';

// Instructions exécutées au démarrage, dans l'ordre d'origine (voir index.js).
export function __init() {

/* Dans certaines applis le sélecteur de fichiers ne s’ouvre pas. Le bouton le détecte et ouvre la zone « Coller un code » (le texte du fichier .json y marche aussi). */
document.addEventListener('click', e => {
  const b = e.target.closest('[data-sv="importfile"]');
  if (!b) return;
  const i = $('#svFile');
  if (!i) return;
  let opened = false;
  const mark = () => (opened = true);
  window.addEventListener('blur', mark, { once: true });
  document.addEventListener('visibilitychange', mark, { once: true });
  i.addEventListener('change', mark, { once: true });
  i.addEventListener('cancel', mark, { once: true });
  try {
    i.click();
  } catch (er) {}
  setTimeout(() => {
    if (opened) return;
    toast('Le sélecteur de fichiers est bloqué ici : collez le texte de votre sauvegarde ci-dessous.');
    SV.code = { mode: 'paste' };
    renderSaves();
    const t = $('#svCode');
    if (t) t.focus();
  }, 1400);
});
}
