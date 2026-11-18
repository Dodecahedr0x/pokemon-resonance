/* Section d'origine : v4.34-01-calibrage-et-evoli.js */

import { EEVEE } from './009-03-pokemon.js';
import { markOf } from './014-08-outils.js';
import { cur } from './016-09-navigation.js';
import { markAt, uk } from './021-14-moteur-combat.js';
import { B } from './024-17-interface-combat.js';
import { heureDe } from './046-v4-7-01-plateau-vivant.js';
import { NEWS416 } from './056-v4-16-1-01-finitions.js';

export let MQ434;
export function __set_calibre434(v) { return (calibre434 = v); }


export function calibre434() {
  try {
    const cb = document.getElementById('cbBattle'),
      bd = document.getElementById('bBoard');
    const on = !!(MQ434 && MQ434.matches && B && cur === 'combat' && cb && !cb.hidden);
    document.body.classList.toggle('bt434', on);
    if (!bd) return;
    if (!on || !bd.classList.contains('vert')) {
      bd.style.removeProperty('width');
      return;
    }
    const bt = bd.closest('.bt') || bd.parentElement,
      dessus = bd.getBoundingClientRect().top + window.scrollY, // bandeau, synergies, équipe adverse (page tout en haut)
      ft = document.querySelector('#cbBattle .bt-foot'),
      nav = document.querySelector('.bnav'),
      vh = window.visualViewport ? visualViewport.height : innerHeight,
      // le bas utile : le haut de la barre « Fin du tour » (fixe), sinon celui de la barre d’onglets
      bas = Math.min(vh, ft && getComputedStyle(ft).position === 'fixed' ? ft.getBoundingClientRect().top : vh - ((ft && ft.offsetHeight) || 0) - ((nav && nav.offsetHeight) || 0)),
      plA = (document.getElementById('bPlA') || {}).offsetHeight || 0,
      dispo = bt.clientWidth - 8,
      larg = h => Math.round((h - 22) * (286 / 430) + 22);
    let w = larg(bas - dessus - plA - 10);
    if (w < 262) w = larg(bas - dessus - 6); // petit écran : votre équipe passe juste sous le plateau
    w = Math.max(220, Math.min(dispo, w));
    if (bd.style.width !== w + 'px') bd.style.width = w + 'px';
  } catch (e) {}
}


/* ---------- 2. Évoli : l’évolution au choix ---------- */
/** Les évolutions d’Évoli en harmonie avec la situation : marque de sa case, heure. */
export function evoliHarmonie434(S, u) {
  const o = [],
    mk = markAt(S, uk(u));
  if (mk && EEVEE[mk]) o.push(EEVEE[mk]);
  o.push(EEVEE[heureDe(S)]);
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


window.addEventListener('resize', () => calibre434());


// la règle d’arène tient sur une ligne ; on la touche pour la lire en entier
document.addEventListener('click', e => {
  const a = e.target.closest('#bArena');
  if (a && document.body.classList.contains('bt434')) a.classList.toggle('open434');
});


if (window.visualViewport) visualViewport.addEventListener('resize', () => calibre434());


try {
  const cb = document.getElementById('cbBattle');
  if (cb && window.MutationObserver) new MutationObserver(() => calibre434()).observe(cb, { attributes: true, attributeFilter: ['hidden'] });
  // ce qui est au-dessus du plateau change de taille (images chargées, règle dépliée) : on recalibre
  if (window.ResizeObserver) {
    const ro = new ResizeObserver(() => calibre434());
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


NEWS416.unshift(
  ['i-team', 'Combat sur téléphone', 'Le plateau, toute l’équipe adverse et la vôtre tiennent à l’écran ; le bandeau du haut se replie pendant le combat.', null],
  ['i-star', 'Évoli au choix', 'À l’Éveil, choisissez librement parmi ses 5 évolutions. En harmonie avec sa case ou l’heure, il garde 1 losange.', null]
);


NEWS416.splice(8);
}
