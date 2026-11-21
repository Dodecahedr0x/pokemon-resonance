/* =====================================================================
   Dominant Pokémon (added in v4.16): rare, bigger, stronger, escorted.
   Defeated or captured, they leave a treasure (TM, held item, Shards).
   ===================================================================== */
import { POKEMON, SCENARIOS } from '../pokemon/pokemon.js';
import { RECRUIT } from '../pokemon/evolution.js';
import { ITEMS2, PROFILE, isCamp } from '../state/game-state.js';
import { BADGES } from '../modes/gyms.js';
import { HOOKS } from '../core/hooks.js';
import { TOD } from './home-route.js';
import { pushMessage } from '../combat/engine.js';
import { wildScen } from '../combat/items-bonds-ai.js';
import { SHOP, bagCount, formatNumber } from '../state/economy.js';
import { MACHINES } from '../moves/tms.js';
import { ACHIEVEMENTS } from '../progression/achievements.js';
import { HELD_SHOP } from '../combat/resonance.js';
import { isJohtoRegion } from './johto.js';
import { dailyDominant } from './pokegear.js';
import { familyRegion, regionIndex } from './catch-anywhere.js';

export let wildDominant;
export function __set_wildDominant(v) {
  return (wildDominant = v);
}

export const DOMINANT_CROWN_SVG =
  '<svg class="dom-cr" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 18 4.5 7l5 5L12 4l2.5 8 5-5L21 18Z" fill="currentColor"/><path d="M3 20h18" stroke="currentColor" stroke-width="2"/></svg>';

export function rollDominant(id) {
  if (isCamp() && BADGES.length < 2 && !isJohtoRegion()) {
    return false;
  }
  return Math.random() < (TOD === 'nuit' ? 0.1 : 0.07) * (id && id === dailyDominant() ? 3 : 1); // Dominant flagged (v4.17)
}

export function makeDominantScenario(D, id, shiny) {
  const m = POKEMON[id],
    neighbors = RECRUIT.filter(
      x => x.id !== id && x.t.some(t => m.t.includes(t)) && familyRegion(x.id) === regionIndex()
    ), // region escort (v4.21)
    nearby = RECRUIT.filter(x => x.id !== id && familyRegion(x.id) === regionIndex()),
    pool = neighbors.length ? neighbors : nearby.length ? nearby : RECRUIT.filter(x => x.id !== id),
    a = pool[Math.floor(Math.random() * pool.length)];
  Object.assign(D, {
    dom: true,
    rule: 'jdom',
    lim: 9,
    lvl: D.lvl.replace('rencontre', 'Dominant'),
    d: `Un ${m.n} Dominant, plus grand et plus fort que les autres, escorté par un ${a.n}. Son aura le blinde au début du combat puis toutes les 2 manches. Battu ou capturé, il laisse un trésor rare.`,
    foes: [
      [id, [6, 2], Object.assign({ boss: true, hb: D.hb * 2 + 12, pb: D.pb + 2 }, shiny ? { shiny: true } : {})],
      [a.id, [7, 4]],
    ],
  });
  return D;
}

export function dominantSetup(S, ev) {
  const u = S.units.find(e => e.side === 'e' && e.uid === 'e0');
  if (!u) {
    return;
  }
  u.dom = true;
  u.guard = Math.max(u.guard, 2);
  pushMessage(ev, `Aura du Dominant : ${u.n} est blindé (+2 Garde).`);
}

export function dominantTick(S, ev) {
  const u = S.units.find(e => e.dom && !e.ko);
  if (!u || S.round % 2 !== 1) {
    return;
  }
  u.guard = Math.max(u.guard, 2);
  u.boost = Math.max(u.boost || 0, 1);
  pushMessage(ev, `Aura du Dominant : ${u.n} se blinde et se renforce.`);
}

function dominantReward(rew) {
  const r = Math.random(),
    o = { g: 2 };
  const cts = Object.keys(MACHINES).filter(k => SHOP[k] && !MACHINES[k].cs),
    newTms = cts.filter(k => !bagCount(k)),
    held = Object.keys(HELD_SHOP).filter(k => HELD_SHOP[k].p && !PROFILE.items.includes(k));
  if (r < 0.45 && cts.length) {
    const L = newTms.length ? newTms : cts,
      k = L[Math.floor(Math.random() * L.length)];
    PROFILE.bag[k] = Math.min(99, bagCount(k) + 1);
    o.ct = k;
  } else if (r < 0.7 && isCamp() && held.length) {
    const k = held[Math.floor(Math.random() * held.length)];
    PROFILE.items.push(k);
    o.item = k;
  } else {
    o.g += 4;
    o.m = 800;
  }
  rew.dom = o;
  PROFILE.dom = (PROFILE.dom || 0) + 1;
  return [o.m || 0, o.g];
}

// Instructions run at startup, in the original order (see index.js).
export function init() {
  wildDominant = false;

  /* ---------- hooks: after the battle ---------- */
  HOOKS.progress.push((S, rew, win) => {
    const D = SCENARIOS[S.sc] || {},
      o = [0, 0];
    if (D.dom) {
      if (win) {
        const x = dominantReward(rew);
        o[0] += x[0];
        o[1] += x[1];
      }
      // a Dominant is not replayed: "Rejouer" (Replay) restarts an ordinary encounter
      const f = D.foes[0];
      wildScen(f[0], S.time, !!(f[2] && f[2].shiny), false);
    }
    return o[0] || o[1] ? o : null;
  });

  HOOKS.battleResult.push(r => {
    if (!r.dom) {
      return '';
    }
    const x = r.dom;
    return `<div class="result-list"><h4>Trésor du Dominant</h4><div class="result-row"><span>${
      x.ct
        ? `${SHOP[x.ct].n} rejoint votre Sac`
        : x.item
          ? `${ITEMS2[x.item].n} rejoint votre Sac (objet tenu)`
          : `${formatNumber(x.m || 0)} ₽ et des Éclats`
    }</span><b>${DOMINANT_CROWN_SVG}</b></div></div>`;
  });

  /* ---------- achievements ---------- */
  ACHIEVEMENTS.push({
    id: 'dominant',
    n: 'Chasseur de Dominants',
    d: 'Vaincre 3 Pokémon Dominants.',
    t: 'Chasseur',
    ok: () => (PROFILE.dom || 0) >= 3,
    p: () => [Math.min(3, PROFILE.dom || 0), 3],
  });
}
