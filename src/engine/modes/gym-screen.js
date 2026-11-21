import { BY, MON, PRESETS } from '../pokemon/pokemon.js';
import { BUDGET } from '../pokemon/evolution.js';
import { inBox } from '../state/game-state.js';
import { RC, synOf } from '../pokemon/roles-synergies.js';
import { hexCenter, toast } from '../core/utils.js';
import { tokCl } from '../../screens/combat/board/boardStore.js';
import { TEAM_MAX, __set_squad, renderSquad, save, squad, toggle } from '../team/team.js';
import { BH, BW, unitKey } from '../combat/engine.js';
import { B, BG, L, VERT } from '../combat/ui.js';
import { TUTORIAL_STEPS } from '../progression/tutorial.js';
import { renderPrep } from '../combat/battle-prep.js';

export let TEAM_BAK;
export function __set_TEAM_BAK(v) {
  return (TEAM_BAK = v);
}

export function fieldSvg() {
  const S = BG.S,
    w = Math.sqrt(3) * S,
    c0 = hexCenter(0, 0, S, BG.OX, BG.OY),
    c1 = hexCenter(BW - 1, 1, S, BG.OX, BG.OY),
    cl = hexCenter(0, BH - 1, S, BG.OX, BG.OY);
  const x0 = c0[0] - w / 2 + 1,
    x1 = c1[0] + w / 2 - 1,
    y0 = c0[1] - S + 2,
    y1 = cl[1] + S - 2,
    mx = (x0 + x1) / 2,
    my = (y0 + y1) / 2;
  const pl = pts =>
    pts
      .map(p =>
        MPT(p[0], p[1])
          .map(v => v.toFixed(1))
          .join(',')
      )
      .join(' ');
  const rect = (a, b, c, d) =>
    pl([
      [a, b],
      [c, b],
      [c, d],
      [a, d],
    ]);
  const z1 = hexCenter(1, 0, S, BG.OX, BG.OY)[0] + w * 0.75,
    z2 = hexCenter(BW - 2, 0, S, BG.OX, BG.OY)[0] - w * 0.25;
  const [cx, cy] = MPT(mx, my);
  return `<polygon class="fd-out" points="${rect(x0, y0, x1, y1)}"/><polygon class="fd-in" points="${rect(x0 + 5, y0 + 5, x1 - 5, y1 - 5)}"/>
  <polygon class="fd-zone al" points="${rect(x0 + 5, y0 + 5, z1, y1 - 5)}"/><polygon class="fd-zone en" points="${rect(z2, y0 + 5, x1 - 5, y1 - 5)}"/>
  <polyline class="fd-mid" points="${pl([
    [mx, y0 + 5],
    [mx, y1 - 5],
  ])}"/><circle class="fd-ring" cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="30"/><circle class="fd-ring2" cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="5"/>
  ${[
    [x0 + 5, y0 + 5],
    [x1 - 5, y0 + 5],
    [x1 - 5, y1 - 5],
    [x0 + 5, y1 - 5],
  ]
    .map(([a, b]) => {
      const [p, q] = MPT(a, b);
      return `<circle class="fd-pyl" cx="${p.toFixed(1)}" cy="${q.toFixed(1)}" r="3.2"/>`;
    })
    .join('')}`;
}

/** Pillars, tall grass, sand, covers and ricochets are drawn by the React layers
    (src/screens/combat/board/); what remains here is the Pokémon hidden in the tall grass (engine token). */
export function drawObstacles() {
  if (!L.units || !B) {
    return;
  }
  B.units.forEach(u => {
    const T = L.u[u.uid];
    if (T) {
      tokCl(T, 'is-in-grass', !u.ko && !!B.tiles[unitKey(u)].grass);
    }
  });
}

// battle synergies (#bSyn): rendered by React (src/screens/combat/battle/TopBar.jsx)

function randomTeam() {
  const pool = MON.filter(m => inBox(m.id) && RC(m.id) <= BUDGET);
  let best = null;
  for (let n = 0; n < 60; n++) {
    const sh = [...pool].sort(() => Math.random() - 0.5),
      t = [];
    let c = 0;
    for (const m of sh) {
      if (t.length >= TEAM_MAX) {
        break;
      }
      if (t.some(x => BY[x].base === m.base)) {
        continue;
      }
      const left = TEAM_MAX - t.length - 1;
      if (c + RC(m.id) + left > BUDGET) {
        continue;
      }
      t.push(m.id);
      c += RC(m.id);
    }
    if (!t.length) {
      continue;
    }
    const rs = new Set(t.map(id => BY[id].r)),
      sc = synOf(t).length * 3 + rs.size + (rs.has('Rempart') ? 2 : 0) + (rs.has('Frappeur') ? 1 : 0) + Math.random();
    if (!best || sc > best.sc) {
      best = { t, sc };
    }
  }
  return best ? best.t : [];
}

function teamAct(a) {
  if (a === 'reset') {
    if (!squad.length) {
      return;
    }
    TEAM_BAK = [...squad];
    __set_squad([]);
    save();
    renderSquad();
    toast('Équipe réinitialisée. « Rétablir » la remet en place.');
  } else if (a === 'undo' && TEAM_BAK) {
    __set_squad(TEAM_BAK.filter(id => inBox(id)));
    TEAM_BAK = null;
    save();
    renderSquad();
    toast('Équipe rétablie.');
  } else if (a === 'rand') {
    const t = randomTeam();
    if (!t.length) {
      toast('Aucun Pokémon disponible.');
      return;
    }
    if (squad.length) {
      TEAM_BAK = [...squad];
    }
    __set_squad(t);
    save();
    renderSquad();
    const s = synOf(t);
    toast(`Tirage : ${t.map(id => BY[id].n).join(', ')}${s.length ? ' · ' + s.map(x => x.n).join(', ') : ''}.`);
  }
  if (!B) {
    renderPrep();
  }
}

/* --- Pokédex: team synergies (src/screens/team/Analysis.jsx) and formations --- */

/* --- tactical codex: rendered by the React Guide (Tactics.jsx) --- */

function loadPreset(k) {
  const P = PRESETS[k];
  if (!P) {
    return;
  }
  const pr = [...P.ids],
    miss = pr.filter(id => !inBox(id));
  if (squad.length) {
    TEAM_BAK = [...squad];
  }
  __set_squad(pr.filter(id => inBox(id)));
  save();
  renderSquad();
  toast(
    miss.length
      ? `Équipe « ${P.n} » chargée sans ${miss.map(id => BY[id].n).join(', ')} : à capturer d’abord.`
      : `Équipe « ${P.n} » chargée.`
  );
}

/* ===================== v1.1: gym, obstacles, roles and synergies on screen ===================== */
/* --- board: gym lines and obstacles --- */
const MPT = (x, y) => (VERT ? [y, 430 - x] : [x, y]);

export const teamBtns = () =>
  `<div class="team-actions"><button type="button" class="button button-small" data-team="reset" ${squad.length ? '' : 'disabled'}>Réinitialiser l’équipe</button>${TEAM_BAK ? '<button type="button" class="button button-small" data-team="undo">Rétablir</button>' : ''}<button type="button" class="button button-small" data-team="rand">Tirage synergique</button></div>`;

/* --- Pokédex: box of confirmed recruits --- */
export const STARS = [
  'dracaufeu',
  'leviator',
  'alakazam',
  'tyranocif',
  'cizayox',
  'dracolosse',
  'ectoplasma',
  'florizarre',
];

// Statements run at startup, in the original order (see index.js).
export function init() {
  /* --- team: reset, restore, draw --- */
  TEAM_BAK = null;

  document.addEventListener('click', e => {
    const b = e.target.closest('[data-team]');
    if (b) {
      teamAct(b.dataset.team);
    }
  });

  /* --- tutorial: a step on obstacles --- */
  TUTORIAL_STEPS.splice(3, 0, {
    t: 'Lisez le terrain',
    d: 'Derrière un rocher, on prend 40 % de dégâts en moins à distance. Les piliers bloquent les tirs directs, les hautes herbes cachent au-delà de 2 cases. Touchez une case vide pour lire son terrain.',
    sel: '#bBoard',
    done: () => false,
  });

  document.addEventListener('click', e => {
    const f = e.target.closest('[data-pf]');
    if (f) {
      loadPreset(f.dataset.pf);
      return;
    }
    const s = e.target.closest('#dexCall [data-stg]');
    if (s) {
      toggle(s.dataset.stg);
    }
  });
}
