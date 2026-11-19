/* Original section: v4.25-01-art-direction.js */

import { AUTO } from './030-prestige-staging.js';

// no. → true (loaded) / false (unavailable)
export function applyShinyArt(img, no) {
  if (!img || !no || AUTO) {
    return;
  }
  const applyIt = () => {
    if (!img.isConnected) {
      return;
    }
    img.src = shinyArtUrl(no);
    img.classList.add('art-sh');
  };
  if (SHINY_ART_OK[no] === true) {
    return void applyIt();
  }
  if (SHINY_ART_OK[no] === false) {
    return;
  }
  const t = new Image();
  t.onload = () => {
    SHINY_ART_OK[no] = true;
    applyIt();
  };
  t.onerror = () => {
    SHINY_ART_OK[no] = false;
  };
  t.src = shinyArtUrl(no);
}

/* =====================================================================
   v4.25: ChatGPT's art direction (layers v4.21 → v4.24)
   applied for good. Here, the script part: the real shiny
   illustrations (Pokédex, list, encounter, fishing). They replace the
   game's tint only once loaded; offline, nothing changes.
   ===================================================================== */
const shinyArtUrl = no =>
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/' +
  no +
  '.png';

const SHINY_ART_OK = {};
