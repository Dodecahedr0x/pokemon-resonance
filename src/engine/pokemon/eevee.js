/* Eevee: at Awakening, its 5 evolutions are offered; the one in harmony with its cell mark or the time of day keeps 1 diamond (added in v4.34). */

import { EEVEE } from './pokemon.js';
import { markOf } from '../core/utils.js';
import { markAt, unitKey } from '../combat/engine.js';
import { hourOf } from '../combat/living-board.js';

/** The Eevee evolutions in harmony with the situation: mark of its cell, time of day. */
export function eeveeHarmony(S, u) {
  const o = [],
    mk = markAt(S, unitKey(u));
  if (mk && EEVEE[mk]) {
    o.push(EEVEE[mk]);
  }
  o.push(EEVEE[hourOf(S)]);
  return o;
}

export function eeveeWhy(S, u, id) {
  if (!eeveeHarmony(S, u).includes(id)) {
    return 'Au choix';
  }
  const k = Object.keys(EEVEE).find(x => EEVEE[x] === id);
  return `En harmonie · ${k === 'jour' ? 'le jour' : k === 'nuit' ? 'la nuit' : 'case ' + markOf(k).n} : garde 1 losange`;
}
