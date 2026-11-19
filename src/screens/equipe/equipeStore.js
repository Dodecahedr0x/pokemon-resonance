import { useSyncExternalStore } from 'react';
import { flushSync } from 'react-dom';

// État d'affichage de l'écran Équipe, partagé entre React et le moteur (020-13-equipe-cartes.js).
// Une version par bloc : grille (renderGrid), filtres (renderFilters), équipe et analyse
// (renderTeam), fiche (openSheet / closeSheet). Rendu synchrone (flushSync) : juste après
// l'appel, le moteur relit le DOM comme avec l'ancien innerHTML ($('#eqNom432').focus(),
// $('#sheet').hidden, .sh-x…).

let state = { grid: 0, filters: 0, team: 0, sheet: 0, open: false, id: null };
const listeners = new Set();
const emit = patch => {
  state = { ...state, ...patch };
  try {
    flushSync(() => listeners.forEach(l => l()));
  } catch {
    listeners.forEach(l => l());
  }
};
const subscribe = l => (listeners.add(l), () => listeners.delete(l));
const get = () => state;

export const useEquipe = () => useSyncExternalStore(subscribe, get);
// Abonnement à une seule clé : le bloc ne se redessine que pour sa version.
export const useEquipeKey = k => useSyncExternalStore(subscribe, () => state[k]);

export const refreshGrid = () => emit({ grid: state.grid + 1 });
export const refreshFilters = () => emit({ filters: state.filters + 1 });
export const refreshTeam = () => emit({ team: state.team + 1 });

// Fiche : ouverte sur un Pokémon (contenu relu depuis le moteur).
export const showSheet = id => emit({ open: true, id, sheet: state.sheet + 1 });
export const hideSheet = () => emit({ open: false });
