import { channel } from '../lib/store.js';

// The Professor's tip on a screen's first visit (.tip after the .page-header):
// pages where it is displayed. The engine (tipFor, 031) opens it, the "Compris" (Got it) button closes it.
let openItems = new Set();
const { emit, use } = channel();

export function showTip(t) {
  if (openItems.has(t)) {
    return;
  }
  openItems = new Set(openItems).add(t);
  emit();
}

export function hideTip(t) {
  if (!openItems.has(t)) {
    return;
  }
  openItems = new Set(openItems);
  openItems.delete(t);
  emit();
}

export const useTip = t => use(() => openItems.has(t));
