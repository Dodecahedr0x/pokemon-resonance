import { GYMS } from '../data/game-data.js';
import { SCENARIOS } from '../pokemon/pokemon.js';
import { writeLS } from '../core/utils.js';
import { BOARD_ROWS, BOARD_COLS, cellKey, parseCellKey, pushMessage, setMark, unitAt } from '../combat/engine.js';
import { LEAGUE_MASTERS } from '../progression/prestige.js';
import { johtoGymSetup, johtoGymTick } from '../world/johto.js';

export let TERR, BADGES;
export function __set_BADGES(v) {
  return (BADGES = v);
}

function arenaOf(S) {
  return (SCENARIOS[S.sc] && SCENARIOS[S.sc].rule) || null;
}

function tideRow(S) {
  return BOARD_ROWS - 1 - Math.floor((S.round - 1) / 2);
}

export function arenaSetup(S) {
  const r = arenaOf(S);
  if (!r) {
    return [];
  }
  const ev = [];
  S.ar = {
    runners: [
      [7, 1],
      [7, 4],
    ],
  };
  if (r === 'roche') {
    for (const k in S.tiles) {
      if (!S.tiles[k].rock) {
        S.tiles[k].mark = { k: 'fissure', d: 99, lv: 1, by: null };
      }
    }
    pushMessage(ev, 'Arène Roche : tout le plateau est Fissuré.');
  }
  if (r === 'elec') {
    S.ar.runners.forEach(([c, rw]) => setMark(S, cellKey(c, rw), 'charge', null));
    pushMessage(ev, 'Arène Électrik : deux fronts de Charge se mettent en marche.');
  }
  if (r === 'poison') {
    S.ar.thr = 3;
    for (const k in S.tiles) {
      if (parseCellKey(k)[0] >= 3) {
        S.tiles[k].fog = 9;
      }
    }
    pushMessage(ev, 'Arène Poison : une brume toxique couvre le camp adverse.');
  }
  if (r === 'plante') {
    rootWall(S, ev, true);
  }
  if (r === 'psy') {
    pushMessage(ev, 'Arène Psy : une manche sur deux, un Écran Psy protège les adversaires (+2 Garde).');
  }
  johtoGymSetup(S, r, ev); // Johto gyms (v4.15)
  return ev;
}

function rootCol(S) {
  return S.round % 2 ? 3 : 4;
}

function rootWall(S, ev, quiet) {
  const c = rootCol(S);
  for (let rw = 0; rw < BOARD_ROWS; rw++) {
    const k = cellKey(c, rw),
      t = S.tiles[k];
    if (t.rock || (rw + S.round) % 3 === 0) {
      continue;
    }
    t.mud = Math.max(t.mud, 2);
    if (!t.mark) {
      setMark(S, k, 'enracine', null);
    }
  }
  if (!quiet) {
    pushMessage(ev, `Arène Plante : les racines se déplacent en colonne ${'ABCDEFGH'[c]}.`);
  }
}

export function arenaTick(S) {
  const r = arenaOf(S),
    ev = [];
  if (!r || S.over) {
    return ev;
  }
  const R = S.round;
  if (r === 'eau' && R % 2 === 1 && R > 1) {
    const row = tideRow(S) + 1;
    if (row <= BOARD_ROWS - 1 && row >= BOARD_ROWS - 3) {
      for (let c = 0; c < BOARD_COLS; c++) {
        const t = S.tiles[cellKey(c, row)];
        if (!t.rock) {
          t.w = true;
        }
      }
      pushMessage(ev, `Arène Eau : la marée submerge la rangée ${row + 1}.`);
      ev.push({ e: 'arena', r });
    }
  }
  if (r === 'elec') {
    S.ar.runners = S.ar.runners.map(([c, rw]) => {
      let n = c - 1;
      if (n < 0) {
        n = BOARD_COLS - 1;
      }
      if (S.tiles[cellKey(n, rw)].rock) {
        n = n - 1 < 0 ? BOARD_COLS - 1 : n - 1;
      }
      setMark(S, cellKey(n, rw), 'charge', null);
      return [n, rw];
    });
    pushMessage(ev, 'Arène Électrik : les fronts de Charge avancent.');
    ev.push({ e: 'arena', r });
  }
  if (r === 'plante') {
    rootWall(S, ev, false);
    ev.push({ e: 'arena', r });
  }
  if (r === 'poison' && S.ar.thr < BOARD_COLS) {
    S.ar.thr++;
    for (const k in S.tiles) {
      const c = parseCellKey(k)[0],
        t = S.tiles[k];
      if (c >= S.ar.thr) {
        t.fog = Math.max(t.fog, 9);
      } else if (t.fog > 2) {
        t.fog = 0;
      }
    }
    pushMessage(
      ev,
      S.ar.thr < BOARD_COLS
        ? `Arène Poison : la brume recule jusqu’à la colonne ${'ABCDEFGH'[S.ar.thr]}.`
        : 'Arène Poison : la brume se dissipe.'
    );
    ev.push({ e: 'arena', r });
  }
  if (r === 'psy') {
    if (S.jit && R % 2 === 0) {
      S.units.forEach(o => {
        if (o.side === 'e' && !o.ko) {
          o.guard = Math.max(o.guard, 1);
        } // lasts until the end of the round
      });
    }
    pushMessage(
      ev,
      S.jit
        ? R % 2 === 0
          ? 'Arène Psy : l’Écran Psy se lève, +2 Garde aux adversaires cette manche.'
          : 'Arène Psy : l’Écran Psy retombe.'
        : R % 2 === 0
          ? 'Arène Psy : les intentions ennemies sont voilées cette manche.'
          : 'Arène Psy : le voile se lève, les intentions sont lisibles.'
    );
    if (S.jit) {
      ev.push({ e: 'arena', r });
    }
  }
  if (r === 'feu' && (R - 1) % 3 === 0 && R > 1) {
    const w = LAVAW[((R - 1) / 3 - 1) % 3];
    w.forEach(k => {
      const t = S.tiles[k];
      if (!t.rock) {
        t.lava = 3;
        t.mark = null;
      }
    });
    pushMessage(ev, 'Arène Feu : des Coulées de lave jaillissent.');
    ev.push({ e: 'arena', r });
  }
  if (r === 'sol') {
    const rocks = Object.keys(S.tiles).filter(k => S.tiles[k].rock);
    let moved = 0;
    rocks.forEach(k => {
      const [c, rw] = parseCellKey(k),
        nk = cellKey(c, (rw + 1) % BOARD_ROWS),
        t = S.tiles[nk];
      if (t.rock || t.w || unitAt(S, nk)) {
        return;
      }
      S.tiles[k].rock = false;
      t.rock = true;
      t.mark = null;
      S.tiles[k].mark = { k: 'fissure', d: 2, lv: 1, by: null };
      moved++;
    });
    pushMessage(
      ev,
      moved
        ? `Arène Sol : un séisme fait glisser ${moved} rocher${moved > 1 ? 's' : ''}.`
        : 'Arène Sol : le sol tremble, les rochers sont bloqués.'
    );
    ev.push({ e: 'arena', r });
  }
  johtoGymTick(S, r, ev); // Johto gyms (v4.15)
  return ev;
}

/* what the gym is preparing for the end of the current round (shown on the board) */
export function arenaNext(S) {
  const r = arenaOf(S);
  if (!r) {
    return null;
  }
  const R = S.round;
  if (r === 'eau' && R % 2 === 0) {
    const row = tideRow(S);
    if (row >= BOARD_ROWS - 3 && row < BOARD_ROWS) {
      return {
        tiles: Array.from({ length: BOARD_COLS }, (_, c) => cellKey(c, row)).filter(
          k => !S.tiles[k].rock && !S.tiles[k].w
        ),
        txt: `La marée monte en fin de manche (rangée ${row + 1}).`,
      };
    }
  }
  if (r === 'feu' && R % 3 === 0) {
    const w = LAVAW[(R / 3 - 1) % 3];
    return { tiles: w.filter(k => !S.tiles[k].rock), txt: 'Coulées de lave en fin de manche sur les cases allumées.' };
  }
  if (r === 'elec') {
    return {
      tiles: S.ar.runners.map(([c, rw]) => {
        let n = c - 1;
        if (n < 0) {
          n = BOARD_COLS - 1;
        }
        if (S.tiles[cellKey(n, rw)].rock) {
          n = n - 1 < 0 ? BOARD_COLS - 1 : n - 1;
        }
        return cellKey(n, rw);
      }),
      txt: 'Les fronts de Charge avanceront sur les cases allumées.',
    };
  }
  if (r === 'sol') {
    return {
      tiles: Object.keys(S.tiles)
        .filter(k => S.tiles[k].rock)
        .map(k => {
          const [c, rw] = parseCellKey(k);
          return cellKey(c, (rw + 1) % BOARD_ROWS);
        })
        .filter(k => !S.tiles[k].rock && !S.tiles[k].w),
      txt: 'Séisme en fin de manche : les rochers glisseront vers les cases allumées.',
    };
  }
  if (r === 'plante') {
    const c = (R + 1) % 2 ? 3 : 4;
    return {
      tiles: Array.from({ length: BOARD_ROWS }, (_, rw) => cellKey(c, rw)).filter(
        (k, rw) => !S.tiles[k].rock && (rw + R + 1) % 3 !== 0
      ),
      txt: `Les racines se déplaceront en colonne ${'ABCDEFGH'[c]}.`,
    };
  }
  if (r === 'psy') {
    return {
      tiles: [],
      txt: S.jit
        ? R % 2 === 0
          ? 'Écran Psy levé : +2 Garde aux adversaires. Statuts et dégâts fixes l’ignorent.'
          : 'Écran Psy baissé : frappez fort, il se relève à la prochaine manche.'
        : R % 2 === 0
          ? 'Intentions voilées cette manche : lisez les placements.'
          : 'Intentions visibles. La manche suivante sera voilée.',
    };
  }
  if (r === 'poison') {
    return {
      tiles: [],
      txt:
        S.ar.thr < BOARD_COLS
          ? 'Brume toxique : les Pokémon dans la brume ne peuvent être visés que de près.'
          : 'La brume s’est dissipée.',
    };
  }
  if (r === 'roche') {
    return { tiles: [], txt: 'Sol Fissuré partout : Eau = Boue, Feu = Coulée, Sol = Onde sismique.' };
  }
  return null;
}

export function winBadge(i) {
  if (BADGES.includes(i)) {
    return false;
  }
  BADGES.push(i);
  BADGES.sort((a, b) => a - b);
  writeLS('res9-badges', BADGES);
  return true;
}

/* ===================== GYMS: eight playable badges (additive module, the engine is not modified) ===================== */
export const ARENAS = [
  {
    k: 'a1',
    rule: 'roche',
    lim: 10,
    time: 'jour',
    rock: ['3,1', '4,4'],
    water: [],
    hb: 4,
    pb: 0,
    lv: 12,
    foes: [
      ['racaillou', [6, 1]],
      ['onix', [6, 3]],
      ['racaillou', [6, 5]],
      ['embrylex', [7, 2]],
    ],
    d: 'Tout le plateau est Fissuré dès le départ. Une attaque Eau y crée de la Boue, une attaque Feu une Coulée.',
  },
  {
    k: 'a2',
    rule: 'eau',
    lim: 10,
    time: 'jour',
    rock: ['2,0'],
    water: ['4,2', '4,3'],
    hb: 5,
    pb: 1,
    lv: 16,
    foes: [
      ['kokiyas', [6, 1]],
      ['ptitard', [6, 3]],
      ['psykokwak', [6, 5]],
      ['carapuce', [7, 2]],
    ],
    d: 'Toutes les 2 manches, la marée gagne une rangée par le bas. Gardez vos Pokémon Eau au sec avant un Éclair.',
  },
  {
    k: 'a3',
    rule: 'elec',
    lim: 10,
    time: 'jour',
    rock: ['3,0', '3,5'],
    water: [],
    hb: 12,
    pb: 2,
    lv: 20,
    foes: [
      ['magneti', [6, 1]],
      ['wattouat', [6, 3]],
      ['pichu', [6, 5]],
      ['pikachu', [7, 2]],
    ],
    d: 'Deux fronts de Charge traversent les rangées 2 et 5, d’une case par manche. Ne restez pas sur leur chemin.',
  },
  {
    k: 'a4',
    rule: 'plante',
    lim: 11,
    time: 'jour',
    rock: [],
    water: ['0,5'],
    hb: 9,
    pb: 1,
    lv: 24,
    foes: [
      ['germignon', [6, 1]],
      ['bulbizarre', [6, 3]],
      ['germignon', [6, 5]],
      ['herbizarre', [7, 2]],
    ],
    d: 'Une haie de racines se déplace entre les colonnes D et E et ralentit tout ce qui la traverse.',
  },
  {
    k: 'a5',
    rule: 'poison',
    lim: 10,
    time: 'nuit',
    rock: ['3,2'],
    water: [],
    hb: 22,
    pb: 3,
    lv: 28,
    foes: [
      ['nosferapti', [6, 1]],
      ['fantominus', [6, 3]],
      ['nosferapti', [6, 5]],
      ['spectrum', [7, 2]],
    ],
    d: 'Une brume toxique couvre le camp adverse et recule d’une colonne par manche. On ne vise pas ce qu’on ne voit pas.',
  },
  {
    k: 'a6',
    rule: 'psy',
    lim: 10,
    time: 'jour',
    rock: ['3,1', '3,4'],
    water: [],
    hb: 24,
    pb: 4,
    lv: 32,
    foes: [
      ['abra', [6, 1]],
      ['evoli', [6, 3]],
      ['abra', [6, 5]],
      ['kadabra', [7, 2]],
      ['psykokwak', [7, 4]],
    ],
    d: 'Une manche sur deux, un Écran Psy protège les adversaires (+2 Garde). Frappez fort quand il tombe, contrôlez quand il est levé.',
  },
  {
    k: 'a7',
    rule: 'feu',
    lim: 10,
    time: 'nuit',
    rock: ['2,0', '2,5'],
    water: [],
    hb: 28,
    pb: 4,
    lv: 36,
    foes: [
      ['hericendre', [6, 1]],
      ['caninos', [6, 3]],
      ['salameche', [6, 5]],
      ['reptincel', [7, 2]],
      ['malosse', [7, 4]],
    ],
    d: 'Toutes les 3 manches, des Coulées de lave jaillissent. Les cases menacées s’allument une manche avant.',
  },
  {
    k: 'a8',
    rule: 'sol',
    lim: 10,
    time: 'jour',
    rock: ['3,1', '4,3', '3,5'],
    water: [],
    hb: 29,
    pb: 4,
    lv: 40,
    foes: [
      ['onix', [6, 1]],
      ['machoc', [6, 3]],
      ['gravalanch', [6, 5]],
      ['machopeur', [7, 2]],
      ['embrylex', [7, 4]],
    ],
    d: 'À chaque manche, un séisme fait glisser les rochers d’une rangée et fissure le sol derrière eux.',
  },
];

const LAVAW = [
  ['3,1', '3,2', '4,3', '4,4'],
  ['2,2', '3,3', '4,1', '5,4'],
  ['3,0', '3,4', '4,2', '5,5'],
];

export const veiled = S => !!(S && S.jit) || (arenaOf(S) === 'psy' && S.round % 2 === 0);

// Startup statements, run in their original order (see index.js).
export function init() {
  ARENAS.forEach((a, i) => {
    const g = GYMS[i];
    SCENARIOS[a.k] = Object.assign(
      { n: g.n, lvl: `Arène ${i + 1} · ${LEAGUE_MASTERS[i].n}`, bio: 'arene', gym: i, at: g.t },
      a
    );
  });

  TERR = Object.keys(SCENARIOS).filter(k => !SCENARIOS[k].rule);

  // training grounds (no gym rule)

  // v4.12: hidden intents
  BADGES = [];

  try {
    const b = JSON.parse(localStorage.getItem('res9-badges') || '[]');
    if (Array.isArray(b)) {
      BADGES = b.filter(i => Number.isInteger(i) && i >= 0 && i < 8);
    }
  } catch {
    /* Best effort: failure here is non-fatal. */
  }
}
