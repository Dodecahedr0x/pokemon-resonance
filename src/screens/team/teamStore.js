import { makeStore } from '../../lib/store.js';

// Display state of the Team screen, shared between React and the engine (020-team-cards.js).
// One version per block: grid (renderGrid), filters (renderFilters), team and analysis
// (renderTeam), sheet (openSheet / closeSheet). The engine re-reads the DOM right after each
// call ($('#teamName').focus(), $('#sheet').hidden, .sh-x...).
const team = makeStore({ grid: 0, filters: 0, team: 0, sheet: 0, open: false, id: null });

export const useRoster = team.use;
// Subscription to a single key: the block only redraws for its version.
export const useRosterKey = k => team.use(s => s[k]);

export const refreshGrid = () => team.set(s => ({ grid: s.grid + 1 }));
export const refreshFilters = () => team.set(s => ({ filters: s.filters + 1 }));
export const refreshTeam = () => team.set(s => ({ team: s.team + 1 }));

// Sheet: opened on a Pokémon (content re-read from the engine).
export const showSheet = id => team.set(s => ({ open: true, id, sheet: s.sheet + 1 }));
export const hideSheet = () => team.set({ open: false });
