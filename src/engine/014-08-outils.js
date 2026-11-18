/* Section d'origine : 08-outils.js */

import { MK, RX, TYPES } from './004-01-donnees.js';
import { BY, PKT, PK_ART } from './009-03-pokemon.js';
import { showToast } from '../screens/overlays/shellOverlays.js';

export let $, $$, NS, RM, tc, gp, INK, markOf, rxCat;


function lum(h) {
  const n = parseInt(h.slice(1), 16);
  return (0.2126 * (n >> 16)) / 255 + (0.7152 * ((n >> 8) & 255)) / 255 + (0.0722 * (n & 255)) / 255;
}


export function medal(types, cls = '') {
  const a = tc(types[0]),
    b = tc(types[1] || types[0]);
  const shine = 'radial-gradient(circle at 34% 26%,rgba(255,255,255,.42),rgba(255,255,255,0) 52%)';
  const bg = types[1] ? `${shine},conic-gradient(from 225deg,${a} 0 50%,${b} 50% 100%)` : `${shine},${a}`;
  const h = `<span class="medal ${cls}" style="background:${bg};--glow:${a}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${gp(types[0])}" fill="${INK}" fill-rule="evenodd"/></svg></span>`;
  // l’illustration du Pokémon dans son médaillon de type
  const id = PKT.get(types);
  if (!id || !BY[id]) return h;
  return h
    .replace('<span class="medal ', '<span class="medal pk ')
    .replace(
      '<svg viewBox',
      `<img class="mdl-a" src="${PK_ART(BY[id].no)}" alt="" loading="lazy" decoding="async" draggable="false" onerror="this.parentNode&&this.parentNode.classList.remove('pk');this.remove()"><svg viewBox`
    );
}


export function mini(t) {
  return `<span class="mini" style="background:${tc(t)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${gp(t)}" fill="${INK}" fill-rule="evenodd"/></svg></span>`;
}


export function tb(t) {
  const c = tc(t),
    fg = lum(c) > 0.45 ? '#0C0E13' : '#FFFFFF';
  return `<span class="tb" style="--c:${c};--fg:${fg}"><i class="tb-s" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="${gp(t)}" fill="${fg}" fill-rule="evenodd"/></svg></i>${t}</span>`;
}


export function codeChip(c) {
  return `<button class="chip code-link" type="button" data-code="${c}">${c}</button>`;
}


export function ico(d) {
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}


// #toast est rendu par React (src/screens/overlays/Toast.jsx) ; mise à jour différée, sans
// flushSync, car toast() peut être appelé pendant le rendu d'un autre composant.
export function toast(msg) {
  showToast(msg);
}


export function el(tag, attrs = {}, parent) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
}


export function hc(c, r, s, ox, oy) {
  const w = Math.sqrt(3) * s;
  return [ox + w * (c + 0.5 * (r & 1)) + w / 2, oy + 1.5 * s * r + s];
}


export function hp(x, y, s) {
  const p = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 180) * (60 * i - 30);
    p.push((x + s * Math.cos(a)).toFixed(1) + ',' + (y + s * Math.sin(a)).toFixed(1));
  }
  return p.join(' ');
}


export function zig(x1, y1, x2, y2, n = 6, amp = 5) {
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

// Instructions exécutées au démarrage, dans l'ordre d'origine (voir index.js).
export function __init() {

/* ===================== OUTILS ===================== */
$ = (s, r = document) => r.querySelector(s);


$$ = (s, r = document) => [...r.querySelectorAll(s)];


NS = 'http://www.w3.org/2000/svg';


RM = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);


tc = t => (TYPES[t] || TYPES.Normal)[0];


gp = t => (TYPES[t] || TYPES.Normal)[1];


INK = 'rgba(8,10,14,.82)';


markOf = id => MK.find(m => m.id === id);


rxCat = id => (RX[id] ? RX[id].k : 'ter');
}
