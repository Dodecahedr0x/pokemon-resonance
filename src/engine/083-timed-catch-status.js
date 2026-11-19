/* Original section: v4.53: timed capture · visible statuses · reacting Pokémon */

import { PROFILE } from './011-game-state.js';
import { RM, toast } from './014-utils.js';
import { HOOKS } from './015-hooks.js';
import { tokCl, unitsDirty } from '../screens/combat/board/boardStore.js';
import { byUid } from './021-combat-engine.js';
import { canCapture } from './022-items-bonds-ai.js';
import { B, L, renderAll, ui } from './024-combat-ui.js';
import { PREF, savePref, sfx, vibe } from './026-campaign-tutorial-sound.js';
import { AUTO } from './030-prestige-staging.js';
import { CAP_K, bagN } from './032-v4-foundation.js';
import { renderWallet } from './035-interface.js';
import { renderParams } from './040-settings.js';
import { shut, updateTemp, openOverlay } from '../screens/overlays/tempStore.js';
import { FX448 } from './079-immersion-sound-haptics.js';

let CAPOK453;

/* ---------- 1. visible statuses and reactions on tokens ---------- */
function stKey453(u) {
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

// the .st453 group (bubbles, lightning, ice cubes, "z") is rendered by Units.jsx (St453)

export function timing453(cb) {
  // gauge rendered by React (src/screens/overlays/transients/Ct453.jsx); the ring is animated here
  const o = openOverlay('ct453', { q: null });
  const g = o.querySelector('.ct453-g');
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
      updateTemp('ct453', { q });
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
  o.querySelector('.ct453-b').addEventListener('click', () => endStep(quality()));
  o.querySelector('.ct453-s').addEventListener('click', () => endStep('skip'));
  o.addEventListener('keydown', e => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      endStep(quality());
    }
  });
  raf = requestAnimationFrame(frame);
  o.querySelector('.ct453-b').focus();
}

const CAPT453 = () => PREF.capT453 !== 0 && !RM && !AUTO;

// Instructions run at startup, in the original order (see index.js).
export function __init() {
  HOOKS.token.push(u => {
    const T = L.u[u.uid];
    if (!T) {
      return;
    }
    T.st = true; // token's .st453 group (Units.jsx)
    T.s453 = FX448() ? stKey453(u) : ''; // data-s453
    tokCl(T, 'low453', FX448() && !u.ko && u.hp / u.mhp <= 0.25);
    unitsDirty();
  });

  /* ---------- 2. timed capture ---------- */
  CAPOK453 = false;

  document.addEventListener(
    'click',
    e => {
      const b = e.target.closest && e.target.closest('[data-cap]');
      if (!b || CAPOK453 || !CAPT453() || !B || document.getElementById('ct453')) {
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
      timing453(q => {
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
        CAPOK453 = true;
        try {
          b.click();
        } catch {
          /* Best effort: failure here is non-fatal. */
        }
        CAPOK453 = false;
        if (q === 'perfect') {
          PROFILE.bag[k] = bagN(k) + 1; // Ball returned
          renderWallet();
          toast('Lancer parfait : la Ball vous est rendue.');
        }
      });
    },
    true
  );

  /* ---------- 3. settings ---------- */
  // "Timed capture" panel: rendered by React (src/screens/settings/panels/CaptureTiming.jsx)

  document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('[data-b453]');
    if (!b) {
      return;
    }
    if (b.dataset.b453 === 'cap') {
      PREF.capT453 = PREF.capT453 === 0 ? 1 : 0;
      savePref();
      renderParams();
    }
  });
}
