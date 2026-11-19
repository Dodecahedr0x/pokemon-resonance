import { makeStore, version } from '../../lib/store.js';

// Le moteur appelle renderHome() (et les anciens rendus partiels : compagnon, bannières,
// carte de dresseur, objectif de la barre latérale…) : l'Accueil React est redessiné avec
// l'état du moteur.
export const [refreshAccueil, useAccueilVersion] = version();

// Route (#route) : état poussé par le moteur (moment de la journée, saison, bandeau des
// rencontres rares, nom de la route). Rendu dès le départ : le moteur y branche ses écouteurs.
const route = makeStore({ tod: 'jour', pressed: false, saison: null, sign: 'Route 29', rr: null });

export const setRoute = route.set;
export const useRoute = route.use;
