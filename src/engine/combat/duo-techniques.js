/* =====================================================================
   Bonds: a combined technique for each duo (added in v4.16). Each duo
   at the Duo tier has its own combined technique (based on its types);
   4 hand-written Johto techniques.
   ===================================================================== */
import { ELEMENT_TYPES, MARK_REACTIONS } from '../data/game-data.js';
import { POKEMON } from '../pokemon/pokemon.js';
import { PROFILE, lvlOfPts, pairKey } from '../state/game-state.js';
import { BOND_TECHNIQUES } from './items-bonds-ai.js';

export const MARK_BY_TYPE = {
  Eau: 'trempe',
  Électrik: 'charge',
  Feu: 'brulant',
  Plante: 'enracine',
  Glace: 'givre',
  Sol: 'fissure',
};

const MARK_ZONE_NAMES = {
  trempe: 'Trempée',
  charge: 'Chargée',
  brulant: 'Brûlante',
  enracine: 'Enracinée',
  givre: 'Givrée',
  fissure: 'Fissurée',
};

const DUO_ATTACK_NAMES = {
  Eau: 'Torrent',
  Feu: 'Brasier',
  Plante: 'Ronces',
  Électrik: 'Orage',
  Glace: 'Blizzard',
  Sol: 'Faille',
  Roche: 'Éboulis',
  Vol: 'Bourrasque',
  Psy: 'Mirage',
  Spectre: 'Hantise',
  Ténèbres: 'Nuit',
  Dragon: 'Rugissement',
  Combat: 'Assaut',
  Normal: 'Charge',
  Poison: 'Miasme',
  Insecte: 'Essaim',
  Acier: 'Lame',
  Fée: 'Halo',
};

const DUO_PARTNER_NAMES = {
  Eau: 'd’écume',
  Feu: 'de feu',
  Plante: 'de lianes',
  Électrik: 'd’éclairs',
  Glace: 'de givre',
  Sol: 'de sable',
  Roche: 'de roc',
  Vol: 'de plumes',
  Psy: 'd’esprit',
  Spectre: 'd’ombre',
  Ténèbres: 'de ténèbres',
  Dragon: 'de dragon',
  Combat: 'de poings',
  Normal: 'de force',
  Poison: 'de venin',
  Insecte: 'd’élytres',
  Acier: 'd’acier',
  Fée: 'de fées',
};

const DUO_CACHE = {};

function generateDuo(x, y) {
  const k = pairKey(x, y);
  if (DUO_CACHE[k]) {
    return DUO_CACHE[k];
  }
  const a = POKEMON[x],
    b = POKEMON[y];
  if (!a || !b || x === y) {
    return null;
  }
  // first look for a real chain: a mark, then the type that makes it react
  const reacts = (mk, t) => {
    const i = ELEMENT_TYPES.indexOf(t),
      id = MARK_REACTIONS[mk] && i >= 0 ? MARK_REACTIONS[mk][i] : null;
    return !!id && id !== 'ren';
  };
  let A = null,
    Bm = null,
    tA = null,
    tB = null;
  for (const [X, Y] of [
    [a, b],
    [b, a],
  ]) {
    for (const tx of X.t) {
      for (const ty of Y.t) {
        if (!A && MARK_BY_TYPE[tx] && reacts(MARK_BY_TYPE[tx], ty)) {
          [A, Bm, tA, tB] = [X, Y, tx, ty];
        }
      }
    }
  }
  if (!A) {
    const mk = m => m.t.find(t => MARK_BY_TYPE[t]);
    [A, Bm] = !mk(a) && mk(b) ? [b, a] : [a, b];
    tA = mk(A) || A.t[0];
    tB = Bm.t.find(t => t !== tA) || Bm.t[0];
  }
  const m = MARK_BY_TYPE[tA] || null,
    n =
      tA === tB
        ? `Double ${DUO_ATTACK_NAMES[tA] || 'Assaut'}`
        : `${DUO_ATTACK_NAMES[tA] || 'Assaut'} ${DUO_PARTNER_NAMES[tB] || 'combiné'}`;
  return (DUO_CACHE[k] = {
    n,
    first: A.id,
    r: 3,
    gen: true,
    d: m
      ? `${A.n} rend la zone ${MARK_ZONE_NAMES[m]}, ${Bm.n} frappe aussitôt dedans.`
      : `${A.n} ouvre une brèche, ${Bm.n} s’y engouffre.`,
    a: Object.assign({ n, t: tA, p: m ? 4 : 6, r: 3, sh: 'area' }, m ? { mk: m } : {}),
    b: { n, t: tB, p: 8, r: 4, sh: 'one' },
  });
}

export function duoTechnique(k) {
  if (BOND_TECHNIQUES[k]) {
    return BOND_TECHNIQUES[k];
  }
  const [x, y] = String(k).split('|');
  return generateDuo(x, y);
}

/** The Guide: the fixed techniques, then those of your most advanced duos. */
export function listDuos() {
  const o = Object.assign({}, BOND_TECHNIQUES);
  try {
    Object.entries(PROFILE.links || {})
      .filter(([k, v]) => !BOND_TECHNIQUES[k] && lvlOfPts(v) >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .forEach(([k]) => {
        const D = duoTechnique(k);
        if (D) {
          o[k] = D;
        }
      });
  } catch {
    /* Best effort: failure here is non-fatal. */
  } // called at load time, before this module
  return o;
}

const DUO_TECHNIQUES = {
  'loupio|marill': {
    n: 'Abysse Lumineux',
    first: 'marill',
    r: 3,
    d: 'Marill inonde la zone, Loupio y allume ses lanternes électriques.',
    a: { n: 'Abysse Lumineux', t: 'Eau', p: 4, r: 3, sh: 'area', mk: 'trempe' },
    b: { n: 'Abysse Lumineux', t: 'Électrik', p: 9, r: 4, sh: 'one' },
  },
  'axoloto|limagma': {
    n: 'Geyser Volcanique',
    first: 'axoloto',
    r: 3,
    d: 'Axoloto détrempe le sol, Limagma y verse sa lave : la vapeur jaillit.',
    a: { n: 'Geyser Volcanique', t: 'Eau', p: 4, r: 3, sh: 'area', mk: 'trempe' },
    b: { n: 'Geyser Volcanique', t: 'Feu', p: 9, r: 4, sh: 'one' },
  },
  'granivol|mimigal': {
    n: 'Spores Gluantes',
    first: 'granivol',
    r: 3,
    d: 'Granivol sème des racines, Mimigal y tisse une toile empoisonnée.',
    a: { n: 'Spores Gluantes', t: 'Plante', p: 3, r: 3, sh: 'area', mk: 'enracine' },
    b: { n: 'Spores Gluantes', t: 'Poison', p: 8, r: 4, sh: 'one', fx: 'toxweb' },
  },
  'hoothoot|natu': {
    n: 'Vision Nocturne',
    first: 'natu',
    r: 3,
    d: 'Natu voit l’avenir, Hoothoot fond sur la cible au bon moment.',
    a: { n: 'Vision Nocturne', t: 'Psy', p: 6, r: 3, sh: 'area' },
    b: { n: 'Vision Nocturne', t: 'Vol', p: 9, r: 4, sh: 'one', fx: 'sleep' },
  },
};

// Instructions run at startup, in the original order (see index.js).
export function init() {
  Object.assign(BOND_TECHNIQUES, DUO_TECHNIQUES);
}
