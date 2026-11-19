/* Original section: v4.34-01-calibration-and-eevee.js */

import { EEVEE } from './009-pokemon.js';
import { markOf } from './014-utils.js';
import { cur } from './016-navigation.js';
import { markAt, uk } from './021-combat-engine.js';
import { B } from './024-combat-ui.js';
import { hourOf } from './046-living-board.js';

let MQ434;
/* Board width on phone: kept in memory (reading it forces layout) and
   re-read only when the screen or the frame changes width. */
let width434 = 0,
  key434 = '',
  frameTracked434 = null,
  roFrame434 = null;


export function gauge434() {
  try {
    const cb = document.getElementById('cbBattle'),
      bd = document.getElementById('bBoard');
    const on = !!(MQ434 && MQ434.matches && B && cur === 'combat' && cb && !cb.hidden);
    document.body.classList.toggle('bt434', on);
    if (!bd) return;
    if (!on || !bd.classList.contains('vert')) {
      bd.style.removeProperty('width');
      width434 = 0;
      return;
    }
    const c = bd.closest('.bt') || bd.parentElement;
    if (roFrame434 && frameTracked434 !== c) {
      if (frameTracked434) roFrame434.unobserve(frameTracked434);
      roFrame434.observe(c);
      frameTracked434 = c;
    }
    // (no innerWidth here: reading it also forces layout)
    const k = String(document.body.classList.contains('fs444'));
    if (!width434 || k !== key434) {
      width434 = Math.max(220, c.clientWidth - 8);
      key434 = k;
    }
    if (bd.style.width !== width434 + 'px') bd.style.width = width434 + 'px';
  } catch (e) {}
}


/* ---------- 2. Eevee: the evolution of your choice ---------- */
/** The Eevee evolutions in harmony with the situation: mark of its cell, time of day. */
export function eeveeHarmony434(S, u) {
  const o = [],
    mk = markAt(S, uk(u));
  if (mk && EEVEE[mk]) o.push(EEVEE[mk]);
  o.push(EEVEE[hourOf(S)]);
  return o;
}


export function eeveeWhy434(S, u, id) {
  if (!eeveeHarmony434(S, u).includes(id)) return 'Au choix';
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
MQ434 = window.matchMedia ? matchMedia('(max-width: 700px)') : null;


let viewWidth434 = -1;
roFrame434 = window.ResizeObserver
  ? new ResizeObserver(es => {
      // only if the frame's WIDTH changes (the height moves on every render)
      const e = es[es.length - 1],
        l = Math.round((e && e.contentRect && e.contentRect.width) || 0);
      if (l === viewWidth434) return;
      viewWidth434 = l;
      width434 = 0;
      gauge434();
    })
  : null;
const forgetWidth434 = () => {
  width434 = 0;
};
// on capture: the width is forgotten before the listeners below recalibrate
window.addEventListener('resize', forgetWidth434, true);
window.addEventListener('orientationchange', forgetWidth434, true);
if (window.visualViewport) visualViewport.addEventListener('resize', forgetWidth434, true);


window.addEventListener('resize', () => gauge434());


// the gym rule fits on one line; we touch it to read it in full
document.addEventListener('click', e => {
  const a = e.target.closest('#bArena');
  if (a && document.body.classList.contains('bt434')) a.classList.toggle('open434');
});


if (window.visualViewport) visualViewport.addEventListener('resize', () => gauge434());


try {
  const cb = document.getElementById('cbBattle');
  if (cb && window.MutationObserver) new MutationObserver(() => gauge434()).observe(cb, { attributes: true, attributeFilter: ['hidden'] });
  // what is above the board changes size (images loaded, rule expanded): recalibrate
  if (window.ResizeObserver) {
    const ro = new ResizeObserver(() => gauge434());
    ['bPlE', 'bArena', 'bSyn', 'bOrdre'].forEach(id => {
      const x = document.getElementById(id);
      if (x) ro.observe(x);
    });
    ['#cbBattle .bt-top', '#cbBattle .bt-foot'].forEach(q => {
      const x = document.querySelector(q);
      if (x) ro.observe(x);
    });
  }
} catch (e) {}

}
