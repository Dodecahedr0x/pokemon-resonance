/* Trainer statistics: trainer level, families owned, S ranks, best Bond, trophies. */

import { POKEMON } from '../pokemon/pokemon.js';
import { PROFILE, lvlOfPts } from '../state/game-state.js';
import { BADGES } from '../modes/gyms.js';

export const trainerLevel = () => {
  const xp =
    PROFILE.wins * 40 + PROFILE.caught * 30 + BADGES.length * 150 + PROFILE.elite * 200 + PROFILE.awakenings * 5;
  return Math.min(50, 1 + Math.floor(Math.sqrt(xp / 30)));
};

export const familyOwned = () => new Set([...PROFILE.box, ...PROFILE.dex]).size;

// Free mode too (v4.21)
export const ownedFam = id => PROFILE.box.includes(POKEMON[id].base) || PROFILE.dex.includes(POKEMON[id].base);

// Free mode too (v4.21)
export const countSRanks = () => Object.values(PROFILE.ranks || {}).filter(r => r === 'S').length;

export const maxLink = () => Object.values(PROFILE.links || {}).reduce((m, v) => Math.max(m, lvlOfPts(v)), 0);

export const trophies = () =>
  BADGES.length +
  Math.min(4, PROFILE.elite) +
  (PROFILE.elite >= 5 ? 1 : 0) +
  (PROFILE.johto || []).length +
  (PROFILE.jchamp ? 1 : 0) +
  (PROFILE.hoenn || []).length +
  (PROFILE.hchamp ? 1 : 0);
