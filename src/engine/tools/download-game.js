/* Download the game (to edit it with another tool) (added in v4.41). */

import { toast } from '../core/utils.js';
import { SV } from '../state/saves.js';

// Instructions run at startup, in the original order (see index.js).
export function init() {
  /* Settings › "Download the game": the complete HTML file, served next to the page. */
  // "Download the game" panel: rendered by React (src/screens/settings/panels/DownloadGame.jsx)

  document.addEventListener('click', async e => {
    const b = e.target.closest('#download-b');
    if (!b) {
      return;
    }
    b.disabled = true;
    const old = b.textContent;
    b.textContent = 'Préparation…';
    try {
      const r = await fetch('source/Pokemon_Resonance.txt');
      if (!r.ok) {
        throw new Error('indisponible');
      }
      const data = await r.text();
      if (SV.dl) {
        try {
          await SV.dl.save({ filename: 'Pokemon_Resonance.html', data });
          toast('Fichier du jeu téléchargé.');
          return;
        } catch (er) {
          if (er && er.code === 'declined') {
            return;
          }
        }
      }
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([data], { type: 'text/html' }));
      a.download = 'Pokemon_Resonance.html';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        URL.revokeObjectURL(a.href);
        a.remove();
      }, 1500);
      toast('Fichier du jeu téléchargé.');
    } catch (er) {
      toast('Téléchargement impossible ici (hors ligne ou fichier absent).');
    } finally {
      b.disabled = false;
      b.textContent = old;
    }
  });
}
