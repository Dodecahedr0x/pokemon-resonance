/* Section d'origine : 05-etat-de-partie.js */

import { BY } from './009-03-pokemon.js';
import { ECO0 } from './032-v4-00-socle.js';
import { APLUS0 } from './043-v4-4-01-aventure-plus.js';
import { CT0 } from './045-v4-6-01-ct-cs.js';
import { TAC0 } from './047-v4-8-01-tactique.js';
import { REJ0 } from './048-v4-9-01-rejouabilite.js';
import { IDP0 } from './049-v4-10-01-identite.js';
import { MON0 } from './050-v4-11-01-monde.js';
import { V416_0 } from './055-v4-16-01-johto-vivant.js';
import { V417_0 } from './057-v4-17-01-compagnons-et-resonance.js';
import { V418_0 } from './058-v4-18-01-peche-safari-coop.js';
import { V419_0 } from './059-v4-19-01-hoenn.js';
import { V421_0 } from './061-v4-21-01-capture-partout.js';
import { V428_0 } from './063-v4-28-01-captures-combat-accueil.js';
import { V429_0 } from './064-v4-29-01-qualite.js';
import { V430_0 } from './065-v4-30-01-camp-et-tactique.js';
import { V431_0 } from './066-v4-31-01-defis-tactiques.js';
import { V432_0 } from './067-v4-32-01-individus-et-confort.js';
import { V433_0 } from './068-v4-33-01-duel-et-tutoriel.js';
import { V435_0 } from './071-v4-38-les-legendaires-de-hoenn.js';

export let ITEMS2, BADGE_REWARD, STARTERS, CAMP_START, LINK_T, LINK_N, DIFFS, PROFILE, isCamp, inBox, ownedItems, pairKey, linkPts, lvlOfPts;
export function __set_PROFILE(v) { return (PROFILE = v); }


export function defProfile() {
  return Object.assign(
    {
      name: '',
      battles: 0,
      wins: 0,
      losses: 0,
      evos: 0,
      rx: 0,
      kos: 0,
      caught: 0,
      mode: 'libre',
      diff: 'normal',
      box: [],
      items: [],
      equip: {},
      fatigue: {},
      links: {},
      hist: [],
      elite: 0,
      dex: [],
      tuto: 0,
      forms: [],
      ranks: {}
    },
    ECO0(), // porte-monnaie, Sac, quêtes
    APLUS0(), // chromatiques, rival, légendes, Tour (v4.4)
    CT0(), // capacités apprises par CT et CS (v4.6)
    TAC0(), // colosses vaincus (v4.8)
    REJ0(), // succès, titre, défis (v4.9)
    IDP0(), // camp et expéditions (v4.10)
    MON0(), // Team Dissonance, cadeaux de saison (v4.11)
    V416_0(), // Johto vivant : histoire, bêtes, Pension, amis (v4.16)
    V417_0(), // compagnon, scènes, potager, tournoi (v4.17)
    V418_0(), // pêche, Parc Safari (v4.18)
    V419_0(), // Hoenn (v4.19)
    V421_0(), // capture partout (v4.21)
    V428_0(), // diplômes régionaux (v4.28)
    V429_0(), // astuces, rival, défi de la semaine (v4.29)
    V430_0(), // doctrine, journal tactique (v4.30)
    V431_0(), // énigmes, maîtrise, Écho profond, arènes (v4.31)
    V432_0(), // nature et talent, équipes, Panthéon (v4.32)
    V433_0(), // duel et tutoriel (v4.33)
    V435_0() // légendes de Hoenn (v4.38)
  );
}

// Instructions exécutées au démarrage, dans l'ordre d'origine (voir index.js).
export function __init() {

/* ===================== ÉTAT DE PARTIE (v1.0) ===================== */
ITEMS2 = {
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


BADGE_REWARD = [
  { item: 'ceinture', gift: ['onix', 'phanpy', 'debugant'] },
  { item: 'restes', gift: ['ptitard', 'pomdepik', 'ramoloss'] },
  { item: 'grelot', gift: ['magneti', 'porygon', 'pichu'] },
  { item: 'evoluroc', gift: ['germignon', 'bulbizarre', 'insecateur'] },
  { item: 'lentille', gift: ['fantominus', 'nosferapti', 'melo'] },
  { item: 'bandeau', gift: ['abra', 'evoli', 'qulbutoke'] },
  { item: null, gift: ['malosse', 'metamorph', 'hericendre'] },
  { item: null, gift: ['embrylex', 'minidraco', 'lokhlass'] }
];


STARTERS = ['bulbizarre', 'salameche', 'carapuce', 'germignon', 'hericendre', 'kaiminus'];


CAMP_START = ['magicarpe', 'metamorph', 'chenipan'];

 // v4.13 : Métamorph remplace Roucool
LINK_T = [2, 5, 9],
  LINK_N = ['', 'Soutien', 'Synchro', 'Duo'];


DIFFS = { facile: 'Facile', normal: 'Normal', expert: 'Expert' };


PROFILE = defProfile();


isCamp = () => PROFILE.mode === 'campagne';


inBox = id => {
  const m = BY[id];
  if (!m) return false;
  return PROFILE.box.includes(m.base); // Libre aussi : on capture (v4.21)
};


ownedItems = () => (isCamp() ? PROFILE.items.filter(k => ITEMS2[k]) : Object.keys(ITEMS2));


pairKey = (a, b) => [a, b].sort().join('|');


linkPts = (a, b) => PROFILE.links[pairKey(a, b)] || 0;


lvlOfPts = v => (v >= LINK_T[2] ? 3 : v >= LINK_T[1] ? 2 : v >= LINK_T[0] ? 1 : 0);
}
