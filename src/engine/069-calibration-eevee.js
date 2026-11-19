/* Original section: v4.34-01-calibration-and-eevee.js */

import { EEVEE } from './009-pokemon.js';
import { markOf } from './014-utils.js';
import { cur } from './016-navigation.js';
import { markAt, uk } from './021-combat-engine.js';
import { B } from './024-combat-ui.js';
import { hourOf } from './046-living-board.js';

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

/* ---------- 2. Eevee: the evolution of your choice ---------- */
/** The Eevee evolutions in harmony with the situation: mark of its cell, time of day. */
export function eeveeHarmony(S, u) {
  const o = [],
    mk = markAt(S, uk(u));
  if (mk && EEVEE[mk]) {
    o.push(EEVEE[mk]);
  }
  o.push(EEVEE[hourOf(S)]);
  return o;
}

export function eeveeWhy(S, u, id) {
  if (!eeveeHarmony(S, u).includes(id)) {
    return 'Au choix';
  }
  const k = Object.keys(EEVEE).find(x => EEVEE[x] === id);
  return `En harmonie · ${k === 'jour' ? 'le jour' : k === 'nuit' ? 'la nuit' : 'case ' + markOf(k).n} : garde 1 losange`;
}

// Startup statements, run in their original order (see index.js).
export function __init() {
  /* =====================================================================
   v4.34
   1. Battle on phone: the top banner collapses, the whole opposing
      team and yours are shown at once (no sideways scrolling),
      and the board is scaled to fit between the opposing team
      and the « Fin du tour » (End turn) bar.
   2. Eevee: at Awakening, its 5 evolutions are available to choose from. The one in
      harmony with its cell (Soaked, Charged, Burning mark) or with
      the time (Espeon by day, Umbreon at night) gets 1 diamond.
   ===================================================================== */

  /* ---------- 1. battle calibration on phone ---------- */
  COMPACT_MQ = window.matchMedia ? matchMedia('(max-width: 700px)') : null;

  let viewWidth = -1;
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
  const forgetWidth = () => {
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
