import { version } from '../../lib/store.js';

// Le moteur appelle renderBag() pour redessiner le Sac et la Boutique (affichage,
// onglet, achat…) : la page React est alors reconstruite avec les données à jour.
const [refresh, useVersion] = version();
export const useBagVersion = useVersion;

// « Merci pour votre achat ! » (v4.73) : posé après un achat, affiché au rendu suivant puis oublié.
let thanksMsg = false,
  thanksSeen = false;
export function markPurchase() {
  thanksMsg = true;
}
export const thanksShown = () => thanksSeen;

// `boutique` : le comptoir est affiché, le remerciement y est consommé.
export function refreshBag(shop) {
  thanksSeen = shop && thanksMsg;
  if (shop) thanksMsg = false;
  refresh();
}
