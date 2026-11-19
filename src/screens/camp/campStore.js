import { channel } from '../../lib/store.js';

// Two versions, like the two old innerHTML:
// - `page`: renderCampPage() (sub-tabs, Outings, open tab) rebuilds the whole page;
// - `base`: renderCampBase() rebuilds only the « Camp de base » (Base camp) panel (#v4Camp).
let page = 0,
  base = 0;
// The Outings (#outingsPanel) are only filled on the first display of the Base tab, then kept.
export let seenExits = false;
const { emit, use } = channel();

export function refreshCampPage(baseTab) {
  if (baseTab) {
    seenExits = true;
  }
  page++;
  emit();
}

export function refreshCampBase() {
  base++;
  emit();
}

export const useCampPage = () => use(() => page);
export const useCampBase = () => use(() => base);
