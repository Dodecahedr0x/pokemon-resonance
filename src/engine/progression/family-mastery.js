// Family mastery (Camp › Maîtrise, added in v4.31): after 10 battles, a permanent bonus of your choice out of two.
import { POKEMON, SCENARIOS } from '../pokemon/pokemon.js';
import { PROFILE } from '../state/game-state.js';
import { toast } from '../core/utils.js';
import { HOOKS } from '../core/hooks.js';
import { MAX_ENERGY } from '../combat/engine.js';
import { queueSave } from '../state/saves.js';
import { renderWallet } from '../ui/wallet.js';
import { renderCampPage } from '../modes/camp-challenges.js';

// read by the Camp tabs (src/screens/camp/tabs)
export { MASTERY_DEFS, masteryChoice };

function masteryChoice(b) {
  const K = Object.keys(MASTERY_DEFS);
  let h = 0;
  for (let i = 0; i < b.length; i++) {
    h = (h * 31 + b.charCodeAt(i)) >>> 0;
  }
  const a = h % K.length;
  return [K[a], K[(a + 1 + ((h >>> 5) % (K.length - 1))) % K.length]];
}

// damage and Movement bonuses of masteries, and of the Deep Echo relics carried in battle (S.relicBag)
export function masteryDamageBonus(S, u, t, d) {
  if (!(d > 0) || !S) {
    return d;
  }
  let f = 1;
  const R = S.relicBag || [];
  if (u && u.side === 'a') {
    if (u.masteryPick === 'puissance') {
      f *= 1.08;
    }
    if (R.includes('braise')) {
      f *= 1.1;
    }
  }
  if (t && t.side === 'a') {
    if (t.masteryPick === 'garde') {
      f *= 0.92;
    }
    if (R.includes('ecaille')) {
      f *= 0.9;
    }
  }
  return f === 1 ? d : Math.max(1, Math.round(d * f));
}

export function masteryMoveBonus(S, u) {
  if (!S || !u || u.side !== 'a') {
    return 0;
  }
  return (u.masteryPick === 'vif' ? 1 : 0) + ((S.relicBag || []).includes('plume') ? 1 : 0);
}

const MASTERY_DEFS = {
  puissance: ['Puissance', '+8 % de dégâts infligés'],
  robuste: ['Robustesse', '+10 % de PV maximum'],
  vif: ['Vivacité', '+1 Mouvement'],
  eveil: ['Éveil précoce', 'Commence avec 1 losange de plus'],
  garde: ['Garde', '−8 % de dégâts subis'],
};

export const MASTERY_THRESHOLD = 10;

// Statements run at startup, in the original order (see index.js).
export function init() {
  HOOKS.progress.push((S, rew) => {
    const D = SCENARIOS[S.sc] || {};
    if (D.tuto || D.rentalTeam) {
      return null;
    }
    const M = (PROFILE.masteryTrack = PROFILE.masteryTrack || {}),
      readyList = [];
    S.units
      .filter(u => u.side === 'a' && POKEMON[u.sp])
      .forEach(u => {
        const x = (M[u.sp] = M[u.sp] || { n: 0, p: '' });
        x.n++;
        if (x.n === MASTERY_THRESHOLD && !x.p) {
          readyList.push(u.sp);
        }
      });
    if (readyList.length) {
      rew.masteryTrack = readyList;
    }
    return null;
  });

  HOOKS.battleResult.push(r =>
    r.masteryTrack
      ? `<div class="result-list"><h4>Maîtrise</h4><div class="result-row"><span>${r.masteryTrack.map(b => POKEMON[b].n).join(', ')} : un bonus de maîtrise est à choisir (Camp › Maîtrise).</span><b>★</b></div></div>`
      : ''
  );

  HOOKS.combat.push(S => {
    if (S.restricted && S.sc !== 'echo431') {
      return;
    }
    const M = PROFILE.masteryTrack || {};
    S.units
      .filter(u => u.side === 'a')
      .forEach(u => {
        const p = M[u.sp] && M[u.sp].p;
        if (!p || !MASTERY_DEFS[p]) {
          return;
        }
        u.masteryPick = p;
        if (p === 'robuste') {
          u.mhp = Math.round(u.mhp * 1.1);
          u.hp = Math.min(u.mhp, Math.round(u.hp * 1.1));
        } else if (p === 'eveil') {
          u.en = Math.min(MAX_ENERGY, (u.en || 0) + 1);
        }
      });
  });

  document.addEventListener('click', e => {
    const b = e.target.closest('[data-mastery-track]');
    if (!b) {
      return;
    }
    const base = b.dataset.masteryTrack,
      k = b.dataset.k,
      M = (PROFILE.masteryTrack = PROFILE.masteryTrack || {}),
      x = M[base];
    if (!x || x.n < MASTERY_THRESHOLD || !MASTERY_DEFS[k] || !masteryChoice(base).includes(k)) {
      return;
    }
    if (x.p && x.p !== k) {
      if ((PROFILE.money || 0) < 500) {
        return toast('Il faut 500 ₽ pour changer de maîtrise.');
      }
      PROFILE.money -= 500;
    }
    x.p = k;
    toast(`${POKEMON[base].n} : ${MASTERY_DEFS[k][0]}.`);
    queueSave();
    renderWallet();
    renderCampPage();
  });
}
