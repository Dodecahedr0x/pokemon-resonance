/* Original section: 4.69: scrollable result screen */

// Statements run at startup, in the original order (see index.js).
export function __init() {
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
