/* Fullscreen, cell magnifier, high-contrast board (added in v4.44). */

import { ELEMENT_TYPES, MARK_REACTIONS, REACTIONS } from '../data/game-data.js';
import { MOVES } from '../data/moves.js';
import { arenaNext, veiled } from '../modes/gyms.js';
import { rxCat, toast } from '../core/utils.js';
import { HOOKS } from '../core/hooks.js';
import { P, affected, byUid, markAt, reach, targets, unitAt } from './engine.js';
import { B, STC, clearAim, hpClass, renderAll, ui } from './ui.js';
import { PREF, savePref } from '../ui/preferences.js';
import { tileTip } from './battle-panel.js';
import { renderParams } from '../ui/settings.js';
import { canSelect } from './tactical-engine.js';
import { fireHazard } from './living-board.js';
import { trapTip } from './tactics.js';
import { fitPhoneBattle } from './compact-battle.js';
import { alignBoardFrame } from './phone-board.js';
import { boardSet, getBoard, getHost, hostSet } from '../../screens/combat/board/boardStore.js';
import { tileSheet as TILE_SHEET, footCls, refreshBattle } from '../../screens/combat/battle/battleStore.js';

let INSPECTED_TILE, MAGNIFIER_ON, LONG_PRESS_AT, FULLSCREEN_SEEN;

// timestamp: ignore the « click » that follows a long press

/* ---------- 1. fullscreen ---------- */
function isFullscreen() {
  return !!(document.fullscreenElement || document.webkitFullscreenElement);
}

function setFullscreen(on, viaButton) {
  document.body.classList.toggle('fullscreen-mode', on);
  PREF.fullscreenMode = on ? 1 : 0;
  savePref();
  const el = document.documentElement;
  try {
    if (on && !isFullscreen()) {
      const r = el.requestFullscreen
        ? el.requestFullscreen({ navigationUI: 'hide' })
        : el.webkitRequestFullscreen
          ? el.webkitRequestFullscreen()
          : null;
      if (r && r.catch) {
        r.catch(() => {
          if (viaButton) {
            toast('Plein écran du navigateur refusé ici : le combat garde quand même toute la hauteur.');
          }
        });
      }
    } else if (!on && isFullscreen()) {
      const r = document.exitFullscreen
        ? document.exitFullscreen()
        : document.webkitExitFullscreen
          ? document.webkitExitFullscreen()
          : null;
      if (r && r.catch) {
        r.catch(() => {});
      }
    }
  } catch {
    /* Best effort: failure here is non-fatal. */
  }
  fitPhoneBattle();
  syncBoardTools();
  setTimeout(() => {
    fitPhoneBattle();
    alignBoardFrame();
  }, 250);
}

// #boardTools toolbar: rendered by React (src/screens/combat/board/BoardTools.jsx), inside the board
// or in the bottom bar (Foot.jsx); the bottom bar's footTools class follows the same state
function syncBoardTools() {
  const bd = document.getElementById('bBoard'),
    ft = document.querySelector('#cbBattle .battle-footer');
  if (!bd) {
    return;
  }
  // phone: in the bottom bar, under the thumb; large screen: corner of the board
  const foot = !!(document.body.classList.contains('compact-battle') && ft);
  const b = {
      foot,
      fs: document.body.classList.contains('fullscreen-mode'),
      lp: !!MAGNIFIER_ON,
      ct: !!PREF.boardContrast,
    },
    o = getHost().boardTools;
  if (!o || o.foot !== b.foot || o.fs !== b.fs || o.lp !== b.lp || o.ct !== b.ct) {
    hostSet({ boardTools: b });
  }
  const chg = ft ? footCls('has-tools', foot) : false;
  // the bottom bar follows: footTools class (move) or button contents
  if (chg || (foot && o && (o.fs !== b.fs || o.lp !== b.lp || o.ct !== b.ct))) {
    refreshBattle('foot');
  }
}

function applyContrast() {
  document.body.classList.toggle('board-contrast', !!PREF.boardContrast);
}

function tileLabel(k) {
  const [c, r] = P(k);
  return 'ABCDEFGH'[c] + (r + 1);
}

function terrainName(t) {
  const f = TERRAINS.find(x => x[0] !== 'fog' && x[0] !== 'trap' && x[0] !== 'mark' && x[3](t));
  return f ? f[1] : 'Terrain dégagé';
}

function tileDangers(k) {
  const o = [];
  try {
    if (veiled(B)) {
      if (B.units.some(e => e.side === 'e' && !e.ko && e.intent)) {
        o.push('Intentions adverses voilées : impossible de savoir qui vise cette case.');
      }
    } else {
      B.units.forEach(e => {
        if (e.side !== 'e' || e.ko || !e.intent) {
          return;
        }
        const m = MOVES[e.intent.mv];
        if (m && affected(B, e, m, e.intent.k).includes(k)) {
          o.push(`${e.n} vise cette case avec ${m.n}.`);
        }
      });
    }
    const an = arenaNext(B);
    if (an && an.tiles.includes(k)) {
      o.push(an.txt);
    }
    if (B.livingBoard && fireHazard(B, k)) {
      o.push('L’herbe peut s’embraser ici.');
    }
  } catch {
    /* Best effort: failure here is non-fatal. */
  }
  return o;
}

function tileContext(k) {
  const o = [];
  try {
    const u = ui.sel && byUid(B, ui.sel);
    if (!u || u.side !== 'a' || u.ko || B.phase !== 'player') {
      return o;
    }
    if (ui.mode === 'target') {
      const m = MOVES[u.mv[ui.mi]];
      if (m && targets(B, u, m).includes(k)) {
        o.push(`À portée de ${m.n} (${u.n}).`);
      }
    } else if (!u.moved && !u.acted) {
      const c = reach(B, u)[k];
      if (c !== undefined) {
        o.push(`${u.n} peut y aller : ${c} Mouvement${c > 1 ? 's' : ''}.`);
      }
    }
  } catch {
    /* Best effort: failure here is non-fatal. */
  }
  return o;
}

// Pokémon on the cell: data for the sheet (CellSheet.jsx)
function unitInfo(v) {
  const it =
    v.side === 'e'
      ? v.ko
        ? 'K.O.'
        : v.intent && !veiled(B) && MOVES[v.intent.mv]
          ? `Prépare ${MOVES[v.intent.mv].n}`
          : v.intent
            ? 'Intention voilée'
            : ''
      : v.ko
        ? 'K.O.'
        : v.acted
          ? 'A joué'
          : 'Prêt';
  const hp = Math.max(0, Math.round((v.hp / v.mhp) * 100));
  const canDo = !v.ko && B.phase === 'player' && !B.over && !B.deployPhase && (v.side === 'e' || canSelect(v));
  return {
    e: v.side === 'e',
    n: v.n,
    hpc: hpClass(v),
    pv: hp,
    ko: !!v.ko,
    hp: v.hp,
    mhp: v.mhp,
    t: v.t || [],
    badge: v.badge && !v.ko ? v.badge : null,
    stc: STC[v.badge] || 'other',
    it,
    canAct: canDo,
    uid: v.uid,
  };
}

// legend of this battle's terrains: [color, name, rule]
function terrainLegend() {
  const seenSet = TERRAINS.filter(x => Object.keys(B.tiles).some(k => x[3](B.tiles[k])));
  if (!seenSet.length) {
    return null;
  }
  const ruleDef = x => {
    const k = Object.keys(B.tiles).find(kk => x[3](B.tiles[kk]));
    const seg = tileTip(k).split(' · ');
    const pre = {
      pil: 'Pilier',
      rock: 'Rocher',
      w: 'Eau',
      lava: 'Lave',
      mud: 'Boue',
      grass: 'Hautes herbes',
      sand: 'Sable',
      fog: 'Br',
    }[x[0]];
    const s = pre ? seg.find(z => z.startsWith(pre)) : x[0] === 'trap' ? trapTip(B.tiles[k].trap) : null;
    return s
      ? s.replace(/^[^:]*:\s*/, '')
      : x[0] === 'mark'
        ? 'Laissée par une capacité : réagit avec les attaques d’autres types.'
        : '';
  };
  return seenSet.map(x => [x[2], x[1], ruleDef(x)]);
}

function inspectedTile() {
  if (!B || B.over) {
    return null;
  }
  if (INSPECTED_TILE != null && B.tiles[INSPECTED_TILE]) {
    return INSPECTED_TILE;
  }
  if (document.body.classList.contains('compact-battle') && ui.tile != null && B.tiles[ui.tile]) {
    return ui.tile;
  } // touched cell: its sheet was all the way at the bottom
  return null;
}

// #tileInfo sheet: rendered by React (src/screens/combat/battle/CellSheet.jsx) from this snapshot,
// taken on opening like the old innerHTML (placeSheet only moves it)
function tileSheet() {
  const cb = document.getElementById('cbBattle'),
    F = TILE_SHEET;
  const k = inspectedTile();
  if (!cb || k == null) {
    if (F.made && !F.hidden) {
      F.hidden = true;
      refreshBattle('tileInfo');
    }
    markInspectedTile(null);
    return;
  }
  const t = B.tiles[k],
    v = unitAt(B, k),
    tip = tileTip(k),
    seg = tip === 'Case libre' ? ['Rien de particulier : déplacement normal, pas de couverture.'] : tip.split(' · ');
  let rx = [];
  try {
    const mk = t.mark ? markAt(B, k) : t.w ? 'trempe' : null;
    if (mk && MARK_REACTIONS[mk]) {
      const row = MARK_REACTIONS[mk];
      rx = ELEMENT_TYPES.map((e, i) =>
        row[i] && row[i] !== 'ren' && REACTIONS[row[i]] ? [rxCat(row[i]), e + ' → ' + REACTIONS[row[i]].n] : null
      ).filter(Boolean);
    }
  } catch {
    /* Best effort: failure here is non-fatal. */
  }
  F.c = {
    sw: (TERRAINS.find(x => x[0] !== 'fog' && x[0] !== 'trap' && x[0] !== 'mark' && x[3](t)) || [0, 0, '#3a4a5a'])[2],
    displayName: tileLabel(k),
    terrain: terrainName(t),
    seg,
    rx,
    dg: tileDangers(k),
    cx: tileContext(k),
    u: v ? unitInfo(v) : null,
    leg: terrainLegend(),
    magnifier: !!MAGNIFIER_ON,
  };
  F.n = (F.n || 0) + 1;
  F.made = true;
  F.hidden = false;
  placeSheet(true);
  refreshBattle('tileInfo');
  markInspectedTile(k);
}

function placeSheet(withoutRender) {
  const F = TILE_SHEET;
  if (!F.made || F.hidden) {
    return;
  }
  const ft = document.querySelector('#cbBattle .battle-footer'),
    isFixed = ft && getComputedStyle(ft).position === 'fixed',
    bottomEdge = isFixed ? ft.getBoundingClientRect().top : innerHeight,
    k = inspectedTile(),
    hx = k != null && document.querySelector(`#bSvg [data-k="${k}"]`);
  // the sheet goes on the side opposite the cell, so as not to hide it
  let atTop = false;
  if (hx) {
    const r = hx.getBoundingClientRect(),
      cy = r.top + r.height / 2;
    atTop = cy > bottomEdge / 2;
  }
  const top = atTop ? 'calc(8px + env(safe-area-inset-top, 0px))' : 'auto',
    bottom = atTop ? 'auto' : (isFixed ? Math.max(8, innerHeight - bottomEdge + 8) : 18) + 'px';
  if (F.isTop === atTop && F.top === top && F.bottom === bottom) {
    return;
  }
  F.isTop = atTop;
  F.top = top;
  F.bottom = bottom;
  if (!withoutRender) {
    refreshBattle('tileInfo');
  }
}

// board's #inspectTile layer (React): created on first use, emptied afterwards
function markInspectedTile(k) {
  if (k == null) {
    if (getBoard().insp != null) {
      boardSet({ insp: null }, 'insp');
    }
    return;
  }
  if (getBoard().insp !== k) {
    boardSet({ insp: k }, 'insp');
  }
}

function dismissTileSheet() {
  INSPECTED_TILE = null;
  if (B) {
    ui.tile = null;
  }
  tileSheet();
  if (B) {
    renderAll();
  }
}

/* ---------- 3. cell sheet ---------- */
const TERRAINS = [
  ['pil', 'Pilier', '#5b5f6b', t => t.pil],
  ['rock', 'Rocher', '#8b8f98', t => t.rock && !t.pil],
  ['w', 'Eau', '#3b82f6', t => t.w],
  ['lava', 'Lave', '#ff6a2a', t => t.lava > 0],
  ['mud', 'Boue', '#9a6b3e', t => t.mud > 0],
  ['grass', 'Hautes herbes', '#43b05c', t => t.grass],
  ['sand', 'Sable', '#d6b26e', t => t.sand && !t.w],
  ['fog', 'Brouillard', '#a9b4c4', t => t.fog > 0],
  ['trap', 'Piège', '#e94b6a', t => t.trap],
  ['mark', 'Marque élémentaire', '#ffd75e', t => t.mark],
];

/* ---------- 4. wiring ---------- */
const rangerLens = () => {
  INSPECTED_TILE = null;
  MAGNIFIER_ON = false;
};

function onBoardToolsClick(e) {
  const b = e.target.closest('[data-tool-action]');
  if (!b) {
    return;
  }
  const a = b.dataset.toolAction;
  if (a === 'fs') {
    setFullscreen(!document.body.classList.contains('fullscreen-mode'), true);
  } else if (a === 'lp') {
    MAGNIFIER_ON = !MAGNIFIER_ON;
    if (!MAGNIFIER_ON) {
      INSPECTED_TILE = null;
    }
    toast(MAGNIFIER_ON ? 'Loupe : touchez une case pour lire son détail.' : 'Loupe rangée.');
    syncBoardTools();
    tileSheet();
  } else if (a === 'ct') {
    PREF.boardContrast = PREF.boardContrast ? 0 : 1;
    savePref();
    applyContrast();
    syncBoardTools();
  } else if (a === 'pfs') {
    setFullscreen(!document.body.classList.contains('fullscreen-mode'), true);
    renderParams();
  } else if (a === 'pct') {
    PREF.boardContrast = PREF.boardContrast ? 0 : 1;
    savePref();
    applyContrast();
    renderParams();
  }
}

// Startup statements, run in their original order (see index.js).
export function init() {
  /* 1. Fullscreen: button on the board (and in Settings). The browser goes fullscreen when it allows it;
      in battle on phone, the bottom navigation bar disappears to leave room for the board.
   2. Magnifier: a long press on a cell (or the magnifier, then a tap) opens its sheet: terrain and its rules,
      elemental mark and reactions, Pokémon present, announced dangers (opponent attack, gym rule, fire),
      reachability for the selected Pokémon. The board legend lists this battle's terrains.
   3. High-contrast board (option): sharp cell outlines and more colorful terrains. */

  ((INSPECTED_TILE = null), // cell shown in the sheet
    (MAGNIFIER_ON = false), // a tap opens the sheet instead of acting
    (LONG_PRESS_AT = 0));
  // exit via Android's « back » gesture or the Esc key: immersive mode is exited too
  ['fullscreenchange', 'webkitfullscreenchange'].forEach(ev =>
    document.addEventListener(ev, () => {
      if (!isFullscreen() && document.body.classList.contains('fullscreen-mode') && FULLSCREEN_SEEN) {
        FULLSCREEN_SEEN = false;
        document.body.classList.remove('fullscreen-mode');
        PREF.fullscreenMode = 0;
        savePref();
        syncBoardTools();
        fitPhoneBattle();
      }
      if (isFullscreen()) {
        FULLSCREEN_SEEN = true;
      }
    })
  );
  FULLSCREEN_SEEN = false;
  // the browser did accept fullscreen

  /* ---------- 2. board toolbar ---------- */
  // toolbar icons: in BoardTools.jsx

  document.addEventListener('click', onBoardToolsClick);
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-tile-info]');
    if (!b || !B) {
      return;
    }
    if (b.dataset.tileInfo === 'x') {
      dismissTileSheet();
    } else if (b.dataset.tileInfo === 'u') {
      const v = byUid(B, b.dataset.uid);
      if (!v || ui.busy) {
        return;
      }
      if (v.side === 'a') {
        ui.sel = v.uid;
        ui.selE = null;
      } else {
        ui.selE = v.uid;
      }
      INSPECTED_TILE = null;
      ui.tile = null;
      clearAim();
      renderAll();
    }
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && document.getElementById('tile-info') && !document.getElementById('tile-info').hidden) {
      dismissTileSheet();
    }
  });
  /* long press (and magnifier) on the board */
  (function () {
    const svg = document.getElementById('bSvg');
    if (!svg) {
      return;
    }
    let tm = 0,
      x0 = 0,
      y0 = 0,
      kk = null;
    const stop = () => {
      clearTimeout(tm);
      tm = 0;
    };
    svg.addEventListener('pointerdown', e => {
      const p = e.target.closest && e.target.closest('[data-k]');
      if (!p || !B || (e.pointerType === 'mouse' && e.button !== 0)) {
        return;
      }
      kk = p.dataset.k;
      x0 = e.clientX;
      y0 = e.clientY;
      stop();
      tm = setTimeout(() => {
        tm = 0;
        if (!B) {
          return;
        }
        INSPECTED_TILE = kk;
        LONG_PRESS_AT = Date.now();
        try {
          if (navigator.vibrate) {
            navigator.vibrate(12);
          }
        } catch {
          /* Best effort: failure here is non-fatal. */
        }
        tileSheet();
      }, 430);
    });
    svg.addEventListener('pointermove', e => {
      if (tm && Math.hypot(e.clientX - x0, e.clientY - y0) > 10) {
        stop();
      }
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => svg.addEventListener(ev, stop));
    svg.addEventListener('contextmenu', e => {
      if (e.target.closest && e.target.closest('[data-k]')) {
        e.preventDefault();
      }
    });
    // capture phase: runs before the board's handler
    svg.addEventListener(
      'click',
      e => {
        const p = e.target.closest && e.target.closest('[data-k]');
        if (!p || !B) {
          return;
        }
        if (Date.now() - LONG_PRESS_AT < 800) {
          LONG_PRESS_AT = 0;
          e.stopImmediatePropagation();
          e.preventDefault();
          return;
        }
        if (MAGNIFIER_ON) {
          e.stopImmediatePropagation();
          e.preventDefault();
          INSPECTED_TILE = p.dataset.k;
          tileSheet();
          return;
        }
        if (INSPECTED_TILE != null) {
          INSPECTED_TILE = null;
        } // a normal tap closes the sheet opened by a long press
      },
      true
    );
  })();
  HOOKS.rendered.push(() => {
    syncBoardTools();
    tileSheet();
  });
  HOOKS.beforeLaunch.push(rangerLens);
  HOOKS.launch.push(isNew => {
    if (isNew && PREF.fullscreenMode) {
      setFullscreen(true, false);
    } // tapping « Lancer » (Start) allows fullscreen
  });
  HOOKS.beforeBattleEnd.push(rangerLens);
  HOOKS.battleEnd.push(tileSheet);
  addEventListener('resize', () => setTimeout(placeSheet, 60));
  addEventListener('scroll', () => placeSheet(), { passive: true });
  // « Affichage du combat » (Battle display) panel: rendered by React (src/screens/settings/panels/CombatDisplay.jsx)

  if (PREF.fullscreenMode) {
    document.body.classList.add('fullscreen-mode');
  }
  // immersive mode comes back; browser fullscreen waits for a tap
  if (PREF.boardContrast === undefined) {
    PREF.boardContrast = 1;
  }
  // v4.45: high-contrast board enabled by default (can be disabled)
  applyContrast();
}
