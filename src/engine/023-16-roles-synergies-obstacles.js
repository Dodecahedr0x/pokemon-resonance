/* Section d'origine : 16-roles-synergies-obstacles.js */

import { MT } from './001-moteur-tactique-noyau-tours.js';
import { BY } from './009-03-pokemon.js';
import { synOf } from './012-06-recrues-roles-synergies.js';
import { K, P, affected, byUid, damage, flies, fromCube, hdist, heal, landed, mvType, nbr, reach, resolveMove, say, toCube, uAt, uk } from './021-14-moteur-combat.js';
import { FOURNISSEURS_ROLES } from './044-v4-5-01-moteur-tactique.js';

export let OBST, roleOf, STATUSED, SANDOK, ACT, NOTE, noteAdd, hasSyn, ignObst;
export function __set_NOTE(v) { return (NOTE = v); }


export function applyObst(S) {
  if (S._obs) return;
  S._obs = 1;
  const O = OBST[S.sc];
  if (O) {
    (O.pil || []).forEach(k => {
      const t = S.tiles[k];
      if (t && !uAt(S, k)) {
        t.rock = true;
        t.pil = true;
        t.w = false;
        t.mark = null;
      }
    });
    (O.grass || []).forEach(k => {
      const t = S.tiles[k];
      if (t && !t.rock && !t.w) t.grass = true;
    });
    (O.sand || []).forEach(k => {
      const t = S.tiles[k];
      if (t && !t.rock && !t.w) t.sand = true;
    });
  }
  S.syn = synOf(S.units.filter(u => u.side === 'a').map(u => u.id)).map(s => s.k);
}


/* --- ligne de vue (piliers) et couverture (rochers et piliers) --- */
function cubeRound(x, y, z) {
  let rx = Math.round(x),
    ry = Math.round(y),
    rz = Math.round(z);
  const dx = Math.abs(rx - x),
    dy = Math.abs(ry - y),
    dz = Math.abs(rz - z);
  if (dx > dy && dx > dz) rx = -ry - rz;
  else if (dy > dz) ry = -rx - rz;
  else rz = -rx - ry;
  return [rx, ry, rz];
}


function hexLine(a, b, e) {
  const A = toCube(a[0], a[1]),
    C = toCube(b[0], b[1]),
    n = hdist(a, b),
    o = [];
  for (let i = 1; i < n; i++) {
    const t = i / n,
      c = cubeRound(A[0] + (C[0] - A[0]) * t + e, A[1] + (C[1] - A[1]) * t + e, A[2] + (C[2] - A[2]) * t - 2 * e),
      p = fromCube(c[0], c[1], c[2]);
    o.push(K(p[0], p[1]));
  }
  return o;
}


export function losBlocked(S, a, b) {
  const f = e => hexLine(a, b, e).some(k => S.tiles[k] && S.tiles[k].pil);
  return f(1e-6) && f(-1e-6);
}


export function coverOf(S, a, b) {
  if (hdist(a, b) < 2) return null;
  const d = hdist(a, b);
  for (const q of nbr(b)) {
    const k = K(q[0], q[1]),
      t = S.tiles[k];
    if (t && t.rock && hdist(a, q) === d - 1) return k;
  }
  return null;
}


export function ricoTgt(S, u, k) {
  const t = S.tiles[k];
  if (!t || !t.rock || t.pil) return null;
  const R = P(k);
  const c = S.units
    .filter(o => !o.ko && o.side !== u.side && hdist(o.pos, R) <= 2 && !losBlocked(S, R, o.pos))
    .sort((a, b) => hdist(a.pos, R) - hdist(b.pos, R) || a.hp - b.hp || (a.uid < b.uid ? -1 : 1));
  return c.length ? uk(c[0]) : null;
}


/* --- dégâts : rôles, synergies, couverture, ricochet, sable --- */
export function dmgRolesTerrain(S, u, m, t, typ, d) {
  // rôles, synergies, sable, interception, couvert : fournis au pipeline du moteur tactique (v4.5-01)
  const r = MT.combinerModificateurs(0, MT.collecter(FOURNISSEURS_ROLES, 'degats', { S, u, m, t, typ }, 'attaquant'));
  return Math.max(1, Math.round(d * r.mul) + r.add);
}


/* --- Gardiennage : le Rempart s’interpose (attaques à cible unique) --- */
function guardOf(S, v) {
  return (
    S.units
      .filter(
        x =>
          !x.ko &&
          x !== v &&
          x.side === v.side &&
          !x.seg &&
          !x.colosse &&
          !v.seg && // un colosse et ses parties ne s'interposent pas (v4.8)
          roleOf(x) === 'Rempart' &&
          !x.gdu &&
          !['SOM', 'GEL', 'PAR'].includes(x.badge) &&
          hdist(x.pos, v.pos) === 1
      )
      .sort((a, b) => b.hp - a.hp)[0] || null
  );
}


/* --- résolution : contexte, herbes qui brûlent, signal d’effet visuel --- */
export function resolve(S, u, m, k) {
  const typ = mvType(S, u, m),
    t0 = S.tiles[k],
    rico = !!(t0 && t0.rock && !t0.pil && m.sh === 'one'),
    from = uk(u);
  let gd = null;
  if (m.sh === 'one' && (m.p || m.fix) && !rico) {
    const v = uAt(S, k);
    if (v && v.side !== u.side && !(v.prot > 0)) {
      const g = guardOf(S, v);
      if (g) {
        g.gdu = 1;
        gd = { g, v };
        k = uk(g);
        noteAdd(`Gardiennage : ${g.n} encaisse à la place de ${v.n} (−25 %)`);
      }
    }
  }
  let aff = [];
  try {
    aff = m.sh === 'self' || m.wx ? [from] : affected(S, u, m, k);
  } catch (e) {}
  const prev = ACT;
  ACT = { u, m, typ, rico, k, guard: !!gd };
  let ev;
  try {
    ev = resolveMove(S, u, m, k);
    u.touche = false; // il a agi : Mitra-Poing se recharge (v4.13)
  } finally {
    ACT = prev;
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
    aff.forEach(x => {
      const t = S.tiles[x];
      if (t && t.grass) {
        t.grass = false;
        if (!t.rock) t.mark = { k: 'brulant', d: 2, lv: 1, by: u.uid };
        b++;
      }
    });
    if (b) say(ev, `Les hautes herbes s’embrasent${b > 1 ? ' (' + b + ' cases)' : ''} !`);
  }
  const big =
    (m.p || 0) >= 13 ||
    ev.some(e => e.e === 'ko') ||
    ev.some(e => {
      if (e.e !== 'dmg') return false;
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
    aff,
    rico: rico ? aff[0] || null : null,
    p: m.p || 0,
    st: !m.p && !m.fix,
    big,
    side: u.side
  });
  return ev;
}


/* --- repli des Éclaireurs adverses après leur attaque --- */
export function foeRetreat(S, e, ev) {
  const al = S.units.filter(a => a.side === 'a' && !a.ko);
  if (!al.length) return;
  const R = reach(S, e),
    sc = k => Math.min(...al.map(a => hdist(a.pos, P(k)))) - (S.tiles[k].lava > 0 ? 5 : 0);
  let best = uk(e),
    bs = sc(best);
  for (const k in R) {
    const s = sc(k);
    if (s > bs) {
      bs = s;
      best = k;
    }
  }
  if (best !== uk(e)) {
    e.pos = P(best);
    ev.push({ e: 'mv', u: e.uid });
    say(ev, `${e.n} se replie après son attaque.`);
    landed(S, e, ev);
  }
}


/* --- fin de manche : Relais, Toxines, remise à zéro --- */
export function roundSupport(S) {
  const pre = [];
  if (!S.over) {
    S.units.forEach(u => {
      if (u.ko || roleOf(u) !== 'Relais') return;
      const m = S.units.filter(o => o !== u && !o.ko && o.side === u.side && hdist(o.pos, u.pos) === 1 && o.hp < o.mhp);
      if (m.length) {
        say(pre, `Soutien : ${u.n} soigne ${m.map(o => o.n).join(', ')}.`);
        m.forEach(o => heal(S, o, 3, pre));
      }
    });
    if (S.syn && S.syn.includes('toxines'))
      S.units.forEach(e => {
        if (!e.ko && e.side === 'e' && (e.root > 0 || e.web > 0 || e.badge === 'SOM')) {
          say(pre, `Toxines : ${e.n} s’affaiblit.`);
          damage(S, e, 3, pre, { ind: true });
        }
      });
    S.units.forEach(u => {
      u.gdu = 0;
      u.hr = 0;
    });
  }
  return pre;
}

// Instructions exécutées au démarrage, dans l'ordre d'origine (voir index.js).
export function __init() {

/* ===================== v1.1 : rôles, synergies, obstacles (module additif, sans DOM) ===================== */
/* --- obstacles par terrain : piliers (bloquent les tirs directs), hautes herbes (cachent au-delà de 2 cases), sable (2 Mouvements) --- */
OBST = {
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
  sauvage: { grass: ['2,1', '3,1', '2,3', '4,3', '4,4', '5,3'] }
};


roleOf = u => (BY[u.id] || {}).r;


STATUSED = t => ['PAR', 'GEL', 'SOM'].includes(t.badge) || t.root > 0 || t.web > 0 || t.bru > 0;


SANDOK = u => flies(u) || u.t.some(t => t === 'Sol' || t === 'Roche' || t === 'Acier');


ACT = null,
  NOTE = null;


noteAdd = s => {
  if (NOTE && !NOTE.includes(s)) NOTE.push(s);
};


hasSyn = (S, u, k) => !!(u && u.side === 'a' && S.syn && S.syn.includes(k));


ignObst = (S, u, typ) => hasSyn(S, u, 'esprit') && (typ === 'Psy' || typ === 'Spectre');
}
