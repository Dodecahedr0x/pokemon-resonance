import { channel } from '../lib/store.js';

// Conseil de la Professeure à la première visite d'un écran (.tip après l'en-tête .ph) :
// pages où il est affiché. Le moteur (tipFor, 031) l'ouvre, le bouton « Compris » le ferme.
let openItems = new Set();
const { emit, use } = channel();

export function showTip(t) {
  if (openItems.has(t)) return;
  openItems = new Set(openItems).add(t);
  emit();
}

export function hideTip(t) {
  if (!openItems.has(t)) return;
  openItems = new Set(openItems);
  openItems.delete(t);
  emit();
}

export const useTip = t => use(() => openItems.has(t));
