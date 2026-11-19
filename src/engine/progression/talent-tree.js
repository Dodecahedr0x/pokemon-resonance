/* Trainer talent tree (added in v4.64). */

import { SCEN } from '../pokemon/pokemon.js';
import { PROFILE } from '../state/game-state.js';
import { writeLS, toast } from '../core/utils.js';
import { HOOKS } from '../core/hooks.js';
import { heal, say } from '../combat/engine.js';
import { esc, queueSave } from '../state/saves.js';
import { sfx, vibe } from '../audio/sound-effects.js';
import { bagN } from '../state/economy.js';
import { tLevel } from './trainer-stats.js';
import { renderWallet } from '../ui/wallet.js';
import { renderBag } from './quests-shop.js';
import { DAMAGE_PROVIDERS } from '../combat/tactical-engine.js';

let TALENT_MAX, TALENT_RESET_COST;
// read by Shop › Talents (React, src/screens/bag/Workshop.jsx)
export { TALENTS, TALENT_MAX, TALENT_RESET_COST, talentState, talentSpent, talentPoints };

/** The battle counts for talents and the season (4.65): neither frozen team nor tutorial. */
export function isCountedBattle(S) {
  return S && !S.restricted && !(SCEN[S.sc] && SCEN[S.sc].tuto);
}

const talentState = () => {
  const s = (() => {
    try {
      return JSON.parse(localStorage.getItem('res-talent-tree') || 'null') || {};
    } catch (e) {
      return {};
    }
  })();
  const o = {};
  TALENTS.forEach(B => B.t.forEach(t => (o[t.id] = Math.max(0, Math.min(TALENT_MAX, s[t.id] | 0)))));
  return o;
};

const talentSave = o => {
  writeLS('res-talent-tree', o);
};

const talentSpent = () => Object.values(talentState()).reduce((a, b) => a + b, 0);

const talentPoints = () => Math.max(0, tLevel() - 1 - talentSpent());

const talentTree = id => talentState()[id] || 0;

const TALENTS = [
  {
    b: 'attaque',
    n: 'Attaque',
    t: [
      { id: 'a1', n: 'Mordant', d: r => `+${r * 2} % de dégâts.` },
      {
        id: 'a2',
        n: 'Concentration',
        d: r =>
          r >= 3
            ? 'Toute l’équipe commence avec 1 losange.'
            : `Les ${r} premier${r > 1 ? 's' : ''} Pokémon commence${r > 1 ? 'nt' : ''} avec 1 losange.`,
      },
      { id: 'a3', n: 'Coup de grâce', d: r => `+${r * 4} % de dégâts sur une cible sous 50 % de PV.` },
    ],
  },
  {
    b: 'soin',
    n: 'Soin',
    t: [
      { id: 's1', n: 'Premiers secours', d: r => `Fin de manche : l’équipe récupère ${r * 2} % de ses PV max.` },
      { id: 's2', n: 'Robustesse', d: r => `L’avant-garde commence avec ${r} de Garde.` },
      {
        id: 's3',
        n: 'Second souffle',
        d: r => `Une fois par combat, un allié sous 30 % de PV récupère ${r * 10} % de ses PV max.`,
      },
    ],
  },
  {
    b: 'exploration',
    n: 'Exploration',
    t: [
      { id: 'e1', n: 'Négociateur', d: r => `+${r * 40} ₽ après chaque victoire.` },
      { id: 'e2', n: 'Collectionneur', d: r => `${r * 8} % de chances de trouver une Poké Ball après une victoire.` },
      { id: 'e3', n: 'Œil de lynx', d: r => `${r * 8} % de chances de trouver un Éclat après une victoire.` },
    ],
  },
];

// Statements run at startup, in the original order (see index.js).
export function init() {
  ((TALENT_MAX = 3), (TALENT_RESET_COST = 500));
  HOOKS.combat.push(S => {
    if (!isCountedBattle(S)) {
      return;
    }
    const al = S.units.filter(u => u.side === 'a'),
      a2 = talentTree('a2'),
      s2 = talentTree('s2');
    al.forEach((u, i) => {
      if (a2 >= 3 || i < a2) {
        u.en = Math.max(u.en || 0, 1);
      }
    });
    if (s2 && al[0]) {
      al[0].guard = Math.max(al[0].guard || 0, s2);
    }
    S.talentTree = { used: {} };
  });
  HOOKS.beforeRoundEnd.push((S, ev) => {
    if (!S.talentTree) {
      return;
    }
    const al = S.units.filter(u => u.side === 'a' && !u.ko),
      s1 = talentTree('s1'),
      s3 = talentTree('s3');
    if (s1) {
      al.forEach(u => heal(S, u, Math.max(1, Math.round((u.mhp * s1 * 2) / 100)), ev));
    }
    if (s3) {
      al.forEach(u => {
        if (u.hp / u.mhp < 0.3 && !S.talentTree.used[u.uid]) {
          S.talentTree.used[u.uid] = 1;
          heal(S, u, Math.max(1, Math.round((u.mhp * s3 * 10) / 100)), ev);
          say(ev, `Second souffle : ${u.n} se relève.`);
        }
      });
    }
  });
  DAMAGE_PROVIDERS.push({
    id: 'talent-bonus',
    provide: (c, { S, u, t }) => {
      if (!S || !S.talentTree || !u || u.side !== 'a') {
        return false;
      }
      const a1 = talentTree('a1'),
        a3 = t && t.hp / t.mhp < 0.5 ? talentTree('a3') : 0,
        pc = a1 * 2 + a3 * 4;
      return pc > 0 && { mul: 1 + pc / 100, labelText: 'Talents' };
    },
  });
  HOOKS.progress.unshift((S, rew, win) => {
    try {
      if (!win || !isCountedBattle(S)) {
        return null;
      }
      const e1 = talentTree('e1'),
        e2 = talentTree('e2'),
        e3 = talentTree('e3'),
        out = [];
      if (e1) {
        PROFILE.money = Math.min(999999, PROFILE.money + e1 * 40);
        out.push(`+${e1 * 40} ₽`);
      }
      if (e2 && Math.random() < e2 * 0.08) {
        PROFILE.bag.poke = Math.min(99, bagN('poke') + 1);
        out.push('1 Poké Ball');
      }
      if (e3 && Math.random() < e3 * 0.08) {
        PROFILE.gems = Math.min(99999, PROFILE.gems + 1);
        out.push('1 Éclat');
      }
      if (out.length) {
        rew.talentTree = out;
      }
    } catch {
      /* Best effort: failure here is non-fatal. */
    }
    return null;
  });
  HOOKS.battleResult.unshift(r =>
    r.talentTree
      ? `<div class="res-l"><h4>Talents</h4><div class="rl"><span>Bonus de talents : ${esc(r.talentTree.join(', '))}</span></div></div>`
      : ''
  );
  document.addEventListener(
    'click',
    e => {
      const b = e.target.closest && e.target.closest('[data-talent-tree]');
      if (!b || b.disabled) {
        return;
      }
      e.stopPropagation();
      e.preventDefault();
      const k = b.dataset.talentTree,
        st = talentState();
      if (k === 'reset') {
        if (PROFILE.money < TALENT_RESET_COST || !talentSpent()) {
          return;
        }
        PROFILE.money -= TALENT_RESET_COST;
        talentSave({});
        toast('Talents réinitialisés.');
      } else if (k in st && st[k] < TALENT_MAX && talentPoints() > 0) {
        st[k]++;
        talentSave(st);
        sfx('ui');
        vibe(20);
      } else {
        return;
      }
      try {
        queueSave();
        renderWallet();
        renderBag();
      } catch {
        /* Best effort: failure here is non-fatal. */
      }
    },
    true
  );
}
