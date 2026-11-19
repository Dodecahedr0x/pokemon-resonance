import { version } from '../../lib/store.js';

// Le moteur appelle renderLigue() (choix d'un badge, victoire, chargement) : la page
// Ligue est reconstruite avec la progression à jour.
export const [refreshLigue, useLigueVersion] = version();
