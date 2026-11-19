import { ITA, PKA } from '../assets/images.js';
import { BY, SCEN } from '../pokemon/pokemon.js';
import { PROFILE, lvlOfPts } from './game-state.js';
import { ARENAS, BADGES, TERR } from '../modes/gyms.js';
import { byUid, endStep, heal, say } from '../combat/engine.js';
import { immobilize, scenLock } from '../combat/items-bonds-ai.js';
import { B, finish, renderAll, ui } from '../combat/ui.js';
import { queueSave } from './saves.js';
import { playEv } from '../combat/move-effects.js';
import { renderWallet } from '../core/interface.js';
import { BAG_MAX, useCombatItem } from '../combat/resonance.js';
import { BALL_CAPTURE_CHECKS } from '../items/balls-held-items.js';

export let ITEM_ICONS, BALLS, HEALS, CAP_K;
let BALL_SEL;
export function __set_CAP_K(v) {
  return (CAP_K = v);
}
export function __set_BALL_SEL(v) {
  return (BALL_SEL = v);
}

/* ---------- profile: Pokédollars, Shards, Bag, quests ---------- */
export function ECO0() {
  return { money: 500, gems: 0, bag: { poke: 5, potion: 2 }, qc: {}, daily: { d: '', w: 0 } };
}

export function ecoClean(p) {
  const o = ECO0();
  if (!p || typeof p !== 'object') {
    return o;
  }
  if (Number.isFinite(p.money)) {
    o.money = clampI(p.money, 0, 999999);
  }
  if (Number.isFinite(p.gems)) {
    o.gems = clampI(p.gems, 0, 99999);
  }
  if (p.bag && typeof p.bag === 'object') {
    o.bag = {};
    for (const k in SHOP) {
      if (Number.isFinite(p.bag[k]) && p.bag[k] > 0) {
        o.bag[k] = clampI(p.bag[k], 0, 99);
      }
    }
  }
  if (p.qc && typeof p.qc === 'object') {
    for (const k in p.qc) {
      if (/^[a-z0-9]{1,16}$/i.test(k) && p.qc[k]) {
        o.qc[k] = 1;
      }
    }
  }
  if (p.daily && typeof p.daily.d === 'string' && /^\d{4}-\d\d-\d\d$/.test(p.daily.d)) {
    o.daily = { d: p.daily.d, w: p.daily.w ? 1 : 0 };
  }
  return o;
}

// + Johto (v4.16.1), Hoenn (v4.19)

/* ---------- daily challenge ---------- */
function dailyPool() {
  return [
    ...TERR.filter(k => !['tuto', 'sauvage', 'champ'].includes(k) && !SCEN[k].elite),
    ...ARENAS.map(a => a.k),
  ].filter(k => SCEN[k] && !scenLock(k));
}

export function dailyKey() {
  const p = dailyPool();
  if (!p.length) {
    return null;
  }
  let h = 7;
  for (const ch of today()) {
    h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  }
  return p[h % p.length];
}

export function dailyLeft() {
  const n = new Date(),
    m = new Date(n);
  m.setHours(24, 0, 0, 0);
  const s = Math.max(0, (m - n) / 1000),
    h = Math.floor(s / 3600),
    mi = Math.floor((s % 3600) / 60);
  return h ? `${h} h ${String(mi).padStart(2, '0')}` : `${mi} min`;
}

export function ballFor(e) {
  if (BALL_SEL && bagN(BALL_SEL)) {
    return BALL_SEL;
  }
  const own = BALLS.filter(k => bagN(k));
  return own.find(k => k !== 'master' && ballReqOk(k, e)) || own.find(k => k !== 'master') || own[0] || 'poke';
}

/** After a purchase or a reward: deferred save and wallet redrawn (a display error is ignored). */
export function savePurse() {
  try {
    queueSave();
    renderWallet();
  } catch {
    /* Best effort: failure here is non-fatal. */
  }
}

/* ---------- Potions in battle: healing in exchange for the Pokémon's action ---------- */
function pUse(S, u, k) {
  const it = SHOP[k];
  if (
    !it ||
    !it.heal ||
    S.phase !== 'player' ||
    !u ||
    u.ko ||
    u.sn ||
    u.acted ||
    bagN(k) < 1 ||
    u.hp >= u.mhp ||
    (S.itemsUsed || 0) >= BAG_MAX ||
    S.duel433
  ) {
    return null;
  }
  const ev = [];
  heal(S, u, Math.ceil(u.mhp * it.heal), ev);
  say(ev, `${it.n} : ${u.n} reprend des forces.`);
  u.acted = true;
  u.moved = true;
  S.itemsUsed = (S.itemsUsed || 0) + 1; // Battle Bag (v4.14)
  PROFILE.bag[k] = bagN(k) - 1;
  if (!PROFILE.bag[k]) {
    delete PROFILE.bag[k];
  }
  return endStep(S, ev);
}

// Bag bar in battle (.v4-bagbar): rendered by React (src/screens/combat/battle/Panel.jsx)

/* =====================================================================
   v4.0 · "Aventure" — new art direction and five screens:
   Map, Pokédex, Quests, Bag and Shop, Settings.
   Additive module: it wraps the engine without rewriting turn
   handling. Battle rules remain those of v3.
   ===================================================================== */

export const V4 = {
  dexSel: null,
  dexQ: '',
  dexGen: 'all',
  dexSort: 'no',
  bagView: 'boutique',
  bagCategory: 'balls',
  qty: {},
  questTab: 'main',
  mapSel: null,
  menu: false,
};

export const ART = no => PKA(no);

export const PIX = no => PKA(no);

export const ITM = k => ITEM_ICONS[k] || ITA(k);

// v4.14: icons drawn for the new items
export const fmt = n => Math.round(n).toLocaleString('fr-FR');

export const clampI = (v, a, b) => Math.max(a, Math.min(b, Math.floor(v)));

export const today = () => {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
};

/* ---------- Shop items ---------- */
export const SHOP = {
  poke: {
    n: 'Poké Ball',
    sn: 'Poké',
    d: 'La Ball classique : PV sous 25 % et cible immobilisée.',
    p: 200,
    category: 'balls',
    img: 'poke-ball',
  },
  super: {
    n: 'Super Ball',
    sn: 'Super',
    d: 'Capture dès 40 % de PV restants.',
    p: 600,
    category: 'balls',
    img: 'great-ball',
  },
  hyper: {
    n: 'Hyper Ball',
    sn: 'Hyper',
    d: 'Dès 40 % de PV, et nul besoin d’immobiliser la cible.',
    p: 1200,
    category: 'balls',
    img: 'ultra-ball',
  },
  master: {
    n: 'Master Ball',
    sn: 'Master',
    d: 'Ni seuil de PV, ni immobilisation : il suffit d’être au contact.',
    g: 30,
    category: 'balls',
    img: 'master-ball',
  },
  potion: {
    n: 'Potion',
    sn: 'Potion',
    d: 'En combat : rend 30 % des PV à un allié. Utilise son action.',
    p: 300,
    category: 'soins',
    img: 'potion',
    heal: 0.3,
  },
  superpotion: {
    n: 'Super Potion',
    sn: 'Super Potion',
    d: 'En combat : rend 60 % des PV à un allié. Utilise son action.',
    p: 700,
    category: 'soins',
    img: 'super-potion',
    heal: 0.6,
  },
};

export const HELD_IMG = {
  ceinture: 'focus-band',
  restes: 'leftovers',
  grelot: 'soothe-bell',
  evoluroc: 'eviolite',
  lentille: 'wide-lens',
  bandeau: 'muscle-band',
};

export const bagN = k => (PROFILE.bag && PROFILE.bag[k]) || 0;

export const tLevel = () => {
  const xp =
    PROFILE.wins * 40 + PROFILE.caught * 30 + BADGES.length * 150 + PROFILE.elite * 200 + PROFILE.awakenings * 5;
  return Math.min(50, 1 + Math.floor(Math.sqrt(xp / 30)));
};

export const familyOwned = () => new Set([...PROFILE.box, ...PROFILE.dex]).size;

// Free mode too (v4.21)
export const ownedFam = id => PROFILE.box.includes(BY[id].base) || PROFILE.dex.includes(BY[id].base);

// Free mode too (v4.21)
export const countS = () => Object.values(PROFILE.ranks || {}).filter(r => r === 'S').length;

export const maxLink = () => Object.values(PROFILE.links || {}).reduce((m, v) => Math.max(m, lvlOfPts(v)), 0);

export const trophies = () =>
  BADGES.length +
  Math.min(4, PROFILE.elite) +
  (PROFILE.elite >= 5 ? 1 : 0) +
  (PROFILE.johto || []).length +
  (PROFILE.jchamp ? 1 : 0) +
  (PROFILE.hoenn || []).length +
  (PROFILE.hchamp ? 1 : 0);

export const dailyDone = () => PROFILE.daily && PROFILE.daily.d === today() && PROFILE.daily.w;

const ballReqOk = (k, e) => {
  const h = e.hp / e.mhp;
  if (BALL_CAPTURE_CHECKS[k]) {
    return BALL_CAPTURE_CHECKS[k](B, e);
  }
  if (k === 'master') {
    return true;
  }
  if (k === 'hyper') {
    return h <= 0.4;
  }
  if (k === 'super') {
    return h <= 0.4 && immobilize(e);
  }
  return h <= 0.25 && immobilize(e);
};

/* Ball choice in the capture panel */
export const ballChips = () =>
  `<div class="v4-balls" role="group" aria-label="Choisir une Ball">${BALLS.map(k => `<button type="button" class="v4-ball${k === CAP_K ? ' on' : ''}" data-ball="${k}" aria-pressed="${k === CAP_K}" ${bagN(k) ? '' : 'disabled'}><img src="${ITM(SHOP[k].img)}" alt="" loading="lazy"><b>${SHOP[k].sn}</b><em>×${bagN(k)}</em></button>`).join('')}</div>${BALLS.some(k => bagN(k)) ? '' : '<p class="bp-hint">Plus aucune Ball : passez à la Boutique.</p>'}`;

// Instructions run at startup, in the original order (see index.js).
export function init() {
  /* original icons for the new items (v4.14): simple drawings, no official artwork */
  ITEM_ICONS = (() => {
    const g = (id, a, b) =>
      `<radialGradient id="${id}" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></radialGradient>`;
    const S = {
      'life-orb': `<defs>${g('a', '#ff9bd0', '#7a1d6b')}</defs><circle cx="24" cy="25" r="17" fill="url(#a)" stroke="#3b0d35" stroke-width="2"/><path d="M15 27c4-7 13-9 18-3" fill="none" stroke="#ffd6f0" stroke-width="2.5" stroke-linecap="round"/><circle cx="18" cy="18" r="3.5" fill="#fff" opacity=".8"/>`,
      'rocky-helmet': `<defs>${g('a', '#e9e9e9', '#6c7178')}</defs><path d="M7 33a17 17 0 0 1 34 0z" fill="url(#a)" stroke="#33363b" stroke-width="2"/><path d="M5 33h38v5H5z" fill="#d9b23a" stroke="#33363b" stroke-width="2"/><path d="M14 18l-3-8 7 5M24 14V5l4 9M34 18l3-8-7 5" fill="#9aa0a8" stroke="#33363b" stroke-width="1.5" stroke-linejoin="round"/>`,
      'sitrus-berry': `<defs>${g('a', '#fff3a0', '#c9a512')}</defs><path d="M24 13c-10 0-15 7-15 15s7 13 15 13 15-5 15-13-5-15-15-15z" fill="url(#a)" stroke="#6d5b10" stroke-width="2"/><path d="M24 14c0-5 3-8 8-9-1 5-4 8-8 9z" fill="#5cb85c" stroke="#2f6b2f" stroke-width="1.5"/><circle cx="18" cy="24" r="1.6" fill="#a8861a"/><circle cx="27" cy="31" r="1.6" fill="#a8861a"/><circle cx="31" cy="22" r="1.6" fill="#a8861a"/>`,
      'oran-berry': `<defs>${g('a', '#9bd3ff', '#1f4fa8')}</defs><circle cx="24" cy="27" r="15" fill="url(#a)" stroke="#132f63" stroke-width="2"/><path d="M24 12c1-5 5-7 10-7-2 4-5 6-10 7z" fill="#5cb85c" stroke="#2f6b2f" stroke-width="1.5"/><circle cx="18" cy="23" r="3" fill="#fff" opacity=".6"/>`,
      'choice-scarf': `<path d="M8 10h32l-6 12 6 16H29l-5-11-5 11H8l6-16z" fill="#f2a8d0" stroke="#7b2d58" stroke-width="2" stroke-linejoin="round"/><path d="M8 16h32" stroke="#7fd0f5" stroke-width="4"/>`,
      'damp-rock': `<defs>${g('a', '#bfe6ff', '#3d6f99')}</defs><path d="M10 34l-3-10 8-12h18l8 12-3 10-14 5z" fill="url(#a)" stroke="#1f3b55" stroke-width="2" stroke-linejoin="round"/><path d="M24 17c-3 4-4 6-4 8a4 4 0 0 0 8 0c0-2-1-4-4-8z" fill="#e8f7ff"/>`,
      'big-root': `<path d="M22 5h4v14l9 18h-5l-6-11v16h-4V26l-6 11h-5l9-18z" fill="#a8743f" stroke="#4d3115" stroke-width="2" stroke-linejoin="round"/><path d="M17 9c3 1 5 3 5 6M31 9c-3 1-5 3-5 6" fill="none" stroke="#5cb85c" stroke-width="2.5" stroke-linecap="round"/>`,
      'zoom-lens': `<circle cx="20" cy="20" r="12" fill="#cfefff" stroke="#3a4b5c" stroke-width="3"/><path d="M14 16a7 7 0 0 1 7-5" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/><path d="M29 29l11 11" stroke="#c0392b" stroke-width="6" stroke-linecap="round"/>`,
      metronome: `<path d="M18 5h12l9 37H9z" fill="#b5793c" stroke="#4d3115" stroke-width="2" stroke-linejoin="round"/><path d="M13 34h22" stroke="#4d3115" stroke-width="2"/><path d="M24 31L31 10" stroke="#f2d45c" stroke-width="2.5" stroke-linecap="round"/><circle cx="29" cy="16" r="3" fill="#f2d45c" stroke="#4d3115" stroke-width="1.5"/>`,
      'expert-belt': `<path d="M4 19h40v10H4z" fill="#2b2d33" stroke="#0c0d10" stroke-width="2"/><rect x="17" y="14" width="14" height="20" rx="3" fill="#e9c04a" stroke="#6b5212" stroke-width="2"/><path d="M24 18l2 4h4l-3 3 1 4-4-2-4 2 1-4-3-3h4z" fill="#c0392b"/>`,
      revive: `<path d="M24 5l12 19-12 19-12-19z" fill="#f7d65a" stroke="#8a6d0f" stroke-width="2" stroke-linejoin="round"/><path d="M24 11l7 13-7 13" fill="#fff3b0" opacity=".7"/>`,
      'full-heal': `<path d="M17 14h14v28H17z" fill="#f2d45c" stroke="#6b5a12" stroke-width="2"/><path d="M20 6h8v8h-8z" fill="#5cb85c" stroke="#2f6b2f" stroke-width="2"/><path d="M28 9h7" stroke="#2f6b2f" stroke-width="3" stroke-linecap="round"/><path d="M20 24h8M24 20v8" stroke="#6b5a12" stroke-width="3"/>`,
      'x-attack': `<rect x="10" y="17" width="28" height="14" rx="7" fill="#e5484d" stroke="#6b1215" stroke-width="2" transform="rotate(-35 24 24)"/><path d="M19 20l10 9" stroke="#fff" stroke-width="2" opacity=".6"/>`,
      'x-defense': `<rect x="10" y="17" width="28" height="14" rx="7" fill="#4b7bea" stroke="#16306b" stroke-width="2" transform="rotate(-35 24 24)"/><path d="M19 20l10 9" stroke="#fff" stroke-width="2" opacity=".6"/>`,
      'x-speed': `<rect x="10" y="17" width="28" height="14" rx="7" fill="#3fbf7f" stroke="#145a37" stroke-width="2" transform="rotate(-35 24 24)"/><path d="M19 20l10 9" stroke="#fff" stroke-width="2" opacity=".6"/>`,
      'star-piece': `<path d="M24 4l5 12 13 1-10 8 4 13-12-7-12 7 4-13-10-8 13-1z" fill="#f59ac0" stroke="#7b2d58" stroke-width="2" stroke-linejoin="round"/><path d="M24 12l2 6 6 1" fill="none" stroke="#fff" stroke-width="2" opacity=".7"/>`,
    };
    const o = {};
    for (const k in S) {
      o[k] =
        'data:image/svg+xml;charset=utf-8,' +
        encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">${S[k]}</svg>`);
    }
    return o;
  })();

  ((BALLS = ['poke', 'super', 'hyper', 'master']), (HEALS = ['potion', 'superpotion']));

  /* ---------- capture: the chosen Ball sets the conditions ---------- */
  ((CAP_K = 'poke'), (BALL_SEL = null));

  document.addEventListener('click', e => {
    const bl = e.target.closest('[data-ball]');
    if (bl && B) {
      BALL_SEL = bl.dataset.ball;
      renderAll();
      return;
    }
    const us = e.target.closest('[data-use]');
    if (us && B) {
      const u = byUid(B, ui.sel);
      const ev =
        (SHOP[us.dataset.use] || {}).category === 'combat'
          ? useCombatItem(B, u, us.dataset.use)
          : pUse(B, u, us.dataset.use); // v4.14
      if (!ev) {
        return;
      }
      ui.undo = null;
      renderAll();
      playEv(ev);
      if (B.over) {
        finish();
        return;
      }
      const nx = u && !u.ko && !u.acted ? u : B.units.find(x => x.side === 'a' && !x.ko && !x.acted); // it keeps its turn if it has not acted
      if (nx) {
        ui.sel = nx.uid;
      }
      renderAll();
      renderWallet();
    }
  });
}
