/* Original section: v4.29-01-qualite.js */
import { bdClass, tokCl, tokHas } from '../screens/combat/board/boardStore.js';

import { MV } from './005-moves.js';
import { BY, MON, SCEN, familyOf } from './009-pokemon.js';
import { RECRUIT } from './010-in-battle-evolution.js';
import { PROFILE, isCamp } from './011-game-state.js';
import { $, RM, after2images, mulberry32, toast } from './014-utils.js';
import { HOOKS } from './015-hooks.js';
import { go } from './016-navigation.js';
import { openSheet } from './020-team-cards.js';
import { EMAX, affected, byUid, canAwaken, hdist, mvType, teff, uAt, uk } from './021-combat-engine.js';
import { OBST } from './023-roles-synergies-obstacles.js';
import { B, HC, L, battleOpts, scSel, ui } from './024-combat-ui.js';
import { queueSave } from './025-saves.js';
import { PREF, savePref, vibe } from './026-campaign-tutorial-sound.js';
import { AUTO } from './030-prestige-staging.js';
import { avatar } from './031-home-journey.js';
import { hideTooltip, showTooltip } from '../screens/overlays/shellOverlays.js';
import { V4, fmt } from './032-v4-foundation.js';
import { PL, renderMap } from './037-map.js';
import { renderQuests } from './039-quests-shop.js';
import { LEGS, RIVAL, RIVAL_LINE, RIVAL_POS, legKey, rivalStarter } from './043-adventure-plus.js';
import { notesOf } from './053-resonance.js';
import { PLACES_J } from './054-johto.js';
import { SCENES, SCN, __set_SCN, renderStoryScene, resonanceCandidate } from './057-companions-resonance.js';
import { PLACES_H } from './059-hoenn.js';
import { hasBossPhases, isSurrounded } from './060-intense-combat.js';
import { FAMILY_REGION_NAMES } from './061-catch-anywhere.js';
import { familyCaptureStats } from './063-combat-catches-home.js';

let WEEK_CACHE;

/* =====================================================================
   v4.29: gameplay quality
   1. Expressive Pokémon: idle breathing, lunge toward the target, recoil
      under hits, fall on K.O. ("Pokémon animés" setting).
   2. Touch gestures: long press on a Pokémon = its sheet; swipe to
      change tab; vibration on strong hits.
   3. Tips at the right time: Prof. Sorbier explains a mechanic the
      first time it appears in battle.
   4. Expert difficulty: opponents coordinate (finish off the most
      damaged one, chain effective types, protect their leader).
   5. Story and rival: Kael returns in Johto and Hoenn, the Echoes of
      Dissonance in Hoenn; scenes before and after the big battles.
   6. Capturable legendaries: one quest per legend, then a capture
      battle; legends join the Box (8 PC).
   7. Challenge of the week: same rule and same team for everyone, best
      score kept, reward once a week, ranking among friends.
   Tables read by functions called elsewhere are declared with "var":
   never a load-order error.
   ===================================================================== */
export function QUALITY_PASS_0() {
  return { seenTips: {}, rivalsMet: [], hebdo429: null };
}

export function qualityPassClean(p) {
  const o = QUALITY_PASS_0();
  if (!p || typeof p !== 'object') {
    return o;
  }
  if (p.seenTips && typeof p.seenTips === 'object') {
    Object.keys(p.seenTips).forEach(k => /^[a-z]{2,12}$/.test(k) && (o.seenTips[k] = 1));
  }
  if (Array.isArray(p.rivalsMet)) {
    o.rivalsMet = [...new Set(p.rivalsMet.filter(x => ['rv5', 'rv6', 'hd429'].includes(x)))];
  }
  const h = p.hebdo429;
  if (h && typeof h === 'object' && typeof h.w === 'string' && /^\d{4}-S\d\d$/.test(h.w)) {
    o.hebdo429 = {
      w: h.w,
      best: Number.isFinite(h.best) ? Math.max(0, Math.min(99999, Math.floor(h.best))) : 0,
      n: Number.isFinite(h.n) ? Math.max(0, Math.min(999, Math.floor(h.n))) : 0,
      rec: h.rec ? 1 : 0,
      win: h.win ? 1 : 0,
    };
  }
  return o;
}

/** This week's score on the trainer card. */
export function sanitizeWeekly(x) {
  return x && typeof x === 'object' && typeof x.w === 'string' && /^\d{4}-S\d\d$/.test(x.w) && Number.isFinite(x.s)
    ? { w: x.w, s: Math.max(0, Math.min(99999, Math.floor(x.s))) }
    : null;
}

/** Displayed Box: captured legends don't count in "Box x / 151". */
export function boxCount() {
  return PROFILE.box.filter(id => !(BY[id] && BY[id].leg)).length;
}

/* ---------- 1. expressive Pokémon ---------- */
export function animEnabled() {
  return !RM && PREF.animEnabled !== false;
}

/** All the token's parts sit in an inner .tok-b group (Units.jsx): it moves without
    shifting the tile. Each token breathes with a different offset. */
export function liveToken(T) {
  liveToken.n = (liveToken.n || 0) + 1;
  T.dl = (-((liveToken.n * 0.77) % 3.4)).toFixed(2) + 's';
  return T;
}

/* Restarts a small token animation. If it is already playing, restart it two frames later
   (rather than forcing a layout of the whole page). */
export function replayAnimation(T, cl, ms) {
  const g = T && T.g;
  if (!g) {
    return;
  }
  clearTimeout(T['t_' + cl]);
  const launchMove = () => {
    tokCl(T, cl, true);
    clearTimeout(T['t_' + cl]);
    T['t_' + cl] = setTimeout(() => tokCl(T, cl, false), ms);
  };
  if (!tokHas(T, cl)) {
    return launchMove();
  }
  tokCl(T, cl, false);
  after2images(launchMove);
}

function bondHop(uid, k) {
  const T = L.u && L.u[uid],
    u = B && byUid(B, uid);
  if (!animEnabled() || !T || !T.b || !u || u.ko) {
    return;
  }
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
  replayAnimation(T, 'lunge-hit', 560);
}

export function hurtFlash(uid) {
  const T = L.u && L.u[uid];
  if (animEnabled() && T && T.b) {
    replayAnimation(T, 'hurt-flash', 480);
  }
}

export function liveEvent(ev) {
  if (!B || !ev || !ev.length) {
    return;
  }
  const sv = document.getElementById('bSvg');
  if (sv) {
    sv.style.setProperty('--anim-scale', PREF.fast || ui.skipSpeedup ? '0.6' : '1');
  }
  ev.forEach(x => {
    if (x.e === 'use' && x.u && x.k) {
      bondHop(x.u, x.k);
    }
  });
  // vibration: one of your Pokémon takes a big hit, or a Pokémon is knocked out
  const ko = ev.some(x => x.e === 'ko'),
    strongSpot = ev.some(x => {
      if (x.e !== 'dmg') {
        return false;
      }
      const v = byUid(B, x.u);
      return v && v.side === 'a' && x.v >= v.mhp * 0.3;
    });
  if (ko || strongSpot) {
    vibe(ko ? [18, 40, 22] : 28);
  }
}

function applyCalmMode() {
  bdClass('calm-motion', !animEnabled()); // class of #bBoard, rendered by React
}

function longPressAction(t) {
  if (!t || !t.closest) {
    return null;
  }
  const hx = t.closest('#bSvg [data-k]');
  if (hx && B) {
    const u = uAt(B, hx.dataset.k);
    return u ? () => openSpeciesSheet(u.sp) : null;
  }
  const tok = t.closest('#bSvg .tok');
  if (tok && B && L.u) {
    for (const id in L.u) {
      if (L.u[id].g === tok) {
        const u = byUid(B, id);
        return u ? () => openSpeciesSheet(u.sp) : null;
      }
    }
    return null;
  }
  const mk = t.closest('#mapMarks [data-place]');
  if (mk) {
    return () => {
      V4.mapSel = mk.dataset.place;
      renderMap();
      const i = document.getElementById('mapInfo');
      if (i && i.scrollIntoView) {
        i.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'center' });
      }
    };
  }
  const c = t.closest('[data-open],.v4-dl[data-dex],[data-species-sheet]');
  if (!c) {
    return null;
  }
  const id = c.dataset.open || c.dataset.dex || c.dataset.speciesSheet;
  return id && BY[id] ? () => openSpeciesSheet(id) : null;
}

/** A Pokémon's sheet; for a legend or an opponent with no sheet, a summary. */
function openSpeciesSheet(id) {
  const m = BY[id];
  if (!m) {
    return;
  }
  if (m.leg || m.isEnemy || !MON.includes(m)) {
    toast(
      `${m.n} · ${m.t.join(' / ')}${m.leg ? ' · légende' : ''} : ${m.mv.map(x => (MV[x] ? MV[x].n : x)).join(', ')}.`
    );
    return;
  }
  openSheet(id);
}

function canSwipeHere(t) {
  if (PREF.swipeNav === false || !t || !t.closest || !t.closest('main,.content,.page')) {
    return false;
  }
  if (t.closest('input,textarea,select,#bBoard,.board,.v4-map,#mapMarks,.route,.v4-tabs,.v4-seg,[role="dialog"]')) {
    return false;
  }
  if (B && !B.over && document.querySelector('#cbBattle:not([hidden])')) {
    return false;
  }
  if ([...document.querySelectorAll('[role="dialog"],.sheet,.modal')].some(d => !d.hidden && d.offsetParent !== null)) {
    return false;
  }
  for (let x = t; x && x !== document.body; x = x.parentElement) {
    const o = getComputedStyle(x).overflowX;
    if ((o === 'auto' || o === 'scroll') && x.scrollWidth > x.clientWidth + 4) {
      return false;
    }
  }
  return true;
}

function seenTips(force) {
  if (!B || B.over || ui.busy || ui.cutscene || B.phase !== 'player' || (AUTO && !force) || PREF.seenTips === false) {
    return;
  }
  if ((SCEN[B.sc] || {}).tuto || document.getElementById('tip-card')) {
    return;
  }
  const seenSet = (PROFILE.seenTips = PROFILE.seenTips || {}),
    al = B.units.filter(u => u.side === 'a' && !u.ko),
    en = B.units.filter(u => u.side === 'e' && !u.ko),
    c = [];
  if (!B.noCatch) {
    c.push('capture');
  }
  if (al.some(u => canAwaken(B, u))) {
    c.push('eveil');
  }
  if (en.some(u => notesOf(B, u) > 0)) {
    c.push('reso');
  }
  if (al.some(u => u.en >= EMAX && resonanceCandidate(B, u))) {
    c.push('forme');
  }
  if (al.some(u => isSurrounded(B, u))) {
    c.push('encercle');
  }
  if (hasBossPhases(B)) {
    c.push('phase');
  }
  if (B.dangerZone) {
    c.push('danger');
  }
  if ((PROFILE.battles || 0) >= 2 && B.round >= 2) {
    c.push('vigil');
  }
  const k = c.find(x => !seenSet[x]);
  if (!k) {
    return;
  }
  seenSet[k] = 1;
  queueSave();
  const [t, d] = TIP_TEXTS[k];
  showTooltip(t, d); // #tipCard: src/screens/overlays/BattleTip.jsx
}

function endTooltip() {
  if (!B || B.over) {
    hideTooltip();
  }
}

/** After each battle render: animations according to the setting, tip if any. */
export function liveRender() {
  applyCalmMode();
  endTooltip();
  clearTimeout(liveRender.t);
  if (B && !B.over) {
    liveRender.t = setTimeout(seenTips, 650);
  }
}

/* ---------- 4. Expert difficulty: opponents that coordinate ---------- */
export function expertCoordination(S, e, m, k, pos, sim) {
  let b = 0;
  const typ = mvType(S, sim, m);
  for (const x of affected(S, sim, m, k)) {
    const v = uAt(S, x);
    if (!v || v.side !== 'a' || v.ko) {
      continue;
    }
    b += (1 - v.hp / v.mhp) * 20; // finish off the most damaged one
    if (teff(typ, v.t) > 1) {
      b += 10;
    } // chain effective types
    if (notesOf(S, v) > 0) {
      b += 6;
    } // take advantage of hits already landed this round
  }
  if (!e.boss) {
    const leader = S.units.find(o => o.side === 'e' && !o.ko && o.boss && o !== e);
    if (leader && leader.hp < leader.mhp * 0.7 && hdist(pos, leader.pos) === 1) {
      b += 12;
    } // protect the leader
  }
  return b;
}

function rivalAce() {
  const L0 = RIVAL_LINE[rivalStarter()];
  return L0 ? L0[2] : 'aligatueur';
}

export function buildRival() {
  Object.entries(RIVAL_CHALLENGES).forEach(([k, R]) => {
    const b = SCEN[R.base];
    if (!b) {
      return;
    }
    const dis = k === 'hd429',
      team = (dis ? R.team : [rivalAce(), ...R.team]).filter(id => BY[id]);
    SCEN[k] = {
      n: R.n,
      lvl: dis ? 'Hoenn · Dissonance' : `Rival · ${FAMILY_REGION_NAMES[R.reg]}`,
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
      rivalFight: k,
      d: dis
        ? 'Une cellule oubliée de la Dissonance brouille Hoenn : en fin de manche, votre Pokémon le plus chargé perd 1 losange. Éveillez vite vos Pokémon !'
        : `Kael revient avec ${BY[team[0]].n} et une équipe de ${FAMILY_REGION_NAMES[R.reg]}. Il a progressé autant que vous.`,
      foes: team.map((id, j) => [id, RIVAL_POS[j]]),
    };
    OBST[k] = R.obstacles;
  });
}

export function lockRival(D) {
  if (!RIVAL_CHALLENGES || !D) {
    return null;
  }
  const R = RIVAL_CHALLENGES[D.rivalFight];
  if (!R) {
    return null;
  }
  const n = (R.reg === 2 ? PROFILE.johto : PROFILE.hoenn) || [];
  if (n.length < R.after) {
    return `${D.rivalFight === 'hd429' ? 'Les Échos se montreront' : 'Kael vous attend'} après ${R.after} badges de ${FAMILY_REGION_NAMES[R.reg]}.`;
  }
  return null;
}

export function scenarioLeader(sc) {
  if (!RIVAL_CHALLENGES) {
    return null;
  }
  const D = SCEN[sc];
  if (!D) {
    return null;
  }
  if (D.captureLegend) {
    const lg = LEGS.find(x => x.id === D.captureLegend);
    return lg
      ? { n: lg.n, t: lg.title, q: `${lg.n} ne fuit plus. Il vous observe… et vous attend.`, w: lg.w, l: lg.l }
      : null;
  }
  const R = RIVAL_CHALLENGES[sc];
  if (!R) {
    return null;
  }
  return sc === 'hd429'
    ? { n: R.who, t: R.t, q: R.q, w: R.w, l: R.l }
    : Object.assign({}, RIVAL, { q: R.q, w: R.w, l: R.l });
}

export function npcProfile(who) {
  if (who === 'kael') {
    const ace = BY[rivalAce()];
    return { n: 'Kael Ferrand', av: avatar('Kael Ferrand', ace ? ace.t[0] : 'Normal', 'sm') };
  }
  if (who === 'sirene') {
    return { n: 'Sirène', av: avatar('Sirène', 'Ténèbres', 'sm') };
  }
  if (who === 'vesper') {
    return { n: 'Vesper', av: avatar('Vesper', 'Spectre', 'sm') };
  }
  return null;
}

/** Post-battle scene: only once, after a victory. */
export function afterBattleScene(sc, win, force) {
  const c = 'apres-' + sc,
    Lg = POST_BATTLE_DIALOGUE[sc];
  if (!win || !Lg || (AUTO && !force) || (PROFILE.scenes && PROFILE.scenes[c]) || (SCN && SCN.c === c)) {
    return;
  }
  if (sc === 'champ' && !isCamp()) {
    return;
  }
  afterBattleScene.seenFlags = afterBattleScene.seenFlags || {};
  if (afterBattleScene.seenFlags[c]) {
    return;
  }
  afterBattleScene.seenFlags[c] = 1;
  setTimeout(() => {
    if ((B && !B.over) || SCN) {
      return;
    }
    __set_SCN({ k: sc, c, i: 0, L: Lg, apres: true });
    renderStoryScene();
    $('#story-scene').hidden = false;
  }, 700);
}

function legendRegion(id) {
  return id === 'mewtwo' ? 1 : 2;
}

export function legendSteps(leg) {
  const r = legendRegion(leg.id),
    c = familyCaptureStats(r);
  return [
    { ok: (PROFILE.legends || []).includes(leg.id), t: `Vaincre ${leg.n} (Combats › Après-jeu)` },
    {
      ok: (PROFILE.regionDiplomas || []).includes(r),
      t: `Compléter le Pokédex de ${FAMILY_REGION_NAMES[r]} (${c.n} / ${c.t})`,
    },
    ...(isCamp() ? [{ ok: !!PROFILE.hchamp, t: 'Devenir Maître de Hoenn' }] : []),
  ];
}

export function lockLegendaryCapture(k) {
  const D = SCEN[k];
  if (!D || !D.captureLegend) {
    return null;
  }
  if (PROFILE.box.includes(D.captureLegend)) {
    return `${BY[D.captureLegend].n} est déjà dans votre Box.`;
  }
  const e = legendSteps(LEGS.find(leg => leg.id === D.captureLegend)).find(x => !x.ok);
  return e ? `Quête légendaire : ${e.t.replace(/ \(.*\)$/, '')} d’abord.` : null;
}

// "Legends" row of the Team screen: rendered by React (src/screens/team/DexCall.jsx)

// Quests › Legends: rendered by React (src/screens/quests/Legends.jsx)

/* ---------- 7. challenge of the week ---------- */
function weekNumber(d) {
  d = d || new Date();
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())),
    j = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - j);
  const a = new Date(Date.UTC(t.getUTCFullYear(), 0, 1)),
    n = Math.ceil(((t - a) / 864e5 + 1) / 7);
  return `${t.getUTCFullYear()}-S${String(n).padStart(2, '0')}`;
}

export function fingerprintRandom(w) {
  let a = 0;
  for (let i = 0; i < w.length; i++) {
    a = (Math.imul(a ^ w.charCodeAt(i), 2654435761) + 0x9e3779b9) | 0;
  }
  // without "|| 1" (unlike seededRng / stringSeededRng): a zero fingerprint always gives the same sequence as before
  return mulberry32(a);
}

export function buildWeeklyChallenge() {
  const w = weekNumber();
  if (WEEK_CACHE && WEEK_CACHE.w === w && SCEN.hebdo429) {
    return WEEK_CACHE;
  }
  const r = fingerprintRandom(w),
    pick = L0 => L0[Math.floor(r() * L0.length)],
    R = Object.assign({}, WEEKLY_PRESETS[Math.floor(r() * WEEKLY_PRESETS.length)]),
    bases = ['a4', 'a5', 'a6', 'a7', 'a8', 'j3', 'j5', 'j6', 'j7', 'h3', 'h5', 'h6'].filter(
      k => SCEN[k] && SCEN[k].foes
    ),
    bk = pick(bases),
    family = RECRUIT.map(m => familyOf(m.id)).filter(f => f.length),
    endStep = f => f.filter(x => !x.nx || !BY[x.nx]).sort((a, b) => b.st - a.st)[0] || f[f.length - 1],
    shuffleList = L0 => {
      const a = [...L0];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(r() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    };
  let team;
  if (R.k === 'debut') {
    team = shuffleList(RECRUIT)
      .slice(0, 4)
      .map(m => m.id);
  } else if (R.k === 'mono') {
    const types = [...new Set(family.flatMap(f => endStep(f).t))]
        .filter(t => family.filter(f => endStep(f).t.includes(t)).length >= 4)
        .sort(),
      T = pick(types);
    team = shuffleList(family.filter(f => endStep(f).t.includes(T)))
      .slice(0, 4)
      .map(f => endStep(f).id);
    R.n = `Monotype ${T}`;
    R.d = `Une équipe de location 100 % ${T}.`;
  } else {
    team = shuffleList(family)
      .slice(0, 4)
      .map(f => endStep(f).id);
  }
  const b = SCEN[bk],
    D = Object.assign({}, b, {
      n: 'Défi de la semaine',
      lvl: `Semaine ${w.slice(-2)} · ${R.n}`,
      d: `${R.d} Terrain et adversaires : « ${b.n} ». Le meilleur score est gardé ; récompense à la première victoire de la semaine.`,
      hebdo429: w,
      weeklyRule: R.k,
      rentalTeam: team,
      lim: R.k === 'chrono' ? 6 : b.lim || 10,
      catch: false,
    });
  PROGRESS_KEYS.forEach(x => delete D[x]);
  SCEN.hebdo429 = D;
  OBST.hebdo429 = OBST[bk] || {};
  WEEK_CACHE = { w, R, bk, team };
  return WEEK_CACHE;
}

/** The challenge's rental team, with identical settings for everyone. */
export function weeklyTeam() {
  const D = SCEN[scSel];
  if (scSel !== 'hebdo429' || !D || !D.rentalTeam) {
    return null;
  }
  return {
    team: D.rentalTeam.slice(),
    voice: 0,
    opts: Object.assign(battleOpts(), {
      diff: 'normal',
      items: {},
      fatigue: {},
      links: {},
      mut: null,
      challenges: [],
      dojo: 0,
      learnedTms: {},
      disobedience: false,
      characters: false,
    }),
  };
}

export function weeklyProgress() {
  const h = PROFILE.hebdo429;
  return h && h.w === weekNumber() ? { w: h.w, s: h.best } : null;
}

function weeklyScore(S, win) {
  const al = S.units.filter(u => u.side === 'a'),
    livingUnits = al.filter(u => !u.ko).length,
    hp = al.reduce((a, u) => a + (u.ko ? 0 : u.hp / u.mhp), 0) / Math.max(1, al.length),
    lim = (SCEN[S.sc] || {}).lim || 10,
    ko = S.units.filter(u => u.side === 'e' && u.ko).length;
  return win
    ? 1000 + Math.max(0, lim - S.round) * 60 + Math.round(hp * 400) + livingUnits * 50
    : Math.min(900, ko * 120 + S.round * 10);
}

// Quests › Event: challenge of the week rendered by React (src/screens/quests/Event.jsx)

/* the Home screen #v4Hebdo button is rendered by React (src/screens/home/Footer.jsx) */

/* ---------- 2. touch gestures ---------- */
const LONG_PRESS = { t: 0, x: 0, y: 0, fait: 0 };

const endLongPress = () => clearTimeout(LONG_PRESS.t);

/* swipe to change tab */
export const SWIPE_TABS = ['accueil', 'pokedex', 'combat', 'carte'];

const SWIPE_STATE = { x: 0, y: 0, t: 0, ok: false };

/* ---------- 3. tips at the right time ---------- */
const TIP_TEXTS = {
  capture: [
    'Capturer un Pokémon',
    'Affaiblissez-le sous 25 % de ses PV et immobilisez-le (Sommeil, Paralysie, Gel, Racines ou Toile). Sélectionnez ensuite un allié à son contact, puis touchez l’adversaire : le panneau « Capture » lance la Ball pour 2 Voix.',
  ],
  resonant: [
    'Notes de Résonance',
    'Chaque allié qui frappe la même cible dans la manche y pose une note. À 3 notes, Résonance : dégâts ×1,5 et un écho selon le type. Frappez ensemble !',
  ],
  eveil: [
    'L’Éveil',
    'Un de vos Pokémon a ses losanges pleins : sélectionnez-le, puis « Éveiller ». Il évolue en plein combat et devient plus fort tout de suite.',
  ],
  forme: [
    'Forme Résonante',
    'Un Pokémon au stade final, losanges pleins, peut prendre sa Forme Résonante pour 3 manches. Une seule fois par combat : gardez-la pour le moment clé.',
  ],
  encercle: [
    'Encerclement',
    'Un Pokémon au contact de 2 adversaires ou plus subit +20 % de dégâts et perd 1 Mouvement. Ça marche aussi contre eux : entourez les cibles !',
  ],
  phase: [
    'Boss à phases',
    'Ce boss change de tactique à 66 % puis à 33 % de ses PV. Gardez des Voix et des soins pour sa dernière phase.',
  ],
  danger: [
    'Dangers annoncés',
    'Une zone est annoncée une manche à l’avance : tout Pokémon qui y reste à la fin de la manche est touché, allié comme adversaire.',
  ],
  vigilance: [
    'Vigilance',
    'Au lieu d’attaquer, un Pokémon peut surveiller : il frappe le premier adversaire qui entre à sa portée, avant que celui-ci n’attaque.',
  ],
};

/* ---------- 5. story and rival ---------- */
export const RIVAL_CHALLENGES = {
  rv5: {
    reg: 2,
    after: 4,
    n: 'Rival · Kael à Johto',
    base: 'j5',
    team: ['noarfang', 'azumarill', 'demolosse'],
    water: ['5,0'],
    rock: ['3,1', '4,4'],
    obstacles: { pil: ['4,2'], sand: ['2,1', '2,4'] },
    x: 560,
    y: 330,
    rew: [5000, 25],
    q: 'Johto m’a endurci. Toi, tu as juste collectionné des badges. On va voir lequel de nous deux a vraiment progressé.',
    w: 'Encore toi… D’accord. Je file à Hoenn. Là-bas, personne ne te connaît.',
    l: 'Tu vois ? À Johto, c’est moi qui fais la loi.',
  },
  rv6: {
    reg: 3,
    after: 4,
    n: 'Rival · Kael à Hoenn',
    base: 'h5',
    team: ['galeking', 'drattak', 'noarfang'],
    water: ['4,0', '5,5'],
    rock: ['3,2'],
    obstacles: { pil: ['4,3'], grass: ['2,2', '2,3'] },
    x: 440,
    y: 470,
    rew: [6500, 30],
    q: 'Galeking, Drattak… et mon partenaire du premier jour. Cette fois, on ne joue plus.',
    w: '…Tu es meilleur que moi. Pour l’instant. Le Maître de Hoenn t’attend : ne perds pas contre lui.',
    l: 'Hoenn, c’est mon terrain maintenant.',
  },
  hd429: {
    reg: 3,
    after: 6,
    n: 'Les Échos de la Dissonance',
    base: 'h7',
    team: ['absol', 'tenefix', 'nostenfer', 'demolosse'],
    water: [],
    rock: ['3,1', '3,4'],
    obstacles: { pil: ['4,2'], grass: ['2,1', '2,4'] },
    x: 715,
    y: 445,
    rew: [7000, 35],
    who: 'Sirène',
    t: 'la voix des Échos',
    q: 'Les Échos n’obéissent qu’à une voix : la mienne. Notre brouilleur portera la Dissonance jusqu’au Plateau.',
    w: 'Les Échos se taisent… Cobalt avait tort. On ne contrôle pas la Résonance.',
    l: 'Écoute ce silence. Plus un losange, plus un Éveil.',
  },
};

const POST_BATTLE_DIALOGUE = {
  champ: [['prof', 'Championne vaincue ! Kanto vous appartient… et Johto vous attend, au bout de la Route 29.']],
  jchamp: [['prof', 'Maître de Johto ! Kael vient de m’appeler : il est parti pour Hoenn. Vous devriez le suivre.']],
  rv5: [
    ['kael', 'Encore toi… Tu sais quoi ? Je file à Hoenn.'],
    ['prof', 'Votre rival n’abandonne jamais. On le reverra, j’en suis sûre.'],
  ],
  rv6: [
    ['kael', '…D’accord. Tu es meilleur que moi. Pour l’instant.'],
    ['kael', 'Le Maître de Hoenn t’attend. Si tu perds contre lui, je ne te le pardonnerai pas.'],
  ],
  hd429: [
    ['sirene', 'Les Échos se taisent… On ne contrôle pas la Résonance.'],
    ['vesper', 'Cette fois, c’est vraiment fini. Merci… Je vais aider le Prof. Sorbier à réparer ce qu’on a abîmé.'],
  ],
  hchamp: [
    ['prof', 'Maître de Hoenn ! Trois régions, une seule Résonance.'],
    [
      'prof',
      'On raconte que les légendes ne fuient plus devant vous… Ouvrez l’onglet « Légendes » des Quêtes : elles peuvent désormais être capturées.',
    ],
  ],
};

const WEEKLY_PRESETS = [
  { k: 'location', n: 'Équipe de location', d: 'Tout le monde joue la même équipe, tirée au sort pour la semaine.' },
  { k: 'mono', n: 'Monotype', d: 'Une équipe de location d’un seul type.' },
  { k: 'debut', n: 'Premiers pas', d: 'Quatre Pokémon au premier stade : à vous de les éveiller en combat.' },
  { k: 'chrono', n: 'Contre-la-montre', d: 'Une équipe de location, et seulement 6 manches pour gagner.' },
];

// the challenge reuses a battle's opponents without its progression rewards
export const PROGRESS_KEYS = [
  'gym',
  'elite',
  'champ',
  'johto',
  'hoenn',
  'hfinal',
  'jfinal',
  'jdis',
  'roam',
  'legend',
  'rival',
  'dissonance',
  'colossus',
  'lac',
  'tower',
  'tuto',
  'ami',
  'rivalFight',
  'captureLegend',
  'dom',
  'jafter',
  'after',
  'daily',
  'tdr',
];

// Statements run at startup, in the original order (see index.js).
export function __init() {
  document.addEventListener(
    'pointerdown',
    e => {
      clearTimeout(LONG_PRESS.t);
      LONG_PRESS.fait = 0; // a new gesture: the previous long press is forgotten
      if (e.pointerType === 'mouse' && e.button !== 0) {
        return;
      }
      const a = longPressAction(e.target);
      if (!a) {
        return;
      }
      LONG_PRESS.x = e.clientX;
      LONG_PRESS.y = e.clientY;
      LONG_PRESS.t = setTimeout(() => {
        LONG_PRESS.fait = Date.now();
        vibe(15);
        a();
      }, 480);
    },
    { passive: true }
  );

  document.addEventListener('pointerup', endLongPress, { passive: true });

  document.addEventListener('pointercancel', endLongPress, { passive: true });

  document.addEventListener(
    'pointermove',
    e => {
      if (Math.abs(e.clientX - LONG_PRESS.x) + Math.abs(e.clientY - LONG_PRESS.y) > 12) {
        clearTimeout(LONG_PRESS.t);
      }
    },
    { passive: true }
  );

  // the release following a long press doesn't also trigger the click
  document.addEventListener(
    'click',
    e => {
      if (LONG_PRESS.fait && Date.now() - LONG_PRESS.fait < 700) {
        LONG_PRESS.fait = 0;
        e.preventDefault();
        e.stopPropagation();
      }
    },
    true
  );

  document.addEventListener('contextmenu', e => {
    if (longPressAction(e.target)) {
      e.preventDefault();
    }
  });

  document.addEventListener(
    'touchstart',
    e => {
      if (e.touches.length !== 1) {
        SWIPE_STATE.ok = false;
        return;
      }
      const p = e.touches[0];
      Object.assign(SWIPE_STATE, { x: p.clientX, y: p.clientY, t: Date.now(), ok: canSwipeHere(e.target) });
    },
    { passive: true }
  );

  document.addEventListener(
    'touchend',
    e => {
      if (!SWIPE_STATE.ok) {
        return;
      }
      SWIPE_STATE.ok = false;
      const p = e.changedTouches[0],
        dx = p.clientX - SWIPE_STATE.x,
        dy = p.clientY - SWIPE_STATE.y;
      if (Date.now() - SWIPE_STATE.t > 650 || Math.abs(dx) < 80 || Math.abs(dy) > Math.abs(dx) * 0.5) {
        return;
      }
      const pg = document.querySelector('.page.on'),
        i = SWIPE_TABS.indexOf(pg && pg.id),
        j = i + (dx < 0 ? 1 : -1);
      if (i < 0 || j < 0 || j >= SWIPE_TABS.length) {
        return;
      }
      go(SWIPE_TABS[j]);
      try {
        window.scrollTo(0, 0);
      } catch {
        /* Best effort: failure here is non-fatal. */
      }
    },
    { passive: true }
  );

  document.addEventListener('click', e => {
    const b = e.target.closest('[data-tip-card]');
    if (!b) {
      return;
    }
    if (b.dataset.tipCard === 'off') {
      PREF.seenTips = false;
      savePref();
      toast('Astuces désactivées. Réactivez-les dans les Paramètres.');
    }
    hideTooltip();
    if (B) {
      setTimeout(seenTips, 400);
    }
  });

  buildRival();

  PLACES_J.push({
    id: 'rv5',
    x: RIVAL_CHALLENGES.rv5.x,
    y: RIVAL_CHALLENGES.rv5.y,
    n: 'Kael',
    s: 'Rival · après 4 badges de Johto',
    grp: 'aventure',
    j: 1,
  });

  PLACES_H.push({
    id: 'rv6',
    x: RIVAL_CHALLENGES.rv6.x,
    y: RIVAL_CHALLENGES.rv6.y,
    n: 'Kael',
    s: 'Rival · après 4 badges de Hoenn',
    grp: 'aventure',
    j: 1,
  });

  PLACES_H.push({
    id: 'hd429',
    x: RIVAL_CHALLENGES.hd429.x,
    y: RIVAL_CHALLENGES.hd429.y,
    n: 'Grotte des Échos',
    s: 'Dissonance · Sirène',
    grp: 'aventure',
    j: 1,
  });

  [...PLACES_J, ...PLACES_H].forEach(p => (PL[p.id] = p));

  HOOKS.progress.push((S, rew, win) => {
    const D = SCEN[S.sc] || {};
    if (!win || !D.rivalFight || (PROFILE.rivalsMet || []).includes(D.rivalFight)) {
      return null;
    }
    PROFILE.rivalsMet = [...(PROFILE.rivalsMet || []), D.rivalFight];
    rew.rivalsMet = D.rivalFight;
    return RIVAL_CHALLENGES[D.rivalFight].rew;
  });

  HOOKS.battleResult.push(r =>
    r.rivalsMet
      ? `<div class="res-l"><h4>${r.rivalsMet === 'hd429' ? 'Dissonance' : 'Rival'}</h4><div class="rl"><span>${r.rivalsMet === 'hd429' ? 'Les Échos de la Dissonance sont réduits au silence.' : `Kael est battu à ${FAMILY_REGION_NAMES[RIVAL_CHALLENGES[r.rivalsMet].reg]}.`}</span><b>+${fmt(RIVAL_CHALLENGES[r.rivalsMet].rew[0])} ₽ · +${RIVAL_CHALLENGES[r.rivalsMet].rew[1]} Éclats</b></div></div>`
      : ''
  );

  Object.assign(SCENES, {
    rv5: [
      ['kael', 'Te voilà à Johto aussi ? J’ai traversé la région à pied pendant que tu prenais le bateau.'],
      ['kael', 'Mon équipe a changé. J’ai capturé ce que Johto avait de plus coriace.'],
      [
        'prof',
        'Kael a beaucoup progressé… Frappez la même cible à plusieurs : les notes de Résonance feront la différence.',
      ],
    ],
    rv6: [
      ['kael', 'Je t’avais dit que je partais à Hoenn. Je n’avais pas dit que je t’attendrais.'],
      ['kael', 'Cette fois, mon partenaire du premier jour est au sommet de sa forme.'],
      ['prof', 'C’est son meilleur niveau. Ne le laissez pas encercler vos Pokémon !'],
    ],
    hd429: [
      [
        'vesper',
        'Attends ! C’est moi, Vesper. J’ai quitté la Dissonance après Johto… mais certains n’ont jamais reçu l’ordre d’arrêter.',
      ],
      ['sirene', 'Les Échos n’obéissent qu’à une voix : la mienne.'],
      [
        'vesper',
        'Son brouilleur vide les losanges de vos Pokémon à chaque fin de manche. Éveillez-les dès que possible !',
      ],
    ],
  });

  if (!SCENES.h1) {
    SCENES.h1 = [
      ['prof', 'Hoenn ! Des volcans, des forêts tropicales et la mer à perte de vue.'],
      [
        'prof',
        'Huit arènes, chacune avec sa règle, et un Maître au Plateau. Lisez bien la règle avant de lancer le combat.',
      ],
    ];
  }

  if (!SCENES.hchamp) {
    SCENES.hchamp = [
      ['prof', 'Le Plateau de Hoenn… Huit badges, et Kael qui vous suit de près.'],
      ['prof', 'Le Maître change de tactique à chaque phase. Gardez des Voix et des soins pour la fin.'],
    ];
  }

  /* ---------- 6. capturable legendaries ---------- */
  LEGS.forEach(leg => {
    BY[leg.id].c = 8; // a legend on the team costs 8 PC
    const lk = legKey(leg.id);
    if (SCEN[lk]) {
      SCEN[lk].d = SCEN[lk].d.replace(
        /Il ne peut pas être capturé[^.]*\.[^.]*\./,
        'Vaincu, il pourra être capturé une fois sa quête terminée (Quêtes › Légendes).'
      );
    }
  });

  LEGS.forEach(leg => {
    const k = 'lc' + leg.id,
      src = SCEN[legKey(leg.id)];
    if (!src) {
      return;
    }
    SCEN[k] = Object.assign({}, src, {
      n: `${leg.n} · capture`,
      lvl: `Légende · ${leg.title}`,
      catch: true,
      captureLegend: leg.id,
      d: `${leg.n} ne fuit plus. Affaiblissez-le sous 25 %, immobilisez-le, puis capturez-le avec un allié à son contact. Son escorte ne se capture pas.`,
    });
    OBST[k] = OBST[legKey(leg.id)] || {};
  });

  WEEK_CACHE = null;

  HOOKS.progress.push((S, rew, win) => {
    const D = SCEN[S.sc] || {};
    if (!D.hebdo429) {
      return null;
    }
    const w = D.hebdo429,
      sc = weeklyScore(S, win);
    let h = PROFILE.hebdo429;
    if (!h || h.w !== w) {
      h = PROFILE.hebdo429 = { w, best: 0, n: 0, rec: 0, win: 0 };
    }
    h.n++;
    const record = sc > h.best;
    if (record) {
      h.best = sc;
    }
    if (win) {
      h.win = 1;
    }
    rew.hebdo429 = { sc, best: h.best, record };
    if (win && !h.rec) {
      h.rec = 1;
      rew.hebdo429.prime = 1;
      return [2500, 25];
    }
    return null;
  });

  HOOKS.battleResult.push(r =>
    r.hebdo429
      ? `<div class="res-l"><h4>Défi de la semaine</h4><div class="rl"><span>Score ${fmt(r.hebdo429.sc)}${r.hebdo429.record ? ' · nouveau record !' : ` · record ${fmt(r.hebdo429.best)}`}${r.hebdo429.prime ? ' · première victoire de la semaine : +2 500 ₽ · +25 Éclats' : ''}</span><b>${r.hebdo429.record ? '★' : ''}</b></div><p class="v4-note">Partagez votre carte de dresseur (Amis) : vos amis verront ce score.</p></div>`
      : ''
  );

  document.addEventListener('click', e => {
    if (!e.target.closest('[data-hebdo429],[data-news="hebdo429"]')) {
      return;
    }
    e.stopPropagation();
    V4.questTab = 'event';
    go('quetes');
    renderQuests();
  });

  document.addEventListener('click', e => {
    if (!e.target.closest('[data-news="legend-quests"]')) {
      return;
    }
    e.stopPropagation();
    V4.questTab = 'leg';
    go('quetes');
    renderQuests();
  });

  document.addEventListener('change', e => {
    const p = e.target.closest('[data-pref="anim-enabled"]');
    if (p) {
      applyCalmMode();
    }
  });
}
