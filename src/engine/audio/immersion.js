/* Immersion — type sounds, cries, vibrations, battle entrance, effects, animated weather, holo, victory, log (added in v4.48). */

import { clearOverlay, paintOverlay } from '../../screens/overlays/dialogsStore.js';
import { bdClass, getHost, hostSet } from '../../screens/combat/board/boardStore.js';
import { BY, SCEN } from '../pokemon/pokemon.js';
import { $, RM, after2images, writeLS, el, tc } from '../core/utils.js';
import { HOOKS } from '../core/hooks.js';
import { byUid } from '../combat/engine.js';
import { B, HC, L } from '../combat/ui.js';
import { PREF, savePref } from '../ui/preferences.js';
import { SFX, noise, tone, vibe } from './sound-effects.js';
import { AUTO } from '../progression/prestige.js';
import { V4 } from '../ui/screen-state.js';
import { ownedFam } from '../progression/trainer-stats.js';
import { renderParams } from '../ui/settings.js';
import { BGM } from './music.js';

let tipIndex, lastTiltAt;

/** Immersion on and animations not reduced (same test as IMMERSION_ON() && !RM, hoisted for 082 and 083). */
export function effectsEnabled() {
  return PREF.immersionOn !== 0 && !RM;
}

function playTypeSfx(ty) {
  if (!PREF.sound || RM || !IMMERSION_ON()) {
    return;
  }
  try {
    (TYPE_SOUNDS[ty] || SFX.hit)();
  } catch {
    /* Best effort: failure here is non-fatal. */
  }
}

function playStep() {
  if (!PREF.sound || RM || !IMMERSION_ON()) {
    return;
  }
  try {
    tone(210 + Math.random() * 70, 0, 0.045, 'triangle', 0.03, 150);
  } catch {
    /* Best effort: failure here is non-fatal. */
  }
}

/** Synthesized cry: the pitch depends on the national number, so each species has its own. */
function playCry(u, ko) {
  if (!PREF.sound || RM || !IMMERSION_ON() || !u) {
    return;
  }
  try {
    const no = (BY[u.id] && BY[u.id].no) || 1,
      f = 300 + ((no * 53) % 380),
      big = (u.mhp || 20) > 30 ? 0.75 : 1;
    if (ko) {
      tone(f * 0.9 * big, 0, 0.3, 'sawtooth', 0.04, f * 0.35 * big);
      tone(f * 0.45 * big, 0.2, 0.3, 'square', 0.025, f * 0.2 * big);
    } else {
      tone(f * big, 0, 0.12, 'sawtooth', 0.035, f * 1.35 * big);
      tone(f * 1.35 * big, 0.1, 0.2, 'square', 0.025, f * 0.85 * big);
    }
  } catch {
    /* Best effort: failure here is non-fatal. */
  }
}

function lowHpAlarm() {
  if (!PREF.sound || RM || !IMMERSION_ON()) {
    return;
  }
  try {
    [0, 0.16, 0.32].forEach(t => tone(1568, t, 0.07, 'square', 0.035));
  } catch {
    /* Best effort: failure here is non-fatal. */
  }
}

/* ---------- 2. battle music: livelier when an ally is nearly KO ---------- */
function adaptMusicTempo() {
  try {
    Object.keys(BGM.el).forEach(k => {
      const a = BGM.el[k];
      if (!a) {
        return;
      }
      const want = 1; // v4.49: the « low HP » track replaces the speed-up
      if (a.playbackRate !== want) {
        a.playbackRate = want;
      }
    });
  } catch {
    /* Best effort: failure here is non-fatal. */
  }
}

/* ---------- 3. board effects: particles, shake, vibrations ---------- */
function spawnParticles(k, ty) {
  if (!effectsEnabled() || !L.fx) {
    return;
  }
  const [x, y] = HC(k),
    c = tc(ty || 'Normal'),
    n = 9;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + Math.random() * 0.5,
      d = 14 + Math.random() * 16;
    const p = el(
      'circle',
      {
        class: 'burst-particle',
        cx: x.toFixed(1),
        cy: y.toFixed(1),
        r: (1.6 + Math.random() * 1.8).toFixed(1),
        style: `--dx:${(Math.cos(a) * d).toFixed(1)}px;--dy:${(Math.sin(a) * d).toFixed(1)}px;fill:${c}`,
      },
      L.fx
    );
    setTimeout(() => p.remove(), 800);
  }
}

function screenShake(big) {
  if (!effectsEnabled()) {
    return;
  }
  if (!$('#bBoard')) {
    return;
  }
  const cls = getHost().cls,
    already = cls.includes('screen-shake') || cls.includes('shake-big');
  const finishUp = () => (bdClass('screen-shake', false), bdClass('shake-big', false));
  finishUp();
  const launchMove = () => {
    bdClass(big ? 'shake-big' : 'screen-shake', true);
    clearTimeout(screenShake.t);
    screenShake.t = setTimeout(finishUp, 520);
  };
  if (already) {
    after2images(launchMove);
  } else {
    launchMove();
  }
}

function showTransition() {
  if (!effectsEnabled() || !B) {
    return;
  }
  // #battleTransition: rendered by React (src/screens/overlays/Effects.jsx) for the duration of the transition
  paintOverlay('battle-transition', {});
  try {
    [330, 440, 554, 740].forEach((f, i) => tone(f, i * 0.07, 0.16, 'square', 0.03, f * 1.3));
    noise(0.3, 0.45, 0.07, 2200);
  } catch {
    /* Best effort: failure here is non-fatal. */
  }
  vibe([40, 40, 60]);
  clearTimeout(showTransition.t);
  showTransition.t = setTimeout(() => clearOverlay('battle-transition'), 1250);
  const fo = B.units.find(u => u.side === 'e');
  setTimeout(() => playCry(fo, false), 900);
}

/* ---------- 6. animated weather on the board ---------- */
function boardWeather() {
  // #boardWeather: rendered by React (Board.jsx)
  const k = effectsEnabled() && B && !B.over && B.wx && B.wx.k ? B.wx.k : null;
  if (getHost().boardWeather !== k) {
    hostSet({ boardWeather: k });
  }
}

/* ---------- 7. holographic cards and living Pokédex ---------- */
function tiltArt(art, px, py) {
  const r = art.getBoundingClientRect();
  if (!r.width) {
    return;
  }
  const x = Math.max(0, Math.min(1, (px - r.left) / r.width)),
    y = Math.max(0, Math.min(1, (py - r.top) / r.height));
  art.style.setProperty('--hx', (x * 100).toFixed(0) + '%');
  art.style.setProperty('--hy', (y * 100).toFixed(0) + '%');
  art.style.setProperty('--rx', ((0.5 - y) * 9).toFixed(1) + 'deg');
  art.style.setProperty('--ry', ((x - 0.5) * 11).toFixed(1) + 'deg');
}

function dexSeen() {
  try {
    return JSON.parse(localStorage.getItem('res-dex-seen') || '{}');
  } catch (e) {
    return {};
  }
}

/* ---------- 9. trainer journal (on this device) ---------- */
export function readJournal() {
  try {
    return Object.assign(
      { streak: 0, best: 0, use: {} },
      JSON.parse(localStorage.getItem('res-trainer-journal') || '{}')
    );
  } catch (e) {
    return { streak: 0, best: 0, use: {} };
  }
}

function saveJournal(j) {
  writeLS('res-trainer-journal', j);
}

/** Next tip under the « VS » presentation (text), or null if immersion is off. */
export function versusTip() {
  return IMMERSION_ON() ? IMMERSION_TIPS[tipIndex++ % IMMERSION_TIPS.length] : null;
}

/** Redrawn Pokédex entry: sweep, and a little fanfare the first time an owned family is opened. */
export function scanPokedex() {
  try {
    const card = $('#dex4Card');
    if (!card) {
      return;
    }
    const own = !!ownedFam(V4.dexSel);
    card.classList.remove('scan-sweep');
    void card.offsetWidth;
    if (IMMERSION_ON() && !RM) {
      card.classList.add('scan-sweep');
    }
    if (own && IMMERSION_ON() && !RM) {
      const s = dexSeen(),
        id = V4.dexSel;
      if (!s[id]) {
        s[id] = 1;
        writeLS('res-dex-seen', s);
        card.classList.add('dex-new');
        setTimeout(() => card.classList.remove('dex-new'), 1800);
        try {
          [784, 988, 1318].forEach((f, i) => tone(f, i * 0.09, 0.22, 'triangle', 0.045));
        } catch {
          /* Best effort: failure here is non-fatal. */
        }
      }
    }
  } catch {
    /* Best effort: failure here is non-fatal. */
  }
}

export const IMMERSION_ON = () => PREF.immersionOn !== 0;

/* ---------- 5. battle entrance: flash, iris, cry, tip ---------- */
const IMMERSION_TIPS = [
  'Les Piliers bloquent les tirs directs ; derrière un Rocher, la couverture réduit les dégâts à distance de 40 %.',
  'L’Eau compte comme Trempé : parfait pour une réaction avec l’Électrik.',
  'Dans les hautes herbes, un Pokémon caché ne peut être visé qu’à 2 cases ou moins. Le Feu les embrase.',
  'Le Sable coûte 2 Mouvements pour y entrer, sauf aux types Sol, Roche, Acier et aux volants.',
  'La Boue ralentit les déplacements par 3, la Lave brûle ceux qui s’y arrêtent.',
  'Dans le brouillard, on ne vise pas à distance : approchez-vous.',
  'Une capacité de météo dure 5 manches et change la durée des marques sur tout le plateau.',
  'À l’Éveil, Évoli choisit librement parmi ses 5 évolutions ; en harmonie avec sa case ou l’heure, il garde 1 losange.',
  'Un appui long sur une case du plateau affiche son terrain, ses dangers et le Pokémon présent.',
  'En capture, un Pokémon K.O. s’enfuit : calmez-le sans l’assommer.',
  'Deux types complémentaires ouvrent une synergie : regardez le Guide avant de composer l’équipe.',
  'Une Roche Météo prolonge la météo déclenchée par son porteur de 3 manches.',
];

/* ---------- 1. sounds by attack type (synthesized, no file) ---------- */
const TYPE_SOUNDS = {
  Normal: () => {
    noise(0, 0.1, 0.12, 1400);
    tone(190, 0, 0.1, 'sine', 0.07, 90);
  },
  Feu: () => {
    noise(0, 0.4, 0.13, 2600);
    tone(320, 0, 0.35, 'sawtooth', 0.04, 110);
  },
  Eau: () => [520, 700, 900].forEach((f, i) => tone(f, i * 0.07, 0.14, 'sine', 0.05, f * 1.5)),
  Plante: () => {
    tone(392, 0, 0.16, 'triangle', 0.05, 523);
    tone(523, 0.12, 0.2, 'triangle', 0.04, 659);
    noise(0, 0.18, 0.05, 3200);
  },
  Électrik: () => [1200, 520, 1500, 480, 1300].forEach((f, i) => tone(f, i * 0.04, 0.05, 'square', 0.035)),
  Glace: () => [2093, 2637, 3136].forEach((f, i) => tone(f, i * 0.06, 0.22, 'triangle', 0.035)),
  Combat: () => {
    noise(0, 0.08, 0.16, 900);
    tone(110, 0, 0.14, 'sine', 0.1, 50);
    tone(90, 0.1, 0.14, 'sine', 0.08, 45);
  },
  Poison: () => {
    tone(200, 0, 0.3, 'sawtooth', 0.035, 330);
    noise(0.05, 0.25, 0.06, 1800);
  },
  Sol: () => {
    noise(0, 0.35, 0.16, 320);
    tone(62, 0, 0.35, 'sine', 0.1, 40);
  },
  Vol: () => noise(0, 0.32, 0.1, 4200),
  Psy: () => {
    tone(600, 0, 0.35, 'sine', 0.05, 920);
    tone(920, 0.3, 0.3, 'sine', 0.04, 560);
  },
  Insecte: () => [0, 0.05, 0.1, 0.15, 0.2].forEach(t => tone(760 + Math.random() * 120, t, 0.06, 'sawtooth', 0.03)),
  Roche: () => {
    noise(0, 0.2, 0.15, 520);
    tone(95, 0, 0.18, 'sine', 0.09, 60);
  },
  Spectre: () => {
    tone(320, 0, 0.5, 'sine', 0.05, 140);
    tone(326, 0, 0.5, 'sine', 0.04, 146);
  },
  Dragon: () => {
    tone(120, 0, 0.45, 'sawtooth', 0.05, 66);
    noise(0, 0.4, 0.08, 1500);
  },
  Ténèbres: () => {
    tone(160, 0, 0.38, 'triangle', 0.07, 76);
    noise(0.05, 0.25, 0.06, 600);
  },
  Acier: () => {
    tone(1760, 0, 0.12, 'square', 0.03);
    tone(2349, 0.02, 0.22, 'triangle', 0.04);
    noise(0, 0.06, 0.1, 5000);
  },
  Fée: () => [1318, 1760, 2093, 2637].forEach((f, i) => tone(f, i * 0.07, 0.24, 'sine', 0.04)),
};

function onJournal(ev) {
  let steps = 0,
    boom = false,
    kos = 0,
    low = false;
  ev.forEach(e => {
    if (e.e === 'use') {
      playTypeSfx(e.ty);
      if (e.k != null) {
        spawnParticles(e.k, e.ty);
      }
    } else if (e.e === 'mv') {
      if (steps++ < 2) {
        playStep();
      }
    } else if (e.e === 'dmg') {
      const u = byUid(B, e.u);
      if (u && u.side === 'a' && !u.ko && u.hp / u.mhp <= 0.25 && !u._lowHpAlerted) {
        u._lowHpAlerted = 1;
        low = true;
      }
      if (u && e.v >= u.mhp * 0.35) {
        boom = true;
      }
    } else if (e.e === 'ko') {
      kos++;
      playCry(byUid(B, e.u), true);
      boom = true;
    } else if (e.e === 'msg' && /super efficace/.test(e.s || '')) {
      boom = true;
      vibe([18, 30, 40]);
    } else if (e.e === 'catch') {
      vibe([30, 40, 30, 40, 90]);
    } else if (e.e === 'rx' || e.e === 'reso') {
      vibe(22);
    }
  });
  if (boom) {
    screenShake(kos > 0);
  }
  if (low) {
    setTimeout(lowHpAlarm, 380);
    vibe([30, 60, 30]);
  }
  adaptMusicTempo();
}

// Statements run at startup, in the original order (see index.js).
export function init() {
  setInterval(() => {
    try {
      if (!B || B.over || $('#cbBattle').hidden) {
        adaptMusicTempo();
      }
    } catch {
      /* Best effort: failure here is non-fatal. */
    }
  }, 1500);
  HOOKS.journal.push(onJournal);
  /* ---------- 4. the attack's type in the log (for sound and particles) ---------- */
  /* (resolveMove adds « ty » to the « use » event: see the source patch) */

  tipIndex = Math.floor(Math.random() * IMMERSION_TIPS.length);
  HOOKS.launch.push(() => {
    if (B && !AUTO) {
      showTransition();
    }
  });
  /* the tip is shown under the « VS » presentation: versusTip(), rendered in Vs.jsx */

  HOOKS.rendered.push(boardWeather);
  document.addEventListener(
    'pointermove',
    e => {
      if (e.pointerType === 'touch' || RM) {
        return;
      }
      const a = e.target.closest && e.target.closest('.dex-art');
      if (a) {
        tiltArt(a, e.clientX, e.clientY);
      }
    },
    { passive: true }
  );
  document.addEventListener('pointerleave', () => {}, { passive: true });
  lastTiltAt = 0;
  addEventListener(
    'deviceorientation',
    e => {
      if (RM || !IMMERSION_ON() || e.gamma == null) {
        return;
      }
      const t = Date.now();
      if (t - lastTiltAt < 60) {
        return;
      }
      lastTiltAt = t;
      const a = document.querySelector('#dex4Card .dex-art');
      if (!a || !a.offsetParent) {
        return;
      }
      const r = a.getBoundingClientRect();
      tiltArt(
        a,
        r.left + r.width * (0.5 + Math.max(-30, Math.min(30, e.gamma)) / 60),
        r.top + r.height * (0.5 + Math.max(-30, Math.min(30, (e.beta || 45) - 45)) / 60)
      );
    },
    { passive: true }
  );
  /* ---------- 8. victory: burst, badge appearing, vibration ---------- */
  // resultFx / goldGlow classes and .resultBadge badge: rendered by React (Result.jsx); here, vibration and chime
  new MutationObserver(() => {
    const r = $('#cbResult'),
      c = r && r.querySelector('.result-card.is-celebrating');
    if (!r || r.hidden || !c || !B || B._resultFxDone) {
      return;
    }
    B._resultFxDone = 1;
    vibe([60, 40, 60, 40, 140]);
    try {
      if (c.querySelector('.result-badge')) {
        [659, 784, 1046, 1318, 1568].forEach((f, j) => tone(f, j * 0.1, 0.3, 'triangle', 0.05));
      }
    } catch {
      /* Best effort: failure here is non-fatal. */
    }
  }).observe($('#cbResult'), { childList: true, attributes: true, attributeFilter: ['hidden'] });
  HOOKS.battleEnd.push(() => {
    if (B && B.over && !B._journalDone && !(SCEN[B.sc] || {}).noProgress) {
      B._journalDone = 1;
      const j = readJournal(),
        win = B.over === 'win';
      j.streak = win ? j.streak + 1 : 0;
      j.best = Math.max(j.best, j.streak);
      B.units
        .filter(u => u.side === 'a')
        .forEach(u => {
          const b = BY[u.id] ? BY[u.id].base : u.id;
          j.use[b] = (j.use[b] || 0) + 1;
        });
      saveJournal(j);
    }
  });
  // « Immersion » and « Trainer journal » panels: rendered by React (src/screens/settings/panels/Immersion.jsx, TrainerJournal.jsx)

  document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('[data-immersion-action]');
    if (!b) {
      return;
    }
    if (b.dataset.immersionAction === 'im') {
      PREF.immersionOn = IMMERSION_ON() ? 0 : 1;
      savePref();
      boardWeather();
      adaptMusicTempo();
      renderParams();
    }
  });
}
