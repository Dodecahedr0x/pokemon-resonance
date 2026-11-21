/* Wallet and shop: Pokédollars, Shards, Bag, quest flags; shop catalogue and number/date helpers. */

import { PROFILE } from './game-state.js';
import { queueSave } from './saves.js';
import { renderWallet } from '../ui/wallet.js';

/* ---------- profile: Pokédollars, Shards, Bag, quests ---------- */
export function defaultEconomyProfile() {
  return { money: 500, gems: 0, bag: { poke: 5, potion: 2 }, qc: {}, daily: { d: '', w: 0 } };
}

export function ecoClean(p) {
  const o = defaultEconomyProfile();
  if (!p || typeof p !== 'object') {
    return o;
  }
  if (Number.isFinite(p.money)) {
    o.money = clampInt(p.money, 0, 999999);
  }
  if (Number.isFinite(p.gems)) {
    o.gems = clampInt(p.gems, 0, 99999);
  }
  if (p.bag && typeof p.bag === 'object') {
    o.bag = {};
    for (const k in SHOP) {
      if (Number.isFinite(p.bag[k]) && p.bag[k] > 0) {
        o.bag[k] = clampInt(p.bag[k], 0, 99);
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

/** After a purchase or a reward: deferred save and wallet redrawn (a display error is ignored). */
export function savePurse() {
  try {
    queueSave();
    renderWallet();
  } catch {
    /* Best effort: failure here is non-fatal. */
  }
}

export const formatNumber = n => Math.round(n).toLocaleString('fr-FR');

export const clampInt = (v, a, b) => Math.max(a, Math.min(b, Math.floor(v)));

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

export const bagCount = k => (PROFILE.bag && PROFILE.bag[k]) || 0;
