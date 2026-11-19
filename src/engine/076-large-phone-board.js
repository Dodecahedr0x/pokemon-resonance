/* Original section: v4.43: large board on phone, attacks within thumb reach, bogus error messages filtered */

import { MV } from './005-moves.js';
import { tc } from './014-utils.js';
import { HOOKS } from './015-hooks.js';
import { byUid, mvType } from './021-combat-engine.js';
import { B, ui } from './024-combat-ui.js';
import { footCls, footPos, refreshBattle } from '../screens/combat/battle/battleStore.js';

/** Aligns the page: the bottom of the board (your side) just above "Fin du tour" (End turn), without cutting off its top. */
export function frame443() {
  try {
    if (!document.body.classList.contains('bt434') || !B || B.over) {
      return;
    }
    const bd = document.getElementById('bBoard'),
      ft = document.querySelector('#cbBattle .bt-foot');
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

function qaLabel443(b, u) {
  const d = b.dataset;
  if (d.pv) {
    return { t: d.pv === 'ok' ? 'Confirmer' : 'Annuler', c: d.pv === 'ok' ? 'qa-ok' : 'qa-no' };
  }
  if (d.mi != null) {
    const m = u && MV[u.mv[+d.mi]],
      ty = m ? mvType(B, u, m) : null,
      nb = b.querySelector('b');
    return { t: m ? m.n : nb ? nb.firstChild && nb.firstChild.textContent : 'Capacité', col: ty ? tc(ty) : '' };
  }
  if (d.evo) {
    return { t: 'Éveil', c: 'qa-evo' };
  }
  if (d.undo) {
    return { t: '↶ Annuler', c: 'qa-no' };
  }
  if (d.duo) {
    const p = byUid(B, d.duo);
    return { t: 'Duo' + (p ? ' · ' + p.n : ''), c: 'qa-duo' };
  }
  if (d.vx) {
    return {
      t: d.vx === 'dodge' ? 'Esquive' : d.vx === 'relance' ? 'Relance' : (b.querySelector('b') || b).textContent.trim(),
      c: 'qa-vx',
    };
  }
  if (d.cap) {
    return { t: 'Capturer', c: 'qa-cap' };
  }
  return { t: b.textContent.trim().slice(0, 18) };
}

function qa443() {
  try {
    const ft = document.querySelector('#cbBattle .bt-foot'),
      P = document.getElementById('bPanel');
    if (!ft || !P) {
      return;
    }
    const u = B && ui.sel && byUid(B, ui.sel);
    const on = !!(
      document.body.classList.contains('bt434') &&
      B &&
      !B.over &&
      !B.dep430 &&
      B.phase === 'player' &&
      !ui.busy &&
      u &&
      u.side === 'a' &&
      !u.ko
    );
    const bs = on
      ? [...P.querySelectorAll(QA443)].filter(b => b.dataset.mi != null || b.dataset.pv || !b.disabled)
      : [];
    const useful = bs.some(b => !b.disabled);
    // #qa443 and .qa443-n: rendered by React (src/screens/combat/battle/Foot.jsx) from footPos.qa
    const Q = footPos.qa;
    if (!useful) {
      const chg = footCls('qa-on', false);
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
    P.querySelectorAll('[data-qa443-src]').forEach(b => b.removeAttribute('data-qa443-src'));
    const items = bs.map((b, i) => {
      const L = qaLabel443(b, u);
      b.setAttribute('data-qa443-src', i);
      return { t: L.t || '', c: L.c || '', col: L.col || '', on: b.classList.contains('on'), disabled: !!b.disabled };
    });
    footPos.qa = { hidden: false, displayName: u.n + ' · à vous', items };
    footCls('qa-on', true);
    refreshBattle('foot');
  } catch {
    /* Best effort: failure here is non-fatal. */
  }
}

/* ---------- 2. moves within thumb reach ---------- */
const QA443 = '[data-pv],[data-mi],[data-evo="open"],[data-undo],[data-duo],[data-vx],[data-cap]';

// Statements run at startup, in the original order (see index.js).
export function __init() {
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
      setTimeout(frame443, 80);
    }
  });

  document.addEventListener('click', e => {
    const c = e.target.closest('[data-qa443]');
    if (!c || c.disabled) {
      return;
    }
    const b = document.querySelector(`#bPanel [data-qa443-src="${c.dataset.qa443}"]`);
    if (b && !b.disabled) {
      b.click();
    }
  });

  HOOKS.rendered.push(qa443);
}
