/* Section d'origine : 4.63 : formations d’équipe */

import { BY, SCEN } from './009-03-pokemon.js';
import { CROCHETS } from './015-v4-8-00-crochets.js';
import { renderSquad, squad } from './020-13-equipe-cartes.js';
import { heal, say } from './021-14-moteur-combat.js';
import { PREF, savePref, sfx, vibe } from './026-20-campagne-tutoriel-son.js';
import { FOURNISSEURS_DEGATS } from './044-v4-5-01-moteur-tactique.js';
import { tailleEquipe } from './048-v4-9-01-rejouabilite.js';

export let FORM463;
let DEF463, OFF463, ECL463, SOU463;

const hasT463 = (m, L) => !!m && m.t.some(t => L.includes(t));


export const formCle463 = () => (FORM463[PREF.form463] ? PREF.form463 : 'libre');


export const formMs463 = () => squad.slice(0, tailleEquipe()).map(id => BY[id]).filter(Boolean);


export const formOn463 = () => {
  const k = formCle463();
  return k !== 'libre' && FORM463[k].cond(formMs463());
};


const formS463 = S => {
  if (!S || S.fixe431 || (SCEN[S.sc] && SCEN[S.sc].tuto)) return null;
  const al = S.units.filter(u => u.side === 'a'),
    k = formCle463();
  if (k === 'libre' || !al.length || !FORM463[k].cond(al.map(u => BY[u.id]).filter(Boolean))) return null;
  return { k, al };
};

// Instructions exécutées au démarrage, dans l'ordre d'origine (voir index.js).
export function __init() {

DEF463 = ['Roche', 'Acier', 'Sol', 'Combat', 'Eau', 'Normal'],
  OFF463 = ['Feu', 'Combat', 'Dragon', 'Électrik', 'Spectre', 'Ténèbres', 'Roche', 'Sol'],
  ECL463 = ['Vol', 'Insecte', 'Électrik', 'Psy', 'Spectre'],
  SOU463 = ['Plante', 'Fée', 'Eau', 'Normal', 'Psy'];


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
    cond: ms => ms.some(m => hasT463(m, ECL463))
  },
  soutien: {
    n: 'Soutien',
    d: 'À chaque fin de manche, l’allié le plus blessé récupère 8 % de ses PV max.',
    need: 'Un Pokémon au moins de type Plante, Fée, Eau, Normal ou Psy.',
    cond: ms => ms.some(m => hasT463(m, SOU463))
  }
};


CROCHETS.combat.push(S => {
  const f = formS463(S);
  if (!f) return;
  S.form463 = f.k;
  if (f.k === 'phalange') f.al[0].guard = Math.max(f.al[0].guard || 0, 2);
  if (f.k === 'eclaireurs')
    f.al.forEach((u, i) => {
      u.en = Math.max(u.en || 0, i === f.al.length - 1 ? 2 : 1);
    });
});


CROCHETS.avantFinManche.push((S, ev) => {
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


FOURNISSEURS_DEGATS.push({ id: 'assaut463', fournir: (c, { S, u }) => !!u && u.side === 'a' && !!S && S.form463 === 'assaut' && { mul: 1.08, libelle: 'Formation Assaut' } });


// carte « Formation » de l'analyse d'équipe : rendue par React (src/screens/equipe/Analyse.jsx)


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
