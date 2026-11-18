import { useSyncExternalStore } from 'react';
import { flushSync } from 'react-dom';

// Le moteur appelle renderQuests() pour redessiner la page Quêtes (affichage, onglet,
// réclamation…). Ici, cela incrémente `version` : la page React
// est alors reconstruite, comme l'ancien innerHTML, avec les données à jour.
let version = 0;
const listeners = new Set();
const subscribe = l => (listeners.add(l), () => listeners.delete(l));

// Synchrone, comme l'ancien innerHTML : le moteur peut lire la page juste après l'appel.
export function refreshQuetes() {
  version++;
  try {
    flushSync(() => listeners.forEach(l => l()));
  } catch {
    listeners.forEach(l => l());
  }
}

export const useQuetesVersion = () => useSyncExternalStore(subscribe, () => version);
