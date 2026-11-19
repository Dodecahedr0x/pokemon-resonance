import { makeStore } from '../lib/store.js';

// État du shell poussé par le moteur : page affichée (show), titre de la barre du haut,
// menu du téléphone, voyant de sauvegarde, porte-monnaie et dresseur (renderWallet).
// Rendu synchrone : le moteur relit la barre de navigation et le menu juste après
// (calibre434 mesure .bnav, menu() met le focus sur le premier lien).
const shell = makeStore({
  page: null, // aucune page marquée avant le premier show()
  sec: 'Accueil',
  menu: false,
  svBusy: false,
  svCloud: false,
  wallet: 0, // 0 : porte-monnaie pas encore dessiné par le moteur
});

export const useShell = shell.use;

export function setShellPage(page, sec) {
  shell.set({ page, sec });
}

export function setMenuOpen(menu) {
  shell.set({ menu });
}

export function setSaveIndicator(svBusy, svCloud) {
  const s = shell.get();
  if (s.svBusy !== svBusy || s.svCloud !== svCloud) shell.set({ svBusy, svCloud });
}

export function refreshWallet() {
  shell.set(s => ({ wallet: s.wallet + 1 }));
}
