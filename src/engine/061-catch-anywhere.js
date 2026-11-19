/* Original section: v4.21-01-catch-anywhere.js */

import { BY, PRESETS, familyOf } from './009-pokemon.js';
import { RECRUIT } from './010-in-battle-evolution.js';
import { BADGE_REWARD, PROFILE, isCamp } from './011-game-state.js';
import { regionJ415 } from './054-johto.js';
import { regionH419 } from './059-hoenn.js';
import { boxN429 } from './064-quality.js';

/* =====================================================================
   v4.21: catch anywhere
   1. Free mode too: Pokémon are no longer freely chosen, they are
      caught. Battles (gyms, League, Johto, Hoenn) remain open.
   2. Each family is caught in its own region: Kanto on Route 29 and
      at the Safari Park, Johto on Route 32, Hoenn on Route 104, fishing
      included (Magikarp bites everywhere). A family belongs to the
      region of its first known member: Pichu → Pikachu is Kanto.
   3. Free-mode players keep their team, their catches, their
      companion and their badge gifts (one-time migration, lib421).
   ===================================================================== */
export function V421_0() {
  return { lib421: 0 };
}


export function v421Clean(p) {
  return { lib421: p && p.lib421 ? 1 : 0 };
}


/** Region of a family: 1 Kanto, 2 Johto, 3 Hoenn (first known member). */
export function regFam421(id) {
  const m = BY[id];
  if (!m) return 1;
  const b = m.base || id;
  if (REG421[b] == null) REG421[b] = Math.min(...familyOf(b).map(x => x.gen || 1));
  return REG421[b];
}


/**
 * Free mode: the Box replaces "everything is open". Once per profile,
 * the team, catches already made, the companion and the gifts
 * from badges already won are put into it. An empty Box receives the starter team.
 */
export function free421(sq, badges) {
  if (isCamp()) return false;
  const box = PROFILE.box,
    add = id => {
      const m = BY[id],
        b = m && m.base;
      if (b && isRecruit421(b) && !box.includes(b)) box.push(b);
    };
  let ch = false;
  if (!PROFILE.lib421) {
    (sq || []).forEach(add);
    (PROFILE.dex || []).forEach(add);
    if (PROFILE.comp && PROFILE.comp.id) add(PROFILE.comp.id);
    (badges || []).forEach(i => {
      const R = BADGE_REWARD[i],
        g = R && R.gift.find(id => !box.includes(id));
      if (g) add(g);
    });
    PROFILE.lib421 = 1;
    ch = true;
  }
  if (!box.length) {
    PRESETS.orage.ids.forEach(add);
    ch = true;
  }
  return ch;
}

const REG421 = {};


export const regionNo421 = () => (regionH419() ? 3 : regionJ415() ? 2 : 1);


export const ROUTE421 = ['', 'Route 29', 'Route 32', 'Route 104'];


export const REGION_NAMES421 = ['', 'Kanto', 'Johto', 'Hoenn'];


const isRecruit421 = id => !!BY[id] && RECRUIT.some(x => x.id === BY[id].base);


/** Where to catch a family (empty for legends, never recruitable). */
export const captureSite421 = id => (isRecruit421(id) ? ROUTE421[regFam421(id)] : '');


/** The wild families of the displayed region. */
export const poolRegion421 = (r = regionNo421()) => RECRUIT.filter(m => regFam421(m.id) === r);


/** Short text for the Free-mode screens. */
export const freeBox421 = () => `Box ${boxN429()} / ${RECRUIT.length}`;
