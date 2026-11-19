import { channel } from '../../../lib/store.js';

// Battle interface around the board. Each part has its own version: the engine increments it
// where it used to rewrite the old innerHTML, and the part is rebuilt from B and ui.
//   top    : banner, synergies, arena rule, timeline, plates (renderTop)
//   foot   : phase and end-of-turn button (renderTop, then end of renderAll)
//   fast   : "×2" button (quick428)
//   panel  : command panel (renderPanel)
//   log    : log (renderLog)
//   evo    : evolution choice (openEvoPick)
//   result : end-of-battle sheet (finish)
//   ti444  : cell sheet (v4.44, sheet444 and place444)
const versions = { top: 0, foot: 0, fast: 0, panel: 0, log: 0, evo: 0, result: 0, ti444: 0 };
const chan = channel();

export function refreshBattle(...parts) {
  parts.forEach(k => versions[k]++);
  chan.emit();
}

export const useBattleVersion = k => chan.use(() => versions[k]);

// Evolution choice open: the Pokémon that is evolving.
export const evoState = { u: null };

// Bottom bar (.bt-foot): classes in the order classList placed them (qa-on v4.43, f444 v4.44),
// thumb-reach attacks (#qa443 and .qa443-n, v4.43): null until the bar has been used.
//   qa : { hidden, displayName, items: [{ t, c, col, on, disabled }] }
export const footPos = { cls: ['bt-foot'], qa: null };

/** classList.toggle on the bottom bar; true if the class changed (to be followed by refreshBattle('foot')). */
export function footCls(displayName, on) {
  const a = footPos.cls.includes(displayName);
  if (on === a) return false;
  footPos.cls = on ? [...footPos.cls, displayName] : footPos.cls.filter(c => c !== displayName);
  return true;
}

// Cell sheet (#ti444, v4.44): created on first opening, then hidden.
export const sheet444 = { made: false, hidden: true, k: null, haut: false, top: undefined, bottom: undefined };
