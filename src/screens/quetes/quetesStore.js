import { version } from '../../lib/store.js';

// Le moteur appelle renderQuests() pour redessiner la page Quêtes (affichage, onglet,
// réclamation…) : la page React est alors reconstruite avec les données à jour.
export const [refreshQuetes, useQuetesVersion] = version();
