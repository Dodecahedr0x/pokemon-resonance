import { useSyncExternalStore } from 'react';
import { flushSync } from 'react-dom';

// Conseil de la Professeure à la première visite d'un écran (.tip après l'en-tête .ph) :
// pages où il est affiché. Le moteur (tipFor, 031) l'ouvre, le bouton « Compris » le ferme.
let ouverts = new Set();
const listeners = new Set();
const subscribe = l => (listeners.add(l), () => listeners.delete(l));

function emit() {
  try {
    flushSync(() => listeners.forEach(l => l()));
  } catch {
    listeners.forEach(l => l());
  }
}

export function montrerTip(t) {
  if (ouverts.has(t)) return;
  ouverts = new Set(ouverts).add(t);
  emit();
}

export function cacherTip(t) {
  if (!ouverts.has(t)) return;
  ouverts = new Set(ouverts);
  ouverts.delete(t);
  emit();
}

export const useTip = t => useSyncExternalStore(subscribe, () => ouverts.has(t));
