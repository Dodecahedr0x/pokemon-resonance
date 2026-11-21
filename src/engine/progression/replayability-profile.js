/* Profile section of achievements, titles and campaign challenges: defaults and save cleanup (added in v4.9). */

import { TYPES } from '../data/game-data.js';
import { POKEMON } from '../pokemon/pokemon.js';

/* declared functions: called as soon as the game loads */
export function REPLAY0() {
  return {
    achievements: {},
    titre: '',
    totals: {},
    challenges: { mono: '', trio: false, sansEveil: false, nuzlocke: false },
    graves: [],
  };
}

export function replayClean(p) {
  const o = REPLAY0();
  if (!p || typeof p !== 'object') {
    return o;
  }
  if (p.achievements && typeof p.achievements === 'object') {
    for (const k in p.achievements) {
      if (/^[a-z0-9]{2,16}$/.test(k) && Number.isFinite(p.achievements[k])) {
        o.achievements[k] = p.achievements[k];
      }
    }
  }
  if (typeof p.titre === 'string' && o.achievements[p.titre]) {
    o.titre = p.titre;
  }
  if (p.totals && typeof p.totals === 'object') {
    for (const k in p.totals) {
      if (/^[a-z]{2,12}$/.test(k) && Number.isFinite(p.totals[k])) {
        o.totals[k] = Math.max(0, Math.floor(p.totals[k]));
      }
    }
  }
  const d = p.challenges;
  if (d && typeof d === 'object') {
    if (typeof d.mono === 'string' && TYPES[d.mono]) {
      o.challenges.mono = d.mono;
    }
    ['trio', 'sansEveil', 'nuzlocke'].forEach(k => (o.challenges[k] = !!d[k]));
  }
  if (Array.isArray(p.graves)) {
    o.graves = [...new Set(p.graves.filter(id => POKEMON[id] && POKEMON[id].base === id))];
  }
  return o;
}
