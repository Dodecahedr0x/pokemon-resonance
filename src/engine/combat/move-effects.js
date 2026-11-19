import { bdClass, bdReplay, getHost, hostSet } from '../../screens/combat/board/boardStore.js';

import { $, RM } from '../core/utils.js';
import { byUid, uk } from './engine.js';
import { B, HC, TILT, VB, VERT, buildBoard, playLog, renderAll, tiltS, ui } from './ui.js';
import { PREF } from '../ui/preferences.js';
import { impactWords } from '../progression/prestige.js';
import { liveEvent } from './expressive-pokemon.js';

let R0, cl01, eo;

export function fxOn() {
  if (RM || /jsdom/i.test(navigator.userAgent || '')) {
    return false;
  }
  if (FXS.on === null) {
    try {
      const c = document.createElement('canvas');
      FXS.on = !!(c.getContext && c.getContext('2d'));
    } catch (e) {
      FXS.on = false;
    }
  }
  return FXS.on;
}

export function fxReset() {
  FXS.items = [];
  if (FXS.raf) {
    cancelAnimationFrame(FXS.raf);
  }
  FXS.raf = 0;
  if (FXS.ctx && FXS.cv) {
    FXS.ctx.clearRect(0, 0, FXS.cv.width, FXS.cv.height);
  }
}

export function fxPrep() {
  const bd = $('#bBoard'),
    svg = $('#bSvg');
  if (!bd || !svg) {
    return false;
  }
  // canvas.fxc canvas: rendered by React (Board.jsx) on the first effect; size and drawing here
  if (!getHost().fxc) {
    hostSet({ fxc: true });
  }
  const cv = bd.querySelector('canvas.fxc');
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
  const [vw, vh] = VB(),
    s = Math.min(r.width / vw, r.height / vh);
  FXS.s = s * dpr;
  FXS.ox = ((r.width - vw * s) / 2) * dpr;
  FXS.oy = ((r.height - vh * s) / 2) * dpr;
  FXS.cv = cv;
  FXS.ctx = cv.getContext('2d');
  return !!FXS.ctx;
}

function fxLoop(now) {
  const c = FXS.ctx,
    cv = FXS.cv;
  if (!c) {
    FXS.raf = 0;
    return;
  }
  c.clearRect(0, 0, cv.width, cv.height);
  FXS.items = FXS.items.filter(it => {
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
  if (FXS.items.length) {
    FXS.raf = requestAnimationFrame(fxLoop);
  } else {
    FXS.raf = 0;
    c.clearRect(0, 0, cv.width, cv.height);
  }
}

export function fxAdd(d, f, delay) {
  FXS.items.push({ t0: performance.now() + (delay || 0), d, f });
  if (!FXS.raf) {
    FXS.raf = requestAnimationFrame(fxLoop);
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
    const an = (Math.PI / 3) * i + (VERT ? 0 : Math.PI / 6);
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
  if (!TILT.on || k == null) {
    return 1;
  }
  const [x, y] = HC(k);
  return Math.max(0.6, Math.min(1.4, tiltS(x, y)));
}

function withDepth(k, f, topEdge) {
  const oy = FXS.oy;
  FXS.zk = depth(k);
  // shots leave from the standing Pokémon's body, not from the ground ring (positions frozen at call time)
  if (TILT.on && topEdge) {
    FXS.oy = oy - 10 * FXS.zk * FXS.s;
  }
  try {
    return f();
  } finally {
    FXS.zk = 1;
    FXS.oy = oy;
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

function fxAttackPlat(e, dur) {
  const z = FXS.s * (FXS.zk || 1),
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
  if (e.st || self) {
    T.forEach((t, i) =>
      fxAdd(
        dur * 0.9,
        (c, p) => {
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
        },
        i * 40
      )
    );
    return dur * 0.3;
  }
  const path = t => (rock ? [A, rock, t] : [A, t]);
  /* trajectory */
  if (kind === 'bolt') {
    T.forEach(t =>
      fxAdd(dur * (ti + 0.28), (c, p) => {
        c.globalCompositeOperation = 'lighter';
        const f = Math.sin(p * 40) > -0.3 ? 1 : 0.35;
        const P = rock ? [...jag(A, rock, 5, 6 * z), ...jag(rock, t, 5, 6 * z).slice(1)] : jag(A, t, 9, 7 * z);
        strokePts(c, P, pal[3], 7 * z, 0.35 * f);
        strokePts(c, P, pal[2], 3.4 * z, 0.8 * f);
        strokePts(c, P, '#FFFFFF', 1.4 * z, f);
        if (p < 0.25) {
          glowDot(c, A[0], A[1], 16 * z, pal[1], 0.6);
        }
      })
    );
  } else if (kind === 'jet') {
    T.forEach(t =>
      fxAdd(dur * (ti + 0.25), (c, p) => {
        const P = path(t),
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
      })
    );
  } else if (kind === 'wave') {
    const C = e.sh === 'ring' ? A : fxP(e.k);
    fxAdd(dur, (c, p) => {
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
    });
  } else if (kind === 'psy') {
    T.forEach(t =>
      fxAdd(dur * (ti + 0.05), (c, p) => {
        const P = path(t),
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
      })
    );
  } else if (kind === 'slash' || kind === 'quake') {
    /* on contact or on the ground: the effect is born at the impact */
  }
  if (kind === 'flame') {
    T.forEach(t =>
      fxAdd(dur * (ti + 0.2), (c, p) => {
        const P = path(t),
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
      })
    );
  } else {
    /* projectiles and particles */
    const N =
      kind === 'flame'
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
    const ps = [];
    T.forEach((t, ti2) => {
      for (let i = 0; i < Math.max(1, Math.round(N / T.length)); i++) {
        ps.push({ t, b: R0() * 0.22, j: R0() - 0.5, r: 0.6 + R0() * 0.7, rot: R0() * 6.28, ti: ti2 });
      }
    });
    fxAdd(dur * (ti + 0.12), (c, p) => {
      c.globalCompositeOperation = kind === 'rock' || kind === 'slash' ? 'source-over' : 'lighter';
      ps.forEach(o => {
        const u = cl01((p - o.b) / (ti - o.b * 0.5));
        if (u <= 0 || u >= 1) {
          return;
        }
        const P = path(o.t),
          q = along(P, eo(u)),
          dx = o.t[0] - A[0],
          dy = o.t[1] - A[1],
          L = Math.hypot(dx, dy) || 1,
          nx = -dy / L,
          ny = dx / L;
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
        const s =
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
          o.r;
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
      });
    });
  }
  /* ricochet: spark on the rock */
  if (rock) {
    fxAdd(
      dur * 0.3,
      (c, p) => {
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
      },
      dur * ti * 0.5
    );
  }
  /* impact on each tile hit */
  T.forEach((t, i) => {
    const delay = dur * ti * (e.sh === 'line' ? 0.65 + (0.35 * i) / Math.max(1, T.length - 1) : 1);
    fxAdd(
      dur * 0.62,
      (c, p) => {
        const q = eo(p),
          x = t[0],
          y = t[1];
        c.globalCompositeOperation = 'lighter';
        if (kind === 'bolt') {
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
        } else if (kind === 'flame') {
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
        } else if (kind === 'jet' || kind === 'wave') {
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
        } else if (kind === 'leaf') {
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
        } else if (kind === 'psy') {
          for (let j = 0; j < 3; j++) {
            const qq = cl01(q * 1.4 - j * 0.22);
            ringAt(c, x, y, (4 + 28 * qq) * z, j % 2 ? pal[2] : pal[1], (1 - qq) * (1 - p * 0.5), 2.2 * z);
          }
          glowDot(c, x, y, 20 * z, pal[2], (1 - p) * 0.4);
        } else if (kind === 'wisp') {
          c.globalCompositeOperation = 'source-over';
          glowDot(c, x, y, 26 * z * q + 8 * z, 'rgba(40,16,80,1)', (1 - p) * 0.55);
          c.globalCompositeOperation = 'lighter';
          ringAt(c, x, y, (6 + 18 * q) * z, pal[1], 1 - p, 1.6 * z);
        } else if (kind === 'rock' || kind === 'quake') {
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
        } else if (kind === 'ice') {
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
        } else if (kind === 'slash') {
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
        } else if (kind === 'metal') {
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
        } else if (kind === 'bubble') {
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
        } else if (kind === 'sparkle') {
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
        } else if (kind === 'swarm') {
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
        } else if (kind === 'wind') {
          for (let j = 0; j < 4; j++) {
            c.globalAlpha = (1 - p) * 0.8;
            c.strokeStyle = pal[0];
            c.lineWidth = 1.6 * z;
            c.beginPath();
            c.arc(x, y, (6 + 6 * j + 12 * q) * z, q * 4 + j, q * 4 + j + 2.2);
            c.stroke();
          }
        } else {
          /* impact: Fighting, Normal */ glowDot(c, x, y, (22 - 6 * p) * z, pal[0], (1 - p) * 0.8);
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
      },
      delay
    );
  });
  /* impact image and shake on big hits */
  const hitAt = dur * ti;
  if (e.big) {
    fxAdd(
      dur * 0.16,
      (c, p) => {
        c.globalCompositeOperation = 'lighter';
        c.globalAlpha = (1 - p) * 0.22;
        c.fillStyle = '#FFF1D0';
        c.fillRect(0, 0, FXS.cv.width, FXS.cv.height);
      },
      hitAt
    );
    setTimeout(() => {
      if (!$('#bBoard')) {
        return;
      }
      bdReplay('impact');
      bdClass('impact', true);
      setTimeout(() => bdClass('impact', false), 340);
    }, hitAt);
  }
  return hitAt;
}

function fxGuard(e, dur) {
  const guardianRef = byUid(B, e.u);
  return withDepth(guardianRef ? uk(guardianRef) : null, () => fxGuardPlat(e, dur));
}

function fxGuardPlat(e, dur) {
  const g = byUid(B, e.u),
    v = byUid(B, e.v);
  if (!g || !v) {
    return;
  }
  const G = fxP(uk(g)),
    V = fxP(uk(v)),
    z = FXS.s * (FXS.zk || 1);
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
        if (B) {
          buildBoard();
          renderAll();
        }
      },
      PREF.fast || ui.skipSpeedup ? 500 : 900
    );
  }
  const fx = ev.filter(x => x.e === 'fx');
  if (!fx.length || !B || !fxOn() || !fxPrep()) {
    playLog(ev.filter(x => x.e !== 'fx'));
    impactWords(ev);
    return;
  }
  const dur = ui.skipSpeedup ? 300 : PREF.fast ? 440 : 720;
  let hit = 0;
  fx.forEach((x, i) => {
    hit = Math.max(hit, fxAttack(x, dur) + i * 90);
  });
  const S0 = B,
    rest = ev.filter(x => x.e !== 'fx' && x.e !== 'use');
  setTimeout(() => {
    if (!B || B !== S0) {
      return;
    }
    playLog(rest);
    rest.filter(x => x.e === 'guard').forEach(x => fxGuard(x, dur));
  }, Math.round(hit));
  impactWords(ev);
}

/* ===================== v1.1: per-type attack effects (ephemeral canvas layer, no idle loop) ===================== */
export const FXS = { cv: null, ctx: null, items: [], raf: 0, s: 1, ox: 0, oy: 0, on: null };

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
  const [x, y] = HC(k);
  return [FXS.ox + x * FXS.s, FXS.oy + y * FXS.s];
};

const lp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

// Statements run at startup, in the original order (see index.js).
export function init() {
  /* tools */
  ((R0 = Math.random), (cl01 = v => (v < 0 ? 0 : v > 1 ? 1 : v)), (eo = t => 1 - Math.pow(1 - t, 3)));
}
