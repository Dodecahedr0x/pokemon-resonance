// Tactical riddles (Camp › Énigmes, added in v4.31): frozen positions, KO every opponent in one round.
// Each riddle was built and verified with the game engine.
import { BY, SCEN } from '../pokemon/pokemon.js';
import { PROFILE } from '../state/game-state.js';
import { HOOKS } from '../core/hooks.js';
import { EMAX } from '../combat/engine.js';
import { OBST } from '../combat/synergies-obstacles.js';
import { B, chooseBattle, finish, launch, ui } from '../combat/ui.js';
import { today } from '../state/economy.js';
import { fingerprintRandom } from './weekly-challenge.js';

// A riddle: P = { id, t, b (terrain), a: [[id, c, r, diamonds]], f: [[id, c, r, HP]] }
export let PUZZLE_CURRENT;
// read by the Camp tabs (src/screens/camp/tabs)
export { puzzleState, puzzleOfDay };

function puzzleScen(puzzle) {
  const b = SCEN[puzzle.b] || SCEN.gue;
  return {
    n: `Énigme · ${puzzle.t}`,
    lvl: 'Énigme tactique',
    lim: 1,
    time: 'jour',
    bio: b.bio,
    water: (b.water || []).slice(),
    rock: (b.rock || []).slice(),
    hb: 0,
    pb: 0,
    lv: 30,
    at: BY[puzzle.f[0][0]].t[0],
    foes: puzzle.f.map(([id, c, r]) => [id, [c, r]]),
    catch: false,
    enigme431: puzzle.id,
    noProgress: 1,
    d: 'Mettez K.O. tous les adversaires en une seule manche. Les adversaires ne jouent pas : tout se décide pendant votre tour.',
  };
}

export function puzzleOpts() {
  return {
    diff: 'normal',
    items: {},
    fatigue: {},
    links: {},
    order: 'equipe',
    livingBoard: false,
    tactics: true,
    mut: null,
    doctrineChoice: '',
    challenges: [],
    characters: false,
    disobedience: false,
    dojo: 0,
    learnedTms: {},
  };
}

export function puzzlePrepare(puzzle) {
  PUZZLE_CURRENT = puzzle;
  SCEN.enigme431 = puzzleScen(puzzle);
  OBST.enigme431 = {};
}

function puzzleState() {
  return (PROFILE.riddleButton = PROFILE.riddleButton || { s: {}, n: {}, j: '', jd: [], cur: 0 });
}

function puzzleOfDay() {
  const d = today(),
    r = fingerprintRandom('enig-' + d),
    order = PUZZLES.map((x, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order.slice(0, 3);
}

export function puzzleDef(i) {
  const x = PUZZLES[i];
  if (!x) {
    return null;
  }
  return { id: i, t: `n° ${i + 1}`, b: x[0], a: x[1], f: x[2] };
}

function puzzleLaunch(i) {
  const puzzle = puzzleDef(i);
  if (!puzzle) {
    return;
  }
  const E = puzzleState();
  E.cur = i;
  puzzlePrepare(puzzle);
  chooseBattle('enigme431');
  launch();
}

export function puzzleAfter(S, rew, win) {
  const E = puzzleState(),
    i = SCEN[S.sc].enigme431,
    k = String(i);
  E.n[k] = (E.n[k] || 0) + 1;
  rew.riddleButton = { i, win, attempt: E.n[k] };
  if (!win) {
    return [0, 0];
  }
  const st = 1 + ((S.stats.voice || 0) === 0 ? 1 : 0) + (E.n[k] === 1 ? 1 : 0),
    previous = E.s[k] || 0;
  E.s[k] = Math.max(previous, st);
  rew.riddleButton.st = st;
  let m = 0,
    g = 0;
  if (!previous) {
    m += 150;
  }
  if (E.j !== today()) {
    E.j = today();
    E.jd = [];
  }
  if (puzzleOfDay().includes(i) && !E.jd.includes(i)) {
    E.jd.push(i);
    g += 3;
    rew.riddleButton.jour = 1;
  }
  return [m, g];
}

function puzzleHint() {
  const puzzle = PUZZLE_CURRENT,
    x = puzzle && PUZZLES[puzzle.id];
  if (!x) {
    return '';
  }
  return `Indice : commencez par ${BY[puzzle.a[x[3]][0]].n}.`;
}

/** Riddle: bottom bar text (read by src/screens/combat/battle/Foot.jsx). */
export function riddlePhase() {
  const E = puzzleState(),
    ess = PUZZLE_CURRENT ? E.n[String(PUZZLE_CURRENT.id)] || 0 : 0;
  return `Énigme : tout mettre K.O. en une manche.${ess ? ' ' + puzzleHint() : ''}`;
}

/* riddles built and verified offline with the engine (an offline generator script): [terrain, allies [id, column, row, diamonds], opponents [id, column, row, HP], first ally of the solution] */
export const PUZZLES = [
  [
    'gue',
    [
      ['aquali', 1, 0, 0],
      ['drackhaus', 3, 4, 0],
      ['cochignon', 2, 2, 1],
    ],
    [
      ['marcacrin', 4, 3, 12],
      ['xatu', 2, 1, 19],
      ['maraiste', 3, 2, 19],
    ],
    1,
  ],
  [
    'gue',
    [
      ['cotovol', 2, 4, 1],
      ['reptincel', 1, 3, 3],
      ['magneton', 0, 2, 1],
    ],
    [
      ['gardevoir', 2, 2, 15],
      ['lainergie', 5, 2, 20],
    ],
    1,
  ],
  [
    'gue',
    [
      ['noctali', 1, 1, 1],
      ['gardevoir', 2, 2, 3],
      ['floravol', 1, 0, 1],
    ],
    [
      ['demolosse', 5, 2, 20],
      ['galifeu', 3, 2, 35],
    ],
    0,
  ],
  [
    'tour',
    [
      ['feurisson', 1, 3, 1],
      ['nosferalto', 1, 1, 3],
      ['flagadoss', 3, 3, 0],
    ],
    [
      ['cotovol', 3, 5, 18],
      ['melodelfe', 4, 1, 25],
    ],
    2,
  ],
  [
    'roche',
    [
      ['flobio', 3, 0, 3],
      ['pikachu', 2, 4, 3],
      ['drackhaus', 1, 1, 0],
    ],
    [
      ['porygon2', 5, 2, 11],
      ['papilusion', 5, 3, 17],
    ],
    0,
  ],
  [
    'gue',
    [
      ['maraiste', 2, 3, 0],
      ['xatu', 3, 1, 0],
      ['kadabra', 3, 3, 1],
    ],
    [
      ['pharamp', 4, 5, 17],
      ['typhlosion', 5, 3, 22],
    ],
    2,
  ],
  [
    'tour',
    [
      ['spectrum', 3, 3, 3],
      ['carabaffe', 0, 5, 0],
      ['magneton', 1, 1, 0],
    ],
    [
      ['fantominus', 4, 4, 25],
      ['foretress', 5, 2, 16],
    ],
    1,
  ],
  [
    'gue',
    [
      ['papilusion', 2, 1, 1],
      ['nostenfer', 0, 3, 1],
      ['pikachu', 3, 5, 3],
    ],
    [
      ['mackogneur', 2, 3, 14],
      ['noctali', 2, 2, 51],
    ],
    0,
  ],
  [
    'roche',
    [
      ['carabaffe', 1, 4, 3],
      ['cochignon', 2, 4, 1],
      ['galeking', 3, 5, 1],
    ],
    [
      ['pharamp', 5, 3, 42],
      ['marcacrin', 3, 2, 21],
    ],
    1,
  ],
  [
    'tour',
    [
      ['kirlia', 1, 4, 0],
      ['herbizarre', 2, 2, 3],
      ['raichu', 2, 0, 0],
    ],
    [
      ['aligatueur', 3, 1, 37],
      ['carabaffe', 3, 3, 25],
    ],
    0,
  ],
  [
    'tour',
    [
      ['papilusion', 1, 4, 0],
      ['tetarte', 2, 1, 0],
      ['kadabra', 2, 0, 3],
    ],
    [
      ['kokiyas', 5, 4, 20],
      ['gardevoir', 2, 3, 26],
    ],
    0,
  ],
  [
    'tour',
    [
      ['flobio', 1, 1, 3],
      ['lanturn', 1, 4, 0],
      ['macronium', 1, 5, 0],
    ],
    [
      ['absol', 2, 1, 20],
      ['feurisson', 3, 5, 33],
    ],
    0,
  ],
  [
    'gue',
    [
      ['spectrum', 1, 5, 3],
      ['porygon2', 1, 1, 0],
      ['tygnon', 3, 2, 0],
    ],
    [
      ['drattak', 5, 2, 45],
      ['salameche', 4, 0, 21],
    ],
    2,
  ],
  [
    'roche',
    [
      ['galegon', 1, 0, 0],
      ['tortank', 2, 5, 1],
      ['kadabra', 2, 0, 3],
    ],
    [
      ['axoloto', 3, 0, 27],
      ['laggron', 3, 4, 21],
    ],
    1,
  ],
  [
    'tour',
    [
      ['xatu', 3, 5, 1],
      ['azumarill', 0, 5, 1],
      ['flobio', 2, 2, 3],
    ],
    [
      ['cochignon', 4, 1, 35],
      ['arcko', 5, 4, 18],
    ],
    2,
  ],
  [
    'tour',
    [
      ['kirlia', 0, 0, 3],
      ['cizayox', 0, 5, 3],
      ['volcaropod', 0, 1, 1],
    ],
    [
      ['flagadoss', 5, 2, 12],
      ['mackogneur', 3, 5, 20],
    ],
    1,
  ],
  [
    'gue',
    [
      ['flagadoss', 2, 3, 1],
      ['draco', 3, 5, 1],
      ['flobio', 3, 1, 3],
    ],
    [
      ['pyroli', 4, 2, 34],
      ['migalos', 3, 2, 38],
    ],
    1,
  ],
  [
    'tour',
    [
      ['raichu', 1, 4, 3],
      ['kirlia', 1, 5, 3],
      ['mentali', 2, 4, 3],
    ],
    [
      ['kaiminus', 5, 1, 26],
      ['kadabra', 4, 0, 23],
      ['voltali', 2, 0, 21],
    ],
    2,
  ],
  [
    'roche',
    [
      ['leviator', 2, 2, 0],
      ['drattak', 0, 3, 3],
      ['pikachu', 1, 2, 1],
    ],
    [
      ['embrylex', 3, 5, 37],
      ['cizayox', 5, 0, 24],
    ],
    1,
  ],
  [
    'gue',
    [
      ['flobio', 2, 4, 3],
      ['volcaropod', 0, 4, 3],
      ['noctali', 3, 4, 3],
    ],
    [
      ['machopeur', 5, 2, 16],
      ['kirlia', 2, 2, 34],
    ],
    0,
  ],
  [
    'gue',
    [
      ['spectrum', 1, 5, 3],
      ['galegon', 0, 2, 1],
      ['nostenfer', 2, 2, 0],
    ],
    [
      ['tarsal', 4, 4, 21],
      ['drackhaus', 3, 1, 36],
    ],
    0,
  ],
  [
    'tour',
    [
      ['reptincel', 2, 4, 3],
      ['kirlia', 1, 1, 3],
      ['galegon', 3, 2, 3],
    ],
    [
      ['hericendre', 5, 3, 10],
      ['flagadoss', 5, 0, 31],
    ],
    0,
  ],
  [
    'roche',
    [
      ['ymphect', 2, 2, 3],
      ['reptincel', 1, 5, 3],
      ['melodelfe', 3, 4, 0],
    ],
    [
      ['minidraco', 5, 5, 9],
      ['magicarpe', 4, 1, 19],
    ],
    1,
  ],
  [
    'roche',
    [
      ['reptincel', 0, 1, 3],
      ['aquali', 2, 4, 1],
      ['flobio', 3, 2, 1],
    ],
    [
      ['voltali', 2, 5, 16],
      ['debugant', 4, 1, 26],
    ],
    1,
  ],
  [
    'gue',
    [
      ['meganium', 3, 4, 3],
      ['drattak', 0, 1, 1],
      ['tortank', 0, 3, 1],
    ],
    [
      ['arcko', 3, 0, 42],
      ['alakazam', 5, 5, 21],
    ],
    0,
  ],
  [
    'roche',
    [
      ['demolosse', 1, 3, 1],
      ['cochignon', 1, 0, 1],
      ['spectrum', 0, 1, 0],
    ],
    [
      ['reptincel', 4, 5, 21],
      ['crustabri', 4, 1, 20],
    ],
    0,
  ],
  [
    'tour',
    [
      ['drackhaus', 2, 5, 0],
      ['gardevoir', 1, 1, 0],
      ['jungko', 0, 3, 0],
    ],
    [
      ['scarhino', 2, 3, 31],
      ['pyroli', 4, 1, 22],
    ],
    0,
  ],
  [
    'gue',
    [
      ['leviator', 2, 3, 0],
      ['draco', 3, 5, 3],
      ['papilusion', 0, 5, 1],
    ],
    [
      ['jungko', 3, 2, 15],
      ['evoli', 2, 1, 16],
      ['tetarte', 2, 4, 28],
    ],
    2,
  ],
  [
    'tour',
    [
      ['leviator', 2, 5, 3],
      ['gardevoir', 0, 1, 1],
      ['reptincel', 3, 3, 3],
    ],
    [
      ['wattouat', 5, 1, 14],
      ['germignon', 5, 2, 30],
      ['mackogneur', 4, 3, 16],
    ],
    0,
  ],
  [
    'roche',
    [
      ['noarfang', 0, 0, 3],
      ['gardevoir', 0, 3, 3],
      ['drackhaus', 1, 4, 3],
    ],
    [
      ['spectrum', 2, 2, 37],
      ['cotovol', 5, 1, 14],
    ],
    1,
  ],
  [
    'tour',
    [
      ['foretress', 3, 2, 3],
      ['flobio', 0, 2, 0],
      ['herbizarre', 0, 1, 3],
    ],
    [
      ['aquali', 2, 2, 44],
      ['pichu', 4, 0, 13],
    ],
    2,
  ],
  [
    'roche',
    [
      ['migalos', 2, 1, 3],
      ['porygon2', 0, 5, 0],
      ['draco', 3, 0, 3],
    ],
    [
      ['scarhino', 5, 1, 14],
      ['wattouat', 3, 2, 18],
      ['evoli', 3, 4, 21],
    ],
    1,
  ],
  [
    'roche',
    [
      ['drackhaus', 1, 0, 1],
      ['lanturn', 2, 0, 0],
      ['tortank', 3, 0, 1],
    ],
    [
      ['absol', 2, 3, 20],
      ['macronium', 5, 2, 9],
      ['raichu', 2, 1, 15],
    ],
    0,
  ],
  [
    'tour',
    [
      ['leviator', 0, 1, 3],
      ['reptincel', 1, 4, 3],
      ['alakazam', 3, 2, 0],
    ],
    [
      ['tenefix', 4, 0, 14],
      ['crocrodil', 2, 1, 39],
    ],
    1,
  ],
  [
    'tour',
    [
      ['raichu', 2, 3, 3],
      ['pyroli', 1, 1, 1],
      ['ectoplasma', 1, 2, 0],
    ],
    [
      ['tarpaud', 2, 1, 23],
      ['raichu', 3, 2, 23],
      ['galekid', 3, 3, 40],
    ],
    1,
  ],
  [
    'tour',
    [
      ['draco', 3, 5, 0],
      ['florizarre', 0, 0, 0],
      ['kadabra', 1, 4, 1],
    ],
    [
      ['natu', 2, 1, 12],
      ['malosse', 4, 1, 19],
    ],
    1,
  ],
  [
    'tour',
    [
      ['feurisson', 0, 1, 3],
      ['aquali', 2, 1, 0],
      ['galegon', 1, 1, 1],
    ],
    [
      ['noctali', 2, 0, 15],
      ['melodelfe', 4, 4, 35],
    ],
    1,
  ],
  [
    'gue',
    [
      ['cochignon', 1, 5, 1],
      ['xatu', 0, 5, 3],
      ['floravol', 2, 2, 3],
    ],
    [
      ['tenefix', 3, 5, 28],
      ['mackogneur', 3, 0, 28],
    ],
    0,
  ],
  [
    'gue',
    [
      ['lanturn', 1, 5, 1],
      ['feurisson', 3, 5, 0],
      ['draco', 2, 4, 1],
    ],
    [
      ['galeking', 4, 0, 8],
      ['galeking', 5, 4, 67],
    ],
    2,
  ],
  [
    'roche',
    [
      ['pikachu', 0, 2, 1],
      ['feurisson', 3, 0, 3],
      ['cizayox', 2, 2, 1],
    ],
    [
      ['tenefix', 5, 2, 43],
      ['galekid', 3, 4, 21],
    ],
    1,
  ],
  [
    'roche',
    [
      ['tarpaud', 2, 4, 0],
      ['draco', 0, 0, 3],
      ['crocrodil', 3, 5, 3],
    ],
    [
      ['kirlia', 2, 5, 14],
      ['meganium', 2, 2, 25],
    ],
    0,
  ],
  [
    'roche',
    [
      ['drackhaus', 2, 3, 1],
      ['kicklee', 1, 1, 0],
      ['tetarte', 1, 4, 1],
    ],
    [
      ['galifeu', 3, 4, 12],
      ['roucarnage', 5, 0, 25],
    ],
    0,
  ],
  [
    'roche',
    [
      ['raichu', 1, 1, 0],
      ['tartard', 2, 0, 3],
      ['drattak', 2, 1, 3],
    ],
    [
      ['chenipan', 3, 2, 36],
      ['porygon2', 4, 3, 27],
    ],
    0,
  ],
  [
    'gue',
    [
      ['mentali', 0, 1, 0],
      ['crocrodil', 0, 2, 3],
      ['ymphect', 1, 0, 1],
    ],
    [
      ['volcaropod', 3, 1, 31],
      ['natu', 2, 2, 17],
      ['evoli', 4, 4, 26],
    ],
    1,
  ],
  [
    'roche',
    [
      ['kapoera', 0, 1, 0],
      ['nostenfer', 2, 1, 0],
      ['migalos', 0, 5, 0],
    ],
    [
      ['mentali', 3, 4, 23],
      ['absol', 3, 2, 41],
    ],
    2,
  ],
  [
    'roche',
    [
      ['alakazam', 1, 5, 0],
      ['ectoplasma', 1, 1, 1],
      ['dracaufeu', 2, 4, 0],
    ],
    [
      ['lanturn', 4, 5, 31],
      ['galeking', 2, 2, 19],
    ],
    0,
  ],
  [
    'gue',
    [
      ['raichu', 2, 1, 1],
      ['brasegali', 1, 2, 1],
      ['kicklee', 1, 0, 1],
    ],
    [
      ['arcanin', 4, 2, 35],
      ['granivol', 3, 0, 22],
    ],
    0,
  ],
  [
    'roche',
    [
      ['flobio', 3, 4, 3],
      ['floravol', 2, 4, 1],
      ['meganium', 1, 4, 3],
    ],
    [
      ['phanpy', 4, 0, 10],
      ['roucoups', 2, 0, 17],
    ],
    1,
  ],
  [
    'roche',
    [
      ['leviator', 1, 1, 1],
      ['voltali', 1, 3, 0],
      ['massko', 0, 1, 3],
    ],
    [
      ['kapoera', 2, 1, 25],
      ['pyroli', 2, 4, 35],
    ],
    1,
  ],
  [
    'roche',
    [
      ['feurisson', 1, 0, 3],
      ['flobio', 1, 1, 3],
      ['noarfang', 3, 5, 1],
    ],
    [
      ['nosferapti', 3, 2, 10],
      ['brasegali', 3, 4, 35],
    ],
    2,
  ],
  [
    'roche',
    [
      ['spectrum', 0, 1, 3],
      ['nosferalto', 2, 0, 3],
      ['tortank', 2, 3, 3],
    ],
    [
      ['tarsal', 2, 2, 17],
      ['phanpy', 5, 2, 20],
    ],
    1,
  ],
  [
    'roche',
    [
      ['feurisson', 3, 4, 3],
      ['noctali', 2, 4, 3],
      ['draco', 2, 2, 0],
    ],
    [
      ['aquali', 3, 5, 24],
      ['insecateur', 5, 3, 15],
    ],
    1,
  ],
  [
    'gue',
    [
      ['aquali', 1, 3, 1],
      ['carabaffe', 0, 0, 1],
      ['floravol', 1, 4, 3],
    ],
    [
      ['demolosse', 3, 3, 33],
      ['insecateur', 5, 5, 20],
      ['nosferapti', 3, 2, 18],
    ],
    2,
  ],
  [
    'tour',
    [
      ['reptincel', 0, 5, 1],
      ['typhlosion', 0, 1, 3],
      ['herbizarre', 2, 3, 3],
    ],
    [
      ['limagma', 3, 2, 10],
      ['pikachu', 2, 2, 29],
      ['leviator', 2, 4, 18],
    ],
    1,
  ],
  [
    'gue',
    [
      ['dracaufeu', 2, 3, 0],
      ['nosferalto', 1, 1, 1],
      ['tetarte', 3, 0, 1],
    ],
    [
      ['drackhaus', 5, 1, 28],
      ['voltali', 5, 0, 23],
    ],
    1,
  ],
  [
    'gue',
    [
      ['melodelfe', 2, 2, 1],
      ['nosferalto', 0, 2, 3],
      ['kapoera', 3, 2, 1],
    ],
    [
      ['laggron', 4, 0, 38],
      ['mentali', 5, 2, 19],
    ],
    0,
  ],
  [
    'gue',
    [
      ['tyranocif', 3, 4, 0],
      ['aquali', 3, 2, 1],
      ['feurisson', 0, 3, 0],
    ],
    [
      ['tarsal', 4, 3, 21],
      ['drattak', 2, 4, 20],
    ],
    1,
  ],
  [
    'tour',
    [
      ['floravol', 0, 0, 0],
      ['herbizarre', 2, 5, 3],
      ['roigada', 2, 2, 1],
    ],
    [
      ['magneti', 2, 0, 8],
      ['machopeur', 5, 3, 21],
    ],
    0,
  ],
  [
    'tour',
    [
      ['draco', 2, 3, 3],
      ['florizarre', 1, 2, 3],
      ['steelix', 2, 0, 0],
    ],
    [
      ['kicklee', 5, 3, 24],
      ['tarpaud', 3, 1, 24],
    ],
    0,
  ],
  [
    'tour',
    [
      ['aligatueur', 1, 5, 0],
      ['feurisson', 3, 3, 3],
      ['kirlia', 0, 0, 0],
    ],
    [
      ['roucarnage', 4, 1, 15],
      ['jungko', 4, 4, 22],
      ['crustabri', 2, 0, 16],
    ],
    0,
  ],
];

// Statements run at startup, in the original order (see index.js).
export function init() {
  PUZZLE_CURRENT = null;

  HOOKS.combat.push(S => {
    const puzzle = PUZZLE_CURRENT;
    if (S.sc !== 'enigme431' || !puzzle) {
      return;
    }
    const al = S.units.filter(u => u.side === 'a'),
      fo = S.units.filter(u => u.side === 'e');
    puzzle.a.forEach(([, c, r, en], i) => {
      const u = al[i];
      if (!u) {
        return;
      }
      u.pos = [c, r];
      u.en = Math.max(0, Math.min(EMAX, en || 0));
    });
    puzzle.f.forEach(([, c, r, hp], i) => {
      const u = fo[i];
      if (!u) {
        return;
      }
      u.pos = [c, r]; // the riddle's position, not the one chosen by the AI
      if (hp) {
        u.hp = Math.max(1, Math.min(u.mhp, hp));
      }
    });
    S.lim = 1;
  });

  HOOKS.battleResult.push(r => {
    const e = r.riddleButton;
    if (!e) {
      return '';
    }
    const et = n => '★'.repeat(n) + '☆'.repeat(3 - n);
    return `<div class="result-list"><h4>Énigme n° ${e.i + 1}</h4><div class="result-row"><span>${e.win ? `Résolue ${et(e.st)} · ${e.st === 3 ? 'du premier coup, sans Voix' : e.st === 2 ? (e.attempt === 1 ? 'du premier coup' : 'sans dépenser de Voix') : 'réussie'}${e.jour ? ' · énigme du jour : +3 Éclats' : ''}` : `Ratée (essai ${e.attempt}). Changez l’ordre de vos Pokémon et visez les mêmes cibles.`}</span><b>${e.win ? et(e.st) : ''}</b></div></div>`;
  });

  // in a riddle, ending your turn without having won means losing (opponents do not play)
  document.addEventListener(
    'click',
    e => {
      if (!B || B.over || B.sc !== 'enigme431' || !e.target.closest('#bEnd') || ui.busy) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      B.over = 'lose';
      B.timeout = true;
      finish();
    },
    true
  );

  document.addEventListener('click', e => {
    const b = e.target.closest('[data-riddle-button]');
    if (!b) {
      return;
    }
    puzzleLaunch(+b.dataset.riddleButton);
  });
}
