/* Item icons drawn for the new items (added in v4.14), plus the item image shortcut. */

import { itemArtUrl } from './images.js';

export const itemIcon = k => ITEM_ICONS[k] || itemArtUrl(k);

const g = (id, a, b) =>
  `<radialGradient id="${id}" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></radialGradient>`;

const o = {};

/* original icons for the new items (v4.14): simple drawings, no official artwork */
const S = {
  'life-orb': `<defs>${g('a', '#ff9bd0', '#7a1d6b')}</defs><circle cx="24" cy="25" r="17" fill="url(#a)" stroke="#3b0d35" stroke-width="2"/><path d="M15 27c4-7 13-9 18-3" fill="none" stroke="#ffd6f0" stroke-width="2.5" stroke-linecap="round"/><circle cx="18" cy="18" r="3.5" fill="#fff" opacity=".8"/>`,
  'rocky-helmet': `<defs>${g('a', '#e9e9e9', '#6c7178')}</defs><path d="M7 33a17 17 0 0 1 34 0z" fill="url(#a)" stroke="#33363b" stroke-width="2"/><path d="M5 33h38v5H5z" fill="#d9b23a" stroke="#33363b" stroke-width="2"/><path d="M14 18l-3-8 7 5M24 14V5l4 9M34 18l3-8-7 5" fill="#9aa0a8" stroke="#33363b" stroke-width="1.5" stroke-linejoin="round"/>`,
  'sitrus-berry': `<defs>${g('a', '#fff3a0', '#c9a512')}</defs><path d="M24 13c-10 0-15 7-15 15s7 13 15 13 15-5 15-13-5-15-15-15z" fill="url(#a)" stroke="#6d5b10" stroke-width="2"/><path d="M24 14c0-5 3-8 8-9-1 5-4 8-8 9z" fill="#5cb85c" stroke="#2f6b2f" stroke-width="1.5"/><circle cx="18" cy="24" r="1.6" fill="#a8861a"/><circle cx="27" cy="31" r="1.6" fill="#a8861a"/><circle cx="31" cy="22" r="1.6" fill="#a8861a"/>`,
  'oran-berry': `<defs>${g('a', '#9bd3ff', '#1f4fa8')}</defs><circle cx="24" cy="27" r="15" fill="url(#a)" stroke="#132f63" stroke-width="2"/><path d="M24 12c1-5 5-7 10-7-2 4-5 6-10 7z" fill="#5cb85c" stroke="#2f6b2f" stroke-width="1.5"/><circle cx="18" cy="23" r="3" fill="#fff" opacity=".6"/>`,
  'choice-scarf': `<path d="M8 10h32l-6 12 6 16H29l-5-11-5 11H8l6-16z" fill="#f2a8d0" stroke="#7b2d58" stroke-width="2" stroke-linejoin="round"/><path d="M8 16h32" stroke="#7fd0f5" stroke-width="4"/>`,
  'damp-rock': `<defs>${g('a', '#bfe6ff', '#3d6f99')}</defs><path d="M10 34l-3-10 8-12h18l8 12-3 10-14 5z" fill="url(#a)" stroke="#1f3b55" stroke-width="2" stroke-linejoin="round"/><path d="M24 17c-3 4-4 6-4 8a4 4 0 0 0 8 0c0-2-1-4-4-8z" fill="#e8f7ff"/>`,
  'big-root': `<path d="M22 5h4v14l9 18h-5l-6-11v16h-4V26l-6 11h-5l9-18z" fill="#a8743f" stroke="#4d3115" stroke-width="2" stroke-linejoin="round"/><path d="M17 9c3 1 5 3 5 6M31 9c-3 1-5 3-5 6" fill="none" stroke="#5cb85c" stroke-width="2.5" stroke-linecap="round"/>`,
  'zoom-lens': `<circle cx="20" cy="20" r="12" fill="#cfefff" stroke="#3a4b5c" stroke-width="3"/><path d="M14 16a7 7 0 0 1 7-5" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/><path d="M29 29l11 11" stroke="#c0392b" stroke-width="6" stroke-linecap="round"/>`,
  metronome: `<path d="M18 5h12l9 37H9z" fill="#b5793c" stroke="#4d3115" stroke-width="2" stroke-linejoin="round"/><path d="M13 34h22" stroke="#4d3115" stroke-width="2"/><path d="M24 31L31 10" stroke="#f2d45c" stroke-width="2.5" stroke-linecap="round"/><circle cx="29" cy="16" r="3" fill="#f2d45c" stroke="#4d3115" stroke-width="1.5"/>`,
  'expert-belt': `<path d="M4 19h40v10H4z" fill="#2b2d33" stroke="#0c0d10" stroke-width="2"/><rect x="17" y="14" width="14" height="20" rx="3" fill="#e9c04a" stroke="#6b5212" stroke-width="2"/><path d="M24 18l2 4h4l-3 3 1 4-4-2-4 2 1-4-3-3h4z" fill="#c0392b"/>`,
  revive: `<path d="M24 5l12 19-12 19-12-19z" fill="#f7d65a" stroke="#8a6d0f" stroke-width="2" stroke-linejoin="round"/><path d="M24 11l7 13-7 13" fill="#fff3b0" opacity=".7"/>`,
  'full-heal': `<path d="M17 14h14v28H17z" fill="#f2d45c" stroke="#6b5a12" stroke-width="2"/><path d="M20 6h8v8h-8z" fill="#5cb85c" stroke="#2f6b2f" stroke-width="2"/><path d="M28 9h7" stroke="#2f6b2f" stroke-width="3" stroke-linecap="round"/><path d="M20 24h8M24 20v8" stroke="#6b5a12" stroke-width="3"/>`,
  'x-attack': `<rect x="10" y="17" width="28" height="14" rx="7" fill="#e5484d" stroke="#6b1215" stroke-width="2" transform="rotate(-35 24 24)"/><path d="M19 20l10 9" stroke="#fff" stroke-width="2" opacity=".6"/>`,
  'x-defense': `<rect x="10" y="17" width="28" height="14" rx="7" fill="#4b7bea" stroke="#16306b" stroke-width="2" transform="rotate(-35 24 24)"/><path d="M19 20l10 9" stroke="#fff" stroke-width="2" opacity=".6"/>`,
  'x-speed': `<rect x="10" y="17" width="28" height="14" rx="7" fill="#3fbf7f" stroke="#145a37" stroke-width="2" transform="rotate(-35 24 24)"/><path d="M19 20l10 9" stroke="#fff" stroke-width="2" opacity=".6"/>`,
  'star-piece': `<path d="M24 4l5 12 13 1-10 8 4 13-12-7-12 7 4-13-10-8 13-1z" fill="#f59ac0" stroke="#7b2d58" stroke-width="2" stroke-linejoin="round"/><path d="M24 12l2 6 6 1" fill="none" stroke="#fff" stroke-width="2" opacity=".7"/>`,
};

export const ITEM_ICONS = o;

// Instructions run at startup, in the original order (see index.js).
export function init() {
  for (const k in S) {
    o[k] =
      'data:image/svg+xml;charset=utf-8,' +
      encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">${S[k]}</svg>`);
  }
}
