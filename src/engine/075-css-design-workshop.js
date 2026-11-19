/* Original section: v4.42: Design Workshop (custom CSS, brief for ChatGPT) */

import { $, toast } from './014-utils.js';
import { TABS, TNAME } from './016-navigation.js';
import { PREF, savePref } from './026-campaign-tutorial-sound.js';


/* Settings › Design Workshop: paste a CSS block (e.g. written by ChatGPT), it applies immediately on this device.
   The brief gives ChatGPT the game's variables, pages and components without making it read the file's 3.7 MB. */
export function css442() {
  return String(PREF.css442 || '');
}


function cssSafe442(t) {
  return String(t || '')
    .replace(/@import[^;]*;?/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/expression\s*\(/gi, '(')
    .slice(0, 60000);
}


function applyCss442() {
  let el = document.getElementById('css442');
  const t = cssSafe442(css442());
  if (!t) {
    if (el) el.remove();
    return;
  }
  if (!el) {
    el = document.createElement('style');
    el.id = 'css442';
  }
  el.textContent = t;
  document.head.appendChild(el); // always last: it overrides the other stylesheets
}


function brief442() {
  const names = new Set();
  for (const ss of document.styleSheets) {
    let rules;
    try {
      rules = ss.cssRules;
    } catch (e) {
      continue;
    }
    for (const r of rules || [])
      {if (r.selectorText && /^(:root|html)$/.test(r.selectorText.trim()))
        {for (let i = 0; i < r.style.length; i++) if (r.style[i].startsWith('--')) names.add(r.style[i]);}}
  }
  const cs = getComputedStyle(document.documentElement),
    vars = [...names]
      .slice(0, 110)
      .map(n => '  ' + n + ': ' + cs.getPropertyValue(n).trim().replace(/url\([^)]{40,}\)/g, 'url(…)').slice(0, 80) + ';')
      .join('\n');
  const pages = TABS.map(id => `#${id} (${TNAME[id] || id})`).join(', ');
  return `Tu es designer UI/CSS. Je te confie le design d’un jeu mobile : « Pokémon Résonance » (fangame non officiel, stratégie tactique sur plateau hexagonal, thème Pokémon, un seul fichier HTML, joué surtout sur téléphone Android de 360 à 412 px de large).
Le fichier fait 3,7 Mo : tu ne le vois pas en entier. Voici le brief.

CE QUE JE VEUX DE TOI
Écris UNIQUEMENT un bloc de CSS additif, que je colle dans l’Atelier design du jeu (il est ajouté après toutes les autres feuilles de style). Aucune modification du HTML ni du JavaScript.
Dis-moi d’abord en 3 lignes la direction que tu prends (palette, formes, ambiance), puis donne le CSS.

RÈGLES
- Garde l’esprit Pokémon : arrondis, dégradés, badges, couleurs vives par type. Pas de personnages ni logos officiels.
- Aucun défilement horizontal à 360 px. Cibles tactiles d’au moins 40 px. Texte lisible (contraste suffisant).
- Pas de @import, pas d’image ni de police externe : formes, dégradés CSS, ombres, variables.
- La feuille de base utilise beaucoup de « !important » : mets « !important » quand une règle n’a pas d’effet.
- Commence par redéfinir les variables dans « :root{…} », puis ajoute des règles précises préfixées par l’id de la page (#accueil, #combat…).
- Donne-moi le CSS complet en un seul bloc, commenté par zone.

VARIABLES ACTUELLES (:root)
:root{
${vars}
}

PAGES
${pages}

COMPOSANTS CLÉS
.b / .b-gold / .b-sm (boutons) · .v4-panel (cartes) · .v4-tabs (onglets) · .nv (navigation ordinateur) · .bn (navigation téléphone) · #combat .sel-card (fiche du combat) · #combat .pt (équipe) · .res-card (résultat de combat) · .bt-top (haut du combat) · #bArena (règle d’arène) · .v4-params (Paramètres) · .lq429-c (carte de légende) · .doc430-b (boutons de doctrine).

Après ton CSS, propose-moi 3 variantes de palette que je peux tester en changeant seulement le bloc « :root ».`;
}

// Instructions run at startup, in the original order (see index.js).
export function __init() {

// "Atelier design" (Design Workshop) panel: rendered by React (src/screens/settings/panels/DesignWorkshop.jsx)


document.addEventListener('click', e => {
  const a = e.target.closest('#ad442a,#ad442r,#ad442b');
  if (!a) return;
  if (a.id === 'ad442a') {
    PREF.css442 = cssSafe442(($('#ad442t') || {}).value);
    savePref();
    applyCss442();
    toast(PREF.css442 ? 'Style appliqué.' : 'Aucun CSS : style d’origine.');
  } else if (a.id === 'ad442r') {
    PREF.css442 = '';
    savePref();
    applyCss442();
    const t = $('#ad442t');
    if (t) t.value = '';
    toast('Style d’origine rétabli.');
  } else {
    const k = $('#ad442k');
    if (!k) return;
    k.value = brief442();
    k.hidden = false;
    k.focus();
    k.select();
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(k.value).then(() => toast('Brief copié : collez-le dans ChatGPT.'), () => toast('Touchez le texte, « Tout sélectionner », puis « Copier ».'));
      else toast('Touchez le texte, « Tout sélectionner », puis « Copier ».');
    } catch (er) {
      toast('Touchez le texte, « Tout sélectionner », puis « Copier ».');
    }
  }
});


applyCss442();
}
