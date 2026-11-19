/* Scrollable result screen (added in v4.69). */

// Statements run at startup, in the original order (see index.js).
export function init() {
  (() => {
    const R = document.getElementById('cbResult');
    if (!R) {
      return;
    }
    new MutationObserver(() => {
      if (!R.hidden) {
        R.scrollTop = 0;
      }
    }).observe(R, { attributes: true, attributeFilter: ['hidden'] });
  })();
}
