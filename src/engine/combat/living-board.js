import { getHost, hostSet } from '../../screens/combat/board/boardStore.js';

import { SCENARIOS } from '../pokemon/pokemon.js';
import { flies, markDuration, neighborKeys, pushMessage, unitAt } from './engine.js';
import { selectedScenario } from './ui.js';
import { PREFERENCES } from '../ui/preferences.js';
import { DAMAGE_PROVIDERS } from './tactical-engine.js';
import { noWind } from './tactics.js';

/** The player's setting. The guided prologue battle always stays classic. */
export function chosenAlive() {
  return PREFERENCES.livingBoard !== false && !(SCENARIOS[selectedScenario] && SCENARIOS[selectedScenario].tuto);
}

/** At the start of a battle: the scenario's time becomes the first time of the cycle. */
export function aliveInit(S, opt) {
  if (!opt || !opt.livingBoard) {
    return;
  }
  S.livingBoard = true;
  S.cycle = { ph: S.time === 'nuit' ? 'nuit' : 'jour', n: 0 };
  // wind (v4.8): two battles out of three, in one of the 6 directions
  S.vent = Math.random() < 0.67 ? { d: Math.floor(Math.random() * 6) } : null;
}

/** "day" or "night": what the game sees for Eevee. Without the living board, the scenario's time. */
export function hourOf(S) {
  return S.cycle ? (S.cycle.ph === 'nuit' ? 'nuit' : 'jour') : S.time === 'nuit' ? 'nuit' : 'jour';
}

/** Range reduced at night (called by effR). */
export function nightRange(S, u, m) {
  return S && S.cycle && S.cycle.ph === 'nuit' && m.r >= 3 && !seesAtNight(u) ? 1 : 0;
}

/** Would a tall grass catch fire at the next end of round? (also used to warn on screen) */
export function fireHazard(S, k) {
  const t = S.tiles[k];
  if (!S.livingBoard || !t || !t.grass || t.rock || t.w) {
    return false;
  }
  if (S.wx && S.wx.k === 'pluie') {
    return false;
  }
  if (t.mark && t.mark.k === 'trempe') {
    return false;
  } // soaked grass
  return neighborKeys(k).some(n => onFire(S, n));
}

/** A tall grass that can burn (without looking at its neighbors). */
function dryGrass(S, k) {
  const t = S.tiles[k];
  return !!(S.livingBoard && t && t.grass && !t.rock && !t.w && !(t.mark && t.mark.k === 'trempe'));
}

export function aliveRound(S, ev) {
  if (!S.livingBoard) {
    return;
  }
  const W = S.wx && S.wx.k;
  let rebuild = false;
  // rain puts it out, hail freezes
  if (W === 'pluie') {
    let n = 0;
    for (const k in S.tiles) {
      if (onFire(S, k)) {
        S.tiles[k].mark = null;
        n++;
      }
    }
    if (n) {
      pushMessage(ev, `La pluie éteint les flammes (${n} case${n > 1 ? 's' : ''}).`);
      rebuild = true;
    }
  }
  if (W === 'grele') {
    let n = 0;
    for (const k in S.tiles) {
      const t = S.tiles[k];
      if (t.mark && t.mark.k === 'trempe') {
        t.mark = { k: 'givre', d: markDuration(S, 'givre'), lv: t.mark.lv, by: t.mark.by };
        n++;
      }
    }
    if (n) {
      pushMessage(ev, `La grêle gèle les flaques (${n} case${n > 1 ? 's' : ''}).`);
      rebuild = true;
    }
  }
  // fire spreads through tall grass: take a snapshot first, then apply
  const hasWon = [];
  for (const k in S.tiles) {
    if (fireHazard(S, k)) {
      hasWon.push([k, neighborKeys(k).find(n => onFire(S, n))]);
    }
  }
  // downwind (v4.8), the fire jumps one more cell in the tall grass
  if (S.vent && W !== 'pluie') {
    for (const b in S.tiles) {
      if (!onFire(S, b)) {
        continue;
      }
      const n1 = noWind(b, S.vent.d),
        n2 = n1 && noWind(n1, S.vent.d);
      if (
        n1 &&
        n2 &&
        fireHazard(S, n1) &&
        fireHazard(S, n2) === false &&
        dryGrass(S, n2) &&
        !hasWon.some(g => g[0] === n2)
      ) {
        hasWon.push([n2, n1]);
      }
    }
  }
  if (hasWon.length) {
    const edges = [];
    hasWon.forEach(([k, de]) => {
      const t = S.tiles[k];
      t.grass = false;
      t.mark = { k: 'brulant', d: markDuration(S, 'brulant'), lv: 1, by: S.tiles[de].mark.by };
      edges.push([de, k, 1]);
    });
    ev.push({ e: 'chain', edges, c: 'fire' });
    pushMessage(ev, `Le feu court dans les hautes herbes (${hasWon.length} case${hasWon.length > 1 ? 's' : ''}).`);
    S.stats.feu = (S.stats.feu || 0) + hasWon.length; // Pyromane (Pyromaniac) achievement (v4.9)
    hasWon.forEach(([k]) => {
      const w = unitAt(S, k);
      if (!w || flies(w) || w.t.includes('Feu') || w.ability === 'torche') {
        return;
      }
      w.burn = Math.max(w.burn, 2);
      pushMessage(ev, `${w.n} est pris dans l’incendie !`);
    });
    rebuild = true;
  }
  // the wind pushes the fog one cell (computed from the round's snapshot)
  if (S.vent) {
    const nf = {};
    let n = 0;
    for (const k in S.tiles) {
      const f = S.tiles[k].fog;
      if (!(f > 0)) {
        continue;
      }
      n++;
      const d = noWind(k, S.vent.d);
      if (d && !S.tiles[d].rock) {
        nf[d] = Math.max(nf[d] || 0, f);
      }
    }
    if (n) {
      for (const k in S.tiles) {
        S.tiles[k].fog = nf[k] || 0;
      }
      pushMessage(ev, 'Le vent pousse le brouillard.');
      rebuild = true;
    }
  }
  if (rebuild) {
    ev.push({ e: 'terrain' });
  }
  // time advances
  if (!S.cycle.frozen) {
    S.cycle.n++;
  } // Eternal Night: time does not pass (v4.9)
  if (S.cycle.n >= LIVING_STEP) {
    S.cycle = { ph: LIVING_ORDER[(LIVING_ORDER.indexOf(S.cycle.ph) + 1) % LIVING_ORDER.length], n: 0 };
    pushMessage(ev, LIVING_ANNOUNCE[S.cycle.ph]);
    ev.push({ e: 'heure', ph: S.cycle.ph });
    if (S.vent) {
      S.vent.d = (S.vent.d + 1) % 6; // the wind turns with the time
      pushMessage(ev, 'Le vent tourne.');
    }
  }
}

/** The time-of-day chip, next to the weather one. */
export function chipTime(S) {
  if (!S || !S.cycle) {
    return '';
  }
  if (S.cycle.frozen) {
    return `<span class="chip chip-heure" title="${LIVING_DESC.nuit}"><i style="background:${LIVING_COLOR.nuit}"></i>Nuit éternelle</span>`;
  }
  const p = S.cycle.ph,
    remainder = LIVING_STEP - S.cycle.n,
    following = LIVING_ORDER[(LIVING_ORDER.indexOf(p) + 1) % LIVING_ORDER.length];
  return `<span class="chip chip-heure" title="${LIVING_DESC[p]}"><i style="background:${LIVING_COLOR[p]}"></i>${LIVING_NAME[p]} · ${LIVING_NAME[following].toLowerCase()} ${remainder > 1 ? 'dans ' + remainder + ' manches' : 'après cette manche'}</span>`;
}

/** Board tint according to the time (the attribute survives the board being rebuilt). */
export function hourTint(S) {
  // data-ph of #bBoard: rendered by React (Board.jsx)
  const ph = S && S.cycle ? S.cycle.ph : undefined;
  if (getHost().ph !== ph) {
    hostSet({ ph });
  }
}

/* =====================================================================
   v4.7: Living Board
   ---------------------------------------------------------------------
   The game already had its reactions (Short Circuit, Blaze, Steam…)
   and each scenario was marked "day" or "night" without that changing
   anything in battle. This version brings the board to life.

   1. The passing of time (day, dusk, night, dawn)
      The battle starts at the scenario's time; every 4 rounds, the
      time advances one step. Effects:
        - Day       : Grass and Flying ×1.2
        - Dawn      : Grass and Flying ×1.1
        - Dusk      : Ghost and Dark ×1.1
        - Night     : Ghost and Dark ×1.2; attacks with a range of 3 cells
                      or more lose 1 range, except for Ghost, Dark,
                      Regard Vif (Keen Eye) and Écholocation (Echolocation).
      The multipliers go through the tactical engine's pipeline
      ("time" provider), like the weather.
   2. Fire spreads through tall grass
      At each end of round, tall grass next to a Burning cell
      catches fire (one cell per round, computed from the round's
      snapshot: fire does not cross the whole board at once). A land
      Pokémon caught in the flames is Burned. Soaked grass does not
      burn, and a mown cell (Cut) stops the fire: a firebreak.
   3. Weather acts on the board
      Rain: puts out Burning cells and stops fire from spreading.
      Hail: freezes Soaked cells (they become Frosted).
      (Sun already dried Soaked cells and prolongs flames.)

   All of this is a single setting, "Plateau vivant" (Living Board; Settings,
   enabled by default). Without it (or for engine tests), the battle is as before.
   ===================================================================== */

const LIVING_STEP = 4;

// rounds per time of day
const LIVING_ORDER = ['jour', 'crepuscule', 'nuit', 'aube'];

export const LIVING_NAME = { aube: 'Aube', jour: 'Jour', crepuscule: 'Crépuscule', nuit: 'Nuit' };

const LIVING_COLOR = { aube: '#f0a6a0', jour: '#f2c94c', crepuscule: '#e8774a', nuit: '#6b7bd6' };

export const LIVING_DESC = {
  jour: 'Plante et Vol ×1,2.',
  aube: 'Plante et Vol ×1,1.',
  crepuscule: 'Spectre et Ténèbres ×1,1.',
  nuit: 'Spectre et Ténèbres ×1,2. Les attaques de 3 cases ou plus perdent 1 de portée (sauf Spectre, Ténèbres, Regard Vif, Écholocation).',
};

export const LIVING_STATE = {
  jour: 'Il fait jour',
  aube: 'C’est l’aube',
  crepuscule: 'Le crépuscule tombe',
  nuit: 'Il fait nuit',
};

const LIVING_ANNOUNCE = {
  crepuscule: 'Le crépuscule tombe : les Spectres et les Ténèbres se renforcent (×1,1).',
  nuit: 'La nuit tombe : Spectre et Ténèbres ×1,2. Les attaques de 3 cases ou plus perdent 1 de portée.',
  aube: 'L’aube se lève : les Plantes et les Vols se réveillent (×1,1).',
  jour: 'Le jour se lève : Plante et Vol ×1,2.',
};

/** Can one see well in the dark? */
export const seesAtNight = u =>
  u.t.includes('Spectre') || u.t.includes('Ténèbres') || u.ability === 'regardvif' || u.ability === 'echolocation';

/* ---------- 2. End of round: time, weather and fire ---------- */
const onFire = (S, k) => !!(S.tiles[k] && S.tiles[k].mark && S.tiles[k].mark.k === 'brulant');

// Statements run at startup, in the original order (see index.js).
export function init() {
  /* ---------- 1. The time, a damage modifier provider ---------- */
  DAMAGE_PROVIDERS.push({
    id: 'heure',
    provide: (c, { S, typ }) => {
      const ph = S.cycle && S.cycle.ph;
      if (!ph) {
        return null;
      }
      const nocturnal = typ === 'Spectre' || typ === 'Ténèbres',
        diurnal = typ === 'Plante' || typ === 'Vol';
      if (nocturnal && ph === 'nuit') {
        return { mul: 1.2, labelText: 'Nuit' };
      }
      if (nocturnal && ph === 'crepuscule') {
        return { mul: 1.1, labelText: 'Crépuscule' };
      }
      if (diurnal && ph === 'jour') {
        return { mul: 1.2, labelText: 'Jour' };
      }
      if (diurnal && ph === 'aube') {
        return { mul: 1.1, labelText: 'Aube' };
      }
      return null;
    },
  });

  /* ---------- 3. On screen ---------- */
  // the board's sky (.board-sky-tint) is rendered by <Board> (src/screens/combat/board/)
}
