/* Battle on phone: the top banner collapses, both teams show at once and the board is scaled to fit above the « Fin du tour » (End turn) bar (added in v4.34). */

import { cur } from '../core/navigation.js';
import { B } from './ui.js';

let COMPACT_MQ;
/* Board width on phone: kept in memory (reading it forces layout) and
   re-read only when the screen or the frame changes width. */
let boardWidth = 0,
  lastKey = '',
  frameTracked = null,
  resizeFrame = null;

export function fitPhoneBattle() {
  try {
    const cb = document.getElementById('cbBattle'),
      bd = document.getElementById('bBoard');
    const on = !!(COMPACT_MQ && COMPACT_MQ.matches && B && cur === 'combat' && cb && !cb.hidden);
    document.body.classList.toggle('compact-battle', on);
    if (!bd) {
      return;
    }
    if (!on || !bd.classList.contains('vert')) {
      bd.style.removeProperty('width');
      boardWidth = 0;
      return;
    }
    const c = bd.closest('.bt') || bd.parentElement;
    if (resizeFrame && frameTracked !== c) {
      if (frameTracked) {
        resizeFrame.unobserve(frameTracked);
      }
      resizeFrame.observe(c);
      frameTracked = c;
    }
    // (no innerWidth here: reading it also forces layout)
    const k = String(document.body.classList.contains('fullscreen-mode'));
    if (!boardWidth || k !== lastKey) {
      boardWidth = Math.max(220, c.clientWidth - 8);
      lastKey = k;
    }
    if (bd.style.width !== boardWidth + 'px') {
      bd.style.width = boardWidth + 'px';
    }
  } catch {
    /* Best effort: failure here is non-fatal. */
  }
}

let viewWidth;

let forgetWidth;

// Startup statements, run in their original order (see index.js).
export function init() {
  COMPACT_MQ = window.matchMedia ? matchMedia('(max-width: 700px)') : null;
  viewWidth = -1;
  resizeFrame = window.ResizeObserver
    ? new ResizeObserver(es => {
        // only if the frame's WIDTH changes (the height moves on every render)
        const e = es[es.length - 1],
          l = Math.round((e && e.contentRect && e.contentRect.width) || 0);
        if (l === viewWidth) {
          return;
        }
        viewWidth = l;
        boardWidth = 0;
        fitPhoneBattle();
      })
    : null;
  forgetWidth = () => {
    boardWidth = 0;
  };
  // on capture: the width is forgotten before the listeners below recalibrate
  window.addEventListener('resize', forgetWidth, true);
  window.addEventListener('orientationchange', forgetWidth, true);
  if (window.visualViewport) {
    visualViewport.addEventListener('resize', forgetWidth, true);
  }
  window.addEventListener('resize', () => fitPhoneBattle());
  // the gym rule fits on one line; we touch it to read it in full
  document.addEventListener('click', e => {
    const a = e.target.closest('#bArena');
    if (a && document.body.classList.contains('compact-battle')) {
      a.classList.toggle('arena-open');
    }
  });
  if (window.visualViewport) {
    visualViewport.addEventListener('resize', () => fitPhoneBattle());
  }
  try {
    const cb = document.getElementById('cbBattle');
    if (cb && window.MutationObserver) {
      new MutationObserver(() => fitPhoneBattle()).observe(cb, { attributes: true, attributeFilter: ['hidden'] });
    }
    // what is above the board changes size (images loaded, rule expanded): recalibrate
    if (window.ResizeObserver) {
      const ro = new ResizeObserver(() => fitPhoneBattle());
      ['bPlE', 'bArena', 'bSyn', 'bOrdre'].forEach(id => {
        const x = document.getElementById(id);
        if (x) {
          ro.observe(x);
        }
      });
      ['#cbBattle .bt-top', '#cbBattle .bt-foot'].forEach(q => {
        const x = document.querySelector(q);
        if (x) {
          ro.observe(x);
        }
      });
    }
  } catch {
    /* Best effort: failure here is non-fatal. */
  }
}
