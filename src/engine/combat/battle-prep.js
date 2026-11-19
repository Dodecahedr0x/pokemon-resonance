/* Battle preparation: the selection screen (terrains, gyms, League) and its challenge buttons (added in v1.0). */

import { SCEN } from '../pokemon/pokemon.js';
import { squad } from '../team/team.js';
import { champBuild } from './items-bonds-ai.js';
import { __set_scSel, challenge, scSel } from './ui.js';
import { renderSummary } from '../state/saves.js';
import { renderSelection } from '../world/home-journey.js';
import { preload } from '../assets/illustrations.js';
import { rivalBuild } from '../modes/rival.js';
import { nextGoal } from '../progression/campaign.js';

export let PREPG;
export function __set_PREPG(v) {
  return (PREPG = v);
}

// Battles: the selection is rendered by React (src/screens/combat/prep), via renderSelection().
export function renderPrep() {
  rivalBuild();
  if (scSel === 'sauvage' && !SCEN.sauvage) {
    __set_scSel(nextGoal()[0]);
  }
  if (scSel === 'champ') {
    champBuild();
  }
  renderSummary();
  renderSelection();
  try {
    // team and opponent illustrations preloaded
    const S = SCEN[scSel];
    preload([...squad, ...(S && S.foes ? S.foes.map(f => f[0]) : [])]);
  } catch {
    /* Best effort: failure here is non-fatal. */
  }
}

// Instructions run at startup, in the original order (see index.js).
export function init() {
  /* ---- preparation: terrains, gyms, League ---- */
  PREPG = null;

  document.addEventListener('click', e => {
    const b = e.target.closest('[data-chal]');
    if (b) {
      challenge(b.dataset.chal);
    }
  });
}
