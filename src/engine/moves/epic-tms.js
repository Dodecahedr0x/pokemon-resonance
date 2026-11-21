import { MOVES } from '../data/moves.js';
import { HOOKS } from '../core/hooks.js';
import {
  byUid,
  damage,
  endStep,
  hexDistance,
  heal,
  neighborKeys,
  markNetwork,
  pushMessage,
  stun,
  typeEffectiveness,
  unitAt,
} from '../combat/engine.js';
import { cellPolygon } from '../combat/ui.js';
import { SHOP } from '../state/economy.js';
import { DAMAGE_PROVIDERS, SPEED_PROVIDERS } from '../combat/tactical-engine.js';
import { MACHINES } from './tms.js';
import { withDe } from '../combat/tactics.js';
import { statusMoveBonus, tickTechnicalEffects, hasRune } from './technical-roster.js';
import { heldMoveBonus } from '../combat/resonance.js';

/* ---------- effects on each target hit ---------- */
export function applyPoison(S, v, ev) {
  if (!v || v.ko) {
    return false;
  }
  if (v.t.includes('Poison') || v.t.includes('Acier')) {
    pushMessage(ev, `${v.n} ne craint pas le poison.`);
    return false;
  }
  if (hasRune(S, v)) {
    pushMessage(ev, `Rune Protect : ${v.n} est protégé.`);
    return false;
  }
  v.poisoned = 3;
  pushMessage(ev, `${v.n} est empoisonné.`);
  return true;
}

export function tailwindMoveBonus(S, u) {
  let b = 0;
  if (S.arriere && S.arriere[u.side] > 0) {
    b += 2;
  }
  if (S.distorsion > 0 && u.s[3] <= 2) {
    b += 1;
  }
  b += statusMoveBonus(S, u) + heldMoveBonus(S, u); // Choice Scarf (v4.14)
  return b;
}

export function tickFieldEffects(S, ev) {
  if (S.arriere) {
    for (const c in S.arriere) {
      if (S.arriere[c] > 0 && --S.arriere[c] === 0) {
        pushMessage(ev, `Le Vent Arrière ${c === 'a' ? 'de votre équipe' : 'adverse'} retombe.`);
      }
    }
  }
  if (S.distorsion > 0 && --S.distorsion === 0) {
    pushMessage(ev, 'La Distorsion se dissipe.');
  }
  tickTechnicalEffects(S, ev);
}

/* ---------- Future Sight ---------- */
export function placeForesight(S, u, m, k, ev) {
  S.presc = S.presc || [];
  S.presc.push({ k, by: u.uid, side: u.side, at: S.round + 1, p: m.pp || 14 });
  pushMessage(ev, `${u.n} prévoit l’avenir : une onde Psy frappera cette zone à la fin de la manche suivante.`);
  ev.push({ e: 'terrain', k });
}

function strikePrescience(S, P0, ev) {
  const u = byUid(S, P0.by),
    zone = [P0.k, ...neighborKeys(P0.k)].filter(x => S.tiles[x] && !S.tiles[x].rock),
    keys = zone.map(x => unitAt(S, x)).filter(v => v && !v.ko && v.side !== P0.side);
  pushMessage(
    ev,
    `Prescience : l’onde Psy ${u ? withDe(u.n) + ' ' : ''}s’abat${keys.length ? '' : ' sur une zone vide'} !`
  );
  keys.forEach(v => {
    const e = typeEffectiveness('Psy', v.t);
    if (!e) {
      pushMessage(ev, `Ça n’affecte pas ${v.n}.`);
      return;
    }
    const atk = u ? u.s[1] : 3,
      stab = u && u.t.includes('Psy') ? 1.2 : 1;
    damage(S, v, Math.max(1, Math.round((P0.p + atk * 2) * e * stab)), ev, {});
    if (e > 1) {
      pushMessage(ev, 'C’est super efficace !');
    }
  });
}

export function foresightOnBoard(S) {
  if (!S || !S.presc || !S.presc.length) {
    return '';
  }
  let h = '';
  S.presc.forEach(x =>
    [x.k, ...neighborKeys(x.k)].forEach(k => {
      if (S.tiles[k] && !S.tiles[k].rock) {
        h += cellPolygon(k, 'highlight-foresight' + (x.at <= S.round ? ' is-due' : ''));
      }
    })
  );
  return h;
}

/* ---------- battle banner ---------- */
export function fieldEffectChips(S) {
  if (!S) {
    return '';
  }
  let h = '';
  if (S.arriere && S.arriere.a > 0) {
    h += `<span class="chip chip-412" title="+2 Mouvement pour votre équipe">Vent Arrière · ${S.arriere.a}</span>`;
  }
  if (S.arriere && S.arriere.e > 0) {
    h += `<span class="chip chip-412 en" title="+2 Mouvement pour l’équipe adverse">Vent Arrière adverse · ${S.arriere.e}</span>`;
  }
  if (S.distorsion > 0) {
    h += `<span class="chip chip-412" title="Vitesse 2 ou moins : ×1,3 et +1 Mouvement">Distorsion · ${S.distorsion}</span>`;
  }
  if (S.presc && S.presc.length) {
    h += `<span class="chip chip-412" title="Onde Psy à venir">Prescience · ${S.presc.length}</span>`;
  }
  if (S.gravite > 0) {
    h += `<span class="chip chip-412" title="Personne ne vole, −1 Mouvement">Gravité · ${S.gravite}</span>`;
  }
  if (S.rune && S.rune.a > 0) {
    h += `<span class="chip chip-412" title="Vos Pokémon sont protégés des statuts">Rune Protect · ${S.rune.a}</span>`;
  }
  if (S.champ && S.champ.a > 0) {
    h += `<span class="chip chip-412" title="Cases Enracinées : +4 PV par manche">Champ Herbu · ${S.champ.a}</span>`;
  }
  if (S.harmonie) {
    h += `<span class="chip chip-412" title="Trois rangs différents : chaque Pokémon a commencé avec 1 losange">Harmonie</span>`;
  } // v4.14
  return h;
}

/* ---------- effects on oneself ---------- */
export const SELF_MOVE_EFFECTS = {
  arriere(S, u, ev) {
    S.arriere = Object.assign({}, S.arriere, { [u.side]: 3 });
    pushMessage(
      ev,
      `Vent Arrière : ${u.side === 'a' ? 'votre équipe' : 'l’équipe adverse'} gagne +2 Mouvement pendant 3 manches.`
    );
  },
  distorsion(S, u, ev) {
    S.distorsion = 4;
    pushMessage(ev, 'Distorsion : pendant 4 manches, les Pokémon lents frappent ×1,3 et gagnent +1 Mouvement.');
  },
  glas(S, u, ev) {
    const healed = S.units.filter(o => !o.ko && o.side === u.side && hexDistance(o.pos, u.pos) <= 2);
    healed.forEach(o => {
      const had = !!(o.badge || o.skip || o.burn || o.poisoned || o.web || o.root);
      if (o.sn && o !== u && o.side === 'a' && S.phase === 'player') {
        o.sn = false; // woken up: it can still play this round
        o.acted = false;
        o.moved = false;
      }
      o.badge = null;
      o.skip = 0;
      o.burn = 0;
      o.poisoned = 0;
      o.web = 0;
      o.root = 0;
      heal(S, o, Math.round(o.mhp * 0.1), ev);
      if (had) {
        ev.push({ e: 'st', u: o.uid, s: 'SOIN' });
      }
    });
    pushMessage(
      ev,
      `Glas de Soin : ${healed.map(o => o.n).join(', ')} ${healed.length > 1 ? 'sont guéris' : 'est guéri'}.`
    );
  },
};

export const TARGET_MOVE_EFFECTS = {
  ventglace(S, u, v, k, mk, ev) {
    if (v.ability === 'regardvif' || hasRune(S, v)) {
      pushMessage(ev, `${v.n} ignore l’entrave.`);
    } else {
      v.web = Math.max(v.web, 2);
      pushMessage(ev, `${v.n} est ralenti par le froid.`);
    }
  },
  dracosouffle(S, u, v, k, mk, ev) {
    if (mk === 'charge') {
      stun(S, v, 'PAR', ev);
    }
  },
  toxik(S, u, v, k, mk, ev) {
    applyPoison(S, v, ev);
    if (mk !== 'trempe') {
      return;
    }
    const N = markNetwork(S, k, 'trempe');
    const others = Object.keys(N.seen)
      .map(x => unitAt(S, x))
      .filter(o => o && o !== v && !o.ko && o.side !== u.side && !(o.poisoned > 0));
    if (others.length) {
      ev.push({ e: 'chain', edges: N.edges, c: 'tox' });
      pushMessage(ev, `Contamination : le poison court dans l’eau reliée.`);
      others.forEach(o => applyPoison(S, o, ev));
    }
  },
};

const EPIC_TM_MOVES = {
  ondedechoc: {
    n: 'Onde de Choc',
    t: 'Électrik',
    p: 13,
    r: 3,
    sh: 'one',
    mk: 'charge',
    pluie: 1,
    d: 'Portée 3, Chargé. Sous la Pluie : portée 5 et frappe les 7 cases de la zone. Combo : Danse Pluie, Crachin, cases Trempées (Court-circuit).',
  },
  deflagration: {
    n: 'Déflagration',
    t: 'Feu',
    p: 12,
    r: 3,
    sh: 'area',
    mk: 'brulant',
    fx: 'recharge',
    d: 'Zone de 7 cases à 3 cases, Brûlant, alliés compris. Puis une manche de repos. Combo : Zénith, cases Enracinées (Embrasement).',
  },
  bombebeurk: {
    n: 'Bombe Beurk',
    t: 'Poison',
    p: 9,
    r: 3,
    sh: 'one',
    fx: 'toxik',
    d: 'Portée 3. Empoisonne : −3 PV par manche, 3 manches. Sur une case Trempée, le poison gagne toute l’eau reliée. Combo : Pistolet à O, Surf, synergie Toxines.',
  },
  devoreve: {
    n: 'Dévorêve',
    t: 'Psy',
    p: 18,
    r: 2,
    sh: 'one',
    fx: 'devoreve',
    d: 'Portée 2, seulement sur une cible endormie : dégâts énormes, et soigne la moitié. Combo : Hypnose, Berceuse, Poudre Dodo.',
  },
  ventglace: {
    n: 'Vent Glace',
    t: 'Glace',
    p: 6,
    r: 1,
    sh: 'cone',
    mk: 'givre',
    fx: 'ventglace',
    d: 'Cône de 3 cases, Givré : chaque adversaire touché perd 3 Mouvement pendant 2 manches. Combo : Bris (Combat, Roche), Banquise.',
  },
  dracosouffle: {
    n: 'Draco-Souffle',
    t: 'Dragon',
    p: 9,
    r: 2,
    sh: 'line',
    fx: 'dracosouffle',
    d: 'Ligne de 2, aucune réaction : paralyse chaque cible sur une case Chargée. Combo : Cage-Éclair, Éclair, Statik.',
  },
  coupdmain: {
    n: 'Coup d’Main',
    t: 'Normal',
    p: 0,
    r: 2,
    sh: 'ally',
    fx: 'aide',
    d: 'Un allié à 2 cases : sa prochaine attaque de la manche frappe ×1,5, réactions comprises. Combo : un Frappeur qui n’a pas encore joué.',
  },
  ventarriere: {
    n: 'Vent Arrière',
    t: 'Vol',
    p: 0,
    r: 0,
    sh: 'self',
    fx: 'arriere',
    d: 'Pendant 3 manches, toute votre équipe gagne +2 Mouvement (Vitesse ×1,5 en ordre par Vitesse). Combo : Frappeurs au contact, Éclaireurs.',
  },
  distorsion: {
    n: 'Distorsion',
    t: 'Psy',
    p: 0,
    r: 0,
    sh: 'self',
    fx: 'distorsion',
    d: 'Pendant 4 manches, les Pokémon lents (Vitesse 2 ou moins) frappent ×1,3 et gagnent +1 Mouvement, adversaires compris ; en ordre par Vitesse, les plus lents jouent d’abord. Combo : Ronflex, Donphan, Tortank, Steelix.',
  },
  prescience: {
    n: 'Prescience',
    t: 'Psy',
    p: 0,
    pp: 14,
    r: 4,
    sh: 'one',
    fx: 'presc',
    d: 'Vise une case à 4 cases : à la fin de la manche suivante, une onde Psy (puissance 14) frappe cette case et ses voisines, sans tenir compte de la Garde. Combo : Racines, Toile, Regard Noir.',
  },
  glasdesoin: {
    n: 'Glas de Soin',
    t: 'Normal',
    p: 0,
    r: 0,
    sh: 'self',
    fx: 'glas',
    d: 'Vos Pokémon à 2 cases, lui compris, sont guéris (sommeil, paralysie, gel, brûlure, poison, entraves) et récupèrent 10 % de leurs PV.',
  },
};

// Instructions run at startup, in the original order (see index.js).
export function init() {
  /* =====================================================================
   v4.12: epic TMs
   ---------------------------------------------------------------------
   Eleven machines whose attack belongs to no Pokémon. Each
   opens up a team build:
     Storm        Shock Wave      + Rain Dance / Drizzle / Soaked cells
     Forge        Fire Blast      + Zenith / Rooted cells (Blaze)
     Toxins       Sludge Bomb     + connected water / Toxins synergy
     Hypnosis     Dream Eater     + Hypnosis / Lullaby / Sleep Powder
     Ice Field    Icy Wind        + Break / Ice Field
     Dragon-Storm Dragon Breath   + Charge Cage / Static
     Support      Helping Hand    + a Striker that has not played
     Assault      Tailwind        + melee Strikers
     Colossi      Trick Room      + slow Pokémon (Snorlax, Donphan, Steelix…)
     Oracle       Future Sight    + Roots / Web / Mean Look
     Infirmary    Heal Bell       + against Psychic, Poison and Ghost
   ===================================================================== */
  Object.assign(MOVES, EPIC_TM_MOVES);
  [
    ['ct34', { num: 'CT34', mv: 'ondedechoc', p: 4500, types: ['Électrik', 'Eau', 'Dragon'] }],
    ['ct38', { num: 'CT38', mv: 'deflagration', p: 4500, types: ['Feu', 'Dragon'], familles: ['ronflex', 'embrylex'] }],
    ['ct36', { num: 'CT36', mv: 'bombebeurk', p: 3500, types: ['Poison'], familles: ['ronflex'] }],
    ['ct42', { num: 'CT42', mv: 'devoreve', p: 4000, types: ['Psy', 'Spectre'], familles: ['melo', 'ronflex'] }],
    ['ct16', { num: 'CT16', mv: 'ventglace', p: 3000, types: ['Glace', 'Eau', 'Vol'] }],
    [
      'ct24',
      {
        num: 'CT24',
        mv: 'dracosouffle',
        p: 3500,
        types: ['Dragon'],
        familles: ['salameche', 'magicarpe', 'wattouat', 'onix', 'embrylex'],
      },
    ],
    ['ct51', { num: 'CT51', mv: 'coupdmain', p: 3000, forAll: true }],
    ['ct52', { num: 'CT52', mv: 'ventarriere', p: 3500, types: ['Vol'] }],
    [
      'ct53',
      {
        num: 'CT53',
        mv: 'distorsion',
        p: 4000,
        types: ['Psy'],
        familles: ['ramoloss', 'ronflex', 'melo', 'fantominus', 'phanpy', 'pomdepik'],
      },
    ],
    ['ct54', { num: 'CT54', mv: 'prescience', p: 4000, types: ['Psy'], familles: ['melo', 'ramoloss', 'evoli'] }],
    ['ct55', { num: 'CT55', mv: 'glasdesoin', p: 2500, types: ['Normal', 'Fée'], familles: ['germignon', 'chenipan'] }],
  ].forEach(([k, M]) => {
    MACHINES[k] = M;
    const m = MOVES[M.mv];
    SHOP[k] = {
      n: `${M.num} · ${m.n}`,
      sn: M.num,
      d: `${m.t} · ${m.p ? 'Puissance ' + m.p + ' · ' : m.pp ? 'Puissance ' + m.pp + ' · ' : ''}${m.d} Usage unique.`,
      category: 'machines',
      mv: M.mv,
      cs: false,
      p: M.p,
    };
  });
  /* ---------- Helping Hand and Trick Room in damage ---------- */
  DAMAGE_PROVIDERS.push(
    { id: 'aide', provide: (c, { u }) => u.aide > 0 && { mul: 1.5, labelText: 'Coup d’Main' } },
    {
      id: 'distorsion',
      provide: (c, { S, u }) => S.distorsion > 0 && u.s[3] <= 2 && { mul: 1.3, labelText: 'Distorsion' },
    }
  );
  SPEED_PROVIDERS.push({
    id: 'arriere',
    provide: (c, { S, u }) => S.arriere && S.arriere[u.side] > 0 && { mul: 1.5, labelText: 'Vent Arrière' },
  });
  HOOKS.beforeRoundEnd.push((S, ev) => {
    if (!S.presc || !S.presc.length || S.over) {
      return;
    }
    const isReady = S.presc.filter(x => x.at <= S.round);
    S.presc = S.presc.filter(x => x.at > S.round);
    isReady.forEach(x => {
      if (!S.over) {
        strikePrescience(S, x, ev);
      }
    });
    endStep(S, ev);
  });
}
