/* Ancient specimens: spend a fossil to revive a rare Pokémon into the Box (added in v4.71). */

import { POKEMON } from '../pokemon/pokemon.js';
import { PROFILE } from '../state/game-state.js';
import { toast } from '../core/utils.js';
import { save } from '../team/team.js';
import { sfx } from '../audio/sound-effects.js';
import { existingSpecies } from './challenge-scenes.js';
import { writeChallengeState } from './challenges-hub.js';

const REV = () => existingSpecies(['tenefix', 'malosse', 'demolosse', 'tyranocif']);

/** Specimens not yet in the Box nor the Pokédex. */
export const freeSpecimens = () => REV().filter(id => !PROFILE.box.includes(id) && !(PROFILE.dex || []).includes(id));

/** Spends a fossil of X on a random free specimen; returns false when there is nothing to revive. */
export const reviveSpecimen = X => {
  const freeOnes = freeSpecimens();
  if (X.fossils < 1 || !freeOnes.length) {
    return false;
  }
  const id = freeOnes[Math.floor(Math.random() * freeOnes.length)];
  X.fossils -= 1;
  X.rev.push(id);
  PROFILE.box.push(id);
  if (!PROFILE.dex.includes(id)) {
    PROFILE.dex.push(id);
  }
  writeChallengeState(X);
  try {
    save();
  } catch {
    /* Best effort: failure here is non-fatal. */
  }
  sfx('win');
  toast(POKEMON[id].n + ' rejoint votre Boîte !');
  return true;
};
