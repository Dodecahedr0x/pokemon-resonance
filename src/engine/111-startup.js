/* Section d'origine : 99-demarrage.js */

import { reportError } from './002-errors.js';
import { BY } from './009-pokemon.js';
import { BUDGET } from './010-in-battle-evolution.js';
import { PROFILE, inBox } from './011-game-state.js';
import { BADGES } from './013-gyms.js';
import { TABS, show } from './016-navigation.js';
import { renderLeague } from './019-league.js';
import { __set_squad, renderFilters, renderSquad, save, squad } from './020-team-cards.js';
import { champBuild } from './022-items-bonds-ai.js';
import { B, __set_scSel } from './024-combat-ui.js';
import { SV, bootSaves, queueSave } from './025-saves.js';
import { __set_PREPG, nextGoal, renderPrep } from './026-campaign-tutorial-sound.js';
import { renderHome } from './036-home.js';
import { setGuide } from './029-streamlined-guide.js';
import { getGuide } from '../screens/guide/guideStore.js';
import { showIntro } from './031-home-journey.js';
import { ecoClean } from './032-v4-foundation.js';
import { renderWallet } from './035-interface.js';
import { buildMap } from './037-map.js';
import { fixTree } from './042-polish.js';
import { rivalBuild, tdrRestore } from './043-adventure-plus.js';
import { free421 } from './061-catch-anywhere.js';
import { diplomaOut428 } from './063-combat-catches-home.js';
import { weeklyBuild429 } from './064-quality.js';
import { challenges431Boot } from './066-tactical-challenges.js';

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
  if (!free421(squad, BADGES)) return;
  __set_squad(squad.filter(id => inBox(id)));
  if (!squad.length) __set_squad(PROFILE.box.slice(0, 4).filter((id, i, a) => a.slice(0, i + 1).reduce((t, x) => t + BY[x].c, 0) <= BUDGET));
  save();
});


bootStep('diplômes régionaux', () => setTimeout(diplomaOut428, 1500));

 // v4.28 : régions déjà complètes
bootStep('Champion', champBuild);

 // … puis il étudie vos derniers combats
bootStep('rival et Tour', () => {
  rivalBuild();
  tdrRestore();
});


bootStep('défi de la semaine', weeklyBuild429);

 // v4.29
bootStep('défis tactiques', challenges431Boot);

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
bootStep('Ligue', renderLeague);


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
