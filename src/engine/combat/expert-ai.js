import { affected, hdist, mvType, typeEffectiveness, unitAt } from './engine.js';
import { notesOf } from './resonance.js';

/* Expert difficulty: opponents coordinate, finish off the most damaged, chain effective types, protect their leader
   (added in v4.29). */

export function expertCoordination(S, e, m, k, pos, sim) {
  let b = 0;
  const typ = mvType(S, sim, m);
  for (const x of affected(S, sim, m, k)) {
    const v = unitAt(S, x);
    if (!v || v.side !== 'a' || v.ko) {
      continue;
    }
    b += (1 - v.hp / v.mhp) * 20; // finish off the most damaged one
    if (typeEffectiveness(typ, v.t) > 1) {
      b += 10;
    } // chain effective types
    if (notesOf(S, v) > 0) {
      b += 6;
    } // take advantage of hits already landed this round
  }
  if (!e.boss) {
    const leader = S.units.find(o => o.side === 'e' && !o.ko && o.boss && o !== e);
    if (leader && leader.hp < leader.mhp * 0.7 && hdist(pos, leader.pos) === 1) {
      b += 12;
    } // protect the leader
  }
  return b;
}
