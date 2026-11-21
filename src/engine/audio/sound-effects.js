/* Synthesized sound effects (no files) and vibrations (added in v1.0). */

import { reducedMotion } from '../core/utils.js';
import { byUid } from '../combat/engine.js';
import { battle } from '../combat/ui.js';
import { sfxJingle } from './music.js';
import { PREFERENCES } from '../ui/preferences.js';

let AC;

function ac() {
  if (!PREFERENCES.sound) {
    return null;
  }
  try {
    if (!AC) {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) {
        return null;
      }
      AC = new C();
    }
    if (AC.state === 'suspended') {
      AC.resume();
    }
    return AC;
  } catch (e) {
    return null;
  }
}

export function playTone(f, t0, dur, type, flying, f2) {
  const a = ac(),
    v = (flying || 0.08) * PREFERENCES.sfxVol; // adjustable effects volume (0 = muted)
  if (!a || !(v > 0)) {
    return;
  }
  const o = a.createOscillator(),
    g = a.createGain(),
    t = a.currentTime + t0;
  o.type = type || 'sine';
  o.frequency.setValueAtTime(f, t);
  if (f2) {
    o.frequency.exponentialRampToValueAtTime(f2, t + dur);
  }
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(v, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
  o.connect(g);
  g.connect(a.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

export function noise(t0, dur, flying, lp) {
  const a = ac(),
    v = (flying || 0.12) * PREFERENCES.sfxVol;
  if (!a || !(v > 0)) {
    return;
  }
  const n = Math.floor(a.sampleRate * dur),
    buf = a.createBuffer(1, n, a.sampleRate),
    d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) {
    d[i] = (Math.random() * 2 - 1) * (1 - i / n);
  }
  const s = a.createBufferSource(),
    f = a.createBiquadFilter(),
    g = a.createGain(),
    t = a.currentTime + t0;
  s.buffer = buf;
  f.type = 'lowpass';
  f.frequency.value = lp || 900;
  g.gain.value = v;
  s.connect(f);
  f.connect(g);
  g.connect(a.destination);
  s.start(t);
}

export function sfx(n) {
  if (PREFERENCES.sound && !reducedMotion) {
    try {
      SOUND_EFFECTS[n] && SOUND_EFFECTS[n]();
    } catch {
      /* Best effort: failure here is non-fatal. */
    }
  }
  sfxJingle(n);
}

export function vibrate(p) {
  if (PREFERENCES.vibe && navigator.vibrate) {
    try {
      navigator.vibrate(p);
    } catch {
      /* Best effort: failure here is non-fatal. */
    }
  }
}

export function playEventSound(ev) {
  if (!PREFERENCES.sound && !PREFERENCES.vibe) {
    return;
  }
  let h = 0,
    k = 0,
    r = 0,
    c = 0,
    d = 0,
    al = false;
  ev.forEach(e => {
    if (e.e === 'dmg') {
      h++;
      const u = battle && byUid(battle, e.u);
      if (u && u.side === 'a') {
        al = true;
      }
    } else if (e.e === 'ko') {
      k++;
    } else if (e.e === 'rx') {
      r++;
    } else if (e.e === 'catch') {
      c++;
    } else if (e.e === 'duo') {
      d++;
    }
  });
  if (d) {
    sfx('duo');
  } else if (c) {
    sfx('catch');
  } else if (k) {
    sfx('ko');
  } else if (r) {
    sfx('rx');
  } else if (h) {
    sfx('hit');
  }
  if (k) {
    vibrate([40, 30, 40]);
  } else if (al) {
    vibrate(25);
  }
}

export const SOUND_EFFECTS = {
  ui: () => playTone(880, 0, 0.06, 'triangle', 0.04),
  hit: () => {
    noise(0, 0.14, 0.14, 700);
    playTone(140, 0, 0.12, 'sine', 0.08, 70);
  },
  rx: () => [1046, 1318, 1568].forEach((f, i) => playTone(f, i * 0.05, 0.18, 'triangle', 0.05)),
  ko: () => {
    playTone(392, 0, 0.18, 'square', 0.04, 196);
    playTone(196, 0.16, 0.3, 'square', 0.035, 98);
  },
  evo: () => {
    [523, 659, 784, 1046, 1318].forEach((f, i) => playTone(f, i * 0.11, 0.4, 'triangle', 0.05));
    noise(0.55, 0.5, 0.05, 4000);
  },
  catch: () => {
    playTone(660, 0, 0.08, 'square', 0.04);
    playTone(660, 0.18, 0.08, 'square', 0.04);
    playTone(990, 0.36, 0.3, 'triangle', 0.06);
  },
  win: () => [523, 659, 784, 1046].forEach((f, i) => playTone(f, i * 0.13, i === 3 ? 0.6 : 0.16, 'triangle', 0.06)),
  lose: () => [392, 349, 311, 262].forEach((f, i) => playTone(f, i * 0.18, 0.3, 'sine', 0.05)),
  duo: () => {
    [392, 523, 659, 784, 1046].forEach((f, i) => playTone(f, i * 0.06, 0.25, 'sawtooth', 0.03));
    noise(0.3, 0.4, 0.06, 2500);
  },
};

// Instructions run at startup, in the original order (see index.js).
export function init() {
  /* ---- synthesized sound (no files) and vibrations ---- */
  AC = null;
}
