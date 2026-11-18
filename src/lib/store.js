import { useSyncExternalStore } from 'react';
import { flushSync } from 'react-dom';

// Petit store observable pour l'état que le moteur pousse vers React.
// sync = true : rendu immédiat (flushSync), comme l'ancien innerHTML, pour les blocs
// que le moteur relit juste après (focus, .hidden, mesures).
// sync = false : notification différée d'une micro-tâche, sûre même si l'appel vient
// d'un rendu React en cours (aucun setState pendant le rendu d'un autre composant).
export function makeStore(initial, { sync = true } = {}) {
  let state = initial;
  let queued = false;
  const listeners = new Set();
  const notify = () => listeners.forEach(l => l());
  const subscribe = l => (listeners.add(l), () => listeners.delete(l));
  const get = () => state;
  const set = patch => {
    state = { ...state, ...(typeof patch === 'function' ? patch(state) : patch) };
    if (!sync) {
      if (!queued) {
        queued = true;
        queueMicrotask(() => {
          queued = false;
          notify();
        });
      }
      return;
    }
    try {
      flushSync(notify);
    } catch {
      notify();
    }
  };
  const use = () => useSyncExternalStore(subscribe, get);
  return { get, set, use };
}
