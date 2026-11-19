/* Section d'origine : v4.34-01-calibrage-et-evoli.js */

import { EEVEE } from './009-pokemon.js';
import { markOf } from './014-utils.js';
import { cur } from './016-navigation.js';
import { markAt, uk } from './021-combat-engine.js';
import { B } from './024-combat-ui.js';
import { hourOf } from './046-living-board.js';

let MQ434;
/* Largeur du plateau sur téléphone : gardée en mémoire (la relire force la mise en page) et
   relue seulement quand l’écran ou le cadre change de largeur. */
let largeur434 = 0,
  key434 = '',
  frameTracked434 = null,
  roFrame434 = null;


export function gauge434() {
  try {
    const cb = document.getElementById('cbBattle'),
      bd = document.getElementById('bBoard');
    const on = !!(MQ434 && MQ434.matches && B && cur === 'combat' && cb && !cb.hidden);
    document.body.classList.toggle('bt434', on);
    if (!bd) return;
    if (!on || !bd.classList.contains('vert')) {
      bd.style.removeProperty('width');
      largeur434 = 0;
      return;
    }
    const c = bd.closest('.bt') || bd.parentElement;
    if (roFrame434 && frameTracked434 !== c) {
      if (frameTracked434) roFrame434.unobserve(frameTracked434);
      roFrame434.observe(c);
      frameTracked434 = c;
    }
    // (pas de innerWidth ici : sa lecture force elle aussi la mise en page)
    const k = String(document.body.classList.contains('fs444'));
    if (!largeur434 || k !== key434) {
      largeur434 = Math.max(220, c.clientWidth - 8);
      key434 = k;
    }
    if (bd.style.width !== largeur434 + 'px') bd.style.width = largeur434 + 'px';
  } catch (e) {}
}


/* ---------- 2. Évoli : l’évolution au choix ---------- */
/** Les évolutions d’Évoli en harmonie avec la situation : marque de sa case, heure. */
export function evoliHarmonie434(S, u) {
  const o = [],
    mk = markAt(S, uk(u));
  if (mk && EEVEE[mk]) o.push(EEVEE[mk]);
  o.push(EEVEE[hourOf(S)]);
  return o;
}


export function evoliWhy434(S, u, id) {
  if (!evoliHarmonie434(S, u).includes(id)) return 'Au choix';
  const k = Object.keys(EEVEE).find(x => EEVEE[x] === id);
  return `En harmonie · ${k === 'jour' ? 'le jour' : k === 'nuit' ? 'la nuit' : 'case ' + markOf(k).n} : garde 1 losange`;
}

// Instructions exécutées au démarrage, dans l'ordre d'origine (voir index.js).
export function __init() {

/* =====================================================================
   v4.34
   1. Combat sur téléphone : le bandeau du haut se replie, toute l’équipe
      adverse et la vôtre s’affichent d’un coup (sans défilement de côté),
      et le plateau est mis à l’échelle pour tenir entre l’équipe adverse
      et la barre « Fin du tour ».
   2. Évoli : à l’Éveil, ses 5 évolutions sont au choix. Celle qui est en
      harmonie avec sa case (marque Trempée, Chargée, Brûlante) ou avec
      l’heure (Mentali le jour, Noctali la nuit) lui laisse 1 losange.
   ===================================================================== */

/* ---------- 1. calibrage du combat sur téléphone ---------- */
MQ434 = window.matchMedia ? matchMedia('(max-width: 700px)') : null;


let largeurVue434 = -1;
roFrame434 = window.ResizeObserver
  ? new ResizeObserver(es => {
      // seulement si la LARGEUR du cadre change (la hauteur bouge à chaque rendu)
      const e = es[es.length - 1],
        l = Math.round((e && e.contentRect && e.contentRect.width) || 0);
      if (l === largeurVue434) return;
      largeurVue434 = l;
      largeur434 = 0;
      gauge434();
    })
  : null;
const forgetWidth434 = () => {
  largeur434 = 0;
};
// en capture : la largeur est oubliée avant que les écouteurs ci-dessous ne recalibrent
window.addEventListener('resize', forgetWidth434, true);
window.addEventListener('orientationchange', forgetWidth434, true);
if (window.visualViewport) visualViewport.addEventListener('resize', forgetWidth434, true);


window.addEventListener('resize', () => gauge434());


// la règle d’arène tient sur une ligne ; on la touche pour la lire en entier
document.addEventListener('click', e => {
  const a = e.target.closest('#bArena');
  if (a && document.body.classList.contains('bt434')) a.classList.toggle('open434');
});


if (window.visualViewport) visualViewport.addEventListener('resize', () => gauge434());


try {
  const cb = document.getElementById('cbBattle');
  if (cb && window.MutationObserver) new MutationObserver(() => gauge434()).observe(cb, { attributes: true, attributeFilter: ['hidden'] });
  // ce qui est au-dessus du plateau change de taille (images chargées, règle dépliée) : on recalibre
  if (window.ResizeObserver) {
    const ro = new ResizeObserver(() => gauge434());
    ['bPlE', 'bArena', 'bSyn', 'bOrdre'].forEach(id => {
      const x = document.getElementById(id);
      if (x) ro.observe(x);
    });
    ['#cbBattle .bt-top', '#cbBattle .bt-foot'].forEach(q => {
      const x = document.querySelector(q);
      if (x) ro.observe(x);
    });
  }
} catch (e) {}

}
