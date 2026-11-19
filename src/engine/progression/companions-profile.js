/* =====================================================================
   Companions profile (added in v4.17): the saved state of the companion
   Pokémon, the story scenes, the Camp Garden and the friends tournament
   (defaults and sanitizer, called by state/game-state.js).
   ===================================================================== */
import { BY } from '../pokemon/pokemon.js';
import { POTAGER } from './camp-garden.js';

/* ---------- profile (declared functions: called as soon as the file loads) ---------- */
export function COMPANIONS_0() {
  return {
    comp: { id: '', aff: 0, j: '' },
    scenes: {},
    garden: [null, null, null],
    watered: '',
    tournoi: { run: null, best: 0, winCount: 0 },
  };
}

export function companionGardenClean(p) {
  const o = COMPANIONS_0();
  if (!p || typeof p !== 'object') {
    return o;
  }
  const c = p.comp;
  if (c && typeof c === 'object') {
    if (BY[c.id]) {
      o.comp.id = c.id;
    }
    if (Number.isFinite(c.aff)) {
      o.comp.aff = Math.max(0, Math.min(255, Math.floor(c.aff)));
    }
    if (typeof c.j === 'string' && /^\d{4}-\d\d-\d\d$/.test(c.j)) {
      o.comp.j = c.j;
    }
  }
  if (p.scenes && typeof p.scenes === 'object') {
    for (const k in p.scenes) {
      if (/^[a-z0-9]{1,12}$/.test(k) && p.scenes[k]) {
        o.scenes[k] = 1;
      }
    }
  }
  if (Array.isArray(p.garden)) {
    o.garden = [0, 1, 2].map(i => {
      const x = p.garden[i];
      return x && POTAGER[x.g] && Number.isFinite(x.fin) ? { g: x.g, fin: Math.max(0, Math.floor(x.fin)) } : null;
    });
  }
  if (typeof p.watered === 'string' && /^\d{4}-\d\d-\d\d$/.test(p.watered)) {
    o.watered = p.watered;
  }
  const t = p.tournoi;
  if (t && typeof t === 'object') {
    if (Number.isFinite(t.best)) {
      o.tournoi.best = Math.max(0, Math.min(12, Math.floor(t.best)));
    }
    if (Number.isFinite(t.winCount)) {
      o.tournoi.winCount = Math.max(0, Math.min(999, Math.floor(t.winCount)));
    }
    const r = t.run;
    if (r && Array.isArray(r.order) && Array.isArray(r.team) && Number.isFinite(r.i)) {
      const team = r.team.filter(id => BY[id]).slice(0, 4),
        ordering = r.order.filter(id => typeof id === 'string' && /^[a-z0-9]{6,12}$/.test(id)).slice(0, 5);
      if (team.length && ordering.length && r.i >= 0 && r.i < ordering.length) {
        const hp = {};
        if (r.hp && typeof r.hp === 'object') {
          for (const k in r.hp) {
            if (BY[k] && Number.isFinite(r.hp[k])) {
              hp[k] = Math.max(0, Math.min(1, r.hp[k]));
            }
          }
        }
        o.tournoi.run = { team, order: ordering, i: Math.floor(r.i), hp };
      }
    }
  }
  return o;
}
