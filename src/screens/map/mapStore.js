import { makeStore } from '../../lib/store.js';

// The engine calls buildMap() at startup (page template), then renderMap() /
// renderMapInfo(): the Map page is rebuilt. The engine reads it back right after
// (centerMap, scrollIntoView, arrows).
// - built: the template exists (maps drawn, Route 29 slot);
// - drawn: renderMap() has run at least once (paths, markers, panels…);
// - marksSel: the location selected when the markers were drawn (before the default choice).
const worldMap = makeStore({ version: 0, built: false, drawn: false, marksSel: null });
const redraw = patch => worldMap.set(s => ({ ...patch, version: s.version + 1 }));

export function builtMap() {
  redraw({ built: true });
}

export function refreshMap(o) {
  if (!worldMap.get().built) {
    return;
  }
  redraw(o ? { drawn: true, marksSel: o.marksSel } : {});
}

export const useMap = worldMap.use;
