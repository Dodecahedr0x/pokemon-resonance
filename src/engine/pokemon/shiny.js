import { BY } from './pokemon.js';
import { PROFILE } from '../state/game-state.js';

/* Shiny Pokémon to collect: rate, per-species hue and sparkle icon (added in v4.4, Adventure+). */

export let wildShiny;
export function __set_wildShiny(v) {
  return (wildShiny = v);
}

export const SHINY_RATE = 1 / 25;

/* hue specific to each species: a given shiny Pokémon always has the same color */
export const shinyHue = id => 40 + ((((BY[id] && BY[id].no) || 0) * 53) % 260);

export const shinyStyle = id => `--sh:${shinyHue(id)}deg`;

export const isShinyOwned = id => (PROFILE.shiny || []).includes(id);

export const SPARK =
  '<svg class="shn-ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l2.2 6.6L21 11l-6.8 2.4L12 20l-2.2-6.6L3 11l6.8-2.4Z"/></svg>';

// Statements run at startup, in the original order (see index.js).
export function init() {
  wildShiny = false;
}
