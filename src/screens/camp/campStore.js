import { useSyncExternalStore } from 'react';
import { flushSync } from 'react-dom';

// Deux versions, comme les deux anciens innerHTML :
// - `page` : renderCampPage431() (sous-onglets, Sorties, onglet ouvert) reconstruit toute la page ;
// - `base` : renderCampBase() ne reconstruit que le panneau « Camp de base » (#v4Camp).
let page = 0,
  base = 0;
// Les Sorties (#sort430) ne sont remplies qu'au premier affichage de l'onglet Base, puis gardées.
export let sortiesVues = false;
const listeners = new Set();
const subscribe = l => (listeners.add(l), () => listeners.delete(l));

// Synchrone : le moteur peut lire la page juste après l'appel.
function notifier() {
  try {
    flushSync(() => listeners.forEach(l => l()));
  } catch {
    listeners.forEach(l => l());
  }
}

export function refreshCampPage(ongletBase) {
  if (ongletBase) sortiesVues = true;
  page++;
  notifier();
}

export function refreshCampBase() {
  base++;
  notifier();
}

export const useCampPage = () => useSyncExternalStore(subscribe, () => page);
export const useCampBase = () => useSyncExternalStore(subscribe, () => base);
