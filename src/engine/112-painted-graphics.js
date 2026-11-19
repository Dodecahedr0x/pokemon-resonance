/* Original section: v4.77: painted graphics (backgrounds and textures from the img/ folder, tilted board in perspective) */

import { SCEN } from './009-pokemon.js';
import { $, RM, toast } from './014-utils.js';
import { HOOKS } from './015-hooks.js';
import { BH, BW, K, byUid, uk } from './021-combat-engine.js';
import { B, BG, HC, HC0, HP, L, MQV, TILT, VB, VERT, __set_GREEN, buildBoard, clearAim, renderAll, tiltP, tiltS, ui } from './024-combat-ui.js';
import { PREF, TUTORIAL_STEPS, savePref, sfx } from './026-campaign-tutorial-sound.js';
import { FXS, fxAdd, fxOn, fxPrep } from './028-move-effects.js';
import { renderParams } from './040-settings.js';
import { currentActor } from './044-tactical-engine.js';
import { hourOf } from './046-living-board.js';
import { NEWS416 } from './056-polish-v4-16.js';
import { player418 } from './058-fishing-safari-coop.js';
import { dl428 } from './063-combat-catches-home.js';
import { anim429, replay429 } from './064-quality.js';
import { TUTORIAL_STEPS433 } from './068-duel-tutorial.js';
import { refreshBattle } from '../screens/combat/battle/battleStore.js';
import { bdClass, bdReplay, boardSet, getBoard, getHost, hostSet, unitsDirty } from '../screens/combat/board/boardStore.js';

// Guided turn flow (v4.78): steps read by the panel and the bottom bar (src/screens/combat/battle).
export let flow478;

// Startup statements, run in their original order (see index.js).
export function __init() {

(() => {
  /* Images come from the img/ folder placed next to the file, like audio/.
     Without that folder, or in « Léger » (Light) mode, nothing changes: flat board from v4.76. */
  const TEX = ['grass', 'stone', 'water', 'sand', 'ash', 'marble', 'rune', 'mud', 'lava'];
  const STATES = ['wet', 'mud', 'lava', 'dep430z', 'fog431t']; // cell states drawn on the cell: copied onto its texture
  const OK = new Set();
  let artOk = false;
  const richText = () => artOk && PREF.gfx477 !== 'leger';
  const inBattle = () => B && L.tiles && !$('#cbBattle').hidden;
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
      if (ok) ok();
    };
    if (ko) im.onerror = ko;
    im.src = 'img/tex-' + t + '.webp';
  };
  load(
    'grass',
    () => {
      artOk = true;
      document.body.classList.remove('no-art477');
      TEX.slice(1).forEach(t => load(t, rebuildAll)); // no effect outside battle
      rebuildAll();
    },
    () => document.body.classList.add('no-art477')
  );

  /* ---------- perspective: set on every board build ---------- */
  const LIP = 7; // thickness of the earth slab under the cells (viewBox units, at the front row)
  const tune = () => {
    TILT.on = false;
    if (!richText() || !B) return;
    __set_GREEN(!!(MQV && MQV.matches));
    const [W, H] = VB(),
      S = BG.S,
      a = ((VERT ? 30 : 40) * Math.PI) / 180,
      pts = [];
    for (const k in B.tiles) {
      const [x, y] = HC0(k);
      for (let i = 0; i < 6; i++) pts.push([x + S * Math.cos((Math.PI / 3) * i), y + S * Math.sin((Math.PI / 3) * i)]);
    }
    Object.assign(TILT, { f: VERT ? 950 : 780, sn: Math.sin(a), cs: Math.cos(a), Hb: Math.max(...pts.map(p => p[1])), cx: W / 2, k: 1, ox: 0, oy: 0 });
    const pr = pts.map(p => tiltP(p[0], p[1])),
      xs = pr.map(p => p[0]),
      ys = pr.map(p => p[1]),
      x0 = Math.min(...xs),
      x1 = Math.max(...xs),
      y0 = Math.min(...ys),
      y1 = Math.max(...ys),
      m = 12, // side margin: A–H landmarks
      bottomEdge = 26, // below the front row: pedestal + Pokémon names
      sky = H * (VERT ? 0.1 : 0.14); // strip of backdrop left visible above the board
    const k = Math.min((W - 2 * m) / (x1 - x0), (H - sky - bottomEdge) / (y1 - y0));
    TILT.k = k;
    TILT.ox = (W - (x1 - x0) * k) / 2 - x0 * k;
    TILT.oy = H - bottomEdge - y1 * k;
    TILT.on = true;
  };

  /* ---------- dressing of the built board ---------- */
  // gyms: the backdrop follows the champion's type (canyon for Rock, mystic tower for Ghost…), stadium otherwise
  const AT = { Roche: 'roche', Sol: 'roche', Combat: 'roche', Acier: 'roche', Spectre: 'tour', Dragon: 'tour', Psy: 'tour', Poison: 'tour', Ténèbres: 'tour' };
  const placeLabel = () => {
    const D = SCEN[B.sc];
    return D.bio === 'arene' ? AT[D.at] || 'ligue' : D.bio;
  };
  const bgFill = () => {
    const bio = placeLabel(),
      h = hourOf(B);
    // Full URLs: in a CSS variable, a relative url() resolves against the
    // stylesheet that reads the variable (assets/ once the game is built), not against the page.
    const img = f => `url(${new URL('img/' + f, document.baseURI).href})`;
    return [`bg-${bio}-${h}.webp`, `bg-${bio}-jour.webp`, `bg-gue-${h}.webp`].map(img).join(',');
  };
  // horizon haze and moon tint: set here so the time of day can change mid-battle
  // (React layers: .lum477.n and the #hz477 stops follow the « night » state)
  const tint = isNight => boardSet({ night: isNight }, 'defs', 'tilt');
  // night falls (or day breaks) during the battle: the painted backdrop cross-fades, the light follows
  const changeTime = () => {
    const bd = $('#bBoard'),
      h = hourOf(B);
    L.h477 = h;
    const previous = getComputedStyle(bd).backgroundImage;
    hostSet({ bg477: bgFill() });
    // .fondu477 (old backdrop fading out): rendered by React (Board.jsx)
    if (anim429() && previous && previous !== 'none') {
      const n = ((getHost().fade || {}).n || 0) + 1,
        fd = { n, bg: previous, va: false };
      hostSet({ fade: fd });
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          if (getHost().fade === fd) hostSet({ fade: { ...fd, va: true } });
        })
      );
      setTimeout(() => {
        const f = getHost().fade;
        if (f && f.n === n) hostSet({ fade: null });
      }, 2200);
    }
    tint(h === 'nuit');
    cloudList();
    ambiance();
    water(true); // recolored highlights (moon or sun)
  };
  const dress = () => {
    // classes, --bg477, clouds and dust of #bBoard: rendered by React (« host » state of boardStore.js)
    bdClass('tilt477', TILT.on);
    if (!TILT.on) {
      hostSet({ bg477: undefined, cs477: false, amb477: null });
      return;
    }
    hostSet({ bg477: bgFill() });
    if (SCEN[B.sc].bio === 'arene') {
      const t = { roche: 'stone', tour: 'rune', ligue: 'marble' }[placeLabel()];
      if (OK.has(t)) L.txId = 'tx-' + t; // renderBoard applies this pattern to each cell
    }
    // painted textures inside the existing patterns (renderBoard already picks them per cell)
    TEX.forEach(t => bdClass('has-' + t + '477', OK.has(t)));
    const tex477 = TEX.filter(t => OK.has(t)); // patterns replaced by the image (React <defs> layer)
    // earth slab: each cell sits on a darker pedestal, visible on the player's side
    const lip = [];
    for (const k in B.tiles) {
      const [x, y] = HC(k),
        s = tiltS(x, y);
      lip.push(HP(x, y + LIP * s, BG.S - 1));
    }
    // the opaque texture covers the cell: its states (mud, lava, fog…) go over the texture
    const copyText = k => {
      const c = STATES.filter(e => L.t[k].classList.contains(e)).join(' '),
        v = c ? 'tx ' + c : 'tx';
      if (L.tx[k].getAttribute('class') !== v) L.tx[k].setAttribute('class', v);
    };
    for (const k in L.t) copyText(k);
    if (window.MutationObserver) {
      if (L.mo477) L.mo477.disconnect();
      L.mo477 = new MutationObserver(ms => ms.forEach(m => m.target.dataset.k && L.tx[m.target.dataset.k] && copyText(m.target.dataset.k)));
      L.mo477.observe(L.tiles, { subtree: true, attributes: true, attributeFilter: ['class'] });
    }
    // A–H / 1–6 landmarks re-aligned to the edge of the tilted board
    const ax = [],
      lab = (txt, x, y) => ax.push([txt, x.toFixed(1), y.toFixed(1)]);
    for (let r = 0; r < BH; r++) {
      // in portrait, rows are read at the far end of the board (above the last column)
      const [x, y] = HC(K(VERT ? BW - 1 : 0, r)),
        s = tiltS(x, y);
      if (VERT) lab(r + 1, x, y - BG.S * s - 3);
      else lab(r + 1, x - BG.S * s - 5, y + 2.5);
    }
    for (let c = 0; c < BW; c++) {
      const [x, y] = HC(K(c, 0)),
        s = tiltS(x, y);
      if (VERT) lab('ABCDEFGH'[c], x - BG.S * s - 5, y + 2.5);
      else lab('ABCDEFGH'[c], x, y - BG.S * s - 3);
    }
    // overall light: haze toward the horizon, moon tint at night (fixed layers, nothing moves)
    // #cp477 clip: pedestals and cells; everything is drawn by the board's React layers
    const H = VB()[1],
      isNight = hourOf(B) === 'nuit',
      backgroundY = HC(VERT ? K(BW - 1, 0) : K(0, 0))[1] - BG.S;
    boardSet({ tex477, lip, ax, hz: [backgroundY.toFixed(1), (backgroundY + (H - backgroundY) * 0.55).toFixed(1)], night: isNight }, 'defs', 'tilt');
    L.h477 = hourOf(B);
    cloudList();
    ambiance();
    water();
  };
  HOOKS.beforeBoard.push(() => {
    try {
      tune();
    } catch (e) {
      TILT.on = false;
    }
  });
  // new battle: the camera settles on the board while the transition screen fades out
  let lastFight = null,
    endEntry = 0;
  HOOKS.plateau.push(() => {
    if (B !== lastFight) {
      lastFight = B;
      if (TILT.on && anim429()) {
        bdReplay('entree477');
        bdClass('entree477', true);
        clearTimeout(endEntry);
        endEntry = setTimeout(() => bdClass('entree477', false), 1800);
      }
    }
  });
  HOOKS.plateau.push(dress);

  /* ---------- animations: jump while moving, dust on landing ---------- */
  const tempo = () => (PREF.fast || ui.turbo428 ? 0.6 : 1); // same rule as --tk429 (quick battle)
  const skip = (T, x, y, s) => {
    if (!anim429()) return;
    const ms = 850 * tempo();
    replay429(T, 'hop477', ms);
    if (!fxOn() || !fxPrep()) return;
    const px = FXS.ox + x * FXS.s,
      py = FXS.oy + (y + 9 * s) * FXS.s,
      R = 15 * s * FXS.s;
    fxAdd(
      420,
      (c, p) => {
        const e = 1 - Math.pow(1 - p, 3);
        c.globalAlpha = 0.45 * (1 - p);
        c.fillStyle = '#e9dcc0';
        for (let i = 0; i < 7; i++) {
          const a = (Math.PI * 2 * i) / 7 + 0.4;
          c.beginPath();
          c.ellipse(px + Math.cos(a) * R * (0.6 + e * 0.7), py + Math.sin(a) * R * 0.45 * (0.6 + e * 0.7), R * 0.22 * (1 - p * 0.5), R * 0.12 * (1 - p * 0.5), 0, 0, Math.PI * 2);
          c.fill();
        }
      },
      ms * 0.82
    );
  };
  /* shockwave lying on the ground under the hit Pokémon, stronger dust on a KO */
  const footPos = u => {
    const [x, y] = HC(uk(u)),
      s = Math.max(0.6, Math.min(1.4, tiltS(x, y)));
    return [FXS.ox + x * FXS.s, FXS.oy + (y + 9 * s) * FXS.s, s * FXS.s];
  };
  const ripple = (u, col) => {
    if (!TILT.on || !anim429() || !fxOn() || !fxPrep()) return;
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
  HOOKS.touche.push(uid => {
    const u = byUid(B, uid);
    if (u) ripple(u, u.side === 'e' ? '#ff6a5a' : '#7cc0ff');
  });
  const fall = u => {
    if (!TILT.on || !anim429() || !fxOn() || !fxPrep()) return;
    const [px, py, k] = footPos(u),
      bits = Array.from({ length: 14 }, (_, i) => [(Math.PI * 2 * i) / 14 + Math.random() * 0.4, 0.6 + Math.random() * 0.6]);
    fxAdd(
      700,
      (c, p) => {
        const e = 1 - Math.pow(1 - p, 2.4);
        c.fillStyle = '#d9c9a6';
        bits.forEach(([a, v]) => {
          const d = k * 26 * v * e;
          c.globalAlpha = 0.5 * (1 - p);
          c.beginPath();
          c.ellipse(px + Math.cos(a) * d, py + Math.sin(a) * d * 0.45 - k * 6 * Math.sin(p * Math.PI) * v, k * 4 * (1 - p * 0.6), k * 2.4 * (1 - p * 0.6), 0, 0, Math.PI * 2);
          c.fill();
        });
      },
      250
    );
  };

  /* cloud shadows drifting across the board by day (separate layer: only the graphics card works) */
  // .cs477: rendered by React (Board.jsx)
  const cloudList = () => {
    const on = !(!TILT.on || RM || hourOf(B) === 'nuit');
    if (getHost().cs477 !== on) hostSet({ cs477: on });
  };

  /* life in the air: pollen or dust by day, fireflies at night (transform and opacity only) */
  const AMB = {
    jour: { gue: '#fff1b8', roche: '#f2d7a6', tour: '#e2c8ff', ligue: '#ffe28a' },
    nuit: { gue: '#d8ff7a', roche: '#ffc27a', tour: '#c79bff', ligue: '#cfe0ff' }
  };
  // .amb477: rendered by React (Board.jsx), recreated when the time or place changes (key)
  const ambiance = () => {
    const n = getHost().amb477;
    const h = hourOf(B),
      l = placeLabel(),
      key = h + '-' + l;
    if (!TILT.on || !anim429()) {
      if (n) hostSet({ amb477: null });
      return;
    }
    if (n && n.k === key) return;
    const N = h === 'nuit' ? 12 : 16;
    const items = [];
    for (let i = 0; i < N; i++) {
      const r = (k => ((Math.sin(i * 127.1 + k * 311.7) * 43758.5453) % 1 + 1) % 1);
      items.push({
        left: (4 + r(1) * 92).toFixed(1) + '%',
        top: (14 + r(2) * 76).toFixed(1) + '%',
        '--dx': ((r(3) - 0.5) * 70).toFixed(0) + 'px',
        '--dy': (-18 - r(4) * 40).toFixed(0) + 'px',
        '--s': (0.6 + r(5) * 0.9).toFixed(2),
        animationDuration: (7 + r(6) * 8).toFixed(1) + 's',
        animationDelay: '-' + (r(7) * 15).toFixed(1) + 's'
      });
    }
    hostSet({ amb477: { k: key, h, c: (AMB[h] || AMB.jour)[l] || AMB[h === 'nuit' ? 'nuit' : 'jour'].gue, items } });
  };

  /* water reflection: a band of light slides over the water cells, sparkles glint;
     follows the tide of the Water Gym (resynchronized on every board render) */
  // .eau477 layer, #eau477g gradient and #eau477c clip: drawn by React (« eau » (water) state);
  // color (moon or sun) and animation fixed at creation, recreated when the time changes (fresh)
  const water = freshNode => {
    if (!TILT.on || !L.tiles || !B) return;
    const E = getBoard().eau,
      keys = Object.keys(B.tiles).filter(k => B.tiles[k].w && !B.tiles[k].rock),
      id = keys.join(',');
    if (E && !freshNode) {
      if (E.id !== id) boardSet({ eau: { ...E, id, keyList: keys } }, 'defs', 'eau');
      return;
    }
    boardSet({ eau: { id, keyList: keys, nuit: hourOf(B) === 'nuit', fixed: !anim429() } }, 'defs', 'eau');
  };
  HOOKS.boardRendered.push(() => {
    if (TILT.on && L.h477 && L.h477 !== hourOf(B)) changeTime();
    water();
  });

  /* background Pokémon pass behind the ones in front */
  // token order: L.uo, rendered by Units.jsx (sorted tokens go to the end, like appendChild)
  function sort() {
    if (!TILT.on || !L.units || !L.uo) return;
    const y = id => L.u[id] && L.u[id].y477,
      toks = L.uo.filter(id => y(id) != null),
      tri = toks.slice().sort((a, b) => y(a) - y(b));
    if (tri.every((n, i) => n === toks[i])) return;
    L.uo = L.uo.filter(id => y(id) == null).concat(tri);
    unitsDirty();
  }

  /* ---------- tokens: standing, smaller toward the back ---------- */
  HOOKS.token.push(u => {
    const T = TILT.on && L.u[u.uid];
    if (T) {
      const k = uk(u),
        [x, y] = HC(k),
        s = Math.max(0.6, Math.min(1.4, tiltS(x, y)));
      T.tr = `translate(${x}px,${y}px) scale(${s.toFixed(3)})`; // token: Units.jsx (sliding: CSS transition)
      unitsDirty();
      if (T.k477 && T.k477 !== k && !u.ko) skip(T, x, y, s);
      T.k477 = k;
      if (u.ko && T.ko477 === false) fall(u);
      T.ko477 = !!u.ko;
      T.y477 = y;
      clearTimeout(sort.t);
      sort.t = setTimeout(sort, 950 * tempo()); // after the slide: re-inserting cuts the transition
    }
  });

  /* names above all Pokémon: a large Pokémon in front no longer hides the name of the one behind */
  const topName = T => {
    // .nms477 layer (React): the name goes into its .nmw477 wrapper, which follows the classes and
    // the token's position (NamesHigh, Units.jsx); nmO: draw order
    if (!L.fl || !L.nm477 || !L.nm477.isConnected) return;
    if (!T.nmO) {
      T.nmO = topName.n = (topName.n || 0) + 1;
      unitsDirty();
    }
  };
  HOOKS.token.push(u => {
    const T = TILT.on && L.u[u.uid];
    if (T) topName(T);
  });

  /* larger illustration, feet resting on the ring on the ground (attributes: the transform is already used for the mirror and the bounce) */
  const GEO = { plat: ['-17', '-22', '34'], debout: ['-23', '-35', '46'] };
  HOOKS.illustration.push(u => {
    const T = L.u && L.u[u.uid];
    // token template, rendered by Units.jsx
    if (T && T.imOn && !T.w477 && T.b) {
      // only the illustration breathes and jumps (.tok-st477 group): the ring stays on the ground
      T.w477 = true;
      unitsDirty();
    }
    if (T && T.imOn) {
      const g = GEO[TILT.on ? 'debout' : 'plat'];
      if (T.geo[1] !== g[1]) {
        T.geo = g;
        unitsDirty();
      }
    }
  });

  /* ---------- Settings › Pokémon Skin: Rich / Light graphics ---------- */
  // « Graphismes » (Graphics) button of « Habillage Pokémon » (Pokémon Skin): rendered by React (src/screens/settings/panels/PokemonSkin.jsx)
  document.addEventListener('click', e => {
    if (!(e.target.closest && e.target.closest('[data-pk477]'))) return;
    PREF.gfx477 = PREF.gfx477 === 'leger' ? 'riche' : 'leger';
    savePref();
    renderParams();
    rebuildAll();
  });
  window.__gfx477 = { TILT, OK, riche: richText, rebuild: rebuildAll };
})();


/* ==== v4.78: guided turn flow ====
   Each Pokémon follows Move → Act → End. Each step is skipped with an
   explicit tap (« Rester ici » (Stay here), « Passer l'action » (Skip action), « Terminer » (Finish)); the round ends
   by itself once everyone is done: no more « Fin du tour » (End turn) to press during your phase.
   u.rst478 / u.fin478: round number in which the Pokémon stayed in place / finished. */
(() => {
  const active = () => !!(B && !B.over && B.phase === 'player' && !B.dep430 && !ui.cutscene);
  // riddle: « Fin du tour » (End turn) stays visible, it is the button to give up
  const guide = () => active() && !ui.busy && B.sc !== 'enigme431';
  /** The Pokémon the active player is currently commanding. */
  function toPlay(S) {
    if (S.order === 'vitesse') {
      const c = currentActor(S);
      return c && c.side === 'a' ? [c] : [];
    }
    return S.units.filter(u => u.side === 'a' && !u.ko && (!S.coop || player418(u) === S.coop));
  }
  const hitAndRun = u => !!(u.hr && !u.moved);
  const retrigger = S => S.voice >= 2 && !S.retrigger;
  /** deplacer | agir | extra | fini */
  function step(S, u) {
    if (!u || u.ko || u.sn || u.fin478 === S.round) return 'fini';
    if (!u.acted) return u.moved || u.restart478 === S.round ? 'agir' : 'deplacer';
    return hitAndRun(u) || retrigger(S) ? 'extra' : 'fini';
  }
  const remaining = S => toPlay(S).filter(u => step(S, u) !== 'fini');
  // panel (current step and skip button) and bottom bar: rendered by React (Panel.jsx, Foot.jsx)
  flow478 = { active, guide, toPlay, repli: hitAndRun, retrigger, stepOf: step, remaining };

  /* ---------- « Rester ici », « Passer l'action », « Terminer » buttons ---------- */
  $('#bPanel').addEventListener('click', e => {
    const b = e.target.closest('[data-vx$="478"]');
    if (!b || !B || ui.busy || B.over) return;
    const u = ui.sel && byUid(B, ui.sel);
    if (!u || u.ko) return;
    if (b.dataset.vx === 'rester478') u.restart478 = B.round;
    else {
      u.fin478 = B.round;
      ui.undo = null; // the choice is made: no going back on the move
    }
    clearAim();
    ui.tile = null;
    sfx('ui');
    renderAll();
  });

  /* ---------- after an attack: stay on the Pokémon if it has a bonus left ---------- */
  HOOKS.action.push(id => {
    const u = B && byUid(B, id);
    if (u && active() && !ui.busy && B.order !== 'vitesse' && step(B, u) === 'extra' && ui.sel !== id) {
      ui.sel = id;
      renderAll();
    }
  });

  /* ---------- on to the next: when the tracked Pokémon is done, move to the next one ---------- */
  function following478() {
    if (!active() || ui.busy) {
      ui.fl478 = null;
      return;
    }
    if (ui.selE || ui.mode) return;
    const u = ui.sel && byUid(B, ui.sel),
      rest = remaining(B);
    if (!rest.length) return;
    if (!u || u.ko || (step(B, u) === 'fini' && ui.fl478 === u.uid)) {
      const order = toPlay(B),
        i = u ? order.indexOf(u) : -1;
      const nx = rest.find(x => order.indexOf(x) > i) || rest[0];
      ui.sel = nx.uid;
      clearAim();
    }
    const s = ui.sel && byUid(B, ui.sel);
    if (s && step(B, s) !== 'fini') ui.fl478 = s.uid;
  }

  /* ---------- automatic end of round ---------- */
  let T478 = 0;
  const key478 = () =>
    B ? [B.round, B.coop || 0, B.duel433 ? B.duel433.j : 0, B.order === 'vitesse' ? (currentActor(B) || {}).uid : ''].join(':') : '';
  const isReady478 = () =>
    active() &&
    !ui.busy &&
    !ui.mode &&
    !remaining(B).length &&
    $('#evoPick').hidden &&
    (B.order !== 'vitesse' || ((currentActor(B) || {}).side === 'a'));
  function schedule478() {
    if (T478 || !isReady478()) return;
    const S = B,
      k = key478();
    T478 = setTimeout(() => {
      T478 = 0;
      if (B !== S || key478() !== k || !isReady478()) return;
      if (!B.coop && !B.duel433 && B.order !== 'vitesse' && B.sc !== 'enigme431') toast('Manche terminée : au tour des adversaires.');
      // via the button: modes that intercept it (riddle…) keep their own rule. Click without
      // bubbling: otherwise the document's « Passer » (Skip) listener would immediately speed up the opponent's turn.
      $('#bEnd').dispatchEvent(new MouseEvent('click', { bubbles: false, cancelable: true }));
    }, dl428(250, 500, 900));
  }

  /* ---------- bottom bar: no more « Fin du tour » during your phase ---------- */
  // the bar (hidden button, the Pokémon's step on phone, phase) is computed by Foot.jsx
  const footPos478 = () => refreshBattle('foot');

  /* ---------- keyboard: Space (or E) skips the step instead of ending the turn ---------- */
  window.addEventListener(
    'keydown',
    e => {
      if ((e.key !== ' ' && e.key !== 'e' && e.key !== 'E') || !B || !guide()) return;
      const cb = document.getElementById('cbBattle'),
        tg = e.target;
      if (!cb || cb.hidden || (tg && /^(BUTTON|INPUT|TEXTAREA|SELECT)$/.test(tg.tagName)) || (tg && tg.isContentEditable)) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      const b = document.querySelector('#bPanel .fl478 [data-vx]');
      if (b) b.click();
    },
    true
  );

  HOOKS.beforeRender.push(() => {
    if (B) following478();
  });
  HOOKS.rendered.push(() => {
    if (B) {
      footPos478();
      schedule478();
    }
  });

  /* ---------- tutorial and guide texts ---------- */
  try {
    TUTORIAL_STEPS.forEach(s => {
      if (s.sel !== '#bEnd') return;
      s.t = 'Fin de manche';
      s.d = 'Chaque Pokémon se déplace (ou « Rester ici »), puis agit (ou « Passer l’action »). Quand tous ont joué, la manche se termine seule : les adversaires se déplacent, puis attaquent.';
      s.sel = '#bPanel';
    });
    const t0 = TUTORIAL_STEPS433.find(x => x.k === 'tour');
    if (t0) {
      t0.d = t0.d.replace(
        'Quand tout le monde a joué, « Fin du tour » : les adversaires agissent à leur tour.',
        'Le panneau vous guide : chaque Pokémon se déplace (ou « Rester ici »), puis agit (ou « Passer l’action »). Quand tout le monde a joué, la manche se termine seule et les adversaires agissent.'
      );
    }
    NEWS416.unshift(['i-play', 'Tour guidé', 'En combat, le panneau vous guide pour chaque Pokémon : déplacer, agir, terminer. La manche se termine seule quand tout le monde a joué.', null]);
    NEWS416.splice(8);
  } catch { /* Best effort: failure here is non-fatal. */ }

  window.__flow478 = { stepOf: step, remaining, toPlay, jeu: () => ({ B, ui }) };
})();
}
