import { BY } from '../pokemon/pokemon.js';
import { RECRUIT } from '../pokemon/evolution.js';
import { PROFILE, isCamp } from '../state/game-state.js';
import { RC } from '../pokemon/roles-synergies.js';
import { BADGES } from './gyms.js';
import { paintOverlay } from '../../screens/overlays/dialogsStore.js';
import { $, toast } from '../core/utils.js';
import { HOOKS } from '../core/hooks.js';
import { go } from '../core/navigation.js';
import { TOD, __set_wildId } from '../world/home-route.js';
import { squad, toggle } from '../team/team.js';
import { wildScen } from '../combat/items-bonds-ai.js';
import { B, __set_scSel, clearAim, launch, log, renderAll, ui } from '../combat/ui.js';
import { queueSave } from '../state/saves.js';
import { PREF, renderPrep, sfx, vibe } from '../progression/campaign.js';
import { renderWallet } from '../core/interface.js';
import { PL, PLACES } from '../world/map.js';
import { refreshMap } from '../../screens/map/mapStore.js';
import { SHINY_RATE, SPARK } from './adventure.js';
import { multChroma } from '../world/seasons.js';
import { routeName } from '../world/johto.js';
import { regionPool, familyRegion, regionIndex } from '../world/catch-anywhere.js';
import { applyShinyArt } from '../assets/art-direction.js';
import { awardRegionDiplomas } from '../combat/catches.js';

export let SAFARI_PRICE, SAFARI_STEPS, SAFARI_BALLS;
let FISHING, SAF_MSG;

/* =====================================================================
   v4.18: fishing, Safari Park and co-op
   1. Fishing: from the tall grass (Route 29, Route 32), cast the
      line, hook at the right moment, then fight the catch (capture in
      Campaign). Sometimes a big Dominant fish.
   2. Safari Park (Kanto, after 2 badges in Campaign): ₽500 entry,
      12 steps and 20 Safari Balls. You capture without fighting, with bait and
      rocks. Rare Pokémon are more frequent there.
   3. 2-player co-op (Settings): on the same phone, Player 1
      controls the first 2 Pokémon, Player 2 the others.
   ===================================================================== */
export function FISHING_SAFARI_0() {
  return { safari: null, catches: 0, safariTaken: 0 };
}

export function fishingSafariClean(p) {
  const o = FISHING_SAFARI_0();
  if (!p || typeof p !== 'object') {
    return o;
  }
  const s = p.safari;
  if (s && typeof s === 'object' && Number.isFinite(s.stepCount) && Number.isFinite(s.balls)) {
    o.safari = {
      stepCount: Math.max(0, Math.min(12, Math.floor(s.stepCount))),
      balls: Math.max(0, Math.min(20, Math.floor(s.balls))),
      isTaken: Array.isArray(s.isTaken) ? s.isTaken.filter(id => BY[id]).slice(0, 20) : [],
      enc: null,
    };
    if (!o.safari.stepCount && !o.safari.balls) {
      o.safari = null;
    }
  }
  if (Number.isFinite(p.catches)) {
    o.catches = Math.max(0, Math.min(99999, Math.floor(p.catches)));
  }
  if (Number.isFinite(p.safariTaken)) {
    o.safariTaken = Math.max(0, Math.min(99999, Math.floor(p.safariTaken)));
  }
  return o;
}

/** Out-of-battle capture (Safari): Box, Pokédex, shiny. */
function addCaughtMon(id, sh) {
  const b = BY[id].base;
  PROFILE.caught++;
  if (!PROFILE.dex.includes(b)) {
    PROFILE.dex.push(b);
  }
  const nw = !PROFILE.box.includes(b); // Free mode too (v4.21)
  if (nw) {
    PROFILE.box.push(b);
  }
  if (sh && !PROFILE.shiny.includes(b)) {
    PROFILE.shiny.push(b);
  }
  if (nw) {
    setTimeout(awardRegionDiplomas, 0);
  } // regional diploma (v4.28)
  return nw;
}

/* =====================================================================
   1. Fishing
   ===================================================================== */
function fishingPool() {
  return RECRUIT.filter(m => m.t.includes('Eau') && (familyRegion(m.id) === regionIndex() || m.id === 'magicarpe')); // the region's fish, Magikarp bites everywhere (v4.21)
}

function drawFishingCatch() {
  const L = fishingPool();
  if (!L.length) {
    return null;
  }
  const w = L.map(
    m => (m.id === 'magicarpe' ? [0, 4, 2, 1][regionIndex()] : 1) * (!PROFILE.box.includes(m.id) ? 2 : 1)
  );
  return drawWeightedMon(L, w).id;
}

function castFishingLine() {
  clearTimeout(FISHING && FISHING.t);
  FISHING = { status: 'attente' };
  renderFishingPanel();
  $('#fishing-panel').hidden = false;
  FISHING.t = setTimeout(
    () => {
      if (!FISHING || FISHING.status !== 'attente') {
        return;
      }
      FISHING.status = 'mord';
      vibe(60);
      sfx('ui');
      renderFishingPanel();
      FISHING.t = setTimeout(
        () => {
          if (!FISHING || FISHING.status !== 'mord') {
            return;
          }
          FISHING.status = 'rate';
          renderFishingPanel();
        },
        PREF.fast ? 1400 : 1150
      );
    },
    1200 + Math.random() * 2200
  );
}

function setFishingHook() {
  if (!FISHING || FISHING.status !== 'mord') {
    return;
  }
  clearTimeout(FISHING.t);
  const id = drawFishingCatch();
  if (!id) {
    return;
  }
  FISHING = { status: 'prise', id, sh: Math.random() < SHINY_RATE * multChroma(), dom: Math.random() < 0.05 };
  PROFILE.catches = (PROFILE.catches || 0) + 1;
  queueSave();
  renderFishingPanel();
}

/* fishing window: rendered by React (src/screens/overlays/FishingWindow.jsx) */
function renderFishingPanel() {
  const el = $('#fishing-panel'),
    P2 = FISHING || {};
  // the shiny artwork is recolored after rendering (v4.25)
  setTimeout(() => P2.status === 'prise' && P2.sh && applyShinyArt(el.querySelector('.pe-prise img'), BY[P2.id].no), 0);
  paintOverlay('peche', {
    status: P2.status,
    id: P2.id,
    sh: P2.sh,
    dom: P2.dom,
    known: !!P2.id && PROFILE.box.includes(P2.id),
    route: routeName(),
    catches: PROFILE.catches || 0,
  });
}

function startFishingBattle() {
  const P2 = FISHING;
  if (!P2 || P2.status !== 'prise') {
    return;
  }
  $('#fishing-panel').hidden = true;
  __set_wildId(P2.id);
  const D = wildScen(P2.id, TOD, P2.sh, P2.dom);
  Object.assign(D, {
    water: ['4,0', '5,0', '6,0', '5,1', '6,1', '7,1', '6,3', '7,3', '5,4', '6,4', '7,5'],
    lvl: D.lvl.replace(/rencontre|Dominant/, P2.dom ? 'pêche · Dominant' : 'pêche'),
  });
  D.foes = D.foes.map(f => [f[0], f[0] === P2.id ? [6, 2] : [7, 4], f[2]]);
  FISHING = null;
  __set_scSel('sauvage');
  go('combat');
  if (!squad.length) {
    renderPrep();
    return void toast('Recrutez au moins un Pokémon avant de combattre.');
  }
  launch();
}

function safariPool() {
  return regionPool(1); // the Safari Park is in Kanto: the Kanto families (v4.21)
}

function rollSafariEncounter() {
  const L = safariPool(),
    w = L.map(m => (1 + RC(m.id)) * (!PROFILE.box.includes(m.id) ? 2 : 1)),
    m = drawWeightedMon(L, w);
  return { id: m.id, sh: Math.random() < SHINY_RATE * multChroma() * 2, bait: 0, caillou: 0 };
}

function enterSafari() {
  if (safariLocked()) {
    return void toast(safariLocked());
  }
  if (!PROFILE.safari) {
    if (PROFILE.money < SAFARI_PRICE) {
      return void toast('Il faut 500 ₽ pour entrer.');
    }
    PROFILE.money -= SAFARI_PRICE;
    PROFILE.safari = { stepCount: SAFARI_STEPS, balls: SAFARI_BALLS, isTaken: [], enc: null };
    renderWallet();
    queueSave();
  }
  SAF_MSG = 'Bienvenue au Parc Safari ! Avancez dans les herbes hautes.';
  renderSafariPanel();
  $('#safari-panel').hidden = false;
}

/** An action in the Park; returns the message (testable without display). */
function performSafariAction(a) {
  const S2 = PROFILE.safari;
  if (!S2) {
    return '';
  }
  const x = S2.enc;
  let msg = '';
  if (a === 'marcher') {
    if (x || S2.stepCount <= 0) {
      return '';
    }
    S2.stepCount--;
    S2.enc = rollSafariEncounter();
    const m = BY[S2.enc.id];
    msg = S2.enc.sh ? `${SPARK} Un ${m.n} chromatique sort des herbes !` : `Un ${m.n} sauvage apparaît !`;
  } else if (x && a === 'ball') {
    if (S2.balls <= 0) {
      return '';
    }
    S2.balls--;
    if (Math.random() < catchChance(x)) {
      const nw = addCaughtMon(x.id, x.sh);
      S2.isTaken.push(x.id);
      PROFILE.safariTaken = (PROFILE.safariTaken || 0) + 1;
      msg = `Gotcha ! ${BY[x.id].n} est capturé${nw ? ' et rejoint votre Box' : ''}.`;
      S2.enc = null;
    } else {
      msg = `Raté ! ${BY[x.id].n} s’est libéré.`;
    }
  } else if (x && a === 'appat') {
    x.bait = 2;
    x.caillou = 0;
    msg = `${BY[x.id].n} grignote l’appât : il est moins pressé de partir.`;
  } else if (x && a === 'caillou') {
    x.caillou = 2;
    x.bait = 0;
    msg = `${BY[x.id].n} est sonné : plus facile à attraper, mais il s’agace.`;
  } else if (x && a === 'fuir') {
    S2.enc = null;
    msg = 'Vous laissez le Pokémon tranquille.';
  }
  // the Pokémon may flee after an action
  if (S2.enc && x && a !== 'marcher' && a !== 'fuir') {
    if (Math.random() < fleeChance(x)) {
      msg += ` ${BY[x.id].n} s’enfuit !`;
      S2.enc = null;
    } else {
      if (x.bait > 0 && a !== 'appat') {
        x.bait--;
      }
      if (x.caillou > 0 && a !== 'caillou') {
        x.caillou--;
      }
    }
  }
  if (!S2.enc && (S2.stepCount <= 0 || S2.balls <= 0)) {
    msg += ` La visite est terminée : ${S2.isTaken.length} capture${S2.isTaken.length > 1 ? 's' : ''}.`;
    S2.fini = true;
  }
  queueSave();
  return msg;
}

function renderSafariPanel() {
  const S2 = PROFILE.safari,
    el = $('#safari-panel');
  if (!S2) {
    el.hidden = true;
    return;
  }
  const x = S2.enc;
  // rendered by src/screens/overlays/SafariWindow.jsx
  paintOverlay('safari', {
    stepCount: S2.stepCount,
    balls: S2.balls,
    isTaken: S2.isTaken.length,
    fini: !!S2.fini,
    x: x ? { id: x.id, sh: x.sh } : null,
    mood: x
      ? x.bait
        ? 'Il mange l’appât'
        : x.caillou
          ? 'Il est agacé'
          : fleeChance(x) > 0.25
            ? 'Il est méfiant'
            : 'Il vous observe'
      : '',
    caughtCount: x ? catchChance(x) : 0,
    flee: x ? fleeChance(x) : 0,
    msg: SAF_MSG,
  });
}

// Safari Park panel on the map: src/screens/map/MapInfo.jsx (SafariInfo).

/** End of the co-op turn: Player 1 hands over to Player 2. Returns true if control was handed over. */
export function coopPassTurn() {
  if (!B || !B.coop || B.coop !== 1 || ui.busy || B.over || B.phase !== 'player' || !isCoopPlayerAlive(B, 2)) {
    return false;
  }
  B.coop = 2;
  ui.sel = null;
  ui.selE = null;
  ui.mode = null;
  clearAim();
  const nx = B.units.find(x => x.side === 'a' && !x.ko && !x.acted && coopPlayer(x) === 2);
  ui.sel = nx ? nx.uid : null;
  log('Au tour du Joueur 2.', 'sys');
  toast('Au tour du Joueur 2 !');
  vibe(30);
  renderAll();
  return true;
}

const drawWeightedMon = (L, w) => {
  let r = Math.random() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < L.length; i++) {
    r -= w[i];
    if (r <= 0) {
      return L[i];
    }
  }
  return L[L.length - 1];
};

export const safariLocked = () => (isCamp() && BADGES.length < 2 ? 'Le Parc Safari ouvre après votre 2e badge.' : null);

const catchChance = x => {
  const base = Math.max(0.08, Math.min(0.45, 0.5 - 0.06 * RC(x.id)));
  return Math.min(0.9, base * (x.caillou ? 1.6 : 1) * (x.bait ? 0.8 : 1));
};

const fleeChance = x => {
  const base = Math.max(0.08, Math.min(0.35, 0.06 + 0.04 * BY[x.id].s[3]));
  return Math.min(0.85, base * (x.bait ? 0.5 : 1) * (x.caillou ? 1.6 : 1));
};

/* =====================================================================
   3. 2-player co-op
   ===================================================================== */
/** Player 1: the first 2 Pokémon of the team; Player 2: the others. */
export const coopPlayer = u => (+String(u.uid).slice(1) < 2 ? 1 : 2);

export const isCoopPlayerAlive = (S, j) => S.units.some(u => u.side === 'a' && !u.ko && coopPlayer(u) === j);

// Statements run at startup, in the original order (see index.js).
export function init() {
  FISHING = null;

  // #fishingPanel: rendered by React (src/screens/overlays/FishingWindow.jsx)

  document.addEventListener('click', e => {
    if (e.target.closest('[data-fishing-start]')) {
      return void castFishingLine();
    }
    const b = e.target.closest('[data-fishing-panel]');
    if (!b) {
      if (e.target.id === 'fishing-panel') {
        clearTimeout(FISHING && FISHING.t);
        FISHING = null;
        $('#fishing-panel').hidden = true;
      }
      return;
    }
    const k = b.dataset.fishingPanel;
    if (k === 'ferrer') {
      setFishingHook();
    } else if (k === 'lancer') {
      castFishingLine();
    } else if (k === 'combat') {
      startFishingBattle();
    } else if (k === 'recruter' && FISHING && !squad.includes(FISHING.id)) {
      toggle(FISHING.id);
      $('#fishing-panel').hidden = true;
    } else if (k === 'relacher') {
      toast('Il retourne à l’eau.');
      castFishingLine();
    } else if (k === 'x') {
      clearTimeout(FISHING && FISHING.t);
      FISHING = null;
      $('#fishing-panel').hidden = true;
    }
  });

  /* =====================================================================
   2. Safari Park
   ===================================================================== */
  ((SAFARI_PRICE = 500), (SAFARI_STEPS = 12), (SAFARI_BALLS = 20));

  PLACES.push({
    id: 'safari',
    x: 535,
    y: 405,
    n: 'Parc Safari',
    s: 'Captures sans combat · appâts et cailloux',
    grp: 'entrainement',
  });

  PL.safari = PLACES[PLACES.length - 1];

  SAF_MSG = '';

  // #safariPanel: rendered by React (src/screens/overlays/SafariWindow.jsx)

  document.addEventListener('click', e => {
    if (e.target.closest('[data-safari-panel-entrer]')) {
      return void enterSafari();
    }
    const b = e.target.closest('[data-safari-panel]');
    if (!b) {
      if (e.target.id === 'safari-panel') {
        $('#safari-panel').hidden = true;
      }
      return;
    }
    const k = b.dataset.safariPanel;
    if (k === 'x') {
      return void ($('#safari-panel').hidden = true);
    }
    if (k === 'sortir') {
      const n = PROFILE.safari ? PROFILE.safari.isTaken.length : 0;
      PROFILE.safari = null;
      queueSave();
      $('#safari-panel').hidden = true;
      toast(`Merci de votre visite ! ${n} capture${n > 1 ? 's' : ''}.`);
      try {
        refreshMap(); // panel of the selected location (src/screens/map/MapInfo.jsx)
      } catch {
        /* Best effort: failure here is non-fatal. */
      }
      return;
    }
    SAF_MSG = performSafariAction(k);
    if (/Gotcha/.test(SAF_MSG)) {
      sfx('win');
      vibe(40);
    }
    renderSafariPanel();
  });

  HOOKS.combat.push((S, opt, D0) => {
    if (!PREF.coop || S.order === 'vitesse' || (D0 && (D0.tuto || D0.duel433))) {
      return;
    }
    if (S.units.filter(u => u.side === 'a').length < 2 || !opt || opt.robot) {
      return;
    }
    S.coop = isCoopPlayerAlive(S, 1) ? 1 : 2;
  });

  HOOKS.beforeRoundEnd.push(S => {
    if (S.coop) {
      S.coop = isCoopPlayerAlive(S, 1) ? 1 : 2;
    }
  });
}
