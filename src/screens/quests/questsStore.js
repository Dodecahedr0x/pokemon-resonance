import { version } from '../../lib/store.js';

// The engine calls renderQuests() to redraw the Quests page (display, tab,
// claim…): the React page is then rebuilt with up-to-date data.
export const [refreshQuests, useQuestsVersion] = version();
