/* Original section: v4.48: immersion — type sounds, cries, vibrations, battle entrance, effects, animated weather, holo, victory, log */

import { clearOverlay, paintOverlay } from '../screens/overlays/dialogsStore.js';
import { bdClass, getHost, hostSet } from '../screens/combat/board/boardStore.js';
import { BY, SCEN } from './009-pokemon.js';
import { $, RM, after2images, writeLS, el, tc } from './014-utils.js';
import { HOOKS } from './015-hooks.js';
import { byUid } from './021-combat-engine.js';
import { B, HC, L } from './024-combat-ui.js';
import { PREF, SFX, noise, savePref, tone, vibe } from './026-campaign-tutorial-sound.js';
import { AUTO } from './030-prestige-staging.js';
import { V4, ownedFam } from './032-v4-foundation.js';
import { renderParams } from './040-settings.js';
import { BGM434 } from './070-theme-music-player.js';

let TSND448, tipI448, ori448;


/** Immersion on and animations not reduced (same test as IM448() && !RM, hoisted for 082 and 083). */
export function FX448() {
  return PREF.im448 !== 0 && !RM;
}


function sfxType448(ty) {
  if (!PREF.sound || RM || !IM448()) return;
  try {
    (TSND448[ty] || SFX.hit)();
  } catch (e) {}
}


function step448() {
  if (!PREF.sound || RM || !IM448()) return;
  try {
    tone(210 + Math.random() * 70, 0, 0.045, 'triangle', 0.03, 150);
  } catch (e) {}
}


/** Synthesized cry: the pitch depends on the national number, so each species has its own. */
function cry448(u, ko) {
  if (!PREF.sound || RM || !IM448() || !u) return;
  try {
    const no = (BY[u.id] && BY[u.id].no) || 1,
      f = 300 + ((no * 53) % 380),
      big = (u.mhp || 20) > 30 ? 0.75 : 1;
    if (ko) {
      tone(f * 0.9 * big, 0, 0.3, 'sawtooth', 0.04, f * 0.35 * big);
      tone(f * 0.45 * big, 0.2, 0.3, 'square', 0.025, f * 0.2 * big);
    } else {
      tone(f * big, 0, 0.12, 'sawtooth', 0.035, f * 1.35 * big);
      tone(f * 1.35 * big, 0.1, 0.2, 'square', 0.025, f * 0.85 * big);
    }
  } catch (e) {}
}


function alarm448() {
  if (!PREF.sound || RM || !IM448()) return;
  try {
    [0, 0.16, 0.32].forEach(t => tone(1568, t, 0.07, 'square', 0.035));
  } catch (e) {}
}


/* ---------- 2. battle music: livelier when an ally is nearly KO ---------- */
function tempo448() {
  try {
    Object.keys(BGM434.el).forEach(k => {
      const a = BGM434.el[k];
      if (!a) return;
      const want = 1; // v4.49: the « low HP » track replaces the speed-up
      if (a.playbackRate !== want) a.playbackRate = want;
    });
  } catch (e) {}
}


/* ---------- 3. board effects: particles, shake, vibrations ---------- */
function part448(k, ty) {
  if (!FX448() || !L.fx) return;
  const [x, y] = HC(k),
    c = tc(ty || 'Normal'),
    n = 9;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + Math.random() * 0.5,
      d = 14 + Math.random() * 16;
    const p = el(
      'circle',
      {
        class: 'p448',
        cx: x.toFixed(1),
        cy: y.toFixed(1),
        r: (1.6 + Math.random() * 1.8).toFixed(1),
        style: `--dx:${(Math.cos(a) * d).toFixed(1)}px;--dy:${(Math.sin(a) * d).toFixed(1)}px;fill:${c}`
      },
      L.fx
    );
    setTimeout(() => p.remove(), 800);
  }
}


function shake448(big) {
  if (!FX448()) return;
  if (!$('#bBoard')) return;
  const cls = getHost().cls,
    already = cls.includes('shake448') || cls.includes('shakeB448');
  const finishUp = () => (bdClass('shake448', false), bdClass('shakeB448', false));
  finishUp();
  const launchMove = () => {
    bdClass(big ? 'shakeB448' : 'shake448', true);
    clearTimeout(shake448.t);
    shake448.t = setTimeout(finishUp, 520);
  };
  if (already) after2images(launchMove);
  else launchMove();
}


function trans448() {
  if (!FX448() || !B) return;
  // #tr448: rendered by React (src/screens/overlays/Effects.jsx) for the duration of the transition
  paintOverlay('tr448', {});
  try {
    [330, 440, 554, 740].forEach((f, i) => tone(f, i * 0.07, 0.16, 'square', 0.03, f * 1.3));
    noise(0.3, 0.45, 0.07, 2200);
  } catch (e) {}
  vibe([40, 40, 60]);
  clearTimeout(trans448.t);
  trans448.t = setTimeout(() => clearOverlay('tr448'), 1250);
  const fo = B.units.find(u => u.side === 'e');
  setTimeout(() => cry448(fo, false), 900);
}


/* ---------- 6. animated weather on the board ---------- */
function wx448() {
  // #wx448: rendered by React (Board.jsx)
  const k = FX448() && B && !B.over && B.wx && B.wx.k ? B.wx.k : null;
  if (getHost().wx448 !== k) hostSet({ wx448: k });
}


/* ---------- 7. holographic cards and living Pokédex ---------- */
function tilt448(art, px, py) {
  const r = art.getBoundingClientRect();
  if (!r.width) return;
  const x = Math.max(0, Math.min(1, (px - r.left) / r.width)),
    y = Math.max(0, Math.min(1, (py - r.top) / r.height));
  art.style.setProperty('--hx', (x * 100).toFixed(0) + '%');
  art.style.setProperty('--hy', (y * 100).toFixed(0) + '%');
  art.style.setProperty('--rx', ((0.5 - y) * 9).toFixed(1) + 'deg');
  art.style.setProperty('--ry', ((x - 0.5) * 11).toFixed(1) + 'deg');
}


function seen448() {
  try {
    return JSON.parse(localStorage.getItem('res-seen448') || '{}');
  } catch (e) {
    return {};
  }
}


/* ---------- 9. trainer journal (on this device) ---------- */
export function jr448() {
  try {
    return Object.assign({ streak: 0, best: 0, use: {} }, JSON.parse(localStorage.getItem('res-j448') || '{}'));
  } catch (e) {
    return { streak: 0, best: 0, use: {} };
  }
}


function jrSave448(j) {
  writeLS('res-j448', j);
}


/** Next tip under the « VS » presentation (text), or null if immersion is off. */
export function tipVs448() {
  return IM448() ? TIPS448[tipI448++ % TIPS448.length] : null;
}

/** Redrawn Pokédex entry: sweep, and a little fanfare the first time an owned family is opened. */
export function scanDex448() {
  try {
    const el = $('#dex4Card');
    if (!el) return;
    const own = !!ownedFam(V4.dexSel);
    el.classList.remove('scan448');
    void el.offsetWidth;
    if (IM448() && !RM) el.classList.add('scan448');
    if (own && IM448() && !RM) {
      const s = seen448(),
        id = V4.dexSel;
      if (!s[id]) {
        s[id] = 1;
        writeLS('res-seen448', s);
        el.classList.add('new448');
        setTimeout(() => el.classList.remove('new448'), 1800);
        try {
          [784, 988, 1318].forEach((f, i) => tone(f, i * 0.09, 0.22, 'triangle', 0.045));
        } catch (e) {}
      }
    }
  } catch (e) {}
}

export const IM448 = () => PREF.im448 !== 0;

/* ---------- 5. battle entrance: flash, iris, cry, tip ---------- */
const TIPS448 = [
  'Les Piliers bloquent les tirs directs ; derrière un Rocher, la couverture réduit les dégâts à distance de 40 %.',
  'L’Eau compte comme Trempé : parfait pour une réaction avec l’Électrik.',
  'Dans les hautes herbes, un Pokémon caché ne peut être visé qu’à 2 cases ou moins. Le Feu les embrase.',
  'Le Sable coûte 2 Mouvements pour y entrer, sauf aux types Sol, Roche, Acier et aux volants.',
  'La Boue ralentit les déplacements par 3, la Lave brûle ceux qui s’y arrêtent.',
  'Dans le brouillard, on ne vise pas à distance : approchez-vous.',
  'Une capacité de météo dure 5 manches et change la durée des marques sur tout le plateau.',
  'À l’Éveil, Évoli choisit librement parmi ses 5 évolutions ; en harmonie avec sa case ou l’heure, il garde 1 losange.',
  'Un appui long sur une case du plateau affiche son terrain, ses dangers et le Pokémon présent.',
  'En capture, un Pokémon K.O. s’enfuit : calmez-le sans l’assommer.',
  'Deux types complémentaires ouvrent une synergie : regardez le Guide avant de composer l’équipe.',
  'Une Roche Météo prolonge la météo déclenchée par son porteur de 3 manches.'
];

// Statements run at startup, in the original order (see index.js).
export function __init() {


/* ---------- 1. sounds by attack type (synthesized, no file) ---------- */
TSND448 = {
  Normal: () => {
    noise(0, 0.1, 0.12, 1400);
    tone(190, 0, 0.1, 'sine', 0.07, 90);
  },
  Feu: () => {
    noise(0, 0.4, 0.13, 2600);
    tone(320, 0, 0.35, 'sawtooth', 0.04, 110);
  },
  Eau: () => [520, 700, 900].forEach((f, i) => tone(f, i * 0.07, 0.14, 'sine', 0.05, f * 1.5)),
  Plante: () => {
    tone(392, 0, 0.16, 'triangle', 0.05, 523);
    tone(523, 0.12, 0.2, 'triangle', 0.04, 659);
    noise(0, 0.18, 0.05, 3200);
  },
  Électrik: () => [1200, 520, 1500, 480, 1300].forEach((f, i) => tone(f, i * 0.04, 0.05, 'square', 0.035)),
  Glace: () => [2093, 2637, 3136].forEach((f, i) => tone(f, i * 0.06, 0.22, 'triangle', 0.035)),
  Combat: () => {
    noise(0, 0.08, 0.16, 900);
    tone(110, 0, 0.14, 'sine', 0.1, 50);
    tone(90, 0.1, 0.14, 'sine', 0.08, 45);
  },
  Poison: () => {
    tone(200, 0, 0.3, 'sawtooth', 0.035, 330);
    noise(0.05, 0.25, 0.06, 1800);
  },
  Sol: () => {
    noise(0, 0.35, 0.16, 320);
    tone(62, 0, 0.35, 'sine', 0.1, 40);
  },
  Vol: () => noise(0, 0.32, 0.1, 4200),
  Psy: () => {
    tone(600, 0, 0.35, 'sine', 0.05, 920);
    tone(920, 0.3, 0.3, 'sine', 0.04, 560);
  },
  Insecte: () => [0, 0.05, 0.1, 0.15, 0.2].forEach(t => tone(760 + Math.random() * 120, t, 0.06, 'sawtooth', 0.03)),
  Roche: () => {
    noise(0, 0.2, 0.15, 520);
    tone(95, 0, 0.18, 'sine', 0.09, 60);
  },
  Spectre: () => {
    tone(320, 0, 0.5, 'sine', 0.05, 140);
    tone(326, 0, 0.5, 'sine', 0.04, 146);
  },
  Dragon: () => {
    tone(120, 0, 0.45, 'sawtooth', 0.05, 66);
    noise(0, 0.4, 0.08, 1500);
  },
  Ténèbres: () => {
    tone(160, 0, 0.38, 'triangle', 0.07, 76);
    noise(0.05, 0.25, 0.06, 600);
  },
  Acier: () => {
    tone(1760, 0, 0.12, 'square', 0.03);
    tone(2349, 0.02, 0.22, 'triangle', 0.04);
    noise(0, 0.06, 0.1, 5000);
  },
  Fée: () => [1318, 1760, 2093, 2637].forEach((f, i) => tone(f, i * 0.07, 0.24, 'sine', 0.04))
};


setInterval(() => {
  try {
    if (!B || B.over || $('#cbBattle').hidden) tempo448();
  } catch (e) {}
}, 1500);


HOOKS.journal.push(ev => {
  let steps = 0,
    boom = false,
    kos = 0,
    low = false;
  ev.forEach(e => {
    if (e.e === 'use') {
      sfxType448(e.ty);
      if (e.k != null) part448(e.k, e.ty);
    } else if (e.e === 'mv') {
      if (steps++ < 2) step448();
    } else if (e.e === 'dmg') {
      const u = byUid(B, e.u);
      if (u && u.side === 'a' && !u.ko && u.hp / u.mhp <= 0.25 && !u._low448) {
        u._low448 = 1;
        low = true;
      }
      if (u && e.v >= u.mhp * 0.35) boom = true;
    } else if (e.e === 'ko') {
      kos++;
      cry448(byUid(B, e.u), true);
      boom = true;
    } else if (e.e === 'msg' && /super efficace/.test(e.s || '')) {
      boom = true;
      vibe([18, 30, 40]);
    } else if (e.e === 'catch') vibe([30, 40, 30, 40, 90]);
    else if (e.e === 'rx' || e.e === 'reso') vibe(22);
  });
  if (boom) shake448(kos > 0);
  if (low) {
    setTimeout(alarm448, 380);
    vibe([30, 60, 30]);
  }
  tempo448();
});


/* ---------- 4. the attack's type in the log (for sound and particles) ---------- */
/* (resolveMove adds « ty » to the « use » event: see the source patch) */


tipI448 = Math.floor(Math.random() * TIPS448.length);


HOOKS.lancement.push(() => {
  if (B && !AUTO) trans448();
});


/* the tip is shown under the « VS » presentation: tipVs448(), rendered in Vs.jsx */


HOOKS.rendu.push(wx448);


document.addEventListener(
  'pointermove',
  e => {
    if (e.pointerType === 'touch' || RM) return;
    const a = e.target.closest && e.target.closest('.v4d-art');
    if (a) tilt448(a, e.clientX, e.clientY);
  },
  { passive: true }
);


document.addEventListener('pointerleave', () => {}, { passive: true });


ori448 = 0;


addEventListener(
  'deviceorientation',
  e => {
    if (RM || !IM448() || e.gamma == null) return;
    const t = Date.now();
    if (t - ori448 < 60) return;
    ori448 = t;
    const a = document.querySelector('#dex4Card .v4d-art');
    if (!a || !a.offsetParent) return;
    const r = a.getBoundingClientRect();
    tilt448(a, r.left + r.width * (0.5 + Math.max(-30, Math.min(30, e.gamma)) / 60), r.top + r.height * (0.5 + Math.max(-30, Math.min(30, (e.beta || 45) - 45)) / 60));
  },
  { passive: true }
);



/* ---------- 8. victory: burst, badge appearing, vibration ---------- */
// fx448 / gold448 classes and .rbadge448 badge: rendered by React (Result.jsx); here, vibration and chime
new MutationObserver(() => {
  const r = $('#cbResult'),
    c = r && r.querySelector('.res-card.fx448');
  if (!r || r.hidden || !c || !B || B._fx448) return;
  B._fx448 = 1;
  vibe([60, 40, 60, 40, 140]);
  try {
    if (c.querySelector('.rbadge448')) [659, 784, 1046, 1318, 1568].forEach((f, j) => tone(f, j * 0.1, 0.3, 'triangle', 0.05));
  } catch (e) {}
}).observe($('#cbResult'), { childList: true, attributes: true, attributeFilter: ['hidden'] });


HOOKS.finCombat.push(() => {
  if (B && B.over && !B._j448 && !(SCEN[B.sc] || {}).sansProgres431) {
    B._j448 = 1;
    const j = jr448(),
      win = B.over === 'win';
    j.streak = win ? j.streak + 1 : 0;
    j.best = Math.max(j.best, j.streak);
    B.units.filter(u => u.side === 'a').forEach(u => {
      const b = BY[u.id] ? BY[u.id].base : u.id;
      j.use[b] = (j.use[b] || 0) + 1;
    });
    jrSave448(j);
  }
});


// « Immersion » and « Trainer journal » panels: rendered by React (src/screens/settings/panels/Immersion.jsx, TrainerJournal.jsx)


document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('[data-b448]');
  if (!b) return;
  if (b.dataset.b448 === 'im') {
    PREF.im448 = IM448() ? 0 : 1;
    savePref();
    wx448();
    tempo448();
    renderParams();
  }
});

}
