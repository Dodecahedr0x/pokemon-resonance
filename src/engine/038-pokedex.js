/* Section d'origine : v4-06-pokedex.js */

import { BY, MON } from './009-pokemon.js';
import { $, $$, RM } from './014-utils.js';
import { norm, openSheet, squad } from './020-team-cards.js';
import { V4 } from './032-v4-foundation.js';
import { isShinyOwned } from './043-adventure-plus.js';
import { chromaArt425 } from './062-art-direction.js';
import { scanDex448 } from './079-immersion-sound-haptics.js';
import { refreshDex } from '../screens/dex/dexStore.js';

export let DEXS;
// vrai dès le premier affichage de la page : avant, #dex reste vide (ancien buildDex)
export let dexBuilt;

 // v4.13
export function dexList() {
  const q = norm(V4.dexQ || '');
  let L = DEXS.filter(
    m =>
      (V4.dexGen === 'all' || String(m.gen) === V4.dexGen) &&
      (!q || norm(m.n).includes(q) || String(m.no).includes(q) || m.t.some(t => norm(t).includes(q)))
  );
  if (V4.dexSort === 'nom') L = [...L].sort((a, b) => a.n.localeCompare(b.n, 'fr'));
  if (V4.dexSort === 'type') L = [...L].sort((a, b) => a.t[0].localeCompare(b.t[0], 'fr') || a.no - b.no);
  return L;
}


// La page « Pokédex » (#dex) est rendue par React (src/screens/dex) : dessiner = rafraîchir le store.
function renderDexList() {
  if (!dexBuilt) return;
  refreshDex();
  $$('#dex4List .v4-dl.shiny').forEach(b => BY[b.dataset.dex] && chromaArt425(b.querySelector('img'), BY[b.dataset.dex].no)); // v4.25
}


export function renderDexCard() {
  if (dexBuilt) {
    const m = BY[V4.dexSel] || DEXS[0];
    V4.dexSel = m.id;
    refreshDex();
    setTimeout(() => isShinyOwned(m.id) && chromaArt425($('#dex4Card .v4d-art img'), m.no), 0); // v4.25
  }
  scanDex448();
}


export function renderDex() {
  if ($('#dex')) dexBuilt = true;
  if (!V4.dexSel) V4.dexSel = (squad[0] && BY[squad[0]].id) || 'bulbizarre';
  renderDexCard();
  renderDexList();
}

// Instructions exécutées au démarrage, dans l'ordre d'origine (voir index.js).
export function __init() {

/* ---------- Pokédex détaillé ---------- */
DEXS = MON.filter(m => !m.ennemi).sort((a, b) => a.no - b.no);


dexBuilt = false;


document.addEventListener('click', e => {
  const d = e.target.closest('[data-dex]');
  if (d && $('#dex') && $('#dex').contains(d)) {
    V4.dexSel = d.dataset.dex;
    renderDexCard(); // redessine aussi la liste (élément choisi)
    if (d.closest('#dex4List') && innerWidth < 1000) {
      const c = $('#dex4Card');
      if (c) c.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'start' });
    }
    return;
  }
  const s = e.target.closest('[data-v4sheet]');
  if (s) openSheet(s.dataset.v4sheet);
});


// recherche, région et tri (champs rendus par React, src/screens/dex)
document.addEventListener('input', e => {
  if (e.target.id !== 'dex4Q') return;
  V4.dexQ = e.target.value;
  renderDexList();
});
document.addEventListener('change', e => {
  const t = e.target;
  if (t.id === 'dex4Gen') V4.dexGen = t.value;
  else if (t.id === 'dex4Sort') V4.dexSort = t.value;
  else return;
  renderDexList();
});
}
