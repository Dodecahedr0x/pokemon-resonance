import { BOARD_LAYERS } from '../../../engine/combat/ui.js';

// Shared by the board layers (Terrain, Layers, Units, Board).

export const PE = { pointerEvents: 'none' };

// references kept by the engine (L.tiles, L.t[k]…): stable functions, no needless detaching
const refs = {};
export const lref = name => refs[name] || (refs[name] = n => (BOARD_LAYERS[name] = n));
