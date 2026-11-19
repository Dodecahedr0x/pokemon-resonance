import { makeStore } from '../../lib/store.js';

// Small shell overlays. The engine keeps its functions (toast, openStarter,
// renderCoach, encounter, showIntro, tips429) and goes through these stores.

/* ---------- toast ----------
   toast() is called from everywhere, sometimes while another component is rendering:
   the store doesn't use flushSync, the notification goes out in a microtask (nothing
   re-reads #toast right after). Disappears after 2.8 s, like the old engine. */
const toastS = makeStore({ msg: '', on: false }, { sync: false });
export const useToast = toastS.use;
let toastT = 0;
export function showToast(msg) {
  toastS.set({ msg: String(msg), on: true });
  clearTimeout(toastT);
  toastT = setTimeout(() => toastS.set({ on: false }), 2800);
}

/* ---------- tutorial coach (#coach) ----------
   step: the displayed instruction; stays in the DOM when the coach hides (old innerHTML).
   k: data-k (displayed step), absent before the first render. v: a new block at each step. */
const coachS = makeStore({ hidden: true, k: undefined, step: null, v: 0 });
export const useCoach = coachS.use;
export const getCoach = coachS.get;
export function showCoach(k, step) {
  coachS.set(s => ({ hidden: false, k, step, v: s.v + 1 }));
}
export function hideCoach() {
  const s = coachS.get();
  if (!s.hidden || s.k !== '') {
    coachS.set({ hidden: true, k: '' });
  }
}

/* ---------- partner choice (#starter) ---------- */
const starterS = makeStore({ open: false, v: 0 });
export const useStarter = starterS.use;
export function openStarterBox() {
  starterS.set(s => ({ open: true, v: s.v + 1 }));
}
export function refreshStarter() {
  starterS.set(s => ({ v: s.v + 1 }));
}
export function hideStarter() {
  starterS.set({ open: false });
}

/* ---------- wild encounter (#enc) ---------- */
const encS = makeStore({ open: false, v: 0, snap: null });
export const useEnc = encS.use;
export function showEnc(snap) {
  encS.set(s => ({ open: true, snap, v: s.v + 1 }));
}
export function hideEnc() {
  if (encS.get().open) {
    encS.set({ open: false });
  }
}

/* ---------- the Professor's welcome (#intro) ----------
   v: each renderIntro() rebuilds the card (new block, like the old innerHTML:
   the letter-by-letter text from v4.73 replaces the dialog box's text nodes). */
const introS = makeStore({ open: false, v: 0 });
export const useIntro = introS.use;
export function openIntro() {
  introS.set(s => ({ open: true, v: s.v + 1 }));
}
export function refreshIntro() {
  introS.set(s => ({ v: s.v + 1 }));
}
export function closeIntroBox() {
  if (introS.get().open) {
    introS.set({ open: false });
  }
}

/* ---------- Prof. Sorbier's tip in battle (#tip429) ---------- */
const tipS = makeStore({ tip: null, v: 0 });
export const useTip429 = tipS.use;
export function showTip429(t, d) {
  tipS.set(s => ({ tip: { t, d }, v: s.v + 1 }));
}
export function hideTip429() {
  if (tipS.get().tip) {
    tipS.set({ tip: null });
  }
}
