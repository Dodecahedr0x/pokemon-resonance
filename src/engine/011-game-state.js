/* Original section: 05-game-state.js */

import { BY } from './009-pokemon.js';
import { ECO0, ecoClean } from './032-v4-foundation.js';
import { APLUS0, aplusClean } from './043-adventure-plus.js';
import { TM0, tmClean } from './045-tms-hms.js';
import { TAC0, tacClean } from './047-tactics.js';
import { REPLAY0, replayClean } from './048-replayability.js';
import { IDP0, idpClean } from './049-identity.js';
import { MON0, monClean } from './050-world.js';
import { V416_0, v416Clean } from './055-living-johto.js';
import { V417_0, v417Clean } from './057-companions-resonance.js';
import { V418_0, v418Clean } from './058-fishing-safari-coop.js';
import { V419_0, v419Clean } from './059-hoenn.js';
import { V421_0, v421Clean } from './061-catch-anywhere.js';
import { V428_0, v428Clean } from './063-combat-catches-home.js';
import { V429_0, v429Clean } from './064-quality.js';
import { V430_0, v430Clean } from './065-camp-tactics.js';
import { V431_0, v431Clean } from './066-tactical-challenges.js';
import { V432_0, v432Clean } from './067-individuals-comfort.js';
import { V433_0, v433Clean } from './068-duel-tutorial.js';
import { V435_0, v435Clean } from './071-hoenn-legendaries.js';

export let LINK_T, LINK_N, PROFILE;
export function __set_PROFILE(v) { return (PROFILE = v); }

/* Profile sections added by the versions: [default values, save
   cleanup]. The order fixes the key order in the save: only append at the end.
   (hoisted functions: the table can be built before their modules are evaluated) */
export const PROFILE_SECTIONS = [
  [ECO0, ecoClean], // wallet, Bag, quests
  [APLUS0, aplusClean], // shinies, rival, legends, Tower (v4.4)
  [TM0, tmClean], // moves learned through TM and HM (v4.6)
  [TAC0, tacClean], // colossi defeated (v4.8)
  [REPLAY0, replayClean], // achievements, title, challenges (v4.9)
  [IDP0, idpClean], // camp and expeditions (v4.10)
  [MON0, monClean], // Team Dissonance, seasonal gifts (v4.11)
  [V416_0, v416Clean], // living Johto: story, beasts, Daycare, friends (v4.16)
  [V417_0, v417Clean], // companion, scenes, vegetable garden, tournament (v4.17)
  [V418_0, v418Clean], // fishing, Safari Park (v4.18)
  [V419_0, v419Clean], // Hoenn (v4.19)
  [V421_0, v421Clean], // catching everywhere (v4.21)
  [V428_0, v428Clean], // regional diplomas (v4.28)
  [V429_0, v429Clean], // tips, rival, weekly challenge (v4.29)
  [V430_0, v430Clean], // doctrine, tactical log (v4.30)
  [V431_0, v431Clean], // riddles, mastery, Deep Echo, arenas (v4.31)
  [V432_0, v432Clean], // nature and ability, squads, Pantheon (v4.32)
  [V433_0, v433Clean], // duel and tutorial (v4.33)
  [V435_0, v435Clean] // Hoenn legends (v4.38)
];

export function defProfile() {
  return Object.assign(
    {
      name: '',
      battles: 0,
      wins: 0,
      losses: 0,
      awakenings: 0,
      rx: 0,
      kos: 0,
      caught: 0,
      mode: 'libre',
      diff: 'normal',
      box: [],
      items: [],
      equipment: {},
      fatigue: {},
      links: {},
      history: [],
      elite: 0,
      dex: [],
      tuto: 0,
      forms: [],
      ranks: {}
    },
    ...PROFILE_SECTIONS.map(([defaultValue]) => defaultValue())
  );
}

/* ===================== GAME STATE (v1.0) ===================== */
export const ITEMS2 = {
  ceinture: { n: 'Ceinture Force', d: 'Survit une fois à un coup fatal avec 1 PV.', i: 'M3 10h18v4H3ZM10 8.5h4v7h-4Z' },
  restes: {
    n: 'Restes',
    d: 'Récupère 3 PV à chaque fin de manche.',
    i: 'M12 8c-4 0-6 3-6 6s2.5 6 6 6 6-2.6 6-6-2-6-6-6Zm0 0c0-2 1-3.6 3-4.5'
  },
  grelot: {
    n: 'Grelot Vif',
    d: '+1 Mouvement.',
    i: 'M12 4a5 5 0 0 1 5 5v5l2 3H5l2-3V9a5 5 0 0 1 5-5ZM10 19a2 2 0 0 0 4 0'
  },
  evoluroc: { n: 'Évoluroc', d: '−1 dégât subi tant que le Pokémon peut encore évoluer.', i: 'M12 3l6 6-6 12-6-12Z' },
  lentille: {
    n: 'Lentille Éveil',
    d: 'Commence le combat avec 1 losange d’énergie.',
    i: 'M12 5c5 0 8 7 8 7s-3 7-8 7-8-7-8-7 3-7 8-7Zm0 4a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z'
  },
  bandeau: {
    n: 'Bandeau Muscle',
    d: '+2 Puissance sur toutes ses attaques.',
    i: 'M4 10c5-3 11-3 16 0l-1 4c-4-2-10-2-14 0Z'
  }
};


export const BADGE_REWARD = [
  { item: 'ceinture', gift: ['onix', 'phanpy', 'debugant'] },
  { item: 'restes', gift: ['ptitard', 'pomdepik', 'ramoloss'] },
  { item: 'grelot', gift: ['magneti', 'porygon', 'pichu'] },
  { item: 'evoluroc', gift: ['germignon', 'bulbizarre', 'insecateur'] },
  { item: 'lentille', gift: ['fantominus', 'nosferapti', 'melo'] },
  { item: 'bandeau', gift: ['abra', 'evoli', 'qulbutoke'] },
  { item: null, gift: ['malosse', 'metamorph', 'hericendre'] },
  { item: null, gift: ['embrylex', 'minidraco', 'lokhlass'] }
];


export const STARTERS = ['bulbizarre', 'salameche', 'carapuce', 'germignon', 'hericendre', 'kaiminus'];


export const CAMP_START = ['magicarpe', 'metamorph', 'chenipan'];

 // v4.13: Ditto replaces Pidgey


export const DIFFS = { facile: 'Facile', normal: 'Normal', expert: 'Expert' };


export const isCamp = () => PROFILE.mode === 'campagne';


export const inBox = id => {
  const m = BY[id];
  if (!m) return false;
  return PROFILE.box.includes(m.base); // Also free: we catch (v4.21)
};


export const ownedItems = () => (isCamp() ? PROFILE.items.filter(k => ITEMS2[k]) : Object.keys(ITEMS2));


export const pairKey = (a, b) => [a, b].sort().join('|');


export const linkPts = (a, b) => PROFILE.links[pairKey(a, b)] || 0;


export const lvlOfPts = v => (v >= LINK_T[2] ? 3 : v >= LINK_T[1] ? 2 : v >= LINK_T[0] ? 1 : 0);

// Statements run at startup, in the original order (see index.js).
export function __init() {

LINK_T = [2, 5, 9],
  LINK_N = ['', 'Soutien', 'Synchro', 'Duo'];


PROFILE = defProfile();
}
