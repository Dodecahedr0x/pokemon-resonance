/* =====================================================================
   Johto profile (added in v4.16): the saved state of the Johto story,
   the roaming beasts, the Daycare, the Dominant Pokémon and the friend
   challenges (defaults and sanitizer, called by state/game-state.js).
   ===================================================================== */
import { MOVES } from '../data/moves.js';
import { POKEMON } from '../pokemon/pokemon.js';
import { sanitizeFriend } from '../modes/friend-challenges.js';

/* ---------- profile (declared functions: called as soon as the file loads) ---------- */
export function LIVING_JOHTO_0() {
  return { jdis: 0, roam: {}, inherited: {}, pair: [], tid: '', friends: [], jour: null, dom: 0, oeufs: 0 };
}

export function livingJohtoClean(p) {
  const o = LIVING_JOHTO_0();
  if (!p || typeof p !== 'object') {
    return o;
  }
  if (Number.isFinite(p.jdis)) {
    o.jdis = Math.max(0, Math.min(4, Math.floor(p.jdis)));
  }
  if (p.roam && typeof p.roam === 'object') {
    ['raikou', 'entei', 'suicune'].forEach(id => {
      const r = p.roam[id];
      if (!r || typeof r !== 'object') {
        return;
      }
      o.roam[id] = {
        at: typeof r.at === 'string' && /^j[a-z0-9]{1,6}$/.test(r.at) ? r.at : 'j1',
        hp: Number.isFinite(r.hp) ? Math.max(0.05, Math.min(1, r.hp)) : 1,
        ok: r.ok ? 1 : 0,
        seenFlags: Number.isFinite(r.seenFlags) ? Math.max(0, Math.min(999, Math.floor(r.seenFlags))) : 0,
      };
    });
  }
  if (p.inherited && typeof p.inherited === 'object') {
    for (const b in p.inherited) {
      if (POKEMON[b] && MOVES[p.inherited[b]]) {
        o.inherited[b] = p.inherited[b];
      }
    }
  }
  if (Array.isArray(p.pair)) {
    o.pair = [...new Set(p.pair.filter(id => POKEMON[id]))].slice(0, 2);
  }
  if (typeof p.tid === 'string' && /^[a-z0-9]{6,12}$/.test(p.tid)) {
    o.tid = p.tid;
  }
  if (Array.isArray(p.friends)) {
    o.friends = p.friends.map(sanitizeFriend).filter(Boolean).slice(0, 12);
  }
  if (p.jour && typeof p.jour.d === 'string' && /^\d{4}-\d\d-\d\d$/.test(p.jour.d)) {
    o.jour = {
      d: p.jour.d,
      r: ['S', 'A', 'B'].includes(p.jour.r) ? p.jour.r : '',
      m: Number.isFinite(p.jour.m) ? Math.max(0, Math.min(99, Math.floor(p.jour.m))) : 0,
    };
  }
  if (Number.isFinite(p.dom)) {
    o.dom = Math.max(0, Math.min(9999, Math.floor(p.dom)));
  }
  if (Number.isFinite(p.oeufs)) {
    o.oeufs = Math.max(0, Math.min(9999, Math.floor(p.oeufs)));
  }
  return o;
}
