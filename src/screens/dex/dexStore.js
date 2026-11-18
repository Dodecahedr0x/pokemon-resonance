import { useSyncExternalStore } from 'react';
import { flushSync } from 'react-dom';

// Le moteur appelle renderDex / renderDexCard / renderDexList (et la réclamation d'une
// mission) : cela incrémente `version` et la page « Pokédex » (#dex) est redessinée
// depuis l'état du moteur (V4.dexSel, V4.dexQ…), comme l'ancien innerHTML.
let version = 0;
const listeners = new Set();
const subscribe = l => (listeners.add(l), () => listeners.delete(l));

// Synchrone : le moteur relit la page juste après (#dex4Card, images chromatiques…).
export function refreshDex() {
  version++;
  try {
    flushSync(() => listeners.forEach(l => l()));
  } catch {
    listeners.forEach(l => l());
  }
}

export const useDexVersion = () => useSyncExternalStore(subscribe, () => version);
