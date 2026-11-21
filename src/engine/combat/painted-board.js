/* Painted graphics (backgrounds and textures from the img/ folder, tilted board in perspective) (added in v4.77). */

import { SCENARIOS } from '../pokemon/pokemon.js';
import { $, reducedMotion, toast } from '../core/utils.js';
import { HOOKS } from '../core/hooks.js';
import { BOARD_ROWS, BOARD_COLS, cellKey, byUid, unitKey } from './engine.js';
import {
  battle,
  BOARD_GEOMETRY,
  cellCenter,
  flatCellCenter,
  cellPoints,
  BOARD_LAYERS,
  phoneQuery,
  BOARD_TILT,
  boardViewBox,
  isVerticalBoard,
  __set_GREEN,
  buildBoard,
  clearAim,
  renderAll,
  tiltP,
  tiltS,
  ui,
} from './ui.js';
import { PREFERENCES, savePref } from '../ui/preferences.js';
import { TUTORIAL_STEPS } from '../progression/tutorial.js';
import { sfx } from '../audio/sound-effects.js';
import { EFFECTS_CANVAS, fxAdd, effectsEnabled, fxPrep } from './move-effects.js';
import { renderParams } from '../ui/settings.js';
import { currentActor } from './tactical-engine.js';
import { hourOf } from './living-board.js';
import { NEWS_ENTRIES } from '../ui/whats-new.js';
import { coopPlayer } from '../modes/coop.js';
import { battleDelay } from './quick-battle.js';
import { animEnabled, replayAnimation } from './expressive-pokemon.js';
import { TUTORIAL_LIST } from '../ui/tutorial-chapters.js';
import { refreshBattle } from '../../screens/combat/battle/battleStore.js';
import {
  bdClass,
  bdReplay,
  boardSet,
  getBoard,
  getHost,
  hostSet,
  unitsDirty,
} from '../../screens/combat/board/boardStore.js';

// Guided turn flow (v4.78): steps read by the panel and the bottom bar (src/screens/combat/battle).
export let turnFlow;

/* Images come from the img/ folder placed next to the file, like audio/.
     Without that folder, or in « Léger » (Light) mode, nothing changes: flat board from v4.76. */
const TEX = ['grass', 'stone', 'water', 'sand', 'ash', 'marble', 'rune', 'mud', 'lava'];

const STATES = ['wet', 'mud', 'lava', 'is-deploy-zone', 'is-fogged'];

// cell states drawn on the cell: copied onto its texture
const OK = new Set();

let artOk;

const richText = () => artOk && PREFERENCES.graphicsMode !== 'leger';

const inBattle = () => battle && BOARD_LAYERS.tiles && !$('#cbBattle').hidden;

const rebuildAll = () => {
  if (inBattle()) {
    buildBoard();
    renderAll();
  }
};

// a single probe: without the img/ folder, only one request fails
const load = (t, ok, ko) => {
  const im = new Image();
  im.onload = () => {
    OK.add(t);
    if (ok) {
      ok();
    }
  };
  if (ko) {
    im.onerror = ko;
  }
  im.src = 'img/tex-' + t + '.webp';
};

/* ---------- perspective: set on every board build ---------- */
const LIP = 7;

// thickness of the earth slab under the cells (viewBox units, at the front row)
const tune = () => {
  BOARD_TILT.on = false;
  if (!richText() || !battle) {
    return;
  }
  __set_GREEN(!!(phoneQuery && phoneQuery.matches));
  const [W, H] = boardViewBox(),
    S = BOARD_GEOMETRY.S,
    a = ((isVerticalBoard ? 30 : 40) * Math.PI) / 180,
    pts = [];
  for (const k in battle.tiles) {
    const [x, y] = flatCellCenter(k);
    for (let i = 0; i < 6; i++) {
      pts.push([x + S * Math.cos((Math.PI / 3) * i), y + S * Math.sin((Math.PI / 3) * i)]);
    }
  }
  Object.assign(BOARD_TILT, {
    f: isVerticalBoard ? 950 : 780,
    sn: Math.sin(a),
    cs: Math.cos(a),
    Hb: Math.max(...pts.map(p => p[1])),
    cx: W / 2,
    k: 1,
    ox: 0,
    oy: 0,
  });
  const pr = pts.map(p => tiltP(p[0], p[1])),
    xs = pr.map(p => p[0]),
    ys = pr.map(p => p[1]),
    x0 = Math.min(...xs),
    x1 = Math.max(...xs),
    y0 = Math.min(...ys),
    y1 = Math.max(...ys),
    m = 12, // side margin: A–H landmarks
    bottomEdge = 26, // below the front row: pedestal + Pokémon names
    sky = H * (isVerticalBoard ? 0.1 : 0.14); // strip of backdrop left visible above the board
  const k = Math.min((W - 2 * m) / (x1 - x0), (H - sky - bottomEdge) / (y1 - y0));
  BOARD_TILT.k = k;
  BOARD_TILT.ox = (W - (x1 - x0) * k) / 2 - x0 * k;
  BOARD_TILT.oy = H - bottomEdge - y1 * k;
  BOARD_TILT.on = true;
};

/* ---------- dressing of the built board ---------- */
// gyms: the backdrop follows the champion's type (canyon for Rock, mystic tower for Ghost…), stadium otherwise
const AT = {
  Roche: 'roche',
  Sol: 'roche',
  Combat: 'roche',
  Acier: 'roche',
  Spectre: 'tour',
  Dragon: 'tour',
  Psy: 'tour',
  Poison: 'tour',
  Ténèbres: 'tour',
};

const placeLabel = () => {
  const D = SCENARIOS[battle.sc];
  return D.bio === 'arene' ? AT[D.at] || 'ligue' : D.bio;
};

const bgFill = () => {
  const bio = placeLabel(),
    h = hourOf(battle);
  // Full URLs: in a CSS variable, a relative url() resolves against the
  // stylesheet that reads the variable (assets/ once the game is built), not against the page.
  const img = f => `url(${new URL('img/' + f, document.baseURI).href})`;
  return [`bg-${bio}-${h}.webp`, `bg-${bio}-jour.webp`, `bg-gue-${h}.webp`].map(img).join(',');
};

// horizon haze and moon tint: set here so the time of day can change mid-battle
// (React layers: .hazeLight.n and the #hazeGradient stops follow the « night » state)
const tint = isNight => boardSet({ night: isNight }, 'defs', 'tilt');

// night falls (or day breaks) during the battle: the painted backdrop cross-fades, the light follows
const changeTime = () => {
  const bd = $('#bBoard'),
    h = hourOf(battle);
  BOARD_LAYERS.hourOfDay = h;
  const previous = getComputedStyle(bd).backgroundImage;
  hostSet({ boardBg: bgFill() });
  // .bgFade (old backdrop fading out): rendered by React (Board.jsx)
  if (animEnabled() && previous && previous !== 'none') {
    const n = ((getHost().fade || {}).n || 0) + 1,
      fd = { n, bg: previous, va: false };
    hostSet({ fade: fd });
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        if (getHost().fade === fd) {
          hostSet({ fade: { ...fd, va: true } });
        }
      })
    );
    setTimeout(() => {
      const f = getHost().fade;
      if (f && f.n === n) {
        hostSet({ fade: null });
      }
    }, 2200);
  }
  tint(h === 'nuit');
  cloudList();
  ambiance();
  water(true); // recolored highlights (moon or sun)
};

const dress = () => {
  // classes, --boardBg, clouds and dust of #bBoard: rendered by React (« host » state of boardStore.js)
  bdClass('painted-tilt', BOARD_TILT.on);
  if (!BOARD_TILT.on) {
    hostSet({ boardBg: undefined, cloudShade: false, ambience: null });
    return;
  }
  hostSet({ boardBg: bgFill() });
  if (SCENARIOS[battle.sc].bio === 'arene') {
    const t = { roche: 'stone', tour: 'rune', ligue: 'marble' }[placeLabel()];
    if (OK.has(t)) {
      BOARD_LAYERS.txId = 'tx-' + t;
    } // renderBoard applies this pattern to each cell
  }
  // painted textures inside the existing patterns (renderBoard already picks them per cell)
  TEX.forEach(t => bdClass('has-' + t, OK.has(t)));
  const paintedTextures = TEX.filter(t => OK.has(t)); // patterns replaced by the image (React <defs> layer)
  // earth slab: each cell sits on a darker pedestal, visible on the player's side
  const lip = [];
  for (const k in battle.tiles) {
    const [x, y] = cellCenter(k),
      s = tiltS(x, y);
    lip.push(cellPoints(x, y + LIP * s, BOARD_GEOMETRY.S - 1));
  }
  // the opaque texture covers the cell: its states (mud, lava, fog…) go over the texture
  const copyText = k => {
    const c = STATES.filter(e => BOARD_LAYERS.t[k].classList.contains(e)).join(' '),
      v = c ? 'cell-texture ' + c : 'cell-texture';
    if (BOARD_LAYERS.tx[k].getAttribute('class') !== v) {
      BOARD_LAYERS.tx[k].setAttribute('class', v);
    }
  };
  for (const k in BOARD_LAYERS.t) {
    copyText(k);
  }
  if (window.MutationObserver) {
    if (BOARD_LAYERS.mutationObserver) {
      BOARD_LAYERS.mutationObserver.disconnect();
    }
    BOARD_LAYERS.mutationObserver = new MutationObserver(ms =>
      ms.forEach(m => m.target.dataset.k && BOARD_LAYERS.tx[m.target.dataset.k] && copyText(m.target.dataset.k))
    );
    BOARD_LAYERS.mutationObserver.observe(BOARD_LAYERS.tiles, {
      subtree: true,
      attributes: true,
      attributeFilter: ['class'],
    });
  }
  // A–H / 1–6 landmarks re-aligned to the edge of the tilted board
  const ax = [],
    lab = (txt, x, y) => ax.push([txt, x.toFixed(1), y.toFixed(1)]);
  for (let r = 0; r < BOARD_ROWS; r++) {
    // in portrait, rows are read at the far end of the board (above the last column)
    const [x, y] = cellCenter(cellKey(isVerticalBoard ? BOARD_COLS - 1 : 0, r)),
      s = tiltS(x, y);
    if (isVerticalBoard) {
      lab(r + 1, x, y - BOARD_GEOMETRY.S * s - 3);
    } else {
      lab(r + 1, x - BOARD_GEOMETRY.S * s - 5, y + 2.5);
    }
  }
  for (let c = 0; c < BOARD_COLS; c++) {
    const [x, y] = cellCenter(cellKey(c, 0)),
      s = tiltS(x, y);
    if (isVerticalBoard) {
      lab('ABCDEFGH'[c], x - BOARD_GEOMETRY.S * s - 5, y + 2.5);
    } else {
      lab('ABCDEFGH'[c], x, y - BOARD_GEOMETRY.S * s - 3);
    }
  }
  // overall light: haze toward the horizon, moon tint at night (fixed layers, nothing moves)
  // #lipClip clip: pedestals and cells; everything is drawn by the board's React layers
  const H = boardViewBox()[1],
    isNight = hourOf(battle) === 'nuit',
    backgroundY = cellCenter(isVerticalBoard ? cellKey(BOARD_COLS - 1, 0) : cellKey(0, 0))[1] - BOARD_GEOMETRY.S;
  boardSet(
    {
      paintedTextures,
      lip,
      ax,
      hz: [backgroundY.toFixed(1), (backgroundY + (H - backgroundY) * 0.55).toFixed(1)],
      night: isNight,
    },
    'defs',
    'tilt'
  );
  BOARD_LAYERS.hourOfDay = hourOf(battle);
  cloudList();
  ambiance();
  water();
};

// new battle: the camera settles on the board while the transition screen fades out
let lastFight;

let endEntry;

/* ---------- animations: jump while moving, dust on landing ---------- */
const tempo = () => (PREFERENCES.fast || ui.skipSpeedup ? 0.6 : 1);

// same rule as --animScale (quick battle)
const skip = (T, x, y, s) => {
  if (!animEnabled()) {
    return;
  }
  const ms = 850 * tempo();
  replayAnimation(T, 'hop', ms);
  if (!effectsEnabled() || !fxPrep()) {
    return;
  }
  const px = EFFECTS_CANVAS.ox + x * EFFECTS_CANVAS.s,
    py = EFFECTS_CANVAS.oy + (y + 9 * s) * EFFECTS_CANVAS.s,
    R = 15 * s * EFFECTS_CANVAS.s;
  fxAdd(
    420,
    (c, p) => {
      const e = 1 - Math.pow(1 - p, 3);
      c.globalAlpha = 0.45 * (1 - p);
      c.fillStyle = '#e9dcc0';
      for (let i = 0; i < 7; i++) {
        const a = (Math.PI * 2 * i) / 7 + 0.4;
        c.beginPath();
        c.ellipse(
          px + Math.cos(a) * R * (0.6 + e * 0.7),
          py + Math.sin(a) * R * 0.45 * (0.6 + e * 0.7),
          R * 0.22 * (1 - p * 0.5),
          R * 0.12 * (1 - p * 0.5),
          0,
          0,
          Math.PI * 2
        );
        c.fill();
      }
    },
    ms * 0.82
  );
};

/* shockwave lying on the ground under the hit Pokémon, stronger dust on a KO */
const footPos = u => {
  const [x, y] = cellCenter(unitKey(u)),
    s = Math.max(0.6, Math.min(1.4, tiltS(x, y)));
  return [
    EFFECTS_CANVAS.ox + x * EFFECTS_CANVAS.s,
    EFFECTS_CANVAS.oy + (y + 9 * s) * EFFECTS_CANVAS.s,
    s * EFFECTS_CANVAS.s,
  ];
};

const ripple = (u, col) => {
  if (!BOARD_TILT.on || !animEnabled() || !effectsEnabled() || !fxPrep()) {
    return;
  }
  const [px, py, k] = footPos(u);
  fxAdd(520, (c, p) => {
    const e = 1 - Math.pow(1 - p, 3),
      r = k * (10 + 22 * e);
    c.globalAlpha = 0.75 * (1 - p);
    c.strokeStyle = col;
    c.lineWidth = k * 2.4 * (1 - p) + 0.5;
    c.beginPath();
    c.ellipse(px, py, r, r * 0.45, 0, 0, Math.PI * 2);
    c.stroke();
    c.globalAlpha = 0.25 * (1 - p);
    c.fillStyle = col;
    c.beginPath();
    c.ellipse(px, py, r * 0.7, r * 0.3, 0, 0, Math.PI * 2);
    c.fill();
  });
};

const fall = u => {
  if (!BOARD_TILT.on || !animEnabled() || !effectsEnabled() || !fxPrep()) {
    return;
  }
  const [px, py, k] = footPos(u),
    bits = Array.from({ length: 14 }, (_, i) => [
      (Math.PI * 2 * i) / 14 + Math.random() * 0.4,
      0.6 + Math.random() * 0.6,
    ]);
  fxAdd(
    700,
    (c, p) => {
      const e = 1 - Math.pow(1 - p, 2.4);
      c.fillStyle = '#d9c9a6';
      bits.forEach(([a, v]) => {
        const d = k * 26 * v * e;
        c.globalAlpha = 0.5 * (1 - p);
        c.beginPath();
        c.ellipse(
          px + Math.cos(a) * d,
          py + Math.sin(a) * d * 0.45 - k * 6 * Math.sin(p * Math.PI) * v,
          k * 4 * (1 - p * 0.6),
          k * 2.4 * (1 - p * 0.6),
          0,
          0,
          Math.PI * 2
        );
        c.fill();
      });
    },
    250
  );
};

/* cloud shadows drifting across the board by day (separate layer: only the graphics card works) */
// .cloudShade: rendered by React (Board.jsx)
const cloudList = () => {
  const on = !(!BOARD_TILT.on || reducedMotion || hourOf(battle) === 'nuit');
  if (getHost().cloudShade !== on) {
    hostSet({ cloudShade: on });
  }
};

/* life in the air: pollen or dust by day, fireflies at night (transform and opacity only) */
const AMB = {
  jour: { gue: '#fff1b8', roche: '#f2d7a6', tour: '#e2c8ff', ligue: '#ffe28a' },
  nuit: { gue: '#d8ff7a', roche: '#ffc27a', tour: '#c79bff', ligue: '#cfe0ff' },
};

// .ambience: rendered by React (Board.jsx), recreated when the time or place changes (key)
const ambiance = () => {
  const n = getHost().ambience;
  const h = hourOf(battle),
    l = placeLabel(),
    key = h + '-' + l;
  if (!BOARD_TILT.on || !animEnabled()) {
    if (n) {
      hostSet({ ambience: null });
    }
    return;
  }
  if (n && n.k === key) {
    return;
  }
  const N = h === 'nuit' ? 12 : 16;
  const items = [];
  for (let i = 0; i < N; i++) {
    const r = k => (((Math.sin(i * 127.1 + k * 311.7) * 43758.5453) % 1) + 1) % 1;
    items.push({
      left: (4 + r(1) * 92).toFixed(1) + '%',
      top: (14 + r(2) * 76).toFixed(1) + '%',
      '--dx': ((r(3) - 0.5) * 70).toFixed(0) + 'px',
      '--dy': (-18 - r(4) * 40).toFixed(0) + 'px',
      '--s': (0.6 + r(5) * 0.9).toFixed(2),
      animationDuration: (7 + r(6) * 8).toFixed(1) + 's',
      animationDelay: '-' + (r(7) * 15).toFixed(1) + 's',
    });
  }
  hostSet({
    ambience: { k: key, h, c: (AMB[h] || AMB.jour)[l] || AMB[h === 'nuit' ? 'nuit' : 'jour'].gue, items },
  });
};

/* water reflection: a band of light slides over the water cells, sparkles glint;
     follows the tide of the Water Gym (resynchronized on every board render) */
// .lake layer, #lakeG gradient and #lakeC clip: drawn by React (« eau » (water) state);
// color (moon or sun) and animation fixed at creation, recreated when the time changes (fresh)
const water = freshNode => {
  if (!BOARD_TILT.on || !BOARD_LAYERS.tiles || !battle) {
    return;
  }
  const E = getBoard().eau,
    keys = Object.keys(battle.tiles).filter(k => battle.tiles[k].w && !battle.tiles[k].rock),
    id = keys.join(',');
  if (E && !freshNode) {
    if (E.id !== id) {
      boardSet({ eau: { ...E, id, keyList: keys } }, 'defs', 'eau');
    }
    return;
  }
  boardSet({ eau: { id, keyList: keys, nuit: hourOf(battle) === 'nuit', fixed: !animEnabled() } }, 'defs', 'eau');
};

/* background Pokémon pass behind the ones in front */
// token order: L.uo, rendered by Units.jsx (sorted tokens go to the end, like appendChild)
function sort() {
  if (!BOARD_TILT.on || !BOARD_LAYERS.units || !BOARD_LAYERS.uo) {
    return;
  }
  const y = id => BOARD_LAYERS.u[id] && BOARD_LAYERS.u[id].sortY,
    toks = BOARD_LAYERS.uo.filter(id => y(id) != null),
    tri = toks.slice().sort((a, b) => y(a) - y(b));
  if (tri.every((n, i) => n === toks[i])) {
    return;
  }
  BOARD_LAYERS.uo = BOARD_LAYERS.uo.filter(id => y(id) == null).concat(tri);
  unitsDirty();
}

/* names above all Pokémon: a large Pokémon in front no longer hides the name of the one behind */
const topName = T => {
  // .namesHigh layer (React): the name goes into its .nameWrap wrapper, which follows the classes and
  // the token's position (NamesHigh, Units.jsx); nmO: draw order
  if (!BOARD_LAYERS.fl || !BOARD_LAYERS.nameTags || !BOARD_LAYERS.nameTags.isConnected) {
    return;
  }
  if (!T.nmO) {
    T.nmO = topName.n = (topName.n || 0) + 1;
    unitsDirty();
  }
};

/* larger illustration, feet resting on the ring on the ground (attributes: the transform is already used for the mirror and the bounce) */
const GEO = { plat: ['-17', '-22', '34'], debout: ['-23', '-35', '46'] };

const active = () => !!(battle && !battle.over && battle.phase === 'player' && !battle.deployPhase && !ui.cutscene);

// riddle: « Fin du tour » (End turn) stays visible, it is the button to give up
const guide = () => active() && !ui.busy && battle.sc !== 'enigme431';

/** The Pokémon the active player is currently commanding. */
function toPlay(S) {
  if (S.order === 'vitesse') {
    const c = currentActor(S);
    return c && c.side === 'a' ? [c] : [];
  }
  return S.units.filter(u => u.side === 'a' && !u.ko && (!S.coop || coopPlayer(u) === S.coop));
}

const hitAndRun = u => !!(u.hr && !u.moved);

const retrigger = S => S.voice >= 2 && !S.retrigger;

/** deplacer | agir | extra | fini */
function step(S, u) {
  if (!u || u.ko || u.sn || u.finishedRound === S.round) {
    return 'fini';
  }
  if (!u.acted) {
    return u.moved || u.restartedRound === S.round ? 'agir' : 'deplacer';
  }
  return hitAndRun(u) || retrigger(S) ? 'extra' : 'fini';
}

const remaining = S => toPlay(S).filter(u => step(S, u) !== 'fini');

/* ---------- on to the next: when the tracked Pokémon is done, move to the next one ---------- */
function followMover() {
  if (!active() || ui.busy) {
    ui.turnGuide = null;
    return;
  }
  if (ui.selE || ui.mode) {
    return;
  }
  const u = ui.sel && byUid(battle, ui.sel),
    rest = remaining(battle);
  if (!rest.length) {
    return;
  }
  if (!u || u.ko || (step(battle, u) === 'fini' && ui.turnGuide === u.uid)) {
    const order = toPlay(battle),
      i = u ? order.indexOf(u) : -1;
    const nx = rest.find(x => order.indexOf(x) > i) || rest[0];
    ui.sel = nx.uid;
    clearAim();
  }
  const s = ui.sel && byUid(battle, ui.sel);
  if (s && step(battle, s) !== 'fini') {
    ui.turnGuide = s.uid;
  }
}

/* ---------- automatic end of round ---------- */
let autoEndTimer;

const flowKey = () =>
  battle
    ? [
        battle.round,
        battle.coop || 0,
        battle.duel433 ? battle.duel433.j : 0,
        battle.order === 'vitesse' ? (currentActor(battle) || {}).uid : '',
      ].join(':')
    : '';

const isFlowReady = () =>
  active() &&
  !ui.busy &&
  !ui.mode &&
  !remaining(battle).length &&
  $('#evoPick').hidden &&
  (battle.order !== 'vitesse' || (currentActor(battle) || {}).side === 'a');

function scheduleAutoEnd() {
  if (autoEndTimer || !isFlowReady()) {
    return;
  }
  const S = battle,
    k = flowKey();
  autoEndTimer = setTimeout(
    () => {
      autoEndTimer = 0;
      if (battle !== S || flowKey() !== k || !isFlowReady()) {
        return;
      }
      if (!battle.coop && !battle.duel433 && battle.order !== 'vitesse' && battle.sc !== 'enigme431') {
        toast('Manche terminée : au tour des adversaires.');
      }
      // via the button: modes that intercept it (riddle…) keep their own rule. Click without
      // bubbling: otherwise the document's « Passer » (Skip) listener would immediately speed up the opponent's turn.
      $('#bEnd').dispatchEvent(new MouseEvent('click', { bubbles: false, cancelable: true }));
    },
    battleDelay(250, 500, 900)
  );
}

/* ---------- bottom bar: no more « Fin du tour » during your phase ---------- */
// the bar (hidden button, the Pokémon's step on phone, phase) is computed by Foot.jsx
const refreshFootPos = () => refreshBattle('foot');

// Startup statements, run in their original order (see index.js).
export function init() {
  artOk = false;
  load(
    'grass',
    () => {
      artOk = true;
      document.body.classList.remove('no-no-art');
      TEX.slice(1).forEach(t => load(t, rebuildAll)); // no effect outside battle
      rebuildAll();
    },
    () => document.body.classList.add('no-no-art')
  );
  HOOKS.beforeBoard.push(() => {
    try {
      tune();
    } catch (e) {
      BOARD_TILT.on = false;
    }
  });
  lastFight = null;
  endEntry = 0;
  HOOKS.boardBuilt.push(() => {
    if (battle !== lastFight) {
      lastFight = battle;
      if (BOARD_TILT.on && animEnabled()) {
        bdReplay('entrance-fx');
        bdClass('entrance-fx', true);
        clearTimeout(endEntry);
        endEntry = setTimeout(() => bdClass('entrance-fx', false), 1800);
      }
    }
  });
  HOOKS.boardBuilt.push(dress);
  HOOKS.hit.push(uid => {
    const u = byUid(battle, uid);
    if (u) {
      ripple(u, u.side === 'e' ? '#ff6a5a' : '#7cc0ff');
    }
  });
  HOOKS.boardRendered.push(() => {
    if (BOARD_TILT.on && BOARD_LAYERS.hourOfDay && BOARD_LAYERS.hourOfDay !== hourOf(battle)) {
      changeTime();
    }
    water();
  });
  /* ---------- tokens: standing, smaller toward the back ---------- */
  HOOKS.token.push(u => {
    const T = BOARD_TILT.on && BOARD_LAYERS.u[u.uid];
    if (T) {
      const k = unitKey(u),
        [x, y] = cellCenter(k),
        s = Math.max(0.6, Math.min(1.4, tiltS(x, y)));
      T.tr = `translate(${x}px,${y}px) scale(${s.toFixed(3)})`; // token: Units.jsx (sliding: CSS transition)
      unitsDirty();
      if (T.lastKind && T.lastKind !== k && !u.ko) {
        skip(T, x, y, s);
      }
      T.lastKind = k;
      if (u.ko && T.koSeen === false) {
        fall(u);
      }
      T.koSeen = !!u.ko;
      T.sortY = y;
      clearTimeout(sort.t);
      sort.t = setTimeout(sort, 950 * tempo()); // after the slide: re-inserting cuts the transition
    }
  });
  HOOKS.token.push(u => {
    const T = BOARD_TILT.on && BOARD_LAYERS.u[u.uid];
    if (T) {
      topName(T);
    }
  });
  HOOKS.illustration.push(u => {
    const T = BOARD_LAYERS.u && BOARD_LAYERS.u[u.uid];
    // token template, rendered by Units.jsx
    if (T && T.imOn && !T.artGrouped && T.b) {
      // only the illustration breathes and jumps (.token-stand group): the ring stays on the ground
      T.artGrouped = true;
      unitsDirty();
    }
    if (T && T.imOn) {
      const g = GEO[BOARD_TILT.on ? 'debout' : 'plat'];
      if (T.geo[1] !== g[1]) {
        T.geo = g;
        unitsDirty();
      }
    }
  });
  /* ---------- Settings › Pokémon Skin: Rich / Light graphics ---------- */
  // « Graphismes » (Graphics) button of « Habillage Pokémon » (Pokémon Skin): rendered by React (src/screens/settings/panels/PokemonSkin.jsx)
  document.addEventListener('click', e => {
    if (!(e.target.closest && e.target.closest('[data-gfx-toggle]'))) {
      return;
    }
    PREFERENCES.graphicsMode = PREFERENCES.graphicsMode === 'leger' ? 'riche' : 'leger';
    savePref();
    renderParams();
    rebuildAll();
  });
  window.__paintedGfx = { TILT: BOARD_TILT, OK, riche: richText, rebuild: rebuildAll };
  /* ==== v4.78: guided turn flow ====
   Each Pokémon follows Move → Act → End. Each step is skipped with an
   explicit tap (« Rester ici » (Stay here), « Passer l'action » (Skip action), « Terminer » (Finish)); the round ends
   by itself once everyone is done: no more « Fin du tour » (End turn) to press during your phase.
   u.restartedRound / u.finishedRound: round number in which the Pokémon stayed in place / finished. */
  // panel (current step and skip button) and bottom bar: rendered by React (Panel.jsx, Foot.jsx)
  turnFlow = { active, guide, toPlay, repli: hitAndRun, retrigger, stepOf: step, remaining };
  /* ---------- « Rester ici », « Passer l'action », « Terminer » buttons ---------- */
  $('#bPanel').addEventListener('click', e => {
    const b = e.target.closest('[data-vx="stay-put"],[data-vx="skip-action"],[data-vx="finished-round"]');
    if (!b || !battle || ui.busy || battle.over) {
      return;
    }
    const u = ui.sel && byUid(battle, ui.sel);
    if (!u || u.ko) {
      return;
    }
    if (b.dataset.vx === 'stay-put') {
      u.restartedRound = battle.round;
    } else {
      u.finishedRound = battle.round;
      ui.undo = null; // the choice is made: no going back on the move
    }
    clearAim();
    ui.tile = null;
    sfx('ui');
    renderAll();
  });
  /* ---------- after an attack: stay on the Pokémon if it has a bonus left ---------- */
  HOOKS.action.push(id => {
    const u = battle && byUid(battle, id);
    if (u && active() && !ui.busy && battle.order !== 'vitesse' && step(battle, u) === 'extra' && ui.sel !== id) {
      ui.sel = id;
      renderAll();
    }
  });
  autoEndTimer = 0;
  /* ---------- keyboard: Space (or E) skips the step instead of ending the turn ---------- */
  window.addEventListener(
    'keydown',
    e => {
      if ((e.key !== ' ' && e.key !== 'e' && e.key !== 'E') || !battle || !guide()) {
        return;
      }
      const cb = document.getElementById('cbBattle'),
        tg = e.target;
      if (
        !cb ||
        cb.hidden ||
        (tg && /^(BUTTON|INPUT|TEXTAREA|SELECT)$/.test(tg.tagName)) ||
        (tg && tg.isContentEditable)
      ) {
        return;
      }
      e.preventDefault();
      e.stopImmediatePropagation();
      const b = document.querySelector('#bPanel .turn-guide [data-vx]');
      if (b) {
        b.click();
      }
    },
    true
  );
  HOOKS.beforeRender.push(() => {
    if (battle) {
      followMover();
    }
  });
  HOOKS.rendered.push(() => {
    if (battle) {
      refreshFootPos();
      scheduleAutoEnd();
    }
  });
  /* ---------- tutorial and guide texts ---------- */
  try {
    TUTORIAL_STEPS.forEach(s => {
      if (s.sel !== '#bEnd') {
        return;
      }
      s.t = 'Fin de manche';
      s.d =
        'Chaque Pokémon se déplace (ou « Rester ici »), puis agit (ou « Passer l’action »). Quand tous ont joué, la manche se termine seule : les adversaires se déplacent, puis attaquent.';
      s.sel = '#bPanel';
    });
    const t0 = TUTORIAL_LIST.find(x => x.k === 'tour');
    if (t0) {
      t0.d = t0.d.replace(
        'Quand tout le monde a joué, « Fin du tour » : les adversaires agissent à leur tour.',
        'Le panneau vous guide : chaque Pokémon se déplace (ou « Rester ici »), puis agit (ou « Passer l’action »). Quand tout le monde a joué, la manche se termine seule et les adversaires agissent.'
      );
    }
    NEWS_ENTRIES.unshift([
      'i-play',
      'Tour guidé',
      'En combat, le panneau vous guide pour chaque Pokémon : déplacer, agir, terminer. La manche se termine seule quand tout le monde a joué.',
      null,
    ]);
    NEWS_ENTRIES.splice(8);
  } catch {
    /* Best effort: failure here is non-fatal. */
  }
  window.__turnFlowDebug = { stepOf: step, remaining, toPlay, jeu: () => ({ B: battle, ui }) };
}
