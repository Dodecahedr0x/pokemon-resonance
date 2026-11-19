import { channel } from '../../lib/store.js';

// Fenêtres et couches d'effet que le moteur créait sur <body> (#tdrBox, #ctBox, #scene417,
// #pk-badge…). Chaque fenêtre a un état : null (vide) ou les données de son dernier rendu,
// avec `v` incrémenté à chaque appel. Le contenu est rendu avec key={v} : comme l'ancien
// innerHTML, chaque rendu repart de zéro (les ajouts du moteur dedans, texte tapé lettre
// par lettre, image chromatique, disparaissent avec lui).
// Rendu synchrone (flushSync) : juste après l'appel, le moteur relit le DOM
// (focus, querySelector, hidden).
let state = {};
const { emit, use } = channel();

// Redessine la fenêtre `nom` avec ces données.
export function paintOverlay(displayName, data = {}) {
  state = { ...state, [displayName]: { ...data, v: ((state[displayName] && state[displayName].v) || 0) + 1 } };
  emit();
}

// Vide la fenêtre `nom` (ancien innerHTML = '').
export function clearOverlay(displayName) {
  if (!state[displayName]) return;
  state = { ...state, [displayName]: null };
  emit();
}

export const useOverlay = displayName => use(() => state[displayName] || null);
