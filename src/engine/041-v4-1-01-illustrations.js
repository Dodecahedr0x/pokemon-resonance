/* Section d'origine : v4.1-01-illustrations.js */

import { BY, PKT } from './009-03-pokemon.js';
import { ITEMS2 } from './011-05-etat-de-partie.js';
import { tokCl, unitsDirty } from '../screens/combat/board/boardStore.js';
import { L } from './024-17-interface-combat.js';
import { ART, HELD_IMG, ITM } from './032-v4-00-socle.js';

export let tagUnits, artTag;
let TMAP, IMG_ERR, ITEM_SVG, pre;
export function __set_tokenArt(v) { return (tokenArt = v); }


export function itemize(h) {
  if (typeof h !== 'string') return h;
  for (const k in ITEM_SVG)
    if (h.includes(ITEM_SVG[k]))
      h = h
        .split(ITEM_SVG[k])
        .join(`<img class="it-img" src="${ITM(HELD_IMG[k])}" alt="" loading="lazy" onerror="this.remove()">`);
  return h;
}


// Illustration du jeton (image .tok-im avant le badge, dans le groupe animé v4.29) : rendue par
// Units.jsx d'après le modèle du jeton (imOn, geo, href).
export function tokenArt(u) {
  const T = L.u && L.u[u.uid];
  if (!T) return;
  if (!T.imOn) {
    T.imOn = true;
    T.geo = ['-17', '-22', '34']; // x, y, largeur = hauteur
    unitsDirty();
  }
  if (T.imOn && T.imId !== u.id && BY[u.id]) {
    T.imId = u.id;
    tokCl(T, 'has-im', false);
    T.href = ART(BY[u.id].no);
    unitsDirty();
  }
}

/** l'image du jeton est chargée */
export function tokArtOk(T) {
  tokCl(T, 'has-im', true);
}

/** l'image du jeton manque : retirée ; la suivante (sans adresse) se pose hors de son groupe v4.77 */
export function tokArtErr(T) {
  tokCl(T, 'has-im', false);
  T.imOn = false;
  T.imBad = true;
  if (T.w477) T.imLoose = true;
  T.href = null;
  unitsDirty();
}


export function preload(ids) {
  ids.forEach(id => {
    const m = BY[id];
    if (!m || pre.has(m.no)) return;
    pre.add(m.no);
    const i = new Image();
    i.decoding = 'async';
    i.src = ART(m.no);
  });
}

// Instructions exécutées au démarrage, dans l'ordre d'origine (voir index.js).
export function __init() {

/* =====================================================================
   v4.1 · les vrais Pokémon partout
   Chaque médaillon de type qui représente un Pokémon affiche désormais
   son illustration ; le plateau, les fiches, les rencontres, les
   évolutions et les résultats aussi. Les objets tenus ont leur image.
   Hors ligne, le médaillon de type d'origine reste affiché.
   ===================================================================== */
/* tableau de types d'une espèce ou d'une unité → identifiant de l'espèce */
TMAP = PKT;


tagUnits = S => {
  if (S && Array.isArray(S.units))
    S.units.forEach(u => {
      if (u && Array.isArray(u.t) && BY[u.id]) TMAP.set(u.t, u.id);
    });
};


IMG_ERR = "this.parentNode&&this.parentNode.classList.remove('pk');this.remove()";


artTag = (m, cls) =>
  `<img class="${cls}" src="${ART(m.no)}" alt="" loading="lazy" decoding="async" draggable="false" onerror="${IMG_ERR}">`;


/* objets tenus : vraie image à la place du pictogramme */
ITEM_SVG = Object.fromEntries(
  Object.keys(ITEMS2).map(k => [k, `<svg viewBox="0 0 24 24"><path d="${ITEMS2[k].i}"/></svg>`])
);


/* plateau : le Pokémon debout sur son jeton (tokenArt, Units.jsx) */


/* préchargement discret des illustrations de l'équipe et des adversaires du combat choisi */
pre = new Set();
}
