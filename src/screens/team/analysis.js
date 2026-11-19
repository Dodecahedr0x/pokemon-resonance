import { analyze } from '../../engine/020-team-cards.js';

// the engine's analyze(), computed once per renderTeam (#dock, #sideTeam, #tbTeam, #ana read it).
let vu = -1,
  A = null;
export function analysis(v) {
  if (v !== vu) {
    A = analyze();
    vu = v;
  }
  return A;
}
