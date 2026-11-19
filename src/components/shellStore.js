import { makeStore } from '../lib/store.js';

// Shell state pushed by the engine: displayed page (show), top bar title,
// phone menu, save indicator, wallet and trainer (renderWallet).
// Synchronous render: the engine re-reads the navigation bar and the menu right after
// (gauge434 measures .bnav, menu() focuses the first link).
const shell = makeStore({
  page: null, // no page marked before the first show()
  sec: 'Accueil',
  menu: false,
  saveBusy: false,
  saveCloud: false,
  wallet: 0, // 0: wallet not yet drawn by the engine
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
  if (s.saveBusy !== svBusy || s.saveCloud !== svCloud) shell.set({ saveBusy: svBusy, saveCloud: svCloud });
}

export function refreshWallet() {
  shell.set(s => ({ wallet: s.wallet + 1 }));
}
