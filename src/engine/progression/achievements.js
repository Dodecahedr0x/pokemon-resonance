/* Achievements and titles: 25 achievements (in Quests), 18 of which grant a title to wear next to your name (added in v4.9). */

import { PROFILE, isCamp } from '../state/game-state.js';
import { BADGES } from '../modes/gyms.js';
import { HOOKS } from '../core/hooks.js';
import { queueSave } from '../state/saves.js';
import { renderWallet } from '../ui/wallet.js';
import { renderQuests } from './quests-shop.js';
import { activeChallenges } from './campaign-challenges.js';

export let ACHIEVEMENTS;

/** Checks achievements; returns those just unlocked. */
function verifySuccess(c) {
  PROFILE.achievements = PROFILE.achievements || {};
  const freshList = [];
  ACHIEVEMENTS.forEach(s => {
    if (PROFILE.achievements[s.id]) {
      return;
    }
    let ok = false;
    try {
      ok = !!s.ok(c);
    } catch {
      /* Best effort: failure here is non-fatal. */
    }
    if (ok) {
      PROFILE.achievements[s.id] = Date.now();
      freshList.push(s.id);
    }
  });
  return freshList;
}

export function displayedTitle() {
  return PROFILE.titre && PROFILE.achievements && PROFILE.achievements[PROFILE.titre] ? titleOf(PROFILE.titre) : '';
}

/* Quests: the Achievements tab, rendered by React (src/screens/quests/Achievements.jsx) */

const cumulative = k => (PROFILE.totals && PROFILE.totals[k]) || 0;

const titleOf = id => (ACHIEVEMENTS.find(s => s.id === id) || {}).t || '';

// Statements run at startup, in the original order (see index.js).
export function init() {
  ACHIEVEMENTS = [
    { id: 'victoire', n: 'Première victoire', d: 'Gagner un combat.', ok: c => c.win },
    { id: 'eclair', n: 'Éclair', d: 'Gagner en 3 manches ou moins.', t: 'Éclair', ok: c => c.win && c.S.round <= 3 },
    {
      id: 'intact',
      n: 'Intouchable',
      d: 'Gagner sans perdre un seul Pokémon.',
      t: 'Intouchable',
      ok: c => c.win && c.S.units.every(u => u.side !== 'a' || !u.ko),
    },
    {
      id: 'alchimiste',
      n: 'Alchimiste',
      d: 'Déclencher 5 réactions dans un même combat.',
      t: 'Alchimiste',
      ok: c => (c.S.stats.rx || 0) >= 5,
    },
    { id: 'eveils', n: 'Triple Éveil', d: 'Réussir 3 Éveils dans un même combat.', ok: c => (c.S.stats.evo || 0) >= 3 },
    {
      id: 'capture10',
      n: 'Collection',
      d: 'Capturer 10 Pokémon.',
      t: 'As de la capture',
      ok: () => PROFILE.caught >= 10,
      p: () => [PROFILE.caught, 10],
    },
    {
      id: 'badges4',
      n: 'Mi-parcours',
      d: 'Gagner 4 badges.',
      ok: () => BADGES.length >= 4,
      p: () => [BADGES.length, 4],
    },
    {
      id: 'badges8',
      n: 'Huit badges',
      d: 'Gagner les 8 badges.',
      t: 'Élite des arènes',
      ok: () => BADGES.length >= 8,
      p: () => [BADGES.length, 8],
    },
    {
      id: 'champion',
      n: 'Sacre',
      d: 'Battre la Championne de la Ligue.',
      t: 'Légende de la Ligue',
      ok: () => PROFILE.elite >= 5,
    },
    {
      id: 'kael',
      n: 'Rival vaincu',
      d: 'Battre Kael les 4 fois.',
      ok: () => PROFILE.rival >= 4,
      p: () => [PROFILE.rival, 4],
    },
    {
      id: 'legendes',
      n: 'Légende vivante',
      d: 'Vaincre les 6 légendes.',
      t: 'Légende vivante',
      ok: () => PROFILE.legends.length >= 6,
      p: () => [PROFILE.legends.length, 6],
    },
    {
      id: 'tour10',
      n: 'Cime de la Tour',
      d: 'Atteindre l’étage 10 de la Tour de Résonance.',
      t: 'Cime de la Tour',
      ok: () => PROFILE.tdr.best >= 10,
      p: () => [PROFILE.tdr.best, 10],
    },
    {
      id: 'chroma',
      n: 'Œil de lynx',
      d: 'Capturer un Pokémon chromatique.',
      t: 'Œil de lynx',
      ok: () => PROFILE.shiny.length >= 1,
    },
    {
      id: 'colosses',
      n: 'Tombe-colosses',
      d: 'Vaincre les 3 colosses.',
      t: 'Tombe-colosses',
      ok: () => (PROFILE.colossi || []).length >= 3,
      p: () => [(PROFILE.colossi || []).length, 3],
    },
    {
      id: 'briseur',
      n: 'Briseur de carapaces',
      d: 'Briser 6 parties de colosse.',
      ok: () => cumulative('parts') >= 6,
      p: () => [cumulative('parts'), 6],
    },
    {
      id: 'pyromane',
      n: 'Pyromane',
      d: 'Le feu court sur 15 cases de hautes herbes.',
      t: 'Pyromane',
      ok: () => cumulative('feu') >= 15,
      p: () => [cumulative('feu'), 15],
    },
    {
      id: 'noctambule',
      n: 'Noctambule',
      d: 'Gagner un combat qui s’achève de nuit.',
      t: 'Noctambule',
      ok: c => c.win && c.S.cycle && c.S.cycle.ph === 'nuit',
    },
    {
      id: 'pieges',
      n: 'As des pièges',
      d: 'L’adversaire tombe dans 10 de vos pièges.',
      t: 'As des pièges',
      ok: () => cumulative('pieges') >= 10,
      p: () => [cumulative('pieges'), 10],
    },
    {
      id: 'aviateur',
      n: 'As du ciel',
      d: 'Réussir 5 attaques Vol en fin de manche.',
      ok: () => cumulative('vols') >= 5,
      p: () => [cumulative('vols'), 5],
    },
    {
      id: 'mutants',
      n: 'Adaptable',
      d: 'Gagner 5 combats avec un mutateur.',
      t: 'Caméléon',
      ok: () => cumulative('mutants') >= 5,
      p: () => [cumulative('mutants'), 5],
    },
    {
      id: 'tete',
      n: 'Tête dure',
      d: 'Gagner un badge avec un défi de campagne actif.',
      t: 'Tête dure',
      ok: c => c.win && c.rew.badgeNew && activeChallenges().length > 0,
    },
    {
      id: 'survivant',
      n: 'Increvable',
      d: 'Gagner les 8 badges en Nuzlocke.',
      t: 'Increvable',
      ok: () => BADGES.length >= 8 && isCamp() && !!(PROFILE.challenges && PROFILE.challenges.nuzlocke),
    },
    {
      id: 'dissonance',
      n: 'Silence brisé',
      d: 'Vaincre la Team Dissonance.',
      t: 'Fléau de la Dissonance',
      ok: () => (PROFILE.dissonance || 0) >= 4,
      p: () => [PROFILE.dissonance || 0, 4],
    },
    {
      id: 'riche',
      n: 'Fortune',
      d: 'Avoir 20 000 ₽.',
      ok: () => PROFILE.money >= 20000,
      p: () => [Math.min(PROFILE.money, 20000), 20000],
    },
    {
      id: 'victoires50',
      n: 'Cinquante victoires',
      d: 'Gagner 50 combats.',
      t: 'Inarrêtable',
      ok: () => PROFILE.wins >= 50,
      p: () => [PROFILE.wins, 50],
    },
  ];

  HOOKS.progress.push((S, rew, win) => {
    // cumulative counters
    PROFILE.totals = PROFILE.totals || {};
    ['feu', 'pieges', 'vols', 'parts'].forEach(k => {
      if (S.stats[k]) {
        PROFILE.totals[k] = cumulative(k) + S.stats[k];
      }
    });
    if (win && S.mut) {
      PROFILE.totals.mutants = cumulative('mutants') + 1;
    }
    const freshList = verifySuccess({ S, win, rew });
    if (freshList.length) {
      rew.achievements = freshList;
    }
    return null;
  });

  HOOKS.battleResult.push(r =>
    r.achievements
      ? `<div class="res-l"><h4>Succès</h4>${r.achievements
          .map(id => {
            const s = ACHIEVEMENTS.find(x => x.id === id);
            return `<div class="rl succ"><span><b>${s.n}</b> · ${s.d}${s.t ? ` Titre gagné : « ${s.t} ».` : ''}</span><b>★</b></div>`;
          })
          .join('')}</div>`
      : ''
  );

  // wearing a title (Quests)
  document.addEventListener('click', e => {
    if (e.target.closest('[data-nz]') && isCamp()) {
      return; // handled by the campaign challenges
    }
    const t = e.target.closest('[data-titre]');
    if (t) {
      PROFILE.titre = PROFILE.titre === t.dataset.titre ? '' : t.dataset.titre;
      queueSave();
      renderQuests();
      renderWallet();
    }
  });
}
