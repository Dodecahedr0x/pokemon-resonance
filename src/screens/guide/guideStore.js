import { channel } from '../../lib/store.js';

// Guide state, shared between React (<Guide>) and the engine (setGuide, openRx, jump…).
// The engine no longer writes into the Guide's DOM: it goes through these functions.

export const GUIDE_TABS = ['tuto433', 'debuter', 'bases', 'reactions', 'tactique', 'ligue', 'univers', 'projet'];
const STORE_KEY = 'res-gtab';

function initialTab() {
  try {
    const k = localStorage.getItem(STORE_KEY);
    if (k) {
      return k;
    }
  } catch {
    /* Best effort: failure here is non-fatal. */
  }
  return 'bases';
}

let state = {
  tab: initialTab(),
  rx: { m: 'trempe', e: 1 }, // selected cell in the reactions matrix
  openRules: new Set(['S-08']), // expanded rules
  focusRule: null, // { code, n }: rule to scroll into view
  shown: 0, // incremented on every display of the Guide screen: re-reads the game state
};
const { notify, use } = channel();
const emit = patch => {
  state = { ...state, ...patch };
  notify();
};

export const getGuide = () => state;
export const useGuide = () => use(getGuide);

export function setGuideTab(k) {
  if (!GUIDE_TABS.includes(k)) {
    k = 'bases';
  }
  try {
    localStorage.setItem(STORE_KEY, k);
  } catch {
    /* Best effort: failure here is non-fatal. */
  }
  emit({ tab: k });
}

export function selectReaction(m, e) {
  emit({ rx: { m, e } });
}

let focusSeq = 0;
export function openRule(code) {
  emit({ openRules: new Set(state.openRules).add(code), focusRule: { code, n: ++focusSeq } });
}

export function setRuleOpen(code, open) {
  if (state.openRules.has(code) === open) {
    return;
  }
  const s = new Set(state.openRules);
  open ? s.add(code) : s.delete(code);
  emit({ openRules: s });
}

export function guideShown() {
  emit({ shown: state.shown + 1 });
}
