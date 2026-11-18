/* Section d'origine : v4.46 : en Mode Libre aussi, les régions s’ouvrent dans l’ordre */

import { SCEN } from './009-03-pokemon.js';
import { PROFILE, isCamp } from './011-05-etat-de-partie.js';
import { __set_scenLock, scenLock } from './022-15-systemes-objets-liens-ia.js';
import { johtoOuvert } from './054-v4-15-01-johto.js';
import { NEWS416 } from './056-v4-16-1-01-finitions.js';
import { hoennOuvert } from './059-v4-19-01-hoenn.js';

let JLEG446, scenLockOld446;


function region446(k) {
  const D = SCEN[k];
  if (!D) return null;
  if (D.hoenn != null || D.hfinal || k === 'rv6' || k === 'hd429' || /^h[lc][a-z]/.test(k)) return 'hoenn';
  if (D.johto != null || D.jfinal || D.lac || D.jdis || D.roam || k === 'rv5' || JLEG446.some(id => k === 'lg' + id || k === 'lc' + id)) return 'johto';
  return null;
}

// Instructions exécutées au démarrage, dans l'ordre d'origine (voir index.js).
export function __init() {

/* Kanto d’abord. Johto s’ouvre après la victoire sur la Championne de Kanto (Auriane Vale),
   Hoenn après le titre de Maître de Johto — comme en Campagne. Dans une région ouverte,
   le Mode Libre garde tous ses combats ouverts (pas d’ordre des badges). */
JLEG446 = ['raikou', 'entei', 'suicune', 'lugia', 'hooh'];


scenLockOld446 = scenLock;


__set_scenLock(function (k) {
  const l = scenLockOld446(k);
  if (l || isCamp()) return l;
  const r = region446(k);
  if (r === 'johto' && !johtoOuvert()) return 'Johto s’ouvre après votre victoire sur la Championne Auriane Vale (Kanto).';
  if (r === 'hoenn' && !hoennOuvert()) return PROFILE.elite >= 5 ? 'Hoenn s’ouvre après votre titre de Maître de Johto.' : 'Hoenn s’ouvre après Kanto puis Johto : battez d’abord la Championne Auriane Vale.';
  return null;
});


NEWS416.unshift(['i-map', 'Régions dans l’ordre', 'En Mode Libre aussi : Johto s’ouvre après la Championne de Kanto, Hoenn après le titre de Maître de Johto. Dans une région ouverte, tous ses combats restent libres.', null]);


NEWS416.splice(8);


NEWS416.unshift(['i-star', 'Une musique par onglet', 'Combats : Cyclisme · Carte : Route 1 · Guide : Laboratoire du Prof. Chen. Le Camp garde la Route 201.', null]);


NEWS416.splice(8);
}
