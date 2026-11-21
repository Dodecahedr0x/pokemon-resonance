// Fog of war (setting, added in v4.31): you only see what your Pokémon see; +25% Pokédollars on victory.
import { bdClass, tokCl } from '../../screens/combat/board/boardStore.js';
import { SCENARIOS } from '../pokemon/pokemon.js';
import { $, toast } from '../core/utils.js';
import { HOOKS } from '../core/hooks.js';
import { parseCellKey, hdist, unitAt, unitKey } from './engine.js';
import { B, L, scSel, ui } from './ui.js';
import { PREFERENCES } from '../ui/preferences.js';
import { formatNumber } from '../state/economy.js';
import { hourOf, seesAtNight } from './living-board.js';

export function chosenFog() {
  const D = SCENARIOS[scSel] || {};
  return !!PREFERENCES.fogOfWar && !D.tuto && !D.hebdo429 && D.enigme431 == null && !D.rentalTeam;
}

export function fogVision(S) {
  const vu = new Set(),
    isNight = hourOf(S) === 'nuit';
  S.units
    .filter(a => a.side === 'a' && !a.ko)
    .forEach(a => {
      const r = Math.max(
        1,
        2 + (a.t.includes('Vol') || a.t.includes('Psy') ? 1 : 0) - (isNight && !seesAtNight(a) ? 1 : 0)
      );
      for (const k in S.tiles) {
        if (hdist(a.pos, parseCellKey(k)) <= r) {
          vu.add(k);
        }
      }
    });
  return vu;
}

export function fogHidden(S, e, vu) {
  if (!S.fogOfWar || e.side !== 'e' || e.ko) {
    return false;
  }
  const k = unitKey(e);
  if (!vu.has(k)) {
    return true;
  }
  // in tall grass: you have to be in contact
  return !!(S.tiles[k] && S.tiles[k].grass && !S.units.some(a => a.side === 'a' && !a.ko && hdist(a.pos, e.pos) <= 1));
}

function fogRender() {
  const on = !!(B && B.fogOfWar && !B.over),
    vu = on ? fogVision(B) : null;
  bdClass('fog-of-war', on); // class of #bBoard, rendered by React
  if (L.t) {
    for (const k in L.t) {
      L.t[k].classList.toggle('is-fogged', on && !vu.has(k));
    }
  }
  if (!B) {
    return;
  }
  // the veiled plates (#bPlE): rendered by React (Plates.jsx)
  B.units
    .filter(u => u.side === 'e')
    .forEach(u => {
      const c = on && fogHidden(B, u, vu),
        T = L.u && L.u[u.uid];
      if (T) {
        tokCl(T, 'is-fogged', c);
      } // token classes: Units.jsx
    });
}

/* ---------- after each battle render ---------- */
export function afterRenderFog() {
  if (!B) {
    return;
  }
  try {
    fogRender();
    // relic and fog badges, riddle button and phase: rendered by React (src/screens/combat/battle)
  } catch {
    /* Best effort: failure here is non-fatal. */
  }
}

// Statements run at startup, in the original order (see index.js).
export function init() {
  HOOKS.combat.push((S, opt) => {
    if (opt && opt.fogOfWar) {
      S.fogOfWar = 1;
    }
  });

  // a hidden tile: no information about the opponent standing there (you can still aim blindly)
  $('#bSvg').addEventListener(
    'click',
    e => {
      if (!B || !B.fogOfWar || B.over || B.deployPhase || ui.mode) {
        return;
      }
      const p = e.target.closest('[data-k]');
      if (!p) {
        return;
      }
      const u = unitAt(B, p.dataset.k);
      if (u && fogHidden(B, u, fogVision(B))) {
        e.stopPropagation();
        toast('Brouillard : rien en vue ici.');
      }
    },
    true
  );

  HOOKS.progress.push((S, rew, win) => {
    if (!S.fogOfWar) {
      return null;
    }
    rew.fogOfWar = 1;
    if (!win) {
      return null;
    }
    const m = Math.round(((rew.money || 0) * 0.25) / 10) * 10;
    rew.fogReward = m;
    return m ? [m, 0] : null;
  });

  HOOKS.battleResult.push(r =>
    r.fogOfWar
      ? `<div class="result-list"><h4>Brouillard de guerre</h4><div class="result-row"><span>${r.fogReward ? 'Victoire à l’aveugle' : 'Combat dans le brouillard'}</span><b>${r.fogReward ? '+' + formatNumber(r.fogReward) + ' ₽' : ''}</b></div></div>`
      : ''
  );
}
