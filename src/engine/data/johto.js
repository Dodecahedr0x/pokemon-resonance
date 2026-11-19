import { MV, TAL } from './moves.js';

const JOHTO_MOVES = {
  extrasenseur: {
    n: 'Extrasenseur',
    t: 'Psy',
    p: 11,
    r: 3,
    sh: 'one',
    fx: 'confond',
    sig: 1,
    d: 'Signature. Portée 3. La cible est désorientée : elle frappera ailleurs.',
  },
  toilefatale: {
    n: 'Toile Fatale',
    t: 'Insecte',
    p: 9,
    r: 3,
    sh: 'one',
    fx: 'toxweb',
    sig: 1,
    d: 'Signature. Portée 3. La cible est empoisonnée et engluée (−3 Mouvement).',
  },
  ondeabyssale: {
    n: 'Onde Abyssale',
    t: 'Électrik',
    p: 10,
    r: 3,
    sh: 'area',
    mk: 'charge',
    sig: 1,
    d: 'Signature. Zone de 7 cases à 3 cases, Chargé, alliés compris.',
  },
  oeilsolaire: { n: 'Œil Solaire', t: 'Psy', p: 12, r: 4, sh: 'line', sig: 1, d: 'Signature. Ligne de 4 cases.' },
  calinerie: {
    n: 'Câlinerie',
    t: 'Fée',
    p: 13,
    r: 1,
    sh: 'one',
    fx: 'affaiblit',
    sig: 1,
    d: 'Signature. Au contact. La cible est intimidée : −3 dégâts pendant 2 manches.',
  },
  envolcoton: {
    n: 'Envol Cotonneux',
    t: 'Vol',
    p: 8,
    r: 4,
    sh: 'one',
    prio: 1,
    fx: 'frappefuite',
    sig: 1,
    d: 'Signature. Portée 4, priorité. Il peut encore se déplacer après avoir frappé.',
  },
  bourbier: {
    n: 'Bourbier',
    t: 'Sol',
    p: 10,
    r: 2,
    sh: 'area',
    mk: 'fissure',
    fx: 'bourbier',
    sig: 1,
    d: 'Signature. Zone de 7 cases à 2 cases (alliés compris), Fissuré. Les adversaires touchés sont ralentis : −3 Mouvement pendant 2 manches.',
  },
  carapaceardente: {
    n: 'Carapace Ardente',
    t: 'Feu',
    p: 0,
    r: 0,
    sh: 'self',
    fx: 'carapace',
    sig: 1,
    d: 'Signature. +2 Garde pendant 3 manches, et les cases voisines deviennent Brûlantes.',
  },
  avalanche: {
    n: 'Avalanche',
    t: 'Glace',
    p: 12,
    r: 1,
    sh: 'cone',
    mk: 'givre',
    sig: 1,
    d: 'Signature. Cône de 3 cases, Givré.',
  },
  megacorne: {
    n: 'Mégacorne',
    t: 'Insecte',
    p: 14,
    r: 1,
    sh: 'one',
    fx: 'push',
    v: 1,
    sig: 1,
    d: 'Signature. Au contact, repousse la cible d’une case.',
  },
  poudreneige: { n: 'Poudreuse', t: 'Glace', p: 5, r: 2, sh: 'one', mk: 'givre', d: 'Portée 2, Givré.' },
};

// Statements run at startup, in the original order (see index.js).
export function init() {
  /* v4.15: twenty Johto Pokémon (ten families), their signature moves and three abilities. */
  Object.assign(MV, JOHTO_MOVES);

  Object.assign(TAL, {
    nocturne: ['Nocturne', 'La nuit, ses attaques font ×1,25.'],
    forcepure: ['Force Pure', 'Ses attaques au contact font ×1,3.'],
    armuremagma: ['Armumagma', 'Ne peut pas être gelé.'],
  });
}
