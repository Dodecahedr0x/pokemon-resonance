import { channel } from '../../lib/store.js';

// Deux versions, comme les deux anciens innerHTML :
// - `page` : renderCampPage431() (sous-onglets, Sorties, onglet ouvert) reconstruit toute la page ;
// - `base` : renderCampBase() ne reconstruit que le panneau « Camp de base » (#v4Camp).
let page = 0,
  base = 0;
// Les Sorties (#sort430) ne sont remplies qu'au premier affichage de l'onglet Base, puis gardées.
export let seenExits = false;
const { emit, use } = channel();

export function refreshCampPage(baseTab) {
  if (baseTab) seenExits = true;
  page++;
  emit();
}

export function refreshCampBase() {
  base++;
  emit();
}

export const useCampPage = () => use(() => page);
export const useCampBase = () => use(() => base);
