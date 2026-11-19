/* Wandering beasts on the Johto map: their marker is placed where it covers the other places least (added in v4.16.1). */

import { PLACES_J } from './johto.js';

/** A free spot next to where the beast roams: its marker and name cover no other place. */
export function pickRoamSpot(h, takenSet) {
  const C = [
      [110, 0],
      [-110, 0],
      [95, -58],
      [-95, -58],
      [95, 62],
      [-95, 62],
      [0, -96],
      [0, 100],
      [150, 0],
      [-150, 0],
    ],
    labelBox = (x, y) => [x - 62, y - 28, x + 62, y + 52], // the circle and the name label
    inter = (a, b) =>
      Math.max(0, Math.min(a[2], b[2]) - Math.max(a[0], b[0])) *
      Math.max(0, Math.min(a[3], b[3]) - Math.max(a[1], b[1])),
    others = [...PLACES_J, ...takenSet].map(p => labelBox(p.x, p.y));
  let best = [h.x + 110, h.y],
    bs = Infinity;
  C.forEach(([dx, dy], i) => {
    const x = Math.max(60, Math.min(940, h.x + dx)),
      y = Math.max(40, Math.min(590, h.y + dy)),
      b = labelBox(x, y),
      sc = others.reduce((t, o) => t + inter(b, o), 0) + i;
    if (sc < bs) {
      bs = sc;
      best = [x, y];
    }
  });
  return best;
}
