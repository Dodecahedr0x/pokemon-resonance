import { BY, MON } from '../pokemon/pokemon.js';
import { $, $$, RM } from '../core/utils.js';
import { norm, openSheet, squad } from '../team/team.js';
import { V4 } from '../ui/screen-state.js';
import { isShinyOwned } from '../pokemon/shiny.js';
import { applyShinyArt } from '../assets/art-direction.js';
import { scanPokedex } from '../audio/immersion.js';
import { refreshDex } from '../../screens/dex/dexStore.js';

export let DEXS;
// true from the page's first display: before that, #dex stays empty (old buildDex)
export let dexBuilt;

// v4.13
export function dexList() {
  const q = norm(V4.dexQ || '');
  let L = DEXS.filter(
    m =>
      (V4.dexGen === 'all' || String(m.gen) === V4.dexGen) &&
      (!q || norm(m.n).includes(q) || String(m.no).includes(q) || m.t.some(t => norm(t).includes(q)))
  );
  if (V4.dexSort === 'nom') {
    L = [...L].sort((a, b) => a.n.localeCompare(b.n, 'fr'));
  }
  if (V4.dexSort === 'type') {
    L = [...L].sort((a, b) => a.t[0].localeCompare(b.t[0], 'fr') || a.no - b.no);
  }
  return L;
}

// The "Pokédex" page (#dex) is rendered by React (src/screens/dex): drawing = refreshing the store.
function renderDexList() {
  if (!dexBuilt) {
    return;
  }
  refreshDex();
  $$('#dex4List .dex-row.shiny').forEach(
    b => BY[b.dataset.dex] && applyShinyArt(b.querySelector('img'), BY[b.dataset.dex].no)
  ); // v4.25
}

export function renderDexCard() {
  if (dexBuilt) {
    const m = BY[V4.dexSel] || DEXS[0];
    V4.dexSel = m.id;
    refreshDex();
    setTimeout(() => isShinyOwned(m.id) && applyShinyArt($('#dex4Card .dex-art img'), m.no), 0); // v4.25
  }
  scanPokedex();
}

export function renderDex() {
  if ($('#dex')) {
    dexBuilt = true;
  }
  if (!V4.dexSel) {
    V4.dexSel = (squad[0] && BY[squad[0]].id) || 'bulbizarre';
  }
  renderDexCard();
  renderDexList();
}

// Statements executed at startup, in the original order (see index.js).
export function init() {
  /* ---------- Detailed Pokédex ---------- */
  DEXS = MON.filter(m => !m.isEnemy).sort((a, b) => a.no - b.no);

  dexBuilt = false;

  document.addEventListener('click', e => {
    const d = e.target.closest('[data-dex]');
    if (d && $('#dex') && $('#dex').contains(d)) {
      V4.dexSel = d.dataset.dex;
      renderDexCard(); // also redraws the list (selected item)
      if (d.closest('#dex4List') && innerWidth < 1000) {
        const c = $('#dex4Card');
        if (c) {
          c.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'start' });
        }
      }
      return;
    }
    const s = e.target.closest('[data-v4sheet]');
    if (s) {
      openSheet(s.dataset.v4sheet);
    }
  });

  // search, region and sort (fields rendered by React, src/screens/dex)
  document.addEventListener('input', e => {
    if (e.target.id !== 'dex4Q') {
      return;
    }
    V4.dexQ = e.target.value;
    renderDexList();
  });
  document.addEventListener('change', e => {
    const t = e.target;
    if (t.id === 'dex4Gen') {
      V4.dexGen = t.value;
    } else if (t.id === 'dex4Sort') {
      V4.dexSort = t.value;
    } else {
      return;
    }
    renderDexList();
  });
}
