import { useState } from 'react';

const sameKeys = (a, b) => a.length === b.length && a.every((x, i) => Object.is(x, b[i]));

/**
 * Computes a value from mutable engine state and keeps it until one of `keys` changes.
 * Unlike useMemo, the keys are explicit version counters rather than the values read by
 * `compute`, which live in engine modules React cannot track.
 */
export function useKeyed(compute, keys) {
  const [entry, setEntry] = useState(() => ({ keys, value: compute() }));
  if (sameKeys(entry.keys, keys)) return entry.value;
  const value = compute();
  setEntry({ keys, value });
  return value;
}
