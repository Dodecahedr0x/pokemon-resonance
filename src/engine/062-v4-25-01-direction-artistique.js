/* Section d'origine : v4.25-01-direction-artistique.js */

import { AUTO } from './030-24-prestige-mise-en-scene.js';
import { NEWS416 } from './056-v4-16-1-01-finitions.js';

let SHART425, SHOK425;

 // n° → true (chargée) / false (indisponible)
export function chromaArt425(img, no) {
  if (!img || !no || AUTO) return;
  const poser = () => {
    if (!img.isConnected) return;
    img.src = SHART425(no);
    img.classList.add('art-sh');
  };
  if (SHOK425[no] === true) return void poser();
  if (SHOK425[no] === false) return;
  const t = new Image();
  t.onload = () => {
    SHOK425[no] = true;
    poser();
  };
  t.onerror = () => {
    SHOK425[no] = false;
  };
  t.src = SHART425(no);
}

// Instructions exécutées au démarrage, dans l'ordre d'origine (voir index.js).
export function __init() {

/* =====================================================================
   v4.25 : la direction artistique de ChatGPT (couches v4.21 → v4.24)
   appliquée pour de bon. Ici, la partie script : les vraies illustrations
   chromatiques (Pokédex, liste, rencontre, pêche). Elles remplacent la
   teinte du jeu seulement une fois chargées ; hors ligne, rien ne change.
   ===================================================================== */
SHART425 = no => 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/' + no + '.png';


SHOK425 = {};


NEWS416.unshift(['i-star', 'Nouvelle direction artistique', 'Accueil, Équipe, Pokédex, Carte et Combat habillés de neuf : panneaux bleu nuit, reflets cyan, cartes de collection, vraies illustrations chromatiques.', null]);
}
