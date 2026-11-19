/* Original section: 00-images.js */

import { RES_IMAGES } from './000-embedded-images.js';

export let PKIMG;
let ITIMG, IMGU, IMGB;

function b64url(k, b) {
  if (IMGU[k]) {
    return IMGU[k];
  }
  let u;
  try {
    const s = atob(b),
      a = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) {
      a[i] = s.charCodeAt(i);
    }
    u = URL.createObjectURL(new Blob([a], { type: 'image/webp' }));
    IMGB[u] = b;
  } catch (e) {
    u = 'data:image/webp;base64,' + b;
  }
  return (IMGU[k] = u);
}

export const PKA = no =>
  PKIMG[no]
    ? b64url('p' + no, PKIMG[no])
    : 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/' + no + '.png';

export const ITA = k =>
  ITIMG[k]
    ? b64url('i' + k, ITIMG[k])
    : 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/dream-world/' + k + '.png';

// Statements run at startup, in the original order (see index.js).
export function __init() {
  /* embedded images (000-embedded-images.js): the game does not need the Internet */
  PKIMG = RES_IMAGES.pk;

  ITIMG = RES_IMAGES.it;

  ((IMGU = {}), (IMGB = {}));

  /* if a reader refuses blob URLs, we fall back to the embedded image as a data URI */
  document.addEventListener(
    'error',
    e => {
      const t = e.target;
      if (!t || !t.getAttribute) {
        return;
      }
      const a = t.tagName === 'IMG' ? 'src' : t.tagName === 'image' ? 'href' : null;
      if (!a) {
        return;
      }
      const u = t.getAttribute(a) || '';
      if (u.startsWith('blob:') && IMGB[u]) {
        e.stopImmediatePropagation();
        const d = 'data:image/webp;base64,' + IMGB[u];
        t.setAttribute(a, d);
        if (a === 'href') {
          t.setAttributeNS('http://www.w3.org/1999/xlink', 'href', d);
        }
      }
    },
    true
  );
}
