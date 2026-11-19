/* Original section: v4.1-03-finitions.js */

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

// Statements run at startup, in the original order (see index.js).
export function __init() {

/* =====================================================================
   v4.1 · finishing touches: French typography (no orphan "!" or "?"
   at the start of a line) on everything that is displayed.
   ===================================================================== */
RX_P = /(\S) ([!?:;»%])/g,
  RX_G = /« /g;


{
  const q = new Set();
  let raf = 0;
  new MutationObserver(ms => {
    for (const m of ms) {
      if (m.type === 'characterData') q.add(m.target);
      // v4.76: the letters of the typed-out text (already fixed) are not reprocessed one by one
      else {m.addedNodes.forEach(x => {
        if (x.nodeType === 1 && x.classList && x.classList.contains('pk-tw')) return;
        q.add(x);
      });}
    }
    if (!raf) {
      raf = requestAnimationFrame(() => {
        raf = 0;
        const a = [...q];
        q.clear();
        a.forEach(fixTree);
      });
    }
  }).observe(document.body, { childList: true, subtree: true, characterData: true });
}


/* offline: an image that fails to load disappears cleanly (no broken icon) */
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
