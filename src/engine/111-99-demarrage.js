/* Section d'origine : 99-demarrage.js */

import { reportError } from './002-00-erreurs.js';
import { BY } from './009-03-pokemon.js';
import { BUDGET } from './010-04-evolution-en-combat.js';
import { PROFILE, inBox } from './011-05-etat-de-partie.js';
import { BADGES } from './013-07-arenes.js';
import { TABS, show } from './016-09-navigation.js';
import { renderLigue } from './019-12-ligue.js';
import { __set_squad, renderFilters, renderSquad, save, squad } from './020-13-equipe-cartes.js';
import { champBuild } from './022-15-systemes-objets-liens-ia.js';
import { B, __set_scSel } from './024-17-interface-combat.js';
import { SV, bootSaves, queueSave } from './025-19-sauvegardes.js';
import { __set_PREPG, nextGoal, renderPrep } from './026-20-campagne-tutoriel-son.js';
import { renderHome } from './036-v4-04-accueil.js';
import { setGuide } from './029-23-guide-epure.js';
import { getGuide } from '../screens/guide/guideStore.js';
import { showIntro } from './031-25-v3-parcours-accueil.js';
import { ecoClean } from './032-v4-00-socle.js';
import { renderWallet } from './035-v4-03-interface.js';
import { buildMap } from './037-v4-05-carte.js';
import { fixTree } from './042-v4-1-03-finitions.js';
import { rivalBuild, tdrRestore } from './043-v4-4-01-aventure-plus.js';
import { libre421 } from './061-v4-21-01-capture-partout.js';
import { diplomeHors428 } from './063-v4-28-01-captures-combat-accueil.js';
import { hebdoBuild429 } from './064-v4-29-01-qualite.js';
import { defis431Boot } from './066-v4-31-01-defis-tactiques.js';

/* ===================== DÉMARRAGE =====================
   Tout le code est chargé : on restaure la partie, puis on affiche.
   Chaque étape est protégée : si l’une casse, les autres continuent (et le souci s’affiche). */
const bootStep = (name, f) => {
  try {
    f();
  } catch (e) {
    reportError(e, 'démarrage, ' + name);
  }
};

// Instructions exécutées au démarrage, dans l'ordre d'origine (voir index.js).
export function __init() {

bootStep('Champion', champBuild);

 // le Champion existe dès le départ (la restauration de la partie l’affiche)…
bootStep('sauvegarde', () => {
  bootSaves(); // sauvegarde de l’appareil (le compte Claude suit en arrière-plan)
  Object.assign(PROFILE, ecoClean(SV.local.auto && SV.local.auto.profile));
});


bootStep('captures Libre', () => {
  // v4.21 : la Box remplace le « tout est ouvert » du mode Libre
  if (!libre421(squad, BADGES)) return;
  __set_squad(squad.filter(id => inBox(id)));
  if (!squad.length) __set_squad(PROFILE.box.slice(0, 4).filter((id, i, a) => a.slice(0, i + 1).reduce((t, x) => t + BY[x].c, 0) <= BUDGET));
  save();
});


bootStep('diplômes régionaux', () => setTimeout(diplomeHors428, 1500));

 // v4.28 : régions déjà complètes
bootStep('Champion', champBuild);

 // … puis il étudie vos derniers combats
bootStep('rival et Tour', () => {
  rivalBuild();
  tdrRestore();
});


bootStep('défi de la semaine', hebdoBuild429);

 // v4.29
bootStep('défis tactiques', defis431Boot);

 // énigme, expédition et arène en cours (v4.31)
// l'ancien écran titre (#splash) a disparu : l'écran de lancement React le remplace
// (il n'était créé qu'en son absence, quand res-splash était déjà posé, donc jamais affiché).


// filet de sécurité : si l’écran de lancement n’a pas pu s’installer, le jeu s’affiche quand même
bootStep('guide', () => {
  // premier lancement : le guide s’ouvre sur « Débuter »
  let f = null;
  try {
    f = localStorage.getItem('res-v3');
  } catch (e) {}
  let k = getGuide().tab;
  if (!f || k === 'projet') {
    k = 'debuter';
    try {
      localStorage.setItem('res-v3', '1');
    } catch (e) {}
  }
  setGuide(k);
});


bootStep('filtres', renderFilters);


bootStep('équipe', renderSquad);

 // dessine aussi le Pokédex et l’analyse (v4.76 : plus de second rendu identique)
bootStep('Ligue', renderLigue);


bootStep('prochain combat', () => {
  if (!B) {
    __set_scSel(nextGoal()[0]);
    __set_PREPG(null);
  }
});


bootStep('carte de dresseur', renderHome);


bootStep('combats', renderPrep);


bootStep('carte', buildMap);


bootStep('porte-monnaie', renderWallet);


bootStep('onglet', () => {
  // onglet : celui de l’adresse, sinon le dernier ouvert
  let t = location.hash.slice(1);
  if (!TABS.includes(t)) {
    try {
      t = localStorage.getItem('res8-tab');
    } catch (e) {
      t = null;
    }
  }
  show(TABS.includes(t) ? t : 'accueil', false);
});


// v4.76 : l’accueil est déjà dessiné par show() juste au-dessus (plus de second rendu identique)
bootStep('typographie', () => fixTree(document.body));


bootStep('intro', () => {
  // la Professeure arrive quand l’écran de lancement se referme
  const sel = '#resonance-launch';
  if (document.querySelector(sel))
    new MutationObserver((m, ob) => {
      if (!document.querySelector(sel)) {
        ob.disconnect();
        showIntro();
      }
    }).observe(document.body, { childList: true, subtree: true }); // l'écran de lancement React est dans #root, pas enfant direct de <body>
  else showIntro();
});


bootStep('sauvegarde auto', queueSave);
}
