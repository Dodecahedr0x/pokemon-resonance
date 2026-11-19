/* Original section: 12-ligue.js */

import { BSHAPE } from './004-data.js';
import { $, gp, tc } from './014-utils.js';
import { challenge } from './024-combat-ui.js';
import { refreshLeague } from '../screens/league/leagueStore.js';

export let gymSel;

/* ===================== LEAGUE ===================== */
export function badgeSvg(i, t, id) {
  const c = tc(t),
    s = BSHAPE[i];
  return `<svg viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="${id}f" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c}"/><stop offset="1" stop-color="${c}" stop-opacity=".5"/></linearGradient><linearGradient id="${id}r" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F7E1AC"/><stop offset=".5" stop-color="#D7B36A"/><stop offset="1" stop-color="#8E6C31"/></linearGradient><clipPath id="${id}c"><path d="${s}"/></clipPath></defs>
  <path d="${s}" fill="#0B0D12"/><path d="${s}" fill="url(#${id}f)" stroke="url(#${id}r)" stroke-width="2.6" stroke-linejoin="round"/>
  <path d="${s}" fill="none" stroke="rgba(255,255,255,.3)" stroke-width="1" transform="translate(32 32) scale(.76) translate(-32 -32)"/>
  <path d="${gp(t)}" transform="translate(20 20)" fill="rgba(8,10,14,.8)" fill-rule="evenodd"/>
  <g clip-path="url(#${id}c)"><path d="M-4 26 26 -4h12L-4 38Z" fill="rgba(255,255,255,.22)"/></g></svg>`;
}

// League page rendered by React (src/screens/league/): badges, chosen gym, Elite 4.
export function renderLeague() {
  refreshLeague();
}

// Instructions run at startup, in the original order (see index.js).
export function __init() {
  gymSel = 0;

  $('#badges').addEventListener('click', e => {
    const b = e.target.closest('[data-g]');
    if (!b) {
      return;
    }
    gymSel = +b.dataset.g;
    renderLeague();
  });

  $('#arena').addEventListener('click', e => {
    const b = e.target.closest('[data-arena]');
    if (b) {
      challenge(b.dataset.arena);
    }
  });
}
