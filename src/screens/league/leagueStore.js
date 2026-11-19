import { version } from '../../lib/store.js';

// The engine calls renderLeague() (badge choice, victory, loading): the League
// page is rebuilt with up-to-date progress.
export const [refreshLeague, useLeagueVersion] = version();
