import { MOVES } from '../data/moves.js';
import { POKEMON, PKT, SCENARIOS } from '../pokemon/pokemon.js';
import { OBSTACLES } from '../combat/synergies-obstacles.js';

/* Legendary bosses: six post-game boss battles, their signature moves and species (added in v4.4). */

export const LEGENDARIES = [
  {
    id: 'raikou',
    n: 'Raikou',
    t: ['Électrik'],
    no: 243,
    s: [6, 5, 4, 6, 3, 2],
    mv: ['fatalfoudre', 'tonnerre'],
    ability: 'statik',
    rule: 'elec',
    time: 'nuit',
    bio: 'ligue',
    water: ['4,1', '4,4'],
    rock: ['3,2'],
    minions: ['magneton', 'raichu'],
    title: 'le Tonnerre errant',
    q: 'Un grondement traverse la plaine. Les fronts de Charge s’allument tout seuls : Raikou est là.',
    w: 'Raikou s’éloigne dans l’orage. Il vous a reconnu comme un égal.',
    l: 'La foudre a frappé avant que vous ne la voyiez venir.',
  },
  {
    id: 'entei',
    n: 'Entei',
    t: ['Feu'],
    no: 244,
    s: [7, 6, 4, 4, 2, 2],
    mv: ['feusacre', 'lanceflammes'],
    ability: 'brasier',
    rule: 'feu',
    time: 'jour',
    bio: 'roche',
    water: [],
    rock: ['3,1', '3,4'],
    minions: ['arcanin', 'demolosse'],
    title: 'le Volcan qui marche',
    q: 'La lave jaillit sous vos pas. Entei rugit, et le sol lui répond.',
    w: 'Le volcan se tait. Entei vous laisse passer.',
    l: 'Le feu a tout recouvert.',
  },
  {
    id: 'suicune',
    n: 'Suicune',
    t: ['Eau'],
    no: 245,
    s: [7, 4, 6, 4, 3, 2],
    mv: ['surf', 'blizzard'],
    ability: 'crachin',
    rule: 'eau',
    time: 'nuit',
    bio: 'gue',
    water: ['5,0', '5,5'],
    rock: ['3,3'],
    minions: ['lokhlass', 'crustabri'],
    title: 'la Brise du Nord',
    q: 'La pluie se met à tomber, et la marée monte avec elle. Suicune vous observe depuis l’eau.',
    w: 'Suicune bondit au-dessus des flots et disparaît. L’eau redevient claire.',
    l: 'La marée vous a emportés.',
  },
  {
    id: 'mewtwo',
    n: 'Mewtwo',
    t: ['Psy'],
    no: 150,
    s: [6, 6, 4, 6, 2, 3],
    mv: ['frappepsy', 'psyko'],
    ability: 'synchro',
    rule: 'psy',
    time: 'nuit',
    bio: 'tour',
    water: [],
    rock: ['3,0', '3,5'],
    minions: ['alakazam', 'mentali'],
    title: 'le Pokémon créé',
    q: 'Mon Écran Psy se lève une manche sur deux. Frappez au mauvais moment et vous ne m’égratignerez même pas.',
    w: 'Intéressant. Vous m’avez vaincu… cette fois.',
    l: 'Prévisible.',
  },
  {
    id: 'lugia',
    n: 'Lugia',
    t: ['Psy', 'Vol'],
    no: 249,
    s: [8, 5, 6, 4, 3, 2],
    mv: ['aeroblast', 'psyko'],
    ability: 'crachin',
    rule: 'eau',
    time: 'nuit',
    bio: 'gue',
    water: ['4,2', '4,3'],
    rock: [],
    minions: ['leviator', 'tartard'],
    title: 'le Gardien des mers',
    q: 'Une tempête se lève au large. Lugia déploie ses ailes et la marée suit.',
    w: 'La tempête retombe. Lugia regagne le fond des mers.',
    l: 'Le vent vous a balayés.',
  },
  {
    id: 'hooh',
    n: 'Ho-Oh',
    t: ['Feu', 'Vol'],
    no: 250,
    s: [8, 6, 5, 4, 3, 2],
    mv: ['feusacre', 'criailes'],
    ability: 'brasier',
    rule: 'feu',
    time: 'jour',
    bio: 'ligue',
    water: [],
    rock: ['3,2'],
    minions: ['dracaufeu', 'pyroli'],
    title: 'l’Oiseau arc-en-ciel',
    q: 'Un arc-en-ciel traverse le ciel, puis s’embrase. Ho-Oh se pose au centre du plateau.',
    w: 'Ho-Oh laisse tomber une plume aux reflets d’arc-en-ciel avant de s’envoler.',
    l: 'Les flammes sacrées ont tout consumé.',
  },
];

export const legKey = id => 'lg' + id;

export const legOf = k => LEGENDARIES.find(L => legKey(L.id) === k) || null;

// Statements run at startup, in the original order (see index.js).
export function init() {
  Object.assign(MOVES, {
    fatalfoudre: {
      n: 'Fatal-Foudre',
      t: 'Électrik',
      p: 12,
      r: 3,
      sh: 'area',
      mk: 'charge',
      d: 'Zone de 7 cases, Chargé.',
    },
    feusacre: { n: 'Feu Sacré', t: 'Feu', p: 13, r: 3, sh: 'area', mk: 'brulant', d: 'Zone de 7 cases, Brûlant.' },
    frappepsy: { n: 'Frappe Psy', t: 'Psy', p: 14, r: 3, sh: 'line', d: 'Ligne de 3 cases.' },
    aeroblast: {
      n: 'Aéroblast',
      t: 'Vol',
      p: 13,
      r: 3,
      sh: 'line',
      fx: 'push',
      v: 1,
      d: 'Ligne de 3 cases, repousse.',
    },
  });

  LEGENDARIES.forEach(L => {
    const m = {
      id: L.id,
      n: L.n,
      t: L.t,
      c: 5,
      r: 'Frappeur',
      r2: 'Rempart',
      s: L.s,
      mv: L.mv,
      ability: L.ability,
      nx: null,
      no: L.no,
      base: L.id,
      st: 1,
      prev: null,
      gen: L.no <= 151 ? 1 : 2,
      leg: true,
    };
    POKEMON[L.id] = m;
    PKT.set(m.t, m.id);
  });

  LEGENDARIES.forEach(L => {
    const k = legKey(L.id);
    SCENARIOS[k] = {
      n: L.n,
      lvl: `Légende · ${L.title}`,
      lim: 11,
      time: L.time,
      bio: L.bio,
      rule: L.rule,
      legend: L.id,
      style: 'boss',
      at: L.t[0],
      water: L.water,
      rock: L.rock,
      hb: 34, // the escort
      pb: 5,
      lv: 55,
      d: `${L.n}, ${L.title}, vous attend sur un plateau à sa mesure. Il ne peut pas être capturé : on l’affronte pour l’honneur… et pour les Éclats.`,
      foes: [
        [L.id, [6, 2], { boss: true, hb: 130, pb: 7 }], // tuned to be a bit harder than the Champion
        [L.minions[0], [7, 1]],
        [L.minions[1], [7, 4]],
      ],
    };
    OBSTACLES[k] = { pil: ['4,0', '4,5'] };
  });
}
