import { useSyncExternalStore } from 'react';
import { flushSync } from 'react-dom';

// Le moteur appelle buildMap() au démarrage (gabarit de la page), puis renderMap() /
// renderMapInfo() : la page Carte est reconstruite, comme l'ancien innerHTML.
// - built : le gabarit existe (cartes dessinées, emplacement de la Route 29) ;
// - drawn : renderMap() a tourné au moins une fois (tracés, marqueurs, panneaux…) ;
// - marksSel : le lieu choisi au moment où les marqueurs ont été dessinés (avant le choix par défaut).
let state = { version: 0, built: false, drawn: false, marksSel: null };
const listeners = new Set();
const subscribe = l => (listeners.add(l), () => listeners.delete(l));

function notify(next) {
  state = { ...state, ...next, version: state.version + 1 };
  // Synchrone : le moteur relit la page juste après (centerMap, scrollIntoView, flèches).
  try {
    flushSync(() => listeners.forEach(l => l()));
  } catch {
    listeners.forEach(l => l());
  }
}

export function carteBatie() {
  notify({ built: true });
}

export function refreshCarte(o) {
  if (!state.built) return;
  notify(o ? { drawn: true, marksSel: o.marksSel } : {});
}

export const useCarte = () => useSyncExternalStore(subscribe, () => state);
