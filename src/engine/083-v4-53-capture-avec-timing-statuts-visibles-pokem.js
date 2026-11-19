/* Section d'origine : v4.53 : capture avec timing · statuts visibles · Pokémon qui réagit */

import { PROFILE } from './011-05-etat-de-partie.js';
import { RM, toast } from './014-08-outils.js';
import { CROCHETS } from './015-v4-8-00-crochets.js';
import { tokCl, unitsDirty } from '../screens/combat/board/boardStore.js';
import { byUid } from './021-14-moteur-combat.js';
import { canCapture } from './022-15-systemes-objets-liens-ia.js';
import { B, L, renderAll, ui } from './024-17-interface-combat.js';
import { PREF, savePref, sfx, vibe } from './026-20-campagne-tutoriel-son.js';
import { AUTO } from './030-24-prestige-mise-en-scene.js';
import { CAP_K, bagN } from './032-v4-00-socle.js';
import { renderWallet } from './035-v4-03-interface.js';
import { renderParams } from './040-v4-08-parametres.js';
import { fermer, majTemp, ouvrir } from '../screens/overlays/tempStore.js';
import { FX448 } from './079-v4-48-immersion-sons-par-type-cris-vibrations-en.js';

let CAPOK453;


/* ---------- 1. statuts visibles et réactions sur les jetons ---------- */
function stKey453(u) {
  if (u.ko) return '';
  if (u.badge === 'GEL') return 'gel';
  if (u.badge === 'PAR') return 'par';
  if (u.badge === 'SOM') return 'som';
  if (u.bru > 0) return 'bru';
  if (u.psn > 0) return 'psn';
  if (u.root > 0 || u.web > 0) return 'rac';
  return '';
}


// le groupe .st453 (bulles, éclair, glaçons, « z ») est rendu par Units.jsx (St453)


export function timing453(cb) {
  // jauge rendue par React (src/screens/overlays/temporaires/Ct453.jsx) ; l'anneau est animé ici
  const o = ouvrir('ct453', { q: null });
  const g = o.querySelector('.ct453-g');
  const T0 = performance.now(),
    DUR = 1500;
  let done = false,
    raf = 0;
  const frame = () => {
    const p = Math.min(1, (performance.now() - T0) / DUR);
    g.style.transform = `translate(-50%,-50%) scale(${(1.15 - p * 1.0).toFixed(3)})`;
    if (p >= 1) return fin(null);
    raf = requestAnimationFrame(frame);
  };
  const quality = () => {
    const p = Math.min(1, (performance.now() - T0) / DUR),
      s = 1.15 - p * 1.0,
      d = Math.abs(s - 0.5);
    return d <= 0.07 ? 'perfect' : d <= 0.2 ? 'ok' : 'miss';
  };
  const fin = q => {
    if (done) return;
    done = true;
    cancelAnimationFrame(raf);
    q = q || 'miss';
    if (o.isConnected) majTemp('ct453', { q }); // texte et classe res-…
    sfx(q === 'miss' ? 'lose' : 'rx');
    vibe(q === 'perfect' ? [30, 40, 60] : q === 'miss' ? [60] : 25);
    setTimeout(
      () => {
        fermer(o);
        cb(q);
      },
      q === 'skip' ? 0 : 650
    );
  };
  o.querySelector('.ct453-b').addEventListener('click', () => fin(quality()));
  o.querySelector('.ct453-s').addEventListener('click', () => fin('skip'));
  o.addEventListener('keydown', e => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      fin(quality());
    }
  });
  raf = requestAnimationFrame(frame);
  o.querySelector('.ct453-b').focus();
}

const CAPT453 = () => PREF.capT453 !== 0 && !RM && !AUTO;

// Instructions exécutées au démarrage, dans l'ordre d'origine (voir index.js).
export function __init() {

CROCHETS.jeton.push(u => {
  const T = L.u[u.uid];
  if (!T) return;
  T.st = true; // groupe .st453 du jeton (Units.jsx)
  T.s453 = FX448() ? stKey453(u) : ''; // data-s453
  tokCl(T, 'low453', FX448() &&!u.ko && u.hp / u.mhp <= 0.25);
  unitsDirty();
});


/* ---------- 2. capture avec timing ---------- */
CAPOK453 = false;


document.addEventListener(
  'click',
  e => {
    const b = e.target.closest && e.target.closest('[data-cap]');
    if (!b || CAPOK453 || !CAPT453() || !B || document.getElementById('ct453')) return;
    const al = byUid(B, ui.sel),
      en = byUid(B, b.dataset.cap);
    if (!canCapture(B, al, en)) return; // les règles habituelles s’appliquent d’abord
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    timing453(q => {
      if (q === 'miss') {
        // la Ball rebondit : elle est perdue, mais l’allié n’a pas agi et les Voix sont gardées
        const k = CAP_K;
        PROFILE.bag[k] = Math.max(0, bagN(k) - 1);
        if (!PROFILE.bag[k]) delete PROFILE.bag[k];
        toast('La Ball rebondit ! Réessayez si vous en avez une autre.');
        renderWallet();
        renderAll();
        return;
      }
      const k = CAP_K;
      CAPOK453 = true;
      try {
        b.click();
      } catch (er) {}
      CAPOK453 = false;
      if (q === 'perfect') {
        PROFILE.bag[k] = bagN(k) + 1; // Ball rendue
        renderWallet();
        toast('Lancer parfait : la Ball vous est rendue.');
      }
    });
  },
  true
);


/* ---------- 3. réglages ---------- */
// panneau « Capture avec timing » : rendu par React (src/screens/settings/panels/CaptureTiming.jsx)


document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('[data-b453]');
  if (!b) return;
  if (b.dataset.b453 === 'cap') {
    PREF.capT453 = PREF.capT453 === 0 ? 1 : 0;
    savePref();
    renderParams();
  }
});

}
