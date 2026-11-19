import { useSyncExternalStore } from 'react';
import { flushSync } from 'react-dom';

// Le moteur appelle renderHome() (et les anciens rendus partiels : compagnon, bannières,
// carte de dresseur, objectif de la barre latérale…) : ici, cela incrémente `version` et
// l'Accueil React est redessiné avec l'état du moteur.
let version = 0;
const listeners = new Set();
const subscribe = l => (listeners.add(l), () => listeners.delete(l));

const flush = ls => {
  try {
    flushSync(() => ls.forEach(l => l()));
  } catch {
    ls.forEach(l => l());
  }
};

// Synchrone, comme l'ancien innerHTML : le moteur peut relire l'Accueil juste après.
export function refreshAccueil() {
  version++;
  flush(listeners);
}

export const useAccueilVersion = () => useSyncExternalStore(subscribe, () => version);

// Route (#route) : état poussé par le moteur (moment de la journée, saison, bandeau des
// rencontres rares, nom de la route). Rendu dès le départ : le moteur y branche ses écouteurs.
let route = { tod: 'jour', pressed: false, saison: null, sign: 'Route 29', rr: null };
const routeListeners = new Set();
const subscribeRoute = l => (routeListeners.add(l), () => routeListeners.delete(l));

export function setRoute(patch) {
  route = { ...route, ...patch };
  flush(routeListeners);
}

export const useRoute = () => useSyncExternalStore(subscribeRoute, () => route);
