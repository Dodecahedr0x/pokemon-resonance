import { makeStore } from '../../lib/store.js';

// Le moteur appelle buildMap() au démarrage (gabarit de la page), puis renderMap() /
// renderMapInfo() : la page Carte est reconstruite. Le moteur la relit juste après
// (centerMap, scrollIntoView, flèches).
// - built : le gabarit existe (cartes dessinées, emplacement de la Route 29) ;
// - drawn : renderMap() a tourné au moins une fois (tracés, marqueurs, panneaux…) ;
// - marksSel : le lieu choisi au moment où les marqueurs ont été dessinés (avant le choix par défaut).
const worldMap = makeStore({ version: 0, built: false, drawn: false, marksSel: null });
const redraw = patch => worldMap.set(s => ({ ...patch, version: s.version + 1 }));

export function builtMap() {
  redraw({ built: true });
}

export function refreshMap(o) {
  if (!worldMap.get().built) return;
  redraw(o ? { drawn: true, marksSel: o.marksSel } : {});
}

export const useMap = worldMap.use;
