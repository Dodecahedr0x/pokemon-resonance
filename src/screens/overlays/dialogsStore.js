import { channel } from '../../lib/store.js';

// Windows and effect layers that the engine used to create on <body> (#tdrBox, #ctBox, #storyScene,
// #pk-badge…). Each window has a state: null (empty) or the data of its last render,
// with `v` incremented on every call. The content is rendered with key={v}: like the old
// innerHTML, every render restarts from zero (the engine's additions inside it, text typed letter
// by letter, shiny image, disappear with it).
// Synchronous rendering (flushSync): right after the call, the engine re-reads the DOM
// (focus, querySelector, hidden).
let state = {};
const { emit, use } = channel();

// Redraws the `nom` window with this data.
export function paintOverlay(displayName, data = {}) {
  state = { ...state, [displayName]: { ...data, v: ((state[displayName] && state[displayName].v) || 0) + 1 } };
  emit();
}

// Empties the `nom` window (formerly innerHTML = '').
export function clearOverlay(displayName) {
  if (!state[displayName]) {
    return;
  }
  state = { ...state, [displayName]: null };
  emit();
}

export const useOverlay = displayName => use(() => state[displayName] || null);
