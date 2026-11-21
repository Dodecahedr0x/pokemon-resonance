/* Top bar wallet: the trainer's Pokédollars and Shards, redrawn by React (TopBar.jsx). */

import { PROFILE } from '../state/game-state.js';
import { $$ } from '../core/utils.js';
import { formatNumber } from '../state/economy.js';
import { refreshWallet } from '../../components/shellStore.js';

// Trainer, Pokédollars and Shards of the top bar: redrawn by React (TopBar.jsx).
export function renderWallet() {
  refreshWallet();
  $$('[data-wallet]').forEach(el => {
    el.textContent = formatNumber(el.dataset.wallet === 'gems' ? PROFILE.gems : PROFILE.money);
  });
}
