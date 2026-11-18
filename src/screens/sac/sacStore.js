import { useSyncExternalStore } from 'react';
import { flushSync } from 'react-dom';

// Le moteur appelle renderBag() pour redessiner le Sac et la Boutique (affichage,
// onglet, achat…). Ici, cela incrémente `version` : la page React
// est alors reconstruite, comme l'ancien innerHTML, avec les données à jour.
let version = 0;
const listeners = new Set();
const subscribe = l => (listeners.add(l), () => listeners.delete(l));

// « Merci pour votre achat ! » (v4.73) : posé après un achat, affiché au rendu suivant puis oublié.
let merci = false,
  merciVu = false;
export function marquerAchat() {
  merci = true;
}
export const merciAffiche = () => merciVu;

// Synchrone, comme l'ancien innerHTML : le moteur peut lire la page juste après l'appel.
// `boutique` : le comptoir est affiché, le remerciement y est consommé.
export function refreshSac(boutique) {
  merciVu = boutique && merci;
  if (boutique) merci = false;
  version++;
  try {
    flushSync(() => listeners.forEach(l => l()));
  } catch {
    listeners.forEach(l => l());
  }
}

export const useSacVersion = () => useSyncExternalStore(subscribe, () => version);
