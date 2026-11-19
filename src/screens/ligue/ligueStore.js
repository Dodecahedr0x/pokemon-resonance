import { useSyncExternalStore } from 'react';
import { flushSync } from 'react-dom';

// Le moteur appelle renderLigue() (choix d'un badge, victoire, chargement) : la page
// Ligue est reconstruite, comme l'ancien innerHTML, avec la progression à jour.
let version = 0;
const listeners = new Set();
const subscribe = l => (listeners.add(l), () => listeners.delete(l));

// Synchrone, comme l'ancien innerHTML : le moteur peut lire la page juste après l'appel.
export function refreshLigue() {
  version++;
  try {
    flushSync(() => listeners.forEach(l => l()));
  } catch {
    listeners.forEach(l => l());
  }
}

export const useLigueVersion = () => useSyncExternalStore(subscribe, () => version);
