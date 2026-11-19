import { version } from '../../../lib/store.js';

// The engine calls renderSelection() (via renderPrep) to redraw the battle
// selection, and renderSummary() for the « Combat en cours » (Battle in progress) card. Version 0: the engine
// has not drawn anything yet, the block keeps the starting template.
export const [refreshPrep, usePrepVersion] = version();
export const [refreshSummary, useResumeVersion] = version();
