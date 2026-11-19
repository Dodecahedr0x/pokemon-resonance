import { version } from '../../lib/store.js';

// Le moteur appelle renderBag() pour redessiner le Sac et la Boutique (affichage,
// onglet, achat…) : la page React est alors reconstruite avec les données à jour.
const [refresh, useVersion] = version();
export const useSacVersion = useVersion;

// « Merci pour votre achat ! » (v4.73) : posé après un achat, affiché au rendu suivant puis oublié.
let merci = false,
  merciVu = false;
export function marquerAchat() {
  merci = true;
}
export const merciAffiche = () => merciVu;

// `boutique` : le comptoir est affiché, le remerciement y est consommé.
export function refreshSac(boutique) {
  merciVu = boutique && merci;
  if (boutique) merci = false;
  refresh();
}
