/* Living map (deep overhaul of the map) (added in v4.71). */

import { GYMS } from '../data/game-data.js';
import { SCEN } from '../pokemon/pokemon.js';
import { ARENAS } from '../modes/gyms.js';
import { hash2, mulberry32, tc } from '../core/utils.js';
import { HOOKS } from '../core/hooks.js';
import { V4 } from '../ui/screen-state.js';
import { CHAIN, MAP_SVG, curvePath, placeState } from './map.js';
import { JCHAIN, JMAP_SVG, placesR } from './johto.js';
import { HCHAIN, HMAP_SVG } from './hoenn.js';
import { refreshMap } from '../../screens/map/mapStore.js';

// Map painting, layers and fog (v4.71), read by React (src/screens/map/Stage.jsx):
// { PAINT: {region: {state, url, lights, sparks, smoke}}, REG, fxSvg, fxHtml, fogSvg }.
export let LIVING_MAP;

const VW = 1000;

const VH = 640;

const SC = 2;

const Q = 2;

const GW = VW / Q;

const GH = VH / Q;

/* ---------- randomness and noise (deterministic): mulberry32 and hash2 (014) ---------- */
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

const vnoise = (x, y, s) => {
  const xi = Math.floor(x),
    yi = Math.floor(y),
    xf = x - xi,
    yf = y - yi;
  const a = hash2(xi, yi, s),
    b = hash2(xi + 1, yi, s),
    c = hash2(xi, yi + 1, s),
    d = hash2(xi + 1, yi + 1, s);
  const u = xf * xf * (3 - 2 * xf),
    v = yf * yf * (3 - 2 * yf);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
};

const fbm = (x, y, s, o) => {
  let v = 0,
    amp = 0.5,
    f = 1,
    n = 0;
  for (let i = 0; i < o; i++) {
    v += vnoise(x * f, y * f, s + i * 17) * amp;
    n += amp;
    amp *= 0.5;
    f *= 2.03;
  }
  return v / n;
};

const noiseField = (seed, scale, oct) => {
  scale /= Q;
  const hw = GW / 2 + 2,
    hh = GH / 2 + 2,
    half = new Float32Array(hw * hh);
  for (let y = 0; y < hh; y++) {
    for (let x = 0; x < hw; x++) {
      half[y * hw + x] = fbm((x * 2) / scale, (y * 2) / scale, seed, oct);
    }
  }
  const out = new Float32Array(GW * GH);
  for (let y = 0; y < GH; y++) {
    const y0 = y >> 1,
      ty = (y & 1) * 0.5;
    for (let x = 0; x < GW; x++) {
      const x0 = x >> 1,
        tx = (x & 1) * 0.5,
        i = y0 * hw + x0;
      const a = half[i],
        b = half[i + 1],
        c = half[i + hw],
        d = half[i + hw + 1];
      out[y * GW + x] = (a + (b - a) * tx) * (1 - ty) + (c + (d - c) * tx) * ty;
    }
  }
  return out;
};

const blur = (src, r, passes) => {
  r = Math.max(1, Math.round(r / Q));
  const w = GW,
    h = GH,
    a = Float32Array.from(src),
    b = new Float32Array(w * h),
    k = 1 / (2 * r + 1);
  for (let p = 0; p < passes; p++) {
    for (let y = 0; y < h; y++) {
      const o = y * w;
      let acc = 0;
      for (let x = -r; x <= r; x++) {
        acc += a[o + clamp(x, 0, w - 1)];
      }
      for (let x = 0; x < w; x++) {
        b[o + x] = acc * k;
        acc += a[o + Math.min(w - 1, x + r + 1)] - a[o + Math.max(0, x - r)];
      }
    }
    for (let x = 0; x < w; x++) {
      let acc = 0;
      for (let y = -r; y <= r; y++) {
        acc += b[clamp(y, 0, h - 1) * w + x];
      }
      for (let y = 0; y < h; y++) {
        a[y * w + x] = acc * k;
        acc += b[Math.min(h - 1, y + r + 1) * w + x] - b[Math.max(0, y - r) * w + x];
      }
    }
  }
  return a;
};

const mkCanvas = (w, h) => {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
};

/* mask: [{d, fill:true} | {d, w}] -> Float32 (0..1) */
const maskOf = items => {
  const c = mkCanvas(GW, GH),
    x = c.getContext('2d');
  x.scale(1 / Q, 1 / Q);
  x.fillStyle = '#fff';
  x.strokeStyle = '#fff';
  x.lineCap = 'round';
  x.lineJoin = 'round';
  items.forEach(it => {
    const P = new Path2D(it.d);
    if (it.fill) {
      x.fill(P);
    } else {
      x.lineWidth = it.w;
      x.stroke(P);
    }
  });
  const d = x.getImageData(0, 0, GW, GH).data,
    out = new Float32Array(GW * GH);
  for (let i = 0; i < out.length; i++) {
    out[i] = d[i * 4 + 3] / 255;
  }
  c.width = 0;
  return out;
};

const tick = () => new Promise(r => setTimeout(r, 0));

/* ---------- data for each region ---------- */
const landOf = svg => {
  const out = [],
    re = /<path d="([^"]+)"[^>]*?fill="(url\(#[mjh]Land\)|#5c8a43)"/g;
  let m;
  while ((m = re.exec(svg))) {
    out.push(m[1]);
  }
  return [...new Set(out)];
};

const REG = {
  kanto: {
    seed: 11,
    svg: () => MAP_SVG,
    grass: { d: [74, 134, 64], l: [124, 178, 84], m: [170, 202, 110] },
    sea: { deep: [14, 56, 108], mid: [26, 108, 172], shal: [64, 182, 206] },
    beach: 0.72,
    mounts: [
      [470, 168, 1.3, 1],
      [532, 214, 1.05, 1],
      [500, 266, 0.9, 1],
      [560, 150, 0.9, 1],
      [428, 118, 0.8, 1],
      [602, 250, 0.75, 1],
      [392, 96, 0.6, 0],
      [628, 202, 0.6, 1],
      [168, 172, 0.62, 0],
      [244, 108, 0.58, 0],
      [146, 206, 0.45, 0],
      [560, 282, 0.5, 0],
    ],
    forests: [
      ['b', 400, 336, 34, 9],
      ['b', 232, 262, 13, 8],
      ['b', 700, 430, 12, 8],
      ['b', 118, 410, 10, 7.5],
      ['b', 905, 370, 8, 7],
      ['b', 562, 446, 7, 7],
      ['p', 340, 150, 10, 7],
      ['p', 640, 168, 8, 7],
      ['b', 760, 334, 7, 7],
      ['b', 248, 566, 7, 7],
      ['p', 378, 112, 7, 6],
      ['p', 650, 272, 6, 6],
      ['b', 470, 560, 6, 7],
      ['b', 780, 220, 6, 7],
    ],
    biomes: [
      ['meadow', 250, 430, 150, 95],
      ['meadow', 735, 335, 150, 100],
      ['desert', 852, 258, 96, 62],
      ['marsh', 626, 515, 74, 46],
      ['rocky', 338, 440, 62, 40],
      ['rocky', 425, 478, 46, 30],
      ['mystic', 668, 318, 56, 38],
      ['mountain', 512, 190, 160, 112],
      ['mountain', 196, 150, 80, 60],
      ['lava', 870, 546, 46, 34],
    ],
    lakes: ['M150 330c-6-22 18-38 40-30 22 7 22 36 0 44-17 6-35 2-40-14Z'],
    rivers: ['M462 196C430 250 420 280 380 300S330 360 340 400 300 470 296 520 300 590 312 610'],
    marks: [
      ['tower', 206, 112],
      ['temple', 520, 102],
      ['stadium', 744, 128],
      ['volcano', 888, 532],
      ['lab', 90, 504],
    ],
    side: [
      ['a1', 'gue'],
      ['a1', 'roche'],
      ['a3', 'tour'],
      ['a8', 'ligue'],
      ['a4', 'safari'],
    ],
    chain: () => CHAIN,
    title: 'Kanto',
    sub: 'Région de la Résonance',
  },
  johto: {
    seed: 23,
    svg: () => JMAP_SVG,
    grass: { d: [70, 128, 68], l: [120, 172, 88], m: [162, 196, 112] },
    sea: { deep: [12, 46, 96], mid: [24, 94, 158], shal: [58, 164, 200] },
    beach: 0.7,
    mounts: [
      [800, 128, 1.25, 1],
      [860, 198, 0.95, 1],
      [720, 118, 0.85, 1],
      [762, 160, 0.6, 1],
      [112, 298, 0.9, 0],
      [90, 360, 0.72, 0],
      [930, 300, 0.8, 0],
      [150, 172, 0.6, 0],
      [905, 250, 0.55, 1],
    ],
    forests: [
      ['b', 520, 548, 26, 8],
      ['b', 300, 300, 13, 8],
      ['b', 760, 470, 11, 8],
      ['b', 250, 520, 9, 7],
      ['a', 420, 244, 24, 9],
      ['a', 340, 205, 9, 7],
      ['a', 490, 280, 7, 7],
      ['s', 700, 168, 14, 8],
      ['s', 880, 248, 8, 7],
      ['b', 640, 400, 7, 7],
      ['b', 120, 520, 6, 6],
    ],
    biomes: [
      ['autumn', 420, 232, 140, 95],
      ['snow', 705, 168, 155, 92],
      ['meadow', 560, 470, 165, 92],
      ['rocky', 150, 430, 62, 40],
      ['mountain', 820, 170, 120, 84],
      ['dark', 300, 455, 58, 40],
      ['mountain', 100, 330, 60, 70],
    ],
    lakes: ['M548 92c-14-24 20-44 56-40 40 4 58 26 44 46-14 20-84 22-100-6Z'],
    rivers: ['M600 104C620 140 640 180 690 230S760 300 805 360 870 410 905 440'],
    marks: [
      ['pagoda', 456, 176],
      ['lighthouse', 138, 232],
      ['shrine', 902, 320],
    ],
    whirl: [
      [150, 590],
      [230, 612],
      [90, 560],
    ],
    side: [['j7', 'jlac']],
    chain: () => JCHAIN,
    title: 'Johto',
    sub: 'Terres des traditions',
  },
  hoenn: {
    seed: 37,
    svg: () => HMAP_SVG,
    grass: { d: [58, 132, 70], l: [114, 184, 90], m: [156, 206, 108] },
    sea: { deep: [12, 62, 116], mid: [24, 126, 184], shal: [76, 204, 212] },
    beach: 0.78,
    reef: 1,
    mounts: [
      [420, 190, 0.9, 0],
      [540, 168, 0.85, 0],
      [566, 214, 0.6, 0],
      [380, 232, 0.6, 0],
      [300, 300, 0.65, 0],
      [610, 175, 0.55, 0],
    ],
    forests: [
      ['j', 220, 400, 30, 8.5],
      ['j', 600, 452, 11, 8],
      ['j', 380, 430, 11, 8],
      ['j', 110, 330, 7, 7],
      ['b', 760, 300, 8, 7],
      ['j', 470, 470, 7, 7],
      ['b', 300, 470, 6, 7],
    ],
    biomes: [
      ['desert', 650, 250, 128, 74],
      ['ash', 480, 200, 118, 74],
      ['jungle', 220, 400, 148, 94],
      ['meadow', 560, 430, 135, 72],
      ['dark', 715, 445, 48, 34],
    ],
    lakes: [],
    rivers: ['M330 300C320 340 300 380 292 420S282 480 300 506'],
    marks: [
      ['volcano', 470, 168, 1.2],
      ['pillar', 784, 98],
      ['crater', 872, 262],
    ],
    palms: [
      [330, 548],
      [350, 556],
      [815, 458],
      [860, 470],
      [880, 250],
      [160, 470],
      [110, 430],
    ],
    side: [],
    chain: () => HCHAIN,
    title: 'Hoenn',
    sub: 'Archipel des légendes',
  },
};

const BIO = {
  meadow: [[170, 210, 104], 0.5],
  desert: [[230, 198, 132], 0.95],
  marsh: [[76, 102, 84], 0.8],
  rocky: [[156, 146, 126], 0.6],
  mystic: [[150, 128, 182], 0.32],
  mountain: [[150, 146, 128], 0.5],
  autumn: [[206, 128, 60], 0.72],
  snow: [[234, 242, 248], 0.9],
  dark: [[74, 74, 90], 0.55],
  jungle: [[40, 112, 62], 0.7],
  ash: [[122, 114, 112], 0.85],
  lava: [[116, 62, 44], 0.8],
};

const PROPS = {
  Électrik: ['pylon', 'pylon', 'pylon'],
  Glace: ['ice', 'ice', 'pineS'],
  Spectre: ['grave', 'grave', 'dead'],
  Feu: ['lava', 'boulderD'],
  Psy: ['obelisk', 'obelisk'],
  Combat: ['dojo', 'boulder'],
  Vol: ['windmill', 'bush'],
  Insecte: ['bigflower', 'bigflower', 'bush'],
  Poison: ['toxic', 'toxic'],
  Sol: ['cactus', 'boulder', 'cactus'],
  Eau: ['reeds', 'reeds'],
  Plante: ['flowers', 'flowers'],
  Normal: ['house', 'house'],
  Acier: ['crane', 'crate'],
  Dragon: ['spire', 'spire'],
  Ténèbres: ['dead', 'dead'],
  Roche: ['boulder', 'boulder', 'boulder'],
  Fée: ['mush', 'mush'],
};

const typeCol = t => {
  try {
    return t ? tc(t) : '#c94a3a';
  } catch (e) {
    return '#c94a3a';
  }
};

const placesOf = reg => {
  const old = V4.region;
  try {
    V4.region = reg;
    return placesR().map(p => {
      const S = SCEN[p.id] || {};
      let t = S.at || '';
      try {
        const arenaIdx = ARENAS.findIndex(a => a.k === p.id);
        if (arenaIdx >= 0) {
          t = GYMS[arenaIdx].t;
        }
      } catch {
        /* Best effort: failure here is non-fatal. */
      }
      return { id: p.id, x: p.x, y: p.y, grp: p.grp, t };
    });
  } finally {
    V4.region = old;
  }
};

const routesOf = (reg, R, P) => {
  const by = Object.fromEntries(P.map(p => [p.id, p]));
  const out = [];
  let ch = [];
  try {
    ch = R.chain()
      .map(id => by[id])
      .filter(Boolean);
  } catch {
    /* Best effort: failure here is non-fatal. */
  }
  ch.slice(1).forEach((b, i) => out.push(curvePath(ch[i], b, i)));
  R.side.forEach(([a, b], i) => by[a] && by[b] && out.push(curvePath(by[a], by[b], i + 1)));
  const tiedOnes = new Set(ch.map(p => p.id));
  R.side.forEach(([a, b]) => (tiedOnes.add(a), tiedOnes.add(b)));
  P.filter(p => !tiedOnes.has(p.id)).forEach((p, i) => {
    let best = null,
      bd = 1e9;
    P.filter(q => tiedOnes.has(q.id)).forEach(q => {
      const d = Math.hypot(q.x - p.x, q.y - p.y);
      if (d < bd) {
        ((bd = d), (best = q));
      }
    });
    if (best && bd < 260) {
      out.push(curvePath(best, p, i + 2));
    }
  });
  return out;
};

/* ---------- small drawings (viewBox units, ctx already scaled) ---------- */
const circ = (c, x, y, r) => {
  c.beginPath();
  c.arc(x, y, r, 0, 6.2832);
  c.fill();
};

const ell = (c, x, y, rx, ry) => {
  c.beginPath();
  c.ellipse(x, y, rx, ry, 0, 0, 6.2832);
  c.fill();
};

const poly = (c, pts) => {
  c.beginPath();
  pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.closePath();
  c.fill();
};

const shadow = (c, x, y, rx, ry) => {
  c.fillStyle = 'rgba(16,28,12,.28)';
  ell(c, x + rx * 0.35, y + ry * 0.2, rx, ry);
};

const TPAL = {
  b: [
    ['#2b6131', '#3e8942', '#6db45a'],
    ['#2f6a2f', '#468f3c', '#7cbc58'],
    ['#285a36', '#3a7f4a', '#62aa62'],
  ],
  a: [
    ['#8a3a1c', '#cc6a2a', '#f0aa4c'],
    ['#7a2c20', '#b8452c', '#e8804a'],
    ['#8f5a1a', '#d4952e', '#f4cc5c'],
  ],
  j: [
    ['#18502e', '#277544', '#55ad62'],
    ['#1d5a2a', '#2f8040', '#68b85a'],
  ],
  d: [['#2a2a38', '#3d3a52', '#5f5a78']],
};

const broadleaf = (c, x, y, s, pal) => {
  shadow(c, x, y, 7 * s, 2.5 * s);
  c.fillStyle = '#5a3b22';
  c.fillRect(x - 0.9 * s, y - 4 * s, 1.8 * s, 4 * s);
  c.fillStyle = pal[0];
  circ(c, x - 3.4 * s, y - 6 * s, 4.6 * s);
  circ(c, x + 3.4 * s, y - 6 * s, 4.6 * s);
  circ(c, x, y - 9.6 * s, 5.2 * s);
  c.fillStyle = pal[1];
  circ(c, x - 3.8 * s, y - 7 * s, 3.4 * s);
  circ(c, x - 0.8 * s, y - 10.6 * s, 3.8 * s);
  circ(c, x + 2.6 * s, y - 7.4 * s, 2.8 * s);
  c.fillStyle = pal[2];
  circ(c, x - 2.3 * s, y - 11.6 * s, 1.8 * s);
  circ(c, x - 4.6 * s, y - 7.9 * s, 1.3 * s);
};

const pine = (c, x, y, s, snow) => {
  shadow(c, x, y, 5.5 * s, 2 * s);
  c.fillStyle = '#4e3420';
  c.fillRect(x - 0.7 * s, y - 3 * s, 1.4 * s, 3 * s);
  for (let k = 0; k < 3; k++) {
    const w = (5.6 - k * 1.5) * s,
      base = y - (2 + k * 4) * s,
      top = base - 7 * s;
    c.fillStyle = '#1d4631';
    poly(c, [
      [x - w, base],
      [x, top],
      [x + w, base],
    ]);
    c.fillStyle = '#2f6b47';
    poly(c, [
      [x - w, base],
      [x, top],
      [x + 0.2 * s, base],
    ]);
    if (snow) {
      c.fillStyle = '#eef6fb';
      poly(c, [
        [x - w * 0.45, top + 3.4 * s],
        [x, top],
        [x + w * 0.45, top + 3.4 * s],
        [x, top + 2.4 * s],
      ]);
    }
  }
};

const palm = (c, x, y, s) => {
  shadow(c, x + 3 * s, y, 7 * s, 2.2 * s);
  c.strokeStyle = '#7a5a32';
  c.lineWidth = 1.6 * s;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(x, y);
  c.quadraticCurveTo(x + 2 * s, y - 9 * s, x + Number(s), y - 17 * s);
  c.stroke();
  c.strokeStyle = '#2b8448';
  c.lineWidth = 2.2 * s;
  [
    [-9, -3],
    [9, -3],
    [-7, -9],
    [7, -9],
    [0, -11],
  ].forEach(([dx, dy]) => {
    c.beginPath();
    c.moveTo(x + s, y - 17 * s);
    c.quadraticCurveTo(x + s + dx * 0.6 * s, y - 20 * s + dy * 0.3 * s, x + s + dx * s, y - 17 * s - dy * s * -0.4);
    c.stroke();
  });
  c.fillStyle = '#6b4a24';
  circ(c, x + 1.6 * s, y - 16 * s, 1.1 * s);
};

const deadTree = (c, x, y, s) => {
  shadow(c, x, y, 5 * s, 1.8 * s);
  c.strokeStyle = '#2e2620';
  c.lineCap = 'round';
  c.lineWidth = 1.6 * s;
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(x, y - 12 * s);
  c.moveTo(x, y - 7 * s);
  c.lineTo(x - 4 * s, y - 11 * s);
  c.moveTo(x, y - 9 * s);
  c.lineTo(x + 4 * s, y - 13 * s);
  c.moveTo(x - 2.5 * s, y - 9.5 * s);
  c.lineTo(x - 3 * s, y - 13 * s);
  c.stroke();
};

const bush = (c, x, y, s, col) => {
  shadow(c, x, y, 4.5 * s, 1.5 * s);
  c.fillStyle = col || '#36803e';
  circ(c, x - 1.8 * s, y - 1.8 * s, 2.6 * s);
  circ(c, x + 1.8 * s, y - 1.6 * s, 2.3 * s);
  c.fillStyle = 'rgba(255,255,220,.22)';
  circ(c, x - 2.4 * s, y - 2.8 * s, 1.1 * s);
};

const cactus = (c, x, y, s) => {
  shadow(c, x, y, 4 * s, 1.4 * s);
  c.fillStyle = '#3f8a4a';
  c.fillRect(x - 1.2 * s, y - 9 * s, 2.4 * s, 9 * s);
  c.fillRect(x - 4 * s, y - 6 * s, 1.8 * s, 3.4 * s);
  c.fillRect(x - 4 * s, y - 4.2 * s, 3 * s, 1.4 * s);
  c.fillRect(x + 2.4 * s, y - 7.5 * s, 1.8 * s, 3.4 * s);
  c.fillRect(x + 1.2 * s, y - 5.4 * s, 3 * s, 1.4 * s);
  c.fillStyle = 'rgba(255,255,255,.18)';
  c.fillRect(x - 1.2 * s, y - 9 * s, 0.9 * s, 9 * s);
};

const boulder = (c, x, y, s, dark) => {
  shadow(c, x, y, 5 * s, 1.6 * s);
  c.fillStyle = dark ? '#3d3436' : '#7d7570';
  poly(c, [
    [x - 5 * s, y],
    [x - 4 * s, y - 4 * s],
    [x - Number(s), y - 6 * s],
    [x + 3 * s, y - 5 * s],
    [x + 5 * s, y - Number(s)],
    [x + 3 * s, y + 0.6 * s],
  ]);
  c.fillStyle = dark ? '#5a4e4e' : '#a8a09a';
  poly(c, [
    [x - 4 * s, y - 4 * s],
    [x - Number(s), y - 6 * s],
    [x + Number(s), y - 4 * s],
    [x - 2 * s, y - 2 * s],
  ]);
};

const house = (c, x, y, s, roof) => {
  shadow(c, x + Number(s), y, 8 * s, 2.4 * s);
  c.fillStyle = '#f3ead6';
  c.fillRect(x - 5 * s, y - 7 * s, 10 * s, 7 * s);
  c.fillStyle = 'rgba(80,60,40,.16)';
  c.fillRect(x + 1.5 * s, y - 7 * s, 3.5 * s, 7 * s);
  c.fillStyle = '#6b4a2e';
  c.fillRect(x - Number(s), y - 3.8 * s, 2 * s, 3.8 * s);
  c.fillStyle = '#9fd0ee';
  c.fillRect(x + 2 * s, y - 5.6 * s, 2 * s, 1.8 * s);
  c.fillRect(x - 4 * s, y - 5.6 * s, 2 * s, 1.8 * s);
  c.fillStyle = roof;
  poly(c, [
    [x - 6.6 * s, y - 6.6 * s],
    [x, y - 12.6 * s],
    [x + 6.6 * s, y - 6.6 * s],
  ]);
  c.fillStyle = 'rgba(0,0,0,.2)';
  poly(c, [
    [x, y - 12.6 * s],
    [x + 6.6 * s, y - 6.6 * s],
    [x, y - 6.6 * s],
  ]);
};

const gym = (c, x, y, col) => {
  shadow(c, x + 2, y, 18, 4);
  c.fillStyle = '#efe6d2';
  c.fillRect(x - 15, y - 11, 30, 11);
  c.fillStyle = 'rgba(80,60,40,.18)';
  c.fillRect(x + 4, y - 11, 11, 11);
  c.fillStyle = '#5a4030';
  c.fillRect(x - 3, y - 6, 6, 6);
  c.fillStyle = col;
  poly(c, [
    [x - 18, y - 10],
    [x - 12, y - 18],
    [x + 12, y - 18],
    [x + 18, y - 10],
  ]);
  c.fillStyle = 'rgba(0,0,0,.18)';
  poly(c, [
    [x, y - 18],
    [x + 12, y - 18],
    [x + 18, y - 10],
    [x, y - 10],
  ]);
  c.fillStyle = '#fff';
  circ(c, x, y - 14, 3.2);
  c.fillStyle = col;
  circ(c, x, y - 14, 1.6);
  c.strokeStyle = '#4a3a2a';
  c.lineWidth = 0.8;
  c.beginPath();
  c.moveTo(x + 13, y - 18);
  c.lineTo(x + 13, y - 27);
  c.stroke();
  c.fillStyle = col;
  poly(c, [
    [x + 13, y - 27],
    [x + 19, y - 25],
    [x + 13, y - 23],
  ]);
};

const PROP = {
  pylon: (c, x, y) => {
    shadow(c, x, y, 4, 1.2);
    c.strokeStyle = '#5d6676';
    c.lineWidth = 0.9;
    c.beginPath();
    c.moveTo(x - 3, y);
    c.lineTo(x, y - 16);
    c.lineTo(x + 3, y);
    c.moveTo(x - 2, y - 5);
    c.lineTo(x + 2, y - 5);
    c.moveTo(x - 1.2, y - 10);
    c.lineTo(x + 1.2, y - 10);
    c.moveTo(x - 5, y - 13);
    c.lineTo(x + 5, y - 13);
    c.stroke();
    c.fillStyle = '#ffd84a';
    circ(c, x, y - 16.5, 1.2);
  },
  ice: (c, x, y) => {
    shadow(c, x, y, 5, 1.5);
    c.fillStyle = '#9fd4f0';
    poly(c, [
      [x - 5, y],
      [x - 3, y - 9],
      [x - 1, y - 3],
      [x + 1, y - 13],
      [x + 3, y - 4],
      [x + 5, y],
    ]);
    c.fillStyle = '#eaf8ff';
    poly(c, [
      [x - 3, y - 9],
      [x - 1, y - 3],
      [x - 2.4, y - 1],
    ]);
    poly(c, [
      [x + 1, y - 13],
      [x + 0.2, y - 2],
      [x - 0.6, y - 2],
    ]);
  },
  pineS: (c, x, y) => pine(c, x, y, 0.9, 1),
  grave: (c, x, y) => {
    shadow(c, x, y, 3.5, 1.1);
    c.fillStyle = '#8b8a96';
    c.beginPath();
    c.moveTo(x - 2.6, y);
    c.lineTo(x - 2.6, y - 5);
    c.arc(x, y - 5, 2.6, Math.PI, 0);
    c.lineTo(x + 2.6, y);
    c.fill();
    c.fillStyle = '#5f5e6c';
    c.fillRect(x + 0.6, y - 6, 2, 6);
    c.fillStyle = 'rgba(190,150,255,.55)';
    circ(c, x + 4, y - 9, 1.4);
  },
  dead: (c, x, y) => deadTree(c, x, y, 0.9),
  lava: (c, x, y) => {
    c.fillStyle = '#3a2a26';
    ell(c, x, y, 7, 3.2);
    const g = c.createRadialGradient(x, y, 0.5, x, y, 6);
    g.addColorStop(0, '#ffe08a');
    g.addColorStop(0.5, '#ff7a2a');
    g.addColorStop(1, '#a8301a');
    c.fillStyle = g;
    ell(c, x, y, 5.6, 2.4);
  },
  boulderD: (c, x, y) => boulder(c, x, y, 0.8, 1),
  boulder: (c, x, y) => boulder(c, x, y, 0.85, 0),
  obelisk: (c, x, y) => {
    shadow(c, x, y, 3.5, 1.1);
    c.fillStyle = '#6e5f8c';
    poly(c, [
      [x - 2.2, y],
      [x - 1.4, y - 13],
      [x, y - 15],
      [x + 1.4, y - 13],
      [x + 2.2, y],
    ]);
    c.fillStyle = '#9d8cc0';
    poly(c, [
      [x - 2.2, y],
      [x - 1.4, y - 13],
      [x, y - 15],
      [x - 0.2, y],
    ]);
    c.fillStyle = 'rgba(230,200,255,.9)';
    circ(c, x, y - 9, 0.9);
  },
  dojo: (c, x, y) => {
    house(c, x, y, 1.1, '#9a2f22');
    c.strokeStyle = '#3a2418';
    c.lineWidth = 0.7;
    c.beginPath();
    c.moveTo(x - 5.5, y - 7.4);
    c.lineTo(x + 5.5, y - 7.4);
    c.stroke();
  },
  windmill: (c, x, y) => {
    shadow(c, x, y, 5, 1.6);
    c.fillStyle = '#e9e1cf';
    poly(c, [
      [x - 3, y],
      [x - 2, y - 12],
      [x + 2, y - 12],
      [x + 3, y],
    ]);
    c.fillStyle = '#8a3a2a';
    poly(c, [
      [x - 2.6, y - 12],
      [x, y - 15],
      [x + 2.6, y - 12],
    ]);
    c.strokeStyle = '#6b5a44';
    c.lineWidth = 1.1;
    c.beginPath();
    c.moveTo(x - 7, y - 19);
    c.lineTo(x + 7, y - 7);
    c.moveTo(x + 7, y - 19);
    c.lineTo(x - 7, y - 7);
    c.stroke();
  },
  bigflower: (c, x, y) => {
    c.strokeStyle = '#2f7a3a';
    c.lineWidth = 0.8;
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x, y - 6);
    c.stroke();
    c.fillStyle = ['#ff7eb6', '#ffd24a', '#b88cff'][((x + y) % 3) | 0];
    for (let k = 0; k < 5; k++) {
      circ(c, x + Math.cos(k * 1.257) * 2, y - 7 + Math.sin(k * 1.257) * 2, 1.4);
    }
    c.fillStyle = '#fff3a8';
    circ(c, x, y - 7, 1);
  },
  bush: (c, x, y) => bush(c, x, y, 1),
  toxic: (c, x, y) => {
    c.fillStyle = '#3c2a44';
    ell(c, x, y, 6.4, 2.8);
    c.fillStyle = '#9b5ac8';
    ell(c, x, y, 5.2, 2.1);
    c.fillStyle = 'rgba(230,190,255,.8)';
    circ(c, x - 1.6, y - 0.6, 0.8);
    circ(c, x + 2, y - 0.2, 0.6);
  },
  cactus: (c, x, y) => cactus(c, x, y, 0.85),
  reeds: (c, x, y) => {
    c.fillStyle = '#4aa6d8';
    ell(c, x, y, 6, 2.4);
    c.strokeStyle = '#3d7a3a';
    c.lineWidth = 0.8;
    c.beginPath();
    for (let k = -3; k <= 3; k += 1.5) {
      c.moveTo(x + k, y + 0.5);
      c.lineTo(x + k * 1.2, y - 6 - Math.abs(k));
    }
    c.stroke();
    c.fillStyle = '#7a4e2a';
    [-3, 0, 3].forEach(k => ell(c, x + k * 1.2, y - 6 - Math.abs(k), 0.6, 1.4));
  },
  flowers: (c, x, y) => {
    const cols = ['#ff6f91', '#ffd84a', '#ffffff', '#c58cff'];
    for (let k = 0; k < 9; k++) {
      c.fillStyle = cols[k % 4];
      circ(c, x - 6 + (k % 3) * 6 + ((k * 7) % 3), y - 3 + ((k / 3) | 0) * 2.6, 1.1);
    }
  },
  house: (c, x, y) => house(c, x, y, 0.9, ['#c0453a', '#3f6fb5', '#d08a2a'][(x | 0) % 3]),
  crane: (c, x, y) => {
    shadow(c, x, y, 4, 1.2);
    c.strokeStyle = '#6f7d90';
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x, y - 16);
    c.lineTo(x + 9, y - 16);
    c.moveTo(x - 3, y - 16);
    c.lineTo(x, y - 16);
    c.moveTo(x + 8, y - 16);
    c.lineTo(x + 8, y - 10);
    c.stroke();
    c.fillStyle = '#e0a82a';
    c.fillRect(x + 6.6, y - 10, 3, 2);
  },
  crate: (c, x, y) => {
    shadow(c, x, y, 4, 1.2);
    c.fillStyle = '#8a95a6';
    c.fillRect(x - 3, y - 5, 6, 5);
    c.fillStyle = '#b7c2d0';
    c.fillRect(x - 3, y - 5, 6, 1.4);
  },
  spire: (c, x, y) => {
    shadow(c, x, y, 4, 1.3);
    c.fillStyle = '#3b2f52';
    poly(c, [
      [x - 4, y],
      [x - 1, y - 14],
      [x + 1, y - 9],
      [x + 2, y - 16],
      [x + 4, y],
    ]);
    c.fillStyle = '#6a5590';
    poly(c, [
      [x - 4, y],
      [x - 1, y - 14],
      [x - 0.5, y],
    ]);
  },
  mush: (c, x, y) => {
    c.fillStyle = '#efe6d6';
    c.fillRect(x - 0.7, y - 3, 1.4, 3);
    c.fillStyle = '#e04848';
    c.beginPath();
    c.arc(x, y - 3, 2.6, Math.PI, 0);
    c.fill();
    c.fillStyle = '#fff';
    circ(c, x - 1, y - 4, 0.5);
    circ(c, x + 1.1, y - 3.6, 0.45);
  },
};

const tallGrass = (c, x, y, n, r, rnd) => {
  c.strokeStyle = '#2d6f34';
  c.lineWidth = 1;
  c.lineCap = 'round';
  c.beginPath();
  for (let k = 0; k < n; k++) {
    const a = rnd() * 6.283,
      d = Math.sqrt(rnd()) * r,
      px = x + Math.cos(a) * d,
      py = y + Math.sin(a) * d * 0.7;
    c.moveTo(px - 2, py);
    c.lineTo(px - 1, py - 4);
    c.moveTo(px, py);
    c.lineTo(px, py - 5);
    c.moveTo(px + 2, py);
    c.lineTo(px + 1.2, py - 3.6);
  }
  c.stroke();
};

const mountain = (c, x, y, s, snow, rnd, tone) => {
  const w = 36 * s,
    h = 50 * s,
    px = x + (rnd() - 0.5) * 6 * s;
  const base = y + 14 * s;
  const g = c.createRadialGradient(x, base, 2, x, base, w * 1.3);
  g.addColorStop(0, 'rgba(40,40,30,.28)');
  g.addColorStop(1, 'rgba(40,40,30,0)');
  c.fillStyle = g;
  ell(c, x + 6 * s, base, w * 1.3, 9 * s);
  const L = [
    [x - w, base],
    [x - w * 0.6, base - h * 0.42],
    [x - w * 0.32, base - h * 0.62],
    [px, base - h],
  ];
  const R2 = [
    [px, base - h],
    [x + w * 0.28, base - h * 0.66],
    [x + w * 0.5, base - h * 0.5],
    [x + w * 0.72, base - h * 0.3],
    [x + w, base],
  ];
  const T = tone || ['#6f6a73', '#9f9aa2', '#4d4955'];
  c.fillStyle = T[2];
  poly(c, [...L, ...R2.slice(1)]);
  c.fillStyle = T[1];
  poly(c, [...L, [px + 2 * s, base - h * 0.5], [x + 2 * s, base]]);
  c.fillStyle = 'rgba(255,255,255,.08)';
  poly(c, [
    [x - w * 0.6, base - h * 0.42],
    [x - w * 0.32, base - h * 0.62],
    [px, base - h],
    [x - w * 0.2, base - h * 0.3],
  ]);
  c.strokeStyle = 'rgba(30,26,34,.35)';
  c.lineWidth = 0.8;
  c.beginPath();
  c.moveTo(px, base - h);
  c.lineTo(px + 2 * s, base - h * 0.5);
  c.lineTo(x + 2 * s, base);
  c.stroke();
  if (snow) {
    const sy = base - h * 0.62;
    c.fillStyle = '#d7e3ef';
    poly(c, [
      [x - w * 0.32, sy],
      [px, base - h],
      [x + w * 0.28, base - h * 0.66],
      [x + w * 0.16, sy + 4 * s],
      [px + 3 * s, sy - Number(s)],
      [px - 2 * s, sy + 5 * s],
    ]);
    c.fillStyle = '#f7fbff';
    poly(c, [
      [x - w * 0.32, sy],
      [px, base - h],
      [px + 1.6 * s, sy + 2 * s],
      [px - 2 * s, sy + 5 * s],
      [x - w * 0.18, sy + 2 * s],
    ]);
  }
};

const LANDMARK = {
  tower: (c, x, y) => {
    shadow(c, x, y + 2, 9, 2.6);
    c.fillStyle = '#5b5068';
    c.fillRect(x - 5, y - 26, 10, 28);
    c.fillStyle = '#7a6e8a';
    c.fillRect(x - 5, y - 26, 4, 28);
    c.fillStyle = '#2c2335';
    poly(c, [
      [x - 7, y - 26],
      [x, y - 40],
      [x + 7, y - 26],
    ]);
    c.fillStyle = '#c9a6ff';
    [y - 20, y - 12, y - 4].forEach(yy => c.fillRect(x - 1, yy, 2, 3));
  },
  temple: (c, x, y) => {
    shadow(c, x, y + 2, 26, 4);
    c.fillStyle = '#d9dfea';
    poly(c, [
      [x - 28, y + 4],
      [x + 28, y + 4],
      [x + 22, y - 4],
      [x - 22, y - 4],
    ]);
    c.fillStyle = '#f4f6fb';
    for (let k = -16; k <= 16; k += 8) {
      c.fillRect(x + k - 1.5, y - 16, 3, 12);
    }
    c.fillStyle = '#e8b84a';
    poly(c, [
      [x - 22, y - 16],
      [x, y - 26],
      [x + 22, y - 16],
    ]);
    c.fillStyle = 'rgba(0,0,0,.15)';
    poly(c, [
      [x, y - 26],
      [x + 22, y - 16],
      [x, y - 16],
    ]);
  },
  stadium: (c, x, y) => {
    shadow(c, x + 2, y + 3, 26, 9);
    c.fillStyle = '#c9cfdb';
    ell(c, x, y, 26, 11);
    c.fillStyle = '#eef1f6';
    ell(c, x, y - 2, 24, 9.6);
    c.fillStyle = '#4fa154';
    ell(c, x, y - 1, 16, 6);
    c.strokeStyle = 'rgba(255,255,255,.75)';
    c.lineWidth = 0.7;
    c.beginPath();
    c.ellipse(x, y - 1, 6, 2.4, 0, 0, 6.283);
    c.stroke();
    ['#e04848', '#3f6fb5', '#e8b84a'].forEach((f, k) => {
      const fx = x - 20 + k * 20;
      c.strokeStyle = '#555';
      c.beginPath();
      c.moveTo(fx, y - 9);
      c.lineTo(fx, y - 17);
      c.stroke();
      c.fillStyle = f;
      poly(c, [
        [fx, y - 17],
        [fx + 5, y - 15.5],
        [fx, y - 14],
      ]);
    });
  },
  volcano: (c, x, y, s) => {
    s = s || 1;
    shadow(c, x, y + 10 * s, 40 * s, 8 * s);
    c.fillStyle = '#5b3a2c';
    poly(c, [
      [x - 40 * s, y + 12 * s],
      [x - 10 * s, y - 26 * s],
      [x + 10 * s, y - 26 * s],
      [x + 40 * s, y + 12 * s],
    ]);
    c.fillStyle = '#7d5240';
    poly(c, [
      [x - 40 * s, y + 12 * s],
      [x - 10 * s, y - 26 * s],
      [x, y - 26 * s],
      [x - 6 * s, y + 12 * s],
    ]);
    const g = c.createRadialGradient(x, y - 26 * s, 1, x, y - 26 * s, 14 * s);
    g.addColorStop(0, '#fff2a8');
    g.addColorStop(0.4, '#ff8a2a');
    g.addColorStop(1, 'rgba(255,80,30,0)');
    c.fillStyle = g;
    ell(c, x, y - 26 * s, 14 * s, 6 * s);
    c.strokeStyle = '#ff6a26';
    c.lineWidth = 1.6 * s;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(x - 4 * s, y - 24 * s);
    c.quadraticCurveTo(x - 10 * s, y - 8 * s, x - 7 * s, y + 6 * s);
    c.moveTo(x + 5 * s, y - 24 * s);
    c.quadraticCurveTo(x + 12 * s, y - 6 * s, x + 14 * s, y + 4 * s);
    c.stroke();
  },
  lab: (c, x, y) => {
    shadow(c, x + 2, y, 13, 3);
    c.fillStyle = '#f2f4f8';
    c.fillRect(x - 11, y - 10, 22, 10);
    c.fillStyle = 'rgba(60,80,110,.15)';
    c.fillRect(x + 3, y - 10, 8, 10);
    c.fillStyle = '#3f6fb5';
    poly(c, [
      [x - 13, y - 10],
      [x - 9, y - 15],
      [x + 9, y - 15],
      [x + 13, y - 10],
    ]);
    c.fillStyle = '#9fd0ee';
    c.fillRect(x - 8, y - 7, 4, 3);
    c.fillRect(x + 4, y - 7, 4, 3);
    c.strokeStyle = '#8a93a6';
    c.lineWidth = 0.8;
    c.beginPath();
    c.moveTo(x + 7, y - 15);
    c.lineTo(x + 7, y - 20);
    c.stroke();
    c.fillStyle = '#dfe6f0';
    c.beginPath();
    c.arc(x + 7, y - 20, 3, Math.PI * 1.1, Math.PI * 1.9);
    c.fill();
  },
  pagoda: (c, x, y) => {
    shadow(c, x, y + 2, 12, 3);
    const tiers = [
      [13, 7, '#7a3b2a'],
      [11, 6, '#9a4a32'],
      [9, 6, '#b8573a'],
      [7, 5, '#d06a42'],
    ];
    let yy = y;
    tiers.forEach(([w, h, col]) => {
      c.fillStyle = '#e8d8b8';
      c.fillRect(x - w * 0.6, yy - h, w * 1.2, h);
      c.fillStyle = col;
      poly(c, [
        [x - w, yy - h + 1],
        [x - w * 0.7, yy - h - 3],
        [x + w * 0.7, yy - h - 3],
        [x + w, yy - h + 1],
      ]);
      yy -= h + 2;
    });
    c.fillStyle = '#e8b84a';
    c.fillRect(x - 0.6, yy - 6, 1.2, 6);
  },
  lighthouse: (c, x, y) => {
    shadow(c, x, y + 2, 7, 2);
    c.fillStyle = '#f4f4f4';
    poly(c, [
      [x - 4, y],
      [x - 2.6, y - 24],
      [x + 2.6, y - 24],
      [x + 4, y],
    ]);
    c.fillStyle = '#d14a3a';
    [y - 6, y - 15].forEach(yy =>
      poly(c, [
        [x - 3.7, yy],
        [x - 3.3, yy - 4],
        [x + 3.3, yy - 4],
        [x + 3.7, yy],
      ])
    );
    c.fillStyle = '#ffe27a';
    c.fillRect(x - 2.4, y - 29, 4.8, 5);
    c.fillStyle = '#3a3a48';
    poly(c, [
      [x - 3.4, y - 29],
      [x, y - 33],
      [x + 3.4, y - 29],
    ]);
  },
  shrine: (c, x, y) => {
    shadow(c, x, y + 2, 20, 3.4);
    c.fillStyle = '#e9eef7';
    poly(c, [
      [x - 22, y + 3],
      [x + 22, y + 3],
      [x + 17, y - 5],
      [x - 17, y - 5],
    ]);
    c.fillStyle = '#7d5ab8';
    c.fillRect(x - 8, y - 17, 16, 12);
    c.fillStyle = '#4b2f7a';
    poly(c, [
      [x - 12, y - 17],
      [x, y - 25],
      [x + 12, y - 17],
    ]);
    c.fillStyle = '#ffd75e';
    circ(c, x, y - 11, 2);
  },
  pillar: (c, x, y) => {
    c.fillStyle = '#6d6a62';
    ell(c, x, y + 4, 14, 5);
    c.fillStyle = '#8f8c82';
    ell(c, x - 2, y + 3, 11, 3.6);
    c.fillStyle = '#7e8f7a';
    c.fillRect(x - 5, y - 34, 10, 37);
    c.fillStyle = '#a4b6a0';
    c.fillRect(x - 5, y - 34, 4, 37);
    c.fillStyle = '#4f5f4c';
    poly(c, [
      [x - 7, y - 34],
      [x, y - 44],
      [x + 7, y - 34],
    ]);
    c.fillStyle = '#8fd3ff';
    [y - 26, y - 16, y - 6].forEach(yy => c.fillRect(x - 1, yy, 2, 3));
  },
  crater: (c, x, y) => {
    c.fillStyle = '#8a7a66';
    ell(c, x, y, 26, 14);
    const g = c.createRadialGradient(x - 3, y - 2, 2, x, y, 20);
    g.addColorStop(0, '#5fd0f0');
    g.addColorStop(1, '#1a6aa6');
    c.fillStyle = g;
    ell(c, x, y + 1, 19, 9.5);
  },
};

const boat = (c, x, y) => {
  c.fillStyle = 'rgba(255,255,255,.35)';
  ell(c, x - 6, y + 2, 9, 1.4);
  c.fillStyle = '#6b4a2e';
  poly(c, [
    [x - 6, y],
    [x + 6, y],
    [x + 4, y + 2.6],
    [x - 4, y + 2.6],
  ]);
  c.fillStyle = '#fbf6ea';
  poly(c, [
    [x, y - 1],
    [x, y - 12],
    [x + 6, y - 1],
  ]);
  c.fillStyle = '#e04848';
  poly(c, [
    [x - 0.4, y - 1],
    [x - 0.4, y - 9],
    [x - 4.6, y - 1],
  ]);
};

const seaRock = (c, x, y, s) => {
  c.fillStyle = 'rgba(230,248,255,.45)';
  ell(c, x, y + 1.4 * s, 6.5 * s, 2 * s);
  boulder(c, x, y, s * 0.9, 0);
};

const whirl = (c, x, y) => {
  c.strokeStyle = 'rgba(220,245,255,.55)';
  c.lineWidth = 1.2;
  c.beginPath();
  for (let a = 0; a < 16; a += 0.2) {
    const r = 1 + a * 0.85;
    const px = x + Math.cos(a) * r,
      py = y + Math.sin(a) * r * 0.55;
    a ? c.lineTo(px, py) : c.moveTo(px, py);
  }
  c.stroke();
};

/* ---------- generating a region ---------- */

// Draws nothing: resolves region data, seeded RNG, land outlines, places, routes and the shared output lists.
const prepareRegion = reg => {
  const R = REG[reg],
    rnd = mulberry32((R.seed * 7919) | 0),
    seed = R.seed;
  const lands = landOf(R.svg());
  if (!lands.length) {
    throw new Error('land not found');
  }
  const P = placesOf(reg);
  const roads = routesOf(reg, R, P);
  return { R, rnd, seed, lands, P, roads, items: [], lights: [], smoke: [], sparks: [] };
};

// Draws nothing: computes the land mask, its blurred coast fields and the noise fields.
const computeLandFields = async st => {
  const { seed, lands } = st;
  const M = maskOf(lands.map(d => ({ d, fill: true })));
  await tick();
  const B4 = blur(M, 2, 2),
    B12 = blur(M, 6, 2);
  await tick();
  const BI = blur(M, 14, 2);
  await tick();
  const BS = blur(M, 17, 3);
  await tick();
  const N1 = noiseField(seed, 70, 5);
  await tick();
  const N2 = noiseField(seed + 101, 210, 3);
  await tick();
  const N3 = noiseField(seed + 203, 26, 3);
  await tick();
  Object.assign(st, { M, B4, B12, BI, BS, N1, N2, N3 });
};

// Draws nothing: rasterizes the water (lakes, rivers) and road masks.
const computeWaterRoadMasks = async st => {
  const { R, roads } = st;
  const WM = maskOf([...R.lakes.map(d => ({ d, fill: true })), ...R.rivers.map(d => ({ d, w: 14 }))]);
  await tick();
  const RM2 = maskOf(roads.map(d => ({ d, w: 12 })));
  await tick();
  Object.assign(st, { WM, RM2 });
};

// Draws nothing: adds an anisotropic Gaussian bump (map coordinates) to a grid field.
const addGauss = (arr, cx, cy, sx, sy, amp) => {
  cx /= Q;
  cy /= Q;
  sx /= Q;
  sy /= Q;
  const x0 = Math.max(0, (cx - sx * 3) | 0),
    x1 = Math.min(GW - 1, (cx + sx * 3) | 0),
    y0 = Math.max(0, (cy - sy * 3) | 0),
    y1 = Math.min(GH - 1, (cy + sy * 3) | 0);
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const dx = (x - cx) / sx,
        dy = (y - cy) / sy;
      arr[y * GW + x] += amp * Math.exp(-(dx * dx + dy * dy) * 0.5);
    }
  }
};

// Draws nothing: builds the mountain, snow, forest-density and height fields.
const computeRelief = async st => {
  const { R, BI, N1, N3 } = st;
  // terrain: mountains + forests
  const MT = new Float32Array(GW * GH),
    SN = new Float32Array(GW * GH),
    FF = new Float32Array(GW * GH);
  R.mounts.forEach(([x, y, s, sn]) => {
    addGauss(MT, x, y + 4, 34 * s, 26 * s, 0.9);
    if (sn) {
      addGauss(SN, x, y - 6 * s, 16 * s, 12 * s, 1);
    }
  });
  R.forests.forEach(([, x, y, n, sp]) => addGauss(FF, x, y, sp * Math.sqrt(n) * 0.75, sp * Math.sqrt(n) * 0.55, 0.9));
  const HT = new Float32Array(GW * GH);
  for (let i = 0; i < HT.length; i++) {
    HT[i] = BI[i] * 0.5 + (N1[i] - 0.5) * 0.32 + MT[i] * 1.25 + N3[i] * 0.04;
  }
  await tick();
  Object.assign(st, { MT, SN, FF, HT });
};

// Paints the low-resolution terrain and sea pixels (grass, biomes, relief shading, beaches, sea depth, foam).
const paintTerrainPixels = async st => {
  const { R, seed, M, B4, B12, BS, N1, N2, N3, MT, SN, FF, HT } = st;
  const bios = R.biomes.map(([k, cx, cy, rx, ry]) => ({
    k,
    cx,
    cy,
    rx,
    ry,
    c: BIO[k][0],
    a: BIO[k][1],
    x0: cx - rx * 1.3,
    x1: cx + rx * 1.3,
    y0: cy - ry * 1.3,
    y1: cy + ry * 1.3,
  }));
  const G = R.grass,
    SEA = R.sea;
  const small = mkCanvas(GW, GH),
    sx = small.getContext('2d'),
    img = sx.createImageData(GW, GH),
    D = img.data;
  for (let gy = 0; gy < GH; gy++) {
    if (gy % 24 === 0) {
      await tick();
    }
    const y = gy * Q;
    for (let gx = 0; gx < GW; gx++) {
      const x = gx * Q,
        i = gy * GW + gx,
        m = M[i],
        n1 = N1[i],
        n2 = N2[i],
        n3 = N3[i];
      let lr = 0,
        lg = 0,
        lb = 0,
        sr = 0,
        sg = 0,
        sb = 0;
      if (m > 0.002) {
        const t = sstep(0.24, 0.8, n1 * 0.5 + n2 * 0.5);
        lr = G.d[0] + (G.l[0] - G.d[0]) * t;
        lg = G.d[1] + (G.l[1] - G.d[1]) * t;
        lb = G.d[2] + (G.l[2] - G.d[2]) * t;
        const md = sstep(0.58, 0.8, n2) * 0.32;
        lr += (G.m[0] - lr) * md;
        lg += (G.m[1] - lg) * md;
        lb += (G.m[2] - lb) * md;
        for (let k = 0; k < bios.length; k++) {
          const B = bios[k];
          if (x < B.x0 || x > B.x1 || y < B.y0 || y > B.y1) {
            continue;
          }
          const ex = (x - B.cx) / B.rx,
            ey = (y - B.cy) / B.ry;
          const e = ex * ex + ey * ey + (n3 - 0.5) * 0.9 + (n1 - 0.5) * 0.4;
          const w = (1 - sstep(0.3, 1.05, e)) * B.a;
          if (w <= 0) {
            continue;
          }
          let br = B.c[0],
            bg = B.c[1],
            bb = B.c[2];
          if (B.k === 'desert') {
            const dune = Math.sin(x * 0.11 + y * 0.05 + n1 * 10) * 12;
            br += dune;
            bg += dune * 0.85;
            bb += dune * 0.55;
          } else if (B.k === 'marsh' && n3 > 0.6) {
            br = 64;
            bg = 104;
            bb = 128;
          } else if (B.k === 'autumn') {
            const v = (n3 - 0.5) * 60;
            br += v;
            bg += v * 0.4;
          } else if (B.k === 'snow') {
            const v = (n3 - 0.5) * 20;
            br += v;
            bg += v;
            bb += v * 0.6;
          } else if (B.k === 'lava' && n3 > 0.66) {
            br = 236;
            bg = 112;
            bb = 40;
          } else if (B.k === 'mystic') {
            br += (n3 - 0.5) * 30;
          }
          lr += (br - lr) * w;
          lg += (bg - lg) * w;
          lb += (bb - lb) * w;
        }
        const ff = FF[i];
        if (ff > 0.05) {
          const w = sstep(0.05, 0.7, ff) * 0.45;
          lr += (40 - lr) * w;
          lg += (92 - lg) * w;
          lb += (48 - lb) * w;
        }
        const mt = MT[i];
        if (mt > 0.04) {
          const w = sstep(0.04, 0.62, mt) * 0.78,
            rv = (n3 - 0.5) * 30;
          lr += (156 + rv - lr) * w;
          lg += (150 + rv - lg) * w;
          lb += (136 + rv - lb) * w;
        }
        const sn = SN[i];
        if (sn > 0.25) {
          const w = sstep(0.25, 0.75, sn + (n3 - 0.5) * 0.4) * 0.95;
          lr += (240 - lr) * w;
          lg += (246 - lg) * w;
          lb += (252 - lb) * w;
        }
        const bt = sstep(R.beach, R.beach - 0.22, B12[i]) * (1 - sstep(0.2, 0.6, MT[i]));
        if (bt > 0) {
          const wet = sstep(0.62, 0.5, B4[i]);
          const cr = 234 - wet * 38,
            cg = 216 - wet * 36,
            cb = 166 - wet * 30;
          lr += (cr - lr) * bt;
          lg += (cg - lg) * bt;
          lb += (cb - lb) * bt;
        }
        const ia = Math.max(0, i - GW - 1),
          ib = Math.min(GW * GH - 1, i + GW + 1);
        const sh = clamp((HT[ia] - HT[ib]) * 7.5, -0.34, 0.34);
        lr *= 1 + sh;
        lg *= 1 + sh;
        lb *= 1 + sh * 0.8;
        const gr = (hash2(gx, gy, seed) - 0.5) * 7 + (n3 - 0.5) * 16;
        lr += gr * 0.8;
        lg += gr;
        lb += gr * 0.6;
      }
      if (m < 0.998) {
        const s = BS[i];
        const a = sstep(0, 0.1, s),
          b2 = sstep(0.1, 0.46, s);
        sr = SEA.deep[0] + (SEA.mid[0] - SEA.deep[0]) * a;
        sg = SEA.deep[1] + (SEA.mid[1] - SEA.deep[1]) * a;
        sb = SEA.deep[2] + (SEA.mid[2] - SEA.deep[2]) * a;
        sr += (SEA.shal[0] - sr) * b2;
        sg += (SEA.shal[1] - sg) * b2;
        sb += (SEA.shal[2] - sb) * b2;
        const v = (n2 - 0.5) * 26;
        sr += v * 0.4;
        sg += v * 0.7;
        sb += v;
        if (R.reef && s > 0.12 && s < 0.42 && n3 > 0.6) {
          const w = sstep(0.6, 0.74, n3) * 0.5;
          sr += (96 - sr) * w;
          sg += (220 - sg) * w;
          sb += (208 - sb) * w;
        }
        const q = s * 24 + (n1 - 0.5) * 1.1,
          fr = q - Math.floor(q),
          line = fr < 0.09 ? 1 - fr / 0.09 : 0;
        const la = line * sstep(0.008, 0.07, s) * (1 - sstep(0.3, 0.48, s)) * 0.3;
        sr += (255 - sr) * la;
        sg += (255 - sg) * la;
        sb += (255 - sb) * la;
        const glint = 0;
        sr += (255 - sr) * glint;
        sg += (255 - sg) * glint;
        sb += (255 - sb) * glint;
        const f = sstep(0.12, 0.46, B4[i]) * 0.62;
        sr += (246 - sr) * f;
        sg += (252 - sg) * f;
        sb += (255 - sb) * f;
        const gr = (hash2(gx, gy, seed + 3) - 0.5) * 3;
        sr += gr;
        sg += gr;
        sb += gr;
      }
      const o = i * 4;
      D[o] = sr + (lr - sr) * m;
      D[o + 1] = sg + (lg - sg) * m;
      D[o + 2] = sb + (lb - sb) * m;
      D[o + 3] = 255;
    }
  }
  sx.putImageData(img, 0, 0);
  await tick();
  return small;
};

// Upscales the terrain pixels onto the high-definition canvas and sets up the vector context.
const createVectorCanvas = (st, small) => {
  const big = mkCanvas(VW * SC, VH * SC),
    c = big.getContext('2d');
  c.imageSmoothingEnabled = true;
  c.imageSmoothingQuality = 'high';
  c.drawImage(small, 0, 0, VW * SC, VH * SC);
  small.width = 0;
  c.scale(SC, SC);
  c.lineJoin = 'round';
  c.lineCap = 'round';
  Object.assign(st, { big, c });
};

// Draws the shoreline edge strokes.
const drawShoreline = st => {
  const { lands, c } = st;
  // shoreline edge
  lands.forEach(d => {
    const p = new Path2D(d);
    c.strokeStyle = 'rgba(255,250,230,.55)';
    c.lineWidth = 1.1;
    c.stroke(p);
    c.strokeStyle = 'rgba(255,255,255,.12)';
    c.lineWidth = 5;
    c.stroke(p);
  });
};

// Draws the dirt paths along routes.
const drawRoads = st => {
  const { roads, c } = st;
  // dirt paths
  roads.forEach(d => {
    const p = new Path2D(d);
    c.strokeStyle = 'rgba(96,70,40,.32)';
    c.lineWidth = 8.5;
    c.stroke(p);
    c.strokeStyle = 'rgba(220,194,142,.92)';
    c.lineWidth = 5.4;
    c.stroke(p);
    c.setLineDash([1.5, 4.5]);
    c.strokeStyle = 'rgba(150,118,74,.45)';
    c.lineWidth = 1.2;
    c.stroke(p);
    c.setLineDash([]);
  });
};

// Draws the offshore wave strokes.
const drawWaves = st => {
  const { rnd, c, M, BS } = st;
  // waves drawn offshore
  c.strokeStyle = 'rgba(214,240,255,.22)';
  c.lineWidth = 0.9;
  for (let t = 0, n = 0; t < 1500 && n < 80; t++) {
    const x = 20 + rnd() * (VW - 40),
      y = 20 + rnd() * (VH - 40),
      i = gi(x, y);
    if (M[i] > 0.01 || BS[i] > 0.12) {
      continue;
    }
    n++;
    c.beginPath();
    c.moveTo(x - 7, y);
    c.quadraticCurveTo(x - 3.5, y - 3, x, y);
    c.quadraticCurveTo(x + 3.5, y - 3, x + 7, y);
    c.stroke();
  }
};

// Draws the lakes.
const drawLakes = st => {
  const { R, c } = st;
  // lakes
  R.lakes.forEach(d => {
    const p = new Path2D(d);
    c.strokeStyle = '#e6d6a6';
    c.lineWidth = 5;
    c.stroke(p);
    c.fillStyle = '#2f8fcf';
    c.fill(p);
    c.save();
    c.clip(p);
    c.strokeStyle = 'rgba(160,230,255,.55)';
    c.lineWidth = 6;
    c.stroke(p);
    c.restore();
  });
};

// Draws the rivers.
const drawRivers = st => {
  const { R, c } = st;
  // rivers
  R.rivers.forEach(d => {
    const p = new Path2D(d);
    c.strokeStyle = 'rgba(30,70,60,.4)';
    c.lineWidth = 10;
    c.stroke(p);
    c.strokeStyle = '#3c9ad6';
    c.lineWidth = 7;
    c.stroke(p);
    c.strokeStyle = 'rgba(190,240,255,.55)';
    c.lineWidth = 1.4;
    c.setLineDash([6, 9]);
    c.stroke(p);
    c.setLineDash([]);
  });
};

// Draws the cultivated fields around hamlets.
const drawFields = st => {
  const { R, P, seed, c, M, B12, WM, RM2, MT } = st;
  // cultivated fields around hamlets
  const FCOL = [
    ['#d8c070', '#c2a650'],
    ['#86b45a', '#6f9c46'],
    ['#a87a4e', '#8e643c'],
    ['#b8cc6a', '#9fb456'],
  ];
  P.filter(p => p.grp === 'aventure' && p.t && !/^rv/.test(p.id)).forEach(p => {
    const r4 = mulberry32((((p.x * 53) ^ (p.y * 29)) + seed * 3) | 0);
    for (let k = 0, put = 0; k < 14 && put < 3; k++) {
      const a = r4() * 6.283,
        d = 62 + r4() * 34,
        fx = p.x + Math.cos(a) * d,
        fy = p.y + Math.sin(a) * d * 0.75,
        i = gi(fx, fy);
      if (M[i] < 0.95 || B12[i] < 0.85 || WM[i] > 0.02 || RM2[i] > 0.02 || MT[i] > 0.2) {
        continue;
      }
      if (
        P.some(
          q =>
            Math.hypot(q.x - fx, (q.y - fy) * 1.2) < 44 || (fy > q.y + 10 && fy < q.y + 66 && Math.abs(fx - q.x) < 70)
        )
      ) {
        continue;
      }
      const bi = R.biomes.find(
        ([kk, cx, cy, rx, ry]) => ((fx - cx) / rx) ** 2 + ((fy - cy) / ry) ** 2 < 1 && kk !== 'meadow'
      );
      if (bi) {
        continue;
      }
      put++;
      const [c1, c2] = FCOL[(r4() * FCOL.length) | 0],
        w = 16 + r4() * 10,
        h = 10 + r4() * 6,
        rot = (r4() - 0.5) * 0.7;
      c.save();
      c.translate(fx, fy);
      c.rotate(rot);
      c.fillStyle = 'rgba(60,50,30,.18)';
      c.fillRect(-w / 2 + 1, -h / 2 + 1, w, h);
      c.fillStyle = c1;
      c.fillRect(-w / 2, -h / 2, w, h);
      c.strokeStyle = c2;
      c.lineWidth = 0.9;
      c.beginPath();
      for (let yy = -h / 2 + 1.6; yy < h / 2; yy += 2.2) {
        c.moveTo(-w / 2 + 0.6, yy);
        c.lineTo(w / 2 - 0.6, yy);
      }
      c.stroke();
      c.strokeStyle = 'rgba(70,96,40,.55)';
      c.lineWidth = 0.8;
      c.strokeRect(-w / 2, -h / 2, w, h);
      c.restore();
    }
  });
};

// Draws the clearings beneath each location.
const drawClearings = st => {
  const { P, c } = st;
  // clearings beneath each location
  P.forEach(p => {
    const g = c.createRadialGradient(p.x, p.y, 2, p.x, p.y, 34);
    g.addColorStop(0, 'rgba(226,206,154,.8)');
    g.addColorStop(0.6, 'rgba(214,192,140,.35)');
    g.addColorStop(1, 'rgba(214,192,140,0)');
    c.fillStyle = g;
    ell(c, p.x, p.y, 34, 26);
  });
};

// elements sorted by depth
// Draws nothing: returns a function queueing a depth-sorted drawing callback.
const itemAdder = items => (y, f) => items.push([y, f]);

// Draws nothing: tells whether a point is solid inland ground.
const isLandAt = (st, x, y) => {
  const { M, B12 } = st;
  const i = gi(x, y);
  return M[i] > 0.95 && B12[i] > 0.8;
};

// Draws nothing: tells whether a point is clear of water, roads, places and their labels.
const isFreeAt = (st, x, y, rp) => {
  const { WM, RM2, P } = st;
  const i = gi(x, y);
  if (WM[i] > 0.05 || RM2[i] > 0.05) {
    return false;
  }
  for (const p of P) {
    const dx = x - p.x,
      dy = (y - p.y) * 1.25;
    if (dx * dx + dy * dy < rp * rp) {
      return false;
    }
    if (y > p.y + 14 && y < p.y + 62 && Math.abs(x - p.x) < 62) {
      return false;
    } // label placement
  }
  return true;
};

// Draws nothing: returns the dominant biome key at a point, or null.
const biomeAt = (R, x, y) => {
  let best = null,
    bw = 0.25;
  R.biomes.forEach(([k, cx, cy, rx, ry]) => {
    const e = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2,
      w = 1 - e;
    if (w > bw) {
      ((bw = w), (best = k));
    }
  });
  return best;
};

// Queues the mountains (with their flanking peaks).
const queueMountains = st => {
  const { R, P, seed, c } = st;
  const add = itemAdder(st.items);
  R.mounts.forEach(([x, y, s, sn]) => {
    const lib = P.every(p => Math.hypot(p.x - x, p.y - y) > 26 * Math.max(1, s));
    if (!lib) {
      return;
    }
    const r2 = mulberry32((((x * 31) ^ (y * 17)) + seed) | 0);
    add(y + 13 * s - 0.5, () => {
      mountain(c, x - 22 * s, y - 6 * s, s * 0.62, sn, r2);
      mountain(c, x + 20 * s, y - 4 * s, s * 0.55, sn, r2);
    });
    add(y + 14 * s, () => mountain(c, x, y, s, sn, r2));
  });
};

// Queues the forest trees.
const queueForests = st => {
  const { R, rnd, c } = st;
  const add = itemAdder(st.items);
  // forests
  R.forests.forEach(([k, fx, fy, n, sp]) => {
    const rad = sp * Math.sqrt(n) * 1.15;
    let put = 0;
    for (let t = 0; t < n * 5 && put < n; t++) {
      const a = rnd() * 6.283,
        d = Math.sqrt(rnd()) * rad,
        x = fx + Math.cos(a) * d,
        y = fy + Math.sin(a) * d * 0.72;
      if (!isLandAt(st, x, y) || !isFreeAt(st, x, y, 34)) {
        continue;
      }
      put++;
      const s = 0.8 + rnd() * 0.45;
      const pal = k === 'a' ? TPAL.a[(rnd() * 3) | 0] : k === 'j' ? TPAL.j[(rnd() * 2) | 0] : TPAL.b[(rnd() * 3) | 0];
      if (k === 'p' || k === 's') {
        add(y, () => pine(c, x, y, s, k === 's'));
      } else if (k === 'j' && rnd() < 0.3) {
        add(y, () => palm(c, x, y, s * 0.9));
      } else {
        add(y, () => broadleaf(c, x, y, s, pal));
      }
    }
  });
};

// Queues the sparse vegetation depending on the biome.
const queueVegetation = st => {
  const { R, rnd, c, MT, FF } = st;
  const add = itemAdder(st.items);
  // sparse vegetation depending on the biome
  for (let t = 0; t < 520; t++) {
    const x = 20 + rnd() * (VW - 40),
      y = 20 + rnd() * (VH - 40),
      i = gi(x, y);
    if (!isLandAt(st, x, y) || !isFreeAt(st, x, y, 46) || MT[i] > 0.35) {
      continue;
    }
    const b = biomeAt(R, x, y),
      r = rnd();
    if (b === 'desert') {
      if (r < 0.35) {
        add(y, () => cactus(c, x, y, 0.8 + rnd() * 0.3));
      } else if (r < 0.5) {
        add(y, () => boulder(c, x, y, 0.6, 0));
      }
    } else if (b === 'snow') {
      if (r < 0.45) {
        add(y, () => pine(c, x, y, 0.8, 1));
      }
    } else if (b === 'marsh') {
      if (r < 0.35) {
        add(y, () => PROP.reeds(c, x, y));
      } else if (r < 0.45) {
        add(y, () => deadTree(c, x, y, 0.8));
      }
    } else if (b === 'dark') {
      if (r < 0.5) {
        add(y, () => deadTree(c, x, y, 0.9));
      }
    } else if (b === 'ash' || b === 'lava') {
      if (r < 0.3) {
        add(y, () => boulder(c, x, y, 0.7, 1));
      }
    } else if (b === 'autumn') {
      if (r < 0.4) {
        add(y, () => broadleaf(c, x, y, 0.8, TPAL.a[(rnd() * 3) | 0]));
      }
    } else if (b === 'jungle') {
      if (r < 0.4) {
        add(y, () => (rnd() < 0.5 ? palm(c, x, y, 0.8) : broadleaf(c, x, y, 0.85, TPAL.j[0])));
      }
    } else if (b === 'rocky' || b === 'mountain') {
      if (r < 0.3) {
        add(y, () => boulder(c, x, y, 0.6 + rnd() * 0.3, 0));
      }
    } else if (FF[i] < 0.2) {
      if (r < 0.12) {
        add(y, () => broadleaf(c, x, y, 0.75 + rnd() * 0.3, TPAL.b[(rnd() * 3) | 0]));
      } else if (r < 0.3) {
        add(y, () => bush(c, x, y, 0.8 + rnd() * 0.4));
      }
    }
  }
};

// Queues the beach palm trees and reef islet palms.
const queuePalms = st => {
  const { R, rnd, c, M, B12 } = st;
  const add = itemAdder(st.items);
  // beach palm trees (Hoenn)
  (R.palms || []).forEach(([x, y]) => isFreeAt(st, x, y, 26) && add(y, () => palm(c, x, y, 1)));
  if (R.reef) {
    for (let t = 0; t < 260; t++) {
      const x = rnd() * VW,
        y = rnd() * VH,
        i = gi(x, y);
      if (M[i] > 0.95 && B12[i] < 0.84 && B12[i] > 0.7 && isFreeAt(st, x, y, 40) && rnd() < 0.5) {
        add(y, () => palm(c, x, y, 0.75 + rnd() * 0.25));
      }
    }
  }
};

// Queues the hamlets, gyms and per-type scenery around places.
const queuePlaces = st => {
  const { P, seed, c, WM, lights } = st;
  const add = itemAdder(st.items);
  // hamlets, gyms and scenery specific to each type
  const angles = [205, 335, 168, 12, 250, 290, 145, 35];
  P.forEach(p => {
    const r3 = mulberry32((((p.x * 131) ^ (p.y * 71)) + seed) | 0);
    const at = (ang, rr) => [
      p.x + Math.cos((ang * Math.PI) / 180) * rr,
      p.y + Math.sin((ang * Math.PI) / 180) * rr * 0.8,
    ];
    const ok = (x, y) => isLandAt(st, x, y) && WM[gi(x, y)] < 0.05;
    if (p.grp === 'route') {
      add(p.y + 30, () => tallGrass(c, p.x, p.y + 2, 46, 44, r3));
      return;
    }
    if (p.id === 'gue') {
      add(p.y, () => {
        c.fillStyle = '#a8a29a';
        for (let k = -2; k <= 2; k++) {
          ell(c, p.x + k * 5, p.y + 18 + k * 1.2, 2.2, 1.4);
        }
      });
    }
    if (p.id === 'safari') {
      add(p.y - 20, () => {
        c.strokeStyle = '#8a5a2e';
        c.lineWidth = 1.1;
        c.beginPath();
        c.moveTo(p.x - 40, p.y - 18);
        c.lineTo(p.x + 40, p.y - 18);
        for (let k = -40; k <= 40; k += 8) {
          c.moveTo(p.x + k, p.y - 18);
          c.lineTo(p.x + k, p.y - 23);
        }
        c.stroke();
      });
      add(p.y + 10, () => tallGrass(c, p.x - 36, p.y, 18, 16, r3));
    }
    const isArena = p.grp === 'aventure' && p.t && !/^rv/.test(p.id);
    if (isArena && ok(p.x, p.y - 30)) {
      add(p.y - 30, () => gym(c, p.x, p.y - 30, typeCol(p.t)));
    }
    if (isArena) {
      const nb = 2 + ((r3() * 2) | 0);
      let k = 0;
      for (const ang of angles) {
        if (k >= nb) {
          break;
        }
        const [hx, hy] = at(ang + (r3() - 0.5) * 16, 44 + r3() * 8);
        if (!ok(hx, hy)) {
          continue;
        }
        k++;
        const roof = ['#c0453a', '#3f6fb5', '#d08a2a', '#4a8a4a'][(r3() * 4) | 0];
        add(hy, () => house(c, hx, hy, 0.95, roof));
        lights.push([hx, hy - 4]);
      }
      const pr = PROPS[p.t] || [];
      pr.forEach((name, j) => {
        const ang = [180, 0, 215, 325][j % 4] + (r3() - 0.5) * 20;
        const [qx, qy] = at(ang, 58 + r3() * 10);
        if (ok(qx, qy) && PROP[name]) {
          add(qy, () => PROP[name](c, qx, qy));
        }
      });
    } else if (/^rv/.test(p.id)) {
      add(p.y - 22, () => {
        c.fillStyle = '#7a5530';
        c.fillRect(p.x + 22, p.y - 30, 1.4, 9);
        c.fillStyle = '#c99a5a';
        c.fillRect(p.x + 18, p.y - 32, 10, 5);
      });
    }
  });
};

// Queues the monuments and records their smoke and light points.
const queueLandmarks = st => {
  const { R, c, lights, smoke } = st;
  const add = itemAdder(st.items);
  // monuments
  R.marks.forEach(([k, x, y, s]) => {
    if (!LANDMARK[k]) {
      return;
    }
    add(y + 0.1, () => LANDMARK[k](c, x, y, s));
    if (k === 'volcano') {
      smoke.push([x, y - 28 * (s || 1)]);
    }
    if (k === 'lighthouse') {
      lights.push([x, y - 28]);
    }
    if (k === 'tower' || k === 'pagoda') {
      lights.push([x, y - 14]);
    }
  });
};

// Queues the grass tufts and flowers.
const queueTufts = st => {
  const { R, rnd, c, MT, WM, RM2, N2 } = st;
  const add = itemAdder(st.items);
  // tufts and flowers
  for (let t = 0; t < 900; t++) {
    const x = rnd() * VW,
      y = rnd() * VH,
      i = gi(x, y);
    if (!isLandAt(st, x, y) || MT[i] > 0.3 || WM[i] > 0.05 || RM2[i] > 0.05) {
      continue;
    }
    const b = biomeAt(R, x, y);
    if (b === 'desert' || b === 'snow' || b === 'ash' || b === 'lava') {
      continue;
    }
    if (rnd() < 0.72) {
      add(y - 1, () => {
        c.strokeStyle = 'rgba(38,92,40,.55)';
        c.lineWidth = 0.7;
        c.beginPath();
        c.moveTo(x - 1.4, y);
        c.lineTo(x - 0.8, y - 2.6);
        c.moveTo(x, y);
        c.lineTo(x, y - 3.2);
        c.moveTo(x + 1.4, y);
        c.lineTo(x + 0.9, y - 2.4);
        c.stroke();
      });
    } else if (N2[i] > 0.5) {
      const col = ['#ffffff', '#ffd84a', '#ff8fb4', '#c9a6ff'][(rnd() * 4) | 0];
      add(y - 1, () => {
        c.fillStyle = col;
        circ(c, x, y - 1, 0.9);
        circ(c, x + 2.2, y + 0.4, 0.8);
      });
    }
  }
};

// Queues the sea rocks, sailboats and whirlpools, and records sea sparkles.
const queueSeaDecor = st => {
  const { R, rnd, c, P, M, BS, sparks } = st;
  const add = itemAdder(st.items);
  // sea: rocks, sailboats, whirlpools
  const seaSpots = [];
  for (let t = 0; t < 4000 && (seaSpots.length < 14 || sparks.length < 18); t++) {
    const x = 14 + rnd() * (VW - 28),
      y = 14 + rnd() * (VH - 28),
      i = gi(x, y);
    if (M[i] > 0.01) {
      continue;
    }
    if (!P.every(p => Math.hypot(p.x - x, p.y - y) > 70)) {
      continue;
    }
    const s = BS[i];
    if (s > 0.16 && s < 0.4 && seaSpots.length < 14 && seaSpots.every(([a, b]) => Math.hypot(a - x, b - y) > 55)) {
      seaSpots.push([x, y, 'rock']);
    } else if (
      s > 0.03 &&
      s < 0.12 &&
      seaSpots.filter(q => q[2] === 'boat').length < 2 &&
      seaSpots.every(([a, b]) => Math.hypot(a - x, b - y) > 120)
    ) {
      seaSpots.push([x, y, 'boat']);
    } else if (s > 0.05 && s < 0.45 && sparks.length < 18 && sparks.every(([a, b]) => Math.hypot(a - x, b - y) > 40)) {
      sparks.push([x | 0, y | 0]);
    }
  }
  seaSpots.forEach(([x, y, k]) => add(y, () => (k === 'boat' ? boat(c, x, y) : seaRock(c, x, y, 0.7 + rnd() * 0.5))));
  (R.whirl || []).forEach(([x, y]) => add(y, () => whirl(c, x, y)));
};

// Draws the queued elements in depth order.
const drawQueuedItems = async st => {
  const { items } = st;
  items.sort((a, b) => a[0] - b[0]);
  for (let k = 0; k < items.length; k++) {
    items[k][1]();
    if (k % 150 === 149) {
      await tick();
    }
  }
};

// Draws the warm light and vignetting.
const drawLighting = st => {
  const { c } = st;
  // warm light and vignetting
  const gl = c.createRadialGradient(VW * 0.22, VH * 0.08, 10, VW * 0.22, VH * 0.08, VW * 0.85);
  gl.addColorStop(0, 'rgba(255,236,190,.16)');
  gl.addColorStop(1, 'rgba(255,236,190,0)');
  c.fillStyle = gl;
  c.fillRect(0, 0, VW, VH);
  const vg = c.createRadialGradient(VW / 2, VH / 2, VH * 0.42, VW / 2, VH / 2, VW * 0.64);
  vg.addColorStop(0, 'rgba(2,12,30,0)');
  vg.addColorStop(1, 'rgba(2,12,30,.34)');
  c.fillStyle = vg;
  c.fillRect(0, 0, VW, VH);
};

// Encodes the final canvas as an image URL and releases it.
const exportCanvas = async st => {
  const { big } = st;
  const url = await new Promise(res => {
    try {
      big.toBlob(b => res(b ? URL.createObjectURL(b) : big.toDataURL('image/jpeg', 0.9)), 'image/jpeg', 0.9);
    } catch (e) {
      res(big.toDataURL('image/jpeg', 0.9));
    }
  });
  big.width = 0;
  return url;
};

// Paints a whole region map and returns its image URL with the animated-layer anchor points.
const generate = async reg => {
  const st = prepareRegion(reg);
  await computeLandFields(st);
  await computeWaterRoadMasks(st);
  await computeRelief(st);
  const small = await paintTerrainPixels(st);
  /* ---- high-definition vector layer ---- */
  createVectorCanvas(st, small);
  drawShoreline(st);
  drawRoads(st);
  drawWaves(st);
  drawLakes(st);
  drawRivers(st);
  await tick();
  drawFields(st);
  drawClearings(st);
  queueMountains(st);
  queueForests(st);
  queueVegetation(st);
  queuePalms(st);
  queuePlaces(st);
  queueLandmarks(st);
  queueTufts(st);
  queueSeaDecor(st);
  await drawQueuedItems(st);
  drawLighting(st);
  const url = await exportCanvas(st);
  return { url, lights: st.lights, sparks: st.sparks, smoke: st.smoke };
};

/* ---------- animated layer: clouds, birds, reflections, smoke, night ---------- */
const fxSvg = F =>
  `<svg class="map-fx" viewBox="0 0 1000 640" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><radialGradient id="map-fx-lum"><stop offset="0" stop-color="#fff2b8" stop-opacity="1"/><stop offset=".3" stop-color="#ffc35a" stop-opacity=".55"/><stop offset="1" stop-color="#ffb040" stop-opacity="0"/></radialGradient></defs><g class="fx-lums">${F.lights.map(([x, y]) => `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="10" fill="url(#map-fx-lum)"/>`).join('')}</g></svg>`;

const fxHtml = F => {
  const pc = (x, y) => `left:${(x / 10).toFixed(2)}%;top:${(y / 6.4).toFixed(2)}%`;
  let h = '';
  [
    [22, 30, 95, 0],
    [60, 36, 130, -60],
    [40, 24, 110, -30],
  ].forEach(
    ([t, w, d, l]) =>
      (h += `<i class="fa-sh" style="top:${t}%;width:${w}%;--to:${Math.round(10000 / w + 100)}%;animation-duration:${d}s;animation-delay:${l}s"></i>`)
  );
  [
    [4, 20, 150, 0],
    [80, 24, 190, -120],
    [34, 15, 170, -50],
  ].forEach(
    ([t, w, d, l]) =>
      (h += `<i class="fa-cl" style="top:${t}%;width:${w}%;--to:${Math.round(10000 / w + 100)}%;animation-duration:${d}s;animation-delay:${l}s"></i>`)
  );
  F.sparks.forEach(
    ([x, y], i) => (h += `<i class="fa-sp" style="${pc(x, y)};animation-delay:${(-i * 0.61).toFixed(2)}s"></i>`)
  );
  F.smoke.forEach(([x, y]) =>
    [0, 1, 2].forEach(k => (h += `<i class="fa-pf" style="${pc(x, y)};animation-delay:${-k * 2}s"></i>`))
  );
  const birds = c =>
    `<svg viewBox="-16 -8 50 22"><path d="M0 0q4-5 8 0q4-5 8 0M20 8q3-4 6 0q3-4 6 0M-14 10q3-4 6 0q3-4 6 0" fill="none" stroke="${c}" stroke-width="1.6" stroke-linecap="round"/></svg>`;
  h += `<i class="fa-bd b1" style="top:20%;--to:2700%">${birds('#1e2a30')}</i><i class="fa-bd b2" style="top:58%;--to:-2700%">${birds('#ffffff')}</i>`;
  return h;
};

/* ---------- fog over unexplored areas ---------- */
const fogSvg = reg => {
  let puffs = '';
  try {
    const old = V4.region;
    V4.region = reg;
    let L = [];
    try {
      L = placesR().filter(p => placeState(p) === 'lock');
    } finally {
      V4.region = old;
    }
    L.forEach(p => {
      const r = mulberry32((p.x * 97 + p.y * 13) | 0);
      for (let k = 0; k < 7; k++) {
        const a = r() * 6.283,
          d = 6 + r() * 34;
        puffs += `<circle cx="${(p.x + Math.cos(a) * d).toFixed(0)}" cy="${(p.y + Math.sin(a) * d * 0.7).toFixed(0)}" r="${(26 + r() * 22).toFixed(0)}" fill="url(#fog-gradient)"/>`;
      }
    });
  } catch {
    /* Best effort: failure here is non-fatal. */
  }
  return `<svg class="fogveil" viewBox="0 0 1000 640" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><radialGradient id="fog-gradient"><stop offset="0" stop-color="#eef2f6" stop-opacity=".62"/><stop offset=".55" stop-color="#dfe6ee" stop-opacity=".34"/><stop offset="1" stop-color="#dfe6ee" stop-opacity="0"/></radialGradient></defs><g class="fog-g">${puffs}</g></svg>`;
};

/* ---------- integration into the map ---------- */
// Painting, animated layers, fog, title and data-tod / data-wx of #mapSt: rendered by
// React (src/screens/map/Stage.jsx), which reads LIVING_MAP. Only the (asynchronous) drawing is here.
const PAINT = {};

const apply = () => refreshMap();

const CVER = 'map-cache-2';

const idb = () =>
  new Promise((res, rej) => {
    try {
      const q = indexedDB.open('res-carte-471', 1);
      q.onupgradeneeded = () => q.result.createObjectStore('p');
      q.onsuccess = () => res(q.result);
      q.onerror = () => rej(q.error);
    } catch (e) {
      rej(e);
    }
  });

const cacheGet = async reg => {
  try {
    const db = await idb();
    const v = await new Promise((res, rej) => {
      const r = db
        .transaction('p')
        .objectStore('p')
        .get(reg + '-' + CVER);
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
    db.close();
    if (!v || !v.blob) {
      return null;
    }
    return { url: URL.createObjectURL(v.blob), lights: v.lights, sparks: v.sparks, smoke: v.smoke };
  } catch (e) {
    return null;
  }
};

const cachePut = async (reg, res) => {
  try {
    const blob = await fetch(res.url).then(r => r.blob());
    const db = await idb();
    await new Promise((ok, ko) => {
      const t = db.transaction('p', 'readwrite');
      const st = t.objectStore('p');
      try {
        st.getAllKeys().onsuccess = e =>
          (e.target.result || []).forEach(k => !String(k).endsWith(CVER) && st.delete(k));
      } catch {
        /* Best effort: failure here is non-fatal. */
      }
      st.put({ blob, lights: res.lights, sparks: res.sparks, smoke: res.smoke }, reg + '-' + CVER);
      t.oncomplete = ok;
      t.onerror = () => ko(t.error);
    });
    db.close();
  } catch {
    /* Best effort: failure here is non-fatal. */
  }
};

const ensure = reg => {
  if (!REG[reg] || PAINT[reg]) {
    return;
  }
  PAINT[reg] = { state: 'busy' };
  setTimeout(() => {
    cacheGet(reg)
      .then(hit => hit || generate(reg).then(res => (cachePut(reg, res), res)))
      .then(res => {
        PAINT[reg] = Object.assign({ state: 'ok' }, res);
        apply();
      })
      .catch(e => {
        PAINT[reg] = { state: 'err' };
        try {
          console.warn('Map v4.71: drawing failed, keeping the plain map.', e);
        } catch {
          /* Best effort: failure here is non-fatal. */
        }
      });
  }, 30);
};

const gi = (x, y) => clamp((y / Q) | 0, 0, GH - 1) * GW + clamp((x / Q) | 0, 0, GW - 1);

const sstep = (a, b, v) => {
  const t = clamp((v - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

// Instructions run at startup, in the original order (see index.js).
export function init() {
  LIVING_MAP = { PAINT, REG, fxSvg, fxHtml, fogSvg };
  HOOKS.mapRendered.push(() => {
    if (document.getElementById('mapSt')) {
      ensure(V4.region === 'hoenn' ? 'hoenn' : V4.region === 'johto' ? 'johto' : 'kanto');
    }
  });
  HOOKS.timeOfDay.push(t => {
    // set directly, without redrawing the map; Stage.jsx renders the same value (TOD)
    const st = document.getElementById('mapSt');
    if (st) {
      st.dataset.tod = t;
    }
  });
  window.__livingMap = { generate, PAINT, apply, ensure, REG };
}
