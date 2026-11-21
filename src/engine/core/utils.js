import { MARKS, REACTIONS, TYPES } from '../data/game-data.js';
import { POKEMON, SPECIES_BY_TYPES } from '../pokemon/pokemon.js';
import { pokemonArtUrl } from '../assets/images.js';
import { showToast } from '../../screens/overlays/shellOverlays.js';

export let reducedMotion;

function lum(h) {
  const n = parseInt(h.slice(1), 16);
  return (0.2126 * (n >> 16)) / 255 + (0.7152 * ((n >> 8) & 255)) / 255 + (0.0722 * (n & 255)) / 255;
}

export function medal(types, cls = '') {
  const a = typeColor(types[0]),
    b = typeColor(types[1] || types[0]);
  const shine = 'radial-gradient(circle at 34% 26%,rgba(255,255,255,.42),rgba(255,255,255,0) 52%)';
  const bg = types[1] ? `${shine},conic-gradient(from 225deg,${a} 0 50%,${b} 50% 100%)` : `${shine},${a}`;
  const h = `<span class="medal ${cls}" style="background:${bg};--glow:${a}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${typeGlyphPath(types[0])}" fill="${GLYPH_INK}" fill-rule="evenodd"/></svg></span>`;
  // the Pokémon's artwork in its type medallion
  const id = SPECIES_BY_TYPES.get(types);
  if (!id || !POKEMON[id]) {
    return h;
  }
  return h
    .replace('<span class="medal ', '<span class="medal has-art ')
    .replace(
      '<svg viewBox',
      `<img class="medal-art" src="${pokemonArtUrl(POKEMON[id].no)}" alt="" loading="lazy" decoding="async" draggable="false" onerror="this.parentNode&&this.parentNode.classList.remove('has-art');this.remove()"><svg viewBox`
    );
}

export function typeIcon(t) {
  return `<span class="type-icon" style="background:${typeColor(t)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${typeGlyphPath(t)}" fill="${GLYPH_INK}" fill-rule="evenodd"/></svg></span>`;
}

export function typeBadge(t) {
  const c = typeColor(t),
    fg = lum(c) > 0.45 ? '#0C0E13' : '#FFFFFF';
  return `<span class="type-badge" style="--c:${c};--fg:${fg}"><i class="type-badge-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="${typeGlyphPath(t)}" fill="${fg}" fill-rule="evenodd"/></svg></i>${t}</span>`;
}

export function strokeIcon(d) {
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

// #toast is rendered by React (src/screens/overlays/Toast.jsx); deferred update, without
// flushSync, since toast() may be called while another component is rendering.
export function toast(msg) {
  showToast(msg);
}

export function svgElement(tag, attrs = {}, parent) {
  const e = document.createElementNS(SVG_NS, tag);
  for (const k in attrs) {
    e.setAttribute(k, attrs[k]);
  }
  if (parent) {
    parent.appendChild(e);
  }
  return e;
}

export function hexCenter(c, r, s, ox, oy) {
  const w = Math.sqrt(3) * s;
  return [ox + w * (c + 0.5 * (r & 1)) + w / 2, oy + 1.5 * s * r + s];
}

export function hexPoints(x, y, s) {
  const p = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 180) * (60 * i - 30);
    p.push((x + s * Math.cos(a)).toFixed(1) + ',' + (y + s * Math.sin(a)).toFixed(1));
  }
  return p.join(' ');
}

export function zigzagPoints(x1, y1, x2, y2, n = 6, amp = 5) {
  const pts = [[x1, y1]],
    dx = x2 - x1,
    dy = y2 - y1,
    L = Math.hypot(dx, dy) || 1,
    px = -dy / L,
    py = dx / L;
  for (let i = 1; i < n; i++) {
    const t = i / n,
      o = (i % 2 ? 1 : -1) * amp;
    pts.push([x1 + dx * t + px * o, y1 + dy * t + py * o]);
  }
  pts.push([x2, y2]);
  return pts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
}

export function after2images(f) {
  requestAnimationFrame(() => requestAnimationFrame(f));
}

/** Promise resolved after ms milliseconds. */
export function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}

/** JSON value stored under k in localStorage; d if it is missing, falsy or unreadable. */
export function readLS(k, d) {
  try {
    const v = JSON.parse(localStorage.getItem(k) || 'null');
    return v || d;
  } catch (e) {
    return d;
  }
}

/** Stores v as JSON under k; full or forbidden storage is ignored. */
export function writeLS(k, v) {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {
    /* Best effort: failure here is non-fatal. */
  }
}

/** mulberry32 generator starting from state a (the seed is prepared by the caller: the same seed replays the same sequence). */
export function mulberry32(a) {
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Value noise: number in [0, 1[ fixed by tile (x, y) and seed s. */
export function valueNoise(x, y, s) {
  let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s, 1274126177)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** 32-bit FNV-1a fingerprint of a string (unsigned integer). */
export function fnvHash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  }
  return h >>> 0;
}

/* ===================== TOOLS ===================== */
export const $ = (s, r = document) => r.querySelector(s);

export const $$ = (s, r = document) => [...r.querySelectorAll(s)];

export const SVG_NS = 'http://www.w3.org/2000/svg';

export const typeColor = t => (TYPES[t] || TYPES.Normal)[0];

export const typeGlyphPath = t => (TYPES[t] || TYPES.Normal)[1];

export const GLYPH_INK = 'rgba(8,10,14,.82)';

export const markOf = id => MARKS.find(m => m.id === id);

export const reactionCategory = id => (REACTIONS[id] ? REACTIONS[id].k : 'ter');

// Statements run at startup, in the original order (see index.js).
export function init() {
  reducedMotion = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
}
