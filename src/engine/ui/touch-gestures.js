import { MV } from '../data/moves.js';
import { BY, MON } from '../pokemon/pokemon.js';
import { RM, toast } from '../core/utils.js';
import { goTo } from '../core/navigation.js';
import { openSheet } from '../team/team.js';
import { byUid, unitAt } from '../combat/engine.js';
import { B, L } from '../combat/ui.js';
import { PREF } from './preferences.js';
import { vibe } from '../audio/sound-effects.js';
import { V4 } from './screen-state.js';
import { renderMap } from '../world/map.js';

/* Touch gestures: long press on a Pokémon opens its sheet, swipe changes tab (added in v4.29). */

const LONG_PRESS = { t: 0, x: 0, y: 0, fait: 0 };

const endLongPress = () => clearTimeout(LONG_PRESS.t);

/* swipe to change tab */
export const SWIPE_TABS = ['accueil', 'pokedex', 'carte'];

const SWIPE_STATE = { x: 0, y: 0, t: 0, ok: false };

function longPressAction(t) {
  if (!t || !t.closest) {
    return null;
  }
  const hx = t.closest('#bSvg [data-k]');
  if (hx && B) {
    const u = unitAt(B, hx.dataset.k);
    return u ? () => openSpeciesSheet(u.sp) : null;
  }
  const tok = t.closest('#bSvg .token');
  if (tok && B && L.u) {
    for (const id in L.u) {
      if (L.u[id].g === tok) {
        const u = byUid(B, id);
        return u ? () => openSpeciesSheet(u.sp) : null;
      }
    }
    return null;
  }
  const mk = t.closest('#mapMarks [data-place]');
  if (mk) {
    return () => {
      V4.mapSel = mk.dataset.place;
      renderMap();
      const i = document.getElementById('mapInfo');
      if (i && i.scrollIntoView) {
        i.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'center' });
      }
    };
  }
  const c = t.closest('[data-open],.dex-row[data-dex],[data-species-sheet]');
  if (!c) {
    return null;
  }
  const id = c.dataset.open || c.dataset.dex || c.dataset.speciesSheet;
  return id && BY[id] ? () => openSpeciesSheet(id) : null;
}

/** A Pokémon's sheet; for a legend or an opponent with no sheet, a summary. */
function openSpeciesSheet(id) {
  const m = BY[id];
  if (!m) {
    return;
  }
  if (m.leg || m.isEnemy || !MON.includes(m)) {
    toast(
      `${m.n} · ${m.t.join(' / ')}${m.leg ? ' · légende' : ''} : ${m.mv.map(x => (MV[x] ? MV[x].n : x)).join(', ')}.`
    );
    return;
  }
  openSheet(id);
}

function canSwipeHere(t) {
  if (PREF.swipeNav === false || !t || !t.closest || !t.closest('main,.app-content,.page')) {
    return false;
  }
  if (t.closest('input,textarea,select,#bBoard,.board,.map-panel,#mapMarks,.route-scene,.tabs,[role="dialog"]')) {
    return false;
  }
  if (B && !B.over && document.querySelector('#cbBattle:not([hidden])')) {
    return false;
  }
  if ([...document.querySelectorAll('[role="dialog"],.sheet,.modal')].some(d => !d.hidden && d.offsetParent !== null)) {
    return false;
  }
  for (let x = t; x && x !== document.body; x = x.parentElement) {
    const o = getComputedStyle(x).overflowX;
    if ((o === 'auto' || o === 'scroll') && x.scrollWidth > x.clientWidth + 4) {
      return false;
    }
  }
  return true;
}

// Statements run at startup, in the original order (see index.js).
export function init() {
  document.addEventListener(
    'pointerdown',
    e => {
      clearTimeout(LONG_PRESS.t);
      LONG_PRESS.fait = 0; // a new gesture: the previous long press is forgotten
      if (e.pointerType === 'mouse' && e.button !== 0) {
        return;
      }
      const a = longPressAction(e.target);
      if (!a) {
        return;
      }
      LONG_PRESS.x = e.clientX;
      LONG_PRESS.y = e.clientY;
      LONG_PRESS.t = setTimeout(() => {
        LONG_PRESS.fait = Date.now();
        vibe(15);
        a();
      }, 480);
    },
    { passive: true }
  );

  document.addEventListener('pointerup', endLongPress, { passive: true });

  document.addEventListener('pointercancel', endLongPress, { passive: true });

  document.addEventListener(
    'pointermove',
    e => {
      if (Math.abs(e.clientX - LONG_PRESS.x) + Math.abs(e.clientY - LONG_PRESS.y) > 12) {
        clearTimeout(LONG_PRESS.t);
      }
    },
    { passive: true }
  );

  // the release following a long press doesn't also trigger the click
  document.addEventListener(
    'click',
    e => {
      if (LONG_PRESS.fait && Date.now() - LONG_PRESS.fait < 700) {
        LONG_PRESS.fait = 0;
        e.preventDefault();
        e.stopPropagation();
      }
    },
    true
  );

  document.addEventListener('contextmenu', e => {
    if (longPressAction(e.target)) {
      e.preventDefault();
    }
  });

  document.addEventListener(
    'touchstart',
    e => {
      if (e.touches.length !== 1) {
        SWIPE_STATE.ok = false;
        return;
      }
      const p = e.touches[0];
      Object.assign(SWIPE_STATE, { x: p.clientX, y: p.clientY, t: Date.now(), ok: canSwipeHere(e.target) });
    },
    { passive: true }
  );

  document.addEventListener(
    'touchend',
    e => {
      if (!SWIPE_STATE.ok) {
        return;
      }
      SWIPE_STATE.ok = false;
      const p = e.changedTouches[0],
        dx = p.clientX - SWIPE_STATE.x,
        dy = p.clientY - SWIPE_STATE.y;
      if (Date.now() - SWIPE_STATE.t > 650 || Math.abs(dx) < 80 || Math.abs(dy) > Math.abs(dx) * 0.5) {
        return;
      }
      const pg = document.querySelector('.page.on'),
        i = SWIPE_TABS.indexOf(pg && pg.id),
        j = i + (dx < 0 ? 1 : -1);
      if (i < 0 || j < 0 || j >= SWIPE_TABS.length) {
        return;
      }
      goTo(SWIPE_TABS[j]);
      try {
        window.scrollTo(0, 0);
      } catch {
        /* Best effort: failure here is non-fatal. */
      }
    },
    { passive: true }
  );
}
