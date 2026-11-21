import { bdClass, tokCl, tokHas } from '../../screens/combat/board/boardStore.js';

import { RM, after2images } from '../core/utils.js';
import { byUid, unitKey } from './engine.js';
import { B, HC, L, ui } from './ui.js';
import { PREF } from '../ui/preferences.js';
import { vibe } from '../audio/sound-effects.js';
import { endTooltip, seenTips } from '../ui/battle-tips.js';

/* Expressive Pokémon: idle breathing, lunge toward the target, recoil under hits, vibration on strong hits
   ("Pokémon animés" setting, added in v4.29). */

export function animEnabled() {
  return !RM && PREF.animEnabled !== false;
}

/** All the token's parts sit in an inner .token-body group (Units.jsx): it moves without
    shifting the tile. Each token breathes with a different offset. */
export function liveToken(T) {
  liveToken.n = (liveToken.n || 0) + 1;
  T.dl = (-((liveToken.n * 0.77) % 3.4)).toFixed(2) + 's';
  return T;
}

/* Restarts a small token animation. If it is already playing, restart it two frames later
   (rather than forcing a layout of the whole page). */
export function replayAnimation(T, cl, ms) {
  const g = T && T.g;
  if (!g) {
    return;
  }
  clearTimeout(T['t_' + cl]);
  const launchMove = () => {
    tokCl(T, cl, true);
    clearTimeout(T['t_' + cl]);
    T['t_' + cl] = setTimeout(() => tokCl(T, cl, false), ms);
  };
  if (!tokHas(T, cl)) {
    return launchMove();
  }
  tokCl(T, cl, false);
  after2images(launchMove);
}

function bondHop(uid, k) {
  const T = L.u && L.u[uid],
    u = B && byUid(B, uid);
  if (!animEnabled() || !T || !T.b || !u || u.ko) {
    return;
  }
  const [x0, y0] = HC(unitKey(u)),
    [x1, y1] = HC(k);
  let dx = x1 - x0,
    dy = y1 - y0;
  const d = Math.hypot(dx, dy);
  if (d < 1) {
    dx = 0;
    dy = -6;
  } else {
    dx = (dx / d) * 8;
    dy = (dy / d) * 8;
  }
  T.b.style.setProperty('--lx', dx.toFixed(1) + 'px');
  T.b.style.setProperty('--ly', dy.toFixed(1) + 'px');
  replayAnimation(T, 'lunge-hit', 560);
}

export function hurtFlash(uid) {
  const T = L.u && L.u[uid];
  if (animEnabled() && T && T.b) {
    replayAnimation(T, 'hurt-flash', 480);
  }
}

export function liveEvent(ev) {
  if (!B || !ev || !ev.length) {
    return;
  }
  const sv = document.getElementById('bSvg');
  if (sv) {
    sv.style.setProperty('--anim-scale', PREF.fast || ui.skipSpeedup ? '0.6' : '1');
  }
  ev.forEach(x => {
    if (x.e === 'use' && x.u && x.k) {
      bondHop(x.u, x.k);
    }
  });
  // vibration: one of your Pokémon takes a big hit, or a Pokémon is knocked out
  const ko = ev.some(x => x.e === 'ko'),
    strongSpot = ev.some(x => {
      if (x.e !== 'dmg') {
        return false;
      }
      const v = byUid(B, x.u);
      return v && v.side === 'a' && x.v >= v.mhp * 0.3;
    });
  if (ko || strongSpot) {
    vibe(ko ? [18, 40, 22] : 28);
  }
}

function applyCalmMode() {
  bdClass('calm-motion', !animEnabled()); // class of #bBoard, rendered by React
}

/** After each battle render: animations according to the setting, tip if any. */
export function liveRender() {
  applyCalmMode();
  endTooltip();
  clearTimeout(liveRender.t);
  if (B && !B.over) {
    liveRender.t = setTimeout(seenTips, 650);
  }
}

// Statements run at startup, in the original order (see index.js).
export function init() {
  document.addEventListener('change', e => {
    const p = e.target.closest('[data-pref="animEnabled"]');
    if (p) {
      applyCalmMode();
    }
  });
}
