/* Nuzlocke mode (option) (added in v4.51). */

import { POKEMON, SCENARIOS } from '../pokemon/pokemon.js';
import { BUDGET } from '../pokemon/evolution.js';
import { PROFILE } from '../state/game-state.js';
import { writeLS, toast } from '../core/utils.js';
import { HOOKS } from '../core/hooks.js';
import { __set_squad, squad } from '../team/team.js';
import { battle } from '../combat/ui.js';
import { queueSave } from '../state/saves.js';
import { PREFERENCES, savePref } from '../ui/preferences.js';
import { SCREEN_STATE } from '../ui/screen-state.js';
import { today } from '../state/economy.js';
import { renderParams } from '../ui/settings.js';

export let nuzlockeConfirm;

export function nuzlockeState() {
  let s;
  try {
    s = JSON.parse(localStorage.getItem('res-nuzlocke-run') || '{}');
  } catch (e) {
    s = {};
  }
  s.fallen = Array.isArray(s.fallen) ? s.fallen : [];
  if (!s.enc || s.enc.d !== today()) {
    s.enc = { d: today(), r: {} };
  }
  return s;
}

function saveNuzlocke(s) {
  writeLS('res-nuzlocke-run', s);
}

/** Rule 1: a single encounter per region per day. Returns false if the encounter is refused. */
export function nuzlockeEncounter() {
  if (!NUZLOCKE_ON()) {
    return true;
  }
  const s = nuzlockeState(),
    r = SCREEN_STATE.region || 'kanto';
  if (s.enc.r[r]) {
    toast('Nuzlocke : une seule rencontre par région et par jour. Revenez demain.');
    return false;
  }
  s.enc.r[r] = 1;
  saveNuzlocke(s);
  return true;
}

export const NUZLOCKE_ON = () => !!PREFERENCES.nuzlockeOn;

function onBattleEnd() {
  if (!NUZLOCKE_ON() || !battle || !battle.over || battle._nuzlockeDone) {
    return;
  }
  battle._nuzlockeDone = 1;
  const D = SCENARIOS[battle.sc] || {};
  if (D.noProgress || battle.duel433 || D.tuto || D.duel433 || SCENARIOS.ami === D) {
    return;
  }
  const bases = [];
  battle.units
    .filter(u => u.side === 'a' && u.ko)
    .forEach(u => {
      const b = (POKEMON[u.id] && POKEMON[u.id].base) || u.sp;
      if (b && PROFILE.box.includes(b) && !bases.includes(b)) {
        bases.push(b);
      }
    });
  if (!bases.length) {
    return;
  }
  let spared = null;
  if (PROFILE.box.length - bases.length < 1) {
    spared = bases.pop();
  } // the last companion is spared
  const s = nuzlockeState(),
    displayNames = [];
  bases.forEach(b => {
    PROFILE.box = PROFILE.box.filter(x => x !== b);
    PROFILE.forms = (PROFILE.forms || []).filter(x => !POKEMON[x] || POKEMON[x].base !== b);
    __set_squad(squad.filter(x => !POKEMON[x] || POKEMON[x].base !== b));
    displayNames.push(POKEMON[b].n);
    s.fallen.push({ id: b, n: POKEMON[b].n, d: today(), sc: battle.sc });
  });
  s.fallen = s.fallen.slice(-60);
  saveNuzlocke(s);
  battle._nuzlockeDeaths = { names: displayNames, spared: spared ? POKEMON[spared].n : '' };
  if (!squad.length) {
    __set_squad(
      PROFILE.box.filter((id, i, a) => a.slice(0, i + 1).reduce((t, x) => t + POKEMON[x].c, 0) <= BUDGET).slice(0, 4)
    );
  }
  writeLS('res8-squad', squad);
  queueSave();
}

// Instructions run at startup, in the original order (see index.js).
export function init() {
  /** Rule 2: a Pokémon KO'd at the end of a battle is lost for good. */
  HOOKS.battleEnd.push(onBattleEnd);

  // the fallen on the result sheet (.nuzlockeRun): rendered by React (src/screens/combat/battle/Result.jsx)

  /** Settings: activation to confirm and list of the fallen. */
  nuzlockeConfirm = false;

  // "Mode Nuzlocke" (Nuzlocke mode) panel: rendered by React (src/screens/settings/panels/Nuzlocke.jsx)

  document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('[data-nuzlocke-action]');
    if (!b) {
      return;
    }
    const k = b.dataset.nuzlockeAction;
    if (k === 'ask') {
      nuzlockeConfirm = true;
    } else if (k === 'no') {
      nuzlockeConfirm = false;
    } else if (k === 'yes') {
      nuzlockeConfirm = false;
      PREFERENCES.nuzlockeOn = 1;
      savePref();
    } else if (k === 'off') {
      PREFERENCES.nuzlockeOn = 0;
      savePref();
    }
    renderParams();
  });
}
