/* Original section: v4.30-01-camp-and-tactics.js */

import { paintOverlay } from '../screens/overlays/dialogsStore.js';
import { WEATHER } from './004-data.js';
import { BY, SCEN, WXN } from './009-pokemon.js';
import { RECRUIT } from './010-in-battle-evolution.js';
import { PROFILE } from './011-game-state.js';
import { BADGES, __set_BADGES } from './013-gyms.js';
import { $, RM, medal, toast } from './014-utils.js';
import { tokCl } from '../screens/combat/board/boardStore.js';
import { bdClass, getHost, hostSet } from '../screens/combat/board/boardStore.js';
import { HOOKS, hook } from './015-hooks.js';
import { cur, go } from './016-navigation.js';
import { renderSquad, save } from './020-team-cards.js';
import { BH, EMAX, K, P, byUid, uAt } from './021-combat-engine.js';
import { B, L, finish, goFight, log, renderAll, scSel, ui } from './024-combat-ui.js';
import { SLOTS, SV, newGame, openSaves, putSlot, queueSave } from './025-saves.js';
import { PREF, openStarter, savePref, sfx } from './026-campaign-tutorial-sound.js';
import { AUTO } from './030-prestige-staging.js';
import { SHOP, V4, dailyKey, fmt } from './032-v4-foundation.js';
import { renderWallet } from './035-interface.js';
import { renderHome } from './036-home.js';
import { renderMap } from './037-map.js';
import { renderQuests } from './039-quests-shop.js';
import { renderParams } from './040-settings.js';
import { LEGS } from './043-adventure-plus.js';
import { LIVING_DESC, LIVING_STATE, LIVING_NAME } from './046-living-board.js';
import { TAB_LIST429 } from './064-quality.js';
import { refreshPrep } from '../screens/combat/prep/prepStore.js';

export { CATN430 }; // read by Quests › Journal (React)


/* =====================================================================
   v4.30: access and tactics
   1. « Camp » tab: buildings, expeditions, Daycare, Garden, Dojo…
      open in Campaign as in Free mode, plus the outings (grass, fishing,
      Safari Park, Tower, tournament).
   2. Game mode in Settings: changing mode asks for a
      confirmation and offers to put the game away in a slot.
   3. Regional maps: they can be scrolled again (arrows).
   4. Secret code: the Creator's Workshop, reserved for the code holder.
   5. Battle sky: a permanent logo (time, weather) and an
      announcement when the weather changes.
   6. Deployment: before big battles, you place your Pokémon.
   7. Doctrines: a bonus against a drawback, chosen before the battle.
   8. Tactical journal: report of each battle and statistics.
   ===================================================================== */
export function V430_0() {
  return { doc430: '', journal430: null };
}


export function v430Clean(p) {
  const o = V430_0();
  if (!p || typeof p !== 'object') return o;
  if (typeof p.doc430 === 'string' && DOCTRINES430[p.doc430]) o.doc430 = p.doc430;
  const J = p.journal430;
  if (J && typeof J === 'object') {
    const n = x => (Number.isFinite(x) ? Math.max(0, Math.min(1e9, Math.floor(x))) : 0),
      map = (m, lim) => {
        const r = {};
        if (m && typeof m === 'object') Object.keys(m).slice(0, lim).forEach(k => BY[k] && (r[k] = n(m[k])));
        return r;
      },
      cat = {};
    if (J.cat && typeof J.cat === 'object') Object.keys(J.cat).forEach(k => Array.isArray(J.cat[k]) && /^[a-z]{3,12}$/.test(k) && (cat[k] = [n(J.cat[k][0]), n(J.cat[k][1])]));
    o.journal430 = {
      n: n(J.n),
      w: n(J.w),
      serie: n(J.serie),
      best: n(J.best),
      dealt: n(J.dealt),
      taken: n(J.taken),
      ko: n(J.ko),
      mvp: map(J.mvp, 200),
      use: map(J.use, 200),
      cat,
      last: Array.isArray(J.last)
        ? J.last
            .filter(x => Array.isArray(x) && typeof x[0] === 'string')
            .slice(-10)
            .map(x => [String(x[0]).slice(0, 40), x[1] ? 1 : 0, typeof x[2] === 'string' ? x[2].slice(0, 2) : '', n(x[3]), BY[x[4]] ? x[4] : ''])
        : []
    };
  }
  return o;
}


export function log0430() {
  return { n: 0, w: 0, serie: 0, best: 0, dealt: 0, taken: 0, ko: 0, mvp: {}, use: {}, cat: {}, last: [] };
}


/* ---------- 1. the Camp tab ---------- */
/** The base Camp is open in Campaign as in Free mode (v4.30). */
export function campOk430() {
  return true;
}


// The Camp page (skeleton, base Camp, Outings) is rendered by React: src/screens/camp.


/* ---------- 2. game mode: in Settings, with confirmation ---------- */
export function gameInProgress430() {
  return (PROFILE.battles || 0) > 0 || BADGES.length > 0;
}


function freeSlot430() {
  return SLOTS.find(k => !SV.local[k]) || null;
}


/** A confirmation before any new game. suite() is only called once the player agrees. */
export function confirm430(heading, text, next) {
  if (!gameInProgress430()) return next();
  // #conf430: rendered by React on first call (src/screens/overlays/Conf430.jsx); hidden stays set here
  paintOverlay('conf430', { titre: heading, texte: text, combats: PROFILE.battles || 0, badges: BADGES.length, sl: freeSlot430() });
  const el = document.getElementById('conf430');
  el.hidden = false;
  confirm430.suite = next;
  const f = el.querySelector('[data-conf430="non"].b');
  if (f) f.focus();
}


/* ---------- 3. regional maps: scrolling ---------- */
export function arrows430() {
  const sc = document.getElementById('mapSc');
  if (!sc) return;
  // the two arrows (.mf430) are rendered by React (src/screens/map/MapScreen.jsx); their
  // hidden attribute stays set here, based on the measured scroll
  const box = sc.parentNode;
  const max = sc.scrollWidth - sc.clientWidth;
  box.querySelectorAll('.mf430').forEach(b => {
    const d = +b.dataset.mf430;
    b.hidden = max < 8 || (d < 0 ? sc.scrollLeft < 8 : sc.scrollLeft > max - 8);
  });
}


/* ---------- 4. secret code: the Creator's Workshop ---------- */
function h430(str, seed) {
  let h1 = 0xdeadbeef ^ seed,
    h2 = 0x41c6ce57 ^ seed;
  for (let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}

 // Action Replay (v4.32)
function codeOk430(v) {
  const c = String(v || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
  return c.length >= 6 && h430(c, 7) + h430(c, 4301) === KEY430;
}


function cheat430(k) {
  if (!creator430()) return;
  let m = '';
  if (k === 'argent') {
    PROFILE.money = Math.min(999999, (PROFILE.money || 0) + 10000);
    m = '+10 000 ₽.';
  } else if (k === 'eclats') {
    PROFILE.gems = Math.min(99999, (PROFILE.gems || 0) + 100);
    m = '+100 Éclats.';
  } else if (k === 'sac') {
    PROFILE.bag = PROFILE.bag || {};
    [['poke', 30], ['super', 20], ['hyper', 20], ['master', 3], ['potion', 10]].forEach(([x, q]) => SHOP[x] && (PROFILE.bag[x] = Math.min(99, (PROFILE.bag[x] || 0) + q)));
    m = 'Sac rempli.';
  } else if (k === 'box') {
    RECRUIT.forEach(r => {
      if (!PROFILE.box.includes(r.id)) PROFILE.box.push(r.id);
      if (!PROFILE.dex.includes(r.id)) PROFILE.dex.push(r.id);
    });
    m = `${RECRUIT.length} familles dans la Box.`;
  } else if (k === 'badges') {
    __set_BADGES([0, 1, 2, 3, 4, 5, 6, 7]);
    Object.assign(PROFILE, { elite: 5, tuto: 1, rival: 4, dissonance: 4, jdis: 4, jchamp: 1, hchamp: 1, johto: [0, 1, 2, 3, 4, 5, 6, 7], hoenn: [0, 1, 2, 3, 4, 5, 6, 7] });
    PROFILE.riv429 = ['rv5', 'rv6', 'hd429'];
    m = 'Kanto, Johto et Hoenn débloqués.';
  } else if (k === 'legendes') {
    PROFILE.legends = LEGS.map(L => L.id);
    PROFILE.dipl428 = [1, 2, 3];
    PROFILE.hchamp = 1;
    m = 'Quêtes légendaires terminées : Quêtes › Légendes.';
  } else if (k === 'fatigue') {
    PROFILE.fatigue = {};
    m = 'Fatigue effacée.';
  } else if (k === 'gagner') {
    if (!B || B.over) return toast('Aucun combat en cours.');
    B.units.filter(u => u.side === 'e').forEach(u => {
      u.ko = true;
      u.hp = 0;
      u.intent = null;
    });
    B.over = 'win';
    B.dep430 = 0;
    go('combat');
    finish();
    return;
  } else if (k === 'off') {
    delete PREF.dev430;
    savePref();
    renderParams();
    return toast('Action Replay désactivé.');
  }
  save();
  renderWallet();
  try {
    renderSquad();
    renderHome();
  } catch (e) {}
  renderParams();
  toast(m);
}


function skyState430(S) {
  return { ph: S.cyc ? S.cyc.ph : S.time === 'nuit' ? 'nuit' : 'jour', wx: S.wx && S.wx.n > 0 ? S.wx.k : '' };
}


function wxInfo430(k) {
  const w = WEATHER.find(x => x.n === WXN[k]);
  return w ? w.d : '';
}


function sky430() {
  const bd = document.getElementById('bBoard');
  if (!bd || !B) return;
  const E = skyState430(B);
  // #ciel430: rendered by React (Board.jsx)
  const [ic, co] = SKY430[E.ph] || SKY430.jour,
    w = E.wx && SKY430[E.wx];
  const sky = {
    ic,
    co,
    ti: LIVING_NAME[E.ph] || '',
    w: w ? [w[0], w[1], WXN[E.wx]] : null,
    nom: (LIVING_NAME[E.ph] || 'Jour') + (w ? ' · ' + WXN[E.wx] + ' ' + B.wx.n : ''),
    vent: !!B.vent
  };
  if (JSON.stringify(sky) !== JSON.stringify(getHost().ciel)) hostSet({ ciel: sky });
  // announcement when the time or weather changes
  const P = B.ciel430;
  B.ciel430 = E;
  if (!P || B.over) return;
  if (P.ph !== E.ph) announce430(SKY430[E.ph], LIVING_STATE[E.ph] || LIVING_NAME[E.ph], LIVING_DESC[E.ph] || '');
  else if (P.wx !== E.wx)
    E.wx ? announce430(SKY430[E.wx], `${WXN[E.wx]} · ${B.wx.n} manches`, wxInfo430(E.wx)) : announce430(['i-sol', '#cfe6ff'], 'Le ciel se dégage', 'La météo est terminée.');
}


export function announce430(ic, heading, text) {
  const bd = document.getElementById('bBoard');
  if (!bd || !ic) return;
  // #cielBan430: rendered by React (Board.jsx); the « on » class is removed then set again to restart the animation
  const b = { ic: [ic[0], ic[1]], titre: heading, texte: text, on: false };
  hostSet({ cielBan: b });
  void bd.offsetWidth;
  hostSet({ cielBan: { ...b, on: true } });
  clearTimeout(announce430.t);
  announce430.t = setTimeout(() => {
    const c = getHost().cielBan;
    if (c) hostSet({ cielBan: { ...c, on: false } });
  }, PREF.fast || ui.turbo428 ? 1300 : 2400);
}


/* ---------- 6. deployment ---------- */
function large430(D) {
  return (
    !D.tuto &&
    !!(D.gym != null || D.elite || D.champ || D.rival || D.rival429 || D.johto != null || D.hoenn != null || D.jfinal || D.hfinal || D.legend || D.cap429 || D.jdis || D.dissonance || D.colosse || D.hebdo429 || D.ami || D.lac || D.tower)
  );
}


function zone430(S) {
  const z = [];
  for (let r = 0; r < BH; r++)
    for (let c = 0; c <= 1; c++) {
      const k = K(c, r),
        t = S.tiles[k];
      if (!t || t.rock || t.lava > 0) continue;
      const u = uAt(S, k);
      if (u && u.side !== 'a') continue;
      z.push(k);
    }
  return z;
}


function deployTap430(k) {
  if (!B || !B.dep430) return;
  const z = zone430(B),
    u = uAt(B, k),
    sel = ui.dsel430 && byUid(B, ui.dsel430);
  if (u && u.side === 'a' && (!sel || sel === u)) {
    ui.dsel430 = sel === u ? null : u.uid;
  } else if (sel && z.includes(k)) {
    if (u && u.side === 'a') u.pos = [...sel.pos]; // swap places
    sel.pos = P(k);
    ui.dsel430 = null;
    sfx('ui');
  } else if (u && u.side === 'a') ui.dsel430 = u.uid;
  renderAll();
}


function endDeployment430() {
  if (!B || !B.dep430) return;
  B.dep430 = 0;
  ui.dsel430 = null;
  log('Déploiement terminé : à vous de jouer.', 'sys');
  sfx('ui');
  renderAll();
}


function deployRender430() {
  const on = !!(B && B.dep430 && !B.over),
    z = on ? zone430(B) : [];
  if (L.t)
    for (const k in L.t) {
      L.t[k].classList.toggle('dep430z', on && z.includes(k));
    }
  if (L.u)
    for (const id in L.u) {
      const T = L.u[id];
      if (T) tokCl(T, 'dep430s', on && ui.dsel430 === id); // token classes: Units.jsx
    }
  bdClass('dep430', on); // #bBoard class, rendered by React
  // « Lancer le combat » (Start battle) and the deployment phase: rendered by React (src/screens/combat/battle/Foot.jsx)
}


export function docChosen430() {
  const D = SCEN[scSel] || {};
  if (D.tuto || D.hebdo429 || D.enigme431) return '';
  return DOCTRINES430[PROFILE.doc430] ? PROFILE.doc430 : '';
}


export function docDmg430(S, u, t, d) {
  const k = S && S.doc430;
  if (!k || !(d > 0)) return d;
  let f = 1;
  if (u && u.side === 'a') f *= k === 'assaut' ? 1.15 : k === 'mobilite' || k === 'butin' ? 0.9 : 1;
  if (t && t.side === 'a') f *= k === 'assaut' ? 1.1 : k === 'rempart' ? 0.85 : 1;
  return f === 1 ? d : Math.max(1, Math.round(d * f));
}


export function docMov430(S, u) {
  if (!S || !S.doc430 || !u || u.side !== 'a') return 0;
  return S.doc430 === 'mobilite' ? 1 : S.doc430 === 'rempart' ? -1 : 0;
}


// « Doctrine » block (#doc430): rendered by React along with the battle selection.
export function docRender430() {
  refreshPrep();
}


/* ---------- 8. tactical journal ---------- */
export function jDmg430(S, v, real, o) {
  if (!S.stats) return;
  const J = S.stats.j430 || (S.stats.j430 = { d: {}, t: {}, k: {} });
  J.t[v.uid] = (J.t[v.uid] || 0) + real;
  const a = S.acteur430 && byUid(S, S.acteur430);
  if (a && a.side !== v.side && !(o && o.ind)) {
    J.d[a.uid] = (J.d[a.uid] || 0) + real;
    if (v.hp <= 0) J.k[a.uid] = (J.k[a.uid] || 0) + 1;
  }
  hook('degats', S, v, real, o);
}


function cat430(sc, D) {
  if (D.gym != null || D.johto != null || D.hoenn != null) return 'arenes';
  if (D.elite || D.champ || D.jfinal || D.hfinal) return 'ligue';
  if (D.rival || D.rival429) return 'rivaux';
  if (D.dissonance || D.jdis || sc === 'hd429') return 'dissonance';
  if (D.legend || D.cap429 || D.roam || D.hleg435 || D.cap435) return 'legendes';
  if (D.hebdo429 || D.tower || D.ami || sc === dailyKey()) return 'defis';
  if (sc === 'sauvage' || D.wild || D.route) return 'sauvages';
  return 'entrainement';
}


// Quests › Journal: rendered by React (src/screens/quests/Journal.jsx)


/* ---------- after each battle render ---------- */
export function afterRender430() {
  if (!B) return;
  try {
    sky430();
    deployRender430();
    // doctrine chip (#bWx): rendered by React (TopBar.jsx)
  } catch (e) {}
}

// only the code's fingerprint is in the game, never the code itself
const KEY430 = 'agg9t7xer71nts93h0hym';

export const creator430 = () => PREF.dev430 === KEY430;

/* ---------- 5. battle sky: logo and announcements ---------- */
const SKY430 = {
  jour: ['i-sol', '#f2c94c'],
  aube: ['i-aube', '#f0a6a0'],
  crepuscule: ['i-crep', '#e8774a'],
  nuit: ['i-lune', '#9aa8ff'],
  pluie: ['i-pluie', '#5aa9ff'],
  soleil: ['i-sol', '#ff9a3c'],
  grele: ['i-grele', '#9fe3ff'],
  sable: ['i-sable', '#d9b26a']
};

/* ---------- 7. doctrines ---------- */
export const DOCTRINES430 = {
  assaut: { n: 'Assaut', d: 'Vos Pokémon infligent +15 % de dégâts.', c: 'Ils en subissent +10 %.' },
  rempart: { n: 'Rempart', d: 'Vos Pokémon subissent −15 % de dégâts.', c: '−1 Mouvement.' },
  mobilite: { n: 'Mobilité', d: '+1 Mouvement pour vos Pokémon.', c: 'Ils infligent −10 % de dégâts.' },
  resonance: { n: 'Résonance', d: 'Chaque Pokémon commence avec 1 losange de plus.', c: '−1 Voix maximum (avec 1 seule Voix : PV −10 %).' },
  commandement: { n: 'Commandement', d: '+1 Voix maximum dès le départ.', c: 'PV maximum −10 %.' },
  butin: { n: 'Butin', d: '+30 % de Pokédollars en cas de victoire.', c: 'Vos Pokémon infligent −10 % de dégâts.' }
};

const CATN430 = { arenes: 'Arènes', ligue: 'Ligue', rivaux: 'Rivaux', dissonance: 'Dissonance', legendes: 'Légendes', defis: 'Défis', sauvages: 'Sauvages', entrainement: 'Entraînement' };

// Startup statements, run in their original order (see index.js).
export function __init() {

/* icons (camp, sky, weather, doctrine): in src/components/SvgSprite.jsx */


// the #camp page and its navigation links (sidebar, bottom bar) are rendered by React
if (!TAB_LIST429.includes('camp')) TAB_LIST429.push('camp');


document.addEventListener('click', e => {
  const b = e.target.closest('[data-sortie430]');
  if (!b) return;
  const k = b.dataset.sortie430;
  if (k === 'herbes') {
    go('carte');
    const r = $('#route');
    if (r && r.scrollIntoView) r.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'center' });
  } else if (k === 'safari') {
    V4.region = 'kanto';
    V4.mapSel = 'safari';
    go('carte');
    renderMap();
  } else if (k === 'tour') goFight('tdr');
  else if (k === 'amis') {
    go('accueil');
    const a = document.getElementById('v4Amis');
    if (a && a.scrollIntoView) a.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'start' });
  } else if (k === 'hebdo') {
    V4.qTab = 'event';
    go('quetes');
    renderQuests();
  }
});


document.addEventListener('click', e => {
  const b = e.target.closest('[data-conf430]');
  if (!b) return;
  const el = document.getElementById('conf430'),
    a = b.dataset.conf430,
    next = confirm430.suite;
  if (el) el.hidden = true;
  confirm430.suite = null;
  if (a === 'saves') return openSaves();
  if (a === 'ranger') {
    const sl = freeSlot430();
    if (sl) putSlot(sl);
  }
  if ((a === 'ranger' || a === 'oui') && next) next();
});


document.addEventListener('click', e => {
  const b = e.target.closest('[data-mode430]');
  if (!b) return;
  if (b.dataset.mode430 === 'camp') confirm430('Commencer une campagne ?', 'Vous choisirez votre partenaire, puis les chapitres s’enchaîneront depuis le premier badge.', openStarter);
  else
    confirm430('Passer en mode Libre ?', 'Tous les combats seront ouverts. Votre Campagne ne sera conservée que si vous la rangez dans un emplacement.', () => {
      newGame();
      toast('Nouvelle partie en mode Libre.');
      renderParams();
    });
});


document.addEventListener('click', e => {
  const b = e.target.closest('[data-mf430]');
  if (!b) return;
  const sc = document.getElementById('mapSc');
  if (!sc) return;
  sc.scrollBy({ left: +b.dataset.mf430 * sc.clientWidth * 0.7, behavior: RM ? 'auto' : 'smooth' });
  setTimeout(arrows430, RM ? 30 : 420);
});


document.addEventListener(
  'scroll',
  e => {
    if (e.target && e.target.id === 'mapSc') {
      clearTimeout(arrows430.t);
      arrows430.t = setTimeout(arrows430, 60);
    }
  },
  true
);


window.addEventListener('resize', () => setTimeout(arrows430, 100));


document.addEventListener('click', () => {
  if (cur === 'carte') setTimeout(arrows430, 90);
});


document.addEventListener('click', e => {
  const v = e.target.closest('[data-code430]');
  if (v) {
    const i = document.getElementById('code430');
    if (codeOk430(i && i.value)) {
      PREF.dev430 = KEY430;
      savePref();
      toast('Action Replay activé sur cet appareil.');
      renderParams();
    } else {
      toast('Code inconnu.');
      if (i) i.value = '';
    }
    return;
  }
  const t = e.target.closest('[data-triche430]');
  if (!t || !creator430()) return;
  cheat430(t.dataset.triche430);
});


document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.target && e.target.id === 'code430') {
    e.preventDefault();
    const b = document.querySelector('[data-code430="ok"]');
    if (b) b.click();
  }
});


HOOKS.combat.push((S, opt, D0) => {
  D0 = D0 || SCEN[S.sc] || {};
  const pr = PREF.dep430 || 'grands';
  if (pr === 'jamais' || D0.tuto || D0.enigme431 != null || D0.duel433 || S.coop || S.ordre === 'vitesse') return;
  if (pr === 'grands' && !large430(D0)) return;
  if (AUTO && !window.__dep430) return;
  S.dep430 = 1;
});


document.addEventListener('click', e => {
  const b = e.target.closest('[data-dep430]');
  if (!b) return;
  PREF.dep430 = b.dataset.dep430;
  savePref();
  renderParams();
});


$('#bSvg').addEventListener(
  'click',
  e => {
    if (!B || !B.dep430 || B.over) return;
    e.stopPropagation();
    const p = e.target.closest('[data-k]');
    if (p && !ui.busy) deployTap430(p.dataset.k);
  },
  true
);


document.addEventListener(
  'click',
  e => {
    if (!B || !B.dep430 || B.over) return;
    if (e.target.closest('#bEnd')) {
      e.preventDefault();
      e.stopPropagation();
      endDeployment430();
    } else if (e.target.closest('#bPanel button,.plate')) {
      e.preventDefault();
      e.stopPropagation();
      toast('Déploiement : placez vos Pokémon, puis « Lancer le combat ».');
    }
  },
  true
);


HOOKS.combat.push((S, opt) => {
  const d = opt && opt.doc430;
  if (!d || !DOCTRINES430[d]) return;
  S.doc430 = d;
  const al = S.units.filter(u => u.side === 'a');
  if (d === 'resonance') {
    al.forEach(u => (u.en = Math.min(EMAX, (u.en || 0) + 1)));
    if (S.vmax > 1) {
      S.vmax -= 1;
      S.voix = Math.min(S.voix, S.vmax);
    } else
      al.forEach(u => {
        u.mhp = Math.max(1, Math.round(u.mhp * 0.9));
        u.hp = Math.min(u.hp, u.mhp);
      });
  } else if (d === 'commandement') {
    S.vmax += 1;
    S.voix += 1;
    al.forEach(u => {
      u.mhp = Math.max(1, Math.round(u.mhp * 0.9));
      u.hp = Math.min(u.hp, u.mhp);
    });
  }
});


HOOKS.progres.push((S, rew, win) => {
  if (!S.doc430) return null;
  rew.doc430 = S.doc430;
  if (!win || S.doc430 !== 'butin') return null;
  const m = Math.round(((rew.money || 0) * 0.3) / 10) * 10;
  rew.butin430 = m;
  return m ? [m, 0] : null;
});


HOOKS.resultat.push(r =>
  r.doc430 && DOCTRINES430[r.doc430] ? `<div class="res-l"><h4>Doctrine</h4><div class="rl"><span>${DOCTRINES430[r.doc430].n}${r.butin430 ? ' : butin de la victoire' : ''}</span><b>${r.butin430 ? '+' + fmt(r.butin430) + ' ₽' : ''}</b></div></div>` : ''
);


document.addEventListener('click', e => {
  const b = e.target.closest('[data-doc430]');
  if (!b) return;
  PROFILE.doc430 = b.dataset.doc430;
  queueSave();
  docRender430();
});


HOOKS.progres.push((S, rew, win) => {
  const D = SCEN[S.sc] || {};
  if (D.tuto) return null;
  const J0 = S.stats.j430 || { d: {}, t: {}, k: {} },
    al = S.units.filter(u => u.side === 'a');
  const rows = al.map(u => ({ uid: u.uid, id: u.id, sp: u.sp, d: J0.d[u.uid] || 0, t: J0.t[u.uid] || 0, k: J0.k[u.uid] || 0, ko: u.ko ? 1 : 0 }));
  const sc = r => r.d + r.k * 40 - r.ko * 15,
    mvp = rows.length ? rows.reduce((a, b) => (sc(b) > sc(a) ? b : a)) : null;
  rew.j430 = { rows, mvp: mvp && mvp.d > 0 ? mvp.uid : null };
  // cumulative statistics
  const J = (PROFILE.journal430 = PROFILE.journal430 || log0430());
  J.n++;
  if (win) {
    J.w++;
    J.serie++;
    J.best = Math.max(J.best, J.serie);
  } else J.serie = 0;
  rows.forEach(r => {
    J.dealt += r.d;
    J.taken += r.t;
    J.ko += r.k;
    if (BY[r.sp]) J.use[r.sp] = (J.use[r.sp] || 0) + 1;
  });
  if (mvp && mvp.d > 0 && BY[mvp.sp]) J.mvp[mvp.sp] = (J.mvp[mvp.sp] || 0) + 1;
  const c = cat430(S.sc, D);
  J.cat[c] = J.cat[c] || [0, 0];
  J.cat[c][win ? 0 : 1]++;
  J.last.push([(SCEN[S.sc] && SCEN[S.sc].n) || S.sc, win ? 1 : 0, S.rank || '', S.round || 0, mvp && mvp.d > 0 ? mvp.sp : '']);
  if (J.last.length > 10) J.last = J.last.slice(-10);
  return null;
});


HOOKS.resultat.push(r => {
  const j = r.j430;
  if (!j || !j.rows.length) return '';
  const mx = Math.max(1, ...j.rows.map(x => x.d));
  return `<div class="res-l rap430"><h4>Rapport tactique</h4>${j.rows
    .map(x => {
      const m = BY[x.id] || BY[x.sp];
      return `<div class="rap430-r${j.mvp === x.uid ? ' mvp' : ''}${x.ko ? ' ko' : ''}">${medal(m.t, 'sm')}<span class="rap430-n"><b>${m.n}</b>${j.mvp === x.uid ? '<em>MVP</em>' : ''}</span><span class="rap430-b"><i style="width:${Math.round((x.d / mx) * 100)}%"></i></span><span class="rap430-v" title="Dégâts infligés · subis · K.O.">${x.d} <small>/ ${x.t}${x.k ? ` · ${x.k} K.O.` : ''}</small></span></div>`;
    })
    .join('')}<p class="rap430-l">Dégâts infligés / subis. Statistiques complètes : Quêtes › Journal.</p></div>`;
});


/* ---------- what's new ---------- */
document.addEventListener('click', e => {
  const b = e.target.closest('[data-news="camp430"]');
  if (!b) return;
  e.stopPropagation();
  go('camp');
});

}
