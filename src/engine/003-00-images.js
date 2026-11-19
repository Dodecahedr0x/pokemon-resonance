/* Section d'origine : 00-images.js */

export let PKIMG, PKA, ITA;
let ITIMG, IMGU, IMGB;


function b64url(k, b) {
  if (IMGU[k]) return IMGU[k];
  let u;
  try {
    const s = atob(b),
      a = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) a[i] = s.charCodeAt(i);
    u = URL.createObjectURL(new Blob([a], { type: 'image/webp' }));
    IMGB[u] = b;
  } catch (e) {
    u = 'data:image/webp;base64,' + b;
  }
  return (IMGU[k] = u);
}

// Instructions exécutées au démarrage, dans l'ordre d'origine (voir index.js).
export function __init() {

/* images intégrées (bloc <script id="images"> ajouté par build.mjs) : le jeu n'a pas besoin d'Internet */
PKIMG = (window.RES_IMAGES && window.RES_IMAGES.pk) || {};


ITIMG = (window.RES_IMAGES && window.RES_IMAGES.it) || {};


IMGU = {},
  IMGB = {};


PKA = no =>
  PKIMG[no]
    ? b64url('p' + no, PKIMG[no])
    : 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/' + no + '.png';


ITA = k =>
  ITIMG[k]
    ? b64url('i' + k, ITIMG[k])
    : 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/dream-world/' + k + '.png';


/* si un lecteur refuse les URL blob, on bascule sur l'image intégrée en data URI */
document.addEventListener(
  'error',
  e => {
    const t = e.target;
    if (!t || !t.getAttribute) return;
    const a = t.tagName === 'IMG' ? 'src' : t.tagName === 'image' ? 'href' : null;
    if (!a) return;
    const u = t.getAttribute(a) || '';
    if (u.startsWith('blob:') && IMGB[u]) {
      e.stopImmediatePropagation();
      const d = 'data:image/webp;base64,' + IMGB[u];
      t.setAttribute(a, d);
      if (a === 'href') t.setAttributeNS('http://www.w3.org/1999/xlink', 'href', d);
    }
  },
  true
);
}
