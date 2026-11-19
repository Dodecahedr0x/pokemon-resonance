/* Original section: v4.18-01-peche-safari-coop.js */

import { BY } from './009-pokemon.js';
import { RECRUIT } from './010-in-battle-evolution.js';
import { PROFILE, isCamp } from './011-game-state.js';
import { RC } from './012-recruits-roles-synergies.js';
import { BADGES } from './013-gyms.js';
import { paintOverlay } from '../screens/overlays/dialogsStore.js';
import { $, toast } from './014-utils.js';
import { HOOKS } from './015-hooks.js';
import { go } from './016-navigation.js';
import { TOD, __set_wildId } from './017-home-route.js';
import { squad, toggle } from './020-team-cards.js';
import { wildScen } from './022-items-bonds-ai.js';
import { B, __set_scSel, clearAim, launch, log, renderAll, ui } from './024-combat-ui.js';
import { queueSave } from './025-saves.js';
import { PREF, renderPrep, sfx, vibe } from './026-campaign-tutorial-sound.js';
import { renderWallet } from './035-interface.js';
import { PL, PLACES } from './037-map.js';
import { refreshMap } from '../screens/map/mapStore.js';
import { SHINY_RATE, SPARK } from './043-adventure-plus.js';
import { multChroma } from './050-world.js';
import { routeName } from './054-johto.js';
import { poolRegion421, regFam421, regionNo421 } from './061-catch-anywhere.js';
import { chromaArt425 } from './062-art-direction.js';
import { diplomaOut428 } from './063-combat-catches-home.js';

export let SAFARI_PRICE, SAFARI_STEPS, SAFARI_BALLS;
let FISHING, SAF_MSG;


/* =====================================================================
   v4.18: fishing, Safari Park and co-op
   1. Fishing: from the tall grass (Route 29, Route 32), cast the
      line, hook at the right moment, then fight the catch (capture in
      Campaign). Sometimes a big Dominant fish.
   2. Safari Park (Kanto, after 2 badges in Campaign): ₽500 entry,
      12 steps and 20 Safari Balls. You capture without fighting, with bait and
      rocks. Rare Pokémon are more frequent there.
   3. 2-player co-op (Settings): on the same phone, Player 1
      controls the first 2 Pokémon, Player 2 the others.
   ===================================================================== */
export function V418_0() {
  return { safari: null, peches: 0, safariPris: 0 };
}


export function v418Clean(p) {
  const o = V418_0();
  if (!p || typeof p !== 'object') return o;
  const s = p.safari;
  if (s && typeof s === 'object' && Number.isFinite(s.pas) && Number.isFinite(s.balls)) {
    o.safari = { pas: Math.max(0, Math.min(12, Math.floor(s.pas))), balls: Math.max(0, Math.min(20, Math.floor(s.balls))), pris: Array.isArray(s.pris) ? s.pris.filter(id => BY[id]).slice(0, 20) : [], enc: null };
    if (!o.safari.pas && !o.safari.balls) o.safari = null;
  }
  if (Number.isFinite(p.peches)) o.peches = Math.max(0, Math.min(99999, Math.floor(p.peches)));
  if (Number.isFinite(p.safariPris)) o.safariPris = Math.max(0, Math.min(99999, Math.floor(p.safariPris)));
  return o;
}


/** Out-of-battle capture (Safari): Box, Pokédex, shiny. */
function take418(id, sh) {
  const b = BY[id].base;
  PROFILE.caught++;
  if (!PROFILE.dex.includes(b)) PROFILE.dex.push(b);
  const nw = !PROFILE.box.includes(b); // Free mode too (v4.21)
  if (nw) PROFILE.box.push(b);
  if (sh && !PROFILE.shiny.includes(b)) PROFILE.shiny.push(b);
  if (nw) setTimeout(diplomaOut428, 0); // regional diploma (v4.28)
  return nw;
}


/* =====================================================================
   1. Fishing
   ===================================================================== */
function poolFishing418() {
  return RECRUIT.filter(m => m.t.includes('Eau') && (regFam421(m.id) === regionNo421() || m.id === 'magicarpe')); // the region's fish, Magikarp bites everywhere (v4.21)
}


function fishingDraw418() {
  const L = poolFishing418();
  if (!L.length) return null;
  const w = L.map(m => (m.id === 'magicarpe' ? [0, 4, 2, 1][regionNo421()] : 1) * (!PROFILE.box.includes(m.id) ? 2 : 1));
  return draw418(L, w).id;
}


function fishingCast418() {
  clearTimeout(FISHING && FISHING.t);
  FISHING = { etat: 'attente' };
  renderFishing418();
  $('#peche418').hidden = false;
  FISHING.t = setTimeout(() => {
    if (!FISHING || FISHING.etat !== 'attente') return;
    FISHING.etat = 'mord';
    vibe(60);
    sfx('ui');
    renderFishing418();
    FISHING.t = setTimeout(() => {
      if (!FISHING || FISHING.etat !== 'mord') return;
      FISHING.etat = 'rate';
      renderFishing418();
    }, PREF.fast ? 1400 : 1150);
  }, 1200 + Math.random() * 2200);
}


function fishingHookSet418() {
  if (!FISHING || FISHING.etat !== 'mord') return;
  clearTimeout(FISHING.t);
  const id = fishingDraw418();
  if (!id) return;
  FISHING = { etat: 'prise', id, sh: Math.random() < SHINY_RATE * multChroma(), dom: Math.random() < 0.05 };
  PROFILE.peches = (PROFILE.peches || 0) + 1;
  queueSave();
  renderFishing418();
}


/* fishing window: rendered by React (src/screens/overlays/Fishing418.jsx) */
function renderFishing418() {
  const el = $('#peche418'),
    P2 = FISHING || {};
  // the shiny artwork is recolored after rendering (v4.25)
  setTimeout(() => P2.etat === 'prise' && P2.sh && chromaArt425(el.querySelector('.pe-prise img'), BY[P2.id].no), 0);
  paintOverlay('peche', {
    etat: P2.etat,
    id: P2.id,
    sh: P2.sh,
    dom: P2.dom,
    connu: !!P2.id && PROFILE.box.includes(P2.id),
    route: routeName(),
    peches: PROFILE.peches || 0
  });
}


function fishingBattle418() {
  const P2 = FISHING;
  if (!P2 || P2.etat !== 'prise') return;
  $('#peche418').hidden = true;
  __set_wildId(P2.id);
  const D = wildScen(P2.id, TOD, P2.sh, P2.dom);
  Object.assign(D, { water: ['4,0', '5,0', '6,0', '5,1', '6,1', '7,1', '6,3', '7,3', '5,4', '6,4', '7,5'], lvl: D.lvl.replace(/rencontre|Dominant/, P2.dom ? 'pêche · Dominant' : 'pêche') });
  D.foes = D.foes.map(f => [f[0], f[0] === P2.id ? [6, 2] : [7, 4], f[2]]);
  FISHING = null;
  __set_scSel('sauvage');
  go('combat');
  if (!squad.length) {
    renderPrep();
    return void toast('Recrutez au moins un Pokémon avant de combattre.');
  }
  launch();
}


function poolSafari418() {
  return poolRegion421(1); // the Safari Park is in Kanto: the Kanto families (v4.21)
}


function safariEncounter418() {
  const L = poolSafari418(),
    w = L.map(m => (1 + RC(m.id)) * (!PROFILE.box.includes(m.id) ? 2 : 1)),
    m = draw418(L, w);
  return { id: m.id, sh: Math.random() < SHINY_RATE * multChroma() * 2, appat: 0, caillou: 0 };
}


function safariEnter418() {
  if (safariLock418()) return void toast(safariLock418());
  if (!PROFILE.safari) {
    if (PROFILE.money < SAFARI_PRICE) return void toast('Il faut 500 ₽ pour entrer.');
    PROFILE.money -= SAFARI_PRICE;
    PROFILE.safari = { pas: SAFARI_STEPS, balls: SAFARI_BALLS, pris: [], enc: null };
    renderWallet();
    queueSave();
  }
  SAF_MSG = 'Bienvenue au Parc Safari ! Avancez dans les herbes hautes.';
  renderSafari418();
  $('#safari418').hidden = false;
}


/** An action in the Park; returns the message (testable without display). */
function safariAction418(a) {
  const S2 = PROFILE.safari;
  if (!S2) return '';
  const x = S2.enc;
  let msg = '';
  if (a === 'marcher') {
    if (x || S2.pas <= 0) return '';
    S2.pas--;
    S2.enc = safariEncounter418();
    const m = BY[S2.enc.id];
    msg = S2.enc.sh ? `${SPARK} Un ${m.n} chromatique sort des herbes !` : `Un ${m.n} sauvage apparaît !`;
  } else if (x && a === 'ball') {
    if (S2.balls <= 0) return '';
    S2.balls--;
    if (Math.random() < capt418(x)) {
      const nw = take418(x.id, x.sh);
      S2.pris.push(x.id);
      PROFILE.safariPris = (PROFILE.safariPris || 0) + 1;
      msg = `Gotcha ! ${BY[x.id].n} est capturé${nw ? ' et rejoint votre Box' : ''}.`;
      S2.enc = null;
    } else msg = `Raté ! ${BY[x.id].n} s’est libéré.`;
  } else if (x && a === 'appat') {
    x.appat = 2;
    x.caillou = 0;
    msg = `${BY[x.id].n} grignote l’appât : il est moins pressé de partir.`;
  } else if (x && a === 'caillou') {
    x.caillou = 2;
    x.appat = 0;
    msg = `${BY[x.id].n} est sonné : plus facile à attraper, mais il s’agace.`;
  } else if (x && a === 'fuir') {
    S2.enc = null;
    msg = 'Vous laissez le Pokémon tranquille.';
  }
  // the Pokémon may flee after an action
  if (S2.enc && x && a !== 'marcher' && a !== 'fuir') {
    if (Math.random() < flee418(x)) {
      msg += ` ${BY[x.id].n} s’enfuit !`;
      S2.enc = null;
    } else {
      if (x.appat > 0 && a !== 'appat') x.appat--;
      if (x.caillou > 0 && a !== 'caillou') x.caillou--;
    }
  }
  if (!S2.enc && (S2.pas <= 0 || S2.balls <= 0)) {
    msg += ` La visite est terminée : ${S2.pris.length} capture${S2.pris.length > 1 ? 's' : ''}.`;
    S2.fini = true;
  }
  queueSave();
  return msg;
}


function renderSafari418() {
  const S2 = PROFILE.safari,
    el = $('#safari418');
  if (!S2) {
    el.hidden = true;
    return;
  }
  const x = S2.enc;
  // rendered by src/screens/overlays/Safari418.jsx
  paintOverlay('safari', {
    pas: S2.pas,
    balls: S2.balls,
    pris: S2.pris.length,
    fini: !!S2.fini,
    x: x ? { id: x.id, sh: x.sh } : null,
    hum: x ? (x.appat ? 'Il mange l’appât' : x.caillou ? 'Il est agacé' : flee418(x) > 0.25 ? 'Il est méfiant' : 'Il vous observe') : '',
    capt: x ? capt418(x) : 0,
    fuite: x ? flee418(x) : 0,
    msg: SAF_MSG
  });
}


// Safari Park panel on the map: src/screens/map/MapInfo.jsx (SafariInfo).


/** End of the co-op turn: Player 1 hands over to Player 2. Returns true if control was handed over. */
export function coopPass418() {
  if (!B || !B.coop || B.coop !== 1 || ui.busy || B.over || B.phase !== 'player' || !coopAlive418(B, 2)) return false;
  B.coop = 2;
  ui.sel = null;
  ui.selE = null;
  ui.mode = null;
  clearAim();
  const nx = B.units.find(x => x.side === 'a' && !x.ko && !x.acted && player418(x) === 2);
  ui.sel = nx ? nx.uid : null;
  log('Au tour du Joueur 2.', 'sys');
  toast('Au tour du Joueur 2 !');
  vibe(30);
  renderAll();
  return true;
}

const draw418 = (L, w) => {
  let r = Math.random() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < L.length; i++) {
    r -= w[i];
    if (r <= 0) return L[i];
  }
  return L[L.length - 1];
};


export const safariLock418 = () => (isCamp() && BADGES.length < 2 ? 'Le Parc Safari ouvre après votre 2e badge.' : null);


const capt418 = x => {
  const base = Math.max(0.08, Math.min(0.45, 0.5 - 0.06 * RC(x.id)));
  return Math.min(0.9, base * (x.caillou ? 1.6 : 1) * (x.appat ? 0.8 : 1));
};


const flee418 = x => {
  const base = Math.max(0.08, Math.min(0.35, 0.06 + 0.04 * BY[x.id].s[3]));
  return Math.min(0.85, base * (x.appat ? 0.5 : 1) * (x.caillou ? 1.6 : 1));
};


/* =====================================================================
   3. 2-player co-op
   ===================================================================== */
/** Player 1: the first 2 Pokémon of the team; Player 2: the others. */
export const player418 = u => (+String(u.uid).slice(1) < 2 ? 1 : 2);


export const coopAlive418 = (S, j) => S.units.some(u => u.side === 'a' && !u.ko && player418(u) === j);

// Statements run at startup, in the original order (see index.js).
export function __init() {


FISHING = null;


// #peche418: rendered by React (src/screens/overlays/Fishing418.jsx)


document.addEventListener('click', e => {
  if (e.target.closest('[data-peche417]')) return void fishingCast418();
  const b = e.target.closest('[data-peche418]');
  if (!b) {
    if (e.target.id === 'peche418') {
      clearTimeout(FISHING && FISHING.t);
      FISHING = null;
      $('#peche418').hidden = true;
    }
    return;
  }
  const k = b.dataset.peche418;
  if (k === 'ferrer') fishingHookSet418();
  else if (k === 'lancer') fishingCast418();
  else if (k === 'combat') fishingBattle418();
  else if (k === 'recruter' && FISHING && !squad.includes(FISHING.id)) {
    toggle(FISHING.id);
    $('#peche418').hidden = true;
  } else if (k === 'relacher') {
    toast('Il retourne à l’eau.');
    fishingCast418();
  } else if (k === 'x') {
    clearTimeout(FISHING && FISHING.t);
    FISHING = null;
    $('#peche418').hidden = true;
  }
});


/* =====================================================================
   2. Safari Park
   ===================================================================== */
SAFARI_PRICE = 500,
  SAFARI_STEPS = 12,
  SAFARI_BALLS = 20;


PLACES.push({ id: 'safari', x: 535, y: 405, n: 'Parc Safari', s: 'Captures sans combat · appâts et cailloux', grp: 'entrainement' });


PL.safari = PLACES[PLACES.length - 1];


SAF_MSG = '';


// #safari418: rendered by React (src/screens/overlays/Safari418.jsx)


document.addEventListener('click', e => {
  if (e.target.closest('[data-safari418-entrer]')) return void safariEnter418();
  const b = e.target.closest('[data-safari418]');
  if (!b) {
    if (e.target.id === 'safari418') $('#safari418').hidden = true;
    return;
  }
  const k = b.dataset.safari418;
  if (k === 'x') return void ($('#safari418').hidden = true);
  if (k === 'sortir') {
    const n = PROFILE.safari ? PROFILE.safari.pris.length : 0;
    PROFILE.safari = null;
    queueSave();
    $('#safari418').hidden = true;
    toast(`Merci de votre visite ! ${n} capture${n > 1 ? 's' : ''}.`);
    try {
      refreshMap(); // panel of the selected location (src/screens/map/MapInfo.jsx)
    } catch (er) {}
    return;
  }
  SAF_MSG = safariAction418(k);
  if (/Gotcha/.test(SAF_MSG)) {
    sfx('win');
    vibe(40);
  }
  renderSafari418();
});


HOOKS.combat.push((S, opt, D0) => {
  if (!PREF.coop || S.ordre === 'vitesse' || (D0 && (D0.tuto || D0.duel433))) return;
  if (S.units.filter(u => u.side === 'a').length < 2 || !opt || opt.robot) return;
  S.coop = coopAlive418(S, 1) ? 1 : 2;
});


HOOKS.avantFinManche.push(S => {
  if (S.coop) S.coop = coopAlive418(S, 1) ? 1 : 2;
});
}
