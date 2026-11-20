/* Offline: an image that fails to load disappears cleanly, with no broken icon (added in v4.1). */

// Statements run at startup, in the original order (see index.js).
export function init() {
  document.addEventListener(
    'error',
    e => {
      const t = e.target;
      if (!t || t.tagName !== 'IMG') {
        return;
      }
      const p = t.parentNode;
      if (p && p.classList) {
        p.classList.remove('pk', 'has-art');
      }
      t.style.setProperty('display', 'none', 'important');
      t.classList.add('img-off');
    },
    true
  );
}
