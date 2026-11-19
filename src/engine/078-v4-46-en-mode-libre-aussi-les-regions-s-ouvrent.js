/* Section d'origine : v4.46 : en Mode Libre aussi, les régions s’ouvrent dans l’ordre */

import { SCEN } from './009-03-pokemon.js';
import { PROFILE } from './011-05-etat-de-partie.js';
import { johtoOuvert } from './054-v4-15-01-johto.js';
import { hoennOuvert } from './059-v4-19-01-hoenn.js';

const JLEG446 = ['raikou', 'entei', 'suicune', 'lugia', 'hooh'];


function region446(k) {
  const D = SCEN[k];
  if (!D) return null;
  if (D.hoenn != null || D.hfinal || k === 'rv6' || k === 'hd429' || /^h[lc][a-z]/.test(k)) return 'hoenn';
  if (D.johto != null || D.jfinal || D.lac || D.jdis || D.roam || k === 'rv5' || JLEG446.some(id => k === 'lg' + id || k === 'lc' + id)) return 'johto';
  return null;
}


/* Kanto d’abord. Johto s’ouvre après la victoire sur la Championne de Kanto (Auriane Vale),
   Hoenn après le titre de Maître de Johto — comme en Campagne. Dans une région ouverte,
   le Mode Libre garde tous ses combats ouverts (pas d’ordre des badges). Appelé par scenLock(). */
export function lockRegion446(k) {
  const r = region446(k);
  if (r === 'johto' && !johtoOuvert()) return 'Johto s’ouvre après votre victoire sur la Championne Auriane Vale (Kanto).';
  if (r === 'hoenn' && !hoennOuvert()) return PROFILE.elite >= 5 ? 'Hoenn s’ouvre après votre titre de Maître de Johto.' : 'Hoenn s’ouvre après Kanto puis Johto : battez d’abord la Championne Auriane Vale.';
  return null;
}
