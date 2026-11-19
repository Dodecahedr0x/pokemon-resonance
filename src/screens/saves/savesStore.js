import { makeStore } from '../../lib/store.js';

// État de la fenêtre « Sauvegardes », partagé entre React (<Saves>) et le moteur
// (openSaves, closeSaves, renderSaves). Le moteur n'écrit plus dans #saves ; il relit le
// DOM juste après chaque appel ($('#svCode').focus(), $('#saves').hidden…).
const saves = makeStore({ open: false, version: 0 });

export const useSaves = saves.use;

// Ouvre la fenêtre, contenu relu depuis l'état du moteur.
export function showSaves() {
  saves.set(s => ({ open: true, version: s.version + 1 }));
}

export function hideSaves() {
  if (saves.get().open) saves.set({ open: false });
}

// Redessine la carte (état du moteur changé).
export function refreshSaves() {
  saves.set(s => ({ version: s.version + 1 }));
}
