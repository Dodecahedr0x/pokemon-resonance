/* Section d'origine : v4.35 : musiques par thème (lecteur de pistes) */

import { $ } from './014-08-outils.js';
import { cur } from './016-09-navigation.js';
import { B } from './024-17-interface-combat.js';
import { PREF, __set_sfx, sfx } from './026-20-campagne-tutoriel-son.js';
import { MUS, __set_musStart, __set_musStop, musStart, musStartCore, musStop } from './030-24-prestige-mise-en-scene.js';
import { V4 } from './032-v4-00-socle.js';
import { __set_musLevel, musLevel } from './040-v4-08-parametres.js';
import { NEWS416 } from './056-v4-16-1-01-finitions.js';
import { IM448 } from './079-v4-48-immersion-sons-par-type-cris-vibrations-en.js';

export let BGM434;
let BGMC434, musLevelOld434, sfxOld434;
export function __set_bgmEl434(v) { return (bgmEl434 = v); }


function bgmOk434() {
  return !/jsdom/i.test(navigator.userAgent || '') && typeof Audio !== 'undefined' && BGM434.failed < 2;
}


export function bgmEl434(k) {
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
    a.src = BGM434.src[k];
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
  if (typeof B !== 'undefined' && B && !$('#cbBattle').hidden) {
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
  if (cur === 'sac' && typeof V4 !== 'undefined' && V4.sacV === 'boutique') return 'boutique';
  if (cur === 'pokedex' || cur === 'dex') return 'centre';
  if (cur === 'camp' && typeof V4 !== 'undefined') {
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
  if (!BGMC434.includes(sc) || !(typeof B !== 'undefined' && B && !$('#cbBattle').hidden)) BGM434.silent = false;
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


function bgmStart434() {
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
    musStopPad434();
  } catch (e) {}
}


/* jingle (victoire, badge, évolution) par-dessus la musique du moment. max = durée en secondes (0 = en entier), suite = jingle enchaîné */
function jingle434(max, k, suite) {
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
  const fin = () => {
    j.removeEventListener('ended', fin);
    clearTimeout(j._t);
    bgmFade434(j, 0, 500, () => {
      try {
        j.pause();
      } catch (e) {}
    });
    BGM434.jingle = false;
    BGM434.scene = '';
    if (suite) {
      jingle434(0, suite);
      if (BGM434.jingle) return;
    }
    if (k === 'victoire' || k === 'badge') {
      if (BGMC434.includes(bgmScene434()) && typeof B !== 'undefined' && B && B.over) BGM434.silent = true; // le résultat reste au calme
    }
    setTimeout(bgmSync434, 600);
  };
  j.addEventListener('ended', fin);
  if (max) j._t = setTimeout(fin, max * 1000);
}


function musStopPad434() {
  if (!MUS.ac || !MUS.out) return;
  clearTimeout(MUS.timer);
  try {
    const o = MUS.out,
      t = MUS.ac.currentTime;
    o.gain.cancelScheduledValues(t);
    o.gain.setValueAtTime(o.gain.value, t);
    o.gain.linearRampToValueAtTime(0, t + 1.2);
    setTimeout(() => {
      try {
        o.disconnect();
      } catch (e) {}
    }, 1400);
  } catch (e) {}
}

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


BGMC434 = ['combat', 'arene', 'champion', 'dresseur', 'rouge', 'pvbas'];


/* branchement sur les réglages existants (interrupteur Musique, curseur de volume, reprise au toucher) */
__set_musStart(function () {
  bgmStart434();
});


__set_musStop(function () {
  if (BGM434.on) bgmStop434();
  else musStopPad434();
});


musLevelOld434 = musLevel;


__set_musLevel(function () {
  if (BGM434.on) {
    const a = BGM434.el[BGM434.jingle ? BGM434.jk : BGM434.scene];
    if (a) bgmFade434(a, bgmVol434(), 150);
  } else musLevelOld434();
});


if (PREF.music === undefined) PREF.music = true;

 // nouvelle installation : thèmes activés (réglable dans Paramètres)
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


sfxOld434 = sfx;


__set_sfx(function (n) {
  sfxOld434(n);
  if (n === 'win' && !(typeof B !== 'undefined' && B && B.over)) jingle434(7);
  else if (n === 'evo') jingle434(10, 'evolution');
});


document.addEventListener('visibilitychange', () => {
  BGM434.vis = !document.hidden;
  if (!BGM434.on) return;
  if (document.hidden) Object.keys(BGM434.el).forEach(k => { try { BGM434.el[k].pause(); } catch (e) {} });
  else {
    BGM434.scene = '';
    bgmSync434();
  }
});


NEWS416.unshift(['i-star', 'Plus de musiques', 'Un thème par écran : arènes, Champions, dresseurs et duels, ruines (Énigmes, Écho profond), Centre Pokémon (Équipe), Hall de la Renommée (Maîtrise) ; jingles d’évolution et de badge.', null]);


NEWS416.splice(8);
}
