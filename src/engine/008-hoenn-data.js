/* Original section: v4.19-00-hoenn-donnees.js */

import { MV } from './005-moves.js';

/* v4.19: signature moves of the Hoenn Pokémon, region names */
export const REGION_NAMES = ['', 'Kanto', 'Johto', 'Hoenn'];

// Statements run at startup, in the original order (see index.js).
export function __init() {
  Object.assign(MV, {
    lamefeuille: {
      n: 'Lame-Feuille',
      t: 'Plante',
      p: 13,
      r: 1,
      sh: 'one',
      mk: 'enracine',
      fx: 'percegarde',
      sig: 1,
      d: 'Signature. Contact, Enraciné, ignore la Garde.',
    },
    piedbruleur: {
      n: 'Pied Brûleur',
      t: 'Feu',
      p: 13,
      r: 1,
      sh: 'one',
      mk: 'brulant',
      fx: 'push',
      v: 1,
      sig: 1,
      d: 'Signature. Contact, Brûlant, repousse.',
    },
    ocroupi: {
      n: 'Ocroupi',
      t: 'Eau',
      p: 10,
      r: 2,
      sh: 'area',
      mk: 'trempe',
      fx: 'web',
      sig: 1,
      d: 'Signature. Zone de 7 cases à 2, Trempé, ralentit.',
    },
    eclatmagique: {
      n: 'Éclat Magique',
      t: 'Fée',
      p: 10,
      r: 3,
      sh: 'area',
      fx: 'affaiblit',
      sig: 1,
      d: 'Signature. Zone de 7 cases à 3 : les cibles sont intimidées (−3 dégâts pendant 2 manches).',
    },
    ombreportee: {
      n: 'Ombre Portée',
      t: 'Spectre',
      p: 9,
      r: 3,
      sh: 'one',
      fx: 'taunt',
      sig: 1,
      d: 'Signature. À 3 cases, provoque la cible : elle visera Ténéfix.',
    },
    tetedefer: {
      n: 'Tête de Fer',
      t: 'Acier',
      p: 14,
      r: 1,
      sh: 'one',
      fx: 'push',
      v: 1,
      sig: 1,
      d: 'Signature. Contact, repousse.',
    },
    tranchenuit: {
      n: 'Tranche-Nuit',
      t: 'Ténèbres',
      p: 12,
      r: 1,
      sh: 'one',
      fx: 'percegarde',
      sig: 1,
      d: 'Signature. Contact, ignore la Garde.',
    },
    piquedraco: {
      n: 'Piqué Draco',
      t: 'Dragon',
      p: 13,
      r: 4,
      sh: 'line',
      fx: 'push',
      v: 1,
      sig: 1,
      d: 'Signature. Ligne de 4, repousse la cible visée.',
    },
  });
}
