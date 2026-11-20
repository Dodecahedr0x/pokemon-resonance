import { channel } from '../../lib/store.js';

// Two versions, like the two old innerHTML:
// - `page`: renderCampPage() (sub-tabs, open tab) rebuilds the whole page;
// - `base`: renderCampBase() rebuilds only the « Camp de base » (Base camp) panel (#v4Camp).
let page = 0,
  base = 0;
const { emit, use } = channel();

export function refreshCampPage() {
  page++;
  emit();
}

export function refreshCampBase() {
  base++;
  emit();
}

export const useCampPage = () => use(() => page);
export const useCampBase = () => use(() => base);
