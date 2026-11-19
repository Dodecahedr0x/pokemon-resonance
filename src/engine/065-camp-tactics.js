/* Original section: v4.30-01-camp-and-tactics.js */

import { paintOverlay } from '../screens/overlays/dialogsStore.js';
import { WEATHER } from './004-data.js';
import { BY, SCEN, WXN } from './009-pokemon.js';
import { RECRUIT } from './010-in-battle-evolution.js';
import { PROFILE } from './011-game-state.js';
import { BADGES, __set_BADGES } from './013-gyms.js';
import { $, RM, medal, toast } from './014-utils.js';
import { bdClass, getHost, hostSet, tokCl } from '../screens/combat/board/boardStore.js';
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
import { SWIPE_TABS } from './064-quality.js';
import { refreshPrep } from '../screens/combat/prep/prepStore.js';

export { CATEGORY_NAMES }; // read by Quests › Journal (React)

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
export function CAMP_TACTICS_0() {
  return { doctrineChoice: '', tacticsJournal: null };
}

export function campTacticsClean(p) {
  const o = CAMP_TACTICS_0();
  if (!p || typeof p !== 'object') {
    return o;
  }
  if (typeof p.doctrineChoice === 'string' && DOCTRINE_DEFS[p.doctrineChoice]) {
    o.doctrineChoice = p.doctrineChoice;
  }
  const J = p.tacticsJournal;
  if (J && typeof J === 'object') {
    const n = x => (Number.isFinite(x) ? Math.max(0, Math.min(1e9, Math.floor(x))) : 0),
      map = (m, lim) => {
        const r = {};
        if (m && typeof m === 'object') {
          Object.keys(m)
            .slice(0, lim)
            .forEach(k => BY[k] && (r[k] = n(m[k])));
        }
        return r;
      },
      cat = {};
    if (J.category && typeof J.category === 'object') {
      Object.keys(J.category).forEach(
        k =>
          Array.isArray(J.category[k]) &&
          /^[a-z]{3,12}$/.test(k) &&
          (cat[k] = [n(J.category[k][0]), n(J.category[k][1])])
      );
    }
    o.tacticsJournal = {
      n: n(J.n),
      w: n(J.w),
      runStreak: n(J.runStreak),
      best: n(J.best),
      dealt: n(J.dealt),
      taken: n(J.taken),
      ko: n(J.ko),
      mvp: map(J.mvp, 200),
      use: map(J.use, 200),
      category: cat,
      last: Array.isArray(J.last)
        ? J.last
            .filter(x => Array.isArray(x) && typeof x[0] === 'string')
            .slice(-10)
            .map(x => [
              String(x[0]).slice(0, 40),
              x[1] ? 1 : 0,
              typeof x[2] === 'string' ? x[2].slice(0, 2) : '',
              n(x[3]),
              BY[x[4]] ? x[4] : '',
            ])
        : [],
    };
  }
  return o;
}

export function log0430() {
  return { n: 0, w: 0, runStreak: 0, best: 0, dealt: 0, taken: 0, ko: 0, mvp: {}, use: {}, category: {}, last: [] };
}

/* ---------- 1. the Camp tab ---------- */
/** The base Camp is open in Campaign as in Free mode (v4.30). */
export function campOpen() {
  return true;
}

// The Camp page (skeleton, base Camp, Outings) is rendered by React: src/screens/camp.

/* ---------- 2. game mode: in Settings, with confirmation ---------- */
export function gameInProgress() {
  return (PROFILE.battles || 0) > 0 || BADGES.length > 0;
}

function freeOverlaySlot() {
  return SLOTS.find(k => !SV.local[k]) || null;
}

/** A confirmation before any new game. suite() is only called once the player agrees. */
export function confirmDialog(heading, text, next) {
  if (!gameInProgress()) {
    return next();
  }
  // #newGame: rendered by React on first call (src/screens/overlays/NewGameConfirm.jsx); hidden stays set here
  paintOverlay('new-game', {
    titre: heading,
    bodyText: text,
    combats: PROFILE.battles || 0,
    badges: BADGES.length,
    sl: freeOverlaySlot(),
  });
  const el = document.getElementById('new-game');
  el.hidden = false;
  confirmDialog.suite = next;
  const f = el.querySelector('[data-new-game="non"].b');
  if (f) {
    f.focus();
  }
}

/* ---------- 3. regional maps: scrolling ---------- */
export function updateScrollArrows() {
  const sc = document.getElementById('mapSc');
  if (!sc) {
    return;
  }
  // the two arrows (.mapScroll) are rendered by React (src/screens/map/MapScreen.jsx); their
  // hidden attribute stays set here, based on the measured scroll
  const box = sc.parentNode;
  const max = sc.scrollWidth - sc.clientWidth;
  box.querySelectorAll('.map-scroll').forEach(b => {
    const d = +b.dataset.mapScroll;
    b.hidden = max < 8 || (d < 0 ? sc.scrollLeft < 8 : sc.scrollLeft > max - 8);
  });
}

/* ---------- 4. secret code: the Creator's Workshop ---------- */
function hashCode(str, seed) {
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
function isCodeValid(v) {
  const c = String(v || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
  return c.length >= 6 && hashCode(c, 7) + hashCode(c, 4301) === CREATOR_KEY;
}

function applyCheat(k) {
  if (!isCreator()) {
    return;
  }
  let m = '';
  if (k === 'argent') {
    PROFILE.money = Math.min(999999, (PROFILE.money || 0) + 10000);
    m = '+10 000 ₽.';
  } else if (k === 'eclats') {
    PROFILE.gems = Math.min(99999, (PROFILE.gems || 0) + 100);
    m = '+100 Éclats.';
  } else if (k === 'sac') {
    PROFILE.bag = PROFILE.bag || {};
    [
      ['poke', 30],
      ['super', 20],
      ['hyper', 20],
      ['master', 3],
      ['potion', 10],
    ].forEach(([x, q]) => SHOP[x] && (PROFILE.bag[x] = Math.min(99, (PROFILE.bag[x] || 0) + q)));
    m = 'Sac rempli.';
  } else if (k === 'box') {
    RECRUIT.forEach(r => {
      if (!PROFILE.box.includes(r.id)) {
        PROFILE.box.push(r.id);
      }
      if (!PROFILE.dex.includes(r.id)) {
        PROFILE.dex.push(r.id);
      }
    });
    m = `${RECRUIT.length} familles dans la Box.`;
  } else if (k === 'badges') {
    __set_BADGES([0, 1, 2, 3, 4, 5, 6, 7]);
    Object.assign(PROFILE, {
      elite: 5,
      tuto: 1,
      rival: 4,
      dissonance: 4,
      jdis: 4,
      jchamp: 1,
      hchamp: 1,
      johto: [0, 1, 2, 3, 4, 5, 6, 7],
      hoenn: [0, 1, 2, 3, 4, 5, 6, 7],
    });
    PROFILE.rivalsMet = ['rv5', 'rv6', 'hd429'];
    m = 'Kanto, Johto et Hoenn débloqués.';
  } else if (k === 'legendes') {
    PROFILE.legends = LEGS.map(leg => leg.id);
    PROFILE.regionDiplomas = [1, 2, 3];
    PROFILE.hchamp = 1;
    m = 'Quêtes légendaires terminées : Quêtes › Légendes.';
  } else if (k === 'fatigue') {
    PROFILE.fatigue = {};
    m = 'Fatigue effacée.';
  } else if (k === 'gagner') {
    if (!B || B.over) {
      return toast('Aucun combat en cours.');
    }
    B.units
      .filter(u => u.side === 'e')
      .forEach(u => {
        u.ko = true;
        u.hp = 0;
        u.intent = null;
      });
    B.over = 'win';
    B.deployPhase = 0;
    go('combat');
    finish();
    return;
  } else if (k === 'off') {
    delete PREF.devKey;
    savePref();
    renderParams();
    return toast('Action Replay désactivé.');
  }
  save();
  renderWallet();
  try {
    renderSquad();
    renderHome();
  } catch {
    /* Best effort: failure here is non-fatal. */
  }
  renderParams();
  toast(m);
}

function skyState(S) {
  return { ph: S.cycle ? S.cycle.ph : S.time === 'nuit' ? 'nuit' : 'jour', wx: S.wx && S.wx.n > 0 ? S.wx.k : '' };
}

function weatherInfo(k) {
  const w = WEATHER.find(x => x.n === WXN[k]);
  return w ? w.d : '';
}

function renderSky() {
  const bd = document.getElementById('bBoard');
  if (!bd || !B) {
    return;
  }
  const E = skyState(B);
  // #skyBanner: rendered by React (Board.jsx)
  const [ic, co] = SKY_STYLES[E.ph] || SKY_STYLES.jour,
    w = E.wx && SKY_STYLES[E.wx];
  const sky = {
    ic,
    co,
    ti: LIVING_NAME[E.ph] || '',
    w: w ? [w[0], w[1], WXN[E.wx]] : null,
    displayName: (LIVING_NAME[E.ph] || 'Jour') + (w ? ' · ' + WXN[E.wx] + ' ' + B.wx.n : ''),
    vent: !!B.vent,
  };
  if (JSON.stringify(sky) !== JSON.stringify(getHost().ciel)) {
    hostSet({ ciel: sky });
  }
  // announcement when the time or weather changes
  const prevSky = B.skyBanner;
  B.skyBanner = E;
  if (!prevSky || B.over) {
    return;
  }
  if (prevSky.ph !== E.ph) {
    announceSky(SKY_STYLES[E.ph], LIVING_STATE[E.ph] || LIVING_NAME[E.ph], LIVING_DESC[E.ph] || '');
  } else if (prevSky.wx !== E.wx) {
    E.wx
      ? announceSky(SKY_STYLES[E.wx], `${WXN[E.wx]} · ${B.wx.n} manches`, weatherInfo(E.wx))
      : announceSky(['i-sol', '#cfe6ff'], 'Le ciel se dégage', 'La météo est terminée.');
  }
}

export function announceSky(ic, heading, text) {
  const bd = document.getElementById('bBoard');
  if (!bd || !ic) {
    return;
  }
  // #skyBannerBox: rendered by React (Board.jsx); the « on » class is removed then set again to restart the animation
  const b = { ic: [ic[0], ic[1]], titre: heading, bodyText: text, on: false };
  hostSet({ skyBanner: b });
  void bd.offsetWidth;
  hostSet({ skyBanner: { ...b, on: true } });
  clearTimeout(announceSky.t);
  announceSky.t = setTimeout(
    () => {
      const c = getHost().skyBanner;
      if (c) {
        hostSet({ skyBanner: { ...c, on: false } });
      }
    },
    PREF.fast || ui.skipSpeedup ? 1300 : 2400
  );
}

/* ---------- 6. deployment ---------- */
function isLargeBattle(D) {
  return (
    !D.tuto &&
    !!(
      D.gym != null ||
      D.elite ||
      D.champ ||
      D.rival ||
      D.rivalFight ||
      D.johto != null ||
      D.hoenn != null ||
      D.jfinal ||
      D.hfinal ||
      D.legend ||
      D.captureLegend ||
      D.jdis ||
      D.dissonance ||
      D.colossus ||
      D.hebdo429 ||
      D.ami ||
      D.lac ||
      D.tower
    )
  );
}

function deployZone(S) {
  const z = [];
  for (let r = 0; r < BH; r++) {
    for (let c = 0; c <= 1; c++) {
      const k = K(c, r),
        t = S.tiles[k];
      if (!t || t.rock || t.lava > 0) {
        continue;
      }
      const u = uAt(S, k);
      if (u && u.side !== 'a') {
        continue;
      }
      z.push(k);
    }
  }
  return z;
}

function deployTap(k) {
  if (!B || !B.deployPhase) {
    return;
  }
  const z = deployZone(B),
    u = uAt(B, k),
    sel = ui.deploySel && byUid(B, ui.deploySel);
  if (u && u.side === 'a' && (!sel || sel === u)) {
    ui.deploySel = sel === u ? null : u.uid;
  } else if (sel && z.includes(k)) {
    if (u && u.side === 'a') {
      u.pos = [...sel.pos];
    } // swap places
    sel.pos = P(k);
    ui.deploySel = null;
    sfx('ui');
  } else if (u && u.side === 'a') {
    ui.deploySel = u.uid;
  }
  renderAll();
}

function endDeployment() {
  if (!B || !B.deployPhase) {
    return;
  }
  B.deployPhase = 0;
  ui.deploySel = null;
  log('Déploiement terminé : à vous de jouer.', 'sys');
  sfx('ui');
  renderAll();
}

function deployRender() {
  const on = !!(B && B.deployPhase && !B.over),
    z = on ? deployZone(B) : [];
  if (L.t) {
    for (const k in L.t) {
      L.t[k].classList.toggle('deploy-phase-z', on && z.includes(k));
    }
  }
  if (L.u) {
    for (const id in L.u) {
      const T = L.u[id];
      if (T) {
        tokCl(T, 'deploy-phase-s', on && ui.deploySel === id);
      } // token classes: Units.jsx
    }
  }
  bdClass('deploy-phase', on); // #bBoard class, rendered by React
  // « Lancer le combat » (Start battle) and the deployment phase: rendered by React (src/screens/combat/battle/Foot.jsx)
}

export function chosenDoctrine() {
  const D = SCEN[scSel] || {};
  if (D.tuto || D.hebdo429 || D.enigme431) {
    return '';
  }
  return DOCTRINE_DEFS[PROFILE.doctrineChoice] ? PROFILE.doctrineChoice : '';
}

export function doctrineDamage(S, u, t, d) {
  const k = S && S.doctrineChoice;
  if (!k || !(d > 0)) {
    return d;
  }
  let f = 1;
  if (u && u.side === 'a') {
    f *= k === 'assaut' ? 1.15 : k === 'mobilite' || k === 'butin' ? 0.9 : 1;
  }
  if (t && t.side === 'a') {
    f *= k === 'assaut' ? 1.1 : k === 'rempart' ? 0.85 : 1;
  }
  return f === 1 ? d : Math.max(1, Math.round(d * f));
}

export function doctrineMove(S, u) {
  if (!S || !S.doctrineChoice || !u || u.side !== 'a') {
    return 0;
  }
  return S.doctrineChoice === 'mobilite' ? 1 : S.doctrineChoice === 'rempart' ? -1 : 0;
}

// « Doctrine » block (#doctrineChoice): rendered by React along with the battle selection.
export function doctrineRender() {
  refreshPrep();
}

/* ---------- 8. tactical journal ---------- */
export function journalDamage(S, v, real, o) {
  if (!S.stats) {
    return;
  }
  const J = S.stats.journalStats || (S.stats.journalStats = { d: {}, t: {}, k: {} });
  J.t[v.uid] = (J.t[v.uid] || 0) + real;
  const a = S.lastActor && byUid(S, S.lastActor);
  if (a && a.side !== v.side && !(o && o.ind)) {
    J.d[a.uid] = (J.d[a.uid] || 0) + real;
    if (v.hp <= 0) {
      J.k[a.uid] = (J.k[a.uid] || 0) + 1;
    }
  }
  hook('damage', S, v, real, o);
}

function scenarioCategory(sc, D) {
  if (D.gym != null || D.johto != null || D.hoenn != null) {
    return 'arenes';
  }
  if (D.elite || D.champ || D.jfinal || D.hfinal) {
    return 'ligue';
  }
  if (D.rival || D.rivalFight) {
    return 'rivaux';
  }
  if (D.dissonance || D.jdis || sc === 'hd429') {
    return 'dissonance';
  }
  if (D.legend || D.captureLegend || D.roam || D.hoennLegend || D.captureHoennLegend) {
    return 'legendes';
  }
  if (D.hebdo429 || D.tower || D.ami || sc === dailyKey()) {
    return 'defis';
  }
  if (sc === 'sauvage' || D.wild || D.route) {
    return 'sauvages';
  }
  return 'entrainement';
}

// Quests › Journal: rendered by React (src/screens/quests/Journal.jsx)

/* ---------- after each battle render ---------- */
export function afterRenderTactics() {
  if (!B) {
    return;
  }
  try {
    renderSky();
    deployRender();
    // doctrine chip (#bWx): rendered by React (TopBar.jsx)
  } catch {
    /* Best effort: failure here is non-fatal. */
  }
}

// only the code's fingerprint is in the game, never the code itself
const CREATOR_KEY = 'agg9t7xer71nts93h0hym';

export const isCreator = () => PREF.devKey === CREATOR_KEY;

/* ---------- 5. battle sky: logo and announcements ---------- */
const SKY_STYLES = {
  jour: ['i-sol', '#f2c94c'],
  aube: ['i-aube', '#f0a6a0'],
  crepuscule: ['i-crep', '#e8774a'],
  nuit: ['i-lune', '#9aa8ff'],
  pluie: ['i-pluie', '#5aa9ff'],
  soleil: ['i-sol', '#ff9a3c'],
  grele: ['i-grele', '#9fe3ff'],
  sable: ['i-sable', '#d9b26a'],
};

/* ---------- 7. doctrines ---------- */
export const DOCTRINE_DEFS = {
  assaut: { n: 'Assaut', d: 'Vos Pokémon infligent +15 % de dégâts.', c: 'Ils en subissent +10 %.' },
  rempart: { n: 'Rempart', d: 'Vos Pokémon subissent −15 % de dégâts.', c: '−1 Mouvement.' },
  mobilite: { n: 'Mobilité', d: '+1 Mouvement pour vos Pokémon.', c: 'Ils infligent −10 % de dégâts.' },
  resonance: {
    n: 'Résonance',
    d: 'Chaque Pokémon commence avec 1 losange de plus.',
    c: '−1 Voix maximum (avec 1 seule Voix : PV −10 %).',
  },
  commandement: { n: 'Commandement', d: '+1 Voix maximum dès le départ.', c: 'PV maximum −10 %.' },
  butin: { n: 'Butin', d: '+30 % de Pokédollars en cas de victoire.', c: 'Vos Pokémon infligent −10 % de dégâts.' },
};

const CATEGORY_NAMES = {
  arenes: 'Arènes',
  ligue: 'Ligue',
  rivaux: 'Rivaux',
  dissonance: 'Dissonance',
  legendes: 'Légendes',
  challenges: 'Défis',
  sauvages: 'Sauvages',
  entrainement: 'Entraînement',
};

// Startup statements, run in their original order (see index.js).
export function __init() {
  /* icons (camp, sky, weather, doctrine): in src/components/SvgSprite.jsx */

  // the #camp page and its navigation links (sidebar, bottom bar) are rendered by React
  if (!SWIPE_TABS.includes('camp')) {
    SWIPE_TABS.push('camp');
  }

  document.addEventListener('click', e => {
    const b = e.target.closest('[data-outing]');
    if (!b) {
      return;
    }
    const k = b.dataset.outing;
    if (k === 'herbes') {
      go('carte');
      const r = $('#route');
      if (r && r.scrollIntoView) {
        r.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'center' });
      }
    } else if (k === 'safari') {
      V4.region = 'kanto';
      V4.mapSel = 'safari';
      go('carte');
      renderMap();
    } else if (k === 'tour') {
      goFight('tdr');
    } else if (k === 'amis') {
      go('accueil');
      const a = document.getElementById('v4Amis');
      if (a && a.scrollIntoView) {
        a.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'start' });
      }
    } else if (k === 'hebdo') {
      V4.questTab = 'event';
      go('quetes');
      renderQuests();
    }
  });

  document.addEventListener('click', e => {
    const b = e.target.closest('[data-new-game]');
    if (!b) {
      return;
    }
    const el = document.getElementById('new-game'),
      a = b.dataset.newGame,
      next = confirmDialog.suite;
    if (el) {
      el.hidden = true;
    }
    confirmDialog.suite = null;
    if (a === 'saves') {
      return openSaves();
    }
    if (a === 'ranger') {
      const sl = freeOverlaySlot();
      if (sl) {
        putSlot(sl);
      }
    }
    if ((a === 'ranger' || a === 'oui') && next) {
      next();
    }
  });

  document.addEventListener('click', e => {
    const b = e.target.closest('[data-game-mode]');
    if (!b) {
      return;
    }
    if (b.dataset.gameMode === 'camp') {
      confirmDialog(
        'Commencer une campagne ?',
        'Vous choisirez votre partenaire, puis les chapitres s’enchaîneront depuis le premier badge.',
        openStarter
      );
    } else {
      confirmDialog(
        'Passer en mode Libre ?',
        'Tous les combats seront ouverts. Votre Campagne ne sera conservée que si vous la rangez dans un emplacement.',
        () => {
          newGame();
          toast('Nouvelle partie en mode Libre.');
          renderParams();
        }
      );
    }
  });

  document.addEventListener('click', e => {
    const b = e.target.closest('[data-map-scroll]');
    if (!b) {
      return;
    }
    const sc = document.getElementById('mapSc');
    if (!sc) {
      return;
    }
    sc.scrollBy({ left: +b.dataset.mapScroll * sc.clientWidth * 0.7, behavior: RM ? 'auto' : 'smooth' });
    setTimeout(updateScrollArrows, RM ? 30 : 420);
  });

  document.addEventListener(
    'scroll',
    e => {
      if (e.target && e.target.id === 'mapSc') {
        clearTimeout(updateScrollArrows.t);
        updateScrollArrows.t = setTimeout(updateScrollArrows, 60);
      }
    },
    true
  );

  window.addEventListener('resize', () => setTimeout(updateScrollArrows, 100));

  document.addEventListener('click', () => {
    if (cur === 'carte') {
      setTimeout(updateScrollArrows, 90);
    }
  });

  document.addEventListener('click', e => {
    const v = e.target.closest('[data-cheat-code]');
    if (v) {
      const i = document.getElementById('cheat-code');
      if (isCodeValid(i && i.value)) {
        PREF.devKey = CREATOR_KEY;
        savePref();
        toast('Action Replay activé sur cet appareil.');
        renderParams();
      } else {
        toast('Code inconnu.');
        if (i) {
          i.value = '';
        }
      }
      return;
    }
    const t = e.target.closest('[data-cheat]');
    if (!t || !isCreator()) {
      return;
    }
    applyCheat(t.dataset.cheat);
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target && e.target.id === 'cheat-code') {
      e.preventDefault();
      const b = document.querySelector('[data-cheat-code="ok"]');
      if (b) {
        b.click();
      }
    }
  });

  HOOKS.combat.push((S, opt, D0) => {
    D0 = D0 || SCEN[S.sc] || {};
    const pr = PREF.deployPhase || 'grands';
    if (pr === 'jamais' || D0.tuto || D0.enigme431 != null || D0.duel433 || S.coop || S.order === 'vitesse') {
      return;
    }
    if (pr === 'grands' && !isLargeBattle(D0)) {
      return;
    }
    if (AUTO && !window.__skipDeploy) {
      return;
    }
    S.deployPhase = 1;
  });

  document.addEventListener('click', e => {
    const b = e.target.closest('[data-deploy-phase]');
    if (!b) {
      return;
    }
    PREF.deployPhase = b.dataset.deployPhase;
    savePref();
    renderParams();
  });

  $('#bSvg').addEventListener(
    'click',
    e => {
      if (!B || !B.deployPhase || B.over) {
        return;
      }
      e.stopPropagation();
      const p = e.target.closest('[data-k]');
      if (p && !ui.busy) {
        deployTap(p.dataset.k);
      }
    },
    true
  );

  document.addEventListener(
    'click',
    e => {
      if (!B || !B.deployPhase || B.over) {
        return;
      }
      if (e.target.closest('#bEnd')) {
        e.preventDefault();
        e.stopPropagation();
        endDeployment();
      } else if (e.target.closest('#bPanel button,.plate')) {
        e.preventDefault();
        e.stopPropagation();
        toast('Déploiement : placez vos Pokémon, puis « Lancer le combat ».');
      }
    },
    true
  );

  HOOKS.combat.push((S, opt) => {
    const d = opt && opt.doctrineChoice;
    if (!d || !DOCTRINE_DEFS[d]) {
      return;
    }
    S.doctrineChoice = d;
    const al = S.units.filter(u => u.side === 'a');
    if (d === 'resonance') {
      al.forEach(u => (u.en = Math.min(EMAX, (u.en || 0) + 1)));
      if (S.vmax > 1) {
        S.vmax -= 1;
        S.voice = Math.min(S.voice, S.vmax);
      } else {
        al.forEach(u => {
          u.mhp = Math.max(1, Math.round(u.mhp * 0.9));
          u.hp = Math.min(u.hp, u.mhp);
        });
      }
    } else if (d === 'commandement') {
      S.vmax += 1;
      S.voice += 1;
      al.forEach(u => {
        u.mhp = Math.max(1, Math.round(u.mhp * 0.9));
        u.hp = Math.min(u.hp, u.mhp);
      });
    }
  });

  HOOKS.progress.push((S, rew, win) => {
    if (!S.doctrineChoice) {
      return null;
    }
    rew.doctrineChoice = S.doctrineChoice;
    if (!win || S.doctrineChoice !== 'butin') {
      return null;
    }
    const m = Math.round(((rew.money || 0) * 0.3) / 10) * 10;
    rew.loot = m;
    return m ? [m, 0] : null;
  });

  HOOKS.battleResult.push(r =>
    r.doctrineChoice && DOCTRINE_DEFS[r.doctrineChoice]
      ? `<div class="res-l"><h4>Doctrine</h4><div class="rl"><span>${DOCTRINE_DEFS[r.doctrineChoice].n}${r.loot ? ' : butin de la victoire' : ''}</span><b>${r.loot ? '+' + fmt(r.loot) + ' ₽' : ''}</b></div></div>`
      : ''
  );

  document.addEventListener('click', e => {
    const b = e.target.closest('[data-doctrine-choice]');
    if (!b) {
      return;
    }
    PROFILE.doctrineChoice = b.dataset.doctrineChoice;
    queueSave();
    doctrineRender();
  });

  HOOKS.progress.push((S, rew, win) => {
    const D = SCEN[S.sc] || {};
    if (D.tuto) {
      return null;
    }
    const J0 = S.stats.journalStats || { d: {}, t: {}, k: {} },
      al = S.units.filter(u => u.side === 'a');
    const rows = al.map(u => ({
      uid: u.uid,
      id: u.id,
      sp: u.sp,
      d: J0.d[u.uid] || 0,
      t: J0.t[u.uid] || 0,
      k: J0.k[u.uid] || 0,
      ko: u.ko ? 1 : 0,
    }));
    const sc = r => r.d + r.k * 40 - r.ko * 15,
      mvp = rows.length ? rows.reduce((a, b) => (sc(b) > sc(a) ? b : a)) : null;
    rew.journalStats = { rows, mvp: mvp && mvp.d > 0 ? mvp.uid : null };
    // cumulative statistics
    const J = (PROFILE.tacticsJournal = PROFILE.tacticsJournal || log0430());
    J.n++;
    if (win) {
      J.w++;
      J.runStreak++;
      J.best = Math.max(J.best, J.runStreak);
    } else {
      J.runStreak = 0;
    }
    rows.forEach(r => {
      J.dealt += r.d;
      J.taken += r.t;
      J.ko += r.k;
      if (BY[r.sp]) {
        J.use[r.sp] = (J.use[r.sp] || 0) + 1;
      }
    });
    if (mvp && mvp.d > 0 && BY[mvp.sp]) {
      J.mvp[mvp.sp] = (J.mvp[mvp.sp] || 0) + 1;
    }
    const c = scenarioCategory(S.sc, D);
    J.category[c] = J.category[c] || [0, 0];
    J.category[c][win ? 0 : 1]++;
    J.last.push([
      (SCEN[S.sc] && SCEN[S.sc].n) || S.sc,
      win ? 1 : 0,
      S.rank || '',
      S.round || 0,
      mvp && mvp.d > 0 ? mvp.sp : '',
    ]);
    if (J.last.length > 10) {
      J.last = J.last.slice(-10);
    }
    return null;
  });

  HOOKS.battleResult.push(r => {
    const j = r.journalStats;
    if (!j || !j.rows.length) {
      return '';
    }
    const mx = Math.max(1, ...j.rows.map(x => x.d));
    return `<div class="res-l battle-report"><h4>Rapport tactique</h4>${j.rows
      .map(x => {
        const m = BY[x.id] || BY[x.sp];
        return `<div class="battle-report-r${j.mvp === x.uid ? ' mvp' : ''}${x.ko ? ' ko' : ''}">${medal(m.t, 'sm')}<span class="battle-report-n"><b>${m.n}</b>${j.mvp === x.uid ? '<em>MVP</em>' : ''}</span><span class="battle-report-b"><i style="width:${Math.round((x.d / mx) * 100)}%"></i></span><span class="battle-report-v" title="Dégâts infligés · subis · K.O.">${x.d} <small>/ ${x.t}${x.k ? ` · ${x.k} K.O.` : ''}</small></span></div>`;
      })
      .join(
        ''
      )}<p class="battle-report-l">Dégâts infligés / subis. Statistiques complètes : Quêtes › Journal.</p></div>`;
  });

  /* ---------- what's new ---------- */
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-news="camp-news"]');
    if (!b) {
      return;
    }
    e.stopPropagation();
    go('camp');
  });
}
