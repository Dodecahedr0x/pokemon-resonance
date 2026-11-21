/* Preferences for this device (sound, vibrations, speed…) and the reduced-motion test (added in v1.0). */

import { reducedMotion, writeLS } from '../core/utils.js';
import { musStart, musStop } from '../audio/music.js';

// Pokémon-style reduced animations (v4.72): system preference, accessibility setting or
// theme animations turned off. Same test as the local copies in engine/combat/battle-staging.js and 109.
export const calmMotion = () =>
  !!reducedMotion || document.documentElement.classList.contains('a11y-rm') || PREF.pokemonSkinA === 0;

export function savePref() {
  writeLS('res-pref', PREF);
  if (PREF.music) {
    musStart();
  } else {
    musStop();
  }
}

const p = { sound: false, vibe: false, fast: false };

export const PREF = p;

// Instructions run at startup, in the original order (see index.js).
export function init() {
  /* ---- preferences for this device ---- */
  try {
    Object.assign(p, JSON.parse(localStorage.getItem('res-pref') || '{}'));
  } catch {
    /* Best effort: failure here is non-fatal. */
  }
}
