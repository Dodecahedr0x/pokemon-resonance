/* Fluidity (animations on the graphics card, without endless repainting or forced layout) (added in v4.74–v4.75). */

// Statements executed at startup, in the original order (see index.js).
export function init() {
  (() => {
    /* v4.76: while the (opaque) launch screen covers the game, the game's animations
     underneath are paused: nothing to draw that cannot be seen. They resume on touch. */
    try {
      const L = document.getElementById('resonance-launch');
      if (L && !document.documentElement.classList.contains('rl-seen')) {
        let pausedList = [];
        const freezeUnit = () => {
          pausedList = document.getAnimations().filter(a => {
            const t = a.effect && a.effect.target;
            return a.playState === 'running' && t && !L.contains(t);
          });
          pausedList.forEach(a => a.pause());
        };
        const restart = () => {
          pausedList.forEach(a => {
            try {
              a.play();
            } catch {
              /* Best effort: failure here is non-fatal. */
            }
          });
          pausedList = [];
        };
        // after the first render (the game's animations exist by then)
        requestAnimationFrame(() =>
          requestAnimationFrame(() => document.getElementById('resonance-launch') && freezeUnit())
        );
        document.addEventListener(
          'click',
          e => {
            if (e.target && e.target.closest && e.target.closest('#resonance-enter')) {
              restart();
            }
          },
          true
        );
        new MutationObserver((m, ob) => {
          const l = document.getElementById('resonance-launch');
          if (!l || l.classList.contains('is-leaving')) {
            ob.disconnect();
            restart();
          }
        }).observe(document.body, { childList: true, subtree: false });
        L.addEventListener('keydown', e => {
          if (e.key === 'Escape') {
            restart();
          }
        });
      }
    } catch {
      /* Best effort: failure here is non-fatal. */
    }
  })();
}
