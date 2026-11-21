import { MOVES } from '../data/moves.js';
import { POKEMON, SCENARIOS } from '../pokemon/pokemon.js';
import { PROFILE } from '../state/game-state.js';
import { medal } from '../core/utils.js';
import { HOOKS } from '../core/hooks.js';
import {
  CUBE_DIRECTIONS,
  cellKey,
  parseCellKey,
  affected,
  byUid,
  damage,
  flies,
  fromCube,
  hexDistance,
  inBoard,
  landed,
  makeUnit,
  neighborKeys,
  pushMessage,
  stun,
  targets,
  typeEffectiveness,
  toCube,
  unitAt,
  unitKey,
} from './engine.js';
import { OBSTACLES, resolve, roleOf } from './synergies-obstacles.js';
import { cellCenter, cellPolygon, selectedScenario } from './ui.js';
import { PREFERENCES } from '../ui/preferences.js';
import { SHOP } from '../state/economy.js';
import { DAMAGE_PROVIDERS, ROLE_PROVIDERS } from './tactical-engine.js';
import { MACHINES } from '../moves/tms.js';
import { hasRune } from '../moves/technical-roster.js';
import { dangerZoneSvg } from './intensity.js';
import { duelCanCharge } from '../modes/duel.js';

/* =====================================================================
   v4.8: tactics
   ---------------------------------------------------------------------
   1. Traps placed on cells: Picots (Spikes), Piège de Roc (Stealth Rock),
      Toile Gluante (Sticky Web). A trap only affects the opposing side.
      It triggers when an opponent stops on it (movement, push, Force,
      Tornade); it cannot be crossed without stopping on it (except by
      flyers). It lasts 6 rounds. The AI avoids traps and knows how to
      lay them.
   2. Charged attacks ("Tactique avancée", Advanced Tactics): Lance-Soleil
      and Vol (HM02) fire at the end of the round, after the opponents.
        - Lance-Soleil ×1.3, instant under Sun; interrupted if the user
          is K.O.'d, asleep, frozen or paralyzed in the meantime.
        - Vol: the Pokémon is in the air during the opponent's turn
          (attacks pass under it), then dives onto its target.
   3. Control zones ("Tactique avancée"): moving into contact with an
      opponent stops movement. Exempt: flyers, Ghost, Scouts. Leaving
      contact stays free.
   4. Wind (with the "Plateau vivant", Living Board): see v4.7-01. Fog
      drifts, fire spreads 2 cells downwind, Flying attacks deal ×1.2
      with the wind and ×0.85 against it.
   5. Colossi: giant Onix, Steelix and Gyarados, spanning 3 or 4 cells.
      Immobile, but their attacks reach 2 cells further.
      The body and tail are full cells: they block, can be targeted, and
      sweep the neighboring cells. Each intact part gives the colossus
      −3 damage (Carapace); breaking a part hurts it and makes it
      stagger (its announced attack is cancelled).
   ===================================================================== */

/** "Tactique avancée" setting (Settings). The guided prologue battle stays classic. */
export function chosenTactic() {
  return PREFERENCES.tactics !== false && !(SCENARIOS[selectedScenario] && SCENARIOS[selectedScenario].tuto);
}

/** Profile: defeated colossi. Declared functions: called as soon as the game loads. */
export function defaultColossiProfile() {
  return { colossi: [] };
}

export function tacClean(p) {
  const o = defaultColossiProfile();
  if (p && Array.isArray(p.colossi)) {
    o.colossi = [...new Set(p.colossi.filter(k => /^co\d$/.test(k)))];
  }
  return o;
}

export function placeTrap(S, u, m, k, ev) {
  const t = S.tiles[k];
  if (!t || t.rock || t.w || unitAt(S, k)) {
    pushMessage(ev, 'Le piège ne tient pas ici.');
    return;
  }
  t.trap = { k: m.piege, side: u.side, by: u.uid, d: TRAP_DURATION };
  pushMessage(ev, `${u.n} pose ${TRAPS[m.piege].n}.`);
  ev.push({ e: 'terrain', k });
}

/** A Pokémon stops on a cell: enemy trap? */
export function trapArrival(S, v, ev) {
  if (!v || v.ko || v.seg) {
    return;
  }
  const k = unitKey(v),
    t = S.tiles[k],
    p = t && t.trap;
  if (!p || p.side === v.side) {
    return;
  }
  const n = TRAPS[p.k].n;
  if (p.k === 'roc') {
    pushMessage(ev, `${n} : des pierres s’abattent sur ${v.n}.`);
    damage(S, v, Math.max(1, Math.round(4 * typeEffectiveness('Roche', v.t))), ev, { ind: true });
  } else if (flies(v)) {
    pushMessage(ev, `${v.n} survole ${n}.`);
    return; // the trap stays
  } else if (p.k === 'picots') {
    pushMessage(ev, `${n} : ${v.n} marche sur les pointes.`);
    damage(S, v, 5, ev, { ind: true });
  } else if (v.ability === 'regardvif' || hasRune(S, v)) {
    pushMessage(ev, `${v.n} ignore la toile.`);
  } else {
    v.web = Math.max(v.web, 2);
    pushMessage(ev, `${n} : ${v.n} est englué.`);
  }
  if (p.side === 'a') {
    S.stats.pieges = (S.stats.pieges || 0) + 1;
  } // achievement (v4.9)
  t.trap = null;
  ev.push({ e: 'terrain', k });
}

/** The AI: lay a trap when it has nothing better, or right at the start of the battle. */
export function trapPlan(S, e, best, al) {
  const id = e.mv.find(x => MOVES[x] && MOVES[x].fx === 'piege');
  if (!id || e.seg || (best && !(S.round <= 2 && best.sc < 12))) {
    return null;
  }
  const m = MOVES[id];
  let bk = null,
    bs = -1e9;
  targets(S, e, m).forEach(k => {
    const d = Math.min(...al.map(a => hexDistance(a.pos, parseCellKey(k))));
    if (d < 1) {
      return;
    }
    const s = -d * 3 - hexDistance(e.pos, parseCellKey(k)) * 0.5;
    if (s > bs) {
      bs = s;
      bk = k;
    }
  });
  return bk ? { mv: id, k: bk } : null;
}

/* ---------- 2. Charged attacks ---------- */
export function deferredCharge(S, u, m) {
  if (!S.tac || u.side !== 'a' || !m.charge) {
    return false;
  }
  return !(m.charge === 'soleil' && S.wx && S.wx.k === 'soleil');
}

export function launchCharge(S, u, mi, k) {
  const m = MOVES[u.mv[mi]],
    ev = [];
  u.chg = { mv: u.mv[mi], k };
  if (m.charge === 'vol') {
    u.vole = 1;
    pushMessage(ev, `${u.n} s’envole ! Il fondra sur sa cible en fin de manche, après les adversaires.`);
  } else {
    pushMessage(
      ev,
      `${u.n} concentre son énergie : ${m.n} partira en fin de manche (×1,3), s’il n’est pas interrompu.`
    );
  }
  ev.push({ e: 'chg', u: u.uid });
  return ev;
}

/** A target in the air: enemy attacks pass under it. */
export function outOfReach(S, v, u, ev) {
  if (v && v.vole && v.side !== u.side) {
    if (ev) {
      pushMessage(ev, `${v.n} est dans les airs : l’attaque passe sous lui.`);
    }
    return null;
  }
  return v;
}

export function unloadCharges(S, ev) {
  S.units
    .filter(u => u.chg && duelCanCharge(S, u)) // duel: after the opponent's turn (v4.33)
    .forEach(u => {
      const c = u.chg,
        m = MOVES[c.mv],
        flying = u.vole;
      u.chg = null;
      u.vole = 0;
      if (u.ko || S.over) {
        return;
      }
      if (['SOM', 'GEL', 'PAR'].includes(u.badge) || u.skip > 0) {
        pushMessage(ev, `${u.n} est interrompu : ${m.n} échoue.`);
        return;
      }
      if (flying) {
        // it dives onto its target and lands on a free neighboring cell, the closest to where it started
        const freeOnes = neighborKeys(c.k)
          .filter(x => S.tiles[x] && !S.tiles[x].rock && (!unitAt(S, x) || unitAt(S, x) === u))
          .sort((a, b) => hexDistance(parseCellKey(a), u.pos) - hexDistance(parseCellKey(b), u.pos));
        if (freeOnes.length && freeOnes[0] !== unitKey(u)) {
          u.pos = parseCellKey(freeOnes[0]);
          ev.push({ e: 'mv', u: u.uid });
        }
        pushMessage(ev, `${u.n} fond sur sa cible !`);
        resolve(S, u, m, c.k).forEach(x => ev.push(x));
        S.stats.vols = (S.stats.vols || 0) + 1; // achievement (v4.9)
        landed(S, u, ev);
      } else {
        resolve(S, u, Object.assign({}, m, { p: Math.round(m.p * 1.3) }), c.k).forEach(x => ev.push(x));
      }
    });
}

/* ---------- 3. Control zones and forced stops (called by reach) ---------- */
function controlZone(S, u, k) {
  if (!S.tac || flies(u) || u.t.includes('Spectre') || roleOf(u) === 'Éclaireur' || u.colossus || u.seg) {
    return false;
  }
  const p = parseCellKey(k);
  return S.units.some(o => !o.ko && o.side !== u.side && hexDistance(o.pos, p) === 1);
}

/** Movement stops on this cell (you can go there, but not through it). */
export function forceStop(S, u, k) {
  return (hostileTrap(S, u, k) && !flies(u)) || controlZone(S, u, k);
}

/* ---------- 4. Wind: tools (its effect on the board is in v4.7-01) ---------- */
/** The neighboring cell in a direction (0 to 5), or null at the edge. */
export function noWind(k, d) {
  const p = parseCellKey(k),
    c = toCube(p[0], p[1]),
    D = CUBE_DIRECTIONS[d],
    q = fromCube(c[0] + D[0], c[1] + D[1], c[2] + D[2]);
  return inBoard(q[0], q[1]) ? cellKey(q[0], q[1]) : null;
}

/** The direction (0 to 5) that gets closest from a to b. */
function dirToward(a, b) {
  const A = toCube(a[0], a[1]),
    B2 = toCube(b[0], b[1]),
    v = [B2[0] - A[0], B2[1] - A[1], B2[2] - A[2]];
  if (!v[0] && !v[1] && !v[2]) {
    return -1;
  }
  let best = -1,
    bs = -1e9;
  CUBE_DIRECTIONS.forEach((d, i) => {
    const s = d[0] * v[0] + d[1] * v[1] + d[2] * v[2];
    if (s > bs) {
      bs = s;
      best = i;
    }
  });
  return best;
}

export function chipWind(S) {
  if (!S || !S.livingBoard) {
    return '';
  }
  if (!S.vent) {
    return '<span class="chip chip-vent" title="Pas de vent.">Vent calme</span>';
  }
  const a = cellCenter('3,2'),
    b = cellCenter(noWind('3,2', S.vent.d) || '3,2'),
    ang = Math.round((Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI);
  return `<span class="chip chip-vent" title="Attaques Vol ×1,2 dans le sens du vent, ×0,85 contre. Le brouillard dérive ; le feu court 2 cases sous le vent."><svg class="vent-fl" viewBox="0 0 16 16" aria-hidden="true" style="transform:rotate(${ang}deg)"><path d="M2 8h11M9 4l4 4-4 4"/></svg>Vent</span>`;
}

/** Sets up the colossus and its parts next to it (toward the back of the board). */
function makeColossus(S, u, x, D) {
  u.colossus = true;
  u.boss = true;
  let cur = unitKey(u);
  x.parts.forEach((displayName, i) => {
    const k = neighborKeys(cur)
      .filter(n => S.tiles[n] && !S.tiles[n].rock && !unitAt(S, n))
      .sort(
        (a, b) =>
          parseCellKey(b)[0] - parseCellKey(a)[0] ||
          Math.abs(parseCellKey(a)[1] - u.pos[1]) - Math.abs(parseCellKey(b)[1] - u.pos[1])
      )[0];
    if (!k) {
      return;
    }
    const s = makeUnit(
      u.id,
      'e',
      parseCellKey(k),
      u.uid + 's' + i,
      Object.assign({}, D, { hb: x.shb, pb: Math.max(0, (x.pb || 0) - 2) })
    );
    Object.assign(s, {
      seg: true,
      of: u.uid,
      n: `${displayName} ${withDe(u.n)}`,
      mv: ['coupdequeue'],
      ability: null,
      sturdy: false,
    });
    S.units.push(s);
    cur = k;
  });
}

/** A part is broken, or the colossus is down (called by damage). */
export function colossusKO(S, v, ev) {
  if (v.seg) {
    S.stats.ko--;
    const b = byUid(S, v.of);
    if (!b || b.ko) {
      return;
    }
    pushMessage(ev, `${v.n} est brisé ! ${b.n} vacille.`);
    S.stats.parts = (S.stats.parts || 0) + 1; // achievement (v4.9)
    damage(S, b, Math.round(b.mhp * 0.12), ev, { ind: true });
    if (!b.ko) {
      stun(S, b, 'PAR', ev, true);
    }
  } else if (v.colossus) {
    S.units.forEach(s => {
      if (s.seg && s.of === v.uid && !s.ko) {
        s.hp = 0;
        s.ko = true;
        s.intent = null;
        ev.push({ e: 'ko', u: s.uid });
      }
    });
  }
}

/* ---------- on screen ---------- */
/** Traps, charges and colossus links, drawn with the markers. */
export function tacticalDrawing(S, k, x, y) {
  const t = S.tiles[k];
  let h = '';
  if (t.trap) {
    const c = t.trap.side === 'a' ? '#ffd75e' : '#ef6f6c',
      X = x.toFixed(1),
      Y = (y + 10).toFixed(1);
    if (t.trap.k === 'picots') {
      h += `<g class="trap" transform="translate(${X},${Y})" style="--c:${c}"><path d="M-9 4l3-8 3 8M-3 4l3-8 3 8M3 4l3-8 3 8"/></g>`;
    } else if (t.trap.k === 'roc') {
      h += `<g class="trap" transform="translate(${X},${Y})" style="--c:${c}"><path d="M-9 4l2-6h5l2 6ZM1 4l2-8h5l2 8Z"/></g>`;
    } else {
      h += `<g class="trap web" transform="translate(${X},${Y})" style="--c:${c}"><path d="M-10 0h20M0-8v16M-7-6l14 12M7-6l-14 12"/><circle r="4"/><circle r="7.5"/></g>`;
    }
  }
  h += dangerZoneSvg(S, k, x, y); // announced dangers (v4.20)
  return h;
}

export function linksColossi(S) {
  let h = '';
  S.units.forEach(s => {
    if (!s.seg || s.ko) {
      return;
    }
    const i = +s.uid.split('s').pop(),
      prev = i > 0 ? byUid(S, s.of + 's' + (i - 1)) : byUid(S, s.of),
      a = prev && !prev.ko ? cellCenter(unitKey(prev)) : null,
      b = cellCenter(unitKey(s));
    if (a) {
      h += `<line class="col-lien" x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}"/>`;
    }
  });
  return h;
}

/** The cells targeted by an ally's charged attack. */
export function chargesOnBoard(S) {
  let h = '';
  S.units.forEach(u => {
    if (!u.chg || u.ko) {
      return;
    }
    const m = MOVES[u.chg.mv];
    (u.vole ? [u.chg.k] : affected(S, u, m, u.chg.k)).forEach(k => {
      h += cellPolygon(k, 'highlight-charge');
    });
  });
  return h;
}

export function trapTip(p) {
  return `${TRAPS[p.k].n} (${p.side === 'a' ? 'à vous' : 'adverse'}) : ${TRAPS[p.k].d}, encore ${p.d} manche${p.d > 1 ? 's' : ''}. On ne le traverse pas sans s’y arrêter`;
}

/* ---------- 1. Traps ---------- */
const TRAPS = {
  picots: { n: 'Picots', d: '5 dégâts au premier adversaire qui s’y arrête, sauf volants' },
  roc: { n: 'Piège de Roc', d: 'dégâts selon la faiblesse à la Roche, volants compris' },
  toile: { n: 'Toile Gluante', d: 'englue le premier adversaire qui s’y arrête (−3 Mouvement), sauf volants' },
};

const TRAP_DURATION = 6;

export const hostileTrap = (S, u, k) => {
  const t = S.tiles[k];
  return !!(t && t.trap && t.trap.side !== u.side);
};

/* ---------- 5. Colossi ---------- */
export const withDe = n => (/^[AEIOUYÉÈÊ]/i.test(n) ? 'd’' : 'de ') + n;

const colossusOf = k => COLOSSI.find(C => C.k === k) || null;

const intactGames = (S, b) => S.units.filter(s => s.seg && s.of === b.uid && !s.ko).length;

export const COLOSSI = [
  {
    k: 'co1',
    id: 'onix',
    n: 'Onix géant',
    title: 'le Serpent de roc',
    badges: 2,
    lv: 18,
    lim: 11,
    time: 'jour',
    bio: 'roche',
    at: 'Roche',
    hb: 140,
    pb: 6,
    shb: 30,
    mv: ['eboulement', 'jetpierres'],
    parts: ['Corps', 'Queue'],
    water: [],
    rock: ['3,0', '3,5'],
    escort: [
      ['racaillou', [6, 0], { mv: ['piegederoc', 'jetpierres'] }],
      ['racaillou', [6, 5], { mv: ['picots', 'jetpierres'] }],
    ],
    rew: [800, 8],
    d: 'Un Onix trois fois plus grand que les autres barre le col. Son corps et sa queue occupent leurs propres cases : brisez-les pour faire tomber sa carapace. Ses Racaillou posent des pièges.',
  },
  {
    k: 'co2',
    id: 'steelix',
    n: 'Steelix colossal',
    title: 'l’Anneau d’acier',
    badges: 5,
    lv: 32,
    lim: 12,
    time: 'nuit',
    bio: 'ligue',
    at: 'Acier',
    hb: 185,
    pb: 8,
    shb: 36,
    mv: ['eboulement', 'seisme'],
    parts: ['Anneaux', 'Corps', 'Queue'],
    water: [],
    rock: ['2,2'],
    escort: [
      ['grolem', [7, 0], { mv: ['piegederoc', 'eboulement'] }],
      ['magneton', [7, 5]],
    ],
    rew: [1400, 12],
    d: 'Steelix s’est enroulé sur quatre cases. Chaque anneau intact le protège ; chaque anneau brisé le fait vaciller. Restez loin de sa queue : elle balaie tout autour.',
  },
  {
    k: 'co3',
    id: 'leviator',
    n: 'Léviator des abysses',
    title: 'la Colère des flots',
    badges: 7,
    lv: 42,
    lim: 12,
    time: 'nuit',
    bio: 'gue',
    at: 'Eau',
    hb: 180,
    pb: 8,
    shb: 36,
    mv: ['hydrocanon', 'ouragan'],
    parts: ['Corps', 'Nageoires', 'Queue'],
    water: ['5,1', '5,2', '5,3', '6,1', '6,4'],
    rock: [],
    escort: [
      ['crustabri', [7, 0], { mv: ['picots', 'blizzard'] }],
      ['lokhlass', [7, 5]],
    ],
    rew: [2000, 16],
    d: 'Léviator surgit du lac, le corps déroulé sur quatre cases. Ses nageoires et sa queue frappent tout ce qui s’approche ; Crustabri sème des Picots sur la rive.',
  },
].filter(C => POKEMON[C.id] && C.escort.every(([e]) => POKEMON[e]));

const TACTICAL_MOVES = {
  picots: {
    n: 'Picots',
    t: 'Sol',
    p: 0,
    r: 3,
    sh: 'one',
    fx: 'piege',
    piege: 'picots',
    d: 'Pose des Picots sur une case libre à 3 cases : 5 dégâts au premier adversaire qui s’y arrête (sauf volants).',
  },
  piegederoc: {
    n: 'Piège de Roc',
    t: 'Roche',
    p: 0,
    r: 3,
    sh: 'one',
    fx: 'piege',
    piege: 'roc',
    d: 'Pose un Piège de Roc sur une case libre à 3 cases : dégâts selon la faiblesse à la Roche, volants compris.',
  },
  toilegluante: {
    n: 'Toile Gluante',
    t: 'Insecte',
    p: 0,
    r: 3,
    sh: 'one',
    fx: 'piege',
    piege: 'toile',
    d: 'Tend une Toile Gluante sur une case libre à 3 cases : le premier adversaire qui s’y arrête est englué (−3 Mouvement).',
  },
  volcs: {
    n: 'Vol',
    t: 'Vol',
    p: 12,
    r: 4,
    sh: 'one',
    charge: 'vol',
    d: 'Portée 4. Tactique avancée : s’envole (intouchable pendant le tour adverse), puis fond sur sa cible en fin de manche.',
  },
  coupdequeue: { n: 'Coup de Queue', t: 'Normal', p: 7, r: 0, sh: 'ring', d: 'Balaie les 6 cases autour.' },
};

// Statements run at startup, in the original order (see index.js).
export function init() {
  /* ---------- moves ---------- */
  Object.assign(MOVES, TACTICAL_MOVES);
  MOVES.lancesoleil.charge = 'soleil';
  MOVES.lancesoleil.d =
    'Ligne de 3. ×1,5 sous le Soleil. Tactique avancée : part en fin de manche (×1,3), tout de suite sous le Soleil.';
  HOOKS.beforeRoundEnd.push((S, ev) => {
    unloadCharges(S, ev);
    // trap wear
    for (const k in S.tiles) {
      const t = S.tiles[k];
      if (t.trap && --t.trap.d <= 0) {
        t.trap = null;
        ev.push({ e: 'terrain', k });
      }
    }
  });
  DAMAGE_PROVIDERS.push({
    id: 'vent',
    provide: (c, { S, u, t, typ }) => {
      if (!S.vent || typ !== 'Vol' || !u.pos || !t.pos) {
        return null;
      }
      const d = dirToward(u.pos, t.pos);
      if (d === S.vent.d) {
        return { mul: 1.2, labelText: 'Vent arrière' };
      }
      if (d === (S.vent.d + 3) % 6) {
        return { mul: 0.85, labelText: 'Vent de face' };
      }
      return null;
    },
  });
  COLOSSI.forEach(C => {
    C.escort.forEach(([, , x]) => x && x.mv && (x.mv = x.mv.filter(m => MOVES[m]))); // missing moves: ignored
    SCENARIOS[C.k] = {
      n: C.n,
      lvl: `Colosse · ${C.title}`,
      lim: C.lim,
      time: C.time,
      bio: C.bio,
      colossus: C.id,
      badges: C.badges,
      style: 'boss',
      at: C.at,
      water: C.water,
      rock: C.rock,
      hb: Math.round(C.hb / 4), // the escort
      pb: Math.max(0, C.pb - 2),
      lv: C.lv,
      d: C.d,
      foes: [
        [C.id, [5, 2], { boss: true, colossus: true, hb: C.hb, pb: C.pb, mv: C.mv, parts: C.parts, shb: C.shb }],
        ...C.escort,
      ],
    };
    OBSTACLES[C.k] = {};
  });
  ROLE_PROVIDERS.push({
    id: 'carapace',
    provide: (c, { S, t }) => {
      if (!t.colossus) {
        return null;
      }
      const n = intactGames(S, t);
      return n ? { add: -3 * n, labelText: 'Carapace' } : null;
    },
  });
  /* ---------- hooks into the battle ---------- */
  HOOKS.creation.push((S, opt, D0) => {
    if (opt && opt.tactics) {
      S.tac = true;
    }
    (D0.foes || []).forEach(([, , x], i) => {
      const u = byUid(S, 'e' + i);
      if (!u || !x) {
        return;
      }
      if (x.mv) {
        u.mv = x.mv.filter(m => MOVES[m]);
      }
      if (x.colossus) {
        makeColossus(S, u, x, D0);
      }
    });
  });
  HOOKS.progress.push((S, rew, win) => {
    const C = colossusOf(S.sc);
    if (!C || !win) {
      return null;
    }
    PROFILE.colossi = PROFILE.colossi || [];
    if (PROFILE.colossi.includes(C.k)) {
      return null;
    }
    PROFILE.colossi.push(C.k);
    rew.colossus = C.k;
    return C.rew;
  });
  HOOKS.battleResult.push(r => {
    if (!r.colossus) {
      return '';
    }
    const C = colossusOf(r.colossus);
    return `<div class="result-list"><h4>Colosse</h4><div class="result-row">${medal(POKEMON[C.id].t)}<span>${C.n} terrassé · ${PROFILE.colossi.length} / ${COLOSSI.length} colosses</span><b>★</b></div></div>`;
  });
  /* ---------- TMs, DTs and HMs in the Shop ---------- */
  [
    ['ct76', { num: 'CT76', mv: 'piegederoc', p: 2500, types: ['Roche', 'Sol', 'Acier'] }],
    ['dt01', { num: 'DT01', mv: 'picots', p: 2000, types: ['Sol', 'Insecte', 'Poison', 'Acier'] }],
    ['dt02', { num: 'DT02', mv: 'toilegluante', p: 2000, types: ['Insecte'] }],
    ['cs02', { num: 'CS02', mv: 'volcs', g: 12, cs: true, types: ['Vol', 'Dragon'] }],
  ].forEach(([k, M]) => {
    MACHINES[k] = M;
    const m = MOVES[M.mv];
    SHOP[k] = {
      n: `${M.num} · ${m.n}`,
      sn: M.num,
      d: `${m.t} · ${m.p ? 'Puissance ' + m.p + ' · ' : ''}${m.d}${M.cs ? ' Réutilisable.' : ' Usage unique.'}`,
      category: 'machines',
      mv: M.mv,
      cs: !!M.cs,
      ...(M.g ? { g: M.g } : { p: M.p }),
    };
  });
}
