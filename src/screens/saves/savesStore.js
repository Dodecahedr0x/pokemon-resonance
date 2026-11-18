import { useSyncExternalStore } from 'react';
import { flushSync } from 'react-dom';

// État de la fenêtre « Sauvegardes », partagé entre React (<Saves>) et le moteur
// (openSaves, closeSaves, renderSaves). Le moteur n'écrit plus dans #saves.
// Rendu synchrone (flushSync) : juste après l'appel, le moteur relit le DOM
// comme avec l'ancien innerHTML ($('#svCode').focus(), $('#saves').hidden…).

let state = { open: false, version: 0 };
const listeners = new Set();
const emit = patch => {
  state = { ...state, ...patch };
  flushSync(() => listeners.forEach(l => l()));
};
const subscribe = l => (listeners.add(l), () => listeners.delete(l));

export const getSaves = () => state;
export const useSaves = () => useSyncExternalStore(subscribe, getSaves);

// Ouvre la fenêtre, contenu relu depuis l'état du moteur.
export function showSaves() {
  emit({ open: true, version: state.version + 1 });
}

export function hideSaves() {
  if (state.open) emit({ open: false });
}

// Redessine la carte (état du moteur changé).
export function refreshSaves() {
  emit({ version: state.version + 1 });
}
