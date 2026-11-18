import { makeStore } from '../../lib/store.js';

// Petites surcouches du shell. Le moteur garde ses fonctions (toast, openStarter,
// renderCoach, encounter, showIntro, astuces429) et passe par ces stores.

/* ---------- toast ----------
   toast() est appelé de partout, parfois pendant le rendu d'un autre composant :
   le store n'utilise pas flushSync, la notification part en micro-tâche (rien ne
   relit #toast juste après). Disparition après 2,8 s, comme l'ancien moteur. */
const toastS = makeStore({ msg: '', on: false }, { sync: false });
export const useToast = toastS.use;
let toastT = 0;
export function showToast(msg) {
  toastS.set({ msg: String(msg), on: true });
  clearTimeout(toastT);
  toastT = setTimeout(() => toastS.set({ on: false }), 2800);
}

/* ---------- coach du tutoriel (#coach) ----------
   step : la consigne affichée ; reste dans le DOM quand le coach se cache (ancien innerHTML).
   k : data-k (étape affichée), absent avant le premier rendu. v : un nouveau bloc à chaque étape. */
const coachS = makeStore({ hidden: true, k: undefined, step: null, v: 0 });
export const useCoach = coachS.use;
export const getCoach = coachS.get;
export function showCoach(k, step) {
  coachS.set(s => ({ hidden: false, k, step, v: s.v + 1 }));
}
export function hideCoach() {
  const s = coachS.get();
  if (!s.hidden || s.k !== '') coachS.set({ hidden: true, k: '' });
}

/* ---------- choix du partenaire (#starter) ---------- */
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

/* ---------- rencontre sauvage (#enc) ---------- */
const encS = makeStore({ open: false, v: 0, snap: null });
export const useEnc = encS.use;
export function showEnc(snap) {
  encS.set(s => ({ open: true, snap, v: s.v + 1 }));
}
export function hideEnc() {
  if (encS.get().open) encS.set({ open: false });
}

/* ---------- accueil de la Professeure (#intro) ----------
   v : chaque renderIntro() reconstruit la carte (nouveau bloc, comme l'ancien innerHTML :
   le texte lettre par lettre de v4.73 remplace les nœuds texte de la boîte de dialogue). */
const introS = makeStore({ open: false, v: 0 });
export const useIntro = introS.use;
export function openIntro() {
  introS.set(s => ({ open: true, v: s.v + 1 }));
}
export function refreshIntro() {
  introS.set(s => ({ v: s.v + 1 }));
}
export function closeIntroBox() {
  if (introS.get().open) introS.set({ open: false });
}

/* ---------- astuce du Prof. Sorbier en combat (#tip429) ---------- */
const tipS = makeStore({ tip: null, v: 0 });
export const useTip = tipS.use;
export function showTip429(t, d) {
  tipS.set(s => ({ tip: { t, d }, v: s.v + 1 }));
}
export function hideTip429() {
  if (tipS.get().tip) tipS.set({ tip: null });
}
