/* Original section: 4.58: extra held items, TMs to win */

import { ITEMS2, PROFILE } from './011-game-state.js';
import { HOOKS } from './015-hooks.js';
import { esc } from './025-saves.js';
import { HELD_IMG, ICO414, SHOP, bagN, today } from './032-v4-foundation.js';
import { DAMAGE_PROVIDERS } from './044-tactical-engine.js';
import { HELD_SHOP } from './053-resonance.js';
import { seed417 } from './057-companions-resonance.js';
import { rng454 } from './084-peddler-route-missions.js';
import { berry455, orb455, svg455 } from './087-balls-held-items.js';
import { tmKeys455 } from './088-workshop-recipes.js';



export function tmDay456() {
  const r = rng454('ctjour456'),
    pool = tmKeys455().slice(),
    o = [];
  while (o.length < 2 && pool.length) o.push(pool.splice(Math.floor(r() * pool.length), 1)[0]);
  return { o, reg: ['Kanto', 'Johto', 'Hoenn'][seed417('ctreg456') % 3] };
}

// Statements run at startup, in the original order (see index.js).
export function __init() {

Object.assign(ICO414, {
  'lum-berry': svg455(berry455('#58b85a')),
  'flame-orb': svg455(orb455('#e5484d', '<path d="M24 14c4 4 5 8 2 12-1 2-4 2-5 0-2-3-1-7 3-12z" fill="#ffd45b"/>')),
  'toxic-orb': svg455(orb455('#9a5fd0', '<path d="M17 24h14M24 17v14" stroke="#e8d0ff" stroke-width="3" stroke-linecap="round"/>'))
});


/* ---------- extra held items ---------- */
Object.assign(ITEMS2, {
  baielum: { n: 'Baie Lum', d: 'Annule le premier Sommeil, la première Paralysie ou le premier Gel subi dans le combat.', i: 'M12 8c-4 0-6 3-6 6s2.5 6 6 6 6-2.6 6-6-2-6-6-6Zm0 0c0-2 1-3.6 3-4.5' },
  orbeflamme: { n: 'Orbe Flamme', d: 'Commence le combat Brûlé (3 manches). +25 % de dégâts tant qu’il brûle.', i: 'M12 3c3 3 6 6 4 11-1 3-6 3-7 0-2-5 0-8 3-11Z' },
  orbetoxik: { n: 'Orbe Toxik', d: 'Commence le combat Empoisonné (3 manches). +25 % de dégâts tant qu’il est empoisonné.', i: 'M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm-4 8h8M12 8v8' }
});


Object.assign(HELD_IMG, { baielum: 'lum-berry', orbeflamme: 'flame-orb', orbetoxik: 'toxic-orb' });


Object.assign(HELD_SHOP, { baielum: { p: 3000 }, orbeflamme: { p: 3000 }, orbetoxik: { p: 3000 } });




DAMAGE_PROVIDERS.push({
  id: 'orbes456',
  provide: (c, { u, m }) => !!u && ((u.item === 'orbeflamme' && u.burn > 0) || (u.item === 'orbetoxik' && u.poisoned > 0)) && (m.p > 0 || m.fix > 0) && { mul: 1.25, labelText: ITEMS2[u.item].n }
});


HOOKS.combat.push(S => {
  S.units.forEach(u => {
    if (u.side !== 'a' || u.ko) return;
    if (u.item === 'orbeflamme') u.burn = Math.max(u.burn || 0, 3);
    if (u.item === 'orbetoxik') u.poisoned = Math.max(u.poisoned || 0, 3);
  });
});


/* ---------- TMs to win: rank S, vendor of the day ---------- */
HOOKS.progress.unshift((S, rew) => {
  try {
    if (S && S.rank === 'S' && S.rankNew && S.sc !== 'sauvage' && S.sc !== 'tuto') {
      const cts = tmKeys455().filter(k => !bagN(k)),
        pool = cts.length ? cts : tmKeys455();
      let h = 5;
      for (const ch of S.sc + today()) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
      const k = pool[h % pool.length];
      PROFILE.bag[k] = Math.min(99, bagN(k) + 1);
      rew.ct456 = k;
    }
  } catch { /* Best effort: failure here is non-fatal. */ }
});


HOOKS.battleResult.unshift(r => (r.ct456 ? `<div class="res-l"><h4>Récompense de rang S</h4><div class="rl"><span>${esc(SHOP[r.ct456].n)} ajoutée au Sac</span><b>CT</b></div></div>` : ''));




// TM vendor of the day (#ctj456, Shop › TMs and HMs): rendered by React (src/screens/bag/Bag.jsx)

}
