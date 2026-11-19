/* Section d'origine : 23-guide-epure.js */

import { $ } from './014-08-outils.js';
import { TNAME, go } from './016-09-navigation.js';
import { __set_filt, renderFilters, renderGrid } from './020-13-equipe-cartes.js';
import { B, renderPanel, scSel } from './024-17-interface-combat.js';
import { PREF, PREPG, __set_PREPG, renderPrep, savePref } from './026-20-campagne-tutoriel-son.js';
import { openRule, setGuideTab } from '../screens/guide/guideStore.js';

// Onglet courant, choix d'onglet et règle ciblée : état React (src/screens/guide/guideStore.js).
export function setGuide(k) {
  setGuideTab(k);
}


export function openGuide(k) {
  go('types');
  setGuideTab(k);
}


export function jump(c) {
  openGuide('bases');
  openRule(c);
}


// Résumé de l'analyse (#anaSum) et encart des recrues (#dexCall) : rendus par React
// (src/screens/equipe/Analyse.jsx, DexCall.jsx).


// Détails du rôle : la classe reste posée sur le conteneur (le tutoriel y ajoute aussi la sienne) ;
// la ligne du rôle et le bouton « Détails » sont rendus par React (src/screens/combat/battle/Panel.jsx).
export function panelRoleInfo() {
  const p = $('#bPanel');
  if (!p || !B) return;
  p.classList.toggle('info-off', !PREF.info);
}

// Instructions exécutées au démarrage, dans l'ordre d'origine (voir index.js).
export function __init() {

/* ===================== v1.2 : épure — un Guide unique, des écrans consacrés au jeu ===================== */
Object.assign(TNAME, { pokedex: 'Équipe', types: 'Guide', ligue: 'Ligue' });


/* --- Guide à onglets : l'onglet mémorisé est lu par guideStore.js --- */
document.addEventListener('click', e => {
  const t = e.target.closest('[data-gt]');
  if (t) {
    setGuide(t.dataset.gt);
    return;
  }
  const g = e.target.closest('[data-guide]');
  if (g) {
    e.preventDefault();
    openGuide(g.dataset.guide);
  }
});


/* --- Préparation : onglets Terrains, Arènes, Ligue --- */
$('#scenList').addEventListener('click', e => {
  const t = e.target.closest('[data-pg]');
  if (!t) return;
  __set_PREPG({ g: t.dataset.pg, sc: scSel });
  renderPrep();
});


/* --- Équipe : filtre de rôle en liste (options rendues par React, Equipe.jsx), analyse repliée, encart compact --- */
{
  const r = $('#dexRole');
  if (r) {
    r.addEventListener('change', e => {
      __set_filt(e.target.value);
      renderFilters();
      renderGrid();
    });
  }
}


if (PREF.info === undefined) PREF.info = false;


$('#bPanel').addEventListener('click', e => {
  if (e.target.closest('[data-info]')) {
    PREF.info = !PREF.info;
    savePref();
    renderPanel();
  }
});
}
