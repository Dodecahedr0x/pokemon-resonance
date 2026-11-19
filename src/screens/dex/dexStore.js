import { version } from '../../lib/store.js';

// Le moteur appelle renderDex / renderDexCard / renderDexList (et la réclamation d'une
// mission) : la page « Pokédex » (#dex) est redessinée depuis l'état du moteur
// (V4.dexSel, V4.dexQ…). Le moteur relit la page juste après (#dex4Card, images chromatiques…).
export const [refreshDex, useDexVersion] = version();
