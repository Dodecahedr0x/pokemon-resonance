import { useSyncExternalStore } from 'react';
import { flushSync } from 'react-dom';

// Fenêtres et couches d'effet que le moteur créait sur <body> (#tdrBox, #ctBox, #scene417,
// #pk-badge…). Chaque fenêtre a un état : null (vide) ou les données de son dernier rendu,
// avec `v` incrémenté à chaque appel. Le contenu est rendu avec key={v} : comme l'ancien
// innerHTML, chaque rendu repart de zéro (les ajouts du moteur dedans, texte tapé lettre
// par lettre, image chromatique, disparaissent avec lui).
// Rendu synchrone (flushSync) : juste après l'appel, le moteur relit le DOM
// (focus, querySelector, hidden).
let state = {};
const listeners = new Set();
const subscribe = l => (listeners.add(l), () => listeners.delete(l));

function emit() {
  try {
    flushSync(() => listeners.forEach(l => l()));
  } catch {
    listeners.forEach(l => l());
  }
}

// Redessine la fenêtre `nom` avec ces données.
export function paintOverlay(nom, data = {}) {
  state = { ...state, [nom]: { ...data, v: ((state[nom] && state[nom].v) || 0) + 1 } };
  emit();
}

// Vide la fenêtre `nom` (ancien innerHTML = '').
export function clearOverlay(nom) {
  if (!state[nom]) return;
  state = { ...state, [nom]: null };
  emit();
}

export const useOverlay = nom => useSyncExternalStore(subscribe, () => state[nom] || null);
