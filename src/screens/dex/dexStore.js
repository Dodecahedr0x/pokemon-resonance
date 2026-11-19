import { version } from '../../lib/store.js';

// The engine calls renderDex / renderDexCard / renderDexList (and the claiming of a
// mission): the "Pokédex" page (#dex) is redrawn from the engine's state
// (V4.dexSel, V4.dexQ…). The engine rereads the page right after (#dex4Card, shiny images…).
export const [refreshDex, useDexVersion] = version();
