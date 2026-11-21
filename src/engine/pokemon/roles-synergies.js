import { POKEMON, PRESETS } from './pokemon.js';

export function synOf(ids) {
  const T = ids.filter(id => POKEMON[id]).map(id => POKEMON[id].t);
  return SYNERGIES.filter(s => T.some((a, i) => a.includes(s.t[0]) && T.some((b, j) => j !== i && b.includes(s.t[1]))));
}

/* ===================== v1.1: confirmed recruits, roles, synergies ===================== */
export const RC = id => {
  const m = POKEMON[id];
  return m.st === 1 ? m.c : m.c + m.st - 1;
};

export const ROLEFX = {
  Rempart: {
    k: 'Protecteur',
    d: 'Gardiennage : une fois par manche, s’interpose devant un allié au contact visé par une attaque à cible unique et encaisse 75 % du coup.',
  },
  Frappeur: { k: 'Carry', d: 'Sous escorte : +25 % de dégâts tant qu’un Rempart allié est au contact.' },
  Éclaireur: {
    k: 'Attaquant rapide',
    d: 'Frappe et repli : peut encore se déplacer après avoir attaqué s’il n’a pas bougé avant.',
  },
  Verrou: {
    k: 'Contrôle',
    d: 'Prise : tant qu’il est en jeu, son équipe inflige +25 % aux cibles altérées (Sommeil, Paralysie, Gel, Racines, Toile, Brûlure).',
  },
  Déclencheur: { k: 'Amorce', d: 'Ses marques durent une manche de plus : les réactions ont le temps de venir.' },
  Relais: { k: 'Soutien', d: 'En fin de manche, soigne 3 PV à chaque allié au contact.' },
};

export const SYNERGIES = [
  { k: 'forge', n: 'Forge', t: ['Feu', 'Roche'], d: 'Attaques Feu et Roche : +2 dégâts.' },
  { k: 'acier', n: 'Acier trempé', t: ['Ténèbres', 'Acier'], d: 'Pokémon Ténèbres et Acier : −2 dégâts subis.' },
  { k: 'tempete', n: 'Tempête', t: ['Eau', 'Électrik'], d: 'Attaques Électrik : +25 % sur les cibles Trempées.' },
  {
    k: 'esprit',
    n: 'Esprit',
    t: ['Psy', 'Spectre'],
    d: 'Attaques Psy et Spectre : traversent les piliers et ignorent la couverture.',
  },
  { k: 'escadrille', n: 'Escadrille', t: ['Vol', 'Insecte'], d: 'Pokémon Vol et Insecte : +1 Mouvement.' },
  { k: 'dojo', n: 'Dojo', t: ['Combat', 'Normal'], d: 'Attaques au contact : +2 dégâts.' },
  {
    k: 'toxines',
    n: 'Toxines',
    t: ['Poison', 'Plante'],
    d: 'Ennemis entravés (Racines, Toile, Sommeil) : 3 dégâts en fin de manche.',
  },
  { k: 'banquise', n: 'Banquise', t: ['Glace', 'Eau'], d: 'Attaques Glace : +3 dégâts.' },
  { k: 'draco', n: 'Ciel draconique', t: ['Dragon', 'Vol'], d: 'Attaques Dragon et Vol : +2 dégâts.' },
  { k: 'benediction', n: 'Bénédiction', t: ['Fée', 'Plante'], d: 'Soins reçus par l’équipe : +50 %.' },
];

const RSLUG = { Rempart: 'rem', Frappeur: 'fra', Éclaireur: 'ecl', Verrou: 'ver', Déclencheur: 'dec', Relais: 'rel' };

const RICON = {
  rem: 'M12 3 19 6v6c0 4.4-3 7.4-7 9-4-1.6-7-4.6-7-9V6Z',
  fra: 'M5 19 15 9M13 5h6v6M7 21l-4-4',
  ecl: 'M4 12h11M11 6l6 6-6 6M19 5v14',
  ver: 'M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6Z',
  dec: 'M12 3v5M12 16v5M3 12h5M16 12h5M12 12m-3 0a3 3 0 1 0 6 0 3 3 0 1 0-6 0',
  relics: 'M12 5v14M5 12h14',
};

export const roleIcon = r => {
  const s = RSLUG[r] || 'rel';
  return `<svg class="role-icon role-icon-${s}" viewBox="0 0 24 24" aria-hidden="true"><path d="${RICON[s]}"/></svg>`;
};

// Statements run at startup, in the original order (see index.js).
export function init() {
  Object.assign(PRESETS, {
    escorte: { n: 'Escorte du dragon', ids: ['dracaufeu', 'ymphect', 'germignon', 'melo'], f: 1 },
    acier: { n: 'Acier et ténèbres', ids: ['tyranocif', 'magneti', 'onix', 'pichu'], f: 1 },
    esprit: { n: 'Esprit frappeur', ids: ['alakazam', 'fantominus', 'melofee', 'ptitard'], f: 1 },
    maree: { n: 'Marée électrique', ids: ['leviator', 'pikachu', 'carapuce', 'kaiminus'], f: 1 },
  });
}
