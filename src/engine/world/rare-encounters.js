/* Trainer avatar · rare encounters (time, weather) · hidden finds on the map (added in v4.50). */

import { TYPES } from '../data/game-data.js';
import { ITEMS2, PROFILE } from '../state/game-state.js';
import { writeLS, toast } from '../core/utils.js';
import { HOOKS } from '../core/hooks.js';
import { TOD } from './home-route.js';
import { queueSave } from '../state/saves.js';
import { PREF, savePref } from '../ui/preferences.js';
import { sfx, vibe } from '../audio/sound-effects.js';
import { avatar } from './home-journey.js';
import { V4 } from '../ui/screen-state.js';
import { today } from '../state/economy.js';
import { renderWallet } from '../ui/wallet.js';
import { renderMap } from './map.js';
import { renderParams } from '../ui/settings.js';
import { placesR } from './johto.js';
import { dailySeed, todayWeather } from './pokegear.js';
import { regionPool } from './catch-anywhere.js';
import { setRoute } from '../../screens/home/homeStore.js';

let RARE_LIST;

function typeAvatar(cls) {
  const a = TRAINER_AVATAR();
  return avatar(PROFILE.name || 'Dresseur', a ? a.e : 'Normal', (cls || '') + (a && a.hex ? ' hex-avatar' : ''));
}

/** Trainer emblem on the "VS" screen (HTML), or null if no avatar is chosen. */
export function versusAvatar() {
  return TRAINER_AVATAR() ? typeAvatar('sm') : null;
}

export function rareInfo(id) {
  let m = 1;
  const w = [];
  RARE_LIST.forEach(r => {
    if (r.ids.includes(id) && r.c()) {
      m *= r.m;
      w.push(r.w);
    }
  });
  return { m, w };
}

/* banner on the route: who is out right now */
function refreshRares() {
  const wx = todayWeather(),
    pool = regionPool().filter(m => rareInfo(m.id).m > 1);
  const sky =
    { pluie: 'pluie', soleil: 'grand soleil', grele: 'grêle', sable: 'tempête de sable' }[wx] || 'ciel dégagé';
  // #routeRates banner at the top of #route (Route.jsx)
  setRoute({
    rr: {
      head: `${TOD === 'nuit' ? 'Nuit' : TOD === 'matin' ? 'Matin' : 'Jour'} · ${sky}`,
      list: pool.length
        ? pool
            .slice(0, 4)
            .map(m => m.n)
            .join(', ')
        : '',
    },
  });
}

export function treasureState() {
  let s;
  try {
    s = JSON.parse(localStorage.getItem('res-treasure-hunt') || '{}');
  } catch (e) {
    s = {};
  }
  if (s.d !== today()) {
    s = { d: today(), got: {} };
  }
  return s;
}

function saveTreasures(s) {
  writeLS('res-treasure-hunt', s);
}

function treasureTheme() {
  const wx = todayWeather();
  if (wx) {
    return wx;
  }
  return TOD === 'nuit' ? 'nuit' : TOD === 'matin' ? 'matin' : 'jour';
}

export function treasureSpots() {
  const reg = V4.region || 'kanto',
    th = treasureTheme(),
    n = th === 'jour' ? 2 : 3,
    pl = placesR(),
    out = [];
  let h = dailySeed('tr' + reg + th);
  const rnd = () => {
    h = (Math.imul(h, 1664525) + 1013904223) >>> 0;
    return h / 4294967296;
  };
  for (let i = 0; i < n; i++) {
    let x = 0,
      y = 0;
    for (let k = 0; k < 12; k++) {
      x = 70 + rnd() * 860;
      y = 90 + rnd() * 800;
      if (pl.every(p => Math.hypot(p.x - x, p.y - y) > 70)) {
        break;
      }
    }
    out.push({ id: reg + ':' + th + ':' + i, x, y, th });
  }
  return out;
}

function harvestSpot(sp) {
  const s = treasureState();
  if (s.got[sp.id]) {
    return;
  }
  s.got[sp.id] = 1;
  saveTreasures(s);
  let h = dailySeed('rw' + sp.id);
  const rnd = n => {
    h = (Math.imul(h, 1664525) + 1013904223) >>> 0;
    return h % n;
  };
  const gems = 1 + rnd(3) + (sp.th === 'jour' ? 0 : 2),
    money = 80 + rnd(240);
  let extra = '';
  if (rnd(100) < 12) {
    const freeOnes = Object.keys(ITEMS2).filter(k => !PROFILE.items.includes(k));
    if (freeOnes.length) {
      const k = freeOnes[rnd(freeOnes.length)];
      PROFILE.items.push(k);
      extra = ` et l’objet « ${ITEMS2[k].n} »`;
    }
  } else if (rnd(100) < 35) {
    PROFILE.bag = PROFILE.bag || {};
    PROFILE.bag.poke = (PROFILE.bag.poke || 0) + 1;
    extra = ' et une Poké Ball';
  }
  PROFILE.gems = (PROFILE.gems || 0) + gems;
  PROFILE.money = (PROFILE.money || 0) + money;
  queueSave();
  renderWallet();
  sfx('win');
  vibe([30, 40, 30]);
  toast(`${TREASURE_NAMES[sp.th]} trouvé : +${gems} éclats, +${money} ₽${extra}.`);
  renderMap();
}

/* ---------- 1. trainer avatar ---------- */
export const TRAINER_AVATAR = () => (PREF.typeAvatar && TYPES[PREF.typeAvatar.e] ? PREF.typeAvatar : null);

export const rareWeight = mon => (RARE_ENABLED() ? rareInfo(mon.id).m : 1);

export const RARE_ENABLED = () => PREF.rareEncounter !== 0;

/* ---------- 3. hidden finds on the map ---------- */
export const TREASURE_NAMES = {
  nuit: 'Éclat lunaire',
  matin: 'Rosée du matin',
  pluie: 'Perle de pluie',
  soleil: 'Pépite solaire',
  grele: 'Cristal de givre',
  sable: 'Grain d’ambre',
  jour: 'Éclat de lumière',
};

// Instructions run at startup, in the original order (see index.js).
export function init() {
  // trainer emblem in the top bar (#v4Av): rendered by React (src/components/TopBar.jsx)

  /* the avatar precedes the name on the "VS" screen: versusAvatar(), rendered in Vs.jsx */

  /* ---------- 2. rare encounters by time and weather ---------- */
  RARE_LIST = [
    {
      c: () => TOD === 'nuit',
      m: 4,
      w: 'nuit',
      ids: ['nosferapti', 'fantominus', 'hoothoot', 'absol', 'tenefix', 'malosse', 'abra'],
    },
    { c: () => TOD === 'matin', m: 3, w: 'matin', ids: ['natu', 'tarsal', 'melo', 'granivol', 'mimigal', 'chenipan'] },
    {
      c: () => todayWeather() === 'pluie',
      m: 5,
      w: 'pluie',
      ids: ['ptitard', 'kaiminus', 'loupio', 'marill', 'gobou', 'magicarpe', 'axoloto'],
    },
    {
      c: () => todayWeather() === 'soleil',
      m: 5,
      w: 'soleil',
      ids: ['salameche', 'hericendre', 'poussifeu', 'limagma', 'carapuce'],
    },
    { c: () => todayWeather() === 'grele', m: 6, w: 'grêle', ids: ['marcacrin', 'lokhlass', 'pichu'] },
    {
      c: () => todayWeather() === 'sable',
      m: 5,
      w: 'sable',
      ids: ['onix', 'phanpy', 'embrylex', 'galekid', 'debugant'],
    },
  ];

  /* the encounter sheet flags a rare appearance: rendered by React (src/screens/overlays/Enc.jsx) */

  HOOKS.timeOfDay.push(refreshRares);

  try {
    refreshRares();
  } catch {
    /* Best effort: failure here is non-fatal. */
  }

  // hidden finds on the map (.findSpot): rendered by React (src/screens/map/Marks.jsx)

  document.addEventListener(
    'click',
    e => {
      const b = e.target.closest && e.target.closest('[data-treasure-spot]');
      if (!b) {
        return;
      }
      e.stopPropagation();
      e.preventDefault();
      const sp = treasureSpots().find(x => x.id === b.dataset.treasureSpot);
      if (sp) {
        harvestSpot(sp);
      }
    },
    true
  );

  /* ---------- 4. Settings: avatar and rare encounters ---------- */
  // "Avatar de dresseur" (Trainer avatar) panel: rendered by React (src/screens/settings/panels/Avatar.jsx)

  document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('[data-avatar-action]');
    if (!b) {
      return;
    }
    const k = b.dataset.avatarAction;
    if (k === 'av') {
      PREF.typeAvatar = { e: b.dataset.t, hex: !!(TRAINER_AVATAR() && TRAINER_AVATAR().hex) };
    } else if (k === 'hex') {
      PREF.typeAvatar = {
        e: (TRAINER_AVATAR() || { e: 'Normal' }).e,
        hex: !(TRAINER_AVATAR() && TRAINER_AVATAR().hex),
      };
    } else if (k === 'avreset') {
      delete PREF.typeAvatar;
    } else if (k === 'rare') {
      PREF.rareEncounter = RARE_ENABLED() ? 0 : 1;
    } else {
      return;
    }
    savePref();
    renderWallet();
    renderParams();
    refreshRares();
  });
}
