/* Section d'origine : v4.50 : avatar de dresseur · rencontres rares (heure, météo) · trouvailles cachées sur la carte */

import { TYPES } from './004-01-donnees.js';
import { ITEMS2, PROFILE } from './011-05-etat-de-partie.js';
import { ecrireLS, toast } from './014-08-outils.js';
import { CROCHETS } from './015-v4-8-00-crochets.js';
import { TOD } from './017-10-accueil-route.js';
import { queueSave } from './025-19-sauvegardes.js';
import { PREF, savePref, sfx, vibe } from './026-20-campagne-tutoriel-son.js';
import { avatar } from './031-25-v3-parcours-accueil.js';
import { V4, today } from './032-v4-00-socle.js';
import { renderWallet } from './035-v4-03-interface.js';
import { renderMap } from './037-v4-05-carte.js';
import { renderParams } from './040-v4-08-parametres.js';
import { placesR } from './054-v4-15-01-johto.js';
import { graine417, meteoJour417 } from './057-v4-17-01-compagnons-et-resonance.js';
import { poolRegion421 } from './061-v4-21-01-capture-partout.js';
import { setRoute } from '../screens/accueil/accueilStore.js';

let RARE450;


function av450(cls) {
  const a = AVT450();
  return avatar(PROFILE.name || 'Dresseur', a ? a.e : 'Normal', (cls || '') + (a && a.hex ? ' hex450' : ''));
}


/** Emblème du dresseur sur l'écran « VS » (HTML), ou null sans avatar choisi. */
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


/* bandeau sur la route : qui sort en ce moment */
function route450() {
  const wx = meteoJour417(),
    pool = poolRegion421().filter(m => rareInfo450(m.id).m > 1);
  const ciel = { pluie: 'pluie', soleil: 'grand soleil', grele: 'grêle', sable: 'tempête de sable' }[wx] || 'ciel dégagé';
  // bandeau #rr450 en tête de #route (Route.jsx)
  setRoute({
    rr: {
      head: `${TOD === 'nuit' ? 'Nuit' : TOD === 'matin' ? 'Matin' : 'Jour'} · ${ciel}`,
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
  ecrireLS('res-tr450', s);
}


function trTheme450() {
  const wx = meteoJour417();
  if (wx) return wx;
  return TOD === 'nuit' ? 'nuit' : TOD === 'matin' ? 'matin' : 'jour';
}


export function trSpots450() {
  const reg = V4.region || 'kanto',
    th = trTheme450(),
    n = th === 'jour' ? 2 : 3,
    pl = placesR(),
    out = [];
  let h = graine417('tr' + reg + th);
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


function trRecolte450(sp) {
  const s = trSt450();
  if (s.got[sp.id]) return;
  s.got[sp.id] = 1;
  trSave450(s);
  let h = graine417('rw' + sp.id);
  const rnd = n => {
    h = (Math.imul(h, 1664525) + 1013904223) >>> 0;
    return h % n;
  };
  const gems = 1 + rnd(3) + (sp.th === 'jour' ? 0 : 2),
    money = 80 + rnd(240);
  let extra = '';
  if (rnd(100) < 12) {
    const libres = Object.keys(ITEMS2).filter(k => !PROFILE.items.includes(k));
    if (libres.length) {
      const k = libres[rnd(libres.length)];
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

/* ---------- 1. avatar de dresseur ---------- */
export const AVT450 = () => (PREF.av450 && TYPES[PREF.av450.e] ? PREF.av450 : null);

export const rareW450 = mon => (IM450() ? rareInfo450(mon.id).m : 1);

export const IM450 = () => PREF.rare450 !== 0;

/* ---------- 3. trouvailles cachées sur la carte ---------- */
export const TH450 = {
  nuit: 'Éclat lunaire',
  matin: 'Rosée du matin',
  pluie: 'Perle de pluie',
  soleil: 'Pépite solaire',
  grele: 'Cristal de givre',
  sable: 'Grain d’ambre',
  jour: 'Éclat de lumière'
};

// Instructions exécutées au démarrage, dans l'ordre d'origine (voir index.js).
export function __init() {


// emblème du dresseur dans la barre du haut (#v4Av) : rendu par React (src/components/TopBar.jsx)


/* l’avatar précède le nom sur l’écran « VS » : vsAv450(), rendu dans Vs.jsx */


/* ---------- 2. rencontres rares selon l’heure et la météo ---------- */
RARE450 = [
  { c: () => TOD === 'nuit', m: 4, w: 'nuit', ids: ['nosferapti', 'fantominus', 'hoothoot', 'absol', 'tenefix', 'malosse', 'abra'] },
  { c: () => TOD === 'matin', m: 3, w: 'matin', ids: ['natu', 'tarsal', 'melo', 'granivol', 'mimigal', 'chenipan'] },
  { c: () => meteoJour417() === 'pluie', m: 5, w: 'pluie', ids: ['ptitard', 'kaiminus', 'loupio', 'marill', 'gobou', 'magicarpe', 'axoloto'] },
  { c: () => meteoJour417() === 'soleil', m: 5, w: 'soleil', ids: ['salameche', 'hericendre', 'poussifeu', 'limagma', 'carapuce'] },
  { c: () => meteoJour417() === 'grele', m: 6, w: 'grêle', ids: ['marcacrin', 'lokhlass', 'pichu'] },
  { c: () => meteoJour417() === 'sable', m: 5, w: 'sable', ids: ['onix', 'phanpy', 'embrylex', 'galekid', 'debugant'] }
];


/* la fiche de rencontre signale une apparition rare : rendu par React (src/screens/overlays/Enc.jsx) */


CROCHETS.heure.push(route450);


try {
  route450();
} catch (e) {}


// trouvailles cachées sur la carte (.sp450) : rendues par React (src/screens/carte/Marks.jsx)


document.addEventListener(
  'click',
  e => {
    const b = e.target.closest && e.target.closest('[data-tv450]');
    if (!b) return;
    e.stopPropagation();
    e.preventDefault();
    const sp = trSpots450().find(x => x.id === b.dataset.tv450);
    if (sp) trRecolte450(sp);
  },
  true
);


/* ---------- 4. Paramètres : avatar et rencontres rares ---------- */
// panneau « Avatar de dresseur » : rendu par React (src/screens/settings/panels/Avatar.jsx)


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
