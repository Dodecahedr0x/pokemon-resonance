/* Section d'origine : v4.41 : télécharger le jeu (pour le modifier avec un autre outil) */

import { toast } from './014-08-outils.js';
import { SV } from './025-19-sauvegardes.js';

// Instructions exécutées au démarrage, dans l'ordre d'origine (voir index.js).
export function __init() {

/* Paramètres › « Télécharger le jeu » : le fichier HTML complet, servi à côté de la page. */
// panneau « Télécharger le jeu » : rendu par React (src/screens/settings/panels/TelechargerJeu.jsx)


document.addEventListener('click', async e => {
  const b = e.target.closest('#dl441b');
  if (!b) return;
  b.disabled = true;
  const old = b.textContent;
  b.textContent = 'Préparation…';
  try {
    const r = await fetch('source/Pokemon_Resonance.txt');
    if (!r.ok) throw new Error('indisponible');
    const data = await r.text();
    if (typeof SV !== 'undefined' && SV.dl) {
      try {
        await SV.dl.save({ filename: 'Pokemon_Resonance.html', data });
        toast('Fichier du jeu téléchargé.');
        return;
      } catch (er) {
        if (er && er.code === 'declined') return;
      }
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([data], { type: 'text/html' }));
    a.download = 'Pokemon_Resonance.html';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
    toast('Fichier du jeu téléchargé.');
  } catch (er) {
    toast('Téléchargement impossible ici (hors ligne ou fichier absent).');
  } finally {
    b.disabled = false;
    b.textContent = old;
  }
});
}
