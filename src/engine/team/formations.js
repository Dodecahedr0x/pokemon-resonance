/* Team formations (added in v4.63). */

import { BY, SCEN } from '../pokemon/pokemon.js';
import { HOOKS } from '../core/hooks.js';
import { renderSquad, squad } from './team.js';
import { heal, say } from '../combat/engine.js';
import { PREF, savePref } from '../ui/preferences.js';
import { sfx, vibe } from '../audio/sound-effects.js';
import { DAMAGE_PROVIDERS } from '../combat/tactical-engine.js';
import { teamSize } from '../progression/campaign-challenges.js';

export let FORMATIONS;
let DEFENSIVE_TYPES, OFFENSIVE_TYPES, SCOUT_TYPES, SUPPORT_TYPES;

const hasAnyType = (m, L) => !!m && m.t.some(t => L.includes(t));

export const formationKey = () => (FORMATIONS[PREF.activeFormation] ? PREF.activeFormation : 'libre');

export const formationTeam = () =>
  squad
    .slice(0, teamSize())
    .map(id => BY[id])
    .filter(Boolean);

export const formationActive = () => {
  const k = formationKey();
  return k !== 'libre' && FORMATIONS[k].condition(formationTeam());
};

const formationBonus = S => {
  if (!S || S.restricted || (SCEN[S.sc] && SCEN[S.sc].tuto)) {
    return null;
  }
  const al = S.units.filter(u => u.side === 'a'),
    k = formationKey();
  if (k === 'libre' || !al.length || !FORMATIONS[k].condition(al.map(u => BY[u.id]).filter(Boolean))) {
    return null;
  }
  return { k, al };
};

// Statements run at startup, in the original order (see index.js).
export function init() {
  ((DEFENSIVE_TYPES = ['Roche', 'Acier', 'Sol', 'Combat', 'Eau', 'Normal']),
    (OFFENSIVE_TYPES = ['Feu', 'Combat', 'Dragon', 'Électrik', 'Spectre', 'Ténèbres', 'Roche', 'Sol']),
    (SCOUT_TYPES = ['Vol', 'Insecte', 'Électrik', 'Psy', 'Spectre']),
    (SUPPORT_TYPES = ['Plante', 'Fée', 'Eau', 'Normal', 'Psy']));

  FORMATIONS = {
    libre: { n: 'Libre', d: 'Aucune contrainte, aucun bonus.', condition: () => true, need: '' },
    phalange: {
      n: 'Phalange',
      d: 'L’avant-garde garde sa Garde : elle est renouvelée à chaque manche.',
      need: 'Le 1er Pokémon doit être de type Roche, Acier, Sol, Combat, Eau ou Normal.',
      condition: ms => hasAnyType(ms[0], DEFENSIVE_TYPES),
    },
    assaut: {
      n: 'Assaut',
      d: '+8 % de dégâts pour toute l’équipe.',
      need: 'Deux Pokémon au moins de type Feu, Combat, Dragon, Électrik, Spectre, Ténèbres, Roche ou Sol.',
      condition: ms => ms.filter(m => hasAnyType(m, OFFENSIVE_TYPES)).length >= 2,
    },
    eclaireurs: {
      n: 'Éclaireurs',
      d: 'Le dernier Pokémon commence avec 2 losanges, les autres avec 1.',
      need: 'Un Pokémon au moins de type Vol, Insecte, Électrik, Psy ou Spectre.',
      condition: ms => ms.some(m => hasAnyType(m, SCOUT_TYPES)),
    },
    soutien: {
      n: 'Soutien',
      d: 'À chaque fin de manche, l’allié le plus blessé récupère 8 % de ses PV max.',
      need: 'Un Pokémon au moins de type Plante, Fée, Eau, Normal ou Psy.',
      condition: ms => ms.some(m => hasAnyType(m, SUPPORT_TYPES)),
    },
  };

  HOOKS.combat.push(S => {
    const f = formationBonus(S);
    if (!f) {
      return;
    }
    S.activeFormation = f.k;
    if (f.k === 'phalange') {
      f.al[0].guard = Math.max(f.al[0].guard || 0, 2);
    }
    if (f.k === 'eclaireurs') {
      f.al.forEach((u, i) => {
        u.en = Math.max(u.en || 0, i === f.al.length - 1 ? 2 : 1);
      });
    }
  });

  HOOKS.beforeRoundEnd.push((S, ev) => {
    if (!S.activeFormation) {
      return;
    }
    const al = S.units.filter(u => u.side === 'a' && !u.ko);
    if (S.activeFormation === 'phalange' && al[0] && S.units.filter(u => u.side === 'a')[0] === al[0]) {
      al[0].guard = Math.max(al[0].guard || 0, 1);
    }
    if (S.activeFormation === 'soutien') {
      const b = al.filter(u => u.hp < u.mhp).sort((a, b2) => a.hp / a.mhp - b2.hp / b2.mhp)[0];
      if (b) {
        heal(S, b, Math.max(1, Math.round(b.mhp * 0.08)), ev);
        say(ev, `Formation Soutien : ${b.n} récupère des forces.`);
      }
    }
  });

  DAMAGE_PROVIDERS.push({
    id: 'assault-bonus',
    provide: (c, { S, u }) =>
      !!u && u.side === 'a' && !!S && S.activeFormation === 'assaut' && { mul: 1.08, labelText: 'Formation Assaut' },
  });

  // "Formation" card of the team analysis: rendered by React (src/screens/team/Analysis.jsx)

  document.addEventListener(
    'click',
    e => {
      const b = e.target.closest && e.target.closest('[data-form-picker]');
      if (!b) {
        return;
      }
      e.stopPropagation();
      e.preventDefault();
      PREF.activeFormation = b.dataset.formPicker;
      savePref();
      sfx('ui');
      vibe(15);
      try {
        renderSquad();
      } catch {
        /* Best effort: failure here is non-fatal. */
      }
    },
    true
  );
}
