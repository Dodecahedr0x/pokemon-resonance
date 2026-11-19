import { channel } from '../../lib/store.js';

// Transient windows that the engine used to add at the end of <body> (old overlay(): #vs,
// #battleHelp, #eventChoice, #timedCatch…). List in opening order: {id, data, v}.
// Reopening an id removes it then appends it at the end, with a new `v` (rendered with key={id+v}:
// fresh node, like the old remove() + appendChild).
// Synchronous render (flushSync): right after, the engine rereads the DOM ($('#battleHelp'), focus,
// querySelector) and attaches its listeners there.
let listItems = [];
let n = 0;
const { emit, use } = channel();

// Opens (or reopens) window `id`; returns its node.
export function openOverlay(id, data = {}) {
  listItems = listItems.filter(x => x.id !== id).concat({ id, data, v: ++n });
  emit();
  return document.getElementById(id);
}

// Updates the data of the open window `id` (without recreating the node).
export function updateTemp(id, patch) {
  if (!listItems.some(x => x.id === id)) {
    return;
  }
  listItems = listItems.map(x => (x.id === id ? { ...x, data: { ...x.data, ...patch } } : x));
  emit();
}

// Closes window `id` (old `.remove()`). With a node: only if it is still
// displayed (a window reopened since has a new node).
export function shut(target) {
  const id = typeof target === 'string' ? target : target && target.isConnected ? target.id : null;
  if (!id || !listItems.some(x => x.id === id)) {
    return;
  }
  listItems = listItems.filter(x => x.id !== id);
  emit();
}

export const useTemporaries = () => use(() => listItems);
