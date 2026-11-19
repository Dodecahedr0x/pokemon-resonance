/* Preferences for this device (sound, vibrations, speed…) and the reduced-motion test (added in v1.0). */

import { RM, writeLS } from '../core/utils.js';
import { musStart, musStop } from '../audio/music.js';

export let PREF;

// Pokémon-style reduced animations (v4.72): system preference, accessibility setting or
// theme animations turned off. Same test as the local copies in engine/combat/battle-staging.js and 109.
export const calmMotion = () =>
  !!RM || document.documentElement.classList.contains('a11y-rm') || PREF.pokemonSkinA === 0;

export function savePref() {
  writeLS('res-pref', PREF);
  if (PREF.music) {
    musStart();
  } else {
    musStop();
  }
}

// Instructions run at startup, in the original order (see index.js).
export function init() {
  /* ---- preferences for this device ---- */
  PREF = (() => {
    const p = { sound: false, vibe: false, fast: false };
    try {
      Object.assign(p, JSON.parse(localStorage.getItem('res-pref') || '{}'));
    } catch {
      /* Best effort: failure here is non-fatal. */
    }
    return p;
  })();
}
