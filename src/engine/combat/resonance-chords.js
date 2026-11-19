import { tc } from '../core/utils.js';
import {
  damage,
  endStep,
  flies,
  hdist,
  heal,
  mDur,
  markAt,
  mvType,
  nbrK,
  say,
  setMark,
  stun,
  uAt,
  uk,
} from './engine.js';

/* =====================================================================
   Resonance Chords (Advanced Tactics, added in v4.10): within a single
   round, three attacks from your Pokémon whose types form a chord
   trigger a team effect (Storm = Water + Electric + Flying, Forge =
   Fire + Rock + Steel…). One chord per round. A chip tracks the types
   played.
   ===================================================================== */

/** After an ally's action: the type counts toward the round's chord. */
export function chordAfter(S, u, m, ev) {
  if (!S.tac || u.side !== 'a' || S.over || !m || !(m.p || m.fix || m.mk)) {
    return;
  }
  if (!S.acc || S.acc.r !== S.round) {
    S.acc = { r: S.round, t: [], fait: null };
  }
  const typ = mvType(S, u, m);
  if (!S.acc.t.includes(typ)) {
    S.acc.t.push(typ);
  }
  if (S.acc.fait) {
    return;
  }
  const A = CHORDS.find(a => a.t.every(t => S.acc.t.includes(t)));
  if (!A) {
    return;
  }
  S.acc.fait = A.id;
  S.stats.accords = (S.stats.accords || 0) + 1;
  ev.push({ e: 'arena' });
  say(ev, `Accord de Résonance · ${A.n} ! ${A.d}`);
  playChord(S, A.id, u, ev);
  ev.push({ e: 'terrain' });
  endStep(S, ev);
}

function playChord(S, id, u, ev) {
  const foes = S.units.filter(o => o.side === 'e' && !o.ko),
    mates = S.units.filter(o => o.side === 'a' && !o.ko),
    onGround = o => !flies(o);
  if (id === 'orage') {
    foes.forEach(o => {
      if (markAt(S, uk(o)) !== 'trempe') {
        return;
      }
      damage(S, o, 6, ev, { ind: true });
      if (!o.ko) {
        stun(S, o, 'PAR', ev, true);
      }
    });
  } else if (id === 'forge') {
    mates.forEach(o => (o.guard = 2));
    foes.forEach(o => {
      if ([uk(o), ...nbrK(uk(o))].some(k => S.tiles[k].mark && S.tiles[k].mark.k === 'brulant')) {
        damage(S, o, 5, ev, { ind: true });
      }
    });
  } else if (id === 'seisme') {
    foes.filter(onGround).forEach(o => {
      damage(S, o, 6, ev, { ind: true });
      setMark(S, uk(o), 'fissure', u.uid);
    });
  } else if (id === 'floraison') {
    mates.forEach(o => {
      heal(S, o, Math.round(o.mhp * 0.25), ev);
      o.burn = 0;
      o.web = 0;
      o.root = 0;
    });
  } else if (id === 'banquise') {
    for (const k in S.tiles) {
      const t = S.tiles[k];
      if (!(t.mark && t.mark.k === 'trempe') && !t.w) {
        continue;
      }
      if (t.mark && t.mark.k === 'trempe') {
        t.mark = { k: 'givre', d: mDur(S, 'givre'), lv: 1, by: u.uid };
      }
      const o = uAt(S, k);
      if (o && o.side === 'e' && !o.t.includes('Glace')) {
        stun(S, o, 'GEL', ev, true);
      }
    }
  } else if (id === 'eclipse') {
    foes
      .filter(o => (S.jit ? !o.isLost && !o.badge : o.intent) && !o.done)
      .sort((a, b) => hdist(a.pos, u.pos) - hdist(b.pos, u.pos))
      .slice(0, 2)
      .forEach(o => {
        o.intent = null;
        if (S.jit) {
          o.isLost = 1;
        }
        say(
          ev,
          S.jit
            ? `${o.n} se perd dans l’ombre : il ne jouera pas cette manche.`
            : `L’attaque de ${o.n} se perd dans l’ombre.`
        );
      });
  } else if (id === 'incendie') {
    for (const k in S.tiles) {
      const t = S.tiles[k];
      if (!t.grass || t.rock) {
        continue;
      }
      t.grass = false;
      t.mark = { k: 'brulant', d: mDur(S, 'brulant'), lv: 1, by: u.uid };
      const o = uAt(S, k);
      if (o && o.side === 'e' && onGround(o) && !o.t.includes('Feu')) {
        o.burn = Math.max(o.burn, 2);
      }
    }
  } else if (id === 'voltige') {
    S.voice = Math.min(S.vmax + 2, S.voice + 2);
  } else if (id === 'draco') {
    foes.forEach(o => damage(S, o, 8, ev, { ind: true }));
  } else if (id === 'venin') {
    foes
      .filter(o => mates.some(a => hdist(a.pos, o.pos) <= 2))
      .forEach(o => {
        damage(S, o, 4, ev, { ind: true });
        if (!o.ko && o.ability !== 'regardvif') {
          o.web = Math.max(o.web, 2);
        }
      });
  }
}

/** The chord chip: the types played this round, and the closest chord. */
export function chipChord(S) {
  if (!S || !S.tac || S.over) {
    return '';
  }
  const t = S.acc && S.acc.r === S.round ? S.acc.t : [];
  if (S.acc && S.acc.r === S.round && S.acc.fait) {
    const A = CHORDS.find(a => a.id === S.acc.fait);
    return `<span class="chip chip-acc fait" title="${A.d}">Accord joué · ${A.n}</span>`;
  }
  let best = null,
    bn = 0;
  CHORDS.forEach(a => {
    const n = a.t.filter(x => t.includes(x)).length;
    if (n > bn) {
      bn = n;
      best = a;
    }
  });
  const dots = t.map(x => `<i style="background:${tc(x)}" title="${x}"></i>`).join('');
  const hint = best ? `${best.n} : il manque ${best.t.filter(x => !t.includes(x)).join(' et ')}` : 'enchaînez 3 types';
  return `<span class="chip chip-acc" title="${CHORDS.map(a => `${a.n} = ${a.t.join(' + ')}`).join(' · ')}">${dots}Accord · ${hint}</span>`;
}

// the Guide: the list of chords, rendered by React (Tactics.jsx)

export const CHORDS = [
  {
    id: 'orage',
    n: 'Orage',
    t: ['Eau', 'Électrik', 'Vol'],
    d: 'Tout adversaire sur une case Trempée ou dans l’eau est paralysé et subit 6 dégâts.',
  },
  {
    id: 'forge',
    n: 'Forge',
    t: ['Feu', 'Roche', 'Acier'],
    d: 'Vos Pokémon gagnent +2 Garde ; tout adversaire au contact d’une case Brûlante subit 5 dégâts.',
  },
  {
    id: 'seisme',
    n: 'Grand Séisme',
    t: ['Sol', 'Roche', 'Combat'],
    d: 'Tout adversaire au sol subit 6 dégâts et sa case devient Fissurée.',
  },
  {
    id: 'floraison',
    n: 'Grande Floraison',
    t: ['Plante', 'Eau', 'Fée'],
    d: 'Vos Pokémon récupèrent 25 % de leurs PV et sont libérés des brûlures et entraves.',
  },
  {
    id: 'banquise',
    n: 'Banquise',
    t: ['Glace', 'Eau', 'Vol'],
    d: 'Les cases Trempées gèlent ; les adversaires dessus sont gelés.',
  },
  {
    id: 'eclipse',
    n: 'Éclipse',
    t: ['Spectre', 'Ténèbres', 'Psy'],
    d: 'Les 2 adversaires les plus proches perdent leur prochaine action.',
  },
  {
    id: 'incendie',
    n: 'Incendie',
    t: ['Feu', 'Plante', 'Vol'],
    d: 'Toutes les hautes herbes s’embrasent ; les adversaires dedans sont brûlés.',
  },
  { id: 'voltige', n: 'Voltige', t: ['Normal', 'Vol', 'Combat'], d: '+2 Voix tout de suite.' },
  {
    id: 'draco',
    n: 'Rugissement draconique',
    t: ['Dragon', 'Feu', 'Électrik'],
    d: 'Tous les adversaires subissent 8 dégâts.',
  },
  {
    id: 'venin',
    n: 'Venin',
    t: ['Poison', 'Insecte', 'Plante'],
    d: 'Les adversaires à 2 cases ou moins de vos Pokémon sont englués et subissent 4 dégâts.',
  },
];
