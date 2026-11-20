import { STATE_N } from '../engine/world/map.js';

// state class of a place, from placeState(): also used by the Map's markers
export const STATE_CLASS = { next: 'is-next', open: 'is-open', done: 'is-done', lock: 'is-locked' };

// Small rounded label giving a place's or quest's state (src/styles/components/state-pill.css).
// state: 'next' | 'open' | 'done' | 'lock'; children replace the default label (STATE_N).
export default function StatePill({ state, children }) {
  return <em className={`state-pill ${STATE_CLASS[state]}`}>{children ?? STATE_N[state]}</em>;
}
