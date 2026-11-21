/* Large board on phone, attacks within thumb reach, bogus error messages filtered (added in v4.43). */

import { MOVES } from '../data/moves.js';
import { typeColor } from '../core/utils.js';
import { HOOKS } from '../core/hooks.js';
import { byUid, mvType } from './engine.js';
import { B, ui } from './ui.js';
import { footCls, footPos, refreshBattle } from '../../screens/combat/battle/battleStore.js';

/** Aligns the page: the bottom of the board (your side) just above "Fin du tour" (End turn), without cutting off its top. */
export function alignBoardFrame() {
  try {
    if (!document.body.classList.contains('compact-battle') || !B || B.over) {
      return;
    }
    const bd = document.getElementById('bBoard'),
      ft = document.querySelector('#cbBattle .battle-footer');
    if (!bd || !ft) {
      return;
    }
    const r = bd.getBoundingClientRect(),
      fb = getComputedStyle(ft).position === 'fixed' ? ft.getBoundingClientRect().top : innerHeight;
    // priority to your side (bottom of the board); the top may slip slightly under the screen edge
    let y = scrollY + r.bottom - (fb - 8);
    y = Math.max(0, Math.min(y, scrollY + r.top + 40));
    if (Math.abs(y - scrollY) > 4) {
      window.scrollTo(0, y);
    }
  } catch {
    /* Best effort: failure here is non-fatal. */
  }
}

function thumbActionLabel(b, u) {
  const d = b.dataset;
  if (d.pv) {
    return { t: d.pv === 'ok' ? 'Confirmer' : 'Annuler', c: d.pv === 'ok' ? 'is-confirm' : 'is-cancel' };
  }
  if (d.mi != null) {
    const m = u && MOVES[u.mv[+d.mi]],
      ty = m ? mvType(B, u, m) : null,
      nb = b.querySelector('b');
    return { t: m ? m.n : nb ? nb.firstChild && nb.firstChild.textContent : 'Capacité', col: ty ? typeColor(ty) : '' };
  }
  if (d.evo) {
    return { t: 'Éveil', c: 'is-awaken' };
  }
  if (d.undo) {
    return { t: '↶ Annuler', c: 'is-cancel' };
  }
  if (d.duo) {
    const p = byUid(B, d.duo);
    return { t: 'Duo' + (p ? ' · ' + p.n : ''), c: 'is-duo' };
  }
  if (d.vx) {
    return {
      t: d.vx === 'dodge' ? 'Esquive' : d.vx === 'relance' ? 'Relance' : (b.querySelector('b') || b).textContent.trim(),
      c: 'is-reaction',
    };
  }
  if (d.cap) {
    return { t: 'Capturer', c: 'is-capture' };
  }
  return { t: b.textContent.trim().slice(0, 18) };
}

function thumbReach() {
  try {
    const ft = document.querySelector('#cbBattle .battle-footer'),
      P = document.getElementById('bPanel');
    if (!ft || !P) {
      return;
    }
    const u = B && ui.sel && byUid(B, ui.sel);
    const on = !!(
      document.body.classList.contains('compact-battle') &&
      B &&
      !B.over &&
      !B.deployPhase &&
      B.phase === 'player' &&
      !ui.busy &&
      u &&
      u.side === 'a' &&
      !u.ko
    );
    const bs = on
      ? [...P.querySelectorAll(THUMB_ACTION_SELECTOR)].filter(b => b.dataset.mi != null || b.dataset.pv || !b.disabled)
      : [];
    const useful = bs.some(b => !b.disabled);
    // #thumbReach and .thumbReach-n: rendered by React (src/screens/combat/battle/Foot.jsx) from footPos.qa
    const Q = footPos.qa;
    if (!useful) {
      const chg = footCls('has-thumb-reach', false);
      if (Q && !Q.hidden) {
        footPos.qa = { ...Q, hidden: true, displayName: null };
      }
      if (chg || footPos.qa !== Q) {
        refreshBattle('foot');
      }
      return;
    }
    // preview first (Cancel / Confirm), then the moves, then the rest
    const rankNo = b => (b.dataset.pv ? (b.dataset.pv === 'ok' ? 0 : 1) : b.dataset.mi != null ? 2 : 3);
    bs.sort((a, b) => rankNo(a) - rankNo(b));
    // marker on the panel buttons (#bPanel, rendered by React): a shortcut's click targets them
    P.querySelectorAll('[data-thumb-reach-src]').forEach(b => b.removeAttribute('data-thumb-reach-src'));
    const items = bs.map((b, i) => {
      const L = thumbActionLabel(b, u);
      b.setAttribute('data-thumb-reach-src', i);
      return { t: L.t || '', c: L.c || '', col: L.col || '', on: b.classList.contains('on'), disabled: !!b.disabled };
    });
    footPos.qa = { hidden: false, displayName: u.n + ' · à vous', items };
    footCls('has-thumb-reach', true);
    refreshBattle('foot');
  } catch {
    /* Best effort: failure here is non-fatal. */
  }
}

/* ---------- 2. moves within thumb reach ---------- */
const THUMB_ACTION_SELECTOR = '[data-pv],[data-mi],[data-evo="open"],[data-undo],[data-duo],[data-vx],[data-cap]';

// Statements run at startup, in the original order (see index.js).
export function init() {
  /* 1. Board: since v4.34 it shrank to fit under the opposing team; on a short screen (browser bar,
      Claude app) it fell to 220 px and your side slipped under the "Fin du tour" (End turn) bar.
      It now takes the full width; at the start of the battle, the page aligns itself on the board.
   2. Attacks: tap your Pokémon, its moves appear above "Fin du tour" (no need to scroll down
      to the sheet). Tap a move, then the target (2 times, or "Confirmer" (Confirm)).
   3. Harmless browser warnings (ResizeObserver, "Script error." from another site, interrupted
      audio playback) no longer open the "Petit souci technique" (Minor technical glitch) box. */

  /* ---------- 1. board ---------- */
  HOOKS.launch.push(isNew => {
    if (isNew && !B.over) {
      setTimeout(alignBoardFrame, 80);
    }
  });

  document.addEventListener('click', e => {
    const c = e.target.closest('[data-thumb-reach]');
    if (!c || c.disabled) {
      return;
    }
    const b = document.querySelector(`#bPanel [data-thumb-reach-src="${c.dataset.thumbReach}"]`);
    if (b && !b.disabled) {
      b.click();
    }
  });

  HOOKS.rendered.push(thumbReach);
}
