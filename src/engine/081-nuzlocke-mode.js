/* Original section: v4.51: Nuzlocke mode (option) */

import { BY, SCEN } from './009-pokemon.js';
import { BUDGET } from './010-in-battle-evolution.js';
import { PROFILE } from './011-game-state.js';
import { writeLS, toast } from './014-utils.js';
import { HOOKS } from './015-hooks.js';
import { __set_squad, squad } from './020-team-cards.js';
import { B } from './024-combat-ui.js';
import { queueSave } from './025-saves.js';
import { PREF, savePref } from './026-campaign-tutorial-sound.js';
import { V4, today } from './032-v4-foundation.js';
import { renderParams } from './040-settings.js';

export let nzConf450;

export function nzSt450() {
  let s;
  try {
    s = JSON.parse(localStorage.getItem('res-nz450') || '{}');
  } catch (e) {
    s = {};
  }
  s.fallen = Array.isArray(s.fallen) ? s.fallen : [];
  if (!s.enc || s.enc.d !== today()) {
    s.enc = { d: today(), r: {} };
  }
  return s;
}

function nzSave450(s) {
  writeLS('res-nz450', s);
}

/** Rule 1: a single encounter per region per day. Returns false if the encounter is refused. */
export function nzEncounter450() {
  if (!NZ450()) {
    return true;
  }
  const s = nzSt450(),
    r = V4.region || 'kanto';
  if (s.enc.r[r]) {
    toast('Nuzlocke : une seule rencontre par région et par jour. Revenez demain.');
    return false;
  }
  s.enc.r[r] = 1;
  nzSave450(s);
  return true;
}

export const NZ450 = () => !!PREF.nuz450;

// Instructions run at startup, in the original order (see index.js).
export function __init() {
  /** Rule 2: a Pokémon KO'd at the end of a battle is lost for good. */
  HOOKS.battleEnd.push(() => {
    if (!NZ450() || !B || !B.over || B._nz450) {
      return;
    }
    B._nz450 = 1;
    const D = SCEN[B.sc] || {};
    if (D.noProgress431 || B.duel433 || D.tuto || D.duel433 || SCEN.ami === D) {
      return;
    }
    const bases = [];
    B.units
      .filter(u => u.side === 'a' && u.ko)
      .forEach(u => {
        const b = (BY[u.id] && BY[u.id].base) || u.sp;
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
    const s = nzSt450(),
      displayNames = [];
    bases.forEach(b => {
      PROFILE.box = PROFILE.box.filter(x => x !== b);
      PROFILE.forms = (PROFILE.forms || []).filter(x => !BY[x] || BY[x].base !== b);
      __set_squad(squad.filter(x => !BY[x] || BY[x].base !== b));
      displayNames.push(BY[b].n);
      s.fallen.push({ id: b, n: BY[b].n, d: today(), sc: B.sc });
    });
    s.fallen = s.fallen.slice(-60);
    nzSave450(s);
    B._nzdead450 = { names: displayNames, spared: spared ? BY[spared].n : '' };
    if (!squad.length) {
      __set_squad(
        PROFILE.box.filter((id, i, a) => a.slice(0, i + 1).reduce((t, x) => t + BY[x].c, 0) <= BUDGET).slice(0, 4)
      );
    }
    writeLS('res8-squad', squad);
    queueSave();
  });

  // the fallen on the result sheet (.nz450): rendered by React (src/screens/combat/battle/Result.jsx)

  /** Settings: activation to confirm and list of the fallen. */
  nzConf450 = false;

  // "Mode Nuzlocke" (Nuzlocke mode) panel: rendered by React (src/screens/settings/panels/Nuzlocke.jsx)

  document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('[data-b451]');
    if (!b) {
      return;
    }
    const k = b.dataset.b451;
    if (k === 'ask') {
      nzConf450 = true;
    } else if (k === 'no') {
      nzConf450 = false;
    } else if (k === 'yes') {
      nzConf450 = false;
      PREF.nuz450 = 1;
      savePref();
    } else if (k === 'off') {
      PREF.nuz450 = 0;
      savePref();
    }
    renderParams();
  });
}
