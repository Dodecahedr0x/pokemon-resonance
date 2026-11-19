import { channel } from '../../lib/store.js';

// État du Guide, partagé entre React (<Guide>) et le moteur (setGuide, openRx, jump…).
// Le moteur n'écrit plus dans le DOM du Guide : il passe par ces fonctions.

export const GUIDE_TABS = ['tuto433', 'debuter', 'bases', 'reactions', 'tactique', 'ligue', 'univers', 'projet'];
const STORE_KEY = 'res-gtab';

function initialTab() {
  try {
    const k = localStorage.getItem(STORE_KEY);
    if (k) return k;
  } catch {}
  return 'bases';
}

let state = {
  tab: initialTab(),
  rx: { m: 'trempe', e: 1 }, // case sélectionnée dans la matrice des réactions
  openRules: new Set(['S-08']), // règles dépliées
  focusRule: null, // { code, n } : règle à faire défiler jusqu'à l'écran
  shown: 0, // incrémenté à chaque affichage de l'écran Guide : relit l'état de partie
};
const { notify, use } = channel();
const emit = patch => {
  state = { ...state, ...patch };
  notify();
};

export const getGuide = () => state;
export const useGuide = () => use(getGuide);

export function setGuideTab(k) {
  if (!GUIDE_TABS.includes(k)) k = 'bases';
  try {
    localStorage.setItem(STORE_KEY, k);
  } catch {}
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
  if (state.openRules.has(code) === open) return;
  const s = new Set(state.openRules);
  open ? s.add(code) : s.delete(code);
  emit({ openRules: s });
}

export function guideShown() {
  emit({ shown: state.shown + 1 });
}
