/* Section d'origine : v4.29-01-qualite.js */
import { bdClass } from '../screens/combat/board/boardStore.js';

import { MV } from './005-02-capacites.js';
import { BY, MON, SCEN, famOf } from './009-03-pokemon.js';
import { RECRUIT } from './010-04-evolution-en-combat.js';
import { PROFILE, isCamp } from './011-05-etat-de-partie.js';
import { $, RM, medal, toast } from './014-08-outils.js';
import { tokCl } from '../screens/combat/board/boardStore.js';
import { CROCHETS } from './015-v4-8-00-crochets.js';
import { go } from './016-09-navigation.js';
import { openSheet, squad } from './020-13-equipe-cartes.js';
import { EMAX, affected, byUid, canEveil, hdist, mvType, teff, uAt, uk } from './021-14-moteur-combat.js';
import { OBST } from './023-16-roles-synergies-obstacles.js';
import { B, HC, L, battleOpts, scSel, ui } from './024-17-interface-combat.js';
import { queueSave } from './025-19-sauvegardes.js';
import { PREF, savePref, vibe } from './026-20-campagne-tutoriel-son.js';
import { AUTO } from './030-24-prestige-mise-en-scene.js';
import { avatar } from './031-25-v3-parcours-accueil.js';
import { hideTip429, showTip429 } from '../screens/overlays/shellOverlays.js';
import { V4, fmt } from './032-v4-00-socle.js';
import { PL, renderMap } from './037-v4-05-carte.js';
import { renderQuests } from './039-v4-07-quetes-boutique.js';
import { LEGS, RIVAL, RIVAL_LINE, RIVAL_POS, legKey, rivalStarter } from './043-v4-4-01-aventure-plus.js';
import { notesDe } from './053-v4-14-01-resonance.js';
import { PLACES_J } from './054-v4-15-01-johto.js';
import { NEWS416 } from './056-v4-16-1-01-finitions.js';
import { SCENES, SCN, __set_SCN, renderScene417, resoCand417 } from './057-v4-17-01-compagnons-et-resonance.js';
import { PLACES_H } from './059-v4-19-01-hoenn.js';
import { bossPhases420, encercle420 } from './060-v4-20-01-combat-intense.js';
import { REGN421 } from './061-v4-21-01-capture-partout.js';
import { famCapt428 } from './063-v4-28-01-captures-combat-accueil.js';

export let ONGLETS429, RIV429, PROGRES429;
let LP429, finLp429, SW429, ASTUCES429, APRES429, HEBDO429, HEB429;
export function __set_rejouer429(v) { return (rejouer429 = v); }


/* =====================================================================
   v4.29 : qualité de jeu
   1. Pokémon expressifs : souffle au repos, bond vers la cible, recul sous
      les coups, chute au K.O. (réglage « Pokémon animés »).
   2. Gestes tactiles : appui long sur un Pokémon = sa fiche ; glisser pour
      changer d'onglet ; vibration sur les coups forts.
   3. Astuces au bon moment : le Prof. Sorbier explique une mécanique la
      première fois qu'elle apparaît en combat.
   4. Difficulté Expert : les adversaires se coordonnent (achèvent le plus
      entamé, enchaînent les types efficaces, protègent leur chef).
   5. Histoire et rival : Kael revient à Johto et à Hoenn, les Échos de la
      Dissonance à Hoenn ; scènes avant et après les grands combats.
   6. Légendaires capturables : une quête par légende, puis un combat de
      capture ; les légendes rejoignent la Box (8 PC).
   7. Défi de la semaine : même règle et même équipe pour tous, meilleur
      score gardé, récompense une fois par semaine, classement entre amis.
   Les tables lues par des fonctions appelées ailleurs sont en « var » :
   jamais d'erreur d'ordre de chargement.
   ===================================================================== */
export function V429_0() {
  return { tips429: {}, riv429: [], hebdo429: null };
}


export function v429Clean(p) {
  const o = V429_0();
  if (!p || typeof p !== 'object') return o;
  if (p.tips429 && typeof p.tips429 === 'object') Object.keys(p.tips429).forEach(k => /^[a-z]{2,12}$/.test(k) && (o.tips429[k] = 1));
  if (Array.isArray(p.riv429)) o.riv429 = [...new Set(p.riv429.filter(x => ['rv5', 'rv6', 'hd429'].includes(x)))];
  const h = p.hebdo429;
  if (h && typeof h === 'object' && typeof h.w === 'string' && /^\d{4}-S\d\d$/.test(h.w))
    o.hebdo429 = {
      w: h.w,
      best: Number.isFinite(h.best) ? Math.max(0, Math.min(99999, Math.floor(h.best))) : 0,
      n: Number.isFinite(h.n) ? Math.max(0, Math.min(999, Math.floor(h.n))) : 0,
      rec: h.rec ? 1 : 0,
      win: h.win ? 1 : 0
    };
  return o;
}


/** Score de la semaine sur la carte de dresseur. */
export function wkClean429(x) {
  return x && typeof x === 'object' && typeof x.w === 'string' && /^\d{4}-S\d\d$/.test(x.w) && Number.isFinite(x.s) ? { w: x.w, s: Math.max(0, Math.min(99999, Math.floor(x.s))) } : null;
}


/** Box affichée : les légendes capturées ne comptent pas dans « Box x / 151 ». */
export function boxN429() {
  return PROFILE.box.filter(id => !(BY[id] && BY[id].leg)).length;
}


/* ---------- 1. Pokémon expressifs ---------- */
export function anim429() {
  return !RM && PREF.anim429 !== false;
}


/** Toutes les pièces du jeton sont dans un groupe intérieur .tok-b (Units.jsx) : il bouge sans
    déplacer la case. Chaque jeton respire avec un décalage différent. */
export function vivTok429(T) {
  vivTok429.n = (vivTok429.n || 0) + 1;
  T.dl = (-((vivTok429.n * 0.77) % 3.4)).toFixed(2) + 's';
  return T;
}


export function rejouer429(T, cl, ms) {
  tokCl(T, cl, false);
  if (T.g) void T.g.getBoundingClientRect();
  tokCl(T, cl, true);
  clearTimeout(T['t_' + cl]);
  T['t_' + cl] = setTimeout(() => tokCl(T, cl, false), ms);
}


function bond429(uid, k) {
  const T = L.u && L.u[uid],
    u = B && byUid(B, uid);
  if (!anim429() || !T || !T.b || !u || u.ko) return;
  const [x0, y0] = HC(uk(u)),
    [x1, y1] = HC(k);
  let dx = x1 - x0,
    dy = y1 - y0;
  const d = Math.hypot(dx, dy);
  if (d < 1) {
    dx = 0;
    dy = -6;
  } else {
    dx = (dx / d) * 8;
    dy = (dy / d) * 8;
  }
  T.b.style.setProperty('--lx', dx.toFixed(1) + 'px');
  T.b.style.setProperty('--ly', dy.toFixed(1) + 'px');
  rejouer429(T, 'lunge429', 560);
}


export function aie429(uid) {
  const T = L.u && L.u[uid];
  if (anim429() && T && T.b) rejouer429(T, 'hurt429', 480);
}


export function vivEv429(ev) {
  if (!B || !ev || !ev.length) return;
  const sv = document.getElementById('bSvg');
  if (sv) sv.style.setProperty('--tk429', PREF.fast || ui.turbo428 ? '0.6' : '1');
  ev.forEach(x => {
    if (x.e === 'use' && x.u && x.k) bond429(x.u, x.k);
  });
  // vibration : un de vos Pokémon encaisse un gros coup, ou un Pokémon tombe K.O.
  const ko = ev.some(x => x.e === 'ko'),
    fort = ev.some(x => {
      if (x.e !== 'dmg') return false;
      const v = byUid(B, x.u);
      return v && v.side === 'a' && x.v >= v.mhp * 0.3;
    });
  if (ko || fort) vibe(ko ? [18, 40, 22] : 28);
}


function calme429() {
  bdClass('calme429', !anim429()); // classe de #bBoard, rendue par React
}


function actionLp429(t) {
  if (!t || !t.closest) return null;
  const hx = t.closest('#bSvg [data-k]');
  if (hx && B) {
    const u = uAt(B, hx.dataset.k);
    return u ? () => fiche429(u.sp) : null;
  }
  const tok = t.closest('#bSvg .tok');
  if (tok && B && L.u) {
    for (const id in L.u)
      if (L.u[id].g === tok) {
        const u = byUid(B, id);
        return u ? () => fiche429(u.sp) : null;
      }
    return null;
  }
  const mk = t.closest('#mapMarks [data-place]');
  if (mk)
    return () => {
      V4.mapSel = mk.dataset.place;
      renderMap();
      const i = document.getElementById('mapInfo');
      if (i && i.scrollIntoView) i.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'center' });
    };
  const c = t.closest('[data-open],.v4-dl[data-dex],[data-lp429]');
  if (!c) return null;
  const id = c.dataset.open || c.dataset.dex || c.dataset.lp429;
  return id && BY[id] ? () => fiche429(id) : null;
}


/** La fiche d'un Pokémon ; pour une légende ou un adversaire sans fiche, un résumé. */
function fiche429(id) {
  const m = BY[id];
  if (!m) return;
  if (m.leg || m.ennemi || !MON.includes(m)) {
    toast(`${m.n} · ${m.t.join(' / ')}${m.leg ? ' · légende' : ''} : ${m.mv.map(x => (MV[x] ? MV[x].n : x)).join(', ')}.`);
    return;
  }
  openSheet(id);
}


function glisserOk429(t) {
  if (PREF.swipe429 === false || !t || !t.closest || !t.closest('main,.content,.page')) return false;
  if (t.closest('input,textarea,select,#bBoard,.board,.v4-map,#mapMarks,.route,.v4-tabs,.v4-seg,[data-noswipe],[role="dialog"]')) return false;
  if (B && !B.over && document.querySelector('#cbBattle:not([hidden])')) return false;
  if ([...document.querySelectorAll('[role="dialog"],.sheet,.modal')].some(d => !d.hidden && d.offsetParent !== null)) return false;
  for (let x = t; x && x !== document.body; x = x.parentElement) {
    const o = getComputedStyle(x).overflowX;
    if ((o === 'auto' || o === 'scroll') && x.scrollWidth > x.clientWidth + 4) return false;
  }
  return true;
}


function astuces429(force) {
  if (!B || B.over || ui.busy || ui.cine || B.phase !== 'player' || (AUTO && !force) || PREF.tips429 === false) return;
  if ((SCEN[B.sc] || {}).tuto || document.getElementById('tip429')) return;
  const vus = (PROFILE.tips429 = PROFILE.tips429 || {}),
    al = B.units.filter(u => u.side === 'a' && !u.ko),
    en = B.units.filter(u => u.side === 'e' && !u.ko),
    c = [];
  if (!B.noCatch) c.push('capture');
  if (al.some(u => canEveil(B, u))) c.push('eveil');
  if (en.some(u => notesDe(B, u) > 0)) c.push('reso');
  if (al.some(u => u.en >= EMAX && resoCand417(B, u))) c.push('forme');
  if (al.some(u => encercle420(B, u))) c.push('encercle');
  if (bossPhases420(B)) c.push('phase');
  if (B.danger420) c.push('danger');
  if ((PROFILE.battles || 0) >= 2 && B.round >= 2) c.push('vigil');
  const k = c.find(x => !vus[x]);
  if (!k) return;
  vus[k] = 1;
  queueSave();
  const [t, d] = ASTUCES429[k];
  showTip429(t, d); // #tip429 : src/screens/overlays/Tip429.jsx
}


function finTip429() {
  if (!B || B.over) hideTip429();
}


/** Après chaque rendu du combat : animations selon le réglage, astuce éventuelle. */
export function vivRender429() {
  calme429();
  finTip429();
  clearTimeout(vivRender429.t);
  if (B && !B.over) vivRender429.t = setTimeout(astuces429, 650);
}


/* ---------- 4. difficulté Expert : des adversaires qui se coordonnent ---------- */
export function expert429(S, e, m, k, pos, sim) {
  let b = 0;
  const typ = mvType(S, sim, m);
  for (const x of affected(S, sim, m, k)) {
    const v = uAt(S, x);
    if (!v || v.side !== 'a' || v.ko) continue;
    b += (1 - v.hp / v.mhp) * 20; // on achève le plus entamé
    if (teff(typ, v.t) > 1) b += 10; // on enchaîne les types efficaces
    if (notesDe(S, v) > 0) b += 6; // on profite des coups déjà portés dans la manche
  }
  if (!e.boss) {
    const chef = S.units.find(o => o.side === 'e' && !o.ko && o.boss && o !== e);
    if (chef && chef.hp < chef.mhp * 0.7 && hdist(pos, chef.pos) === 1) b += 12; // on protège le chef
  }
  return b;
}


function rivAce429() {
  const L0 = RIVAL_LINE[rivalStarter()];
  return L0 ? L0[2] : 'aligatueur';
}


export function rivBuild429() {
  Object.entries(RIV429).forEach(([k, R]) => {
    const b = SCEN[R.base];
    if (!b) return;
    const dis = k === 'hd429',
      team = (dis ? R.team : [rivAce429(), ...R.team]).filter(id => BY[id]);
    SCEN[k] = {
      n: R.n,
      lvl: dis ? 'Hoenn · Dissonance' : `Rival · ${REGN421[R.reg]}`,
      lim: 11,
      time: dis ? 'nuit' : 'jour',
      bio: dis ? 'roche' : b.bio,
      rule: dis ? 'jbrouille' : undefined,
      water: R.water,
      rock: R.rock,
      hb: Math.round((b.hb || 20) * 1.08),
      pb: (b.pb || 3) + 1,
      lv: (b.lv || 50) + 2,
      style: dis ? 'boss' : 'rival',
      at: BY[team[0]].t[0],
      rival429: k,
      d: dis
        ? 'Une cellule oubliée de la Dissonance brouille Hoenn : en fin de manche, votre Pokémon le plus chargé perd 1 losange. Éveillez vite vos Pokémon !'
        : `Kael revient avec ${BY[team[0]].n} et une équipe de ${REGN421[R.reg]}. Il a progressé autant que vous.`,
      foes: team.map((id, j) => [id, RIVAL_POS[j]])
    };
    OBST[k] = R.obst;
  });
}


export function lockRiv429(D) {
  if (!RIV429 || !D) return null;
  const R = RIV429[D.rival429];
  if (!R) return null;
  const n = (R.reg === 2 ? PROFILE.johto : PROFILE.hoenn) || [];
  if (n.length < R.after) return `${D.rival429 === 'hd429' ? 'Les Échos se montreront' : 'Kael vous attend'} après ${R.after} badges de ${REGN421[R.reg]}.`;
  return null;
}


export function leader429(sc) {
  if (!RIV429) return null;
  const D = SCEN[sc];
  if (!D) return null;
  if (D.cap429) {
    const lg = LEGS.find(x => x.id === D.cap429);
    return lg ? { n: lg.n, t: lg.title, q: `${lg.n} ne fuit plus. Il vous observe… et vous attend.`, w: lg.w, l: lg.l } : null;
  }
  const R = RIV429[sc];
  if (!R) return null;
  return sc === 'hd429' ? { n: R.who, t: R.t, q: R.q, w: R.w, l: R.l } : Object.assign({}, RIVAL, { q: R.q, w: R.w, l: R.l });
}


export function qui429(who) {
  if (who === 'kael') {
    const ace = BY[rivAce429()];
    return { n: 'Kael Ferrand', av: avatar('Kael Ferrand', ace ? ace.t[0] : 'Normal', 'sm') };
  }
  if (who === 'sirene') return { n: 'Sirène', av: avatar('Sirène', 'Ténèbres', 'sm') };
  if (who === 'vesper') return { n: 'Vesper', av: avatar('Vesper', 'Spectre', 'sm') };
  return null;
}


/** Scène d'après-combat : une seule fois, après une victoire. */
export function apres429(sc, win, force) {
  const c = 'apres-' + sc,
    Lg = APRES429[sc];
  if (!win || !Lg || (AUTO && !force) || (PROFILE.scenes && PROFILE.scenes[c]) || (SCN && SCN.c === c)) return;
  if (sc === 'champ' && !isCamp()) return;
  apres429.vu = apres429.vu || {};
  if (apres429.vu[c]) return;
  apres429.vu[c] = 1;
  setTimeout(() => {
    if ((B && !B.over) || SCN) return;
    __set_SCN({ k: sc, c, i: 0, L: Lg, apres: true });
    renderScene417();
    $('#scene417').hidden = false;
  }, 700);
}


function regLeg429(id) {
  return id === 'mewtwo' ? 1 : 2;
}


export function etapesLeg429(L) {
  const r = regLeg429(L.id),
    c = famCapt428(r);
  return [
    { ok: (PROFILE.legends || []).includes(L.id), t: `Vaincre ${L.n} (Combats › Après-jeu)` },
    { ok: (PROFILE.dipl428 || []).includes(r), t: `Compléter le Pokédex de ${REGN421[r]} (${c.n} / ${c.t})` },
    ...(isCamp() ? [{ ok: !!PROFILE.hchamp, t: 'Devenir Maître de Hoenn' }] : [])
  ];
}


export function lockLeg429(k) {
  const D = SCEN[k];
  if (!D || !D.cap429) return null;
  if (PROFILE.box.includes(D.cap429)) return `${BY[D.cap429].n} est déjà dans votre Box.`;
  const e = etapesLeg429(LEGS.find(L => L.id === D.cap429)).find(x => !x.ok);
  return e ? `Quête légendaire : ${e.t.replace(/ \(.*\)$/, '')} d’abord.` : null;
}


// rangée « Légendes » de l'écran Équipe : rendue par React (src/screens/equipe/DexCall.jsx)


// Quêtes › Légendes : rendu par React (src/screens/quetes/Legendes.jsx)


/* ---------- 7. défi de la semaine ---------- */
function semaine429(d) {
  d = d || new Date();
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())),
    j = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - j);
  const a = new Date(Date.UTC(t.getUTCFullYear(), 0, 1)),
    n = Math.ceil(((t - a) / 864e5 + 1) / 7);
  return `${t.getUTCFullYear()}-S${String(n).padStart(2, '0')}`;
}


export function alea429(w) {
  let a = 0;
  for (let i = 0; i < w.length; i++) a = (Math.imul(a ^ w.charCodeAt(i), 2654435761) + 0x9e3779b9) | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}


export function hebdoBuild429() {
  const w = semaine429();
  if (HEB429 && HEB429.w === w && SCEN.hebdo429) return HEB429;
  const r = alea429(w),
    pick = L0 => L0[Math.floor(r() * L0.length)],
    R = Object.assign({}, HEBDO429[Math.floor(r() * HEBDO429.length)]),
    bases = ['a4', 'a5', 'a6', 'a7', 'a8', 'j3', 'j5', 'j6', 'j7', 'h3', 'h5', 'h6'].filter(k => SCEN[k] && SCEN[k].foes),
    bk = pick(bases),
    fam = RECRUIT.map(m => famOf(m.id)).filter(f => f.length),
    fin = f => f.filter(x => !x.nx || !BY[x.nx]).sort((a, b) => b.st - a.st)[0] || f[f.length - 1],
    melange = L0 => {
      const a = [...L0];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(r() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    };
  let team;
  if (R.k === 'debut') team = melange(RECRUIT).slice(0, 4).map(m => m.id);
  else if (R.k === 'mono') {
    const types = [...new Set(fam.flatMap(f => fin(f).t))].filter(t => fam.filter(f => fin(f).t.includes(t)).length >= 4).sort(),
      T = pick(types);
    team = melange(fam.filter(f => fin(f).t.includes(T))).slice(0, 4).map(f => fin(f).id);
    R.n = `Monotype ${T}`;
    R.d = `Une équipe de location 100 % ${T}.`;
  } else team = melange(fam).slice(0, 4).map(f => fin(f).id);
  const b = SCEN[bk],
    D = Object.assign({}, b, {
      n: 'Défi de la semaine',
      lvl: `Semaine ${w.slice(-2)} · ${R.n}`,
      d: `${R.d} Terrain et adversaires : « ${b.n} ». Le meilleur score est gardé ; récompense à la première victoire de la semaine.`,
      hebdo429: w,
      regle429: R.k,
      pret429: team,
      lim: R.k === 'chrono' ? 6 : b.lim || 10,
      catch: false
    });
  PROGRES429.forEach(x => delete D[x]);
  SCEN.hebdo429 = D;
  OBST.hebdo429 = OBST[bk] || {};
  HEB429 = { w, R, bk, team };
  return HEB429;
}


/** L’équipe de location du défi, avec des réglages identiques pour tout le monde. */
export function hebdoTeam429() {
  const D = SCEN[scSel];
  if (scSel !== 'hebdo429' || !D || !D.pret429) return null;
  return {
    team: D.pret429.slice(),
    voix: 0,
    opts: Object.assign(battleOpts(), { diff: 'normal', items: {}, fatigue: {}, links: {}, mut: null, defis: [], dojo: 0, apprises: {}, desob: false, caracteres: false })
  };
}


export function monHebdo429() {
  const h = PROFILE.hebdo429;
  return h && h.w === semaine429() ? { w: h.w, s: h.best } : null;
}


function scoreHebdo429(S, win) {
  const al = S.units.filter(u => u.side === 'a'),
    vivants = al.filter(u => !u.ko).length,
    pv = al.reduce((a, u) => a + (u.ko ? 0 : u.hp / u.mhp), 0) / Math.max(1, al.length),
    lim = (SCEN[S.sc] || {}).lim || 10,
    ko = S.units.filter(u => u.side === 'e' && u.ko).length;
  return win ? 1000 + Math.max(0, lim - S.round) * 60 + Math.round(pv * 400) + vivants * 50 : Math.min(900, ko * 120 + S.round * 10);
}


// Quêtes › Événement : défi de la semaine rendu par React (src/screens/quetes/Evenement.jsx)


/* le bouton #v4Hebdo de l'Accueil est rendu par React (src/screens/accueil/Bas.jsx) */

// Instructions exécutées au démarrage, dans l'ordre d'origine (voir index.js).
export function __init() {

/* ---------- 2. gestes tactiles ---------- */
LP429 = { t: 0, x: 0, y: 0, fait: 0 };


document.addEventListener(
  'pointerdown',
  e => {
    clearTimeout(LP429.t);
    LP429.fait = 0; // un nouveau geste : l’appui long précédent est oublié
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const a = actionLp429(e.target);
    if (!a) return;
    LP429.x = e.clientX;
    LP429.y = e.clientY;
    LP429.t = setTimeout(() => {
      LP429.fait = Date.now();
      vibe(15);
      a();
    }, 480);
  },
  { passive: true }
);


finLp429 = () => clearTimeout(LP429.t);


document.addEventListener('pointerup', finLp429, { passive: true });


document.addEventListener('pointercancel', finLp429, { passive: true });


document.addEventListener(
  'pointermove',
  e => {
    if (Math.abs(e.clientX - LP429.x) + Math.abs(e.clientY - LP429.y) > 12) clearTimeout(LP429.t);
  },
  { passive: true }
);


// le relâché qui suit un appui long ne déclenche pas aussi le clic
document.addEventListener(
  'click',
  e => {
    if (LP429.fait && Date.now() - LP429.fait < 700) {
      LP429.fait = 0;
      e.preventDefault();
      e.stopPropagation();
    }
  },
  true
);


document.addEventListener('contextmenu', e => {
  if (actionLp429(e.target)) e.preventDefault();
});


/* glisser pour changer d'onglet */
ONGLETS429 = ['accueil', 'pokedex', 'combat', 'carte'];


SW429 = { x: 0, y: 0, t: 0, ok: false };


document.addEventListener(
  'touchstart',
  e => {
    if (e.touches.length !== 1) {
      SW429.ok = false;
      return;
    }
    const p = e.touches[0];
    Object.assign(SW429, { x: p.clientX, y: p.clientY, t: Date.now(), ok: glisserOk429(e.target) });
  },
  { passive: true }
);


document.addEventListener(
  'touchend',
  e => {
    if (!SW429.ok) return;
    SW429.ok = false;
    const p = e.changedTouches[0],
      dx = p.clientX - SW429.x,
      dy = p.clientY - SW429.y;
    if (Date.now() - SW429.t > 650 || Math.abs(dx) < 80 || Math.abs(dy) > Math.abs(dx) * 0.5) return;
    const pg = document.querySelector('.page.on'),
      i = ONGLETS429.indexOf(pg && pg.id),
      j = i + (dx < 0 ? 1 : -1);
    if (i < 0 || j < 0 || j >= ONGLETS429.length) return;
    go(ONGLETS429[j]);
    try {
      window.scrollTo(0, 0);
    } catch (er) {}
  },
  { passive: true }
);


/* ---------- 3. astuces au bon moment ---------- */
ASTUCES429 = {
  capture: ['Capturer un Pokémon', 'Affaiblissez-le sous 25 % de ses PV et immobilisez-le (Sommeil, Paralysie, Gel, Racines ou Toile). Sélectionnez ensuite un allié à son contact, puis touchez l’adversaire : le panneau « Capture » lance la Ball pour 2 Voix.'],
  reso: ['Notes de Résonance', 'Chaque allié qui frappe la même cible dans la manche y pose une note. À 3 notes, Résonance : dégâts ×1,5 et un écho selon le type. Frappez ensemble !'],
  eveil: ['L’Éveil', 'Un de vos Pokémon a ses losanges pleins : sélectionnez-le, puis « Éveiller ». Il évolue en plein combat et devient plus fort tout de suite.'],
  forme: ['Forme Résonante', 'Un Pokémon au stade final, losanges pleins, peut prendre sa Forme Résonante pour 3 manches. Une seule fois par combat : gardez-la pour le moment clé.'],
  encercle: ['Encerclement', 'Un Pokémon au contact de 2 adversaires ou plus subit +20 % de dégâts et perd 1 Mouvement. Ça marche aussi contre eux : entourez les cibles !'],
  phase: ['Boss à phases', 'Ce boss change de tactique à 66 % puis à 33 % de ses PV. Gardez des Voix et des soins pour sa dernière phase.'],
  danger: ['Dangers annoncés', 'Une zone est annoncée une manche à l’avance : tout Pokémon qui y reste à la fin de la manche est touché, allié comme adversaire.'],
  vigil: ['Vigilance', 'Au lieu d’attaquer, un Pokémon peut surveiller : il frappe le premier adversaire qui entre à sa portée, avant que celui-ci n’attaque.']
};


document.addEventListener('click', e => {
  const b = e.target.closest('[data-tip429]');
  if (!b) return;
  if (b.dataset.tip429 === 'off') {
    PREF.tips429 = false;
    savePref();
    toast('Astuces désactivées. Réactivez-les dans les Paramètres.');
  }
  hideTip429();
  if (B) setTimeout(astuces429, 400);
});


/* ---------- 5. histoire et rival ---------- */
RIV429 = {
  rv5: {
    reg: 2,
    after: 4,
    n: 'Rival · Kael à Johto',
    base: 'j5',
    team: ['noarfang', 'azumarill', 'demolosse'],
    water: ['5,0'],
    rock: ['3,1', '4,4'],
    obst: { pil: ['4,2'], sand: ['2,1', '2,4'] },
    x: 560,
    y: 330,
    rew: [5000, 25],
    q: 'Johto m’a endurci. Toi, tu as juste collectionné des badges. On va voir lequel de nous deux a vraiment progressé.',
    w: 'Encore toi… D’accord. Je file à Hoenn. Là-bas, personne ne te connaît.',
    l: 'Tu vois ? À Johto, c’est moi qui fais la loi.'
  },
  rv6: {
    reg: 3,
    after: 4,
    n: 'Rival · Kael à Hoenn',
    base: 'h5',
    team: ['galeking', 'drattak', 'noarfang'],
    water: ['4,0', '5,5'],
    rock: ['3,2'],
    obst: { pil: ['4,3'], grass: ['2,2', '2,3'] },
    x: 440,
    y: 470,
    rew: [6500, 30],
    q: 'Galeking, Drattak… et mon partenaire du premier jour. Cette fois, on ne joue plus.',
    w: '…Tu es meilleur que moi. Pour l’instant. Le Maître de Hoenn t’attend : ne perds pas contre lui.',
    l: 'Hoenn, c’est mon terrain maintenant.'
  },
  hd429: {
    reg: 3,
    after: 6,
    n: 'Les Échos de la Dissonance',
    base: 'h7',
    team: ['absol', 'tenefix', 'nostenfer', 'demolosse'],
    water: [],
    rock: ['3,1', '3,4'],
    obst: { pil: ['4,2'], grass: ['2,1', '2,4'] },
    x: 715,
    y: 445,
    rew: [7000, 35],
    who: 'Sirène',
    t: 'la voix des Échos',
    q: 'Les Échos n’obéissent qu’à une voix : la mienne. Notre brouilleur portera la Dissonance jusqu’au Plateau.',
    w: 'Les Échos se taisent… Cobalt avait tort. On ne contrôle pas la Résonance.',
    l: 'Écoute ce silence. Plus un losange, plus un Éveil.'
  }
};


rivBuild429();


PLACES_J.push({ id: 'rv5', x: RIV429.rv5.x, y: RIV429.rv5.y, n: 'Kael', s: 'Rival · après 4 badges de Johto', grp: 'aventure', j: 1 });


PLACES_H.push({ id: 'rv6', x: RIV429.rv6.x, y: RIV429.rv6.y, n: 'Kael', s: 'Rival · après 4 badges de Hoenn', grp: 'aventure', j: 1 });


PLACES_H.push({ id: 'hd429', x: RIV429.hd429.x, y: RIV429.hd429.y, n: 'Grotte des Échos', s: 'Dissonance · Sirène', grp: 'aventure', j: 1 });


[...PLACES_J, ...PLACES_H].forEach(p => (PL[p.id] = p));


CROCHETS.progres.push((S, rew, win) => {
  const D = SCEN[S.sc] || {};
  if (!win || !D.rival429 || (PROFILE.riv429 || []).includes(D.rival429)) return null;
  PROFILE.riv429 = [...(PROFILE.riv429 || []), D.rival429];
  rew.riv429 = D.rival429;
  return RIV429[D.rival429].rew;
});


CROCHETS.resultat.push(r =>
  r.riv429
    ? `<div class="res-l"><h4>${r.riv429 === 'hd429' ? 'Dissonance' : 'Rival'}</h4><div class="rl"><span>${r.riv429 === 'hd429' ? 'Les Échos de la Dissonance sont réduits au silence.' : `Kael est battu à ${REGN421[RIV429[r.riv429].reg]}.`}</span><b>+${fmt(RIV429[r.riv429].rew[0])} ₽ · +${RIV429[r.riv429].rew[1]} Éclats</b></div></div>`
    : ''
);


Object.assign(SCENES, {
  rv5: [
    ['kael', 'Te voilà à Johto aussi ? J’ai traversé la région à pied pendant que tu prenais le bateau.'],
    ['kael', 'Mon équipe a changé. J’ai capturé ce que Johto avait de plus coriace.'],
    ['prof', 'Kael a beaucoup progressé… Frappez la même cible à plusieurs : les notes de Résonance feront la différence.']
  ],
  rv6: [
    ['kael', 'Je t’avais dit que je partais à Hoenn. Je n’avais pas dit que je t’attendrais.'],
    ['kael', 'Cette fois, mon partenaire du premier jour est au sommet de sa forme.'],
    ['prof', 'C’est son meilleur niveau. Ne le laissez pas encercler vos Pokémon !']
  ],
  hd429: [
    ['vesper', 'Attends ! C’est moi, Vesper. J’ai quitté la Dissonance après Johto… mais certains n’ont jamais reçu l’ordre d’arrêter.'],
    ['sirene', 'Les Échos n’obéissent qu’à une voix : la mienne.'],
    ['vesper', 'Son brouilleur vide les losanges de vos Pokémon à chaque fin de manche. Éveillez-les dès que possible !']
  ]
});


if (!SCENES.h1)
  SCENES.h1 = [
    ['prof', 'Hoenn ! Des volcans, des forêts tropicales et la mer à perte de vue.'],
    ['prof', 'Huit arènes, chacune avec sa règle, et un Maître au Plateau. Lisez bien la règle avant de lancer le combat.']
  ];


if (!SCENES.hchamp)
  SCENES.hchamp = [
    ['prof', 'Le Plateau de Hoenn… Huit badges, et Kael qui vous suit de près.'],
    ['prof', 'Le Maître change de tactique à chaque phase. Gardez des Voix et des soins pour la fin.']
  ];


APRES429 = {
  champ: [['prof', 'Championne vaincue ! Kanto vous appartient… et Johto vous attend, au bout de la Route 29.']],
  jchamp: [['prof', 'Maître de Johto ! Kael vient de m’appeler : il est parti pour Hoenn. Vous devriez le suivre.']],
  rv5: [
    ['kael', 'Encore toi… Tu sais quoi ? Je file à Hoenn.'],
    ['prof', 'Votre rival n’abandonne jamais. On le reverra, j’en suis sûre.']
  ],
  rv6: [
    ['kael', '…D’accord. Tu es meilleur que moi. Pour l’instant.'],
    ['kael', 'Le Maître de Hoenn t’attend. Si tu perds contre lui, je ne te le pardonnerai pas.']
  ],
  hd429: [
    ['sirene', 'Les Échos se taisent… On ne contrôle pas la Résonance.'],
    ['vesper', 'Cette fois, c’est vraiment fini. Merci… Je vais aider le Prof. Sorbier à réparer ce qu’on a abîmé.']
  ],
  hchamp: [
    ['prof', 'Maître de Hoenn ! Trois régions, une seule Résonance.'],
    ['prof', 'On raconte que les légendes ne fuient plus devant vous… Ouvrez l’onglet « Légendes » des Quêtes : elles peuvent désormais être capturées.']
  ]
};


/* ---------- 6. légendaires capturables ---------- */
LEGS.forEach(L => {
  BY[L.id].c = 8; // une légende dans l’équipe coûte 8 PC
  const lk = legKey(L.id);
  if (SCEN[lk]) SCEN[lk].d = SCEN[lk].d.replace(/Il ne peut pas être capturé[^.]*\.[^.]*\./, 'Vaincu, il pourra être capturé une fois sa quête terminée (Quêtes › Légendes).');
});


LEGS.forEach(L => {
  const k = 'lc' + L.id,
    src = SCEN[legKey(L.id)];
  if (!src) return;
  SCEN[k] = Object.assign({}, src, {
    n: `${L.n} · capture`,
    lvl: `Légende · ${L.title}`,
    catch: true,
    cap429: L.id,
    d: `${L.n} ne fuit plus. Affaiblissez-le sous 25 %, immobilisez-le, puis capturez-le avec un allié à son contact. Son escorte ne se capture pas.`
  });
  OBST[k] = OBST[legKey(L.id)] || {};
});


HEBDO429 = [
  { k: 'location', n: 'Équipe de location', d: 'Tout le monde joue la même équipe, tirée au sort pour la semaine.' },
  { k: 'mono', n: 'Monotype', d: 'Une équipe de location d’un seul type.' },
  { k: 'debut', n: 'Premiers pas', d: 'Quatre Pokémon au premier stade : à vous de les éveiller en combat.' },
  { k: 'chrono', n: 'Contre-la-montre', d: 'Une équipe de location, et seulement 6 manches pour gagner.' }
];


// le défi reprend les adversaires d’un combat sans ses récompenses de progression
PROGRES429 = ['gym', 'elite', 'champ', 'johto', 'hoenn', 'hfinal', 'jfinal', 'jdis', 'roam', 'legend', 'rival', 'dissonance', 'colosse', 'lac', 'tower', 'tuto', 'ami', 'rival429', 'cap429', 'dom', 'jafter', 'after', 'daily', 'tdr'];


HEB429 = null;


CROCHETS.progres.push((S, rew, win) => {
  const D = SCEN[S.sc] || {};
  if (!D.hebdo429) return null;
  const w = D.hebdo429,
    sc = scoreHebdo429(S, win);
  let h = PROFILE.hebdo429;
  if (!h || h.w !== w) h = PROFILE.hebdo429 = { w, best: 0, n: 0, rec: 0, win: 0 };
  h.n++;
  const record = sc > h.best;
  if (record) h.best = sc;
  if (win) h.win = 1;
  rew.hebdo429 = { sc, best: h.best, record };
  if (win && !h.rec) {
    h.rec = 1;
    rew.hebdo429.prime = 1;
    return [2500, 25];
  }
  return null;
});


CROCHETS.resultat.push(r =>
  r.hebdo429
    ? `<div class="res-l"><h4>Défi de la semaine</h4><div class="rl"><span>Score ${fmt(r.hebdo429.sc)}${r.hebdo429.record ? ' · nouveau record !' : ` · record ${fmt(r.hebdo429.best)}`}${r.hebdo429.prime ? ' · première victoire de la semaine : +2 500 ₽ · +25 Éclats' : ''}</span><b>${r.hebdo429.record ? '★' : ''}</b></div><p class="v4-note">Partagez votre carte de dresseur (Amis) : vos amis verront ce score.</p></div>`
    : ''
);


document.addEventListener('click', e => {
  if (!e.target.closest('[data-hebdo429],[data-news="hebdo429"]')) return;
  e.stopPropagation();
  V4.qTab = 'event';
  go('quetes');
  if (typeof renderQuests === 'function') renderQuests();
});


document.addEventListener('click', e => {
  if (!e.target.closest('[data-news="leg429"]')) return;
  e.stopPropagation();
  V4.qTab = 'leg';
  go('quetes');
  if (typeof renderQuests === 'function') renderQuests();
});


document.addEventListener('change', e => {
  const p = e.target.closest('[data-pref="anim429"]');
  if (p) calme429();
});


NEWS416.unshift(
  ['i-trophy', 'Défi de la semaine', 'Même équipe et même règle pour tous, chaque semaine. Meilleur score gardé, récompense à la première victoire, classement entre amis.', 'hebdo429'],
  ['i-star', 'Légendes capturables', 'Mewtwo, Raikou, Entei, Suicune, Lugia et Ho-Oh : terminez leur quête pour les capturer (Quêtes › Légendes).', 'leg429'],
  ['i-bolt', 'Combats plus vivants', 'Pokémon animés, appui long pour la fiche, glisser pour changer d’onglet, astuces du Prof., Expert plus malin, et Kael revient à Johto et à Hoenn.', null]
);


NEWS416.splice(8);
}
