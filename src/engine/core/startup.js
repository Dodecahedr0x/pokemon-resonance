import { reportError } from './errors.js';
import { POKEMON } from '../pokemon/pokemon.js';
import { BUDGET } from '../pokemon/evolution.js';
import { PROFILE, inBox } from '../state/game-state.js';
import { BADGES } from '../modes/gyms.js';
import { NAV_TABS, show } from './navigation.js';
import { renderLeague } from '../modes/league.js';
import { __set_squad, renderFilters, renderSquad, save, squad } from '../team/team.js';
import { champBuild } from '../combat/items-bonds-ai.js';
import { battle, __set_selectedScenario } from '../combat/ui.js';
import { CLOUD_SAVE, bootSaves, queueSave } from '../state/saves.js';
import { __set_PREPG, renderPrep } from '../combat/battle-prep.js';
import { nextGoal } from '../progression/campaign.js';
import { renderHome } from '../world/home.js';
import { setGuide } from '../ui/guide.js';
import { getGuide } from '../../screens/guide/guideStore.js';
import { showIntro } from '../world/home-journey.js';
import { ecoClean } from '../state/economy.js';
import { renderWallet } from '../ui/wallet.js';
import { buildMap } from '../world/map.js';
import { fixTree } from '../ui/french-typography.js';
import { rivalBuild } from '../modes/rival.js';
import { towerRestore } from '../modes/resonance-tower.js';
import { fillFreeBox } from '../world/catch-anywhere.js';
import { awardRegionDiplomas } from '../progression/regional-dex.js';
import { buildWeeklyChallenge } from '../modes/weekly-challenge.js';
import { challengeSetBoot } from '../modes/camp-challenges.js';

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
export function init() {
  bootStep('Champion', champBuild);

  // the Champion exists from the start (restoring the game displays them)…
  bootStep('sauvegarde', () => {
    bootSaves(); // device save (the Claude account follows in the background)
    Object.assign(PROFILE, ecoClean(CLOUD_SAVE.local.auto && CLOUD_SAVE.local.auto.profile));
  });

  bootStep('captures Libre', () => {
    // v4.21: the Box replaces Free mode's "everything is open"
    if (!fillFreeBox(squad, BADGES)) {
      return;
    }
    __set_squad(squad.filter(id => inBox(id)));
    if (!squad.length) {
      __set_squad(
        PROFILE.box.slice(0, 4).filter((id, i, a) => a.slice(0, i + 1).reduce((t, x) => t + POKEMON[x].c, 0) <= BUDGET)
      );
    }
    save();
  });

  bootStep('diplômes régionaux', () => setTimeout(awardRegionDiplomas, 1500));

  // v4.28: regions already complete
  bootStep('Champion', champBuild);

  // … then they study your latest battles
  bootStep('rival et Tour', () => {
    rivalBuild();
    towerRestore();
  });

  bootStep('défi de la semaine', buildWeeklyChallenge);

  // v4.29
  bootStep('défis tactiques', challengeSetBoot);

  // riddle, expedition and gym in progress (v4.31)
  // the old title screen (#splash) is gone: the React launch screen replaces it
  // (it was only created in its absence, when res-splash was already set, so never displayed).

  // safety net: if the launch screen could not be installed, the game is shown anyway
  bootStep('guide', () => {
    // first launch: the guide opens on "Débuter" (Getting started)
    let f = null;
    try {
      f = localStorage.getItem('res-v3');
    } catch {
      /* Best effort: failure here is non-fatal. */
    }
    let k = getGuide().tab;
    if (!f || k === 'projet') {
      k = 'debuter';
      try {
        localStorage.setItem('res-v3', '1');
      } catch {
        /* Best effort: failure here is non-fatal. */
      }
    }
    setGuide(k);
  });

  bootStep('filtres', renderFilters);

  bootStep('équipe', renderSquad);

  // also draws the Pokédex and the analysis (v4.76: no second identical render)
  bootStep('Ligue', renderLeague);

  bootStep('prochain combat', () => {
    if (!battle) {
      __set_selectedScenario(nextGoal()[0]);
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
    if (!NAV_TABS.includes(t)) {
      try {
        t = localStorage.getItem('res8-tab');
      } catch (e) {
        t = null;
      }
    }
    show(NAV_TABS.includes(t) ? t : 'accueil', false);
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
    else {
      showIntro();
    }
  });

  bootStep('sauvegarde auto', queueSave);
}
