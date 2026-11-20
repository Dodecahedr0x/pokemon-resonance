import { analyze } from '../../engine/team/team.js';

// the engine's analyze(), computed once per renderTeam (#dock and #ana read it).
let vu = -1,
  A = null;
export function analysis(v) {
  if (v !== vu) {
    A = analyze();
    vu = v;
  }
  return A;
}
