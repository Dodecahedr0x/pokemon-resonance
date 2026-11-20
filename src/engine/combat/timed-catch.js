/* Timed capture · visible statuses · reacting Pokémon (added in v4.53). */

import { PROFILE } from '../state/game-state.js';
import { RM, toast } from '../core/utils.js';
import { HOOKS } from '../core/hooks.js';
import { tokCl, unitsDirty } from '../../screens/combat/board/boardStore.js';
import { byUid } from './engine.js';
import { canCapture } from './items-bonds-ai.js';
import { B, L, renderAll, ui } from './ui.js';
import { PREF, savePref } from '../ui/preferences.js';
import { sfx, vibe } from '../audio/sound-effects.js';
import { AUTO } from '../progression/prestige.js';
import { CAP_K } from '../items/ball-choice.js';
import { bagN } from '../state/economy.js';
import { renderWallet } from '../ui/wallet.js';
import { renderParams } from '../ui/settings.js';
import { shut, updateTemp, openOverlay } from '../../screens/overlays/tempStore.js';
import { effectsEnabled } from '../audio/immersion.js';

let CATCH_TIMED_OK;

/* ---------- 1. visible statuses and reactions on tokens ---------- */
function statusKey(u) {
  if (u.ko) {
    return '';
  }
  if (u.badge === 'GEL') {
    return 'gel';
  }
  if (u.badge === 'PAR') {
    return 'par';
  }
  if (u.badge === 'SOM') {
    return 'som';
  }
  if (u.burn > 0) {
    return 'bru';
  }
  if (u.poisoned > 0) {
    return 'psn';
  }
  if (u.root > 0 || u.web > 0) {
    return 'rac';
  }
  return '';
}

// the .statusFx group (bubbles, lightning, ice cubes, "z") is rendered by Units.jsx (StatusFx)

export function startCatchTiming(cb) {
  // gauge rendered by React (src/screens/overlays/transients/Ct453.jsx); the ring is animated here
  const o = openOverlay('timed-catch', { q: null });
  const g = o.querySelector('.timed-catch-closing-ring');
  const T0 = performance.now(),
    DUR = 1500;
  let done = false,
    raf = 0;
  const frame = () => {
    const p = Math.min(1, (performance.now() - T0) / DUR);
    g.style.transform = `translate(-50%,-50%) scale(${(1.15 - Number(p)).toFixed(3)})`;
    if (p >= 1) {
      return endStep(null);
    }
    raf = requestAnimationFrame(frame);
  };
  const quality = () => {
    const p = Math.min(1, (performance.now() - T0) / DUR),
      s = 1.15 - Number(p),
      d = Math.abs(s - 0.5);
    return d <= 0.07 ? 'perfect' : d <= 0.2 ? 'ok' : 'miss';
  };
  const endStep = q => {
    if (done) {
      return;
    }
    done = true;
    cancelAnimationFrame(raf);
    q = q || 'miss';
    if (o.isConnected) {
      updateTemp('timed-catch', { q });
    } // text and res-… class
    sfx(q === 'miss' ? 'lose' : 'rx');
    vibe(q === 'perfect' ? [30, 40, 60] : q === 'miss' ? [60] : 25);
    setTimeout(
      () => {
        shut(o);
        cb(q);
      },
      q === 'skip' ? 0 : 650
    );
  };
  o.querySelector('.timed-catch-throw').addEventListener('click', () => endStep(quality()));
  o.querySelector('.timed-catch-skip').addEventListener('click', () => endStep('skip'));
  o.addEventListener('keydown', e => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      endStep(quality());
    }
  });
  raf = requestAnimationFrame(frame);
  o.querySelector('.timed-catch-throw').focus();
}

const CATCH_TIMING_ON = () => PREF.catchTimingEnabled !== 0 && !RM && !AUTO;

function onTimedCatchClick(e) {
  const b = e.target.closest && e.target.closest('[data-cap]');
  if (!b || CATCH_TIMED_OK || !CATCH_TIMING_ON() || !B || document.getElementById('timed-catch')) {
    return;
  }
  const al = byUid(B, ui.sel),
    en = byUid(B, b.dataset.cap);
  if (!canCapture(B, al, en)) {
    return;
  } // the usual rules apply first
  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();
  startCatchTiming(q => {
    if (q === 'miss') {
      // the Ball bounces off: it is lost, but the ally did not act and the Voices are kept
      const k = CAP_K;
      PROFILE.bag[k] = Math.max(0, bagN(k) - 1);
      if (!PROFILE.bag[k]) {
        delete PROFILE.bag[k];
      }
      toast('La Ball rebondit ! Réessayez si vous en avez une autre.');
      renderWallet();
      renderAll();
      return;
    }
    const k = CAP_K;
    CATCH_TIMED_OK = true;
    try {
      b.click();
    } catch {
      /* Best effort: failure here is non-fatal. */
    }
    CATCH_TIMED_OK = false;
    if (q === 'perfect') {
      PROFILE.bag[k] = bagN(k) + 1; // Ball returned
      renderWallet();
      toast('Lancer parfait : la Ball vous est rendue.');
    }
  });
}

// Instructions run at startup, in the original order (see index.js).
export function init() {
  HOOKS.token.push(u => {
    const T = L.u[u.uid];
    if (!T) {
      return;
    }
    T.st = true; // token's .statusFx group (Units.jsx)
    T.statusMark = effectsEnabled() ? statusKey(u) : ''; // data-status-mark
    tokCl(T, 'low-hp', effectsEnabled() && !u.ko && u.hp / u.mhp <= 0.25);
    unitsDirty();
  });

  /* ---------- 2. timed capture ---------- */
  CATCH_TIMED_OK = false;

  document.addEventListener('click', onTimedCatchClick, true);

  /* ---------- 3. settings ---------- */
  // "Timed capture" panel: rendered by React (src/screens/settings/panels/CaptureTiming.jsx)

  document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('[data-catch-action]');
    if (!b) {
      return;
    }
    if (b.dataset.catchAction === 'cap') {
      PREF.catchTimingEnabled = PREF.catchTimingEnabled === 0 ? 1 : 0;
      savePref();
      renderParams();
    }
  });
}
