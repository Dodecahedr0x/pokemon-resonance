/* Original section: v4.1-01-illustrations.js */

import { BY, PKT } from './009-pokemon.js';
import { ITEMS2 } from './011-game-state.js';
import { tokCl, unitsDirty } from '../screens/combat/board/boardStore.js';
import { L } from './024-combat-ui.js';
import { ART, HELD_IMG, ITM } from './032-v4-foundation.js';

let ITEM_SVG;

export function itemize(h) {
  if (typeof h !== 'string') {
    return h;
  }
  for (const k in ITEM_SVG) {
    if (h.includes(ITEM_SVG[k])) {
      h = h
        .split(ITEM_SVG[k])
        .join(`<img class="it-img" src="${ITM(HELD_IMG[k])}" alt="" loading="lazy" onerror="this.remove()">`);
    }
  }
  return h;
}

// Token illustration (.tok-im image before the badge, in the v4.29 animated group): rendered by
// Units.jsx from the token template (imOn, geo, href).
export function tokenArt(u) {
  const T = L.u && L.u[u.uid];
  if (!T) {
    return;
  }
  if (!T.imOn) {
    T.imOn = true;
    T.geo = ['-17', '-22', '34']; // x, y, width = height
    unitsDirty();
  }
  if (T.imOn && T.imId !== u.id && BY[u.id]) {
    T.imId = u.id;
    tokCl(T, 'has-im', false);
    T.href = ART(BY[u.id].no);
    unitsDirty();
  }
}

/** the token image is loaded */
export function tokArtOk(T) {
  tokCl(T, 'has-im', true);
}

/** the token image is missing: removed; the next one (without a URL) sits outside its v4.77 group */
export function tokArtErr(T) {
  tokCl(T, 'has-im', false);
  T.imOn = false;
  T.imBad = true;
  if (T.w477) {
    T.imLoose = true;
  }
  T.href = null;
  unitsDirty();
}

export function preload(ids) {
  ids.forEach(id => {
    const m = BY[id];
    if (!m || pre.has(m.no)) {
      return;
    }
    pre.add(m.no);
    const i = new Image();
    i.decoding = 'async';
    i.src = ART(m.no);
  });
}

/* =====================================================================
   v4.1 · the real Pokémon everywhere
   Every type medallion that represents a Pokémon now shows
   its illustration; the board, sheets, encounters,
   evolutions and results too. Held items have their image.
   Offline, the original type medallion stays displayed.
   ===================================================================== */
export const tagUnits = S => {
  if (S && Array.isArray(S.units)) {
    S.units.forEach(u => {
      if (u && Array.isArray(u.t) && BY[u.id]) {
        PKT.set(u.t, u.id);
      } // types → species
    });
  }
};

const IMG_ERR = "this.parentNode&&this.parentNode.classList.remove('pk');this.remove()";

export const artTag = (m, cls) =>
  `<img class="${cls}" src="${ART(m.no)}" alt="" loading="lazy" decoding="async" draggable="false" onerror="${IMG_ERR}">`;

/* discreet preloading of the illustrations of the team and of the chosen battle's opponents */
const pre = new Set();

// Startup statements, run in their original order (see index.js).
export function __init() {
  /* held items: real image in place of the pictogram */
  ITEM_SVG = Object.fromEntries(
    Object.keys(ITEMS2).map(k => [k, `<svg viewBox="0 0 24 24"><path d="${ITEMS2[k].i}"/></svg>`])
  );

  /* board: the Pokémon standing on its token (tokenArt, Units.jsx) */
}
