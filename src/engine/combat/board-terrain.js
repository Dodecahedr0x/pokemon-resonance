/* Living board (overhaul of the battlefield) (added in v4.71). */

import { SCEN } from '../pokemon/pokemon.js';
import { fnv, hash2, mulberry32 } from '../core/utils.js';
import { HOOKS } from '../core/hooks.js';
import { nbrK } from './engine.js';
import { B, BG, HC, HP, L, VB, VERT } from './ui.js';
import { bdClass, boardSet, getBoard, getHost, hostSet } from '../../screens/combat/board/boardStore.js';

const RS = 3;

// pixels per viewBox unit
const TS = 256;

// texture size
// deterministic randomness and noise: mulberry32, hash2 and fnv (014)
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

/* periodic noise: textures tile seamlessly */
const pn = (x, y, per, s) => {
  const xi = Math.floor(x),
    yi = Math.floor(y),
    xf = x - xi,
    yf = y - yi;
  const w = v => ((v % per) + per) % per;
  const a = hash2(w(xi), w(yi), s),
    b = hash2(w(xi + 1), w(yi), s),
    c = hash2(w(xi), w(yi + 1), s),
    d = hash2(w(xi + 1), w(yi + 1), s);
  const u = xf * xf * (3 - 2 * xf),
    v = yf * yf * (3 - 2 * yf);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
};

const pf = (x, y, per, s, o) => {
  let v = 0,
    amp = 0.5,
    n = 0,
    f = 1;
  for (let i = 0; i < o; i++) {
    v += pn(x * f, y * f, per * f, s + i * 31) * amp;
    n += amp;
    amp *= 0.5;
    f *= 2;
  }
  return v / n;
};

const mk = (w, h) => {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
};

const rgb = c => `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;

/* ---------- the floors ---------- */
const KIND = {
  prairie: {
    tex: 'grass',
    c: [
      [56, 110, 50],
      [84, 144, 62],
      [124, 178, 84],
    ],
    side: '#3b2a1a',
    around: 'nature',
    decor: ['fleur', 'touffe', 'caillou', 'touffe'],
    part: 'feuille',
    water: 'riviere',
  },
  jardin: {
    tex: 'grass',
    c: [
      [46, 118, 56],
      [76, 156, 68],
      [130, 198, 98],
    ],
    side: '#36281a',
    around: 'nature',
    decor: ['fleur', 'fleur', 'touffe', 'buisson'],
    part: 'petale',
    water: 'riviere',
  },
  foret: {
    tex: 'leaves',
    c: [
      [66, 78, 38],
      [96, 108, 50],
      [140, 126, 64],
    ],
    side: '#2c2214',
    around: 'nature',
    decor: ['feuille', 'champi', 'touffe'],
    part: 'feuille',
    water: 'riviere',
  },
  fee: {
    tex: 'grass',
    c: [
      [104, 146, 92],
      [146, 182, 120],
      [210, 172, 204],
    ],
    side: '#48304a',
    around: 'nature',
    decor: ['fleur', 'fleur', 'champi'],
    part: 'petale',
    water: 'riviere',
  },
  crepuscule: {
    tex: 'grass',
    c: [
      [56, 58, 90],
      [80, 80, 118],
      [118, 108, 150],
    ],
    side: '#221a30',
    around: 'nature',
    decor: ['touffe', 'fleur'],
    part: 'luciole',
    water: 'nuit',
  },
  carriere: {
    tex: 'dirt',
    c: [
      [104, 80, 56],
      [138, 108, 74],
      [176, 146, 104],
    ],
    side: '#352616',
    around: 'roc',
    decor: ['caillou', 'caillou', 'fissure'],
    part: 'poussiere',
    water: 'boue',
  },
  desert: {
    tex: 'sand',
    c: [
      [186, 148, 94],
      [212, 180, 122],
      [236, 212, 160],
    ],
    side: '#6a4a28',
    around: 'desert',
    decor: ['caillou', 'os'],
    part: 'poussiere',
    water: 'oasis',
  },
  neige: {
    tex: 'snow',
    c: [
      [172, 196, 218],
      [208, 224, 238],
      [244, 250, 255],
    ],
    side: '#55697f',
    around: 'neige',
    decor: ['givre', 'cristal'],
    part: 'neige',
    water: 'glace',
  },
  braise: {
    tex: 'basalt',
    c: [
      [38, 28, 28],
      [62, 44, 40],
      [92, 66, 56],
    ],
    side: '#120a08',
    around: 'volcan',
    decor: ['braise', 'fissure'],
    part: 'braise',
    water: 'nuit',
  },
  tour: {
    tex: 'slab',
    c: [
      [52, 48, 64],
      [72, 66, 86],
      [100, 94, 116],
    ],
    side: '#18141f',
    around: 'ruine',
    decor: ['mousse', 'fissure', 'bougie'],
    part: 'ame',
    water: 'nuit',
  },
  dragon: {
    tex: 'slab',
    c: [
      [64, 58, 56],
      [90, 82, 76],
      [124, 114, 104],
    ],
    side: '#201a18',
    around: 'ruine',
    decor: ['fissure', 'mousse'],
    part: 'poussiere',
    water: 'riviere',
  },
  tenebres: {
    tex: 'slab',
    c: [
      [32, 30, 38],
      [48, 44, 56],
      [70, 64, 80],
    ],
    side: '#0d0b11',
    around: 'ruine',
    decor: ['fissure'],
    part: 'ame',
    water: 'nuit',
  },
  ligue: {
    tex: 'marble',
    c: [
      [178, 174, 166],
      [206, 202, 194],
      [234, 232, 226],
    ],
    side: '#4e4636',
    around: 'stade',
    decor: ['dore'],
    part: 'paillette',
    water: 'bassin',
  },
  stade: {
    tex: 'clay',
    c: [
      [160, 104, 68],
      [186, 126, 86],
      [208, 150, 106],
    ],
    side: '#552f1c',
    around: 'stade',
    decor: [],
    part: 'poussiere',
    water: 'bassin',
  },
  acier: {
    tex: 'metal',
    c: [
      [92, 104, 120],
      [120, 132, 148],
      [156, 168, 182],
    ],
    side: '#283038',
    around: 'stade',
    decor: ['rivet'],
    part: 'etincelle',
    water: 'bassin',
  },
  electrik: {
    tex: 'metal',
    c: [
      [66, 72, 86],
      [92, 98, 112],
      [128, 134, 146],
    ],
    side: '#20242c',
    around: 'stade',
    decor: ['rivet', 'danger'],
    part: 'etincelle',
    water: 'bassin',
  },
  eau: {
    tex: 'wet',
    c: [
      [82, 96, 104],
      [110, 124, 130],
      [148, 160, 164],
    ],
    side: '#26343c',
    around: 'stade',
    decor: ['flaque'],
    part: 'bulle',
    water: 'bassin',
  },
  marais: {
    tex: 'marsh',
    c: [
      [50, 60, 50],
      [72, 78, 64],
      [100, 96, 88],
    ],
    side: '#1a1a16',
    around: 'nature',
    decor: ['flaquePsn', 'touffe'],
    part: 'bullePsn',
    water: 'poison',
  },
  psy: {
    tex: 'tiles',
    c: [
      [88, 68, 116],
      [114, 92, 146],
      [148, 126, 182],
    ],
    side: '#2a1e3e',
    around: 'stade',
    decor: ['rune'],
    part: 'paillette',
    water: 'bassin',
  },
  cristal: {
    tex: 'tiles',
    c: [
      [76, 70, 126],
      [104, 96, 160],
      [148, 138, 204],
    ],
    side: '#201c3e',
    around: 'stade',
    decor: ['cristal'],
    part: 'paillette',
    water: 'bassin',
  },
  dojo: {
    tex: 'wood',
    c: [
      [132, 90, 52],
      [162, 118, 72],
      [194, 148, 98],
    ],
    side: '#3c2612',
    around: 'stade',
    decor: [],
    part: 'poussiere',
    water: 'bassin',
  },
  ciel: {
    tex: 'marble',
    c: [
      [184, 200, 216],
      [210, 222, 236],
      [240, 246, 252],
    ],
    side: '#62748a',
    around: 'ciel',
    decor: ['nuage'],
    part: 'plume',
    water: 'riviere',
  },
};

const TYPE_KIND = {
  Roche: 'carriere',
  Eau: 'eau',
  Électrik: 'electrik',
  Plante: 'jardin',
  Poison: 'marais',
  Psy: 'psy',
  Feu: 'braise',
  Sol: 'desert',
  Spectre: 'tour',
  Combat: 'dojo',
  Dragon: 'dragon',
  Ténèbres: 'tenebres',
  Acier: 'acier',
  Vol: 'ciel',
  Insecte: 'foret',
  Normal: 'stade',
  Glace: 'neige',
  Fée: 'fee',
};

const THEME_KIND = {
  jardin: 'jardin',
  givre: 'neige',
  braise: 'braise',
  cristal: 'cristal',
  crepuscule: 'crepuscule',
};

const kindOf = () => {
  try {
    const th = [...document.body.classList].map(c => /^board-theme-(.+)$/.exec(c)).find(Boolean);
    if (th && THEME_KIND[th[1]]) {
      return THEME_KIND[th[1]];
    }
  } catch {
    /* Best effort: failure here is non-fatal. */
  }
  const D = (B && SCEN[B.sc]) || {};
  if (D.bio === 'gue') {
    return 'prairie';
  }
  if (D.bio === 'roche') {
    return 'carriere';
  }
  if (D.bio === 'tour') {
    return 'tour';
  }
  if (D.bio === 'ligue') {
    return 'ligue';
  }
  if (D.at && TYPE_KIND[D.at]) {
    return TYPE_KIND[D.at];
  }
  return D.bio === 'arene' ? 'stade' : 'prairie';
};

/* ---------- textures (computed once per floor) ---------- */
const TEX = {};

// Per-floor reshaping of the base noise value of a texture pixel.
const TEXTURE_VALUE = {
  sand: (v, i, j, seed) => v * 0.6 + (Math.sin((j + pf(i / 64, j / 64, 4, seed + 5, 2) * 60) * 0.25) * 0.5 + 0.5) * 0.4,
  wood: (v, i, j, seed) =>
    v * 0.35 +
    (Math.sin(j * 0.9 + pf(i / 16, j / 64, 16, seed + 9, 2) * 6) * 0.5 + 0.5) * 0.5 +
    (j % 32 < 2 ? -0.35 : 0),
  metal: (v, i, j, seed) => v * 0.4 + 0.3 + pf(i / 4, j / 64, 64, seed + 3, 1) * 0.3,
  marble: (v, i, j, seed) =>
    v * 0.5 + Math.abs(Math.sin(i * 0.03 + j * 0.02 + pf(i / 48, j / 48, 5.3333, seed + 7, 3) * 8)) * 0.5,
  snow: v => v * 0.7 + 0.25,
};

// Fills the texture pixels with the floor's three-color noise gradient.
const fillTextureBase = (D, name, cols, seed) => {
  const [c1, c2, c3] = cols;
  const shape = TEXTURE_VALUE[name];
  for (let j = 0; j < TS; j++) {
    for (let i = 0; i < TS; i++) {
      let v = pf(i / 32, j / 32, 8, seed, 4);
      const g = (hash2(i, j, seed) - 0.5) * 0.12;
      if (shape) {
        v = shape(v, i, j, seed);
      }
      v = clamp(v + g, 0, 1);
      const t1 = clamp(v * 2, 0, 1),
        t2 = clamp(v * 2 - 1, 0, 1);
      const o = (j * TS + i) * 4;
      D[o] = c1[0] + (c2[0] - c1[0]) * t1 + (c3[0] - c2[0]) * t2;
      D[o + 1] = c1[1] + (c2[1] - c1[1]) * t1 + (c3[1] - c2[1]) * t2;
      D[o + 2] = c1[2] + (c2[2] - c1[2]) * t1 + (c3[2] - c2[2]) * t2;
      D[o + 3] = 255;
    }
  }
};

// Draws f at (px, py) and its eight periodic copies so the texture tiles seamlessly.
const wrapTile = (f, px, py) => {
  for (const dx of [-TS, 0, TS]) {
    for (const dy of [-TS, 0, TS]) {
      f(px + dx, py + dy);
    }
  }
};

// Grass blades shared by the grass, leaves and marsh floors.
const paintGrassBlades = (x, r) => {
  for (let k = 0; k < 520; k++) {
    const px = r() * TS,
      py = r() * TS,
      l = 3 + r() * 5,
      a = -1.57 + (r() - 0.5) * 0.8,
      light = r() < 0.5;
    wrapTile(
      (X, Y) => {
        x.strokeStyle = light ? 'rgba(220,255,170,.18)' : 'rgba(10,40,10,.22)';
        x.lineWidth = 1.2;
        x.beginPath();
        x.moveTo(X, Y);
        x.lineTo(X + Math.cos(a) * l, Y + Math.sin(a) * l);
        x.stroke();
      },
      px,
      py
    );
  }
};

// Fallen autumn leaves of the leaves floor.
const paintFallenLeaves = (x, r) => {
  for (let k = 0; k < 90; k++) {
    const px = r() * TS,
      py = r() * TS,
      a = r() * 6.28,
      col = ['#a5662c', '#c98a3a', '#7a8a2e', '#8c4a22'][(r() * 4) | 0];
    wrapTile(
      (X, Y) => {
        x.fillStyle = col;
        x.beginPath();
        x.ellipse(X, Y, 4, 2, a, 0, 6.28);
        x.fill();
      },
      px,
      py
    );
  }
};

// Murky pools of the marsh floor.
const paintMarshPools = (x, r) => {
  for (let k = 0; k < 14; k++) {
    const px = r() * TS,
      py = r() * TS,
      rx = 8 + r() * 14;
    wrapTile(
      (X, Y) => {
        x.fillStyle = 'rgba(70,40,90,.35)';
        x.beginPath();
        x.ellipse(X, Y, rx, rx * 0.5, 0, 0, 6.28);
        x.fill();
      },
      px,
      py
    );
  }
};

// Pebbles of the dirt, sand and basalt floors.
const paintPebbles = (x, r, name) => {
  for (let k = 0; k < (name === 'sand' ? 60 : 160); k++) {
    const px = r() * TS,
      py = r() * TS,
      s = 1 + r() * (name === 'sand' ? 1.2 : 3);
    wrapTile(
      (X, Y) => {
        x.fillStyle = 'rgba(0,0,0,.25)';
        x.beginPath();
        x.ellipse(X + 0.8, Y + 0.8, s, s * 0.7, 0, 0, 6.28);
        x.fill();
        x.fillStyle = name === 'basalt' ? 'rgba(140,110,100,.5)' : 'rgba(255,240,210,.35)';
        x.beginPath();
        x.ellipse(X, Y, s, s * 0.7, 0, 0, 6.28);
        x.fill();
      },
      px,
      py
    );
  }
};

// Glowing lava cracks of the basalt floor.
const paintLavaCracks = (x, r) => {
  for (let k = 0; k < 10; k++) {
    let px = r() * TS,
      py = r() * TS;
    const pts = [[px, py]];
    for (let s = 0; s < 6; s++) {
      pts.push([(px += (r() - 0.5) * 30), (py += (r() - 0.5) * 30)]);
    }
    wrapTile(
      (X, Y) => {
        x.save();
        x.translate(X - pts[0][0], Y - pts[0][1]);
        x.strokeStyle = 'rgba(255,110,30,.55)';
        x.lineWidth = 2.4;
        x.beginPath();
        pts.forEach(([a, b], i) => (i ? x.lineTo(a, b) : x.moveTo(a, b)));
        x.stroke();
        x.strokeStyle = 'rgba(255,220,120,.7)';
        x.lineWidth = 0.9;
        x.stroke();
        x.restore();
      },
      pts[0][0],
      pts[0][1]
    );
  }
};

// Joint grid of the slab (staggered) and tiles (aligned) floors.
const paintSlabJoints = (x, r, name) => {
  const n = name === 'tiles' ? 4 : 3,
    w = TS / n;
  x.strokeStyle = 'rgba(0,0,0,.35)';
  x.lineWidth = 2;
  for (let k = 0; k <= n; k++) {
    x.beginPath();
    x.moveTo(0, k * w);
    x.lineTo(TS, k * w);
    x.stroke();
    for (let m = 0; m < n; m++) {
      const off = (k % 2) * (name === 'slab' ? w / 2 : 0);
      x.beginPath();
      x.moveTo(m * w + off, k * w);
      x.lineTo(m * w + off, (k + 1) * w);
      x.stroke();
    }
  }
  x.strokeStyle = 'rgba(255,255,255,.08)';
  x.lineWidth = 1;
  for (let k = 0; k <= n; k++) {
    x.beginPath();
    x.moveTo(0, k * w + 1.5);
    x.lineTo(TS, k * w + 1.5);
    x.stroke();
  }
};

// Riveted plate outlines of the metal floor.
const paintMetalPlates = x => {
  x.strokeStyle = 'rgba(0,0,0,.4)';
  x.lineWidth = 2;
  x.strokeRect(1, 1, TS / 2 - 2, TS / 2 - 2);
  x.strokeRect(TS / 2 + 1, 1, TS / 2 - 2, TS / 2 - 2);
  x.strokeRect(1, TS / 2 + 1, TS - 2, TS / 2 - 2);
  x.fillStyle = 'rgba(220,230,240,.55)';
  [
    [8, 8],
    [TS / 2 - 8, 8],
    [TS / 2 + 8, 8],
    [TS - 8, 8],
    [8, TS / 2 + 8],
    [TS - 8, TS / 2 + 8],
    [8, TS - 8],
    [TS - 8, TS - 8],
  ].forEach(([a, b]) => {
    x.beginPath();
    x.arc(a, b, 2.6, 0, 6.28);
    x.fill();
  });
};

// Shallow puddles of the wet floor.
const paintPuddles = (x, r) => {
  for (let k = 0; k < 10; k++) {
    const px = r() * TS,
      py = r() * TS,
      rx = 10 + r() * 18;
    wrapTile(
      (X, Y) => {
        x.fillStyle = 'rgba(150,210,240,.22)';
        x.beginPath();
        x.ellipse(X, Y, rx, rx * 0.5, 0, 0, 6.28);
        x.fill();
        x.strokeStyle = 'rgba(230,250,255,.25)';
        x.lineWidth = 1;
        x.stroke();
      },
      px,
      py
    );
  }
};

// Faint horizontal streaks of the clay floor.
const paintClayStreaks = (x, r) => {
  x.strokeStyle = 'rgba(255,240,220,.12)';
  x.lineWidth = 1;
  for (let k = 0; k < 40; k++) {
    const py = r() * TS;
    x.beginPath();
    x.moveTo(0, py);
    x.lineTo(TS, py + (r() - 0.5) * 6);
    x.stroke();
  }
};

// Sparkling snow grains of the snow floor.
const paintSnowSparkles = (x, r) => {
  for (let k = 0; k < 140; k++) {
    const px = r() * TS,
      py = r() * TS;
    x.fillStyle = `rgba(255,255,255,${0.4 + r() * 0.5})`;
    x.fillRect(px, py, 1.4, 1.4);
  }
};

// Detail painters of each floor, run in this order on the shared random stream.
const TEXTURE_DETAILS = {
  grass: [paintGrassBlades],
  leaves: [paintGrassBlades, paintFallenLeaves],
  marsh: [paintGrassBlades, paintMarshPools],
  dirt: [paintPebbles],
  sand: [paintPebbles],
  basalt: [paintPebbles, paintLavaCracks],
  slab: [paintSlabJoints],
  tiles: [paintSlabJoints],
  metal: [paintMetalPlates],
  wet: [paintPuddles],
  clay: [paintClayStreaks],
  snow: [paintSnowSparkles],
};

const texture = (name, cols, seed) => {
  const key = name + cols.map(rgb).join('');
  if (TEX[key]) {
    return TEX[key];
  }
  const c = mk(TS, TS),
    x = c.getContext('2d'),
    img = x.createImageData(TS, TS);
  fillTextureBase(img.data, name, cols, seed);
  x.putImageData(img, 0, 0);
  const r = mulberry32((seed * 13 + 7) | 0);
  x.lineCap = 'round';
  (TEXTURE_DETAILS[name] || []).forEach(f => f(x, r, name));
  TEX[key] = c;
  return c;
};

const WATER = {
  riviere: { deep: '#1d5f9a', mid: '#2f86c4', light: '#6cc4ea', foam: 'rgba(240,252,255,.8)' },
  bassin: { deep: '#1a7ea6', mid: '#2fb0cf', light: '#86e2f0', foam: 'rgba(255,255,255,.85)' },
  nuit: { deep: '#14304f', mid: '#1f4c78', light: '#4a86b8', foam: 'rgba(200,225,255,.55)' },
  boue: { deep: '#3e5560', mid: '#557684', light: '#8fb0ba', foam: 'rgba(230,220,200,.6)' },
  oasis: { deep: '#18789a', mid: '#2aa2bc', light: '#7ad6e2', foam: 'rgba(255,250,230,.8)' },
  glace: { deep: '#5f9cc6', mid: '#8cc4e4', light: '#d6f0fb', foam: 'rgba(255,255,255,.9)' },
  poison: { deep: '#3a2a52', mid: '#5c3e7c', light: '#9c76c4', foam: 'rgba(220,190,255,.6)' },
};

/* ---------- geometry ---------- */
const hexPoints = (x, y, s) =>
  HP(x, y, s)
    .split(' ')
    .map(p => p.split(',').map(Number));

const path = (c, P) => {
  c.beginPath();
  P.forEach(([a, b], i) => (i ? c.lineTo(a, b) : c.moveTo(a, b)));
  c.closePath();
};

const ell = (c, x, y, rx, ry) => {
  c.beginPath();
  c.ellipse(x, y, rx, ry, 0, 0, 6.2832);
  c.fill();
};

const circ = (c, x, y, r) => {
  c.beginPath();
  c.arc(x, y, r, 0, 6.2832);
  c.fill();
};

/* ---------- small decorations ---------- */
const rock = (c, x, y, s, K, _r) => {
  c.fillStyle = 'rgba(0,0,0,.32)';
  ell(c, x + 2 * s, y + 3 * s, 11 * s, 3.6 * s);
  const base =
    K.tex === 'basalt'
      ? ['#2a2222', '#4a3c38', '#6a5a52']
      : K.tex === 'snow'
        ? ['#5d6c7c', '#8494a6', '#b4c2d0']
        : K.tex === 'sand'
          ? ['#7a5e40', '#a08060', '#c8a882']
          : ['#4c4c52', '#76767e', '#a2a2aa'];
  const P = [
    [x - 11 * s, y + 3 * s],
    [x - 9 * s, y - 5 * s],
    [x - 3 * s, y - 10 * s],
    [x + 5 * s, y - 9 * s],
    [x + 11 * s, y - 2 * s],
    [x + 10 * s, y + 4 * s],
  ];
  c.fillStyle = base[0];
  path(c, P);
  c.fill();
  c.fillStyle = base[1];
  path(c, [P[0], P[1], P[2], P[3], [x + 2 * s, y - Number(s)], [x - 4 * s, y + 3 * s]]);
  c.fill();
  c.fillStyle = base[2];
  path(c, [P[1], P[2], P[3], [x - Number(s), y - 4 * s]]);
  c.fill();
  if (K.around === 'nature' || K.tex === 'leaves') {
    c.fillStyle = 'rgba(96,150,60,.75)';
    ell(c, x - 3 * s, y - 8.5 * s, 4.5 * s, 1.6 * s);
  }
  if (K.tex === 'snow') {
    c.fillStyle = '#f4faff';
    path(c, [
      [x - 9 * s, y - 4.5 * s],
      [x - 3 * s, y - 10 * s],
      [x + 5 * s, y - 9 * s],
      [x + 9 * s, y - 3.5 * s],
      [x + 2 * s, y - 5.5 * s],
    ]);
    c.fill();
  }
  if (K.tex === 'basalt') {
    c.strokeStyle = 'rgba(255,120,40,.8)';
    c.lineWidth = 0.8;
    c.beginPath();
    c.moveTo(x - 4 * s, y - 6 * s);
    c.lineTo(x, y - Number(s));
    c.lineTo(x + 5 * s, y - 4 * s);
    c.stroke();
  }
};

const DECO = {
  fleur: (c, x, y, r) => {
    const col = ['#ffffff', '#ffd84a', '#ff8fb4', '#c9a6ff', '#ff6b5a'][(r() * 5) | 0];
    for (let k = 0; k < 3; k++) {
      const a = r() * 6.28,
        d = r() * 3;
      c.fillStyle = col;
      circ(c, x + Math.cos(a) * d, y + Math.sin(a) * d, 0.9);
      c.fillStyle = '#fff6b0';
      circ(c, x + Math.cos(a) * d, y + Math.sin(a) * d, 0.35);
    }
  },
  touffe: (c, x, y) => {
    c.strokeStyle = 'rgba(30,80,30,.6)';
    c.lineWidth = 0.7;
    c.beginPath();
    [-1.6, 0, 1.6].forEach(d => {
      c.moveTo(x + d, y);
      c.lineTo(x + d * 1.3, y - 3.2 + Math.abs(d) * 0.4);
    });
    c.stroke();
  },
  buisson: (c, x, y) => {
    c.fillStyle = 'rgba(0,0,0,.25)';
    ell(c, x + 1, y + 1.2, 4, 1.4);
    c.fillStyle = '#2f7a38';
    circ(c, x - 1.4, y - 1.2, 2.4);
    circ(c, x + 1.6, y - 1, 2.1);
    c.fillStyle = '#4c9e48';
    circ(c, x - 1.8, y - 2, 1.2);
  },
  caillou: (c, x, y, r) => {
    const s = 0.8 + r() * 0.8;
    c.fillStyle = 'rgba(0,0,0,.3)';
    ell(c, x + 0.6, y + 0.6, 2.2 * s, 1.2 * s);
    c.fillStyle = '#8a8478';
    ell(c, x, y, 2 * s, 1.3 * s);
    c.fillStyle = 'rgba(255,255,255,.3)';
    ell(c, x - 0.5 * s, y - 0.4 * s, 0.9 * s, 0.5 * s);
  },
  fissure: (c, x, y, r) => {
    c.strokeStyle = 'rgba(0,0,0,.35)';
    c.lineWidth = 0.6;
    c.beginPath();
    c.moveTo(x - 5, y);
    c.lineTo(x - 1, y - 1.5 + r());
    c.lineTo(x + 3, y + 1);
    c.lineTo(x + 5, y - 1);
    c.stroke();
  },
  feuille: (c, x, y, r) => {
    c.fillStyle = ['#b06a2a', '#d0902e', '#8a9a34'][(r() * 3) | 0];
    c.beginPath();
    c.ellipse(x, y, 2, 1, r() * 3, 0, 6.28);
    c.fill();
  },
  champi: (c, x, y) => {
    c.fillStyle = '#efe6d6';
    c.fillRect(x - 0.4, y - 1.8, 0.8, 1.8);
    c.fillStyle = '#d84040';
    c.beginPath();
    c.arc(x, y - 1.8, 1.6, Math.PI, 0);
    c.fill();
    c.fillStyle = '#fff';
    circ(c, x - 0.5, y - 2.4, 0.3);
  },
  givre: (c, x, y) => {
    c.strokeStyle = 'rgba(255,255,255,.7)';
    c.lineWidth = 0.5;
    c.beginPath();
    for (let k = 0; k < 3; k++) {
      const a = (k * Math.PI) / 3;
      c.moveTo(x - Math.cos(a) * 2.4, y - Math.sin(a) * 2.4);
      c.lineTo(x + Math.cos(a) * 2.4, y + Math.sin(a) * 2.4);
    }
    c.stroke();
  },
  cristal: (c, x, y) => {
    c.fillStyle = 'rgba(0,0,0,.25)';
    ell(c, x + 1, y + 0.6, 3, 1);
    c.fillStyle = '#9fd4f0';
    path(c, [
      [x - 2, y],
      [x - 1, y - 5],
      [x, y - 2],
      [x + 1, y - 6.5],
      [x + 2.2, y],
    ]);
    c.fill();
    c.fillStyle = 'rgba(255,255,255,.7)';
    path(c, [
      [x - 1, y - 5],
      [x - 0.2, y - 1],
      [x - 1.4, y],
    ]);
    c.fill();
  },
  braise: (c, x, y) => {
    const g = c.createRadialGradient(x, y, 0.2, x, y, 3.5);
    g.addColorStop(0, 'rgba(255,230,140,.95)');
    g.addColorStop(0.4, 'rgba(255,110,30,.6)');
    g.addColorStop(1, 'rgba(255,60,20,0)');
    c.fillStyle = g;
    circ(c, x, y, 3.5);
  },
  mousse: (c, x, y, r) => {
    c.fillStyle = 'rgba(70,120,70,.45)';
    ell(c, x, y, 3 + r() * 2, 1.4);
  },
  bougie: (c, x, y) => {
    c.fillStyle = '#d8d0c0';
    c.fillRect(x - 0.6, y - 3, 1.2, 3);
    const g = c.createRadialGradient(x, y - 3.6, 0.1, x, y - 3.6, 3);
    g.addColorStop(0, 'rgba(200,170,255,.95)');
    g.addColorStop(1, 'rgba(160,120,255,0)');
    c.fillStyle = g;
    circ(c, x, y - 3.6, 3);
  },
  dore: (c, x, y) => {
    c.strokeStyle = 'rgba(200,160,70,.55)';
    c.lineWidth = 0.6;
    c.beginPath();
    c.moveTo(x - 3, y);
    c.lineTo(x, y - 2);
    c.lineTo(x + 3, y);
    c.lineTo(x, y + 2);
    c.closePath();
    c.stroke();
  },
  rivet: (c, x, y) => {
    c.fillStyle = 'rgba(0,0,0,.35)';
    circ(c, x + 0.3, y + 0.3, 1);
    c.fillStyle = '#c9d2dc';
    circ(c, x, y, 0.9);
  },
  danger: (c, x, y) => {
    c.save();
    c.translate(x, y);
    c.rotate(-0.5);
    for (let k = -2; k <= 2; k++) {
      c.fillStyle = k % 2 ? '#1a1a1a' : '#f2c32a';
      c.fillRect(k * 1.6 - 0.8, -0.9, 1.6, 1.8);
    }
    c.restore();
  },
  flaque: (c, x, y) => {
    c.fillStyle = 'rgba(160,220,245,.35)';
    ell(c, x, y, 4, 1.8);
  },
  flaquePsn: (c, x, y) => {
    c.fillStyle = 'rgba(150,90,200,.45)';
    ell(c, x, y, 4, 1.8);
    c.fillStyle = 'rgba(230,200,255,.6)';
    circ(c, x - 1, y - 0.3, 0.5);
  },
  rune: (c, x, y) => {
    c.strokeStyle = 'rgba(220,190,255,.45)';
    c.lineWidth = 0.5;
    c.beginPath();
    c.arc(x, y, 2.4, 0, 6.28);
    c.moveTo(x, y - 2.4);
    c.lineTo(x, y + 2.4);
    c.stroke();
  },
  os: (c, x, y) => {
    c.strokeStyle = '#e8dcc0';
    c.lineWidth = 0.9;
    c.beginPath();
    c.moveTo(x - 2.4, y);
    c.lineTo(x + 2.4, y - 0.6);
    c.stroke();
  },
  nuage: (c, x, y) => {
    c.fillStyle = 'rgba(255,255,255,.35)';
    ell(c, x, y, 5, 1.6);
  },
};

/* border decorations */
const AROUND = {
  nature: (c, x, y, r, K) => {
    const k = r();
    if (k < 0.45) {
      c.fillStyle = 'rgba(0,0,0,.3)';
      ell(c, x + 2, y + 1.5, 7, 2.2);
      c.fillStyle = K.c[0] ? rgb(K.c[0].map(v => v * 0.7)) : '#245a2a';
      circ(c, x - 3, y - 4, 4.6);
      circ(c, x + 3, y - 4, 4.4);
      c.fillStyle = rgb(K.c[1]);
      circ(c, x, y - 7, 4.8);
      c.fillStyle = 'rgba(255,255,220,.18)';
      circ(c, x - 1.6, y - 9, 2);
    } else if (k < 0.7) {
      DECO.buisson(c, x, y);
    } else {
      DECO.caillou(c, x, y, r);
    }
  },
  roc: (c, x, y, r, K) => (r() < 0.6 ? rock(c, x, y, 0.5 + r() * 0.3, K, r) : DECO.caillou(c, x, y, r)),
  desert: (c, x, y, r, K) => {
    if (r() < 0.5) {
      c.fillStyle = 'rgba(0,0,0,.25)';
      ell(c, x + 1.5, y + 1, 4, 1.3);
      c.fillStyle = '#4a8a4a';
      c.fillRect(x - 1, y - 8, 2, 8);
      c.fillRect(x - 3.6, y - 6, 1.6, 3);
      c.fillRect(x - 3.6, y - 4.4, 2.8, 1.2);
      c.fillRect(x + 2, y - 7, 1.6, 3);
      c.fillRect(x + 1, y - 5.2, 2.8, 1.2);
    } else {
      rock(c, x, y, 0.4, K, r);
    }
  },
  neige: (c, x, y, _r) => {
    c.fillStyle = 'rgba(0,0,0,.22)';
    ell(c, x + 2, y + 1, 5, 1.6);
    for (let k = 0; k < 3; k++) {
      const w = 5 - k * 1.3,
        b = y - k * 3.4;
      c.fillStyle = '#2d5a46';
      path(c, [
        [x - w, b],
        [x, b - 6],
        [x + w, b],
      ]);
      c.fill();
      c.fillStyle = '#eef6fb';
      path(c, [
        [x - w * 0.5, b - 3],
        [x, b - 6],
        [x + w * 0.5, b - 3],
      ]);
      c.fill();
    }
  },
  volcan: (c, x, y, r, K) => (r() < 0.5 ? rock(c, x, y, 0.45, K, r) : DECO.braise(c, x, y)),
  ruine: (c, x, y, r) => {
    if (r() < 0.5) {
      c.fillStyle = 'rgba(0,0,0,.3)';
      ell(c, x + 2, y + 1, 5, 1.6);
      c.fillStyle = '#6a6474';
      c.fillRect(x - 2.6, y - 10 - r() * 6, 5.2, 12);
      c.fillStyle = '#8a8496';
      c.fillRect(x - 2.6, y - 10, 2, 10);
    } else {
      DECO.mousse(c, x, y, r);
    }
  },
  stade: () => {},
  ciel: (c, x, y, r) => {
    c.fillStyle = 'rgba(255,255,255,.8)';
    ell(c, x, y, 9 + r() * 6, 3 + r() * 2);
    ell(c, x - 4, y - 2, 5, 2.6);
  },
};

/* ---------- board painting ---------- */
const terrainSig = () => {
  let s = kindOf() + '|' + (VERT ? 1 : 0) + '|' + B.sc + '|';
  for (const k in B.tiles) {
    const t = B.tiles[k];
    s += (t.w ? 'w' : '') + (t.rock ? 'r' : '') + (t.pil ? 'p' : '') + (t.grass ? 'g' : '') + (t.sand ? 's' : '') + ',';
  }
  return s;
};

// Wraps a texture canvas into a repeating pattern scaled back to viewBox units.
const boardPattern = (c, cv) => {
  const p = c.createPattern(cv, 'repeat');
  try {
    p.setTransform(new DOMMatrix().scale(1 / RS));
  } catch {
    /* Best effort: failure here is non-fatal. */
  }
  return p;
};

// Builds the floor, border, sand and grass fill patterns of the board.
const boardPatterns = (c, K) => {
  const tex = texture(K.tex, K.c, 17),
    texA = texture(
      K.tex,
      K.c.map(v => v.map(z => z * 0.62)),
      17
    ),
    sandT = texture('sand', KIND.desert.c, 23),
    grassT = texture(
      'grass',
      [
        [34, 86, 40],
        [52, 116, 52],
        [80, 150, 68],
      ],
      29
    );
  const P = boardPattern(c, tex),
    PA = boardPattern(c, texA),
    PS = boardPattern(c, sandT),
    PG = boardPattern(c, grassT);
  return { P, PA, PS, PG };
};

// Paints the ground around the board (stadium stands, sky or darkened floor).
const paintBorderGround = (c, K, PA, VW, VH) => {
  if (K.around === 'stade') {
    c.fillStyle = '#16181f';
    c.fillRect(0, 0, VW, VH);
    c.fillStyle = PA;
    c.globalAlpha = 0.35;
    c.fillRect(0, 0, VW, VH);
    c.globalAlpha = 1;
    for (let y = 4; y < VH; y += 7) {
      c.fillStyle = y % 14 < 7 ? 'rgba(255,255,255,.03)' : 'rgba(0,0,0,.12)';
      c.fillRect(0, y, VW, 3.5);
    }
  } else if (K.around === 'ciel') {
    const g = c.createLinearGradient(0, 0, 0, VH);
    g.addColorStop(0, '#6fb6ea');
    g.addColorStop(1, '#b8e2fa');
    c.fillStyle = g;
    c.fillRect(0, 0, VW, VH);
  } else {
    c.fillStyle = PA;
    c.fillRect(0, 0, VW, VH);
  }
};

// Drop shadow of the board onto its border.
const paintBoardShadow = bd => {
  const { c, K, C, S, keys } = bd;
  c.save();
  c.shadowColor = 'rgba(0,0,0,.55)';
  c.shadowBlur = 14;
  c.shadowOffsetY = 5;
  c.fillStyle = K.side;
  keys.forEach(k => {
    path(c, hexPoints(C[k][0], C[k][1] + 2.4, S));
    c.fill();
  });
  c.restore();
};

// Border decorations, scattered outside the cells and drawn back to front.
const paintBorderDecorations = (bd, r) => {
  const { c, K, C, S, keys, VW, VH } = bd;
  const inside = (x, y) => keys.some(k => (C[k][0] - x) ** 2 + (C[k][1] - y) ** 2 < (S * 1.08) ** 2);
  const deco = AROUND[K.around];
  const spots = [];
  for (let t = 0; t < 900 && spots.length < 46; t++) {
    const x = r() * VW,
      y = r() * VH;
    if (inside(x, y) || spots.some(([a, b]) => (a - x) ** 2 + (b - y) ** 2 < 140)) {
      continue;
    }
    spots.push([x, y]);
  }
  spots.sort((a, b) => a[1] - b[1]).forEach(([x, y]) => deco(c, x, y, r, K));
};

// Dark joints between cells.
const paintJoints = bd => {
  const { c, K, C, S, keys } = bd;
  c.fillStyle = K.side;
  keys.forEach(k => {
    path(c, hexPoints(C[k][0], C[k][1], S + 0.3));
    c.fill();
  });
};

// Small decorations scattered on a plain cell.
const paintCellDecorations = (c, K, t, x, y, r2) => {
  const L2 = K.decor;
  const n = L2.length ? 1 + ((r2() * 3) | 0) : 0;
  for (let d = 0; d < n; d++) {
    const a = r2() * 6.28,
      rr = 9 + r2() * 11;
    const f = DECO[t.sand ? 'caillou' : L2[(r2() * L2.length) | 0]];
    if (f) {
      f(c, x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.86, r2);
    }
  }
};

// Clipped top face of a cell: floor pattern, tint, light gradient and decorations.
const paintCellTop = (bd, t, x, y, top, r2) => {
  const { c, K, S, pats } = bd;
  c.save();
  path(c, top);
  c.clip();
  c.fillStyle = t.sand ? pats.PS : t.grass ? pats.PG : pats.P;
  c.fillRect(x - S, y - S, S * 2, S * 2);
  const v = (r2() - 0.5) * 0.12;
  c.fillStyle = v > 0 ? `rgba(255,255,240,${v})` : `rgba(0,0,0,${-v})`;
  c.fillRect(x - S, y - S, S * 2, S * 2);
  const g = c.createLinearGradient(x - S, y - S, x + S * 0.6, y + S);
  g.addColorStop(0, 'rgba(255,250,225,.2)');
  g.addColorStop(0.55, 'rgba(255,250,225,0)');
  g.addColorStop(1, 'rgba(0,0,0,.22)');
  c.fillStyle = g;
  c.fillRect(x - S, y - S, S * 2, S * 2);
  // small decorations
  if (!t.rock && !t.pil && !t.grass) {
    paintCellDecorations(c, K, t, x, y, r2);
  }
  if (t.pil) {
    c.fillStyle = 'rgba(0,0,0,.18)';
    c.fillRect(x - S, y - S, S * 2, S * 2);
  }
  c.restore();
};

// One land cell: slab thickness, top face, bright top edge and rocks (water cells are skipped).
const paintCell = (bd, k) => {
  const { c, K, C, S, seed } = bd;
  const t = B.tiles[k],
    [x, y] = C[k],
    r2 = mulberry32((seed + fnv(k)) | 0);
  if (t.w) {
    return;
  }
  const top = hexPoints(x, y, S - 1.1);
  // slab thickness
  c.fillStyle = K.side;
  path(c, hexPoints(x, y + 2.6, S - 1.1));
  c.fill();
  paintCellTop(bd, t, x, y, top, r2);
  // bright edge at the top, shadow at the bottom
  c.lineWidth = 0.9;
  c.strokeStyle = 'rgba(255,255,240,.28)';
  c.beginPath();
  const tp = top;
  const hi = VERT ? [3, 4, 5, 0] : [3, 4, 5];
  hi.forEach((i, j) => (j ? c.lineTo(tp[i][0], tp[i][1]) : c.moveTo(tp[i][0], tp[i][1])));
  c.stroke();
  if (t.rock) {
    rock(c, x - 3, y + 2, 1, K, r2);
    rock(c, x + 9, y + 7, 0.5, K, r2);
    if (r2() < 0.6) {
      rock(c, x - 11, y + 9, 0.38, K, r2);
    }
  }
};

// Neighbors of a water cell, or none when the lookup fails.
const waterNeighbors = k => {
  try {
    return nbrK(k);
  } catch (e) {
    return [];
  }
};

// Dark holes carved under the water cells.
const paintWaterHoles = (bd, water) => {
  const { c, C, S } = bd;
  water.forEach(k => {
    const [x, y] = C[k];
    c.fillStyle = 'rgba(0,0,0,.35)';
    path(c, hexPoints(x, y, S + 0.2));
    c.fill();
  });
};

// Deep-to-mid radial gradient of each water cell.
const paintWaterBeds = (bd, water, W) => {
  const { c, C, S } = bd;
  water.forEach(k => {
    const [x, y] = C[k];
    const g = c.createRadialGradient(x, y + 3, 2, x, y, S * 1.1);
    g.addColorStop(0, W.mid);
    g.addColorStop(1, W.deep);
    c.fillStyle = g;
    path(c, hexPoints(x, y + 1, S + 0.6));
    c.fill();
  });
};

// Wavy ripples clipped inside a water cell.
const paintWaterRipples = (bd, W, x, y, r3) => {
  const { c, S } = bd;
  c.save();
  path(c, hexPoints(x, y + 1, S + 0.6));
  c.clip();
  c.strokeStyle = W.light;
  c.globalAlpha = 0.5;
  c.lineWidth = 0.9;
  for (let w = 0; w < 4; w++) {
    const yy = y - 12 + w * 8 + r3() * 3,
      xx = x - 12 + r3() * 8;
    c.beginPath();
    c.moveTo(xx, yy);
    c.quadraticCurveTo(xx + 3.5, yy - 2.2, xx + 7, yy);
    c.quadraticCurveTo(xx + 10.5, yy + 2.2, xx + 14, yy);
    c.stroke();
  }
  c.globalAlpha = 1;
  c.restore();
};

// Foam and bank shadow on each water cell edge that does not touch other water.
const paintWaterBanks = (bd, W, k, x, y) => {
  const { c, C, S } = bd;
  const tp = hexPoints(x, y + 1, S - 0.4);
  const nb = waterNeighbors(k);
  for (let i = 0; i < 6; i++) {
    const a = tp[i],
      b = tp[(i + 1) % 6],
      mx = (a[0] + b[0]) / 2,
      my = (a[1] + b[1]) / 2,
      ox = x + (mx - x) * 2,
      oy = y + (my - y) * 2;
    const vk = nb.find(n => {
      const q = C[n];
      return q && Math.abs(q[0] - ox) < 6 && Math.abs(q[1] - oy) < 6;
    });
    if (vk && B.tiles[vk].w) {
      continue;
    }
    c.strokeStyle = W.foam;
    c.lineWidth = 1.4;
    c.beginPath();
    c.moveTo(a[0] + (x - a[0]) * 0.06, a[1] + (y - a[1]) * 0.06);
    c.lineTo(b[0] + (x - b[0]) * 0.06, b[1] + (y - b[1]) * 0.06);
    c.stroke();
    c.strokeStyle = 'rgba(0,0,0,.25)';
    c.lineWidth = 2.2;
    c.beginPath();
    c.moveTo(a[0], a[1]);
    c.lineTo(b[0], b[1]);
    c.stroke();
  }
};

// Water surfaces: ripples then bank foam, cell by cell.
const paintWaterSurfaces = (bd, water, W) => {
  const { C, seed } = bd;
  water.forEach(k => {
    const [x, y] = C[k],
      r3 = mulberry32((seed + fnv(k) * 3) | 0);
    paintWaterRipples(bd, W, x, y, r3);
    // foam along the banks
    paintWaterBanks(bd, W, k, x, y);
  });
};

// Overall warm light and vignetting over the whole image.
const paintLighting = (c, VW, VH) => {
  const gl = c.createRadialGradient(VW * 0.25, VH * 0.1, 10, VW * 0.25, VH * 0.1, Math.max(VW, VH));
  gl.addColorStop(0, 'rgba(255,240,200,.12)');
  gl.addColorStop(1, 'rgba(255,240,200,0)');
  c.fillStyle = gl;
  c.fillRect(0, 0, VW, VH);
  const vg = c.createRadialGradient(VW / 2, VH / 2, Math.min(VW, VH) * 0.42, VW / 2, VH / 2, Math.max(VW, VH) * 0.62);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,.4)');
  c.fillStyle = vg;
  c.fillRect(0, 0, VW, VH);
};

const paint = sig => {
  const kind = kindOf(),
    K = KIND[kind],
    seed = fnv(sig) % 100000;
  const [VW, VH] = VB();
  const S = BG.S;
  const can = mk(VW * RS, VH * RS),
    c = can.getContext('2d');
  c.scale(RS, RS);
  c.lineJoin = 'round';
  c.lineCap = 'round';
  const pats = boardPatterns(c, K);
  const r = mulberry32(seed | 0);
  // 1. the border
  paintBorderGround(c, K, pats.PA, VW, VH);
  const keys = Object.keys(B.tiles);
  const C = {};
  keys.forEach(k => (C[k] = HC(k)));
  const bd = { c, K, C, S, keys, seed, VW, VH, pats };
  // drop shadow of the board onto its border
  paintBoardShadow(bd);
  // border decorations, outside the cells
  paintBorderDecorations(bd, r);
  // 2. dark joints between cells
  paintJoints(bd);
  // 3. the cells, top to bottom
  const order = keys.slice().sort((a, b) => C[a][1] - C[b][1]);
  const W = WATER[K.water] || WATER.riviere;
  order.forEach(k => paintCell(bd, k));
  // 4. the water, carved into the board
  const water = order.filter(k => B.tiles[k].w);
  paintWaterHoles(bd, water);
  paintWaterBeds(bd, water, W);
  paintWaterSurfaces(bd, water, W);
  // 5. overall light and vignetting
  paintLighting(c, VW, VH);
  return { can, eau: water.map(k => C[k]), kind };
};

/* ---------- integration ---------- */
const CACHE = new Map();

let cur;

let busy;

const board = () => document.getElementById('bBoard');

// painted image, waves, textureLayer/paintscape classes: rendered by the board's React layers
const ensureLayers = () => {
  const svg = document.getElementById('bSvg');
  if (!svg || !L.tiles) {
    return null;
  }
  if (!getBoard().pv) {
    boardSet({ pv: true }, 'pv', 'paint');
  }
  return svg.querySelector('image.paintedterrain');
};

// .ambientFx particles: rendered by React (Board.jsx), [class, style] per particle
const particles = kind => {
  if (!board()) {
    return;
  }
  const a = getHost().ambientFx;
  if (a && a.k === kind) {
    return;
  }
  const p = KIND[kind].part,
    night = KIND[kind].around === 'nature' || kind === 'crepuscule';
  const items = [];
  for (let i = 0; i < 8; i++) {
    const x = ((i * 37 + 11) % 97) + 1,
      y = ((i * 53 + 29) % 91) + 3;
    items.push([
      'p ' + p,
      {
        left: x + '%',
        top: y + '%',
        animationDelay: (-i * 1.7).toFixed(1) + 's',
        animationDuration: (9 + (i % 5) * 2.2).toFixed(1) + 's',
      },
    ]);
  }
  if (night) {
    for (let i = 0; i < 6; i++) {
      const x = ((i * 41 + 7) % 95) + 2,
        y = ((i * 29 + 17) % 88) + 6;
      items.push([
        'p luciole n',
        {
          left: x + '%',
          top: y + '%',
          animationDelay: (-i * 1.3).toFixed(1) + 's',
          animationDuration: (6 + (i % 4) * 1.6).toFixed(1) + 's',
        },
      ]);
    }
  }
  hostSet({ ambientFx: { k: kind, items } });
};

const doApply = (sig, res) => {
  if (!B || terrainSig() !== sig) {
    return;
  }
  const im = ensureLayers();
  if (!im) {
    return;
  }
  const ok = () => bdClass('paintedterrain', true); // class of #bBoard, rendered by React
  if (im.getAttribute('href') === res.url) {
    ok();
  } else {
    im.onload = ok;
  }
  boardSet({ pvHref: res.url, waves: res.eau }, 'paint'); // painted image and waves

  particles(res.kind);
};

const launchMove = () => {
  if (!B || !L.tiles) {
    return;
  }
  let sig;
  try {
    sig = terrainSig();
  } catch (e) {
    return;
  }
  if (sig === cur) {
    return;
  }
  cur = sig;
  ensureLayers();
  const hit = CACHE.get(sig);
  if (hit) {
    return doApply(sig, hit);
  }
  const id = ++busy;
  setTimeout(() => {
    if (id !== busy || !B) {
      return;
    }
    let out;
    try {
      out = paint(sig);
    } catch (e) {
      try {
        console.warn('Board v4.71: drawing failed, keeping the plain board.', e);
      } catch {
        /* Best effort: failure here is non-fatal. */
      }
      bdClass('paintedterrain', false);
      return;
    }
    const endStep = url => {
      out.can.width = 0;
      const res = { url, eau: out.eau, kind: out.kind };
      CACHE.set(sig, res);
      if (CACHE.size > 10) {
        const [k0, v0] = CACHE.entries().next().value;
        CACHE.delete(k0);
        try {
          if (v0.url.startsWith('blob:')) {
            URL.revokeObjectURL(v0.url);
          }
        } catch {
          /* Best effort: failure here is non-fatal. */
        }
      }
      if (id === busy) {
        doApply(sig, res);
      }
    };
    try {
      out.can.toBlob(
        b => endStep(b ? URL.createObjectURL(b) : out.can.toDataURL('image/jpeg', 0.9)),
        'image/jpeg',
        0.9
      );
    } catch (e) {
      endStep(out.can.toDataURL('image/jpeg', 0.9));
    }
  }, 0);
};

// Instructions run at startup, in the original order (see index.js).
export function init() {
  cur = '';
  busy = 0;
  HOOKS.boardBuilt.push(() => {
    cur = '';
    bdClass('paintedterrain', false);
    launchMove();
  });
  HOOKS.boardRendered.push(launchMove);
  window.__livingBoard = { paint, kindOf, KIND, CACHE, lancer: launchMove, terrainSig };
}
