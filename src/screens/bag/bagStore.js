import { version } from '../../lib/store.js';

// The engine calls renderBag() to redraw the Bag and the Shop (display,
// tab, purchase…): the React page is then rebuilt with up-to-date data.
const [refresh, useVersion] = version();
export const useBagVersion = useVersion;

// "Thank you for your purchase!" (v4.73): set after a purchase, displayed on the next render then forgotten.
let thanksMsg = false,
  thanksSeen = false;
export function markPurchase() {
  thanksMsg = true;
}
export const thanksShown = () => thanksSeen;

// `shop`: the counter is displayed, the thank-you is consumed there.
export function refreshBag(shop) {
  thanksSeen = shop && thanksMsg;
  if (shop) {
    thanksMsg = false;
  }
  refresh();
}
