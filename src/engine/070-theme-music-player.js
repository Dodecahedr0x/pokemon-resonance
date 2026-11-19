/* Section d'origine : v4.35 : musiques par thème (lecteur de pistes) */

import { $ } from './014-utils.js';
import { cur } from './016-navigation.js';
import { B } from './024-combat-ui.js';
import { PREF } from './026-campaign-tutorial-sound.js';
import { MUS, musPadLevel, musPadStop, musStartCore } from './030-prestige-staging.js';
import { V4 } from './032-v4-foundation.js';
import { IM448 } from './079-immersion-sound-haptics.js';
import { OFF462 } from './093-chronicles-chapters.js';

export let BGM434;


function bgmOk434() {
  return !/jsdom/i.test(navigator.userAgent || '') && typeof Audio !== 'undefined' && BGM434.failed < 2;
}


function bgmEl434(k) {
  let a = BGM434.el[k];
  if (a) return a;
  try {
    a = new Audio();
    a.preload = 'none';
    a.loop = !['victoire', 'badge', 'evolution'].includes(k);
    a.volume = 0;
    a.setAttribute('playsinline', '');
    a.addEventListener('error', () => {
      BGM434.failed++;
      if (BGM434.failed >= 2 && BGM434.on) {
        // pistes introuvables : retour à la nappe d’ambiance
        BGM434.on = false;
        try {
          MUS.on = false;
          musStartCore();
        } catch (e) {}
      }
    });
    a.src = OFF462.urls[k] || BGM434.src[k];
    BGM434.el[k] = a;
  } catch (e) {
    a = null;
  }
  return a;
}


function bgmVol434() {
  return Math.max(0, Math.min(1, 0.85 * (PREF.musVol === undefined ? 0.7 : PREF.musVol)));
}


function bgmFade434(a, to, ms, done) {
  if (!a) return;
  clearInterval(a._f);
  const from = a.volume,
    t0 = Date.now();
  a._f = setInterval(() => {
    const p = Math.min(1, (Date.now() - t0) / Math.max(1, ms));
    try {
      a.volume = Math.max(0, Math.min(1, from + (to - from) * p));
    } catch (e) {}
    if (p >= 1) {
      clearInterval(a._f);
      if (done) done();
    }
  }, 50);
}


function bgmPlay434(a) {
  try {
    const p = a.play();
    if (p && p.catch) p.catch(() => {});
  } catch (e) {}
}


/* Combats : arène → medley des Champions d’arène · Conseil / Maîtres → combat de Champion · adversaires nommés et duels → combat de dresseur · le reste → combat sauvage */
function bgmCombat434(sc) {
  sc = String(sc || '');
  if (/^(a|j|h)[1-8]$/.test(sc)) return 'arene';
  if (/^(c[1-4]|champ)$/.test(sc)) return 'rouge'; // v4.49 : Ligue Indigo = Combat contre Rouge
  if (/^(jchamp|hchamp)$/.test(sc)) return 'champion';
  if (/^(duel433|ligue|tdr|ami|tuto|td\d|jd\d|hd\d+|rv\d|enig.*)$/.test(sc)) return 'dresseur';
  return 'combat';
}


function bgmScene434() {
  if (B && !$('#cbBattle').hidden) {
    const c = bgmCombat434(B.sc);
    if (c === 'rouge' || c === 'champion' || B.over) return c;
    // v4.49 : un allié presque K.O. (≤ 25 %) fait passer à la piste « PV bas » ; retour quand tous remontent au-dessus de 35 %
    const al = B.units.filter(u => u.side === 'a' && !u.ko);
    if (al.some(u => u.hp / u.mhp <= 0.25)) B._pv449 = 1;
    else if (!al.some(u => u.hp / u.mhp <= 0.35)) B._pv449 = 0;
    return B._pv449 && IM448() ? 'pvbas' : c;
  }
  if (cur === 'accueil') return 'accueil';
  if (cur === 'combat') return 'combats'; // v4.47 : menu Combats = Cyclisme
  if (cur === 'carte') return 'carte'; // Route 1
  if (cur === 'types') return 'guide'; // Laboratoire du Prof. Chen
  if (cur === 'sac' && V4.sacV === 'boutique') return 'boutique';
  if (cur === 'pokedex' || cur === 'dex') return 'centre';
  if (cur === 'camp') {
    const t = V4.campTab;
    if (t === 'enigmes' || t === 'echo') return 'ruines';
    if (t === 'arenes') return 'arene';
    if (t === 'maitrise' || t === 'pantheon') return 'gloire';
    if (t === 'duel') return 'dresseur';
  }
  return 'camp';
}


function bgmSync434() {
  if (!BGM434.on || !PREF.music) return;
  const sc = bgmScene434();
  if (!BGMC434.includes(sc) || !(B && !$('#cbBattle').hidden)) BGM434.silent = false;
  if (BGM434.jingle) return;
  const want = BGM434.silent || !BGM434.vis ? '' : sc;
  if (want === BGM434.scene && (!want || !BGM434.el[want] || !BGM434.el[want].paused)) {
    if (want) bgmFade434(BGM434.el[want], bgmVol434(), 200);
    return;
  }
  const old = BGM434.el[BGM434.scene];
  if (old) bgmFade434(old, 0, 900, () => { if (BGM434.scene !== old._k) try { old.pause(); } catch (e) {} });
  BGM434.scene = want;
  if (!want) return;
  const a = bgmEl434(want);
  if (!a) return;
  a._k = want;
  bgmPlay434(a);
  bgmFade434(a, bgmVol434(), 1100);
}


export function musStart() {
  if (!PREF.music) return;
  if (!bgmOk434()) {
    musStartCore();
    return;
  }
  if (BGM434.on) {
    bgmSync434();
    return;
  }
  BGM434.on = true;
  MUS.on = true; // empêche la nappe de démarrer en plus
  clearInterval(BGM434.tmr);
  BGM434.tmr = setInterval(bgmSync434, 800);
  bgmSync434();
}


function bgmStop434() {
  BGM434.on = false;
  MUS.on = false;
  clearInterval(BGM434.tmr);
  Object.keys(BGM434.el).forEach(k => {
    const a = BGM434.el[k];
    bgmFade434(a, 0, 600, () => {
      try {
        a.pause();
      } catch (e) {}
    });
  });
  BGM434.scene = '';
  BGM434.jingle = false;
  try {
    musPadStop();
  } catch (e) {}
}


/* jingle (victoire, badge, évolution) par-dessus la musique du moment. max = durée en secondes (0 = en entier), suite = jingle enchaîné */
function jingle434(max, k, next) {
  k = k || 'victoire';
  if (!PREF.music || !BGM434.on || !bgmOk434() || BGM434.jingle) return;
  const j = bgmEl434(k);
  if (!j) return;
  BGM434.jingle = true;
  const cur0 = BGM434.el[BGM434.scene];
  if (cur0) bgmFade434(cur0, 0, 400, () => { try { cur0.pause(); } catch (e) {} });
  try {
    j.currentTime = 0;
  } catch (e) {}
  bgmPlay434(j);
  bgmFade434(j, bgmVol434(), 250);
  BGM434.jk = k;
  const endStep = () => {
    j.removeEventListener('ended', endStep);
    clearTimeout(j._t);
    bgmFade434(j, 0, 500, () => {
      try {
        j.pause();
      } catch (e) {}
    });
    BGM434.jingle = false;
    BGM434.scene = '';
    if (next) {
      jingle434(0, next);
      if (BGM434.jingle) return;
    }
    if (k === 'victoire' || k === 'badge') {
      if (BGMC434.includes(bgmScene434()) && B && B.over) BGM434.silent = true; // le résultat reste au calme
    }
    setTimeout(bgmSync434, 600);
  };
  j.addEventListener('ended', endStep);
  if (max) j._t = setTimeout(endStep, max * 1000);
}


/* Interrupteur Musique, curseur de volume et reprise au toucher passent par ces trois fonctions. */
export function musStop() {
  if (BGM434.on) bgmStop434();
  else musPadStop();
}


export function musLevel() {
  if (BGM434.on) {
    const a = BGM434.el[BGM434.jingle ? BGM434.jk : BGM434.scene];
    if (a) bgmFade434(a, bgmVol434(), 150);
  } else musPadLevel();
}


/* jingle associé à un effet sonore (appelé par sfx) */
export function sfxJingle(n) {
  if (n === 'win' && !(B && B.over)) jingle434(7);
  else if (n === 'evo') jingle434(10, 'evolution');
}

const BGMC434 = ['combat', 'arene', 'champion', 'dresseur', 'rouge', 'pvbas'];

// Instructions exécutées au démarrage, dans l'ordre d'origine (voir index.js).
export function __init() {

/* Accueil : générique S1 · Camp, potager et le reste : Route 201 · Combat : combat sauvage · Boutique : Pokémart · Victoire : jingle RSE.
   Les pistes sont des fichiers à côté de la page (audio/…). Si elles sont introuvables (fichier hors ligne), la nappe d’ambiance reste utilisée. */
BGM434 = {
  src: Object.fromEntries(['accueil', 'camp', 'combat', 'boutique', 'victoire', 'arene', 'champion', 'dresseur', 'ruines', 'centre', 'gloire', 'badge', 'evolution', 'combats', 'carte', 'guide', 'rouge', 'pvbas'].map(k => [k, 'audio/' + k + '.mp3'])),
  el: {},
  scene: '',
  on: false,
  failed: 0,
  jingle: false,
  silent: false, // après une victoire : on laisse l’écran de résultat au calme
  tmr: 0,
  vis: true
};


if (PREF.music === undefined) PREF.music = false;

 // nouvelle installation : musique coupée (réglable dans Paramètres)
/* victoire : fiche de résultat gagnée, capture réussie, récompense de quête */
(function () {
  const r = document.getElementById('cbResult');
  if (r && window.MutationObserver)
    new MutationObserver(() => {
      if (!r.hidden && r.querySelector('.res-card.win')) {
        if (!r._j434) {
          r._j434 = true;
          jingle434(0, 'victoire', B && B.rew && B.rew.badgeNew ? 'badge' : '');
        }
      } else r._j434 = false;
    }).observe(r, { attributes: true, attributeFilter: ['hidden'], childList: true });
})();


document.addEventListener('visibilitychange', () => {
  BGM434.vis = !document.hidden;
  if (!BGM434.on) return;
  if (document.hidden) Object.keys(BGM434.el).forEach(k => { try { BGM434.el[k].pause(); } catch (e) {} });
  else {
    BGM434.scene = '';
    bgmSync434();
  }
});

}
