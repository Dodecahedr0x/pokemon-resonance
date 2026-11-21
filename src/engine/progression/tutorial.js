/* Tutorial: the coach of the first guided battle, its steps and the highlighted element (added in v1.0). */

import { bdClass } from '../../screens/combat/board/boardStore.js';

import { SCENARIOS } from '../pokemon/pokemon.js';
import { PROFILE } from '../state/game-state.js';
import { $, $$ } from '../core/utils.js';
import { getCoach, hideCoach, showCoach } from '../../screens/overlays/shellOverlays.js';
import { B } from '../combat/ui.js';
import { queueSave } from '../state/saves.js';

let tutorialI;
export function __set_tutorialI(v) {
  return (tutorialI = v);
}

function tutorialOn() {
  return B && SCENARIOS[B.sc] && SCENARIOS[B.sc].tuto && tutorialI >= 0 && tutorialI < TUTORIAL_STEPS.length;
}

// Guided-battle coach: #coach is rendered by React (src/screens/overlays/Coach.jsx,
// with the Professor's portrait). Here, the choice of step and the highlighted cell.
// #bBoard is rendered by React: its class goes through the "host" state (boardStore.js)
function withoutHl() {
  bdClass('coach-hl', false);
  $$('.coach-hl').forEach(x => x.classList.remove('coach-hl'));
}

export function renderCoach() {
  if (!B || B.over) {
    // the coach disappears at the end of the battle or on abandon
    hideCoach();
    withoutHl();
    return;
  }
  withoutHl();
  if (!tutorialOn()) {
    hideCoach();
    return;
  }
  const s = TUTORIAL_STEPS[tutorialI];
  if (s.done() && tutorialI < TUTORIAL_STEPS.length - 1) {
    tutorialI++;
    return renderCoach();
  }
  const t = $(s.sel);
  if (t && t.id === 'bBoard') {
    bdClass('coach-hl', true);
  } else if (t) {
    t.classList.add('coach-hl');
  }
  const c = getCoach();
  if (c.k === String(tutorialI) && !c.hidden) {
    return;
  }
  showCoach(String(tutorialI), {
    n: tutorialI + 1,
    total: TUTORIAL_STEPS.length,
    t: s.t,
    d: s.d,
    last: tutorialI === TUTORIAL_STEPS.length - 1,
  });
}

/* ---- tutorial: first guided battle ---- */
export const TUTORIAL_STEPS = [
  {
    t: 'Lisez la menace',
    d: 'Touchez un adversaire : la zone rouge montre tout ce qu’il peut frapper après s’être déplacé. Il choisit sa cible à son tour.',
    sel: '#bBoard',
    done: () => false,
  },
  {
    t: 'Déplacez-vous',
    d: 'Touchez un de vos Pokémon, puis une case bleue. Approchez pour frapper, ou reculez hors de la zone rouge.',
    sel: '#bBoard',
    done: () => B.units.some(u => u.side === 'a' && u.moved),
  },
  {
    t: 'Attaquez',
    d: 'Choisissez une capacité, touchez une case dorée : l’aperçu donne le résultat exact. Touchez « Confirmer ».',
    sel: '#bPanel',
    done: () => B.units.some(u => u.side === 'a' && u.acted && !u.sn),
  },
  {
    t: 'Énergie d’Éveil',
    d: 'Les trois losanges se remplissent en fin de manche, en réagissant et en encaissant. Pleins, le bouton Éveil fait évoluer le Pokémon : c’est irréversible.',
    sel: '#bPanel',
    done: () => false,
  },
  {
    t: 'Terminez la manche',
    d: 'Quand vos Pokémon ont joué, touchez « Fin du tour » : les adversaires se déplacent, puis attaquent.',
    sel: '#bEnd',
    done: () => B.round > 1,
  },
  {
    t: 'Les Voix et la capture',
    d: 'Esquive (1 Voix) et Relance (2 Voix) sauvent une manche. Sous 25 % de PV et immobilisé, un Pokémon sauvage peut être capturé au contact.',
    sel: '#bPanel',
    done: () => false,
  },
];

// Instructions run at startup, in the original order (see index.js).
export function init() {
  tutorialI = -1;
  $('#coach').addEventListener('click', e => {
    const b = e.target.closest('[data-co]');
    if (!b) {
      return;
    }
    if (b.dataset.co === 'skip') {
      tutorialI = -1;
      PROFILE.tuto = 1;
      queueSave();
    } else {
      tutorialI++;
      if (tutorialI >= TUTORIAL_STEPS.length) {
        tutorialI = -1;
        PROFILE.tuto = 1;
        queueSave();
      }
    }
    renderCoach();
  });
}
