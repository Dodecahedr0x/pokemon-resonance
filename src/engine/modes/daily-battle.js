/* Daily battle: one terrain or gym a day, with doubled gains. */

import { SCENARIOS } from '../pokemon/pokemon.js';
import { PROFILE } from '../state/game-state.js';
import { ARENAS, TERR } from './gyms.js';
import { scenLock } from '../combat/items-bonds-ai.js';
import { today } from '../state/economy.js';

/* ---------- daily challenge ---------- */
function dailyPool() {
  return [
    ...TERR.filter(k => !['tuto', 'sauvage', 'champ'].includes(k) && !SCENARIOS[k].elite),
    ...ARENAS.map(a => a.k),
  ].filter(k => SCENARIOS[k] && !scenLock(k));
}

export function dailyKey() {
  const p = dailyPool();
  if (!p.length) {
    return null;
  }
  let h = 7;
  for (const ch of today()) {
    h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  }
  return p[h % p.length];
}

export function dailyLeft() {
  const n = new Date(),
    m = new Date(n);
  m.setHours(24, 0, 0, 0);
  const s = Math.max(0, (m - n) / 1000),
    h = Math.floor(s / 3600),
    mi = Math.floor((s % 3600) / 60);
  return h ? `${h} h ${String(mi).padStart(2, '0')}` : `${mi} min`;
}

export const dailyDone = () => PROFILE.daily && PROFILE.daily.d === today() && PROFILE.daily.w;
