/* Original section: 4.63: team formations */

import { BY, SCEN } from './009-pokemon.js';
import { HOOKS } from './015-hooks.js';
import { renderSquad, squad } from './020-team-cards.js';
import { heal, say } from './021-combat-engine.js';
import { PREF, savePref, sfx, vibe } from './026-campaign-tutorial-sound.js';
import { DAMAGE_PROVIDERS } from './044-tactical-engine.js';
import { teamSize } from './048-replayability.js';

export let FORM463;
let DEF463, OFF463, SCOUT463, SUPPORT463;

const hasT463 = (m, L) => !!m && m.t.some(t => L.includes(t));


export const formKey463 = () => (FORM463[PREF.form463] ? PREF.form463 : 'libre');


export const formMs463 = () => squad.slice(0, teamSize()).map(id => BY[id]).filter(Boolean);


export const formOn463 = () => {
  const k = formKey463();
  return k !== 'libre' && FORM463[k].cond(formMs463());
};


const formS463 = S => {
  if (!S || S.fixe431 || (SCEN[S.sc] && SCEN[S.sc].tuto)) return null;
  const al = S.units.filter(u => u.side === 'a'),
    k = formKey463();
  if (k === 'libre' || !al.length || !FORM463[k].cond(al.map(u => BY[u.id]).filter(Boolean))) return null;
  return { k, al };
};

// Statements run at startup, in the original order (see index.js).
export function __init() {

DEF463 = ['Roche', 'Acier', 'Sol', 'Combat', 'Eau', 'Normal'],
  OFF463 = ['Feu', 'Combat', 'Dragon', 'Électrik', 'Spectre', 'Ténèbres', 'Roche', 'Sol'],
  SCOUT463 = ['Vol', 'Insecte', 'Électrik', 'Psy', 'Spectre'],
  SUPPORT463 = ['Plante', 'Fée', 'Eau', 'Normal', 'Psy'];


FORM463 = {
  libre: { n: 'Libre', d: 'Aucune contrainte, aucun bonus.', cond: () => true, need: '' },
  phalange: {
    n: 'Phalange',
    d: 'L’avant-garde garde sa Garde : elle est renouvelée à chaque manche.',
    need: 'Le 1er Pokémon doit être de type Roche, Acier, Sol, Combat, Eau ou Normal.',
    cond: ms => hasT463(ms[0], DEF463)
  },
  assaut: {
    n: 'Assaut',
    d: '+8 % de dégâts pour toute l’équipe.',
    need: 'Deux Pokémon au moins de type Feu, Combat, Dragon, Électrik, Spectre, Ténèbres, Roche ou Sol.',
    cond: ms => ms.filter(m => hasT463(m, OFF463)).length >= 2
  },
  eclaireurs: {
    n: 'Éclaireurs',
    d: 'Le dernier Pokémon commence avec 2 losanges, les autres avec 1.',
    need: 'Un Pokémon au moins de type Vol, Insecte, Électrik, Psy ou Spectre.',
    cond: ms => ms.some(m => hasT463(m, SCOUT463))
  },
  soutien: {
    n: 'Soutien',
    d: 'À chaque fin de manche, l’allié le plus blessé récupère 8 % de ses PV max.',
    need: 'Un Pokémon au moins de type Plante, Fée, Eau, Normal ou Psy.',
    cond: ms => ms.some(m => hasT463(m, SUPPORT463))
  }
};


HOOKS.combat.push(S => {
  const f = formS463(S);
  if (!f) return;
  S.form463 = f.k;
  if (f.k === 'phalange') f.al[0].guard = Math.max(f.al[0].guard || 0, 2);
  if (f.k === 'eclaireurs')
    f.al.forEach((u, i) => {
      u.en = Math.max(u.en || 0, i === f.al.length - 1 ? 2 : 1);
    });
});


HOOKS.avantFinManche.push((S, ev) => {
  if (!S.form463) return;
  const al = S.units.filter(u => u.side === 'a' && !u.ko);
  if (S.form463 === 'phalange' && al[0] && S.units.filter(u => u.side === 'a')[0] === al[0]) al[0].guard = Math.max(al[0].guard || 0, 1);
  if (S.form463 === 'soutien') {
    const b = al.filter(u => u.hp < u.mhp).sort((a, b2) => a.hp / a.mhp - b2.hp / b2.mhp)[0];
    if (b) {
      heal(S, b, Math.max(1, Math.round(b.mhp * 0.08)), ev);
      say(ev, `Formation Soutien : ${b.n} récupère des forces.`);
    }
  }
});


DAMAGE_PROVIDERS.push({ id: 'assaut463', fournir: (c, { S, u }) => !!u && u.side === 'a' && !!S && S.form463 === 'assaut' && { mul: 1.08, libelle: 'Formation Assaut' } });


// "Formation" card of the team analysis: rendered by React (src/screens/team/Analysis.jsx)


document.addEventListener(
  'click',
  e => {
    const b = e.target.closest && e.target.closest('[data-fm463]');
    if (!b) return;
    e.stopPropagation();
    e.preventDefault();
    PREF.form463 = b.dataset.fm463;
    savePref();
    sfx('ui');
    vibe(15);
    try {
      renderSquad();
    } catch (x) {}
  },
  true
);

}
