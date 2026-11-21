/* Pokémon-style battle (entry, Poké Balls, HP bars, evolution, badge ceremony) (added in v4.73). */

import { clearOverlay, paintOverlay } from '../../screens/overlays/dialogsStore.js';
import { GYMS } from '../data/game-data.js';
import { SCENARIOS } from '../pokemon/pokemon.js';
import { ARENAS, BADGES } from '../modes/gyms.js';
import { $, reducedMotion, svgElement } from '../core/utils.js';
import { HOOKS } from '../core/hooks.js';
import { badgeSvg } from '../modes/league.js';
import { unitKey } from './engine.js';
import { battle, cellCenter, BOARD_LAYERS } from './ui.js';
import { PREFERENCES, calmMotion } from '../ui/preferences.js';
import { noise, playTone, vibrate } from '../audio/sound-effects.js';
import { AUTO, leaderOf } from '../progression/prestige.js';
import { boardSet, getBoard, tokCl, tokHas, unitsBatch } from '../../screens/combat/board/boardStore.js';

const auto = () => !!AUTO;

const isFast = () => {
  try {
    return !!PREFERENCES.fast;
  } catch (e) {
    return false;
  }
};

/* ---------- home-made sounds (synthesized, no official sound) ---------- */
const SOUNDS = {
  whoosh: () => noise(0, 0.32, 0.05, 1600),
  envoi: () => {
    noise(0, 0.04, 0.05, 4200);
    playTone(620, 0.02, 0.09, 'square', 0.022, 1320);
  },
  retour: () => playTone(1500, 0, 0.26, 'sine', 0.035, 320),
};

const playSound = k => {
  try {
    if (!PREFERENCES.sound || reducedMotion || PREFERENCES.pokeStyleS === 0) {
      return;
    }
    SOUNDS[k] && SOUNDS[k]();
  } catch {
    /* Best effort: failure here is non-fatal. */
  }
};

/* ---------- drawings: SVG Poké Ball ---------- */
const ballSvg = r =>
  `<path class="pokeball-top" d="M${-r} 0A${r} ${r} 0 0 1 ${r} 0Z"/><path class="pokeball-bottom" d="M${-r} 0A${r} ${r} 0 0 0 ${r} 0Z"/><circle class="pokeball-button" r="${(r * 0.32).toFixed(2)}"/>`;

const sparks = (n, cls) => {
  let h = '';
  for (let i = 0; i < n; i++) {
    h += `<circle class="${cls}" r="1.5" style="--a:${Math.round((360 / n) * i + 15)}deg"/>`;
  }
  return h;
};

/* ---------- 1. battle entry ---------- */
// #pk-btr is rendered by React (src/screens/overlays/Effects.jsx): its bands are
// set by the store (paintOverlay('btr')), its state classes (is-playing, is-boss / is-trainer / is-wild, is-fast) here.
let btr;

let tBtr;

const entranceClass = b => {
  const D = SCENARIOS[b.sc] || {};
  if (D.wild && !D.legend) {
    return 'is-wild';
  }
  let boss = !!(D.rival || D.legend || b.sc === 'champ' || D.gym != null);
  try {
    boss = boss || ARENAS.findIndex(a => a.k === b.sc) >= 0 || !!leaderOf(b.sc);
  } catch {
    /* Best effort: failure here is non-fatal. */
  }
  return boss ? 'is-boss' : 'is-trainer';
};

const transition = b => {
  if (calmMotion() || auto()) {
    return;
  }
  btr.className = 'battle-entrance';
  paintOverlay('btr', { on: true });
  void btr.offsetWidth;
  btr.className = 'battle-entrance is-playing ' + entranceClass(b) + (isFast() ? ' is-fast' : '');
  playSound('whoosh');
  clearTimeout(tBtr);
  tBtr = setTimeout(
    () => {
      btr.className = 'battle-entrance';
      clearOverlay('btr');
    },
    isFast() ? 700 : 1500
  );
};

/* ---------- 2. sending out Pokémon and returning on K.O. ---------- */
let ENTRANCES;

// effects layer (React, last on the board), created on first use
const layer = () => {
  if (!getBoard().pk) {
    boardSet({ pk: true }, 'pk');
  }
  return BOARD_LAYERS.pk73 && BOARD_LAYERS.pk73.isConnected ? BOARD_LAYERS.pk73 : null;
};

const showIt = _b => {
  try {
    if (!BOARD_LAYERS || !BOARD_LAYERS.u) {
      return;
    }
    unitsBatch(() => Object.values(BOARD_LAYERS.u).forEach(T => tokCl(T, 'is-waiting', false))); // token classes: Units.jsx
  } catch {
    /* Best effort: failure here is non-fatal. */
  }
};

const prepare = b => {
  if (!b || calmMotion() || auto() || !BOARD_LAYERS || !BOARD_LAYERS.u) {
    return;
  }
  ENTRANCES.set(b, 1);
  b.units.forEach(u => {
    const T = BOARD_LAYERS.u[u.uid];
    if (T && !u.ko) {
      tokCl(T, 'is-waiting', true);
    }
  });
  setTimeout(() => {
    if (ENTRANCES.get(b) === 1) {
      ENTRANCES.set(b, 2);
      showIt(b);
    }
  }, 9000);
};

const send = b => {
  const g = layer();
  if (!g || calmMotion()) {
    return showIt(b);
  }
  const D = SCENARIOS[b.sc] || {},
    wild = !!D.wild;
  const listItems = b.units.filter(u => !u.ko && BOARD_LAYERS.u[u.uid]);
  listItems.sort((x, y) => (x.side === 'e' ? 0 : 1) - (y.side === 'e' ? 0 : 1));
  const stepSize = isFast() ? 0.04 : 0.11;
  listItems.forEach((u, i) => {
    const T = BOARD_LAYERS.u[u.uid];
    let x, y;
    try {
      [x, y] = cellCenter(unitKey(u));
    } catch (e) {
      tokCl(T, 'is-waiting', false);
      return;
    }
    const d = i * stepSize,
      wildMon = wild && u.side === 'e';
    const w = svgElement('g', { transform: `translate(${x.toFixed(1)},${y.toFixed(1)})` }, g);
    w.style.setProperty('--d', d.toFixed(2) + 's');
    w.innerHTML = wildMon
      ? `<circle class="pk-wl-r" r="15"/>${sparks(6, 'pk-lf')}`
      : `<circle class="pk-so-fl" r="17"/>${sparks(6, 'pk-spk')}<g class="pk-so">${ballSvg(7)}</g>`;
    setTimeout(() => tokCl(T, 'is-waiting', false), (d + (wildMon ? 0.12 : 0.36)) * 1000);
    setTimeout(() => w.remove(), (d + 1.1) * 1000);
  });
  if (listItems.length) {
    playSound('envoi');
  }
  setTimeout(() => showIt(b), listItems.length * stepSize * 1000 + 900);
};

const recall = u => {
  const g = layer(),
    T = BOARD_LAYERS.u && BOARD_LAYERS.u[u.uid];
  if (!g || !T) {
    return;
  }
  let x, y;
  try {
    [x, y] = cellCenter(unitKey(u));
  } catch (e) {
    return;
  }
  const D = (battle && SCENARIOS[battle.sc]) || {},
    wildMon = !!D.wild && u.side === 'e';
  const w = svgElement('g', { transform: `translate(${x.toFixed(1)},${y.toFixed(1)})` }, g);
  if (wildMon) {
    w.innerHTML = '<circle class="pk-poof" r="14"/>';
  } else {
    w.innerHTML = `<circle class="pk-ko-r" r="15"/><rect class="pk-ko-bm" x="-2" y="-42" width="4" height="42" rx="2"/><g transform="translate(0,-46)"><g class="pk-ko-b">${ballSvg(7.5)}</g></g>`;
    tokCl(T, 'is-flashing', true);
    setTimeout(() => tokCl(T, 'is-flashing', false), 800);
    playSound('retour');
  }
  setTimeout(() => w.remove(), 1300);
};

// a Pokémon that has just been knocked out returns to its Poké Ball
let wasKo;

/* ---------- 7. badge ceremony ---------- */
let CELEBRATED;

// #pk-badge is rendered by React (src/screens/overlays/Effects.jsx); hidden and .is-leaving stay set here
let bc;

let tBc;

const closeBadge = () => {
  if (bc.hidden || bc.classList.contains('is-leaving')) {
    return;
  }
  clearTimeout(tBc);
  bc.classList.add('is-leaving');
  setTimeout(() => {
    bc.hidden = true;
    bc.classList.remove('is-leaving');
    clearOverlay('badge');
  }, 300);
};

const celebrateBadge = () => {
  if (!battle || !battle.rew || !battle.rew.badgeNew || CELEBRATED.has(battle) || calmMotion() || auto()) {
    return;
  }
  const D = SCENARIOS[battle.sc] || {};
  let i = typeof D.gym === 'number' ? D.gym : -1;
  if (i < 0) {
    i = ARENAS.findIndex(a => a.k === battle.sc);
  }
  if (i < 0) {
    return;
  }
  CELEBRATED.add(battle);
  let leader = '';
  try {
    const Lc = leaderOf(battle.sc);
    if (Lc && Lc.n) {
      leader = Lc.n;
    }
  } catch {
    /* Best effort: failure here is non-fatal. */
  }
  const displayName = (GYMS[i] && GYMS[i].t) || D.at || '';
  paintOverlay('badge', {
    svg: badgeSvg(i, (GYMS[i] && GYMS[i].t) || displayName, 'pkbc' + i),
    leader,
    displayName,
    n: BADGES.length,
  });
  bc.hidden = false;
  try {
    vibrate([20, 40, 20, 40, 90]);
  } catch {
    /* Best effort: failure here is non-fatal. */
  }
  clearTimeout(tBc);
  tBc = setTimeout(closeBadge, isFast() ? 2400 : 4200);
};

let res;

// Statements run at startup, in the original order (see index.js).
export function init() {
  window.__battleSound = playSound;
  btr = document.getElementById('pk-btr');
  tBtr = 0;
  ENTRANCES = new WeakMap();
  HOOKS.beforePresentation.push(() => {
    if (battle && !battle.over) {
      prepare(battle);
      transition(battle);
    }
  });
  HOOKS.beforeBanner.push(() => {
    try {
      if (battle && ENTRANCES.get(battle) === 1) {
        ENTRANCES.set(battle, 2);
        send(battle);
      }
    } catch (e) {
      showIt(battle);
    }
  });
  wasKo = null;
  HOOKS.beforeToken.push(u => {
    wasKo = null;
    const T = BOARD_LAYERS.u && BOARD_LAYERS.u[u.uid];
    wasKo = T ? tokHas(T, 'is-ko') : null;
  });
  HOOKS.afterToken.push(u => {
    if (wasKo === false && u.ko && !u.caught && !calmMotion() && !auto()) {
      recall(u);
    }
  });
  /* ---------- 3. HP drops gradually ---------- */
  HOOKS.hpBar.push(h => {
    try {
      if (calmMotion()) {
        return h;
      }
      const m = /--a:([\d.]+)%;--b:([\d.]+)%;animation-delay:-(\d+)ms/.exec(h);
      if (!m) {
        return h;
      }
      return h.replace(
        /<i class="([^"]*)" style="width:([\d.]+)%">/,
        (x, c, w) => `<i class="${c} pk-dr" style="width:${w}%;--pa:${m[1]}%;animation-delay:-${m[3]}ms">`
      );
    } catch (e) {
      return h;
    }
  });
  CELEBRATED = new WeakSet();
  bc = document.getElementById('pk-badge');
  tBc = 0;
  bc.addEventListener('click', closeBadge);
  document.addEventListener('keydown', e => {
    if (!bc.hidden && (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ')) {
      closeBadge();
    }
  });
  res = $('#cbResult');
  if (res && window.MutationObserver) {
    new MutationObserver(() => {
      try {
        if (!res.hidden && res.querySelector('.result-card')) {
          setTimeout(celebrateBadge, 250);
        }
      } catch {
        /* Best effort: failure here is non-fatal. */
      }
    }).observe(res, { childList: true });
  }
  window.__battleStyle = { transition, send, retour: recall, celebrateBadge, ENTREE: ENTRANCES, entranceClass };
}
