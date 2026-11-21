/* Shared builders for the challenge battle scenes: opponents and arena (added in v4.71). */

import { POKEMON } from '../pokemon/pokemon.js';

/** Keeps only the species that exist. */
export const existingSpecies = ids => ids.filter(i => POKEMON[i]);

const POS = [
  [6, 1],
  [6, 3],
  [7, 2],
  [7, 4],
  [6, 5],
];

/** Opponents placed on the right side of the board. */
export const makeFoes = ids => existingSpecies(ids).map((id, i) => [id, POS[i % POS.length]]);

/** Night ford arena used by the Shadows battles and the daily challenge. */
export const baseScene = (n, lvl, d, lv, hb, foes) => ({
  n,
  lvl,
  lim: 14,
  time: 'nuit',
  bio: 'gue',
  d,
  water: [],
  rock: ['3,0', '3,5'],
  hb,
  pb: 0,
  lv,
  foes,
});
