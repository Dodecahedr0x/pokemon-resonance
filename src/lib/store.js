import { useSyncExternalStore } from 'react';
import { flushSync } from 'react-dom';

// Le moteur garde son état et prévient React quand un bloc doit être redessiné.
// Tous les stores des écrans passent par ces trois briques.

// Canal d'abonnement. emit() redessine tout de suite les abonnés (flushSync), comme l'ancien
// innerHTML : le moteur relit le DOM juste après (focus, .hidden, mesures). Si l'appel vient
// d'un rendu React en cours, flushSync refuse : les abonnés sont alors prévenus sans attendre.
export function channel() {
  const listeners = new Set();
  const notify = () => listeners.forEach(l => l());
  const subscribe = l => (listeners.add(l), () => listeners.delete(l));
  const emit = () => {
    try {
      flushSync(notify);
    } catch {
      notify();
    }
  };
  // use(lire) : valeur relue à chaque emit ; le composant n'est redessiné que si elle change.
  const use = readValue => useSyncExternalStore(subscribe, readValue);
  return { emit, use, notify };
}

// Compteur de version : [refresh, useVersion]. refresh() fait redessiner le bloc, qui relit
// alors l'état du moteur. Version 0 : le moteur n'a encore rien dessiné.
export function version() {
  let v = 0;
  const c = channel();
  return [
    () => {
      v++;
      c.emit();
    },
    () => c.use(() => v),
  ];
}

// Objet d'état : set(patch) fusionne et prévient les abonnés.
// sync = false : notification différée d'une micro-tâche, sûre même si l'appel vient
// d'un rendu React en cours (aucun setState pendant le rendu d'un autre composant).
export function makeStore(initial, { sync = true } = {}) {
  let state = initial;
  let queued = false;
  const c = channel();
  const get = () => state;
  const set = patch => {
    state = { ...state, ...(typeof patch === 'function' ? patch(state) : patch) };
    if (sync) return c.emit();
    if (queued) return;
    queued = true;
    queueMicrotask(() => {
      queued = false;
      c.notify();
    });
  };
  // use() : tout l'état ; use(lire) : une partie (le bloc ne suit que celle-ci).
  const use = (readValue = get) => c.use(() => readValue(state));
  return { get, set, use };
}
