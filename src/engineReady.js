import { useSyncExternalStore } from 'react';

// The engine's data (lists, tables, game state) only exists after it has started:
// the React screens wait for this signal before reading it.
let ready = false;
const listeners = new Set();

export function setEngineReady() {
  ready = true;
  listeners.forEach(l => l());
}

const subscribe = l => (listeners.add(l), () => listeners.delete(l));

export function useEngineReady() {
  return useSyncExternalStore(subscribe, () => ready);
}
