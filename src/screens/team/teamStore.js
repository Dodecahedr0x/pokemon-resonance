import { makeStore } from '../../lib/store.js';

// État d'affichage de l'écran Équipe, partagé entre React et le moteur (020-13-equipe-cartes.js).
// Une version par bloc : grille (renderGrid), filtres (renderFilters), équipe et analyse
// (renderTeam), fiche (openSheet / closeSheet). Le moteur relit le DOM juste après chaque
// appel ($('#eqNom432').focus(), $('#sheet').hidden, .sh-x…).
const team = makeStore({ grid: 0, filters: 0, team: 0, sheet: 0, open: false, id: null });

export const useRoster = team.use;
// Abonnement à une seule clé : le bloc ne se redessine que pour sa version.
export const useRosterKey = k => team.use(s => s[k]);

export const refreshGrid = () => team.set(s => ({ grid: s.grid + 1 }));
export const refreshFilters = () => team.set(s => ({ filters: s.filters + 1 }));
export const refreshTeam = () => team.set(s => ({ team: s.team + 1 }));

// Fiche : ouverte sur un Pokémon (contenu relu depuis le moteur).
export const showSheet = id => team.set(s => ({ open: true, id, sheet: s.sheet + 1 }));
export const hideSheet = () => team.set({ open: false });
