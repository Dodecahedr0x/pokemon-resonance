/* Potions in battle: healing in exchange for the Pokémon's action (Battle Bag, v4.14). */

import { PROFILE } from '../state/game-state.js';
import { byUid, endStep, heal, pushMessage } from '../combat/engine.js';
import { B, finish, renderAll, ui } from '../combat/ui.js';
import { playEv } from '../combat/move-effects.js';
import { renderWallet } from '../ui/wallet.js';
import { BAG_MAX, useCombatItem } from '../combat/resonance.js';
import { SHOP, bagN } from '../state/economy.js';

function pUse(S, u, k) {
  const it = SHOP[k];
  if (
    !it ||
    !it.heal ||
    S.phase !== 'player' ||
    !u ||
    u.ko ||
    u.sn ||
    u.acted ||
    bagN(k) < 1 ||
    u.hp >= u.mhp ||
    (S.itemsUsed || 0) >= BAG_MAX ||
    S.duel433
  ) {
    return null;
  }
  const ev = [];
  heal(S, u, Math.ceil(u.mhp * it.heal), ev);
  pushMessage(ev, `${it.n} : ${u.n} reprend des forces.`);
  u.acted = true;
  u.moved = true;
  S.itemsUsed = (S.itemsUsed || 0) + 1; // Battle Bag (v4.14)
  PROFILE.bag[k] = bagN(k) - 1;
  if (!PROFILE.bag[k]) {
    delete PROFILE.bag[k];
  }
  return endStep(S, ev);
}

export const HEALS = ['potion', 'superpotion'];

// Bag bar in battle (.v4-bagbar): rendered by React (src/screens/combat/battle/Panel.jsx)

// Instructions run at startup, in the original order (see index.js).
export function init() {
  document.addEventListener('click', e => {
    if (e.target.closest('[data-ball]') && B) {
      return; // handled by the Ball choice (items/ball-choice.js)
    }
    const us = e.target.closest('[data-use]');
    if (us && B) {
      const u = byUid(B, ui.sel);
      const ev =
        (SHOP[us.dataset.use] || {}).category === 'combat'
          ? useCombatItem(B, u, us.dataset.use)
          : pUse(B, u, us.dataset.use); // v4.14
      if (!ev) {
        return;
      }
      ui.undo = null;
      renderAll();
      playEv(ev);
      if (B.over) {
        finish();
        return;
      }
      const nx = u && !u.ko && !u.acted ? u : B.units.find(x => x.side === 'a' && !x.ko && !x.acted); // it keeps its turn if it has not acted
      if (nx) {
        ui.sel = nx.uid;
      }
      renderAll();
      renderWallet();
    }
  });
}
