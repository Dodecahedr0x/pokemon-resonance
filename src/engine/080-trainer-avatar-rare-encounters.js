/* Original section: v4.50: trainer avatar · rare encounters (time, weather) · hidden finds on the map */

import { TYPES } from './004-data.js';
import { ITEMS2, PROFILE } from './011-game-state.js';
import { writeLS, toast } from './014-utils.js';
import { HOOKS } from './015-hooks.js';
import { TOD } from './017-home-route.js';
import { queueSave } from './025-saves.js';
import { PREF, savePref, sfx, vibe } from './026-campaign-tutorial-sound.js';
import { avatar } from './031-home-journey.js';
import { V4, today } from './032-v4-foundation.js';
import { renderWallet } from './035-interface.js';
import { renderMap } from './037-map.js';
import { renderParams } from './040-settings.js';
import { placesR } from './054-johto.js';
import { seed417, weatherDay417 } from './057-companions-resonance.js';
import { poolRegion421 } from './061-catch-anywhere.js';
import { setRoute } from '../screens/home/homeStore.js';

let RARE450;


function av450(cls) {
  const a = AVT450();
  return avatar(PROFILE.name || 'Dresseur', a ? a.e : 'Normal', (cls || '') + (a && a.hex ? ' hex450' : ''));
}


/** Trainer emblem on the "VS" screen (HTML), or null if no avatar is chosen. */
export function vsAv450() {
  return AVT450() ? av450('sm') : null;
}


export function rareInfo450(id) {
  let m = 1;
  const w = [];
  RARE450.forEach(r => {
    if (r.ids.includes(id) && r.c()) {
      m *= r.m;
      w.push(r.w);
    }
  });
  return { m, w };
}


/* banner on the route: who is out right now */
function route450() {
  const wx = weatherDay417(),
    pool = poolRegion421().filter(m => rareInfo450(m.id).m > 1);
  const sky = { pluie: 'pluie', soleil: 'grand soleil', grele: 'grêle', sable: 'tempête de sable' }[wx] || 'ciel dégagé';
  // #rr450 banner at the top of #route (Route.jsx)
  setRoute({
    rr: {
      head: `${TOD === 'nuit' ? 'Nuit' : TOD === 'matin' ? 'Matin' : 'Jour'} · ${sky}`,
      list: pool.length ? pool.slice(0, 4).map(m => m.n).join(', ') : ''
    }
  });
}


export function trSt450() {
  let s;
  try {
    s = JSON.parse(localStorage.getItem('res-tr450') || '{}');
  } catch (e) {
    s = {};
  }
  if (s.d !== today()) s = { d: today(), got: {} };
  return s;
}


function trSave450(s) {
  writeLS('res-tr450', s);
}


function trTheme450() {
  const wx = weatherDay417();
  if (wx) return wx;
  return TOD === 'nuit' ? 'nuit' : TOD === 'matin' ? 'matin' : 'jour';
}


export function trSpots450() {
  const reg = V4.region || 'kanto',
    th = trTheme450(),
    n = th === 'jour' ? 2 : 3,
    pl = placesR(),
    out = [];
  let h = seed417('tr' + reg + th);
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
      if (pl.every(p => Math.hypot(p.x - x, p.y - y) > 70)) break;
    }
    out.push({ id: reg + ':' + th + ':' + i, x, y, th });
  }
  return out;
}


function trHarvest450(sp) {
  const s = trSt450();
  if (s.got[sp.id]) return;
  s.got[sp.id] = 1;
  trSave450(s);
  let h = seed417('rw' + sp.id);
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
  toast(`${TH450[sp.th]} trouvé : +${gems} éclats, +${money} ₽${extra}.`);
  renderMap();
}

/* ---------- 1. trainer avatar ---------- */
export const AVT450 = () => (PREF.av450 && TYPES[PREF.av450.e] ? PREF.av450 : null);

export const rareW450 = mon => (IM450() ? rareInfo450(mon.id).m : 1);

export const IM450 = () => PREF.rare450 !== 0;

/* ---------- 3. hidden finds on the map ---------- */
export const TH450 = {
  nuit: 'Éclat lunaire',
  matin: 'Rosée du matin',
  pluie: 'Perle de pluie',
  soleil: 'Pépite solaire',
  grele: 'Cristal de givre',
  sable: 'Grain d’ambre',
  jour: 'Éclat de lumière'
};

// Instructions run at startup, in the original order (see index.js).
export function __init() {


// trainer emblem in the top bar (#v4Av): rendered by React (src/components/TopBar.jsx)


/* the avatar precedes the name on the "VS" screen: vsAv450(), rendered in Vs.jsx */


/* ---------- 2. rare encounters by time and weather ---------- */
RARE450 = [
  { c: () => TOD === 'nuit', m: 4, w: 'nuit', ids: ['nosferapti', 'fantominus', 'hoothoot', 'absol', 'tenefix', 'malosse', 'abra'] },
  { c: () => TOD === 'matin', m: 3, w: 'matin', ids: ['natu', 'tarsal', 'melo', 'granivol', 'mimigal', 'chenipan'] },
  { c: () => weatherDay417() === 'pluie', m: 5, w: 'pluie', ids: ['ptitard', 'kaiminus', 'loupio', 'marill', 'gobou', 'magicarpe', 'axoloto'] },
  { c: () => weatherDay417() === 'soleil', m: 5, w: 'soleil', ids: ['salameche', 'hericendre', 'poussifeu', 'limagma', 'carapuce'] },
  { c: () => weatherDay417() === 'grele', m: 6, w: 'grêle', ids: ['marcacrin', 'lokhlass', 'pichu'] },
  { c: () => weatherDay417() === 'sable', m: 5, w: 'sable', ids: ['onix', 'phanpy', 'embrylex', 'galekid', 'debugant'] }
];


/* the encounter sheet flags a rare appearance: rendered by React (src/screens/overlays/Enc.jsx) */


HOOKS.heure.push(route450);


try {
  route450();
} catch (e) {}


// hidden finds on the map (.sp450): rendered by React (src/screens/map/Marks.jsx)


document.addEventListener(
  'click',
  e => {
    const b = e.target.closest && e.target.closest('[data-tv450]');
    if (!b) return;
    e.stopPropagation();
    e.preventDefault();
    const sp = trSpots450().find(x => x.id === b.dataset.tv450);
    if (sp) trHarvest450(sp);
  },
  true
);


/* ---------- 4. Settings: avatar and rare encounters ---------- */
// "Avatar de dresseur" (Trainer avatar) panel: rendered by React (src/screens/settings/panels/Avatar.jsx)


document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('[data-b450]');
  if (!b) return;
  const k = b.dataset.b450;
  if (k === 'av') PREF.av450 = { e: b.dataset.t, hex: !!(AVT450() && AVT450().hex) };
  else if (k === 'hex') PREF.av450 = { e: (AVT450() || { e: 'Normal' }).e, hex: !(AVT450() && AVT450().hex) };
  else if (k === 'avreset') delete PREF.av450;
  else if (k === 'rare') PREF.rare450 = IM450() ? 0 : 1;
  else return;
  savePref();
  renderWallet();
  renderParams();
  route450();
});

}
