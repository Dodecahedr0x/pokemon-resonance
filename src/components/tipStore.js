import { canal } from '../lib/store.js';

// Conseil de la Professeure à la première visite d'un écran (.tip après l'en-tête .ph) :
// pages où il est affiché. Le moteur (tipFor, 031) l'ouvre, le bouton « Compris » le ferme.
let ouverts = new Set();
const { emit, use } = canal();

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

export const useTip = t => use(() => ouverts.has(t));
