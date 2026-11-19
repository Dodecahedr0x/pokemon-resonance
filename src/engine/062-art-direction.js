/* Section d'origine : v4.25-01-direction-artistique.js */

import { AUTO } from './030-prestige-staging.js';


 // n° → true (chargée) / false (indisponible)
export function chromaArt425(img, no) {
  if (!img || !no || AUTO) return;
  const applyIt = () => {
    if (!img.isConnected) return;
    img.src = SHART425(no);
    img.classList.add('art-sh');
  };
  if (SHOK425[no] === true) return void applyIt();
  if (SHOK425[no] === false) return;
  const t = new Image();
  t.onload = () => {
    SHOK425[no] = true;
    applyIt();
  };
  t.onerror = () => {
    SHOK425[no] = false;
  };
  t.src = SHART425(no);
}

/* =====================================================================
   v4.25 : la direction artistique de ChatGPT (couches v4.21 → v4.24)
   appliquée pour de bon. Ici, la partie script : les vraies illustrations
   chromatiques (Pokédex, liste, rencontre, pêche). Elles remplacent la
   teinte du jeu seulement une fois chargées ; hors ligne, rien ne change.
   ===================================================================== */
const SHART425 = no => 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/' + no + '.png';


const SHOK425 = {};
