import { version } from '../../../lib/store.js';

// Le moteur appelle renderSelection() (via renderPrep) pour redessiner la sélection des
// combats, et renderResume() pour la carte « Combat en cours ». Version 0 : le moteur
// n'a encore rien dessiné, le bloc garde le gabarit de départ.
export const [refreshPrep, usePrepVersion] = version();
export const [refreshSummary, useResumeVersion] = version();
