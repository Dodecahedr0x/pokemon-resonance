/* Original section: v4.46: in Free Mode too, regions open in order */

import { SCEN } from './009-pokemon.js';
import { PROFILE } from './011-game-state.js';
import { johtoOpen } from './054-johto.js';
import { hoennOpen } from './059-hoenn.js';

const JLEG446 = ['raikou', 'entei', 'suicune', 'lugia', 'hooh'];

function region446(k) {
  const D = SCEN[k];
  if (!D) {
    return null;
  }
  if (D.hoenn != null || D.hfinal || k === 'rv6' || k === 'hd429' || /^h[lc][a-z]/.test(k)) {
    return 'hoenn';
  }
  if (
    D.johto != null ||
    D.jfinal ||
    D.lac ||
    D.jdis ||
    D.roam ||
    k === 'rv5' ||
    JLEG446.some(id => k === 'lg' + id || k === 'lc' + id)
  ) {
    return 'johto';
  }
  return null;
}

/* Kanto first. Johto opens after beating the Kanto Champion (Auriane Vale),
   Hoenn after the Johto Master title — as in Campaign. In an open region,
   Free Mode keeps all its battles open (no badge order). Called by scenLock(). */
export function lockRegion446(k) {
  const r = region446(k);
  if (r === 'johto' && !johtoOpen()) {
    return 'Johto s’ouvre après votre victoire sur la Championne Auriane Vale (Kanto).';
  }
  if (r === 'hoenn' && !hoennOpen()) {
    return PROFILE.elite >= 5
      ? 'Hoenn s’ouvre après votre titre de Maître de Johto.'
      : 'Hoenn s’ouvre après Kanto puis Johto : battez d’abord la Championne Auriane Vale.';
  }
  return null;
}
