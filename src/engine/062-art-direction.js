/* Original section: v4.25-01-art-direction.js */

import { AUTO } from './030-prestige-staging.js';


 // no. → true (loaded) / false (unavailable)
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
   v4.25: ChatGPT's art direction (layers v4.21 → v4.24)
   applied for good. Here, the script part: the real shiny
   illustrations (Pokédex, list, encounter, fishing). They replace the
   game's tint only once loaded; offline, nothing changes.
   ===================================================================== */
const SHART425 = no => 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/' + no + '.png';


const SHOK425 = {};
