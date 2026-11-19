import { BY, MON, SCEN } from '../pokemon/pokemon.js';
import { PROFILE } from '../state/game-state.js';
import { BADGES } from '../modes/gyms.js';
import { medal, toast } from '../core/utils.js';
import { HOOKS } from '../core/hooks.js';
import { hasNx } from '../combat/engine.js';
import { queueSave } from '../state/saves.js';
import { sfx, vibe } from '../audio/sound-effects.js';
import { SHOP } from '../state/economy.js';
import { renderWallet } from '../ui/wallet.js';
import { dailyDiscount } from '../combat/resonance.js';
import { hatchDaycareEgg } from './daycare.js';
import { campOpen } from './camp.js';
import { dailyTm } from '../items/extra-held-items.js';
import { refreshCampBase } from '../../screens/camp/campStore.js';

export { BUILDINGS, buildingBlocked }; // read by the base Camp (src/screens/camp)

/* =====================================================================
   Base Camp (added in v4.10; Home, in Campaign): 5 buildings with 3
   levels, paid in Pokédollars and Shards, unlocked by badges
   (Watchtower, Infirmary, Workshop, Dojo, Daycare). Also holds the
   profile defaults and sanitizer of the v4.10 camp and expeditions state.
   ===================================================================== */

/* ---------- profile (declared functions: called as soon as the file loads) ---------- */
export function IDP0() {
  return { camp: { inf: 0, ate: 0, dojo: 0, guet: 0, pens: 0, oeuf: 0 }, exp: [] };
}

export function idpClean(p) {
  const o = IDP0();
  if (!p || typeof p !== 'object') {
    return o;
  }
  const c = p.camp;
  if (c && typeof c === 'object') {
    for (const k in o.camp) {
      if (Number.isFinite(c[k])) {
        o.camp[k] = Math.max(0, Math.min(k === 'oeuf' ? 99 : 3, Math.floor(c[k])));
      }
    }
  }
  if (Array.isArray(p.exp)) {
    o.exp = p.exp
      .filter(
        x =>
          x &&
          BY[x.id] &&
          typeof x.destinationId === 'string' &&
          Number.isFinite(x.fin) &&
          x.gain &&
          typeof x.gain === 'object'
      )
      .slice(0, 3);
  }
  return o;
}

function buildingBlocked(k) {
  const B2 = BUILDINGS[k],
    n = level(k);
  if (n >= 3) {
    return 'Niveau maximal';
  }
  const b = B2.badges[n];
  return BADGES.length < b ? `${b} badge${b > 1 ? 's' : ''} requis` : null;
}

function build(k) {
  if (!campOpen() || buildingBlocked(k)) {
    return;
  }
  const [m, g] = BUILDINGS[k].upgradeCost[level(k)];
  if (PROFILE.money < m || PROFILE.gems < g) {
    toast('Pas assez de Pokédollars ou d’Éclats.');
    return;
  }
  PROFILE.money -= m;
  PROFILE.gems -= g;
  PROFILE.camp = PROFILE.camp || IDP0().camp;
  PROFILE.camp[k] = level(k) + 1;
  sfx('ui');
  vibe(20);
  toast(`${BUILDINGS[k].n} niveau ${level(k)} : ${BUILDINGS[k].d(level(k))}`);
  queueSave();
  renderWallet();
  renderCampBase();
}

/** Workshop: an item's price in the Shop (Pokédollars). */
export function costOf(k) {
  const p = dailyDiscount(k, costOf0(k)); // daily offers (v4.14)
  return dailyTm().o.includes(k) ? Math.max(50, Math.round((p * 0.8) / 50) * 50) : p; // daily TM: −20% (v4.58)
}

export function costOf0(k) {
  const it = SHOP[k];
  if (!it || it.g) {
    return it ? it.p : 0;
  }
  return it.mv && !it.cs && campOpen() ? Math.round((it.p * (1 - 0.1 * level('ate'))) / 50) * 50 : it.p;
}

// The "Camp de base" (Base Camp) panel (#v4Camp, Camp page) is rendered by React: src/screens/camp/CampBase.jsx.
export function renderCampBase() {
  refreshCampBase();
}

export const level = k => (PROFILE.camp && PROFILE.camp[k]) || 0;

const BUILDINGS = {
  guet: {
    n: 'Tour de guet',
    d: n => `${n} expédition${n > 1 ? 's' : ''} à la fois.`,
    upgradeCost: [
      [500, 0],
      [1500, 5],
      [3500, 10],
    ],
    badges: [0, 2, 4],
  },
  inf: {
    n: 'Infirmerie',
    d: n => `Les Pokémon au repos récupèrent ${n * 10} points de fatigue de plus après chaque combat.`,
    upgradeCost: [
      [800, 0],
      [2000, 5],
      [4000, 12],
    ],
    badges: [1, 3, 5],
  },
  ate: {
    n: 'Atelier',
    d: n => `CT et DT ${n * 10} % moins chères en Boutique.`,
    upgradeCost: [
      [600, 0],
      [1500, 4],
      [3000, 10],
    ],
    badges: [1, 3, 5],
  },
  dojo: {
    n: 'Dojo',
    d: n =>
      `${n === 1 ? 'Le premier Pokémon' : `Les ${n} premiers Pokémon`} de l’équipe commence${n > 1 ? 'nt' : ''} chaque combat avec 1 point d’Éveil.`,
    upgradeCost: [
      [1000, 0],
      [2500, 6],
      [5000, 14],
    ],
    badges: [2, 4, 6],
  },
  pens: {
    n: 'Pension',
    d: n =>
      `Un œuf tous les ${[8, 6, 4][n - 1]} combats : une famille que vous n’avez pas encore, ou celle du couple que vous y déposez.`, // pair (v4.16)
    upgradeCost: [
      [1200, 0],
      [3000, 8],
      [6000, 16],
    ],
    badges: [2, 4, 6],
  },
};

// Startup statements, run in their original order (see index.js).
export function init() {
  /* ---------- the #v4Camp panel is rendered by React (Camp page) ---------- */
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-camp-b]');
    if (b) {
      return build(b.dataset.campB);
    }
  });
  // Dojo: the first Pokémon of the team start with 1 Awakening point
  HOOKS.creation.push((S, opt) => {
    if (!opt) {
      return;
    }
    if (opt.dojo) {
      S.units
        .filter(u => u.side === 'a')
        .slice(0, opt.dojo)
        .forEach(u => hasNx(u) && (u.en = Math.max(u.en, 1)));
    }
  });
  HOOKS.progress.push((S, rew) => {
    const D = SCEN[S.sc] || {};
    if (!campOpen() || D.tuto || D.tower) {
      return null;
    }
    // Infirmary: resting Pokémon recover faster
    const inf = level('inf');
    if (inf) {
      const used = S.units.filter(u => u.side === 'a').map(u => u.sp);
      for (const id in PROFILE.fatigue) {
        if (used.includes(id)) {
          continue;
        }
        PROFILE.fatigue[id] = Math.max(0, PROFILE.fatigue[id] - inf * 10);
        if (!PROFILE.fatigue[id]) {
          delete PROFILE.fatigue[id];
        }
      }
    }
    // Daycare: an egg
    const pe = level('pens');
    if (pe) {
      PROFILE.camp.oeuf = (PROFILE.camp.oeuf || 0) + 1;
      if (PROFILE.camp.oeuf >= [8, 6, 4][pe - 1] && !hatchDaycareEgg(rew)) {
        // without a pair: an unknown family (v4.10); with a pair: their egg (v4.16)
        const pool = MON.filter(
          m => m.st === 1 && !m.leg && !m.isEnemy && m.base === m.id && !PROFILE.box.includes(m.id)
        );
        if (pool.length) {
          const m = pool[Math.floor(Math.random() * pool.length)];
          PROFILE.box.push(m.id);
          if (!PROFILE.dex.includes(m.id)) {
            PROFILE.dex.push(m.id);
          }
          PROFILE.camp.oeuf = 0;
          rew.oeuf = m.id;
        }
      }
    }
    return null;
  });
  HOOKS.battleResult.push(r =>
    r.oeuf
      ? `<div class="res-l"><h4>Pension</h4><div class="rl">${medal(BY[r.oeuf].t)}<span>Un œuf a éclos : ${BY[r.oeuf].n} rejoint votre Box !</span><b>🥚</b></div></div>`
      : ''
  );
}
