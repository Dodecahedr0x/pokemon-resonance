/* Section d'origine : v4.16.1-01-finitions.js */

import { $, RM } from './014-08-outils.js';
import { go } from './016-09-navigation.js';
import { PREF, savePref } from './026-20-campagne-tutoriel-son.js';
import { V4 } from './032-v4-00-socle.js';
import { renderMap } from './037-v4-05-carte.js';
import { PLACES_J } from './054-v4-15-01-johto.js';
import { refreshAccueil } from '../screens/accueil/accueilStore.js';

export let NEWS416;


/* =====================================================================
   v4.16.1 : finitions
   - Bêtes errantes : leur repère se pose là où il gêne le moins les autres.
   - Trophées : les badges de Johto et le titre de Maître comptent (22).
   - Accueil : une carte « Nouveau » présente les ajouts de la v4.16
     (une fois par appareil).
   ===================================================================== */
/** Une place libre à côté du lieu où rôde la bête : son repère et son nom ne recouvrent aucun autre lieu. */
export function roamPos416(h, pris) {
  const C = [
      [110, 0],
      [-110, 0],
      [95, -58],
      [-95, -58],
      [95, 62],
      [-95, 62],
      [0, -96],
      [0, 100],
      [150, 0],
      [-150, 0]
    ],
    boite = (x, y) => [x - 62, y - 28, x + 62, y + 52], // le rond et l’étiquette du nom
    inter = (a, b) => Math.max(0, Math.min(a[2], b[2]) - Math.max(a[0], b[0])) * Math.max(0, Math.min(a[3], b[3]) - Math.max(a[1], b[1])),
    autres = [...PLACES_J, ...pris].map(p => boite(p.x, p.y));
  let best = [h.x + 110, h.y],
    bs = Infinity;
  C.forEach(([dx, dy], i) => {
    const x = Math.max(60, Math.min(940, h.x + dx)),
      y = Math.max(40, Math.min(590, h.y + dy)),
      b = boite(x, y),
      sc = autres.reduce((t, o) => t + inter(b, o), 0) + i;
    if (sc < bs) {
      bs = sc;
      best = [x, y];
    }
  });
  return best;
}


/** Le panneau « Nouveau » de l'Accueil (#v4News, src/screens/accueil/Nouveautes.jsx) a été lu. */
export function newsVue416() {
  return PREF.news === '471';
}


export function renderNews416() {
  refreshAccueil();
}

// Instructions exécutées au démarrage, dans l'ordre d'origine (voir index.js).
export function __init() {

/* ---------- Accueil : quoi de neuf ---------- */
NEWS416 = [
  ['i-star', 'Forme Résonante', 'Une fois par combat, un Pokémon au stade final à jauge pleine se transforme pour 3 manches.', null],
  ['i-team', 'Compagnon', 'Votre Pokémon préféré vous attend sur l’Accueil. Son affection lui donne des bonus en combat.', 'comp'],
  ['i-map', 'Pokématos et histoire', 'La radio du jour (bêtes, Dominant signalé, météo) et des scènes avant les grands combats.', null],
  ['i-grass', 'Pêche et Parc Safari', 'Pêchez depuis les hautes herbes, ou capturez sans combattre au Parc Safari (carte de Kanto).', 'safari'],
  ['i-plus', 'Coop, tournoi, potager', 'Jouez à 2 sur le même téléphone (Paramètres), lancez un tournoi entre amis, cultivez des baies au Camp.', 'amis']
];


document.addEventListener('click', e => {
  const b = e.target.closest('[data-news]');
  if (!b) return;
  const k = b.dataset.news;
  if (k === 'ok') {
    PREF.news = '471';
    savePref();
    renderNews416();
    return;
  }
  if (k === 'johto') {
    V4.region = 'johto';
    V4.mapSel = null;
    go('carte');
    renderMap();
    return;
  }
  if (k === 'herbes') {
    go('carte');
    const r = $('#route');
    if (r && r.scrollIntoView) r.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'center' });
    return;
  }
  if (k === 'safari') {
    V4.region = 'kanto';
    V4.mapSel = 'safari';
    go('carte');
    renderMap();
    return;
  }
  if (k === 'comp') {
    const c = document.getElementById('v4Comp');
    if (c && c.scrollIntoView) c.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'start' });
    return;
  }
  if (k === 'amis') {
    const a = document.getElementById('v4Amis');
    if (a && a.scrollIntoView) a.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'start' });
  }
});
}
