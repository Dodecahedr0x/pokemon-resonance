/* Section d'origine : v4.12-01-ct-epiques.js */

import { MV } from './005-02-capacites.js';
import { CROCHETS } from './015-v4-8-00-crochets.js';
import { byUid, damage, fin, hdist, heal, nbrK, net, say, stun, teff, uAt } from './021-14-moteur-combat.js';
import { poly } from './024-17-interface-combat.js';
import { SHOP } from './032-v4-00-socle.js';
import { FOURNISSEURS_DEGATS, FOURNISSEURS_VITESSE } from './044-v4-5-01-moteur-tactique.js';
import { MACHINES } from './045-v4-6-01-ct-cs.js';
import { de } from './047-v4-8-01-tactique.js';
import { bonusMouv413, durees413, rune413 } from './052-v4-13-01-roster-technique.js';
import { bonusMouv414 } from './053-v4-14-01-resonance.js';

export let SOI412, CIBLE412;


/* ---------- effets sur chaque cible touchée ---------- */
export function empoisonner(S, v, ev) {
  if (!v || v.ko) return false;
  if (v.t.includes('Poison') || v.t.includes('Acier')) {
    say(ev, `${v.n} ne craint pas le poison.`);
    return false;
  }
  if (rune413(S, v)) {
    say(ev, `Rune Protect : ${v.n} est protégé.`);
    return false;
  }
  v.psn = 3;
  say(ev, `${v.n} est empoisonné.`);
  return true;
}


export function bonusMouv412(S, u) {
  let b = 0;
  if (S.arriere && S.arriere[u.side] > 0) b += 2;
  if (S.distorsion > 0 && u.s[3] <= 2) b += 1;
  b += bonusMouv413(S, u) + bonusMouv414(S, u); // Mouchoir Choix (v4.14)
  return b;
}


export function durees412(S, ev) {
  if (S.arriere)
    for (const c in S.arriere)
      if (S.arriere[c] > 0 && --S.arriere[c] === 0) say(ev, `Le Vent Arrière ${c === 'a' ? 'de votre équipe' : 'adverse'} retombe.`);
  if (S.distorsion > 0 && --S.distorsion === 0) say(ev, 'La Distorsion se dissipe.');
  durees413(S, ev);
}


/* ---------- Prescience ---------- */
export function poserPrescience(S, u, m, k, ev) {
  S.presc = S.presc || [];
  S.presc.push({ k, by: u.uid, side: u.side, at: S.round + 1, p: m.pp || 14 });
  say(ev, `${u.n} prévoit l’avenir : une onde Psy frappera cette zone à la fin de la manche suivante.`);
  ev.push({ e: 'terrain', k });
}


function frapperPrescience(S, P0, ev) {
  const u = byUid(S, P0.by),
    zone = [P0.k, ...nbrK(P0.k)].filter(x => S.tiles[x] && !S.tiles[x].rock),
    touches = zone.map(x => uAt(S, x)).filter(v => v && !v.ko && v.side !== P0.side);
  say(ev, `Prescience : l’onde Psy ${u ? de(u.n) + ' ' : ''}s’abat${touches.length ? '' : ' sur une zone vide'} !`);
  touches.forEach(v => {
    const e = teff('Psy', v.t);
    if (!e) {
      say(ev, `Ça n’affecte pas ${v.n}.`);
      return;
    }
    const atk = u ? u.s[1] : 3,
      stab = u && u.t.includes('Psy') ? 1.2 : 1;
    damage(S, v, Math.max(1, Math.round((P0.p + atk * 2) * e * stab)), ev, {});
    if (e > 1) say(ev, 'C’est super efficace !');
  });
}


export function prescSurPlateau(S) {
  if (!S || !S.presc || !S.presc.length) return '';
  let h = '';
  S.presc.forEach(x =>
    [x.k, ...nbrK(x.k)].forEach(k => {
      if (S.tiles[k] && !S.tiles[k].rock) h += poly(k, 'h-presc' + (x.at <= S.round ? ' now' : ''));
    })
  );
  return h;
}


/* ---------- bandeau du combat ---------- */
export function chips412(S) {
  if (!S) return '';
  let h = '';
  if (S.arriere && S.arriere.a > 0) h += `<span class="chip chip-412" title="+2 Mouvement pour votre équipe">Vent Arrière · ${S.arriere.a}</span>`;
  if (S.arriere && S.arriere.e > 0) h += `<span class="chip chip-412 en" title="+2 Mouvement pour l’équipe adverse">Vent Arrière adverse · ${S.arriere.e}</span>`;
  if (S.distorsion > 0) h += `<span class="chip chip-412" title="Vitesse 2 ou moins : ×1,3 et +1 Mouvement">Distorsion · ${S.distorsion}</span>`;
  if (S.presc && S.presc.length) h += `<span class="chip chip-412" title="Onde Psy à venir">Prescience · ${S.presc.length}</span>`;
  if (S.gravite > 0) h += `<span class="chip chip-412" title="Personne ne vole, −1 Mouvement">Gravité · ${S.gravite}</span>`;
  if (S.rune && S.rune.a > 0) h += `<span class="chip chip-412" title="Vos Pokémon sont protégés des statuts">Rune Protect · ${S.rune.a}</span>`;
  if (S.champ && S.champ.a > 0) h += `<span class="chip chip-412" title="Cases Enracinées : +4 PV par manche">Champ Herbu · ${S.champ.a}</span>`;
  if (S.harmonie) h += `<span class="chip chip-412" title="Trois rangs différents : chaque Pokémon a commencé avec 1 losange">Harmonie</span>`; // v4.14
  return h;
}

// Instructions exécutées au démarrage, dans l'ordre d'origine (voir index.js).
export function __init() {

/* =====================================================================
   v4.12 : CT épiques
   ---------------------------------------------------------------------
   Onze machines dont l’attaque n’appartient à aucun Pokémon. Chacune
   ouvre une construction d’équipe :
     Tempête      Onde de Choc    + Danse Pluie / Crachin / cases Trempées
     Forge        Déflagration    + Zénith / cases Enracinées (Embrasement)
     Toxines      Bombe Beurk     + eau reliée / synergie Toxines
     Hypnose      Dévorêve        + Hypnose / Berceuse / Poudre Dodo
     Banquise     Vent Glace      + Bris / Banquise
     Orage-Dragon Draco-Souffle   + Cage-Éclair / Statik
     Soutien      Coup d’Main     + un Frappeur qui n’a pas joué
     Assaut       Vent Arrière    + Frappeurs au contact
     Colosses     Distorsion      + Pokémon lents (Ronflex, Donphan, Steelix…)
     Oracle       Prescience      + Racines / Toile / Regard Noir
     Infirmerie   Glas de Soin    + contre Psy, Poison et Spectre
   ===================================================================== */
Object.assign(MV, {
  ondedechoc: {
    n: 'Onde de Choc',
    t: 'Électrik',
    p: 13,
    r: 3,
    sh: 'one',
    mk: 'charge',
    pluie: 1,
    d: 'Portée 3, Chargé. Sous la Pluie : portée 5 et frappe les 7 cases de la zone. Combo : Danse Pluie, Crachin, cases Trempées (Court-circuit).'
  },
  deflagration: {
    n: 'Déflagration',
    t: 'Feu',
    p: 12,
    r: 3,
    sh: 'area',
    mk: 'brulant',
    fx: 'recharge',
    d: 'Zone de 7 cases à 3 cases, Brûlant, alliés compris. Puis une manche de repos. Combo : Zénith, cases Enracinées (Embrasement).'
  },
  bombebeurk: {
    n: 'Bombe Beurk',
    t: 'Poison',
    p: 9,
    r: 3,
    sh: 'one',
    fx: 'toxik',
    d: 'Portée 3. Empoisonne : −3 PV par manche, 3 manches. Sur une case Trempée, le poison gagne toute l’eau reliée. Combo : Pistolet à O, Surf, synergie Toxines.'
  },
  devoreve: {
    n: 'Dévorêve',
    t: 'Psy',
    p: 18,
    r: 2,
    sh: 'one',
    fx: 'devoreve',
    d: 'Portée 2, seulement sur une cible endormie : dégâts énormes, et soigne la moitié. Combo : Hypnose, Berceuse, Poudre Dodo.'
  },
  ventglace: {
    n: 'Vent Glace',
    t: 'Glace',
    p: 6,
    r: 1,
    sh: 'cone',
    mk: 'givre',
    fx: 'ventglace',
    d: 'Cône de 3 cases, Givré : chaque adversaire touché perd 3 Mouvement pendant 2 manches. Combo : Bris (Combat, Roche), Banquise.'
  },
  dracosouffle: {
    n: 'Draco-Souffle',
    t: 'Dragon',
    p: 9,
    r: 2,
    sh: 'line',
    fx: 'dracosouffle',
    d: 'Ligne de 2, aucune réaction : paralyse chaque cible sur une case Chargée. Combo : Cage-Éclair, Éclair, Statik.'
  },
  coupdmain: {
    n: 'Coup d’Main',
    t: 'Normal',
    p: 0,
    r: 2,
    sh: 'ally',
    fx: 'aide',
    d: 'Un allié à 2 cases : sa prochaine attaque de la manche frappe ×1,5, réactions comprises. Combo : un Frappeur qui n’a pas encore joué.'
  },
  ventarriere: {
    n: 'Vent Arrière',
    t: 'Vol',
    p: 0,
    r: 0,
    sh: 'self',
    fx: 'arriere',
    d: 'Pendant 3 manches, toute votre équipe gagne +2 Mouvement (Vitesse ×1,5 en ordre par Vitesse). Combo : Frappeurs au contact, Éclaireurs.'
  },
  distorsion: {
    n: 'Distorsion',
    t: 'Psy',
    p: 0,
    r: 0,
    sh: 'self',
    fx: 'distorsion',
    d: 'Pendant 4 manches, les Pokémon lents (Vitesse 2 ou moins) frappent ×1,3 et gagnent +1 Mouvement, adversaires compris ; en ordre par Vitesse, les plus lents jouent d’abord. Combo : Ronflex, Donphan, Tortank, Steelix.'
  },
  prescience: {
    n: 'Prescience',
    t: 'Psy',
    p: 0,
    pp: 14,
    r: 4,
    sh: 'one',
    fx: 'presc',
    d: 'Vise une case à 4 cases : à la fin de la manche suivante, une onde Psy (puissance 14) frappe cette case et ses voisines, sans tenir compte de la Garde. Combo : Racines, Toile, Regard Noir.'
  },
  glasdesoin: {
    n: 'Glas de Soin',
    t: 'Normal',
    p: 0,
    r: 0,
    sh: 'self',
    fx: 'glas',
    d: 'Vos Pokémon à 2 cases, lui compris, sont guéris (sommeil, paralysie, gel, brûlure, poison, entraves) et récupèrent 10 % de leurs PV.'
  }
});


[
  ['ct34', { num: 'CT34', mv: 'ondedechoc', p: 4500, types: ['Électrik', 'Eau', 'Dragon'] }],
  ['ct38', { num: 'CT38', mv: 'deflagration', p: 4500, types: ['Feu', 'Dragon'], familles: ['ronflex', 'embrylex'] }],
  ['ct36', { num: 'CT36', mv: 'bombebeurk', p: 3500, types: ['Poison'], familles: ['ronflex'] }],
  ['ct42', { num: 'CT42', mv: 'devoreve', p: 4000, types: ['Psy', 'Spectre'], familles: ['melo', 'ronflex'] }],
  ['ct16', { num: 'CT16', mv: 'ventglace', p: 3000, types: ['Glace', 'Eau', 'Vol'] }],
  ['ct24', { num: 'CT24', mv: 'dracosouffle', p: 3500, types: ['Dragon'], familles: ['salameche', 'magicarpe', 'wattouat', 'onix', 'embrylex'] }],
  ['ct51', { num: 'CT51', mv: 'coupdmain', p: 3000, tous: true }],
  ['ct52', { num: 'CT52', mv: 'ventarriere', p: 3500, types: ['Vol'] }],
  ['ct53', { num: 'CT53', mv: 'distorsion', p: 4000, types: ['Psy'], familles: ['ramoloss', 'ronflex', 'melo', 'fantominus', 'phanpy', 'pomdepik'] }],
  ['ct54', { num: 'CT54', mv: 'prescience', p: 4000, types: ['Psy'], familles: ['melo', 'ramoloss', 'evoli'] }],
  ['ct55', { num: 'CT55', mv: 'glasdesoin', p: 2500, types: ['Normal', 'Fée'], familles: ['germignon', 'chenipan'] }]
].forEach(([k, M]) => {
  MACHINES[k] = M;
  const m = MV[M.mv];
  SHOP[k] = {
    n: `${M.num} · ${m.n}`,
    sn: M.num,
    d: `${m.t} · ${m.p ? 'Puissance ' + m.p + ' · ' : m.pp ? 'Puissance ' + m.pp + ' · ' : ''}${m.d} Usage unique.`,
    cat: 'machines',
    mv: M.mv,
    cs: false,
    p: M.p
  };
});


/* ---------- effets sur soi ---------- */
SOI412 = {
  arriere(S, u, ev) {
    S.arriere = Object.assign({}, S.arriere, { [u.side]: 3 });
    say(ev, `Vent Arrière : ${u.side === 'a' ? 'votre équipe' : 'l’équipe adverse'} gagne +2 Mouvement pendant 3 manches.`);
  },
  distorsion(S, u, ev) {
    S.distorsion = 4;
    say(ev, 'Distorsion : pendant 4 manches, les Pokémon lents frappent ×1,3 et gagnent +1 Mouvement.');
  },
  glas(S, u, ev) {
    const soignes = S.units.filter(o => !o.ko && o.side === u.side && hdist(o.pos, u.pos) <= 2);
    soignes.forEach(o => {
      const avait = !!(o.badge || o.skip || o.bru || o.psn || o.web || o.root);
      if (o.sn && o !== u && o.side === 'a' && S.phase === 'player') {
        o.sn = false; // réveillé : il peut encore jouer cette manche
        o.acted = false;
        o.moved = false;
      }
      o.badge = null;
      o.skip = 0;
      o.bru = 0;
      o.psn = 0;
      o.web = 0;
      o.root = 0;
      heal(S, o, Math.round(o.mhp * 0.1), ev);
      if (avait) ev.push({ e: 'st', u: o.uid, s: 'SOIN' });
    });
    say(ev, `Glas de Soin : ${soignes.map(o => o.n).join(', ')} ${soignes.length > 1 ? 'sont guéris' : 'est guéri'}.`);
  }
};


CIBLE412 = {
  ventglace(S, u, v, k, mk, ev) {
    if (v.tal === 'regardvif' || rune413(S, v)) say(ev, `${v.n} ignore l’entrave.`);
    else {
      v.web = Math.max(v.web, 2);
      say(ev, `${v.n} est ralenti par le froid.`);
    }
  },
  dracosouffle(S, u, v, k, mk, ev) {
    if (mk === 'charge') stun(S, v, 'PAR', ev);
  },
  toxik(S, u, v, k, mk, ev) {
    empoisonner(S, v, ev);
    if (mk !== 'trempe') return;
    const N = net(S, k, 'trempe');
    const autres = Object.keys(N.seen)
      .map(x => uAt(S, x))
      .filter(o => o && o !== v && !o.ko && o.side !== u.side && !(o.psn > 0));
    if (autres.length) {
      ev.push({ e: 'chain', edges: N.edges, c: 'tox' });
      say(ev, `Contamination : le poison court dans l’eau reliée.`);
      autres.forEach(o => empoisonner(S, o, ev));
    }
  }
};


/* ---------- Coup d’Main et Distorsion dans les dégâts ---------- */
FOURNISSEURS_DEGATS.push(
  { id: 'aide', fournir: (c, { u }) => u.aide > 0 && { mul: 1.5, libelle: 'Coup d’Main' } },
  { id: 'distorsion', fournir: (c, { S, u }) => S.distorsion > 0 && u.s[3] <= 2 && { mul: 1.3, libelle: 'Distorsion' } }
);


FOURNISSEURS_VITESSE.push({
  id: 'arriere',
  fournir: (c, { S, u }) => S.arriere && S.arriere[u.side] > 0 && { mul: 1.5, libelle: 'Vent Arrière' }
});


CROCHETS.avantFinManche.push((S, ev) => {
  if (!S.presc || !S.presc.length || S.over) return;
  const pret = S.presc.filter(x => x.at <= S.round);
  S.presc = S.presc.filter(x => x.at > S.round);
  pret.forEach(x => {
    if (!S.over) frapperPrescience(S, x, ev);
  });
  fin(S, ev);
});
}
