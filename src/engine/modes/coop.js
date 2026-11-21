/* 2-player co-op (Settings): Player 1 controls the first 2 Pokémon, Player 2 the others (added in v4.18). */

import { HOOKS } from '../core/hooks.js';
import { battle, clearAim, addLog, renderAll, ui } from '../combat/ui.js';
import { toast } from '../core/utils.js';
import { PREFERENCES } from '../ui/preferences.js';
import { vibrate } from '../audio/sound-effects.js';

/** End of the co-op turn: Player 1 hands over to Player 2. Returns true if control was handed over. */
export function coopPassTurn() {
  if (
    !battle ||
    !battle.coop ||
    battle.coop !== 1 ||
    ui.busy ||
    battle.over ||
    battle.phase !== 'player' ||
    !isCoopPlayerAlive(battle, 2)
  ) {
    return false;
  }
  battle.coop = 2;
  ui.sel = null;
  ui.selE = null;
  ui.mode = null;
  clearAim();
  const nx = battle.units.find(x => x.side === 'a' && !x.ko && !x.acted && coopPlayer(x) === 2);
  ui.sel = nx ? nx.uid : null;
  addLog('Au tour du Joueur 2.', 'sys');
  toast('Au tour du Joueur 2 !');
  vibrate(30);
  renderAll();
  return true;
}

/** Player 1: the first 2 Pokémon of the team; Player 2: the others. */
export const coopPlayer = u => (+String(u.uid).slice(1) < 2 ? 1 : 2);

export const isCoopPlayerAlive = (S, j) => S.units.some(u => u.side === 'a' && !u.ko && coopPlayer(u) === j);

// Statements run at startup, in the original order (see index.js).
export function init() {
  HOOKS.combat.push((S, opt, D0) => {
    if (!PREFERENCES.coop || S.order === 'vitesse' || (D0 && (D0.tuto || D0.duel433))) {
      return;
    }
    if (S.units.filter(u => u.side === 'a').length < 2 || !opt || opt.robot) {
      return;
    }
    S.coop = isCoopPlayerAlive(S, 1) ? 1 : 2;
  });

  HOOKS.beforeRoundEnd.push(S => {
    if (S.coop) {
      S.coop = isCoopPlayerAlive(S, 1) ? 1 : 2;
    }
  });
}
