/* Section d'origine : v4.43 : plateau en grand sur téléphone, attaques à portée de pouce, faux messages d’erreur filtrés */

import { MV } from './005-02-capacites.js';
import { tc } from './014-08-outils.js';
import { CROCHETS } from './015-v4-8-00-crochets.js';
import { byUid, mvType } from './021-14-moteur-combat.js';
import { B, ui } from './024-17-interface-combat.js';
import { footCls, pied, refreshBattle } from '../screens/combat/battle/battleStore.js';


/** Cale la page : le bas du plateau (votre camp) juste au-dessus de « Fin du tour », sans couper son haut. */
export function cadre443() {
  try {
    if (!document.body.classList.contains('bt434') || !B || B.over) return;
    const bd = document.getElementById('bBoard'),
      ft = document.querySelector('#cbBattle .bt-foot');
    if (!bd || !ft) return;
    const r = bd.getBoundingClientRect(),
      fb = getComputedStyle(ft).position === 'fixed' ? ft.getBoundingClientRect().top : innerHeight;
    // priorité à votre camp (en bas du plateau) ; le haut peut passer de peu sous le bord de l’écran
    let y = scrollY + r.bottom - (fb - 8);
    y = Math.max(0, Math.min(y, scrollY + r.top + 40));
    if (Math.abs(y - scrollY) > 4) window.scrollTo(0, y);
  } catch (e) {}
}


function qaLabel443(b, u) {
  const d = b.dataset;
  if (d.pv) return { t: d.pv === 'ok' ? 'Confirmer' : 'Annuler', c: d.pv === 'ok' ? 'qa-ok' : 'qa-no' };
  if (d.mi != null) {
    const m = u && MV[u.mv[+d.mi]],
      ty = m ? mvType(B, u, m) : null,
      nb = b.querySelector('b');
    return { t: m ? m.n : nb ? nb.firstChild && nb.firstChild.textContent : 'Capacité', col: ty ? tc(ty) : '' };
  }
  if (d.evo) return { t: 'Éveil', c: 'qa-evo' };
  if (d.undo) return { t: '↶ Annuler', c: 'qa-no' };
  if (d.duo) {
    const p = byUid(B, d.duo);
    return { t: 'Duo' + (p ? ' · ' + p.n : ''), c: 'qa-duo' };
  }
  if (d.vx) return { t: d.vx === 'dodge' ? 'Esquive' : d.vx === 'relance' ? 'Relance' : (b.querySelector('b') || b).textContent.trim(), c: 'qa-vx' };
  if (d.cap) return { t: 'Capturer', c: 'qa-cap' };
  return { t: b.textContent.trim().slice(0, 18) };
}


function qa443() {
  try {
    const ft = document.querySelector('#cbBattle .bt-foot'),
      P = document.getElementById('bPanel');
    if (!ft || !P) return;
    const u = B && ui.sel && byUid(B, ui.sel);
    const on = !!(document.body.classList.contains('bt434') && B && !B.over && !B.dep430 && B.phase === 'player' && !ui.busy && u && u.side === 'a' && !u.ko);
    const bs = on ? [...P.querySelectorAll(QA443)].filter(b => b.dataset.mi != null || b.dataset.pv || !b.disabled) : [];
    const utile = bs.some(b => !b.disabled);
    // #qa443 et .qa443-n : rendus par React (src/screens/combat/battle/Foot.jsx) depuis pied.qa
    const Q = pied.qa;
    if (!utile) {
      const chg = footCls('qa-on', false);
      if (Q && !Q.hidden) pied.qa = { ...Q, hidden: true, nom: null };
      if (chg || pied.qa !== Q) refreshBattle('foot');
      return;
    }
    // l’aperçu d’abord (Annuler / Confirmer), puis les capacités, puis le reste
    const rang = b => (b.dataset.pv ? (b.dataset.pv === 'ok' ? 0 : 1) : b.dataset.mi != null ? 2 : 3);
    bs.sort((a, b) => rang(a) - rang(b));
    // repère sur les boutons du panneau (#bPanel, rendu par React) : le clic d'un raccourci les vise
    P.querySelectorAll('[data-qa443-src]').forEach(b => b.removeAttribute('data-qa443-src'));
    const items = bs.map((b, i) => {
      const L = qaLabel443(b, u);
      b.setAttribute('data-qa443-src', i);
      return { t: L.t || '', c: L.c || '', col: L.col || '', on: b.classList.contains('on'), disabled: !!b.disabled };
    });
    pied.qa = { hidden: false, nom: u.n + ' · à vous', items };
    footCls('qa-on', true);
    refreshBattle('foot');
  } catch (e) {}
}

/* ---------- 2. capacités à portée de pouce ---------- */
const QA443 = '[data-pv],[data-mi],[data-evo="open"],[data-undo],[data-duo],[data-vx],[data-cap]';

// Instructions exécutées au démarrage, dans l'ordre d'origine (voir index.js).
export function __init() {

/* 1. Plateau : depuis la v4.34 il rétrécissait pour tenir sous l’équipe adverse ; sur un écran bas (barre du navigateur,
      application Claude) il tombait à 220 px et votre camp passait sous la barre « Fin du tour ».
      Il reprend toute la largeur ; au début du combat, la page se cale sur le plateau.
   2. Attaques : touchez votre Pokémon, ses capacités s’affichent au-dessus de « Fin du tour » (plus besoin de descendre
      jusqu’à la fiche). Touchez une capacité, puis la cible (2 fois, ou « Confirmer »).
   3. Les avertissements sans gravité du navigateur (ResizeObserver, « Script error. » venu d’un autre site, lecture
      audio interrompue) n’ouvrent plus la boîte « Petit souci technique ». */

/* ---------- 1. plateau ---------- */
CROCHETS.lancement.push(nouveau => {
  if (nouveau && !B.over) setTimeout(cadre443, 80);
});


document.addEventListener('click', e => {
  const c = e.target.closest('[data-qa443]');
  if (!c || c.disabled) return;
  const b = document.querySelector(`#bPanel [data-qa443-src="${c.dataset.qa443}"]`);
  if (b && !b.disabled) b.click();
});


CROCHETS.rendu.push(qa443);

}
