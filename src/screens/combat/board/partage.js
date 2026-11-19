import { L } from '../../../engine/024-17-interface-combat.js';

// Partagé par les calques du plateau (Terrain, Calques, Units, Board).

export const PE = { pointerEvents: 'none' };

// références gardées par le moteur (L.tiles, L.t[k]…) : fonctions stables, pas de détachement inutile
const refs = {};
export const lref = name => refs[name] || (refs[name] = n => (L[name] = n));
