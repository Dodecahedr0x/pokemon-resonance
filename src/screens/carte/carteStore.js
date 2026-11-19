import { makeStore } from '../../lib/store.js';

// Le moteur appelle buildMap() au démarrage (gabarit de la page), puis renderMap() /
// renderMapInfo() : la page Carte est reconstruite. Le moteur la relit juste après
// (centerMap, scrollIntoView, flèches).
// - built : le gabarit existe (cartes dessinées, emplacement de la Route 29) ;
// - drawn : renderMap() a tourné au moins une fois (tracés, marqueurs, panneaux…) ;
// - marksSel : le lieu choisi au moment où les marqueurs ont été dessinés (avant le choix par défaut).
const carte = makeStore({ version: 0, built: false, drawn: false, marksSel: null });
const redessiner = patch => carte.set(s => ({ ...patch, version: s.version + 1 }));

export function carteBatie() {
  redessiner({ built: true });
}

export function refreshCarte(o) {
  if (!carte.get().built) return;
  redessiner(o ? { drawn: true, marksSel: o.marksSel } : {});
}

export const useCarte = carte.use;
