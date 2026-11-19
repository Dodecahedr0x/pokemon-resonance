import { useSyncExternalStore } from 'react';
import { flushSync } from 'react-dom';

// The engine keeps its state and notifies React when a block needs to be redrawn.
// All the screens' stores go through these three building blocks.

// Subscription channel. emit() immediately redraws subscribers (flushSync), like the old
// innerHTML: the engine rereads the DOM right after (focus, .hidden, measurements). If the call comes
// from a React render in progress, flushSync refuses: subscribers are then notified without waiting.
export function channel() {
  const listeners = new Set();
  const notify = () => listeners.forEach(l => l());
  const subscribe = l => (listeners.add(l), () => listeners.delete(l));
  const emit = () => {
    try {
      flushSync(notify);
    } catch {
      notify();
    }
  };
  // use(readValue): value reread on each emit; the component is only redrawn if it changes.
  const use = readValue => useSyncExternalStore(subscribe, readValue);
  return { emit, use, notify };
}

// Version counter: [refresh, useVersion]. refresh() makes the block redraw, which then rereads
// the engine's state. Version 0: the engine has not drawn anything yet.
export function version() {
  let v = 0;
  const c = channel();
  return [
    () => {
      v++;
      c.emit();
    },
    () => c.use(() => v),
  ];
}

// State object: set(patch) merges and notifies subscribers.
// sync = false: notification deferred by a microtask, safe even if the call comes
// from a React render in progress (no setState during another component's render).
export function makeStore(initial, { sync = true } = {}) {
  let state = initial;
  let queued = false;
  const c = channel();
  const get = () => state;
  const set = patch => {
    state = { ...state, ...(typeof patch === 'function' ? patch(state) : patch) };
    if (sync) return c.emit();
    if (queued) return;
    queued = true;
    queueMicrotask(() => {
      queued = false;
      c.notify();
    });
  };
  // use(): the whole state; use(readValue): a part (the block only follows that one).
  const use = (readValue = get) => c.use(() => readValue(state));
  return { get, set, use };
}
