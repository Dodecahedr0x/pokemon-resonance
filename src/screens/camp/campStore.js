import { canal } from '../../lib/store.js';

// Deux versions, comme les deux anciens innerHTML :
// - `page` : renderCampPage431() (sous-onglets, Sorties, onglet ouvert) reconstruit toute la page ;
// - `base` : renderCampBase() ne reconstruit que le panneau « Camp de base » (#v4Camp).
let page = 0,
  base = 0;
// Les Sorties (#sort430) ne sont remplies qu'au premier affichage de l'onglet Base, puis gardées.
export let sortiesVues = false;
const { emit, use } = canal();

export function refreshCampPage(ongletBase) {
  if (ongletBase) sortiesVues = true;
  page++;
  emit();
}

export function refreshCampBase() {
  base++;
  emit();
}

export const useCampPage = () => use(() => page);
export const useCampBase = () => use(() => base);
