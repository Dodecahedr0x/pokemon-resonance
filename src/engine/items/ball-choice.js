/* Ball choice: the chosen Ball sets the capture conditions; Ball chips in the capture panel. */

import { immobilize } from '../combat/items-bonds-ai.js';
import { battle, renderAll } from '../combat/ui.js';
import { SHOP, bagCount } from '../state/economy.js';
import { itemIcon } from '../assets/item-icons.js';
import { BALL_CAPTURE_CHECKS } from './balls-held-items.js';

export let CAP_K;
let BALL_SEL;
export function __set_CAP_K(v) {
  return (CAP_K = v);
}
export function __set_BALL_SEL(v) {
  return (BALL_SEL = v);
}

export function ballFor(e) {
  if (BALL_SEL && bagCount(BALL_SEL)) {
    return BALL_SEL;
  }
  const own = BALLS.filter(k => bagCount(k));
  return own.find(k => k !== 'master' && ballReqOk(k, e)) || own.find(k => k !== 'master') || own[0] || 'poke';
}

const ballReqOk = (k, e) => {
  const h = e.hp / e.mhp;
  if (BALL_CAPTURE_CHECKS[k]) {
    return BALL_CAPTURE_CHECKS[k](battle, e);
  }
  if (k === 'master') {
    return true;
  }
  if (k === 'hyper') {
    return h <= 0.4;
  }
  if (k === 'super') {
    return h <= 0.4 && immobilize(e);
  }
  return h <= 0.25 && immobilize(e);
};

/* Ball choice in the capture panel */
export const ballChips = () =>
  `<div class="battle-balls" role="group" aria-label="Choisir une Ball">${BALLS.map(k => `<button type="button" class="battle-ball${k === CAP_K ? ' is-selected' : ''}" data-ball="${k}" aria-pressed="${k === CAP_K}" ${bagCount(k) ? '' : 'disabled'}><img src="${itemIcon(SHOP[k].img)}" alt="" loading="lazy"><b>${SHOP[k].sn}</b><em>×${bagCount(k)}</em></button>`).join('')}</div>${BALLS.some(k => bagCount(k)) ? '' : '<p class="battle-hint">Plus aucune Ball : passez à la Boutique.</p>'}`;

export const BALLS = ['poke', 'super', 'hyper', 'master'];

// Instructions run at startup, in the original order (see index.js).
export function init() {
  /* ---------- capture: the chosen Ball sets the conditions ---------- */
  ((CAP_K = 'poke'), (BALL_SEL = null));
  document.addEventListener('click', e => {
    const bl = e.target.closest('[data-ball]');
    if (bl && battle) {
      BALL_SEL = bl.dataset.ball;
      renderAll();
    }
  });
}
