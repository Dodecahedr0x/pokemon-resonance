/* Section d'origine : 10-accueil-route.js */

import { BY } from './009-03-pokemon.js';
import { PROFILE, isCamp } from './011-05-etat-de-partie.js';
import { $, RM, toast } from './014-08-outils.js';
import { crochet } from './015-v4-8-00-crochets.js';
import { hideEnc, showEnc } from '../screens/overlays/shellOverlays.js';
import { setRoute } from '../screens/accueil/accueilStore.js';
import { go } from './016-09-navigation.js';
import { nextOf, openSheet, squad, toggle } from './020-13-equipe-cartes.js';
import { wildScen } from './022-15-systemes-objets-liens-ia.js';
import { B, __set_scSel, launch, log } from './024-17-interface-combat.js';
import { renderPrep } from './026-20-campagne-tutoriel-son.js';
import { SHINY_RATE, __set_wildShiny, wildShiny } from './043-v4-4-01-aventure-plus.js';
import { multChroma, poidsSaison } from './050-v4-11-01-monde.js';
import { routeNom } from './054-v4-15-01-johto.js';
import { __set_wildDom416, domTirage416, wildDom416 } from './055-v4-16-01-johto-vivant.js';
import { domJour417 } from './057-v4-17-01-compagnons-et-resonance.js';
import { poolRegion421 } from './061-v4-21-01-capture-partout.js';
import { chromaArt425 } from './062-v4-25-01-direction-artistique.js';
import { rareW450 } from './080-v4-50-avatar-de-dresseur-rencontres-rares-heure.js';
import { nzRencontre450 } from './081-v4-51-mode-nuzlocke-option.js';

export let TOD;
let dlgT, wildId;
export function __set_wildId(v) { return (wildId = v); }


/* ===================== ACCUEIL v0.8 : blason, route, anatomie ===================== */
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


/* le décor de la route (ancien buildRoute) est rendu par React : src/screens/accueil/Route.jsx */
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
  setRoute({ tod: t, pressed: true }); // data-time de #route, bouton pressé (Route.jsx)
  typeDlg(TODTXT[t].replace('Route 29', routeNom()));
  crochet('heure', t);
}


export function encounter() {
  if (!nzRencontre450()) return;
  const pool = poolRegion421(); // chaque famille dans sa région : Route 29, Route 32, Route 104 (v4.21)
  const w = pool.map(
    m =>
      (m.t.some(t => WILDW[TOD].includes(t)) ? 4 : 1) *
      (!PROFILE.box.includes(m.id) ? 3 : 1) *
      poidsSaison(m) * rareW450(m) * // v4.50 : rencontres rares (heure, météo)
      // événement de saison (v4.11)
      (m.id === domJour417() ? 2 : 1) // Dominant signalé au Pokématos (v4.17)
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
  __set_wildDom416(domTirage416(pick.id)); // Pokémon Dominant (v4.16)
  __set_wildShiny(Math.random() < SHINY_RATE * multChroma()); // rare : un Pokémon chromatique (×2 le Week-end chromatique, v4.11)
  const path = evoPath(pick.id);
  $('#route').classList.remove('shake');
  void $('#route').offsetWidth;
  $('#route').classList.add('shake');
  setTimeout(
    () => {
      // fiche de rencontre (#enc) : rendue par React (src/screens/overlays/Enc.jsx)
      showEnc({ pick, shiny: wildShiny, dom: wildDom416, route: routeNom(), tod: TOD, inBox: PROFILE.box.includes(pick.id), camp: isCamp(), path });
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

/* rencontres sauvages */
const WILDW = {
  matin: ['Plante', 'Insecte', 'Vol', 'Fée'],
  jour: ['Eau', 'Feu', 'Électrik', 'Normal', 'Combat', 'Roche'],
  nuit: ['Spectre', 'Ténèbres', 'Poison', 'Psy']
};

// Instructions exécutées au démarrage, dans l'ordre d'origine (voir index.js).
export function __init() {

TOD = nowTod();


dlgT = null;


// La route est rendue par React (dans la page Carte) : écouteurs délégués.
document.addEventListener('click', e => {
  const b = e.target.closest('#todBtns [data-tod]');
  if (b) setTod(b.dataset.tod);
});


setTod(TOD);


wildId = null;


document.addEventListener('click', e => {
  if (e.target.closest('#rustle, #rtAlert')) encounter();
});


// ResizeObserver sur #route : posé par Route.jsx au montage.
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
      log(
        `Capture : touchez ${BY[wildId].n} pour voir les conditions (PV bas, immobilisé, un allié au contact, 2 Voix, une Ball).`,
        'sys'
      );
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


/* anatomie d’un Éveil, chiffres, piliers et règles : rendus par le Guide React (Bases.jsx, Projet.jsx) */
}
