import { makeStore, version } from '../../lib/store.js';

// The engine calls renderHome() (and the old partial renders: companion, banners,
// trainer card, sidebar objective…): the React Home is redrawn with
// the engine's state.
export const [refreshHome, useHomeVersion] = version();

// Route (#route): state pushed by the engine (time of day, season, rare-encounter
// banner, route name). Rendered from the start: the engine attaches its listeners there.
const route = makeStore({ tod: 'jour', pressed: false, saison: null, sign: 'Route 29', rr: null });

export const setRoute = route.set;
export const useRoute = route.use;
