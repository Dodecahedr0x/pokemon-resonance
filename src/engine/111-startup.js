/* Original section: 99-startup.js */

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
import { rivalBuild, towerRestore } from './043-adventure-plus.js';
import { free421 } from './061-catch-anywhere.js';
import { diplomaOut428 } from './063-combat-catches-home.js';
import { weeklyBuild429 } from './064-quality.js';
import { challenges431Boot } from './066-tactical-challenges.js';

/* ===================== STARTUP =====================
   All the code is loaded: we restore the game, then display.
   Each step is protected: if one breaks, the others carry on (and the problem is shown). */
const bootStep = (name, f) => {
  try {
    f();
  } catch (e) {
    reportError(e, 'démarrage, ' + name);
  }
};

// Instructions run at startup, in the original order (see index.js).
export function __init() {

bootStep('Champion', champBuild);

 // the Champion exists from the start (restoring the game displays them)…
bootStep('sauvegarde', () => {
  bootSaves(); // device save (the Claude account follows in the background)
  Object.assign(PROFILE, ecoClean(SV.local.auto && SV.local.auto.profile));
});


bootStep('captures Libre', () => {
  // v4.21: the Box replaces Free mode's "everything is open"
  if (!free421(squad, BADGES)) return;
  __set_squad(squad.filter(id => inBox(id)));
  if (!squad.length) __set_squad(PROFILE.box.slice(0, 4).filter((id, i, a) => a.slice(0, i + 1).reduce((t, x) => t + BY[x].c, 0) <= BUDGET));
  save();
});


bootStep('diplômes régionaux', () => setTimeout(diplomaOut428, 1500));

 // v4.28: regions already complete
bootStep('Champion', champBuild);

 // … then they study your latest battles
bootStep('rival et Tour', () => {
  rivalBuild();
  towerRestore();
});


bootStep('défi de la semaine', weeklyBuild429);

 // v4.29
bootStep('défis tactiques', challenges431Boot);

 // riddle, expedition and gym in progress (v4.31)
// the old title screen (#splash) is gone: the React launch screen replaces it
// (it was only created in its absence, when res-splash was already set, so never displayed).


// safety net: if the launch screen could not be installed, the game is shown anyway
bootStep('guide', () => {
  // first launch: the guide opens on "Débuter" (Getting started)
  let f = null;
  try {
    f = localStorage.getItem('res-v3');
  } catch { /* Best effort: failure here is non-fatal. */ }
  let k = getGuide().tab;
  if (!f || k === 'projet') {
    k = 'debuter';
    try {
      localStorage.setItem('res-v3', '1');
    } catch { /* Best effort: failure here is non-fatal. */ }
  }
  setGuide(k);
});


bootStep('filtres', renderFilters);


bootStep('équipe', renderSquad);

 // also draws the Pokédex and the analysis (v4.76: no second identical render)
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
  // tab: the one from the address, otherwise the last one opened
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


// v4.76: home is already drawn by show() just above (no second identical render)
bootStep('typographie', () => fixTree(document.body));


bootStep('intro', () => {
  // the Professor arrives when the launch screen closes
  const sel = '#resonance-launch';
  if (document.querySelector(sel)) {
    new MutationObserver((m, ob) => {
      if (!document.querySelector(sel)) {
        ob.disconnect();
        showIntro();
      }
    }).observe(document.body, { childList: true, subtree: true });
  } // the React launch screen is in #root, not a direct child of <body>
  else showIntro();
});


bootStep('sauvegarde auto', queueSave);
}
