/* Section d'origine : v4.74–v4.75 : fluidité (animations sur la carte graphique, sans repeindre en boucle ni forcer la mise en page) */

import { $ } from './014-08-outils.js';
import { cur } from './016-09-navigation.js';
import { B } from './024-17-interface-combat.js';
import { __set_rejouer429, rejouer429 } from './064-v4-29-01-qualite.js';
import { tokCl, tokHas } from '../screens/combat/board/boardStore.js';
import { bdClass, getHost } from '../screens/combat/board/boardStore.js';
import { MQ434, __set_calibre434, calibre434 } from './069-v4-34-01-calibrage-et-evoli.js';
import { FX448, __set_shake448, shake448 } from './079-v4-48-immersion-sons-par-type-cris-vibrations-en.js';

// Instructions exécutées au démarrage, dans l'ordre d'origine (voir index.js).
export function __init() {

(() => {
  /* Mesuré au téléphone simulé (processeur ÷4) :
     - Accueil : la météo (grêle, pluie, sable) et les saisons déplaçaient un fond
       (background-position / mask-position) : tout le bandeau était repeint 60 fois
       par seconde, environ 1,8 s de dessin pour 2 s d'affichage.
     - Carte : l'ombre pulsée de « Rencontre sur la route » (box-shadow) relançait
       le calcul des styles de toute la carte à chaque image (≈ 28 % du processeur).
     Mêmes effets ici, mais déplacés par transform / opacity : la carte graphique
     s'en charge, le processeur reste libre. */
  const css = document.createElement('style');
  css.id = 'pk474-fluidite';
  css.textContent = `
/* 1. Rencontre sur la route / rencontre du jour : halo en opacité */
.ev454:not(.done),.cd455:not(.done){animation:none!important;position:relative}
.ev454:not(.done)::after,.cd455:not(.done)::after{content:"";position:absolute;inset:-1px;border-radius:inherit;pointer-events:none;box-shadow:0 0 0 5px rgba(255,212,91,.28),0 0 16px 2px rgba(255,212,91,.22);opacity:0;animation:pk474Halo 2.4s ease-in-out infinite;will-change:opacity}
@keyframes pk474Halo{50%{opacity:1}}

/* 2. Météo : on déplace la couche entière (déjà plus grande que le cadre) */
.wx448 i{will-change:transform}
@keyframes gl448{from{transform:translate(0,0)}to{transform:translate(-14px,82px)}}
@keyframes rn448{from{transform:rotate(9deg) translateY(0)}to{transform:rotate(9deg) translateY(38px)}}
@keyframes sd448{from{transform:translateX(0)}to{transform:translateX(-70px)}}

/* 3. Saisons de l'accueil : deux calques de particules qui glissent (boucle sans à-coup) */
.hv450s.hv450-printemps,.hv450s.hv450-automne,.hv450s.hv450-hiver,.hv450s.hv450-ete{background:none!important;animation:none!important;overflow:hidden}
.hv450s.hv450-printemps::before,.hv450s.hv450-printemps::after,.hv450s.hv450-automne::before,.hv450s.hv450-automne::after,.hv450s.hv450-hiver::before,.hv450s.hv450-hiver::after{content:"";position:absolute;inset:-180px -100px -20px -100px;pointer-events:none;will-change:transform;animation-timing-function:linear;animation-iteration-count:infinite}
.hv450s.hv450-printemps::before{background:radial-gradient(ellipse,rgba(255,186,214,.95) 0 2.4px,transparent 3.2px) 0 0/61px 73px;animation-name:pk474P1;animation-duration:11s}
.hv450s.hv450-printemps::after{background:radial-gradient(ellipse,rgba(255,216,232,.8) 0 1.8px,transparent 2.6px) 24px 31px/83px 59px;animation-name:pk474P2;animation-duration:14s}
.hv450s.hv450-automne::before{background:radial-gradient(ellipse,rgba(224,138,60,.95) 0 3px,transparent 3.8px) 0 0/67px 79px;animation-name:pk474A1;animation-duration:13s}
.hv450s.hv450-automne::after{background:radial-gradient(ellipse,rgba(194,85,43,.85) 0 2.4px,transparent 3.2px) 30px 22px/89px 63px;animation-name:pk474A2;animation-duration:15s}
.hv450s.hv450-hiver::before{background:radial-gradient(circle,rgba(255,255,255,.95) 0 1.8px,transparent 2.5px) 0 0/43px 51px;animation-name:pk474H1;animation-duration:8s}
.hv450s.hv450-hiver::after{background:radial-gradient(circle,rgba(230,244,255,.8) 0 1.2px,transparent 1.9px) 17px 23px/59px 47px;animation-name:pk474H2;animation-duration:10s}
@keyframes pk474P1{to{transform:translate(61px,146px)}}
@keyframes pk474P2{to{transform:translate(83px,177px)}}
@keyframes pk474A1{to{transform:translate(-67px,158px)}}
@keyframes pk474A2{to{transform:translate(-89px,126px)}}
@keyframes pk474H1{to{transform:translate(-43px,102px)}}
@keyframes pk474H2{to{transform:translate(-59px,94px)}}
.hv450s.hv450-ete::before{content:"";position:absolute;top:0;bottom:0;left:0;width:220%;pointer-events:none;background:linear-gradient(115deg,transparent 28%,rgba(255,236,160,.2) 40%,transparent 52%);animation:pk474E 9s ease-in-out infinite alternate;will-change:transform}
@keyframes pk474E{to{transform:translateX(-54.545%)}}

/* 4. Reflet des barres de PV : le reflet glisse au lieu de repeindre la barre */
.hp.hseg i{overflow:hidden}
.hp.hseg i::after{background:linear-gradient(90deg,transparent,rgba(255,255,255,.55),transparent) no-repeat!important;background-size:100% 100%!important;width:36%!important;right:auto!important;animation:pk474Sheen 3.2s linear infinite!important;will-change:transform}
@keyframes pk474Sheen{from{transform:translateX(-170%)}to{transform:translateX(450%)}}

@media (prefers-reduced-motion:reduce){
 .ev454::after,.cd455::after,.hv450s::before,.hv450s::after,.wx448 i,.hp.hseg i::after{animation:none!important}
}
html.a11y-rm .ev454::after,html.a11y-rm .cd455::after,html.a11y-rm .hv450s::before,html.a11y-rm .hv450s::after,html.a11y-rm .wx448 i,html.a11y-rm .hp.hseg i::after{animation:none!important}
`;
  // en fin de document : ces @keyframes doivent passer après les anciennes
  (document.body || document.head).appendChild(css);
  /* Combat : la largeur du plateau était relue (mise en page forcée) à chaque rendu,
     plusieurs fois par action. Elle ne change que si l'écran ou le cadre change :
     on la garde en mémoire et on la relit seulement dans ces cas-là. */
  try {
    let W = 0,
      cle = '',
      suivi = null,
      lu = -1;
    const ro = window.ResizeObserver
      ? new ResizeObserver(es => {
          // seulement si la LARGEUR du cadre change (la hauteur bouge à chaque rendu)
          const e = es[es.length - 1],
            l = Math.round((e && e.contentRect && e.contentRect.width) || 0);
          if (l === lu) return;
          lu = l;
          W = 0;
          calibre434();
        })
      : null;
    const oublier = () => {
      W = 0;
    };
    // en capture : la largeur est oubliée avant que les anciens écouteurs ne recalibrent
    window.addEventListener('resize', oublier, true);
    window.addEventListener('orientationchange', oublier, true);
    if (window.visualViewport) visualViewport.addEventListener('resize', oublier, true);
    __set_calibre434(function () {
      try {
        const cb = document.getElementById('cbBattle'),
          bd = document.getElementById('bBoard');
        const on = !!(MQ434 && MQ434.matches && B && cur === 'combat' && cb && !cb.hidden);
        document.body.classList.toggle('bt434', on);
        if (!bd) return;
        if (!on || !bd.classList.contains('vert')) {
          bd.style.removeProperty('width');
          W = 0;
          return;
        }
        const c = bd.closest('.bt') || bd.parentElement;
        if (ro && suivi !== c) {
          if (suivi) ro.unobserve(suivi);
          ro.observe(c);
          suivi = c;
        }
        // (pas de innerWidth ici : sa lecture force elle aussi la mise en page)
        const k = String(document.body.classList.contains('fs444'));
        if (!W || k !== cle) {
          W = Math.max(220, c.clientWidth - 8);
          cle = k;
        }
        if (bd.style.width !== W + 'px') bd.style.width = W + 'px';
      } catch (e) {}
    });
  } catch (e) {}
  /* Relancer une petite animation (bond d'un jeton, secousse du plateau) passait par
     une lecture forcée de la mise en page de toute la page. Si l'animation ne joue pas,
     on ajoute simplement la classe ; si elle joue déjà, on la relance deux images plus tard. */
  const apres2images = f => requestAnimationFrame(() => requestAnimationFrame(f));
  try {
    __set_rejouer429(function (T, cl, ms) {
      // classes du jeton : modèle rendu par React (Units.jsx)
      const g = T && T.g;
      if (!g) return;
      clearTimeout(T['t_' + cl]);
      const lancer = () => {
        tokCl(T, cl, true);
        clearTimeout(T['t_' + cl]);
        T['t_' + cl] = setTimeout(() => tokCl(T, cl, false), ms);
      };
      if (!tokHas(T, cl)) return lancer();
      tokCl(T, cl, false);
      apres2images(lancer);
    });
  } catch (e) {}
  try {
    __set_shake448(function (big) {
      if (!FX448()) return;
      if (!$('#bBoard')) return;
      // classes de #bBoard : rendues par React (état « host » de boardStore.js)
      const cls = getHost().cls,
        deja = cls.includes('shake448') || cls.includes('shakeB448');
      const finir = () => (bdClass('shake448', false), bdClass('shakeB448', false));
      finir();
      const lancer = () => {
        bdClass(big ? 'shakeB448' : 'shake448', true);
        clearTimeout(shake448.t);
        shake448.t = setTimeout(finir, 520);
      };
      if (deja) apres2images(lancer);
      else lancer();
    });
  } catch (e) {}
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
