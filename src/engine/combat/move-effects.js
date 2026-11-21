import { bdClass, bdReplay, getHost, hostSet } from '../../screens/combat/board/boardStore.js';

import { $, reducedMotion } from '../core/utils.js';
import { byUid, unitKey } from './engine.js';
import {
  battle,
  cellCenter,
  BOARD_TILT,
  boardViewBox,
  isVerticalBoard,
  buildBoard,
  playLog,
  renderAll,
  tiltS,
  ui,
} from './ui.js';
import { PREFERENCES } from '../ui/preferences.js';
import { impactWords } from '../progression/prestige.js';
import { liveEvent } from './expressive-pokemon.js';

let R0, cl01, eo;

export function effectsEnabled() {
  if (reducedMotion || /jsdom/i.test(navigator.userAgent || '')) {
    return false;
  }
  if (EFFECTS_CANVAS.on === null) {
    try {
      const c = document.createElement('canvas');
      EFFECTS_CANVAS.on = !!(c.getContext && c.getContext('2d'));
    } catch (e) {
      EFFECTS_CANVAS.on = false;
    }
  }
  return EFFECTS_CANVAS.on;
}

export function fxReset() {
  EFFECTS_CANVAS.items = [];
  if (EFFECTS_CANVAS.raf) {
    cancelAnimationFrame(EFFECTS_CANVAS.raf);
  }
  EFFECTS_CANVAS.raf = 0;
  if (EFFECTS_CANVAS.ctx && EFFECTS_CANVAS.cv) {
    EFFECTS_CANVAS.ctx.clearRect(0, 0, EFFECTS_CANVAS.cv.width, EFFECTS_CANVAS.cv.height);
  }
}

export function fxPrep() {
  const bd = $('#bBoard'),
    svg = $('#bSvg');
  if (!bd || !svg) {
    return false;
  }
  // canvas.attack-effects-canvas: rendered by React (Board.jsx) on the first effect; size and drawing here
  if (!getHost().fxc) {
    hostSet({ fxc: true });
  }
  const cv = bd.querySelector('canvas.attack-effects-canvas');
  if (!cv) {
    return false;
  }
  const r = svg.getBoundingClientRect(),
    br = bd.getBoundingClientRect();
  if (!r.width || !r.height) {
    return false;
  }
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  cv.style.left = r.left - br.left - bd.clientLeft + 'px';
  cv.style.top = r.top - br.top - bd.clientTop + 'px';
  cv.style.width = r.width + 'px';
  cv.style.height = r.height + 'px';
  const W = Math.round(r.width * dpr),
    H = Math.round(r.height * dpr);
  if (cv.width !== W) {
    cv.width = W;
  }
  if (cv.height !== H) {
    cv.height = H;
  }
  const [vw, vh] = boardViewBox(),
    s = Math.min(r.width / vw, r.height / vh);
  EFFECTS_CANVAS.s = s * dpr;
  EFFECTS_CANVAS.ox = ((r.width - vw * s) / 2) * dpr;
  EFFECTS_CANVAS.oy = ((r.height - vh * s) / 2) * dpr;
  EFFECTS_CANVAS.cv = cv;
  EFFECTS_CANVAS.ctx = cv.getContext('2d');
  return !!EFFECTS_CANVAS.ctx;
}

function fxLoop(now) {
  const c = EFFECTS_CANVAS.ctx,
    cv = EFFECTS_CANVAS.cv;
  if (!c) {
    EFFECTS_CANVAS.raf = 0;
    return;
  }
  c.clearRect(0, 0, cv.width, cv.height);
  EFFECTS_CANVAS.items = EFFECTS_CANVAS.items.filter(it => {
    const p = (now - it.t0) / it.d;
    if (p < 0) {
      return true;
    }
    if (p >= 1) {
      return false;
    }
    c.save();
    try {
      it.f(c, p);
    } catch {
      /* Best effort: failure here is non-fatal. */
    }
    c.restore();
    return true;
  });
  if (EFFECTS_CANVAS.items.length) {
    EFFECTS_CANVAS.raf = requestAnimationFrame(fxLoop);
  } else {
    EFFECTS_CANVAS.raf = 0;
    c.clearRect(0, 0, cv.width, cv.height);
  }
}

export function fxAdd(d, f, delay) {
  EFFECTS_CANVAS.items.push({ t0: performance.now() + (delay || 0), d, f });
  if (!EFFECTS_CANVAS.raf) {
    EFFECTS_CANVAS.raf = requestAnimationFrame(fxLoop);
  }
}

function along(pts, t) {
  if (pts.length < 2) {
    return pts[0];
  }
  const L = [];
  let tot = 0;
  for (let i = 1; i < pts.length; i++) {
    const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    L.push(d);
    tot += d;
  }
  let r = t * tot;
  for (let i = 0; i < L.length; i++) {
    if (r <= L[i] || i === L.length - 1) {
      return lp(pts[i], pts[i + 1], L[i] ? cl01(r / L[i]) : 1);
    }
    r -= L[i];
  }
  return pts[pts.length - 1];
}

function glowDot(c, x, y, r, col, a) {
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, col);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  c.globalAlpha = a;
  c.fillStyle = g;
  c.beginPath();
  c.arc(x, y, r, 0, 7);
  c.fill();
}

function ringAt(c, x, y, r, col, a, lw) {
  c.globalAlpha = a;
  c.strokeStyle = col;
  c.lineWidth = lw;
  c.beginPath();
  c.arc(x, y, Math.max(0.1, r), 0, 7);
  c.stroke();
}

function hexAt(c, x, y, r, col, a, lw) {
  c.globalAlpha = a;
  c.strokeStyle = col;
  c.lineWidth = lw;
  c.beginPath();
  for (let i = 0; i < 6; i++) {
    const an = (Math.PI / 3) * i + (isVerticalBoard ? 0 : Math.PI / 6);
    const px = x + r * Math.cos(an),
      py = y + r * Math.sin(an);
    i ? c.lineTo(px, py) : c.moveTo(px, py);
  }
  c.closePath();
  c.stroke();
}

function jag(a, b, n, amp) {
  const o = [a],
    dx = b[0] - a[0],
    dy = b[1] - a[1],
    L = Math.hypot(dx, dy) || 1,
    nx = -dy / L,
    ny = dx / L;
  for (let i = 1; i < n; i++) {
    const t = i / n,
      j = (R0() - 0.5) * 2 * amp;
    o.push([a[0] + dx * t + nx * j, a[1] + dy * t + ny * j]);
  }
  o.push(b);
  return o;
}

function strokePts(c, pts, col, lw, a) {
  c.globalAlpha = a;
  c.strokeStyle = col;
  c.lineWidth = lw;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.beginPath();
  pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])));
  c.stroke();
}

function shape(c, kind, x, y, s, rot, col, a) {
  c.globalAlpha = a;
  c.fillStyle = col;
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  c.beginPath();
  if (kind === 'leaf') {
    c.ellipse(0, 0, s * 1.6, s * 0.6, 0, 0, 7);
  } else if (kind === 'shard' || kind === 'metal') {
    c.moveTo(s * 1.8, 0);
    c.lineTo(-s, s * 0.7);
    c.lineTo(-s * 0.4, 0);
    c.lineTo(-s, -s * 0.7);
  } else if (kind === 'rock') {
    for (let i = 0; i < 6; i++) {
      const an = (i / 6) * 6.283,
        rr = s * (0.75 + ((i * 37) % 5) / 10);
      i ? c.lineTo(Math.cos(an) * rr, Math.sin(an) * rr) : c.moveTo(Math.cos(an) * rr, Math.sin(an) * rr);
    }
    c.closePath();
  } else if (kind === 'star') {
    for (let i = 0; i < 8; i++) {
      const an = (i / 8) * 6.283,
        rr = i % 2 ? s * 0.4 : s * 1.4;
      i ? c.lineTo(Math.cos(an) * rr, Math.sin(an) * rr) : c.moveTo(Math.cos(an) * rr, Math.sin(an) * rr);
    }
    c.closePath();
  } else {
    c.arc(0, 0, s, 0, 7);
  }
  c.fill();
  c.restore();
}

/* a complete attack effect: trajectory, impact, shards */
/* Effects scaled to the depth of the tilted board (target at the back = smaller effect). */
function depth(k) {
  if (!BOARD_TILT.on || k == null) {
    return 1;
  }
  const [x, y] = cellCenter(k);
  return Math.max(0.6, Math.min(1.4, tiltS(x, y)));
}

function withDepth(k, f, topEdge) {
  const oy = EFFECTS_CANVAS.oy;
  EFFECTS_CANVAS.zk = depth(k);
  // shots leave from the standing Pokémon's body, not from the ground ring (positions frozen at call time)
  if (BOARD_TILT.on && topEdge) {
    EFFECTS_CANVAS.oy = oy - 10 * EFFECTS_CANVAS.zk * EFFECTS_CANVAS.s;
  }
  try {
    return f();
  } finally {
    EFFECTS_CANVAS.zk = 1;
    EFFECTS_CANVAS.oy = oy;
  }
}

function fxAttack(e, dur) {
  const onGround =
    !e ||
    e.st ||
    e.sh === 'self' ||
    e.sh === 'area' ||
    e.sh === 'ring' ||
    e.sh === 'cone' ||
    e.from === e.k ||
    FXK[e.t] === 'quake';
  return withDepth(e && (e.k != null ? e.k : e.from), () => fxAttackPlat(e, dur), !onGround);
}

// Plays the per-type attack effect on the board canvas and returns the delay until the hit lands.
function fxAttackPlat(e, dur) {
  const atk = attackContext(e, dur);
  if (e.st || atk.self) {
    return fxSelfAura(atk);
  }
  fxTrajectory(atk);
  fxProjectiles(atk);
  /* ricochet: spark on the rock */
  if (atk.rock) {
    fxRicochet(atk);
  }
  /* impact on each tile hit */
  atk.T.forEach((t, i) => fxTileImpact(atk, t, i));
  return fxBigHit(atk);
}

// Gathers the state shared by every part of one attack effect (scale, palette, kind, source, targets, ricochet point).
function attackContext(e, dur) {
  const z = EFFECTS_CANVAS.s * (EFFECTS_CANVAS.zk || 1),
    pal = FXC[e.t] || FXC.Normal,
    kind0 = FXK[e.t] || 'impact',
    A = fxP(e.from);
  let T = (e.aff && e.aff.length ? e.aff : [e.k]).filter(Boolean).map(fxP);
  if (!T.length) {
    T = [fxP(e.k)];
  }
  const rock = e.rico ? fxP(e.k) : null,
    ti = 0.42,
    area = e.sh === 'area' || e.sh === 'ring' || e.sh === 'cone';
  const kind = kind0 === 'jet' && area ? 'wave' : kind0;
  const self = e.sh === 'self' || (e.from === e.k && !area);
  return { e, dur, z, pal, kind, A, T, rock, ti, self };
}

// Returns the travel path from the attacker to a target, bouncing on the ricochet rock if any.
function fxPath(atk, t) {
  return atk.rock ? [atk.A, atk.rock, t] : [atk.A, t];
}

// Schedules the hexagon aura shown on each tile of a status or self-targeted move; returns the hit delay.
function fxSelfAura(atk) {
  const { dur, T } = atk;
  T.forEach((t, i) => fxAdd(dur * 0.9, (c, p) => drawSelfAura(c, p, atk, t), i * 40));
  return dur * 0.3;
}

// Draws one frame of the self aura: two hexagons, a glow and six orbiting particles.
function drawSelfAura(c, p, atk, t) {
  const { z, pal, kind } = atk;
  c.globalCompositeOperation = 'lighter';
  const q = eo(p);
  hexAt(c, t[0], t[1], (14 + 16 * q) * z, pal[1], (1 - p) * 0.9, 2.2 * z);
  hexAt(c, t[0], t[1], (8 + 10 * q) * z, pal[0], (1 - p) * 0.6, 1.2 * z);
  glowDot(c, t[0], t[1], 22 * z, pal[2], (1 - p) * 0.35);
  for (let j = 0; j < 6; j++) {
    const an = (j / 6) * 6.283 + p * 2;
    shape(
      c,
      kind === 'leaf' ? 'leaf' : kind === 'sparkle' || kind === 'bolt' ? 'star' : 'dot',
      t[0] + Math.cos(an) * (10 + 14 * q) * z,
      t[1] + Math.sin(an) * (10 + 14 * q) * z - 8 * q * z,
      2 * z,
      an,
      pal[0],
      (1 - p) * 0.9
    );
  }
}

/* trajectory */
// Schedules the trajectory drawn for the effect kind, if that kind has one.
function fxTrajectory(atk) {
  /* slash and quake: on contact or on the ground, the effect is born at the impact */
  const trail = TRAJECTORIES[atk.kind];
  if (trail) {
    trail(atk);
  }
}

// Schedules a lightning bolt from the attacker to each target.
function fxBoltTrail(atk) {
  const { dur, ti, T } = atk;
  T.forEach(t => fxAdd(dur * (ti + 0.28), (c, p) => drawBoltTrail(c, p, atk, t)));
}

// Draws one flickering frame of the lightning bolt.
function drawBoltTrail(c, p, atk, t) {
  const { A, rock, z, pal } = atk;
  c.globalCompositeOperation = 'lighter';
  const f = Math.sin(p * 40) > -0.3 ? 1 : 0.35;
  const P = rock ? [...jag(A, rock, 5, 6 * z), ...jag(rock, t, 5, 6 * z).slice(1)] : jag(A, t, 9, 7 * z);
  strokePts(c, P, pal[3], 7 * z, 0.35 * f);
  strokePts(c, P, pal[2], 3.4 * z, 0.8 * f);
  strokePts(c, P, '#FFFFFF', 1.4 * z, f);
  if (p < 0.25) {
    glowDot(c, A[0], A[1], 16 * z, pal[1], 0.6);
  }
}

// Schedules a water jet from the attacker to each target.
function fxJetTrail(atk) {
  const { dur, ti, T } = atk;
  T.forEach(t => fxAdd(dur * (ti + 0.25), (c, p) => drawJetTrail(c, p, atk, t)));
}

// Draws one frame of the water jet: a layered stream with droplets at its head.
function drawJetTrail(c, p, atk, t) {
  const { ti, z, pal } = atk;
  const P = fxPath(atk, t),
    h = cl01(p / ti),
    tail = cl01((p - ti) / 0.25);
  c.globalCompositeOperation = 'lighter';
  const pts = [];
  for (let i = 0; i <= 16; i++) {
    const u = tail + ((h - tail) * i) / 16;
    pts.push(along(P, u));
  }
  strokePts(c, pts, pal[3], 9 * z, 0.35);
  strokePts(c, pts, pal[2], 5 * z, 0.75);
  strokePts(c, pts, pal[0], 2 * z, 0.95);
  for (let i = 0; i < 5; i++) {
    const u = cl01(h - 0.02 - i * 0.04),
      q = along(P, u);
    glowDot(c, q[0] + (R0() - 0.5) * 6 * z, q[1] + (R0() - 0.5) * 6 * z, 3.2 * z, pal[0], 0.7);
  }
}

// Schedules the expanding wave centered on the attacker (ring) or on the target tile.
function fxWave(atk) {
  const { e, dur, A } = atk;
  const C = e.sh === 'ring' ? A : fxP(e.k);
  fxAdd(dur, (c, p) => drawWave(c, p, atk, C));
}

// Draws one frame of the expanding wave: a filled ellipse, two rings and bobbing droplets.
function drawWave(c, p, atk, C) {
  const { z, pal } = atk;
  const q = eo(p),
    r = (10 + 48 * q) * z;
  c.globalCompositeOperation = 'lighter';
  c.globalAlpha = (1 - p) * 0.28;
  c.fillStyle = pal[2];
  c.beginPath();
  c.ellipse(C[0], C[1], r, r * 0.62, 0, 0, 7);
  c.fill();
  ringAt(c, C[0], C[1], r, pal[0], (1 - p) * 0.9, 2.4 * z);
  ringAt(c, C[0], C[1], r * 0.78, pal[1], (1 - p) * 0.6, 1.4 * z);
  for (let i = 0; i < 14; i++) {
    const an = (i / 14) * 6.283;
    glowDot(
      c,
      C[0] + Math.cos(an) * r,
      C[1] + Math.sin(an) * r * 0.62 - 4 * z * Math.sin(p * 9 + i),
      3 * z,
      pal[0],
      (1 - p) * 0.8
    );
  }
}

// Schedules a psychic sine beam from the attacker to each target.
function fxPsyTrail(atk) {
  const { dur, ti, T } = atk;
  T.forEach(t => fxAdd(dur * (ti + 0.05), (c, p) => drawPsyTrail(c, p, atk, t)));
}

// Draws one frame of the psychic beam, waving across the travel direction.
function drawPsyTrail(c, p, atk, t) {
  const { A, ti, z, pal } = atk;
  const P = fxPath(atk, t),
    h = cl01(p / ti);
  c.globalCompositeOperation = 'lighter';
  const pts = [];
  for (let i = 0; i <= 24; i++) {
    const u = (h * i) / 24,
      q = along(P, u),
      dx = t[0] - A[0],
      dy = t[1] - A[1],
      L = Math.hypot(dx, dy) || 1;
    const w = Math.sin(u * 18 - p * 20) * 5 * z;
    pts.push([q[0] - (dy / L) * w, q[1] + (dx / L) * w]);
  }
  strokePts(c, pts, pal[2], 4 * z, 0.5);
  strokePts(c, pts, pal[0], 1.4 * z, 0.9);
}

// Schedules the flame trail for flame moves, or the projectile/particle volley for every other kind.
function fxProjectiles(atk) {
  if (atk.kind === 'flame') {
    fxFlameTrail(atk);
  } else {
    fxParticleVolley(atk);
  }
}

// Schedules a flame stream (line moves) or a fireball toward each target.
function fxFlameTrail(atk) {
  const { dur, ti, T } = atk;
  T.forEach(t => fxAdd(dur * (ti + 0.2), (c, p) => drawFlameTrail(c, p, atk, t)));
}

// Draws one frame of the flame stream or fireball.
function drawFlameTrail(c, p, atk, t) {
  const { e, ti, z, pal } = atk;
  const P = fxPath(atk, t),
    h = cl01(p / ti),
    tail = cl01((p - ti * 0.7) / 0.4);
  c.globalCompositeOperation = 'lighter';
  if (e.sh === 'line') {
    const pts = [];
    for (let i = 0; i <= 14; i++) {
      pts.push(along(P, tail + ((h - tail) * i) / 14));
    }
    strokePts(c, pts, pal[3], 14 * z, 0.32);
    strokePts(c, pts, pal[2], 8 * z, 0.55);
    strokePts(c, pts, pal[1], 3.6 * z, 0.9);
    strokePts(c, pts, pal[0], 1.4 * z, 0.95);
  } else if (p < ti) {
    const q = along(P, eo(h));
    glowDot(c, q[0], q[1], 16 * z, pal[2], 0.75);
    glowDot(c, q[0], q[1], 8 * z, pal[0], 1);
  }
}

/* projectiles and particles */
// Spawns the randomized particles spread over the targets and schedules their flight.
function fxParticleVolley(atk) {
  const { dur, ti, kind, T } = atk;
  const N = particleCount(kind);
  const ps = [];
  T.forEach((t, ti2) => {
    for (let i = 0; i < Math.max(1, Math.round(N / T.length)); i++) {
      ps.push({ t, b: R0() * 0.22, j: R0() - 0.5, r: 0.6 + R0() * 0.7, rot: R0() * 6.28, ti: ti2 });
    }
  });
  fxAdd(dur * (ti + 0.12), (c, p) => drawParticles(c, p, atk, ps));
}

// Returns the total number of particles thrown for an effect kind.
function particleCount(kind) {
  return kind === 'flame'
    ? 40
    : kind === 'swarm'
      ? 22
      : kind === 'rock'
        ? 6
        : kind === 'bubble'
          ? 14
          : kind === 'sparkle'
            ? 14
            : kind === 'wind'
              ? 6
              : kind === 'leaf'
                ? 14
                : kind === 'ice' || kind === 'metal'
                  ? 10
                  : kind === 'wisp'
                    ? 8
                    : 1;
}

// Draws one frame of the whole particle volley.
function drawParticles(c, p, atk, ps) {
  const { kind } = atk;
  c.globalCompositeOperation = kind === 'rock' || kind === 'slash' ? 'source-over' : 'lighter';
  ps.forEach(o => drawParticle(c, p, atk, o));
}

// Draws one particle at its current point along its path, if it is in flight.
function drawParticle(c, p, atk, o) {
  const { A, ti, z, kind } = atk;
  const u = cl01((p - o.b) / (ti - o.b * 0.5));
  if (u <= 0 || u >= 1) {
    return;
  }
  const P = fxPath(atk, o.t),
    q = along(P, eo(u)),
    dx = o.t[0] - A[0],
    dy = o.t[1] - A[1],
    L = Math.hypot(dx, dy) || 1,
    nx = -dy / L,
    ny = dx / L;
  const [x, y] = particleDrift(kind, z, o, u, q, nx, ny);
  const s = particleSize(kind, z, o, u);
  paintParticle(c, atk, { o, P, u, x, y, s, dx, dy });
}

// Returns the particle position once its kind-specific sideways drift or arc is applied.
function particleDrift(kind, z, o, u, q, nx, ny) {
  let x = q[0],
    y = q[1];
  if (kind === 'rock') {
    y -= Math.sin(u * Math.PI) * (26 + o.j * 10) * z;
    x += nx * o.j * 8 * z;
  } else if (kind === 'wisp' || kind === 'swarm' || kind === 'leaf' || kind === 'sparkle') {
    const w = Math.sin(u * 10 + o.j * 9) * (kind === 'swarm' ? 6 : 9) * z * o.j * 2;
    x += nx * w;
    y += ny * w;
  } else if (kind === 'wind') {
    const w = Math.sin(u * 3.14) * 14 * z * o.j * 2;
    x += nx * w;
    y += ny * w;
  } else {
    x += nx * o.j * 5 * z * (1 - u);
    y += ny * o.j * 5 * z * (1 - u);
  }
  return [x, y];
}

// Returns the drawn size of a particle for its kind.
function particleSize(kind, z, o, u) {
  return (
    (kind === 'flame'
      ? 5.4 * (1 - u * 0.35)
      : kind === 'rock'
        ? 4.6
        : kind === 'bubble'
          ? 3
          : kind === 'swarm'
            ? 1.4
            : kind === 'impact'
              ? 3.4
              : 2.6) *
    z *
    o.r
  );
}

// Paints one particle with the look of its kind (glow, gust arc, wisp tail, bubble, shape).
function paintParticle(c, atk, pt) {
  const { z, pal, kind } = atk;
  const { o, P, u, x, y, s, dx, dy } = pt;
  if (kind === 'flame') {
    glowDot(c, x, y, s * 2.6, pal[1], 0.55);
    glowDot(c, x, y, s * 1.2, pal[0], 0.9);
  } else if (kind === 'wind') {
    c.globalAlpha = 0.7 * (1 - u * 0.5);
    c.strokeStyle = pal[0];
    c.lineWidth = 1.6 * z;
    c.beginPath();
    c.arc(x, y, 8 * z * o.r, 0.2 + o.rot, 2.2 + o.rot);
    c.stroke();
  } else if (kind === 'wisp') {
    glowDot(c, x, y, s * 3, pal[2], 0.6);
    glowDot(c, x, y, s * 1.2, pal[0], 0.8);
    for (let k2 = 1; k2 < 4; k2++) {
      const q2 = along(P, eo(cl01(u - k2 * 0.05)));
      glowDot(c, q2[0], q2[1], s * (2.4 - k2 * 0.5), pal[3], 0.35);
    }
  } else if (kind === 'bubble') {
    ringAt(c, x, y, s, pal[0], 0.85, Number(z));
    glowDot(c, x, y, s, pal[2], 0.5);
  } else if (kind === 'impact') {
    glowDot(c, x, y, s * 3, pal[1], 0.5);
    shape(c, 'dot', x, y, s, 0, pal[0], 0.95);
  } else {
    shape(
      c,
      kind === 'leaf'
        ? 'leaf'
        : kind === 'rock'
          ? 'rock'
          : kind === 'sparkle'
            ? 'star'
            : kind === 'ice' || kind === 'metal'
              ? 'shard'
              : 'dot',
      x,
      y,
      s,
      kind === 'ice' || kind === 'metal' ? Math.atan2(dy, dx) : o.rot + u * 6,
      kind === 'rock' ? pal[1] : pal[0],
      0.95
    );
  }
}

// Schedules the spark burst on the rock a ricochet bounces off.
function fxRicochet(atk) {
  const { dur, ti } = atk;
  fxAdd(dur * 0.3, (c, p) => drawRicochet(c, p, atk), dur * ti * 0.5);
}

// Draws one frame of the ricochet spark: a fading glow and seven rays.
function drawRicochet(c, p, atk) {
  const { rock, z } = atk;
  c.globalCompositeOperation = 'lighter';
  glowDot(c, rock[0], rock[1] - 4 * z, 18 * z * (1 - p), '#FFE9B0', 1 - p);
  for (let i = 0; i < 7; i++) {
    const an = (i / 7) * 6.283;
    strokePts(
      c,
      [
        [rock[0], rock[1] - 4 * z],
        [rock[0] + Math.cos(an) * 14 * z * p, rock[1] - 4 * z + Math.sin(an) * 14 * z * p],
      ],
      '#FFF4D6',
      1.2 * z,
      1 - p
    );
  }
}

// Schedules the kind-specific impact burst on one hit tile (staggered along line moves).
function fxTileImpact(atk, t, i) {
  const { e, dur, ti, T } = atk;
  const delay = dur * ti * (e.sh === 'line' ? 0.65 + (0.35 * i) / Math.max(1, T.length - 1) : 1);
  fxAdd(dur * 0.62, (c, p) => drawTileImpact(c, p, atk, t, i), delay);
}

// Draws one frame of the impact burst on a tile, dispatching on the effect kind.
function drawTileImpact(c, p, atk, t, i) {
  const { z, pal, kind } = atk;
  const q = eo(p),
    x = t[0],
    y = t[1];
  c.globalCompositeOperation = 'lighter';
  const burst = IMPACTS[kind] || impactHit;
  burst(c, { x, y, p, q, i, z, pal, kind });
}

// Impact burst for bolt moves: a white flash and jagged sparks.
function impactBolt(c, { x, y, p, q, i, z, pal }) {
  glowDot(c, x, y, (26 - 8 * p) * z, '#FFFFFF', (1 - p) * 0.9);
  for (let j = 0; j < 10; j++) {
    const an = (j / 10) * 6.283 + i;
    strokePts(
      c,
      jag([x, y], [x + Math.cos(an) * (8 + 20 * q) * z, y + Math.sin(an) * (8 + 20 * q) * z], 3, 2.4 * z),
      pal[1],
      1.4 * z,
      1 - p
    );
  }
}

// Impact burst for flame moves: a fire glow and rising embers.
function impactFlame(c, { x, y, p, q, z, pal }) {
  glowDot(c, x, y, (30 - 6 * p) * z, pal[2], (1 - p) * 0.7);
  glowDot(c, x, y, 14 * z, pal[0], (1 - p) * 0.8);
  for (let j = 0; j < 16; j++) {
    const an = (j / 16) * 6.283,
      rr = (4 + 20 * q) * z;
    glowDot(
      c,
      x + Math.cos(an) * rr,
      y + Math.sin(an) * rr * 0.6 - 22 * q * z * ((j % 3) / 2),
      5 * z * (1 - p * 0.7),
      pal[j % 3],
      1 - p
    );
  }
}

// Impact burst for jet and wave moves: a ring and splashing droplets.
function impactSplash(c, { x, y, p, q, z, pal }) {
  ringAt(c, x, y, (6 + 20 * q) * z, pal[0], 1 - p, 2 * z);
  for (let j = 0; j < 9; j++) {
    const an = (j / 9) * 6.283;
    glowDot(
      c,
      x + Math.cos(an) * 14 * q * z,
      y + Math.sin(an) * 10 * q * z - 14 * z * Math.sin(q * 3.14),
      2.6 * z,
      pal[1],
      1 - p
    );
  }
}

// Impact burst for leaf moves: spinning leaves and a zigzag vine.
function impactLeaf(c, { x, y, p, q, z, pal }) {
  for (let j = 0; j < 8; j++) {
    const an = (j / 8) * 6.283 + q;
    shape(
      c,
      'leaf',
      x + Math.cos(an) * 16 * q * z,
      y + Math.sin(an) * 12 * q * z,
      2.4 * z,
      an + q * 4,
      pal[j % 2],
      1 - p
    );
  }
  strokePts(
    c,
    [
      [x - 12 * z, y + 10 * z],
      [x - 4 * z, y - 6 * z * q],
      [x + 8 * z, y + 4 * z],
      [x + 12 * z, y - 10 * z * q],
    ],
    pal[2],
    2 * z,
    (1 - p) * 0.8
  );
}

// Impact burst for psychic moves: staggered expanding rings and a glow.
function impactPsy(c, { x, y, p, q, z, pal }) {
  for (let j = 0; j < 3; j++) {
    const qq = cl01(q * 1.4 - j * 0.22);
    ringAt(c, x, y, (4 + 28 * qq) * z, j % 2 ? pal[2] : pal[1], (1 - qq) * (1 - p * 0.5), 2.2 * z);
  }
  glowDot(c, x, y, 20 * z, pal[2], (1 - p) * 0.4);
}

// Impact burst for ghost moves: a dark blot and a ring.
function impactWisp(c, { x, y, p, q, z, pal }) {
  c.globalCompositeOperation = 'source-over';
  glowDot(c, x, y, 26 * z * q + 8 * z, 'rgba(40,16,80,1)', (1 - p) * 0.55);
  c.globalCompositeOperation = 'lighter';
  ringAt(c, x, y, (6 + 18 * q) * z, pal[1], 1 - p, 1.6 * z);
}

// Impact burst for rock and quake moves: a dust cloud, then ground cracks (quake) or flying rocks (rock).
function impactGround(c, { x, y, p, q, i, z, pal, kind }) {
  c.globalCompositeOperation = 'source-over';
  for (let j = 0; j < 12; j++) {
    const an = (j / 12) * 6.283;
    glowDot(
      c,
      x + Math.cos(an) * (6 + 18 * q) * z,
      y + Math.sin(an) * (4 + 10 * q) * z,
      (5 + 5 * q) * z,
      pal[2],
      (1 - p) * 0.55
    );
  }
  if (kind === 'quake') {
    c.globalCompositeOperation = 'lighter';
    for (let j = 0; j < 5; j++) {
      const an = (j / 5) * 6.283 + i;
      strokePts(
        c,
        jag([x, y + 4 * z], [x + Math.cos(an) * 22 * z * q, y + 4 * z + Math.sin(an) * 12 * z * q], 4, 2 * z),
        pal[0],
        1.6 * z,
        1 - p
      );
    }
  } else {
    for (let j = 0; j < 5; j++) {
      const an = (j / 5) * 6.283;
      shape(
        c,
        'rock',
        x + Math.cos(an) * 14 * q * z,
        y + Math.sin(an) * 8 * q * z - 16 * z * Math.sin(q * 3.14),
        2.4 * z,
        an + q * 5,
        pal[1],
        1 - p
      );
    }
  }
}

// Impact burst for ice moves: a six-branch snowflake and a glow.
function impactIce(c, { x, y, p, q, z, pal }) {
  c.globalAlpha = 1 - p;
  c.strokeStyle = pal[0];
  c.lineWidth = 1.6 * z;
  for (let j = 0; j < 6; j++) {
    const an = (j / 6) * 6.283,
      rr = (4 + 16 * q) * z;
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x + Math.cos(an) * rr, y + Math.sin(an) * rr);
    c.stroke();
    c.beginPath();
    c.moveTo(x + Math.cos(an) * rr * 0.6, y + Math.sin(an) * rr * 0.6);
    c.lineTo(x + Math.cos(an + 0.5) * rr * 0.8, y + Math.sin(an + 0.5) * rr * 0.8);
    c.stroke();
  }
  glowDot(c, x, y, 18 * z, pal[2], (1 - p) * 0.5);
}

// Impact burst for dark moves: three diagonal claw slashes.
function impactSlash(c, { x, y, p, q, z, pal }) {
  c.globalCompositeOperation = 'source-over';
  for (let j = 0; j < 3; j++) {
    const d = cl01(q * 1.6 - j * 0.25),
      o2 = (j - 1) * 9 * z;
    if (d <= 0) {
      continue;
    }
    const a1 = [x - 19 * z + o2, y - 19 * z],
      a2 = [x - 19 * z + o2 + 38 * z * d, y - 19 * z + 38 * z * d];
    strokePts(c, [a1, a2], '#0A0505', 7 * z, (1 - p) * 0.9);
    strokePts(c, [a1, a2], pal[1], 3 * z, 1 - p);
    strokePts(c, [a1, a2], '#FFE5E5', Number(z), 1 - p);
  }
}

// Impact burst for steel moves: eight metallic rays and a white glint.
function impactMetal(c, { x, y, p, q, z, pal }) {
  for (let j = 0; j < 8; j++) {
    const an = (j / 8) * 6.283;
    strokePts(
      c,
      [
        [x, y],
        [x + Math.cos(an) * (6 + 18 * q) * z, y + Math.sin(an) * (6 + 18 * q) * z],
      ],
      j % 2 ? pal[0] : pal[2],
      1.6 * z,
      1 - p
    );
  }
  glowDot(c, x, y, 16 * z, '#FFFFFF', (1 - p) * 0.7);
}

// Impact burst for poison moves: rising bubbles.
function impactBubble(c, { x, y, p, q, z, pal }) {
  for (let j = 0; j < 8; j++) {
    const an = (j / 8) * 6.283;
    ringAt(
      c,
      x + Math.cos(an) * 12 * z * q,
      y + Math.sin(an) * 8 * z * q - 16 * z * q * ((j % 3) / 2),
      (2 + 3 * q) * z,
      pal[j % 2],
      1 - p,
      1.2 * z
    );
  }
}

// Impact burst for fairy moves: swirling stars.
function impactSparkle(c, { x, y, p, q, z, pal }) {
  for (let j = 0; j < 7; j++) {
    const an = (j / 7) * 6.283 + q * 2;
    shape(
      c,
      'star',
      x + Math.cos(an) * 16 * q * z,
      y + Math.sin(an) * 12 * q * z - 6 * q * z,
      2.6 * z,
      q * 3,
      pal[j % 3],
      1 - p
    );
  }
}

// Impact burst for bug moves: a spiral of tiny dots.
function impactSwarm(c, { x, y, p, q, z, pal }) {
  for (let j = 0; j < 14; j++) {
    const an = j * 2.4 + q * 6;
    shape(
      c,
      'dot',
      x + Math.cos(an) * (8 + 10 * q) * z,
      y + Math.sin(an) * (6 + 8 * q) * z,
      1.3 * z,
      0,
      pal[j % 2],
      1 - p
    );
  }
}

// Impact burst for flying moves: four spinning gust arcs.
function impactWind(c, { x, y, p, q, z, pal }) {
  for (let j = 0; j < 4; j++) {
    c.globalAlpha = (1 - p) * 0.8;
    c.strokeStyle = pal[0];
    c.lineWidth = 1.6 * z;
    c.beginPath();
    c.arc(x, y, (6 + 6 * j + 12 * q) * z, q * 4 + j, q * 4 + j + 2.2);
    c.stroke();
  }
}

/* impact: Fighting, Normal */
// Default impact burst: a glow, eight rays and a ring.
function impactHit(c, { x, y, p, q, z, pal }) {
  glowDot(c, x, y, (22 - 6 * p) * z, pal[0], (1 - p) * 0.8);
  for (let j = 0; j < 8; j++) {
    const an = (j / 8) * 6.283 + 0.2;
    strokePts(
      c,
      [
        [x + Math.cos(an) * 6 * z, y + Math.sin(an) * 6 * z],
        [x + Math.cos(an) * (10 + 18 * q) * z, y + Math.sin(an) * (10 + 18 * q) * z],
      ],
      j % 2 ? pal[1] : pal[2],
      2.2 * z * (1 - p * 0.6),
      1 - p
    );
  }
  ringAt(c, x, y, (6 + 22 * q) * z, pal[1], (1 - p) * 0.8, 2 * z);
}

/* impact image and shake on big hits */
// On big hits, schedules a screen flash and a board shake at the moment of impact; returns the hit delay.
function fxBigHit(atk) {
  const { e, dur, ti } = atk;
  const hitAt = dur * ti;
  if (e.big) {
    fxAdd(dur * 0.16, drawImpactFlash, hitAt);
    setTimeout(shakeBoard, hitAt);
  }
  return hitAt;
}

// Draws one frame of the full-canvas flash of a big hit.
function drawImpactFlash(c, p) {
  c.globalCompositeOperation = 'lighter';
  c.globalAlpha = (1 - p) * 0.22;
  c.fillStyle = '#FFF1D0';
  c.fillRect(0, 0, EFFECTS_CANVAS.cv.width, EFFECTS_CANVAS.cv.height);
}

// Replays the board impact animation and toggles the shake class, if the board is still shown.
function shakeBoard() {
  if (!$('#bBoard')) {
    return;
  }
  bdReplay('impact');
  bdClass('impact', true);
  setTimeout(() => bdClass('impact', false), 340);
}

// Trajectory drawn before the impact, per effect kind.
const TRAJECTORIES = { bolt: fxBoltTrail, jet: fxJetTrail, wave: fxWave, psy: fxPsyTrail };

// Impact burst drawn on each hit tile, per effect kind (impactHit for the others).
const IMPACTS = {
  bolt: impactBolt,
  flame: impactFlame,
  jet: impactSplash,
  wave: impactSplash,
  leaf: impactLeaf,
  psy: impactPsy,
  wisp: impactWisp,
  rock: impactGround,
  quake: impactGround,
  ice: impactIce,
  slash: impactSlash,
  metal: impactMetal,
  bubble: impactBubble,
  sparkle: impactSparkle,
  swarm: impactSwarm,
  wind: impactWind,
};

function fxGuard(e, dur) {
  const guardianRef = byUid(battle, e.u);
  return withDepth(guardianRef ? unitKey(guardianRef) : null, () => fxGuardPlat(e, dur));
}

function fxGuardPlat(e, dur) {
  const g = byUid(battle, e.u),
    v = byUid(battle, e.v);
  if (!g || !v) {
    return;
  }
  const G = fxP(unitKey(g)),
    V = fxP(unitKey(v)),
    z = EFFECTS_CANVAS.s * (EFFECTS_CANVAS.zk || 1);
  fxAdd(dur * 0.7, (c, p) => {
    c.globalCompositeOperation = 'lighter';
    const q = eo(p);
    hexAt(c, G[0], G[1], (16 + 10 * q) * z, '#F2DDA8', 1 - p, 2.6 * z);
    hexAt(c, G[0], G[1], (12 + 6 * q) * z, '#FFF6DE', (1 - p) * 0.7, 1.2 * z);
    strokePts(c, [V, G], '#E9C97E', 2 * z, (1 - p) * 0.7);
    glowDot(c, G[0], G[1], 24 * z, '#D4AF6A', (1 - p) * 0.4);
  });
}

/* hook into event playback */
export function playEv(ev) {
  liveEvent(ev); // lunge toward the target, vibrations (v4.29)
  // the board changed (grass cut down): redraw it after the animation
  if (ev.some(x => x.e === 'terrain')) {
    setTimeout(
      () => {
        if (battle) {
          buildBoard();
          renderAll();
        }
      },
      PREFERENCES.fast || ui.skipSpeedup ? 500 : 900
    );
  }
  const fx = ev.filter(x => x.e === 'fx');
  if (!fx.length || !battle || !effectsEnabled() || !fxPrep()) {
    playLog(ev.filter(x => x.e !== 'fx'));
    impactWords(ev);
    return;
  }
  const dur = ui.skipSpeedup ? 300 : PREFERENCES.fast ? 440 : 720;
  let hit = 0;
  fx.forEach((x, i) => {
    hit = Math.max(hit, fxAttack(x, dur) + i * 90);
  });
  const S0 = battle,
    rest = ev.filter(x => x.e !== 'fx' && x.e !== 'use');
  setTimeout(() => {
    if (!battle || battle !== S0) {
      return;
    }
    playLog(rest);
    rest.filter(x => x.e === 'guard').forEach(x => fxGuard(x, dur));
  }, Math.round(hit));
  impactWords(ev);
}

/* ===================== v1.1: per-type attack effects (ephemeral canvas layer, no idle loop) ===================== */
export const EFFECTS_CANVAS = { cv: null, ctx: null, items: [], raf: 0, s: 1, ox: 0, oy: 0, on: null };

const FXC = {
  Feu: ['#FFF3B0', '#FFB23E', '#FF5A1F', '#B3200E'],
  Eau: ['#E6F7FF', '#7FD0FF', '#2F8CFF', '#1546A8'],
  Électrik: ['#FFFFFF', '#FFF27A', '#FFD21F', '#B88A00'],
  Plante: ['#E9FFB8', '#8EE05A', '#3FA33A', '#1F5E22'],
  Glace: ['#FFFFFF', '#CFF6FF', '#7FE0F5', '#3BA6C9'],
  Psy: ['#FFE0F2', '#FF8AD0', '#C94BFF', '#5A1A8F'],
  Spectre: ['#E8D5FF', '#A77BFF', '#6B3FC9', '#2A1450'],
  Roche: ['#EAD9B8', '#B89A6A', '#7A6242', '#3E3020'],
  Sol: ['#F2DFB0', '#C9A15E', '#8C6A35', '#4A3518'],
  Combat: ['#FFE6D0', '#FF9A6A', '#E2522B', '#7A2410'],
  Normal: ['#FFFFFF', '#E6E2D8', '#B8B2A6', '#6E6A62'],
  Vol: ['#FFFFFF', '#DDEBFF', '#A9C8F2', '#6A8DBE'],
  Insecte: ['#F3FFB0', '#C8E25A', '#8DB320', '#4A6410'],
  Poison: ['#F5D9FF', '#C77BE8', '#8E3FB5', '#4A1764'],
  Ténèbres: ['#F2D8D8', '#A04848', '#4A1E1E', '#120A0A'],
  Acier: ['#FFFFFF', '#DDE3EA', '#9AA6B2', '#4F5864'],
  Dragon: ['#E5E0FF', '#8F7BFF', '#5A3FE0', '#251880'],
  Fée: ['#FFF0F8', '#FFB8E0', '#FF7CC4', '#B03A84'],
};

const FXK = {
  Feu: 'flame',
  Dragon: 'flame',
  Électrik: 'bolt',
  Eau: 'jet',
  Plante: 'leaf',
  Psy: 'psy',
  Spectre: 'wisp',
  Roche: 'rock',
  Sol: 'quake',
  Glace: 'ice',
  Combat: 'impact',
  Normal: 'impact',
  Vol: 'wind',
  Insecte: 'swarm',
  Poison: 'bubble',
  Ténèbres: 'slash',
  Acier: 'metal',
  Fée: 'sparkle',
};

const fxP = k => {
  const [x, y] = cellCenter(k);
  return [EFFECTS_CANVAS.ox + x * EFFECTS_CANVAS.s, EFFECTS_CANVAS.oy + y * EFFECTS_CANVAS.s];
};

const lp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

// Statements run at startup, in the original order (see index.js).
export function init() {
  /* tools */
  ((R0 = Math.random), (cl01 = v => (v < 0 ? 0 : v > 1 ? 1 : v)), (eo = t => 1 - Math.pow(1 - t, 3)));
}
