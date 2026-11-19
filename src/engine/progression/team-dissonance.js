/* Team Dissonance: 4 story battles in the Campaign after badges 1, 3, 5 and 7 (Grunts, Admin Vesper, Admin Cobalt, then their leader Orphée Valcourt), each with its own rule (added in v4.11). */

import { MV } from '../data/moves.js';
import { BY, SCEN } from '../pokemon/pokemon.js';
import { PROFILE, isCamp } from '../state/game-state.js';
import { HOOKS } from '../core/hooks.js';
import { OBST } from '../combat/synergies-obstacles.js';

let DISSONANCE;

/** The Dissonance battles to place after badge n (declared function, no constant: safe at load time). */
export function dissonanceAfter(n) {
  if (!isCamp()) {
    return [];
  }
  return { 1: ['td1'], 3: ['td2'], 5: ['td3'], 7: ['td4'] }[n] || [];
}

export const dissonanceOf = k => DISSONANCE.find(T => T.k === k) || null;

// Statements run at startup, in the original order (see index.js).
export function init() {
  DISSONANCE = [
    {
      k: 'td1',
      after: 1,
      n: 'Sbires de la Dissonance',
      who: 'Sbires de la Dissonance',
      pl: true,
      t: 'les petites mains de la Team Dissonance',
      lv: 16,
      hb: 6,
      pb: 1,
      time: 'nuit',
      bio: 'gue',
      at: 'Poison',
      water: ['5,0'],
      rock: ['3,4'],
      foes: [
        ['nosferapti', [6, 1]],
        ['fantominus', [6, 3], { mv: ['picots', 'lechouille'] }],
        ['malosse', [7, 4]],
      ],
      rew: [400, 3],
      q: 'Hé, toi ! Cette lueur, quand tes Pokémon s’éveillent… La Dissonance va l’éteindre. Écarte-toi.',
      w: 'Pff… Le chef ne va pas aimer ça.',
      l: 'Rentre chez toi. La Résonance, c’est fini.',
      d: 'Des Sbires en uniforme gris rôdent sur la route. Ils parlent d’« éteindre la Résonance ». Ils sèment des Picots.',
    },
    {
      k: 'td2',
      after: 3,
      n: 'Admin Vesper',
      who: 'Vesper',
      t: 'Admin de la Team Dissonance, la voix de l’ombre',
      lv: 26,
      hb: 12,
      pb: 2,
      time: 'nuit',
      bio: 'tour',
      at: 'Spectre',
      mut: 'eclipse',
      water: [],
      rock: ['3,1', '3,4'],
      foes: [
        ['spectrum', [6, 2]],
        ['nosferalto', [7, 1]],
        ['noctali', [6, 4]],
        ['fantominus', [7, 3], { mv: ['toilegluante', 'lechouille'] }],
      ],
      rew: [900, 6],
      q: 'La nuit, on n’entend plus rien. Ni les cris, ni la Résonance. Restons dans le noir, veux-tu ?',
      w: 'Tu brilles trop… Orphée saura te faire taire.',
      l: 'Chut. Écoute le silence.',
      d: 'Vesper a plongé la vieille tour dans une nuit sans fin : Spectre et Ténèbres y sont plus forts, et vos tirs portent moins loin.',
    },
    {
      k: 'td3',
      after: 5,
      n: 'Admin Cobalt',
      who: 'Cobalt',
      t: 'Admin de la Team Dissonance, l’ingénieur',
      lv: 34,
      hb: 18,
      pb: 3,
      time: 'jour',
      bio: 'ligue',
      at: 'Acier',
      mut: 'champ',
      water: [],
      rock: ['3,2'],
      foes: [
        ['magneton', [6, 2]],
        ['steelix', [7, 1]],
        ['cizayox', [6, 4]],
        ['magneti', [7, 3], { mv: ['piegederoc', 'eclair'] }],
      ],
      rew: [1400, 10],
      q: 'J’ai miné tout le plateau. Chaque pas que tu feras, je l’ai déjà calculé.',
      w: 'Impossible… mes calculs étaient justes. C’est ta Résonance qui fausse tout.',
      l: 'Prévisible. Comme une machine.',
      d: 'Cobalt a truffé son laboratoire de pièges qui touchent tout le monde. Regardez où vous mettez les pieds.',
    },
    {
      k: 'td4',
      after: 7,
      n: 'Orphée Valcourt',
      who: 'Orphée Valcourt',
      t: 'chef de la Team Dissonance',
      lv: 42,
      hb: 26,
      pb: 4,
      time: 'nuit',
      bio: 'arene',
      at: 'Ténèbres',
      mut: 'verre',
      water: ['4,0', '4,5'],
      rock: ['3,2', '3,3'],
      foes: [
        ['tyranocif', [6, 2], { boss: true, hb: 60, pb: 6 }],
        ['ectoplasma', [7, 1]],
        ['demolosse', [6, 4]],
        ['magneton', [7, 3]],
        ['nostenfer', [7, 5]],
      ],
      rew: [2500, 20],
      q: 'La Résonance enchaîne les Pokémon aux humains. Je vais briser ce lien, pour eux. Montre-moi qu’il vaut la peine d’exister.',
      w: 'Alors ce lien… est réel. Garde-le. La Dissonance se tait.',
      l: 'Tu vois ? Sans Résonance, il ne reste que le silence.',
      d: 'Le QG de la Dissonance. Orphée a réglé l’arène en « Canons de verre » : chaque coup compte double… pour tout le monde.',
    },
  ].filter(T => T.foes.every(([id]) => BY[id]));

  DISSONANCE.forEach((T, i) => {
    T.foes.forEach(([, , x]) => x && x.mv && (x.mv = x.mv.filter(m => MV[m])));
    SCEN[T.k] = {
      n: T.n,
      lvl: `Team Dissonance · combat ${i + 1} sur 4`,
      lim: 11,
      time: T.time,
      bio: T.bio,
      dissonance: i + 1,
      after: T.after,
      style: i === 3 ? 'boss' : null,
      at: T.at,
      mut: T.mut || null,
      water: T.water,
      rock: T.rock,
      hb: T.hb,
      pb: T.pb,
      lv: T.lv,
      d: T.d,
      foes: T.foes,
    };
    OBST[T.k] = i === 0 ? { grass: ['2,2', '3,2', '2,3'] } : {};
  });

  HOOKS.progress.push((S, rew, win) => {
    const D = SCEN[S.sc] || {};
    if (win && D.dissonance && (PROFILE.dissonance || 0) < D.dissonance) {
      PROFILE.dissonance = D.dissonance;
      const T = DISSONANCE[D.dissonance - 1];
      rew.dissonance = D.dissonance;
      return T.rew[0] || T.rew[1] ? [T.rew[0], T.rew[1]] : null;
    }
    return null;
  });

  HOOKS.battleResult.push(r => {
    if (!r.dissonance) {
      return '';
    }
    const T = DISSONANCE[r.dissonance - 1];
    return `<div class="res-l"><h4>Team Dissonance</h4><div class="rl"><span>${T.who} ${T.pl ? 'sont battus' : 'est battu'} (${r.dissonance} / 4). « ${T.w} »${r.dissonance === 4 ? ' La Team Dissonance est dissoute.' : ''}</span><b>${r.dissonance} / 4</b></div></div>`;
  });
}
