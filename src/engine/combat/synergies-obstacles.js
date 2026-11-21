import { MT } from './turn-core.js';
import { POKEMON } from '../pokemon/pokemon.js';
import { synergiesOf } from '../pokemon/roles-synergies.js';
import {
  cellKey,
  parseCellKey,
  affected,
  byUid,
  damage,
  flies,
  fromCube,
  hexDistance,
  heal,
  landed,
  moveType,
  neighbors,
  reach,
  resolveMove,
  pushMessage,
  toCube,
  unitAt,
  unitKey,
} from './engine.js';
import { ROLE_PROVIDERS } from './tactical-engine.js';

export let currentAction, battleNotes;
export function __set_battleNotes(v) {
  return (battleNotes = v);
}

export function applyObst(S) {
  if (S._obs) {
    return;
  }
  S._obs = 1;
  const O = OBSTACLES[S.sc];
  if (O) {
    (O.pil || []).forEach(k => {
      const t = S.tiles[k];
      if (t && !unitAt(S, k)) {
        t.rock = true;
        t.pil = true;
        t.w = false;
        t.mark = null;
      }
    });
    (O.grass || []).forEach(k => {
      const t = S.tiles[k];
      if (t && !t.rock && !t.w) {
        t.grass = true;
      }
    });
    (O.sand || []).forEach(k => {
      const t = S.tiles[k];
      if (t && !t.rock && !t.w) {
        t.sand = true;
      }
    });
  }
  S.syn = synergiesOf(S.units.filter(u => u.side === 'a').map(u => u.id)).map(s => s.k);
}

/* --- line of sight (pillars) and cover (rocks and pillars) --- */
function cubeRound(x, y, z) {
  let rx = Math.round(x),
    ry = Math.round(y),
    rz = Math.round(z);
  const dx = Math.abs(rx - x),
    dy = Math.abs(ry - y),
    dz = Math.abs(rz - z);
  if (dx > dy && dx > dz) {
    rx = -ry - rz;
  } else if (dy > dz) {
    ry = -rx - rz;
  } else {
    rz = -rx - ry;
  }
  return [rx, ry, rz];
}

function hexLine(a, b, e) {
  const A = toCube(a[0], a[1]),
    C = toCube(b[0], b[1]),
    n = hexDistance(a, b),
    o = [];
  for (let i = 1; i < n; i++) {
    const t = i / n,
      c = cubeRound(A[0] + (C[0] - A[0]) * t + e, A[1] + (C[1] - A[1]) * t + e, A[2] + (C[2] - A[2]) * t - 2 * e),
      p = fromCube(c[0], c[1], c[2]);
    o.push(cellKey(p[0], p[1]));
  }
  return o;
}

export function losBlocked(S, a, b) {
  const f = e => hexLine(a, b, e).some(k => S.tiles[k] && S.tiles[k].pil);
  return f(1e-6) && f(-1e-6);
}

export function coverOf(S, a, b) {
  if (hexDistance(a, b) < 2) {
    return null;
  }
  const d = hexDistance(a, b);
  for (const q of neighbors(b)) {
    const k = cellKey(q[0], q[1]),
      t = S.tiles[k];
    if (t && t.rock && hexDistance(a, q) === d - 1) {
      return k;
    }
  }
  return null;
}

export function ricoTgt(S, u, k) {
  const t = S.tiles[k];
  if (!t || !t.rock || t.pil) {
    return null;
  }
  const R = parseCellKey(k);
  const c = S.units
    .filter(o => !o.ko && o.side !== u.side && hexDistance(o.pos, R) <= 2 && !losBlocked(S, R, o.pos))
    .sort((a, b) => hexDistance(a.pos, R) - hexDistance(b.pos, R) || a.hp - b.hp || (a.uid < b.uid ? -1 : 1));
  return c.length ? unitKey(c[0]) : null;
}

/* --- damage: roles, synergies, cover, ricochet, sand --- */
export function dmgRolesField(S, u, m, t, typ, d) {
  // roles, synergies, sand, interception, cover: supplied to the tactical engine pipeline (v4.5-01)
  const r = MT.combineModifiers(0, MT.collect(ROLE_PROVIDERS, 'degats', { S, u, m, t, typ }, 'attaquant'));
  return Math.max(1, Math.round(d * r.mul) + r.add);
}

/* --- Guarding: the Bulwark steps in (single-target attacks) --- */
function guardOf(S, v) {
  return (
    S.units
      .filter(
        x =>
          !x.ko &&
          x !== v &&
          x.side === v.side &&
          !x.seg &&
          !x.colossus &&
          !v.seg && // a colossus and its parts do not step in (v4.8)
          roleOf(x) === 'Rempart' &&
          !x.gdu &&
          !['SOM', 'GEL', 'PAR'].includes(x.badge) &&
          hexDistance(x.pos, v.pos) === 1
      )
      .sort((a, b) => b.hp - a.hp)[0] || null
  );
}

/* --- resolution: context, burning grass, visual effect signal --- */
export function resolve(S, u, m, k) {
  const typ = moveType(S, u, m),
    t0 = S.tiles[k],
    rico = !!(t0 && t0.rock && !t0.pil && m.sh === 'one'),
    from = unitKey(u);
  let gd = null;
  if (m.sh === 'one' && (m.p || m.fix) && !rico) {
    const v = unitAt(S, k);
    if (v && v.side !== u.side && !(v.prot > 0)) {
      const g = guardOf(S, v);
      if (g) {
        g.gdu = 1;
        gd = { g, v };
        k = unitKey(g);
        noteAdd(`Gardiennage : ${g.n} encaisse à la place de ${v.n} (−25 %)`);
      }
    }
  }
  let shown = [];
  try {
    shown = m.sh === 'self' || m.wx ? [from] : affected(S, u, m, k);
  } catch {
    /* Best effort: failure here is non-fatal. */
  }
  const prev = currentAction;
  currentAction = { u, m, typ, rico, k, guard: !!gd };
  let ev;
  try {
    ev = resolveMove(S, u, m, k);
    u.touche = false; // it has acted: Mitra-Poing recharges (v4.13)
  } finally {
    currentAction = prev;
  }
  if (gd) {
    const j = ev.findIndex(e => e.e === 'use');
    ev.splice(
      j < 0 ? 0 : j + 1,
      0,
      { e: 'msg', s: `Gardiennage : ${gd.g.n} s’interpose devant ${gd.v.n} !` },
      { e: 'guard', u: gd.g.uid, v: gd.v.uid }
    );
  }
  if (typ === 'Feu' && (m.p || m.mk)) {
    let b = 0;
    shown.forEach(x => {
      const t = S.tiles[x];
      if (t && t.grass) {
        t.grass = false;
        if (!t.rock) {
          t.mark = { k: 'brulant', d: 2, lv: 1, by: u.uid };
        }
        b++;
      }
    });
    if (b) {
      pushMessage(ev, `Les hautes herbes s’embrasent${b > 1 ? ' (' + b + ' cases)' : ''} !`);
    }
  }
  const big =
    (m.p || 0) >= 13 ||
    ev.some(e => e.e === 'ko') ||
    ev.some(e => {
      if (e.e !== 'dmg') {
        return false;
      }
      const v = byUid(S, e.u);
      return v && e.v >= v.mhp * 0.3;
    });
  const i = ev.findIndex(e => e.e === 'use');
  ev.splice(i < 0 ? 0 : i + 1, 0, {
    e: 'fx',
    u: u.uid,
    from,
    k,
    t: typ,
    sh: m.sh,
    aff: shown,
    rico: rico ? shown[0] || null : null,
    p: m.p || 0,
    st: !m.p && !m.fix,
    big,
    side: u.side,
  });
  return ev;
}

/* --- retreat of enemy Scouts after their attack --- */
export function foeRetreat(S, e, ev) {
  const al = S.units.filter(a => a.side === 'a' && !a.ko);
  if (!al.length) {
    return;
  }
  const R = reach(S, e),
    sc = k => Math.min(...al.map(a => hexDistance(a.pos, parseCellKey(k)))) - (S.tiles[k].lava > 0 ? 5 : 0);
  let best = unitKey(e),
    bs = sc(best);
  for (const k in R) {
    const s = sc(k);
    if (s > bs) {
      bs = s;
      best = k;
    }
  }
  if (best !== unitKey(e)) {
    e.pos = parseCellKey(best);
    ev.push({ e: 'mv', u: e.uid });
    pushMessage(ev, `${e.n} se replie après son attaque.`);
    landed(S, e, ev);
  }
}

/* --- end of round: Relay, Toxins, reset --- */
export function roundSupport(S) {
  const pre = [];
  if (!S.over) {
    S.units.forEach(u => {
      if (u.ko || roleOf(u) !== 'Relais') {
        return;
      }
      const m = S.units.filter(
        o => o !== u && !o.ko && o.side === u.side && hexDistance(o.pos, u.pos) === 1 && o.hp < o.mhp
      );
      if (m.length) {
        pushMessage(pre, `Soutien : ${u.n} soigne ${m.map(o => o.n).join(', ')}.`);
        m.forEach(o => heal(S, o, 3, pre));
      }
    });
    if (S.syn && S.syn.includes('toxines')) {
      S.units.forEach(e => {
        if (!e.ko && e.side === 'e' && (e.root > 0 || e.web > 0 || e.badge === 'SOM')) {
          pushMessage(pre, `Toxines : ${e.n} s’affaiblit.`);
          damage(S, e, 3, pre, { ind: true });
        }
      });
    }
    S.units.forEach(u => {
      u.gdu = 0;
      u.hr = 0;
    });
  }
  return pre;
}

/* ===================== v1.1: roles, synergies, obstacles (additive module, no DOM) ===================== */
/* --- obstacles per terrain: pillars (block direct shots), tall grass (hides beyond 2 cells), sand (2 Movement) --- */
export const OBSTACLES = {
  tuto: { grass: ['2,4', '3,4', '3,5'] },
  gue: { grass: ['2,2', '2,3', '3,2'], sand: ['5,0', '5,4'] },
  roche: { pil: ['5,2'], sand: ['2,1', '2,4'] },
  tour: { pil: ['2,2'], sand: ['2,4', '5,2'] },
  ligue: { pil: ['3,2', '5,4'], grass: ['2,0', '2,5'] },
  a1: { pil: ['4,1', '3,4'], sand: ['2,2', '5,3'] },
  a2: { pil: ['3,1'], sand: ['5,0'] },
  a3: { pil: ['4,2', '3,3'], grass: ['2,1', '5,4'] },
  a4: { grass: ['2,1', '2,4', '5,1', '5,4'] },
  a5: { pil: ['4,4'], grass: ['2,4', '5,0'] },
  a6: { pil: ['4,2', '4,3'] },
  a7: { pil: ['5,2', '2,3'], grass: ['4,0', '4,5'] },
  a8: { sand: ['2,1', '2,4', '5,0', '5,3', '4,5'] },
  c1: { pil: ['4,0', '4,5'], grass: ['2,2', '2,3'] },
  c2: { pil: ['3,3', '5,2'], sand: ['2,1'] },
  c3: { pil: ['3,1', '3,4'], sand: ['5,5'] },
  c4: { pil: ['4,1'], grass: ['2,2', '2,3', '5,4'] },
  champ: { pil: ['3,2', '5,4'], grass: ['2,0', '2,5'] },
  sauvage: { grass: ['2,1', '3,1', '2,3', '4,3', '4,4', '5,3'] },
};

export const roleOf = u => (POKEMON[u.id] || {}).r;

export const STATUSED = t => ['PAR', 'GEL', 'SOM'].includes(t.badge) || t.root > 0 || t.web > 0 || t.burn > 0;

export const resistsSand = u => flies(u) || u.t.some(t => t === 'Sol' || t === 'Roche' || t === 'Acier');

export const noteAdd = s => {
  if (battleNotes && !battleNotes.includes(s)) {
    battleNotes.push(s);
  }
};

export const hasSynergy = (S, u, k) => !!(u && u.side === 'a' && S.syn && S.syn.includes(k));

export const ignObst = (S, u, typ) => hasSynergy(S, u, 'esprit') && (typ === 'Psy' || typ === 'Spectre');

// Instructions run at startup, in the original order (see index.js).
export function init() {
  ((currentAction = null), (battleNotes = null));
}
