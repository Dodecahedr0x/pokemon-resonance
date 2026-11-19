import { analyze } from '../../engine/020-team-cards.js';

// analyze() du moteur, calculé une fois par renderTeam (#dock, #sideTeam, #tbTeam, #ana le lisent).
let vu = -1,
  A = null;
export function analysis(v) {
  if (v !== vu) {
    A = analyze();
    vu = v;
  }
  return A;
}
