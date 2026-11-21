import { SCENARIOS } from '../pokemon/pokemon.js';
import { PROFILE } from '../state/game-state.js';
import { ARENAS } from '../modes/gyms.js';
import { MAX_ENERGY, affected, damageOf, hasNx, markAt, moveType, unitAt, unitKey } from './engine.js';

/* Leader play styles: each gym leader, the rival and legendary bosses steer the AI their own way (added in v4.4). */

const STYLES = {
  rempart: { n: 'Rempart', d: 'Il s’ancre, se protège et frappe en zone.' },
  maree: { n: 'Marée', d: 'Elle trempe tout le plateau avant de frapper.' },
  chaine: { n: 'Court-circuit', d: 'Il vise en priorité vos Pokémon trempés ou chargés.' },
  ronces: { n: 'Ronces', d: 'Elle enracine et endort, puis s’acharne sur ceux qui ne bougent plus.' },
  usure: { n: 'Usure', d: 'Il préfère altérer vos Pokémon et les épuiser à petit feu.' },
  controle: { n: 'Contrôle', d: 'Elle repousse, attire, provoque et désoriente.' },
  assaut: { n: 'Assaut', d: 'Elle achève sans pitié les Pokémon blessés.' },
  seisme: { n: 'Séisme', d: 'Il cherche à toucher plusieurs Pokémon d’un seul coup.' },
  piege: { n: 'Piège', d: 'Elle immobilise et vise ceux qui sont sur le point de s’éveiller.' },
  rival: { n: 'Rival', d: 'Kael vise votre partenaire de départ et les Pokémon qu’il peut mettre K.O.' },
  boss: { n: 'Légende', d: 'Concentre ses coups et frappe plusieurs cibles dès qu’il le peut.' },
};

const IMMOBILE = ['root', 'web', 'sleep'];

const CTRL = ['push', 'pull', 'confuse', 'turn', 'taunt', 'swap'];

export const styleOf = k => STYLES[(SCENARIOS[k] || {}).style] || null;

/* AI bonus according to the leader's style (added to the score of an attack that hits your Pokémon) */
export function aiStyleBonus(S, e, m, k, sim) {
  const sty = (SCENARIOS[S.sc] || {}).style;
  if (!sty) {
    return 0;
  }
  const hit = affected(S, sim, m, k)
    .map(x => unitAt(S, x))
    .filter(v => v && v.side === 'a' && v !== e);
  if (!hit.length) {
    return 0;
  }
  let b = 0;
  if (sty === 'rempart') {
    if (['guard', 'gguard', 'protect', 'reflect'].includes(m.fx) || m.sh === 'self') {
      b += 5;
    }
    if (hit.length > 1) {
      b += 3;
    }
  } else if (sty === 'maree') {
    if (m.mk === 'trempe' || m.wx === 'pluie') {
      b += 5 + affected(S, sim, m, k).length;
    }
    if (m.t === 'Eau') {
      b += 2;
    }
  } else if (sty === 'chaine') {
    hit.forEach(v => {
      const mk = markAt(S, unitKey(v));
      if (mk === 'trempe' || mk === 'charge') {
        b += m.t === 'Électrik' ? 9 : 3;
      }
    });
    if (m.mk === 'charge' || m.mk === 'trempe') {
      b += 2;
    }
  } else if (sty === 'ronces') {
    if (IMMOBILE.includes(m.fx) || m.mk === 'enracine') {
      b += 6;
    }
    hit.forEach(v => {
      if (v.root > 0 || v.web > 0 || v.badge === 'SOM') {
        b += 3;
      }
    });
  } else if (sty === 'usure') {
    if (!m.p && !m.fix) {
      b += 4;
    }
    hit.forEach(v => {
      if (v.badge || v.burn > 0) {
        b += 3;
      }
    });
  } else if (sty === 'controle') {
    if (CTRL.includes(m.fx)) {
      b += 6;
    }
  } else if (sty === 'assaut') {
    hit.forEach(v => (b += (1 - v.hp / v.mhp) * 10));
  } else if (sty === 'seisme') {
    b += (hit.length - 1) * 4;
  } else if (sty === 'piege') {
    if (IMMOBILE.includes(m.fx)) {
      b += 6;
    }
    hit.forEach(v => {
      if (hasNx(v) && v.en >= MAX_ENERGY - 1) {
        b += 6;
      }
    });
  } else if (sty === 'rival') {
    hit.forEach(v => {
      if (v.sp === (PROFILE.box && PROFILE.box[0])) {
        b += 5;
      }
      if (damageOf(S, sim, m, v, moveType(S, sim, m), 1) >= v.hp) {
        b += 4;
      }
    });
  } else if (sty === 'boss') {
    b += (hit.length - 1) * 3;
    hit.forEach(v => (b += (1 - v.hp / v.mhp) * 6));
  }
  return b;
}

// Statements run at startup, in the original order (see index.js).
export function init() {
  ['rempart', 'maree', 'chaine', 'ronces', 'usure', 'controle', 'assaut', 'seisme'].forEach((s, i) => {
    if (SCENARIOS[ARENAS[i].k]) {
      SCENARIOS[ARENAS[i].k].style = s;
    }
  });
}
