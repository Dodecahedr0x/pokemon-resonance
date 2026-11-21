import { RECRUIT } from '../pokemon/evolution.js';
import { PROFILE } from '../state/game-state.js';
import { __set_BADGES } from '../modes/gyms.js';
import { toast } from '../core/utils.js';
import { goTo } from '../core/navigation.js';
import { renderSquad, save } from '../team/team.js';
import { B, finish } from '../combat/ui.js';
import { PREF, savePref } from '../ui/preferences.js';
import { SHOP } from '../state/economy.js';
import { renderWallet } from '../ui/wallet.js';
import { renderHome } from '../world/home.js';
import { renderParams } from '../ui/settings.js';
import { LEGS } from '../modes/legendaries.js';

/* =====================================================================
   Action Replay (secret code, added in v4.30 as the Creator's Workshop):
   cheats reserved for the code holder.
   ===================================================================== */
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
    goTo('combat');
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

// only the code's fingerprint is in the game, never the code itself
const CREATOR_KEY = 'agg9t7xer71nts93h0hym';

export const isCreator = () => PREF.devKey === CREATOR_KEY;

// Startup statements, run in their original order (see index.js).
export function init() {
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
}
