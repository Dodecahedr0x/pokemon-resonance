/* Defense Gym (added in v4.68). */

import { POKEMON_LIST, SCEN } from '../pokemon/pokemon.js';
import { isCamp } from '../state/game-state.js';
import { BADGES } from './gyms.js';
import { writeLS, toast } from '../core/utils.js';
import { HOOKS } from '../core/hooks.js';
import { squad } from '../team/team.js';
import { K, mkUnit, plan, pushMessage, unitAt } from '../combat/engine.js';
import { OBST } from '../combat/synergies-obstacles.js';
import { B, backToPrep, goFight } from '../combat/ui.js';
import { overlay } from '../progression/prestige.js';
import { shut } from '../../screens/overlays/tempStore.js';

export let DEF_WAVES, DEF_LIVES;

function defenseWave(S, ev) {
  const D = S.def468;
  if (!D || D.w >= DEF_WAVES) {
    return false;
  }
  D.w++;
  const nb = Math.min(6 - S.units.filter(u => u.side === 'e' && !u.ko).length, 2 + Math.floor(D.w / 2));
  const pool = defensePool(),
    bad = BADGES.length,
    Dx = { hb: 4 + D.w * 3, pb: Math.floor(D.w / 2) + (bad >= 5 ? 1 : 0), lv: 14 + D.w * 3 + Math.min(10, bad * 2) };
  let made = 0;
  for (let i = 0; i < nb; i++) {
    const freeOnes = [];
    for (let y = 0; y < 6; y++) {
      [7, 6].forEach(x => S.tiles[K(x, y)] && !S.tiles[K(x, y)].rock && !unitAt(S, K(x, y)) && freeOnes.push([x, y]));
    }
    if (!freeOnes.length || !pool.length) {
      break;
    }
    const p = freeOnes[Math.floor(Math.random() * freeOnes.length)],
      m = pool[Math.floor(Math.random() * pool.length)];
    D.n++;
    S.units.push(mkUnit(m.id, 'e', p, 'd' + D.n, Dx));
    made++;
  }
  if (made) {
    pushMessage(
      ev,
      `Vague ${D.w} sur ${DEF_WAVES} : ${made} adversaire${made > 1 ? 's' : ''} arrive${made > 1 ? 'nt' : ''} !`
    );
    ev.push({ e: 'terrain' });
    try {
      plan(S, ev);
    } catch {
      /* Best effort: failure here is non-fatal. */
    }
  }
  return made > 0;
}

function defenseOpen() {
  const st = defenseState();
  // render: src/screens/overlays/transients/Windows.jsx (DefenseGym)
  const o = overlay('defense-gym-o', { d: SCEN.def468.d, best: st.best, won: st.won, ok: !!defenseUnlocked() });
  o.addEventListener('click', e => {
    if (e.target === o) {
      shut('defense-gym-o');
    }
  });
}

/** Defense Gym banner on Home (#defenseGym, render: src/screens/home/Banners.jsx). */
export function defenseBannerText() {
  return defenseUnlocked() ? `5 vagues · record ${defenseState().best}` : 'Débloquée avec 3 badges';
}

const defenseState = () => {
  try {
    return JSON.parse(localStorage.getItem('res-defense-gym') || 'null') || { won: 0, best: 0 };
  } catch (e) {
    return { won: 0, best: 0 };
  }
};

const defenseSave = s => {
  writeLS('res-defense-gym', s);
};

const defenseUnlocked = () => (isCamp() ? BADGES.length >= 3 : true);

const defensePool = () => POKEMON_LIST.filter(m => m.st === 1 && !m.leg && !m.isEnemy && m.base === m.id);

// Statements run at startup, in the original order (see index.js).
export function init() {
  SCEN.def468 = {
    n: 'Arène de défense',
    lvl: 'Défi · 5 vagues',
    lim: 16,
    time: 'jour',
    bio: 'gue',
    d: 'Cinq vagues d’adversaires déferlent par la droite. Un adversaire qui se trouve sur les lignes A ou B (votre camp) à la fin d’une manche fait une brèche : vous avez 3 vies. Tenez les cinq vagues pour gagner.',
    water: [],
    rock: ['3,0', '3,5'],
    hb: 4,
    pb: 0,
    lv: 14,
    foes: [
      ['racaillou', [6, 2]],
      ['nosferapti', [6, 4]],
    ],
    def468: true,
  };

  OBST.def468 = { pil: ['4,2'], grass: ['4,4', '5,1'] };

  ((DEF_WAVES = 5), (DEF_LIVES = 3));

  HOOKS.creation.push((S, opt, D0) => {
    if (!D0 || !D0.def468) {
      return;
    }
    S.def468 = { w: 1, lives: DEF_LIVES, n: 0 };
  });

  HOOKS.beforeRoundEnd.unshift((S, ev) => {
    const D = S.def468;
    if (!D || S.over) {
      return;
    }
    S.units
      .filter(u => u.side === 'e' && !u.ko && u.pos[0] <= 1)
      .forEach(u => {
        u.ko = true;
        u.hp = 0;
        D.lives--;
        pushMessage(
          ev,
          `Brèche ! ${u.n} a atteint la ligne de défense. Vies restantes : ${Math.max(0, D.lives)} / ${DEF_LIVES}.`
        );
      });
    if (D.lives <= 0) {
      S.over = 'lose';
      ev.push({ e: 'over' });
      return;
    }
    if (S.round % 2 === 0) {
      defenseWave(S, ev);
    }
  });

  // no opponent left standing: the next wave arrives before the battle is judged won
  HOOKS.beforeVerdict.push((S, ev) => {
    if (
      S.def468 &&
      !S.over &&
      !S.units.some(x => x.side === 'e' && !x.ko) &&
      S.def468.w < DEF_WAVES &&
      S.units.some(x => x.side === 'a' && !x.ko)
    ) {
      defenseWave(S, ev);
    }
  });

  HOOKS.progress.unshift((S, rew, win) => {
    try {
      const D = S.def468;
      if (!D) {
        return null;
      }
      const st = defenseState();
      st.best = Math.max(st.best, win ? DEF_WAVES : D.w - 1);
      if (win) {
        st.won++;
      }
      defenseSave(st);
      rew.defenseGym = { win, w: D.w, lives: D.lives };
      return win
        ? [600 + 300 * D.lives, D.lives >= 3 ? 4 : D.lives >= 2 ? 2 : 1]
        : D.w > 1
          ? [100 * (D.w - 1), 0]
          : null;
    } catch (e) {
      return null;
    }
  });

  HOOKS.battleResult.unshift(r => {
    const t = r.defenseGym;
    if (!t) {
      return '';
    }
    return `<div class="result-list"><h4>Arène de défense</h4><div class="result-row"><span>${t.win ? `<b>Défense tenue !</b> ${DEF_WAVES} vagues repoussées, ${t.lives} vie${t.lives > 1 ? 's' : ''} restante${t.lives > 1 ? 's' : ''}.` : `Vous avez tenu jusqu’à la vague ${t.w} sur ${DEF_WAVES}.`}</span></div></div>`;
  });

  // wave banner (#defenseGymHud): rendered by React (src/screens/combat/battle/Battle.jsx)

  document.addEventListener(
    'click',
    e => {
      const b = e.target.closest && e.target.closest('[data-defense-gym]');
      if (!b) {
        return;
      }
      e.stopPropagation();
      e.preventDefault();
      const v = b.dataset.defenseGym;
      if (v === 'open') {
        return defenseOpen();
      }
      shut('defense-gym-o');
      if (v === 'go') {
        if (!defenseUnlocked() || !squad.length) {
          return toast(squad.length ? 'Débloquée avec 3 badges.' : 'Composez d’abord une équipe.');
        }
        if (B) {
          backToPrep();
        }
        goFight('def468');
      }
    },
    true
  );
}
