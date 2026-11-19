/* Ball choice: the chosen Ball sets the capture conditions; Ball chips in the capture panel. */

import { immobilize } from '../combat/items-bonds-ai.js';
import { B, renderAll } from '../combat/ui.js';
import { SHOP, bagN } from '../state/economy.js';
import { ITM } from '../assets/item-icons.js';
import { BALL_CAPTURE_CHECKS } from './balls-held-items.js';

export let BALLS, CAP_K;
let BALL_SEL;
export function __set_CAP_K(v) {
  return (CAP_K = v);
}
export function __set_BALL_SEL(v) {
  return (BALL_SEL = v);
}

export function ballFor(e) {
  if (BALL_SEL && bagN(BALL_SEL)) {
    return BALL_SEL;
  }
  const own = BALLS.filter(k => bagN(k));
  return own.find(k => k !== 'master' && ballReqOk(k, e)) || own.find(k => k !== 'master') || own[0] || 'poke';
}

const ballReqOk = (k, e) => {
  const h = e.hp / e.mhp;
  if (BALL_CAPTURE_CHECKS[k]) {
    return BALL_CAPTURE_CHECKS[k](B, e);
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
  `<div class="v4-balls" role="group" aria-label="Choisir une Ball">${BALLS.map(k => `<button type="button" class="v4-ball${k === CAP_K ? ' on' : ''}" data-ball="${k}" aria-pressed="${k === CAP_K}" ${bagN(k) ? '' : 'disabled'}><img src="${ITM(SHOP[k].img)}" alt="" loading="lazy"><b>${SHOP[k].sn}</b><em>×${bagN(k)}</em></button>`).join('')}</div>${BALLS.some(k => bagN(k)) ? '' : '<p class="bp-hint">Plus aucune Ball : passez à la Boutique.</p>'}`;

// Instructions run at startup, in the original order (see index.js).
export function init() {
  BALLS = ['poke', 'super', 'hyper', 'master'];

  /* ---------- capture: the chosen Ball sets the conditions ---------- */
  ((CAP_K = 'poke'), (BALL_SEL = null));

  document.addEventListener('click', e => {
    const bl = e.target.closest('[data-ball]');
    if (bl && B) {
      BALL_SEL = bl.dataset.ball;
      renderAll();
    }
  });
}
