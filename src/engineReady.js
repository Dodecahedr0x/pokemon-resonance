import { useSyncExternalStore } from 'react';

// Les données du moteur (listes, tables, état de partie) n'existent qu'après son démarrage :
// les écrans React attendent ce signal avant de les lire.
let ready = false;
const listeners = new Set();

export function setEngineReady() {
  ready = true;
  listeners.forEach(l => l());
}

const subscribe = l => (listeners.add(l), () => listeners.delete(l));

export function useEngineReady() {
  return useSyncExternalStore(subscribe, () => ready);
}
