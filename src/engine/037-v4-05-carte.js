/* Section d'origine : v4-05-carte.js */

import { GYMS } from './004-01-donnees.js';
import { SCEN } from './009-03-pokemon.js';
import { BADGE_REWARD, ITEMS2, PROFILE } from './011-05-etat-de-partie.js';
import { ARENAS } from './013-07-arenes.js';
import { $, RM } from './014-08-outils.js';
import { crochet } from './015-v4-8-00-crochets.js';
import { badgeSvg } from './019-12-ligue.js';
import { ELITE, scenLock } from './022-15-systemes-objets-liens-ia.js';
import { nextGoal } from './026-20-campagne-tutoriel-son.js';
import { ELITE_L, leaderOf } from './030-24-prestige-mise-en-scene.js';
import { avatar, emblem, wonOf } from './031-25-v3-parcours-accueil.js';
import { HELD_IMG, ITM, V4 } from './032-v4-00-socle.js';
import { jRewardLine415, placeStateJ, placesR, regionUi415 } from './054-v4-15-01-johto.js';
import { safariVerrou418 } from './058-v4-18-01-peche-safari-coop.js';
import { fleches430 } from './065-v4-30-01-camp-et-tactique.js';
import { carteBatie, refreshCarte } from '../screens/carte/carteStore.js';

// Page Carte rendue par React (src/screens/carte/) : gabarit, tracés, marqueurs, panneaux.
export let PL, MAP_SVG;
let mapBuilt;


/** Nom du combat final sur la carte et dans la liste des combats (Selection.jsx). */
export const FINALE_N = 'Finale · Championne';


export function placeName(p) {
  if (p.n) return p.n;
  if (p.id === 'champ') return FINALE_N;
  return SCEN[p.id] ? SCEN[p.id].n : p.id;
}


export function placeSub(p) {
  if (p.s) return p.s;
  const L = leaderOf(p.id),
    gi = ARENAS.findIndex(a => a.k === p.id);
  if (gi >= 0) return `Arène ${gi + 1} · ${L ? L.n : ''}`;
  if (L) return L.n;
  return SCEN[p.id] ? SCEN[p.id].lvl : '';
}


export function placeState(p) {
  const gk = nextGoal()[0];
  if (p.j) return placeStateJ(p, gk); // Johto (v4.15)
  if (p.id === 'safari') return safariVerrou418() ? 'lock' : 'open'; // Parc Safari (v4.18)
  if (p.id === 'wild') return 'open';
  if (p.id === 'elite') {
    if (PROFILE.elite >= 4) return 'done';
    if (ELITE.includes(gk)) return 'next';
    return scenLock('c1') ? 'lock' : 'open';
  }
  const k = p.id;
  if (k === gk) return 'next';
  if (wonOf(k) || (k === 'tuto' && PROFILE.tuto)) return 'done';
  if (scenLock(k)) return 'lock';
  return 'open';
}


export function placeIcon(p) {
  if (p.id === 'safari') return `<span class="emb ter bio-roche xs"><svg viewBox="0 0 24 24"><use href="#i-grass"/></svg></span>`; // v4.18
  if (p.id === 'wild' || p.id === 'jwild' || p.id === 'hwild')
    return `<span class="emb ter bio-gue xs"><svg viewBox="0 0 24 24"><use href="#i-grass"/></svg></span>`;
  if (p.id === 'elite')
    return avatar(ELITE_L[Math.min(3, PROFILE.elite)].n, SCEN[ELITE[Math.min(3, PROFILE.elite)]].at || 'Dragon', 'xs');
  return emblem(p.id, 'xs');
}


export function curvePath(a, b, i) {
  const mx = (a.x + b.x) / 2,
    my = (a.y + b.y) / 2,
    dx = b.x - a.x,
    dy = b.y - a.y,
    k = (i % 2 ? 1 : -1) * 0.18;
  return `M${a.x} ${a.y} Q${(mx - dy * k).toFixed(0)} ${(my + dx * k).toFixed(0)} ${b.x} ${b.y}`;
}


// Le gabarit est rendu par React, Route 29 (#route) comprise, sous la carte.
export function buildMap() {
  const pg = $('#carte');
  if (!pg || mapBuilt) return;
  mapBuilt = true;
  carteBatie();
}


export function renderMap() {
  if (!V4.region) V4.region = /^h/.test(nextGoal()[0]) ? 'hoenn' : /^j/.test(nextGoal()[0]) ? 'johto' : 'kanto'; // v4.15, v4.19
  buildMap();
  if (mapBuilt) {
    // les marqueurs étaient dessinés avant le choix du lieu par défaut : on garde l'ancienne sélection pour eux
    const marksSel = V4.mapSel;
    if (!V4.mapSel || !placesR().some(p => p.id === V4.mapSel)) V4.mapSel = (placesR().find(p => placeState(p) === 'next') || placesR()[0]).id;
    regionUi415(); // v4.15
    refreshCarte({ marksSel });
  }
  crochet('carte');
}


export function rewardLine(k) {
  const gi = ARENAS.findIndex(a => a.k === k);
  if (gi < 0) return jRewardLine415(k); // Johto (v4.15)
  const R = BADGE_REWARD[gi];
  return `<div class="v4-rew"><span class="v4-rew-b">${badgeSvg(gi, GYMS[gi].t, 'mi' + gi)}Badge ${GYMS[gi].t}</span>${R.item ? `<span><img src="${ITM(HELD_IMG[R.item])}" alt="" loading="lazy">${ITEMS2[R.item].n}</span>` : ''}<span><span class="v4-coin" aria-hidden="true">₽</span>+500</span><span><span class="v4-gemi"><svg><use href="#i-gem"/></svg></span>+10</span></div>`;
}


export function centerMap() {
  const sc = $('#mapSc'),
    mk = $(`#mapMarks [data-place="${V4.mapSel}"]`);
  if (sc && mk && sc.scrollWidth > sc.clientWidth) sc.scrollLeft = Math.max(0, mk.offsetLeft - sc.clientWidth / 2);
  fleches430(); // flèches de défilement (v4.30)
}

/* ---------- Carte de la région (dessin original) ---------- */
export const PLACES = [
  { id: 'tuto', x: 115, y: 522, n: 'Laboratoire Sorbier', s: 'Prologue', grp: 'aventure' },
  { id: 'wild', x: 205, y: 462, n: 'Route 29', s: 'Hautes herbes · captures', grp: 'route' },
  { id: 'a1', x: 335, y: 428, grp: 'aventure' },
  { id: 'gue', x: 292, y: 528, grp: 'entrainement' },
  { id: 'roche', x: 425, y: 478, grp: 'entrainement' },
  { id: 'a2', x: 158, y: 318, grp: 'aventure' },
  { id: 'a3', x: 300, y: 222, grp: 'aventure' },
  { id: 'tour', x: 198, y: 142, grp: 'entrainement' },
  { id: 'a4', x: 400, y: 338, grp: 'aventure' },
  { id: 'a5', x: 628, y: 512, grp: 'aventure' },
  { id: 'a6', x: 668, y: 318, grp: 'aventure' },
  { id: 'a7', x: 862, y: 548, grp: 'aventure' },
  { id: 'a8', x: 852, y: 258, grp: 'aventure' },
  { id: 'ligue', x: 742, y: 162, grp: 'entrainement' },
  { id: 'elite', x: 452, y: 150, n: 'Plateau de la Ligue', s: 'Conseil 4', grp: 'aventure' },
  { id: 'champ', x: 592, y: 96, grp: 'aventure' }
];


export const CHAIN = ['tuto', 'wild', 'a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7', 'a8', 'elite', 'champ'];


export const STATE_N = { next: 'En cours', done: 'Terminé', lock: 'Verrouillé', open: 'Disponible' };

// Instructions exécutées au démarrage, dans l'ordre d'origine (voir index.js).
export function __init() {

PL = Object.fromEntries(PLACES.map(p => [p.id, p]));


MAP_SVG = (() => {
  const tree = (x, y, s = 1) =>
    `<g transform="translate(${x} ${y}) scale(${s})"><circle r="9" cy="-4" fill="#1d5a32"/><circle r="7" cx="-6" cy="2" fill="#226b3a"/><circle r="7" cx="6" cy="2" fill="#1f6236"/><circle r="4" cx="-2" cy="-8" fill="#3d9152" opacity=".8"/></g>`;
  const forest = (cx, cy, n, sp) => {
    let o = '';
    for (let i = 0; i < n; i++) {
      const a = i * 2.399,
        r = Math.sqrt(i) * sp;
      o += tree((cx + Math.cos(a) * r).toFixed(0), (cy + Math.sin(a) * r * 0.7).toFixed(0), 0.8 + ((i * 37) % 5) / 12);
    }
    return o;
  };
  const mount = (x, y, s) =>
    `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-30 18 -4 -26 6 -12 14 -22 34 18Z" fill="url(#mRock)"/><path d="M-4 -26 6 -12 1 -8-4-14-9-6-14-10Z" fill="#f4f8ff"/><path d="M14 -22 22 -8 17-5 13-12 9-7Z" fill="#e7eefb"/><path d="M-4 -26 -30 18h20Z" fill="#000" opacity=".12"/></g>`;
  const town = (x, y) =>
    `<g transform="translate(${x} ${y})" class="mp-town"><rect x="-13" y="-4" width="9" height="8" fill="#f2e7d0"/><path d="M-14-4-8.5-10-3-4Z" fill="#d2523f"/><rect x="-1" y="-7" width="10" height="11" fill="#eef1f6"/><path d="M-2-7 4-13 10-7Z" fill="#3f78c8"/><rect x="11" y="-2" width="7" height="6" fill="#f2e7d0"/><path d="M10-2 14.5-7 19-2Z" fill="#d2523f"/></g>`;
  const grass = (x, y) =>
    `<path d="M${x} ${y}l3-9 2 9 3-11 2 11 3-8 1 8" fill="none" stroke="#7fd36b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity=".9"/>`;
  const LAND =
    'M60 250C50 170 110 95 200 82C280 70 330 96 400 80C470 64 560 58 650 70C740 82 830 92 900 130C960 165 968 240 948 300C930 360 956 410 920 450C880 490 820 470 770 495C720 520 700 575 650 590C600 605 565 560 560 500C556 450 540 420 520 430C500 440 495 480 480 530C465 580 400 600 330 598C260 596 190 612 130 580C80 552 50 500 58 440C64 380 90 330 70 290C64 275 60 262 60 250Z';
  const ISLE =
    'M800 548C800 515 838 500 870 504C905 508 928 530 922 556C916 584 880 596 848 590C818 585 800 572 800 548Z';
  const ISLE2 = 'M120 640C110 620 150 612 170 622C186 630 170 640 120 640Z';
  return `<svg class="map-svg" viewBox="0 0 1000 640" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
 <defs>
  <radialGradient id="mSea" cx="50%" cy="45%" r="75%"><stop offset="0" stop-color="#2a8fd0"/><stop offset=".55" stop-color="#1a62a6"/><stop offset="1" stop-color="#0c2e5e"/></radialGradient>
  <linearGradient id="mLand" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5fae55"/><stop offset=".55" stop-color="#4f9d4b"/><stop offset="1" stop-color="#3f8a44"/></linearGradient>
  <linearGradient id="mRock" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#a6a9b4"/><stop offset="1" stop-color="#5d6170"/></linearGradient>
  <radialGradient id="mDesert"><stop offset="0" stop-color="#e3c27a"/><stop offset="1" stop-color="#c79b52" stop-opacity=".2"/></radialGradient>
  <radialGradient id="mMarsh"><stop offset="0" stop-color="#7a5aa6"/><stop offset="1" stop-color="#4b8a72" stop-opacity="0"/></radialGradient>
  <radialGradient id="mLava"><stop offset="0" stop-color="#ffcf5a"/><stop offset=".35" stop-color="#ff6a2a"/><stop offset="1" stop-color="#ff3a1a" stop-opacity="0"/></radialGradient>
  <radialGradient id="mLight" cx="35%" cy="25%" r="70%"><stop offset="0" stop-color="#fff6c8" stop-opacity=".35"/><stop offset="1" stop-color="#fff6c8" stop-opacity="0"/></radialGradient>
  <clipPath id="mClip"><path d="M60 250C50 170 110 95 200 82C280 70 330 96 400 80C470 64 560 58 650 70C740 82 830 92 900 130C960 165 968 240 948 300C930 360 956 410 920 450C880 490 820 470 770 495C720 520 700 575 650 590C600 605 565 560 560 500C556 450 540 420 520 430C500 440 495 480 480 530C465 580 400 600 330 598C260 596 190 612 130 580C80 552 50 500 58 440C64 380 90 330 70 290C64 275 60 262 60 250Z"/></clipPath>
  <filter id="mBlur" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="12"/></filter>
  <radialGradient id="mHill" cx="45%" cy="35%"><stop offset="0" stop-color="#8fd16a"/><stop offset="1" stop-color="#4f9d4b" stop-opacity="0"/></radialGradient>
  <pattern id="mWave" width="60" height="24" patternUnits="userSpaceOnUse"><path d="M4 14q8-7 16 0t16 0" fill="none" stroke="#bfe9ff" stroke-width="1.2" opacity=".18"/></pattern>
 </defs>
 <rect width="1000" height="640" fill="url(#mSea)"/><rect width="1000" height="640" fill="url(#mWave)"/>
 <g fill="none" stroke="#9fe3ff" stroke-linejoin="round"><path d="${LAND}" stroke-width="26" opacity=".22"/><path d="${ISLE}" stroke-width="22" opacity=".22"/><path d="${ISLE2}" stroke-width="18" opacity=".2"/></g>
 <g stroke="#e9d9a2" stroke-width="7" stroke-linejoin="round"><path d="${LAND}" fill="url(#mLand)"/><path d="${ISLE}" fill="#5c8a43"/><path d="${ISLE2}" fill="url(#mLand)"/></g>
 <g clip-path="url(#mClip)"><ellipse cx="250" cy="430" rx="230" ry="150" fill="#9ad877" opacity=".22"/><ellipse cx="730" cy="320" rx="210" ry="140" fill="#9ad877" opacity=".18"/><ellipse cx="505" cy="190" rx="150" ry="130" fill="#24572f" opacity=".3"/><path d="M60 250C50 170 110 95 200 82C280 70 330 96 400 80C470 64 560 58 650 70C740 82 830 92 900 130C960 165 968 240 948 300C930 360 956 410 920 450C880 490 820 470 770 495C720 520 700 575 650 590C600 605 565 560 560 500C556 450 540 420 520 430C500 440 495 480 480 530C465 580 400 600 330 598C260 596 190 612 130 580C80 552 50 500 58 440C64 380 90 330 70 290C64 275 60 262 60 250Z" fill="none" stroke="#123a20" stroke-width="44" opacity=".38" filter="url(#mBlur)"/>
  <ellipse cx="300" cy="320" rx="48" ry="26" fill="url(#mHill)" opacity=".7"/><ellipse cx="610" cy="380" rx="60" ry="30" fill="url(#mHill)" opacity=".6"/><ellipse cx="770" cy="380" rx="50" ry="24" fill="url(#mHill)" opacity=".6"/><ellipse cx="180" cy="220" rx="44" ry="22" fill="url(#mHill)" opacity=".6"/></g>
 <g opacity=".35" filter="url(#mBlur)" fill="#ffffff"><ellipse cx="90" cy="60" rx="80" ry="22"/><ellipse cx="930" cy="590" rx="90" ry="24"/><ellipse cx="960" cy="70" rx="70" ry="18"/></g>
 <ellipse cx="850" cy="258" rx="92" ry="58" fill="url(#mDesert)"/><path d="M790 250q30-12 60 0t60 0M800 276q25-10 50 0t50 0" stroke="#b5884a" stroke-width="2" fill="none" opacity=".55"/>
 <ellipse cx="625" cy="515" rx="70" ry="44" fill="url(#mMarsh)" opacity=".85"/>
 <path d="M150 330c-6-22 18-38 40-30 22 7 22 36 0 44-17 6-35 2-40-14Z" fill="#3a9ee0" stroke="#bfefff" stroke-width="2.5"/>
 <path d="M462 196C430 250 420 280 380 300S330 360 340 400 300 470 296 520 300 590 312 610" fill="none" stroke="#3a9ee0" stroke-width="9" stroke-linecap="round"/><path d="M462 196C430 250 420 280 380 300S330 360 340 400 300 470 296 520 300 590 312 610" fill="none" stroke="#9fe3ff" stroke-width="2.5" stroke-linecap="round" opacity=".7"/>
 ${forest(400, 336, 26, 9)}${forest(232, 262, 10, 8)}${forest(700, 430, 9, 8)}${forest(118, 410, 7, 8)}${forest(905, 370, 6, 8)}${forest(560, 440, 5, 7)}${forest(340, 150, 6, 7)}${forest(640, 170, 5, 7)}
 ${mount(470, 170, 1.25)}${mount(530, 215, 1)}${mount(500, 265, 0.9)}${mount(560, 150, 0.85)}${mount(430, 120, 0.8)}${mount(600, 250, 0.7)}${mount(200, 128, 0.75)}${mount(170, 170, 0.6)}${mount(240, 110, 0.55)}
 <g transform="translate(862 540)"><path d="M-46 18-14-26h28L46 18Z" fill="#6a3f2c"/><path d="M-14-26h28l-6 8h-16Z" fill="#2d1a14"/><circle cy="-24" r="30" fill="url(#mLava)" opacity=".85"/><path d="M-6-18q-8 14-2 34M6-18q10 16 4 34" stroke="#ff7a2a" stroke-width="3" fill="none" opacity=".8"/></g>
 <path d="M842 470 852 505" stroke="#e9d9a2" stroke-width="5" stroke-dasharray="4 3"/>
 ${grass(180, 470)}${grass(214, 488)}${grass(236, 456)}${grass(160, 494)}
 ${town(115, 540)}${town(158, 340)}${town(305, 240)}${town(670, 338)}${town(745, 182)}${town(345, 448)}${town(628, 532)}
 <g transform="translate(742 140)"><ellipse rx="26" ry="11" fill="#d7dde8" stroke="#8a93a6" stroke-width="2"/><ellipse rx="17" ry="6" fill="#4f9d4b"/></g>
 <g transform="translate(205 120)"><rect x="-6" y="-26" width="12" height="30" fill="#4a3e57"/><path d="M-8-26 0-38 8-26Z" fill="#2c2335"/></g>
 <g transform="translate(518 104)"><path d="M-30 6h60l-8-14h-44Z" fill="#e9eef7" stroke="#a4adbf" stroke-width="2"/><path d="M-10-8v-14h20v14" fill="#f6d36b" stroke="#b08a2e" stroke-width="2"/></g>
 <rect width="1000" height="640" fill="url(#mLight)"/>
 </svg>`;
})();


mapBuilt = false;


document.addEventListener('click', e => {
  const b = e.target.closest('[data-place]');
  if (!b) return;
  V4.mapSel = b.dataset.place;
  renderMap();
  if (b.closest('#mapList')) {
    const mk = $(`#mapMarks [data-place="${V4.mapSel}"]`),
      sc = $('#mapSc');
    if (mk && sc && sc.scrollWidth > sc.clientWidth)
      sc.scrollTo({ left: mk.offsetLeft - sc.clientWidth / 2, behavior: RM ? 'auto' : 'smooth' });
  }
  if (innerWidth < 1000) {
    const i = $('#mapInfo');
    if (i && b.closest('#mapMarks')) i.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'nearest' });
  }
});
}
