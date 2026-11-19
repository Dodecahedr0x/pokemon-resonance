/* Original section: 10-home-route.js */

import { BY } from './009-pokemon.js';
import { PROFILE, isCamp } from './011-game-state.js';
import { $, RM, toast } from './014-utils.js';
import { hook } from './015-hooks.js';
import { hideEnc, showEnc } from '../screens/overlays/shellOverlays.js';
import { setRoute } from '../screens/home/homeStore.js';
import { go } from './016-navigation.js';
import { nextOf, openSheet, squad, toggle } from './020-team-cards.js';
import { wildScen } from './022-items-bonds-ai.js';
import { B, __set_scSel, launch, log } from './024-combat-ui.js';
import { renderPrep } from './026-campaign-tutorial-sound.js';
import { SHINY_RATE, __set_wildShiny, wildShiny } from './043-adventure-plus.js';
import { multChroma, seasonWeight } from './050-world.js';
import { routeName } from './054-johto.js';
import { __set_wildDom416, domDraw416, wildDom416 } from './055-living-johto.js';
import { domDay417 } from './057-companions-resonance.js';
import { poolRegion421 } from './061-catch-anywhere.js';
import { chromaArt425 } from './062-art-direction.js';
import { rareW450 } from './080-trainer-avatar-rare-encounters.js';
import { nzEncounter450 } from './081-nuzlocke-mode.js';

export let TOD;
let dlgT, wildId;
export function __set_wildId(v) { return (wildId = v); }


/* ===================== HOME v0.8: crest, route, anatomy ===================== */
export function evoPath(id) {
  const m = BY[id],
    n = nextOf(m);
  if (!n.length) return '';
  if (n.length === 1) {
    const r = evoPath(n[0]);
    return BY[n[0]].n + (r ? ' → ' + r : '');
  }
  const ns = n.map(x => BY[x].n);
  return ns.slice(0, -1).join(', ') + ' ou ' + ns[ns.length - 1];
}


/* route 29 */
function nowTod() {
  const h = new Date().getHours();
  return h >= 4 && h < 10 ? 'matin' : h >= 10 && h < 18 ? 'jour' : 'nuit';
}


/* the route backdrop (old buildRoute) is rendered by React: src/screens/home/Route.jsx */
function typeDlg(s) {
  const p = $('#dlgTxt');
  if (!p) return;
  clearInterval(dlgT);
  if (RM) {
    p.textContent = s;
    return;
  }
  let i = 0;
  p.textContent = '';
  dlgT = setInterval(() => {
    i += 2;
    p.textContent = s.slice(0, i);
    if (i >= s.length) clearInterval(dlgT);
  }, 22);
}


export function setTod(t) {
  TOD = t;
  setRoute({ tod: t, pressed: true }); // data-time of #route, pressed button (Route.jsx)
  typeDlg(TODTXT[t].replace('Route 29', routeName()));
  hook('heure', t);
}


export function encounter() {
  if (!nzEncounter450()) return;
  const pool = poolRegion421(); // each family in its region: Route 29, Route 32, Route 104 (v4.21)
  const w = pool.map(
    m =>
      (m.t.some(t => WILDW[TOD].includes(t)) ? 4 : 1) *
      (!PROFILE.box.includes(m.id) ? 3 : 1) *
      seasonWeight(m) * rareW450(m) * // v4.50: rare encounters (time, weather)
      // seasonal event (v4.11)
      (m.id === domDay417() ? 2 : 1) // Dominant flagged on the Pokématos (v4.17)
  );
  let r = Math.random() * w.reduce((a, b) => a + b, 0),
    pick = pool[0];
  for (let i = 0; i < pool.length; i++) {
    r -= w[i];
    if (r <= 0) {
      pick = pool[i];
      break;
    }
  }
  if (pick.id === wildId && pool.length > 1) pick = pool[(pool.indexOf(pick) + 3) % pool.length];
  wildId = pick.id;
  __set_wildDom416(domDraw416(pick.id)); // Dominant Pokémon (v4.16)
  __set_wildShiny(Math.random() < SHINY_RATE * multChroma()); // rare: a shiny Pokémon (×2 on Shiny Weekend, v4.11)
  const path = evoPath(pick.id);
  $('#route').classList.remove('shake');
  void $('#route').offsetWidth;
  $('#route').classList.add('shake');
  setTimeout(
    () => {
      // encounter sheet (#enc): rendered by React (src/screens/overlays/Enc.jsx)
      showEnc({ pick, shiny: wildShiny, dom: wildDom416, route: routeName(), tod: TOD, inBox: PROFILE.box.includes(pick.id), camp: isCamp(), path });
      if (wildShiny) chromaArt425($('#enc .enc-cr img'), pick.no); // v4.25
      const f = $('#enc [data-enc="take"]');
      if (f) f.focus();
    },
    RM ? 0 : 520
  );
}


export function placeAlert() {
  const svg = $('#routeSvg'),
    al = $('#rtAlert'),
    R = $('#route');
  if (!svg || !al || !svg.getScreenCTM || !svg.createSVGPoint) return;
  const m = svg.getScreenCTM();
  if (!m) return;
  const pt = svg.createSVGPoint();
  pt.x = 860;
  pt.y = 150;
  const sp = pt.matrixTransform(m),
    r = R.getBoundingClientRect();
  if (!r.width) return;
  al.style.left = (sp.x - r.left).toFixed(0) + 'px';
  al.style.top = (sp.y - r.top).toFixed(0) + 'px';
  al.classList.add('on');
}

const TODTXT = {
  matin: 'Le matin se lève sur la Route 29. Plante, Insecte et Vol sortent les premiers. Les herbes bougent…',
  jour: 'Il fait jour sur la Route 29. Quelque chose bouge dans les hautes herbes. Touchez-les.',
  nuit: 'La nuit tombe sur la Route 29. Spectres et Pokémon Ténèbres rôdent dans les herbes.'
};

/* wild encounters */
const WILDW = {
  matin: ['Plante', 'Insecte', 'Vol', 'Fée'],
  jour: ['Eau', 'Feu', 'Électrik', 'Normal', 'Combat', 'Roche'],
  nuit: ['Spectre', 'Ténèbres', 'Poison', 'Psy']
};

// Startup statements, run in their original order (see index.js).
export function __init() {

TOD = nowTod();


dlgT = null;


// The route is rendered by React (inside the Map page): delegated listeners.
document.addEventListener('click', e => {
  const b = e.target.closest('#todBtns [data-tod]');
  if (b) setTod(b.dataset.tod);
});


setTod(TOD);


wildId = null;


document.addEventListener('click', e => {
  if (e.target.closest('#rustle, #rtAlert')) encounter();
});


// ResizeObserver on #route: set by Route.jsx on mount.
if (!window.ResizeObserver) window.addEventListener('resize', placeAlert);


placeAlert();


document.addEventListener('keydown', e => {
  if (!e.target.closest || !e.target.closest('#rustle')) return;
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    encounter();
  }
});


$('#enc').addEventListener('click', e => {
  const b = e.target.closest('[data-enc]');
  if (!b) {
    if (e.target.id === 'enc') hideEnc();
    return;
  }
  const a = b.dataset.enc;
  hideEnc();
  if (a === 'take' && wildId && !squad.includes(wildId)) toggle(wildId);
  if (a === 'fight' && wildId) {
    wildScen(wildId, TOD, wildShiny, wildDom416);
    __set_scSel('sauvage');
    go('combat');
    if (!squad.length) {
      renderPrep();
      toast('Recrutez au moins un Pokémon avant de combattre.');
      return;
    }
    launch();
    if (B && !B.noCatch)
      {log(
        `Capture : touchez ${BY[wildId].n} pour voir les conditions (PV bas, immobilisé, un allié au contact, 2 Voix, une Ball).`,
        'sys'
      );}
  }
  if (a === 'dex' && wildId) {
    go('pokedex');
    openSheet(wildId);
  }
  if (a === 'run') typeDlg('Vous avez pris la fuite. Les herbes bougent encore…');
});


document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !$('#enc').hidden) hideEnc();
});


/* anatomy of an Awakening, digits, pillars and rules: rendered by the React Guide (Basics.jsx, Project.jsx) */
}
