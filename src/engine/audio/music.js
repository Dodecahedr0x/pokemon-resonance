/* Music per theme (track player) (added in v4.35). */

import { $ } from '../core/utils.js';
import { currentScreen } from '../core/navigation.js';
import { B } from '../combat/ui.js';
import { PREFERENCES } from '../ui/preferences.js';
import { MUS, musPadLevel, musPadStop, musStartCore } from '../progression/prestige.js';
import { SCREEN_STATE } from '../ui/screen-state.js';
import { IMMERSION_ON } from './immersion.js';
import { OFFLINE_STATE } from '../progression/chronicles.js';

function bgmOk() {
  return !/jsdom/i.test(navigator.userAgent || '') && typeof Audio !== 'undefined' && MUSIC.failed < 2;
}

function bgmEl(k) {
  let a = MUSIC.el[k];
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
      MUSIC.failed++;
      if (MUSIC.failed >= 2 && MUSIC.on) {
        // tracks not found: back to the ambient pad
        MUSIC.on = false;
        try {
          MUS.on = false;
          musStartCore();
        } catch {
          /* Best effort: failure here is non-fatal. */
        }
      }
    });
    a.src = OFFLINE_STATE.urls[k] || MUSIC.src[k];
    MUSIC.el[k] = a;
  } catch (e) {
    a = null;
  }
  return a;
}

function bgmVol() {
  return Math.max(0, Math.min(1, 0.85 * (PREFERENCES.musVol === undefined ? 0.7 : PREFERENCES.musVol)));
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
  if (currentScreen === 'accueil') {
    return 'accueil';
  }
  if (currentScreen === 'combat') {
    return 'combats';
  } // v4.47: Battles menu = Cycling
  if (currentScreen === 'carte') {
    return 'carte';
  } // Route 1
  if (currentScreen === 'types') {
    return 'guide';
  } // Prof. Chen's Laboratory
  if (currentScreen === 'sac' && SCREEN_STATE.bagView === 'boutique') {
    return 'boutique';
  }
  if (currentScreen === 'pokedex' || currentScreen === 'dex') {
    return 'centre';
  }
  if (currentScreen === 'camp') {
    const t = SCREEN_STATE.campTab;
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
  if (!MUSIC.on || !PREFERENCES.music) {
    return;
  }
  const sc = bgmScene();
  if (!BGM_COMBAT.includes(sc) || !(B && !$('#cbBattle').hidden)) {
    MUSIC.silent = false;
  }
  if (MUSIC.jingle) {
    return;
  }
  const want = MUSIC.silent || !MUSIC.vis ? '' : sc;
  if (want === MUSIC.scene && (!want || !MUSIC.el[want] || !MUSIC.el[want].paused)) {
    if (want) {
      bgmFade(MUSIC.el[want], bgmVol(), 200);
    }
    return;
  }
  const old = MUSIC.el[MUSIC.scene];
  if (old) {
    bgmFade(old, 0, 900, () => {
      if (MUSIC.scene !== old._k) {
        try {
          old.pause();
        } catch {
          /* Best effort: failure here is non-fatal. */
        }
      }
    });
  }
  MUSIC.scene = want;
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
  if (!PREFERENCES.music) {
    return;
  }
  if (!bgmOk()) {
    musStartCore();
    return;
  }
  if (MUSIC.on) {
    bgmSync();
    return;
  }
  MUSIC.on = true;
  MUS.on = true; // keeps the pad from also starting
  clearInterval(MUSIC.tmr);
  MUSIC.tmr = setInterval(bgmSync, 800);
  bgmSync();
}

function bgmStop() {
  MUSIC.on = false;
  MUS.on = false;
  clearInterval(MUSIC.tmr);
  Object.keys(MUSIC.el).forEach(k => {
    const a = MUSIC.el[k];
    bgmFade(a, 0, 600, () => {
      try {
        a.pause();
      } catch {
        /* Best effort: failure here is non-fatal. */
      }
    });
  });
  MUSIC.scene = '';
  MUSIC.jingle = false;
  try {
    musPadStop();
  } catch {
    /* Best effort: failure here is non-fatal. */
  }
}

/* jingle (victory, badge, evolution) over the current music. max = duration in seconds (0 = in full), suite = chained jingle */
function playJingle(max, k, next) {
  k = k || 'victoire';
  if (!PREFERENCES.music || !MUSIC.on || !bgmOk() || MUSIC.jingle) {
    return;
  }
  const j = bgmEl(k);
  if (!j) {
    return;
  }
  MUSIC.jingle = true;
  const cur0 = MUSIC.el[MUSIC.scene];
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
  MUSIC.jk = k;
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
    MUSIC.jingle = false;
    MUSIC.scene = '';
    if (next) {
      playJingle(0, next);
      if (MUSIC.jingle) {
        return;
      }
    }
    if (k === 'victoire' || k === 'badge') {
      if (BGM_COMBAT.includes(bgmScene()) && B && B.over) {
        MUSIC.silent = true;
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
  if (MUSIC.on) {
    bgmStop();
  } else {
    musPadStop();
  }
}

export function musLevel() {
  if (MUSIC.on) {
    const a = MUSIC.el[MUSIC.jingle ? MUSIC.jk : MUSIC.scene];
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

let r;

/* Home: S1 theme · Camp, garden and the rest: Route 201 · Battle: wild battle · Shop: Pokémart · Victory: RSE jingle.
   The tracks are files next to the page (audio/…). If they cannot be found (offline file), the ambient pad is still used. */
export const MUSIC = {
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

// Statements run at startup, in the original order (see index.js).
export function init() {
  if (PREFERENCES.music === undefined) {
    PREFERENCES.music = false;
  }
  // fresh install: music off (adjustable in Settings)
  /* victory: result sheet won, capture succeeded, quest reward */
  r = document.getElementById('cbResult');
  if (r && window.MutationObserver) {
    new MutationObserver(() => {
      if (!r.hidden && r.querySelector('.result-card.is-win')) {
        if (!r._jinglePlayed) {
          r._jinglePlayed = true;
          playJingle(0, 'victoire', B && B.rew && B.rew.badgeNew ? 'badge' : '');
        }
      } else {
        r._jinglePlayed = false;
      }
    }).observe(r, { attributes: true, attributeFilter: ['hidden'], childList: true });
  }
  document.addEventListener('visibilitychange', () => {
    MUSIC.vis = !document.hidden;
    if (!MUSIC.on) {
      return;
    }
    if (document.hidden) {
      Object.keys(MUSIC.el).forEach(k => {
        try {
          MUSIC.el[k].pause();
        } catch {
          /* Best effort: failure here is non-fatal. */
        }
      });
    } else {
      MUSIC.scene = '';
      bgmSync();
    }
  });
}
