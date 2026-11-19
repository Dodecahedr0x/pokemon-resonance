import { makeStore } from '../../lib/store.js';

// State of the "Saves" window, shared between React (<Saves>) and the engine
// (openSaves, closeSaves, renderSaves). The engine no longer writes into #saves; it re-reads the
// DOM right after each call ($('#svCode').focus(), $('#saves').hidden…).
const saves = makeStore({ open: false, version: 0 });

export const useSaves = saves.use;

// Opens the window, content re-read from the engine's state.
export function showSaves() {
  saves.set(s => ({ open: true, version: s.version + 1 }));
}

export function hideSaves() {
  if (saves.get().open) {
    saves.set({ open: false });
  }
}

// Redraws the card (engine state changed).
export function refreshSaves() {
  saves.set(s => ({ version: s.version + 1 }));
}
