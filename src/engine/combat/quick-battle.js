/* Quick battle: ×2 button in battle, and « Passer » (Skip) during the opponent turn, which plays sped up with the same rules (added in v4.28). */

import { RM, toast } from '../core/utils.js';
import { byUid } from './engine.js';
import { B, renderAll, ui } from './ui.js';
import { PREF, savePref } from '../ui/preferences.js';
import { evoSet } from '../../screens/combat/board/boardStore.js';
import { refreshBattle } from '../../screens/combat/battle/battleStore.js';

export function endSkipSpeedup() {
  if (!B) {
    return;
  }
  if (!ui.busy) {
    ui.skipSpeedup = false;
  }
  refreshBattle('fast'); // #bFast (aria-pressed): rendered by React (TopBar.jsx)
}

export const battleDelay = (rm, fast, slow) => (RM || ui.skipSpeedup ? rm : PREF.fast ? fast : slow);

export const isEnemyTurn = () =>
  !!(
    B &&
    !B.over &&
    ui.busy &&
    !ui.cutscene &&
    (B.phase === 'enemy' || (B.order === 'vitesse' && ui.act && (byUid(B, ui.act) || {}).side === 'e'))
  );

// Statements run at startup, in the original order (see index.js).
export function init() {
  document.addEventListener('click', e => {
    if (e.target.closest('#bFast')) {
      PREF.fast = !PREF.fast;
      savePref();
      endSkipSpeedup();
      toast(PREF.fast ? 'Combat rapide : animations ×2' : 'Vitesse normale');
      return;
    }
    if (e.target.closest('#bEnd') && isEnemyTurn() && !ui.skipSpeedup) {
      ui.skipSpeedup = true;
      evoSet({ fast: true }); // #evoFx (React)
      renderAll();
    }
  });
}
