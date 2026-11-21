/* Quick battle: ×2 button in battle, and « Passer » (Skip) during the opponent turn, which plays sped up with the same rules (added in v4.28). */

import { reducedMotion, toast } from '../core/utils.js';
import { byUid } from './engine.js';
import { battle, renderAll, ui } from './ui.js';
import { PREFERENCES, savePref } from '../ui/preferences.js';
import { evoSet } from '../../screens/combat/board/boardStore.js';
import { refreshBattle } from '../../screens/combat/battle/battleStore.js';

export function endSkipSpeedup() {
  if (!battle) {
    return;
  }
  if (!ui.busy) {
    ui.skipSpeedup = false;
  }
  refreshBattle('fast'); // #bFast (aria-pressed): rendered by React (TopBar.jsx)
}

export const battleDelay = (rm, fast, slow) => (reducedMotion || ui.skipSpeedup ? rm : PREFERENCES.fast ? fast : slow);

export const isEnemyTurn = () =>
  !!(
    battle &&
    !battle.over &&
    ui.busy &&
    !ui.cutscene &&
    (battle.phase === 'enemy' || (battle.order === 'vitesse' && ui.act && (byUid(battle, ui.act) || {}).side === 'e'))
  );

// Statements run at startup, in the original order (see index.js).
export function init() {
  document.addEventListener('click', e => {
    if (e.target.closest('#bFast')) {
      PREFERENCES.fast = !PREFERENCES.fast;
      savePref();
      endSkipSpeedup();
      toast(PREFERENCES.fast ? 'Combat rapide : animations ×2' : 'Vitesse normale');
      return;
    }
    if (e.target.closest('#bEnd') && isEnemyTurn() && !ui.skipSpeedup) {
      ui.skipSpeedup = true;
      evoSet({ fast: true }); // #evoFx (React)
      renderAll();
    }
  });
}
