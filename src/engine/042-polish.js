/* Section d'origine : v4.1-03-finitions.js */

let RX_P, RX_G;


function fixText(n) {
  const t = n.nodeValue;
  if (!t || t.length < 2 || !/ [!?:;»%]|« /.test(t)) return;
  const v = t.replace(RX_P, '$1 $2').replace(RX_G, '« ');
  if (v !== t) n.nodeValue = v;
}


export function fixTree(root) {
  if (!root) return;
  if (root.nodeType === 3) {
    fixText(root);
    return;
  }
  if (root.nodeType !== 1 || /^(SCRIPT|STYLE|TEXTAREA|INPUT)$/.test(root.nodeName)) return;
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let n;
  while ((n = w.nextNode())) fixText(n);
}

// Instructions exécutées au démarrage, dans l'ordre d'origine (voir index.js).
export function __init() {

/* =====================================================================
   v4.1 · finitions : typographie française (pas de « ! » ou « ? »
   orphelin en début de ligne) sur tout ce qui s'affiche.
   ===================================================================== */
RX_P = /(\S) ([!?:;»%])/g,
  RX_G = /« /g;


{
  const q = new Set();
  let raf = 0;
  new MutationObserver(ms => {
    for (const m of ms) {
      if (m.type === 'characterData') q.add(m.target);
      // v4.76 : les lettres du texte qui s’écrit (déjà corrigé) ne sont pas repassées une à une
      else m.addedNodes.forEach(x => {
        if (x.nodeType === 1 && x.classList && x.classList.contains('pk-tw')) return;
        q.add(x);
      });
    }
    if (!raf)
      raf = requestAnimationFrame(() => {
        raf = 0;
        const a = [...q];
        q.clear();
        a.forEach(fixTree);
      });
  }).observe(document.body, { childList: true, subtree: true, characterData: true });
}


/* hors ligne : une image qui ne charge pas disparaît proprement (pas d'icône cassée) */
document.addEventListener(
  'error',
  e => {
    const t = e.target;
    if (!t || t.tagName !== 'IMG') return;
    const p = t.parentNode;
    if (p && p.classList) p.classList.remove('pk');
    t.style.setProperty('display', 'none', 'important');
    t.classList.add('img-off');
  },
  true
);
}
