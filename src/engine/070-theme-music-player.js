/* Original section: v4.35: music per theme (track player) */

import { $ } from './014-utils.js';
import { cur } from './016-navigation.js';
import { B } from './024-combat-ui.js';
import { PREF } from './026-campaign-tutorial-sound.js';
import { MUS, musPadLevel, musPadStop, musStartCore } from './030-prestige-staging.js';
import { V4 } from './032-v4-foundation.js';
import { IMMERSION_ON } from './079-immersion-sound-haptics.js';
import { OFFLINE_STATE } from './093-chronicles-chapters.js';

export let BGM;

function bgmOk() {
  return !/jsdom/i.test(navigator.userAgent || '') && typeof Audio !== 'undefined' && BGM.failed < 2;
}

function bgmEl(k) {
  let a = BGM.el[k];
  if (a) {
    return a;
  }
  try {
    a = new Audio();
    a.preload = 'none';
    a.loop = !['victoire', 'badge', 'evolution'].includes(k);
    a.volume = 0;
    a.setAttribute('playsinline', '');
    a.addEventListener('error', () => {
      BGM.failed++;
      if (BGM.failed >= 2 && BGM.on) {
        // tracks not found: back to the ambient pad
        BGM.on = false;
        try {
          MUS.on = false;
          musStartCore();
        } catch {
          /* Best effort: failure here is non-fatal. */
        }
      }
    });
    a.src = OFFLINE_STATE.urls[k] || BGM.src[k];
    BGM.el[k] = a;
  } catch (e) {
    a = null;
  }
  return a;
}

function bgmVol() {
  return Math.max(0, Math.min(1, 0.85 * (PREF.musVol === undefined ? 0.7 : PREF.musVol)));
}

function bgmFade(a, to, ms, done) {
  if (!a) {
    return;
  }
  clearInterval(a._f);
  const from = a.volume,
    t0 = Date.now();
  a._f = setInterval(() => {
    const p = Math.min(1, (Date.now() - t0) / Math.max(1, ms));
    try {
      a.volume = Math.max(0, Math.min(1, from + (to - from) * p));
    } catch {
      /* Best effort: failure here is non-fatal. */
    }
    if (p >= 1) {
      clearInterval(a._f);
      if (done) {
        done();
      }
    }
  }, 50);
}

function bgmPlay(a) {
  try {
    const p = a.play();
    if (p && p.catch) {
      p.catch(() => {});
    }
  } catch {
    /* Best effort: failure here is non-fatal. */
  }
}

/* Battles: gym → Gym Leaders medley · Council / Masters → Champion battle · named opponents and duels → trainer battle · the rest → wild battle */
function bgmCombat(sc) {
  sc = String(sc || '');
  if (/^(a|j|h)[1-8]$/.test(sc)) {
    return 'arene';
  }
  if (/^(c[1-4]|champ)$/.test(sc)) {
    return 'rouge';
  } // v4.49: Indigo League = Battle against Red
  if (/^(jchamp|hchamp)$/.test(sc)) {
    return 'champion';
  }
  if (/^(duel433|ligue|tdr|ami|tuto|td\d|jd\d|hd\d+|rv\d|enig.*)$/.test(sc)) {
    return 'dresseur';
  }
  return 'combat';
}

function bgmScene() {
  if (B && !$('#cbBattle').hidden) {
    const c = bgmCombat(B.sc);
    if (c === 'rouge' || c === 'champion' || B.over) {
      return c;
    }
    // v4.49: an almost K.O.'d ally (≤ 25%) switches to the "low HP" track; returns when all go back above 35%
    const al = B.units.filter(u => u.side === 'a' && !u.ko);
    if (al.some(u => u.hp / u.mhp <= 0.25)) {
      B._lowHpPlayed = 1;
    } else if (!al.some(u => u.hp / u.mhp <= 0.35)) {
      B._lowHpPlayed = 0;
    }
    return B._lowHpPlayed && IMMERSION_ON() ? 'pvbas' : c;
  }
  if (cur === 'accueil') {
    return 'accueil';
  }
  if (cur === 'combat') {
    return 'combats';
  } // v4.47: Battles menu = Cycling
  if (cur === 'carte') {
    return 'carte';
  } // Route 1
  if (cur === 'types') {
    return 'guide';
  } // Prof. Chen's Laboratory
  if (cur === 'sac' && V4.bagView === 'boutique') {
    return 'boutique';
  }
  if (cur === 'pokedex' || cur === 'dex') {
    return 'centre';
  }
  if (cur === 'camp') {
    const t = V4.campTab;
    if (t === 'enigmes' || t === 'echo') {
      return 'ruines';
    }
    if (t === 'arenes') {
      return 'arene';
    }
    if (t === 'maitrise' || t === 'pantheon') {
      return 'gloire';
    }
    if (t === 'duel') {
      return 'dresseur';
    }
  }
  return 'camp';
}

function bgmSync() {
  if (!BGM.on || !PREF.music) {
    return;
  }
  const sc = bgmScene();
  if (!BGM_COMBAT.includes(sc) || !(B && !$('#cbBattle').hidden)) {
    BGM.silent = false;
  }
  if (BGM.jingle) {
    return;
  }
  const want = BGM.silent || !BGM.vis ? '' : sc;
  if (want === BGM.scene && (!want || !BGM.el[want] || !BGM.el[want].paused)) {
    if (want) {
      bgmFade(BGM.el[want], bgmVol(), 200);
    }
    return;
  }
  const old = BGM.el[BGM.scene];
  if (old) {
    bgmFade(old, 0, 900, () => {
      if (BGM.scene !== old._k) {
        try {
          old.pause();
        } catch {
          /* Best effort: failure here is non-fatal. */
        }
      }
    });
  }
  BGM.scene = want;
  if (!want) {
    return;
  }
  const a = bgmEl(want);
  if (!a) {
    return;
  }
  a._k = want;
  bgmPlay(a);
  bgmFade(a, bgmVol(), 1100);
}

export function musStart() {
  if (!PREF.music) {
    return;
  }
  if (!bgmOk()) {
    musStartCore();
    return;
  }
  if (BGM.on) {
    bgmSync();
    return;
  }
  BGM.on = true;
  MUS.on = true; // keeps the pad from also starting
  clearInterval(BGM.tmr);
  BGM.tmr = setInterval(bgmSync, 800);
  bgmSync();
}

function bgmStop() {
  BGM.on = false;
  MUS.on = false;
  clearInterval(BGM.tmr);
  Object.keys(BGM.el).forEach(k => {
    const a = BGM.el[k];
    bgmFade(a, 0, 600, () => {
      try {
        a.pause();
      } catch {
        /* Best effort: failure here is non-fatal. */
      }
    });
  });
  BGM.scene = '';
  BGM.jingle = false;
  try {
    musPadStop();
  } catch {
    /* Best effort: failure here is non-fatal. */
  }
}

/* jingle (victory, badge, evolution) over the current music. max = duration in seconds (0 = in full), suite = chained jingle */
function playJingle(max, k, next) {
  k = k || 'victoire';
  if (!PREF.music || !BGM.on || !bgmOk() || BGM.jingle) {
    return;
  }
  const j = bgmEl(k);
  if (!j) {
    return;
  }
  BGM.jingle = true;
  const cur0 = BGM.el[BGM.scene];
  if (cur0) {
    bgmFade(cur0, 0, 400, () => {
      try {
        cur0.pause();
      } catch {
        /* Best effort: failure here is non-fatal. */
      }
    });
  }
  try {
    j.currentTime = 0;
  } catch {
    /* Best effort: failure here is non-fatal. */
  }
  bgmPlay(j);
  bgmFade(j, bgmVol(), 250);
  BGM.jk = k;
  const endStep = () => {
    j.removeEventListener('ended', endStep);
    clearTimeout(j._t);
    bgmFade(j, 0, 500, () => {
      try {
        j.pause();
      } catch {
        /* Best effort: failure here is non-fatal. */
      }
    });
    BGM.jingle = false;
    BGM.scene = '';
    if (next) {
      playJingle(0, next);
      if (BGM.jingle) {
        return;
      }
    }
    if (k === 'victoire' || k === 'badge') {
      if (BGM_COMBAT.includes(bgmScene()) && B && B.over) {
        BGM.silent = true;
      } // the result stays calm
    }
    setTimeout(bgmSync, 600);
  };
  j.addEventListener('ended', endStep);
  if (max) {
    j._t = setTimeout(endStep, max * 1000);
  }
}

/* The Music switch, volume slider and resume-on-touch go through these three functions. */
export function musStop() {
  if (BGM.on) {
    bgmStop();
  } else {
    musPadStop();
  }
}

export function musLevel() {
  if (BGM.on) {
    const a = BGM.el[BGM.jingle ? BGM.jk : BGM.scene];
    if (a) {
      bgmFade(a, bgmVol(), 150);
    }
  } else {
    musPadLevel();
  }
}

/* jingle associated with a sound effect (called by sfx) */
export function sfxJingle(n) {
  if (n === 'win' && !(B && B.over)) {
    playJingle(7);
  } else if (n === 'evo') {
    playJingle(10, 'evolution');
  }
}

const BGM_COMBAT = ['combat', 'arene', 'champion', 'dresseur', 'rouge', 'pvbas'];

// Statements run at startup, in the original order (see index.js).
export function __init() {
  /* Home: S1 theme · Camp, garden and the rest: Route 201 · Battle: wild battle · Shop: Pokémart · Victory: RSE jingle.
   The tracks are files next to the page (audio/…). If they cannot be found (offline file), the ambient pad is still used. */
  BGM = {
    src: Object.fromEntries(
      [
        'accueil',
        'camp',
        'combat',
        'boutique',
        'victoire',
        'arene',
        'champion',
        'dresseur',
        'ruines',
        'centre',
        'gloire',
        'badge',
        'evolution',
        'combats',
        'carte',
        'guide',
        'rouge',
        'pvbas',
      ].map(k => [k, 'audio/' + k + '.mp3'])
    ),
    el: {},
    scene: '',
    on: false,
    failed: 0,
    jingle: false,
    silent: false, // after a victory: leave the result screen calm
    tmr: 0,
    vis: true,
  };

  if (PREF.music === undefined) {
    PREF.music = false;
  }

  // fresh install: music off (adjustable in Settings)
  /* victory: result sheet won, capture succeeded, quest reward */
  (function () {
    const r = document.getElementById('cbResult');
    if (r && window.MutationObserver) {
      new MutationObserver(() => {
        if (!r.hidden && r.querySelector('.res-card.win')) {
          if (!r._jinglePlayed) {
            r._jinglePlayed = true;
            playJingle(0, 'victoire', B && B.rew && B.rew.badgeNew ? 'badge' : '');
          }
        } else {
          r._jinglePlayed = false;
        }
      }).observe(r, { attributes: true, attributeFilter: ['hidden'], childList: true });
    }
  })();

  document.addEventListener('visibilitychange', () => {
    BGM.vis = !document.hidden;
    if (!BGM.on) {
      return;
    }
    if (document.hidden) {
      Object.keys(BGM.el).forEach(k => {
        try {
          BGM.el[k].pause();
        } catch {
          /* Best effort: failure here is non-fatal. */
        }
      });
    } else {
      BGM.scene = '';
      bgmSync();
    }
  });
}
