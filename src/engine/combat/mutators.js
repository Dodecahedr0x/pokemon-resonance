/* Battle mutators: a drawn rule changes the whole battle (Tower floors, optional in Training) (added in v4.9). */

import { SCEN } from '../pokemon/pokemon.js';
import { typeColor } from '../core/utils.js';
import { HOOKS } from '../core/hooks.js';
import { P, hasNx, uAt } from './engine.js';
import { scSel } from './ui.js';
import { PREF } from '../ui/preferences.js';
import { ROLE_PROVIDERS } from './tactical-engine.js';

/* Mutators: Déluge, Nuit éternelle, Gravité, Canons de verre, Champ de pièges…
   Each Tower floor has one (except legend floors); optionally, Training
   battles too (+50% Pokédollars). */

/** Names and descriptions (declared function: the Tower needs it as soon as the game loads). */
export function mutInfo(id) {
  return (
    {
      deluge: ['Déluge', 'Pluie pendant tout le combat.', 'Eau'],
      canicule: ['Canicule', 'Soleil pendant tout le combat.', 'Feu'],
      blizzard: ['Grêle éternelle', 'Grêle pendant tout le combat.', 'Glace'],
      simoun: ['Simoun', 'Tempête de sable pendant tout le combat.', 'Sol'],
      eclipse: [
        'Nuit éternelle',
        'Il fait nuit tout le combat : Spectre et Ténèbres ×1,2, −1 de portée au-delà de 2 cases.',
        'Ténèbres',
      ],
      gravite: [
        'Gravité',
        'Personne ne vole ni ne lévite (pièges et Sol touchent tout le monde), et −1 Mouvement pour tous.',
        'Psy',
      ],
      frenesie: ['Frénésie', '+1 Mouvement pour tous.', 'Vol'],
      verre: ['Canons de verre', 'Tous les dégâts ×1,5, des deux côtés.', 'Combat'],
      remparts: ['Remparts', 'Tous les dégâts ×0,7, et 3 manches de plus.', 'Acier'],
      echo: ['Écho', '+2 Voix à chaque manche.', 'Fée'],
      champ: [
        'Champ de pièges',
        '6 pièges posés au hasard au milieu du plateau. Ils touchent les deux camps.',
        'Roche',
      ],
      eveil: ['Éveil précoce', 'Vos Pokémon commencent avec 2 points d’Éveil sur 3.', 'Dragon'],
    }[id] || null
  );
}

/** A Tower floor's mutator: from floor 2 on, except legend floors. */
export function mutOfTurn(run, f) {
  if (!run || f < 2 || f % 5 === 0) {
    return null;
  }
  const ids = [
    'deluge',
    'canicule',
    'blizzard',
    'simoun',
    'eclipse',
    'gravite',
    'frenesie',
    'verre',
    'remparts',
    'echo',
    'champ',
    'eveil',
  ];
  return ids[Math.abs(Math.floor(run.seed * 7 + f * 13)) % ids.length];
}

/** Optional: a random mutator for Training battles. */
export function mutTraining() {
  const D = SCEN[scSel];
  if (
    !PREF.trainingMutators ||
    !D ||
    D.tuto ||
    D.tower ||
    D.rule ||
    D.elite ||
    D.champ ||
    D.legend ||
    D.hoennLegend ||
    D.captureHoennLegend ||
    D.rival ||
    D.rivalFight ||
    D.hebdo429
  ) {
    return null;
  }
  return MUT_IDS[Math.floor(Math.random() * MUT_IDS.length)];
}

function applyMutator(S, id) {
  if (!mutInfo(id)) {
    return;
  }
  S.mut = id;
  if (WEATHER_MUT[id]) {
    S.wx = { k: WEATHER_MUT[id], n: 99 };
  }
  if (id === 'eclipse') {
    S.time = 'nuit';
    S.cycle = { ph: 'nuit', n: 0, frozen: true };
  }
  if (id === 'gravite') {
    S.mutatorMove = -1;
    S.units.forEach(u => (u.pinned = true));
  }
  if (id === 'frenesie') {
    S.mutatorMove = 1;
  }
  if (id === 'remparts') {
    S.lim += 3;
  }
  if (id === 'echo') {
    S.vmax += 2;
    S.voice += 2;
  }
  if (id === 'eveil') {
    S.units.forEach(u => u.side === 'a' && hasNx(u) && (u.en = Math.max(u.en, 2)));
  }
  if (id === 'champ') {
    const freeOnes = Object.keys(S.tiles).filter(k => {
      const t = S.tiles[k],
        c = P(k)[0];
      return c >= 2 && c <= 5 && !t.rock && !t.w && !uAt(S, k) && !t.trap;
    });
    const kinds = ['picots', 'picots', 'roc', 'toile'];
    for (let i = 0; i < 6 && freeOnes.length; i++) {
      const k = freeOnes.splice(Math.floor(Math.random() * freeOnes.length), 1)[0];
      S.tiles[k].trap = { k: kinds[i % kinds.length], side: 'n', by: null, d: 99 };
    }
  }
}

export function chipMut(S) {
  if (!S || !S.mut) {
    return '';
  }
  const I = mutInfo(S.mut);
  return `<span class="chip chip-mut" title="${I[1]}"><i style="background:${typeColor(I[2])}"></i>${I[0]}</span>`;
}

const MUT_IDS = [
  'deluge',
  'canicule',
  'blizzard',
  'simoun',
  'eclipse',
  'gravite',
  'frenesie',
  'verre',
  'remparts',
  'echo',
  'champ',
  'eveil',
];

const WEATHER_MUT = { deluge: 'pluie', canicule: 'soleil', blizzard: 'grele', simoun: 'sable' };

// Statements run at startup, in the original order (see index.js).
export function init() {
  ROLE_PROVIDERS.push({
    id: 'mutateur',
    provide: (c, { S }) =>
      S.mut === 'verre'
        ? { mul: 1.5, labelText: 'Canons de verre' }
        : S.mut === 'remparts'
          ? { mul: 0.7, labelText: 'Remparts' }
          : null,
  });

  HOOKS.creation.push((S, opt, D0) => {
    const m = (opt && opt.mut) || D0.mut;
    if (m) {
      applyMutator(S, m);
    }
  });

  // weather mutators last the whole battle
  HOOKS.beforeRoundEnd.push(S => {
    if (S.mut && WEATHER_MUT[S.mut]) {
      S.wx = { k: WEATHER_MUT[S.mut], n: 99 };
    }
  });

  // mutator in Training: +50% Pokédollars
  HOOKS.progress.push((S, rew, win) => {
    const D = SCEN[S.sc] || {};
    if (win && S.mut && !D.tower) {
      const m = Math.round(((rew.money || 0) * 0.5) / 10) * 10;
      rew.mut = S.mut;
      return m ? [m, 0] : null;
    }
    return null;
  });

  HOOKS.battleResult.push(r =>
    r.mut
      ? `<div class="result-list"><h4>Mutateur</h4><div class="result-row"><span>${mutInfo(r.mut)[0]} : +50 % de Pokédollars</span><b>×1,5</b></div></div>`
      : ''
  );
}
