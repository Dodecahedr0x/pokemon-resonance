/* Section d'origine : v4.74–v4.75 : fluidité (animations sur la carte graphique, sans repeindre en boucle ni forcer la mise en page) */

// Instructions exécutées au démarrage, dans l'ordre d'origine (voir index.js).
export function __init() {

(() => {
  /* v4.76 : tant que l'écran de lancement (opaque) couvre le jeu, les animations du jeu
     en dessous sont en pause : rien à dessiner qu'on ne voit pas. Elles repartent au toucher. */
  try {
    const L = document.getElementById('resonance-launch');
    if (L && !document.documentElement.classList.contains('rl-seen')) {
      let pausees = [];
      const geler = () => {
        pausees = document.getAnimations().filter(a => {
          const t = a.effect && a.effect.target;
          return a.playState === 'running' && t && !L.contains(t);
        });
        pausees.forEach(a => a.pause());
      };
      const relancer = () => {
        pausees.forEach(a => {
          try {
            a.play();
          } catch (e) {}
        });
        pausees = [];
      };
      // après le premier rendu (les animations du jeu existent alors)
      requestAnimationFrame(() => requestAnimationFrame(() => document.getElementById('resonance-launch') && geler()));
      document.addEventListener(
        'click',
        e => {
          if (e.target && e.target.closest && e.target.closest('#resonance-enter')) relancer();
        },
        true
      );
      new MutationObserver((m, ob) => {
        const l = document.getElementById('resonance-launch');
        if (!l || l.classList.contains('is-leaving')) {
          ob.disconnect();
          relancer();
        }
      }).observe(document.body, { childList: true, subtree: false });
      L.addEventListener('keydown', e => {
        if (e.key === 'Escape') relancer();
      });
    }
  } catch (e) {}
})();
}
