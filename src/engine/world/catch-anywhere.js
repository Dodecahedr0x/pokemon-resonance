import { BY, PRESETS, familyOf } from '../pokemon/pokemon.js';
import { RECRUIT } from '../pokemon/evolution.js';
import { BADGE_REWARD, PROFILE, isCamp } from '../state/game-state.js';
import { isJohtoRegion } from './johto.js';
import { isHoennRegion } from './hoenn.js';
import { boxCount } from '../modes/legendary-captures.js';

/* =====================================================================
   v4.21: catch anywhere
   1. Free mode too: Pokémon are no longer freely chosen, they are
      caught. Battles (gyms, League, Johto, Hoenn) remain open.
   2. Each family is caught in its own region: Kanto on Route 29 and
      at the Safari Park, Johto on Route 32, Hoenn on Route 104, fishing
      included (Magikarp bites everywhere). A family belongs to the
      region of its first known member: Pichu → Pikachu is Kanto.
   3. Free-mode players keep their team, their catches, their
      companion and their badge gifts (one-time migration, freeMigrated).
   ===================================================================== */
export function CATCH_ANYWHERE_0() {
  return { freeMigrated: 0 };
}

export function catchAnywhereClean(p) {
  return { freeMigrated: p && p.freeMigrated ? 1 : 0 };
}

/** Region of a family: 1 Kanto, 2 Johto, 3 Hoenn (first known member). */
export function familyRegion(id) {
  const m = BY[id];
  if (!m) {
    return 1;
  }
  const b = m.base || id;
  if (REGION_CACHE[b] == null) {
    REGION_CACHE[b] = Math.min(...familyOf(b).map(x => x.gen || 1));
  }
  return REGION_CACHE[b];
}

/**
 * Free mode: the Box replaces "everything is open". Once per profile,
 * the team, catches already made, the companion and the gifts
 * from badges already won are put into it. An empty Box receives the starter team.
 */
export function fillFreeBox(sq, badges) {
  if (isCamp()) {
    return false;
  }
  const box = PROFILE.box,
    add = id => {
      const m = BY[id],
        b = m && m.base;
      if (b && isRecruitable(b) && !box.includes(b)) {
        box.push(b);
      }
    };
  let ch = false;
  if (!PROFILE.freeMigrated) {
    (sq || []).forEach(add);
    (PROFILE.dex || []).forEach(add);
    if (PROFILE.comp && PROFILE.comp.id) {
      add(PROFILE.comp.id);
    }
    (badges || []).forEach(i => {
      const R = BADGE_REWARD[i],
        g = R && R.gift.find(id => !box.includes(id));
      if (g) {
        add(g);
      }
    });
    PROFILE.freeMigrated = 1;
    ch = true;
  }
  if (!box.length) {
    PRESETS.orage.ids.forEach(add);
    ch = true;
  }
  return ch;
}

const REGION_CACHE = {};

export const regionIndex = () => (isHoennRegion() ? 3 : isJohtoRegion() ? 2 : 1);

export const ROUTE_NAMES = ['', 'Route 29', 'Route 32', 'Route 104'];

export const FAMILY_REGION_NAMES = ['', 'Kanto', 'Johto', 'Hoenn'];

const isRecruitable = id => !!BY[id] && RECRUIT.some(x => x.id === BY[id].base);

/** Where to catch a family (empty for legends, never recruitable). */
export const captureSite = id => (isRecruitable(id) ? ROUTE_NAMES[familyRegion(id)] : '');

/** The wild families of the displayed region. */
export const regionPool = (r = regionIndex()) => RECRUIT.filter(m => familyRegion(m.id) === r);

/** Short text for the Free-mode screens. */
export const boxCapacityLabel = () => `Box ${boxCount()} / ${RECRUIT.length}`;
