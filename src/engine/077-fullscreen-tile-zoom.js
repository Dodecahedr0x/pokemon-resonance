/* Section d'origine : v4.44 : plein écran, loupe des cases, plateau contrasté */

import { EL, MX, RX } from './004-data.js';
import { MV } from './005-moves.js';
import { arenaNext, veiled } from './013-gyms.js';
import { rxCat, toast } from './014-utils.js';
import { CROCHETS } from './015-hooks.js';
import { P, affected, byUid, markAt, reach, targets, uAt } from './021-combat-engine.js';
import { B, STC, clearAim, hpc, renderAll, ui } from './024-combat-ui.js';
import { PREF, savePref, tileTip } from './026-campaign-tutorial-sound.js';
import { renderParams } from './040-settings.js';
import { canSelect } from './044-tactical-engine.js';
import { fireHazard } from './046-living-board.js';
import { trapTip } from './047-tactics.js';
import { gauge434 } from './069-calibration-eevee.js';
import { frame443 } from './076-large-phone-board.js';
import { boardSet, getBoard, getHost, hostSet } from '../screens/combat/board/boardStore.js';
import { sheet444 as FICHE444, footCls, refreshBattle } from '../screens/combat/battle/battleStore.js';

let INSP444, LOUPE444, SUP444, FSVU444, TER444;

 // horodatage : ignorer le « click » qui suit un appui long

/* ---------- 1. plein écran ---------- */
function fsNav444() {
  return !!(document.fullscreenElement || document.webkitFullscreenElement);
}


function fsSet444(on, viaButton) {
  document.body.classList.toggle('fs444', on);
  PREF.fs444 = on ? 1 : 0;
  savePref();
  const el = document.documentElement;
  try {
    if (on && !fsNav444()) {
      const r = el.requestFullscreen ? el.requestFullscreen({ navigationUI: 'hide' }) : el.webkitRequestFullscreen ? el.webkitRequestFullscreen() : null;
      if (r && r.catch)
        r.catch(() => {
          if (viaButton) toast('Plein écran du navigateur refusé ici : le combat garde quand même toute la hauteur.');
        });
    } else if (!on && fsNav444()) {
      const r = document.exitFullscreen ? document.exitFullscreen() : document.webkitExitFullscreen ? document.webkitExitFullscreen() : null;
      if (r && r.catch) r.catch(() => {});
    }
  } catch (e) {}
  gauge434();
  bar444();
  setTimeout(() => {
    gauge434();
    frame443();
  }, 250);
}


// barre d'outils #bt444 : rendue par React (src/screens/combat/board/Outils444.jsx), dans le plateau
// ou dans la barre du bas (Foot.jsx) ; la classe f444 de la barre du bas suit le même état
function bar444() {
  const bd = document.getElementById('bBoard'),
    ft = document.querySelector('#cbBattle .bt-foot');
  if (!bd) return;
  // téléphone : dans la barre du bas, sous le pouce ; grand écran : coin du plateau
  const foot = !!(document.body.classList.contains('bt434') && ft);
  const b = { foot, fs: document.body.classList.contains('fs444'), lp: !!LOUPE444, ct: !!PREF.ct444 },
    o = getHost().bt444;
  if (!o || o.foot !== b.foot || o.fs !== b.fs || o.lp !== b.lp || o.ct !== b.ct) hostSet({ bt444: b });
  const chg = ft ? footCls('f444', foot) : false;
  // la barre du bas suit : classe f444 (déplacement) ou contenu des boutons
  if (chg || (foot && o && (o.fs !== b.fs || o.lp !== b.lp || o.ct !== b.ct))) refreshBattle('foot');
}


function contrast444() {
  document.body.classList.toggle('ct444', !!PREF.ct444);
}


function tileName444(k) {
  const [c, r] = P(k);
  return 'ABCDEFGH'[c] + (r + 1);
}


function terrainName444(t) {
  const f = TER444.find(x => x[0] !== 'fog' && x[0] !== 'trap' && x[0] !== 'mark' && x[3](t));
  return f ? f[1] : 'Terrain dégagé';
}


function dangers444(k) {
  const o = [];
  try {
    if (veiled(B)) {
      if (B.units.some(e => e.side === 'e' && !e.ko && e.intent)) o.push('Intentions adverses voilées : impossible de savoir qui vise cette case.');
    } else
      B.units.forEach(e => {
        if (e.side !== 'e' || e.ko || !e.intent) return;
        const m = MV[e.intent.mv];
        if (m && affected(B, e, m, e.intent.k).includes(k)) o.push(`${e.n} vise cette case avec ${m.n}.`);
      });
    const an = arenaNext(B);
    if (an && an.tiles.includes(k)) o.push(an.txt);
    if (B.vivant && fireHazard(B, k)) o.push('L’herbe peut s’embraser ici.');
  } catch (e) {}
  return o;
}


function context444(k) {
  const o = [];
  try {
    const u = ui.sel && byUid(B, ui.sel);
    if (!u || u.side !== 'a' || u.ko || B.phase !== 'player') return o;
    if (ui.mode === 'target') {
      const m = MV[u.mv[ui.mi]];
      if (m && targets(B, u, m).includes(k)) o.push(`À portée de ${m.n} (${u.n}).`);
    } else if (!u.moved && !u.acted) {
      const c = reach(B, u)[k];
      if (c !== undefined) o.push(`${u.n} peut y aller : ${c} Mouvement${c > 1 ? 's' : ''}.`);
    }
  } catch (e) {}
  return o;
}


// Pokémon présent sur la case : données de la fiche (Fiche444.jsx)
function pokemon444(v) {
  const it =
    v.side === 'e'
      ? v.ko
        ? 'K.O.'
        : v.intent && !veiled(B) && MV[v.intent.mv]
          ? `Prépare ${MV[v.intent.mv].n}`
          : v.intent
            ? 'Intention voilée'
            : ''
      : v.ko
        ? 'K.O.'
        : v.acted
          ? 'A joué'
          : 'Prêt';
  const pv = Math.max(0, Math.round((v.hp / v.mhp) * 100));
  const canDo = !v.ko && B.phase === 'player' && !B.over && !B.dep430 && (v.side === 'e' || canSelect(v));
  return {
    e: v.side === 'e',
    n: v.n,
    hpc: hpc(v),
    pv,
    ko: !!v.ko,
    hp: v.hp,
    mhp: v.mhp,
    t: v.t || [],
    badge: v.badge && !v.ko ? v.badge : null,
    stc: STC[v.badge] || 'x',
    it,
    peut: canDo,
    uid: v.uid
  };
}


// légende des terrains de ce combat : [couleur, nom, règle]
function legend444() {
  const seenSet = TER444.filter(x => Object.keys(B.tiles).some(k => x[3](B.tiles[k])));
  if (!seenSet.length) return null;
  const ruleDef = x => {
    const k = Object.keys(B.tiles).find(kk => x[3](B.tiles[kk]));
    const seg = tileTip(k).split(' · ');
    const pre = { pil: 'Pilier', rock: 'Rocher', w: 'Eau', lava: 'Lave', mud: 'Boue', grass: 'Hautes herbes', sand: 'Sable', fog: 'Br' }[x[0]];
    const s = pre ? seg.find(z => z.startsWith(pre)) : x[0] === 'trap' ? trapTip(B.tiles[k].trap) : null;
    return s ? s.replace(/^[^:]*:\s*/, '') : x[0] === 'mark' ? 'Laissée par une capacité : réagit avec les attaques d’autres types.' : '';
  };
  return seenSet.map(x => [x[2], x[1], ruleDef(x)]);
}


function activeTile444() {
  if (!B || B.over) return null;
  if (INSP444 != null && B.tiles[INSP444]) return INSP444;
  if (document.body.classList.contains('bt434') && ui.tile != null && B.tiles[ui.tile]) return ui.tile; // case touchée : sa fiche était tout en bas
  return null;
}


// fiche #ti444 : rendue par React (src/screens/combat/battle/Fiche444.jsx) depuis ce relevé,
// pris à l'ouverture comme l'ancien innerHTML (place444 ne fait que la déplacer)
function sheet444() {
  const cb = document.getElementById('cbBattle'),
    F = FICHE444;
  const k = activeTile444();
  if (!cb || k == null) {
    if (F.made && !F.hidden) {
      F.hidden = true;
      refreshBattle('ti444');
    }
    mark444(null);
    return;
  }
  const t = B.tiles[k],
    v = uAt(B, k),
    tip = tileTip(k),
    seg = tip === 'Case libre' ? ['Rien de particulier : déplacement normal, pas de couverture.'] : tip.split(' · ');
  let rx = [];
  try {
    const mk = t.mark ? markAt(B, k) : t.w ? 'trempe' : null;
    if (mk && MX[mk]) {
      const row = MX[mk];
      rx = EL.map((e, i) => (row[i] && row[i] !== 'ren' && RX[row[i]] ? [rxCat(row[i]), e + ' → ' + RX[row[i]].n] : null)).filter(Boolean);
    }
  } catch (e) {}
  F.c = {
    sw: (TER444.find(x => x[0] !== 'fog' && x[0] !== 'trap' && x[0] !== 'mark' && x[3](t)) || [0, 0, '#3a4a5a'])[2],
    nom: tileName444(k),
    terrain: terrainName444(t),
    seg,
    rx,
    dg: dangers444(k),
    cx: context444(k),
    u: v ? pokemon444(v) : null,
    leg: legend444(),
    loupe: !!LOUPE444
  };
  F.n = (F.n || 0) + 1;
  F.made = true;
  F.hidden = false;
  place444(true);
  refreshBattle('ti444');
  mark444(k);
}


function place444(withoutRender) {
  const F = FICHE444;
  if (!F.made || F.hidden) return;
  const ft = document.querySelector('#cbBattle .bt-foot'),
    isFixed = ft && getComputedStyle(ft).position === 'fixed',
    bottomEdge = isFixed ? ft.getBoundingClientRect().top : innerHeight,
    k = activeTile444(),
    hx = k != null && document.querySelector(`#bSvg [data-k="${k}"]`);
  // la fiche se met du côté opposé à la case, pour ne pas la cacher
  let atTop = false;
  if (hx) {
    const r = hx.getBoundingClientRect(),
      cy = r.top + r.height / 2;
    atTop = cy > bottomEdge / 2;
  }
  const top = atTop ? 'calc(8px + env(safe-area-inset-top, 0px))' : 'auto',
    bottom = atTop ? 'auto' : (isFixed ? Math.max(8, innerHeight - bottomEdge + 8) : 18) + 'px';
  if (F.haut === atTop && F.top === top && F.bottom === bottom) return;
  F.haut = atTop;
  F.top = top;
  F.bottom = bottom;
  if (!withoutRender) refreshBattle('ti444');
}


// calque #insp444 du plateau (React) : créé au premier usage, vidé ensuite
function mark444(k) {
  if (k == null) {
    if (getBoard().insp != null) boardSet({ insp: null }, 'insp');
    return;
  }
  if (getBoard().insp !== k) boardSet({ insp: k }, 'insp');
}


function shut444() {
  INSP444 = null;
  if (B) ui.tile = null;
  sheet444();
  if (B) renderAll();
}

// Instructions exécutées au démarrage, dans l'ordre d'origine (voir index.js).
export function __init() {

/* 1. Plein écran : bouton sur le plateau (et dans Paramètres). Le navigateur passe en plein écran quand il l’autorise ;
      en combat sur téléphone, la barre de navigation du bas disparaît pour laisser la place au plateau.
   2. Loupe : un appui long sur une case (ou la loupe, puis un toucher) ouvre sa fiche : terrain et ses règles,
      marque élémentaire et réactions, Pokémon présent, dangers annoncés (attaque adverse, règle d’arène, feu),
      accessibilité pour le Pokémon choisi. La légende du plateau liste les terrains de ce combat.
   3. Plateau contrasté (option) : contours de cases nets et terrains plus colorés. */

INSP444 = null, // case affichée dans la fiche
  LOUPE444 = false, // un toucher ouvre la fiche au lieu d’agir
  SUP444 = 0;


// sortie par le geste « retour » d’Android ou la touche Échap : on quitte aussi le mode immersif
['fullscreenchange', 'webkitfullscreenchange'].forEach(ev =>
  document.addEventListener(ev, () => {
    if (!fsNav444() && document.body.classList.contains('fs444') && FSVU444) {
      FSVU444 = false;
      document.body.classList.remove('fs444');
      PREF.fs444 = 0;
      savePref();
      bar444();
      gauge434();
    }
    if (fsNav444()) FSVU444 = true;
  })
);


FSVU444 = false;

 // le navigateur a bien accepté le plein écran

/* ---------- 2. barre d’outils du plateau ---------- */
// icônes de la barre : dans Outils444.jsx


document.addEventListener('click', e => {
  const b = e.target.closest('[data-b444]');
  if (!b) return;
  const a = b.dataset.b444;
  if (a === 'fs') fsSet444(!document.body.classList.contains('fs444'), true);
  else if (a === 'lp') {
    LOUPE444 = !LOUPE444;
    if (!LOUPE444) INSP444 = null;
    toast(LOUPE444 ? 'Loupe : touchez une case pour lire son détail.' : 'Loupe rangée.');
    bar444();
    sheet444();
  } else if (a === 'ct') {
    PREF.ct444 = PREF.ct444 ? 0 : 1;
    savePref();
    contrast444();
    bar444();
  } else if (a === 'pfs') {
    fsSet444(!document.body.classList.contains('fs444'), true);
    renderParams();
  } else if (a === 'pct') {
    PREF.ct444 = PREF.ct444 ? 0 : 1;
    savePref();
    contrast444();
    renderParams();
  }
});


/* ---------- 3. fiche de case ---------- */
TER444 = [
  ['pil', 'Pilier', '#5b5f6b', t => t.pil],
  ['rock', 'Rocher', '#8b8f98', t => t.rock && !t.pil],
  ['w', 'Eau', '#3b82f6', t => t.w],
  ['lava', 'Lave', '#ff6a2a', t => t.lava > 0],
  ['mud', 'Boue', '#9a6b3e', t => t.mud > 0],
  ['grass', 'Hautes herbes', '#43b05c', t => t.grass],
  ['sand', 'Sable', '#d6b26e', t => t.sand && !t.w],
  ['fog', 'Brouillard', '#a9b4c4', t => t.fog > 0],
  ['trap', 'Piège', '#e94b6a', t => t.trap],
  ['mark', 'Marque élémentaire', '#ffd75e', t => t.mark]
];


document.addEventListener('click', e => {
  const b = e.target.closest('[data-ti444]');
  if (!b || !B) return;
  if (b.dataset.ti444 === 'x') shut444();
  else if (b.dataset.ti444 === 'u') {
    const v = byUid(B, b.dataset.uid);
    if (!v || ui.busy) return;
    if (v.side === 'a') {
      ui.sel = v.uid;
      ui.selE = null;
    } else ui.selE = v.uid;
    INSP444 = null;
    ui.tile = null;
    clearAim();
    renderAll();
  }
});


document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && document.getElementById('ti444') && !document.getElementById('ti444').hidden) shut444();
});


/* appui long (et loupe) sur le plateau */
(function () {
  const svg = document.getElementById('bSvg');
  if (!svg) return;
  let tm = 0,
    x0 = 0,
    y0 = 0,
    kk = null;
  const stop = () => {
    clearTimeout(tm);
    tm = 0;
  };
  svg.addEventListener('pointerdown', e => {
    const p = e.target.closest && e.target.closest('[data-k]');
    if (!p || !B || (e.pointerType === 'mouse' && e.button !== 0)) return;
    kk = p.dataset.k;
    x0 = e.clientX;
    y0 = e.clientY;
    stop();
    tm = setTimeout(() => {
      tm = 0;
      if (!B) return;
      INSP444 = kk;
      SUP444 = Date.now();
      try {
        if (navigator.vibrate) navigator.vibrate(12);
      } catch (er) {}
      sheet444();
    }, 430);
  });
  svg.addEventListener('pointermove', e => {
    if (tm && Math.hypot(e.clientX - x0, e.clientY - y0) > 10) stop();
  });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => svg.addEventListener(ev, stop));
  svg.addEventListener('contextmenu', e => {
    if (e.target.closest && e.target.closest('[data-k]')) e.preventDefault();
  });
  // phase de capture : passe avant le gestionnaire du plateau
  svg.addEventListener(
    'click',
    e => {
      const p = e.target.closest && e.target.closest('[data-k]');
      if (!p || !B) return;
      if (Date.now() - SUP444 < 800) {
        SUP444 = 0;
        e.stopImmediatePropagation();
        e.preventDefault();
        return;
      }
      if (LOUPE444) {
        e.stopImmediatePropagation();
        e.preventDefault();
        INSP444 = p.dataset.k;
        sheet444();
        return;
      }
      if (INSP444 != null) INSP444 = null; // un toucher normal referme la fiche ouverte par appui long
    },
    true
  );
})();


/* ---------- 4. branchements ---------- */
const rangerLens444 = () => {
  INSP444 = null;
  LOUPE444 = false;
};


CROCHETS.rendu.push(() => {
  bar444();
  sheet444();
});


CROCHETS.avantLancement.push(rangerLens444);


CROCHETS.lancement.push(isNew => {
  if (isNew && PREF.fs444) fsSet444(true, false); // toucher « Lancer » autorise le plein écran
});


CROCHETS.avantFinCombat.push(rangerLens444);


CROCHETS.finCombat.push(sheet444);


addEventListener('resize', () => setTimeout(place444, 60));


addEventListener('scroll', () => place444(), { passive: true });


// panneau « Affichage du combat » : rendu par React (src/screens/settings/panels/AffichageCombat.jsx)


if (PREF.fs444) document.body.classList.add('fs444');

 // le mode immersif revient ; le plein écran du navigateur attend un toucher
if (PREF.ct444 === undefined) PREF.ct444 = 1;

 // v4.45 : plateau contrasté activé par défaut (désactivable)
contrast444();

}
