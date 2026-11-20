/* Living Home: the illustration follows the adventure region and the time of day; the companion waits there, a hug with one gesture (added in v4.28). */

import { BY, SCEN } from '../pokemon/pokemon.js';
import { PROFILE, isCamp } from '../state/game-state.js';
import { $, toast } from '../core/utils.js';
import { cur } from '../core/navigation.js';
import { TOD } from './home-route.js';
import { squad } from '../team/team.js';
import { queueSave } from '../state/saves.js';
import { sfx, vibe } from '../audio/sound-effects.js';
import { today } from '../state/economy.js';
import { renderHome } from './home.js';
import { isShinyOwned } from '../pokemon/shiny.js';
import { JCHAIN } from './johto.js';
import {
  affinityHearts,
  gainCompanionAffinity,
  activeCompanionId,
  renderCompanionBox,
} from '../progression/companion-pokemon.js';
import { refreshHome } from '../../screens/home/homeStore.js';
import { HCHAIN } from './hoenn.js';
import { FAMILY_REGION_NAMES, regionIndex } from './catch-anywhere.js';

function heroRegionInfo(g) {
  if (!isCamp()) {
    return regionIndex();
  }
  const k = g.k,
    S = SCEN[k] || {};
  if (HCHAIN.includes(k) || S.hoenn != null) {
    return 3;
  }
  if (JCHAIN.includes(k) || /^j/.test(k) || S.johto != null || S.roam) {
    return 2;
  }
  return 1;
}

/** Living Home: hero backdrop according to region and time, companion (render: src/screens/home/Hero.jsx). */
export function heroView(g) {
  const r = heroRegionInfo(g),
    id = activeCompanionId() || squad[0] || '',
    m = BY[id],
    comp = !!activeCompanionId();
  return {
    reg: ['', 'kanto', 'johto', 'hoenn'][r],
    tod: TOD,
    tag: `${FAMILY_REGION_NAMES[r]} · ${TIME_OF_DAY_NAMES[TOD] || 'Jour'}`,
    m,
    comp,
    sh: comp && isShinyOwned(m.base),
    hearts: comp ? affinityHearts(PROFILE.comp.aff || 0) : 0,
  };
}

const TIME_OF_DAY_NAMES = { matin: 'Matin', jour: 'Jour', nuit: 'Nuit' };

// Statements run at startup, in the original order (see index.js).
export function init() {
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-hero-banner]');
    if (b) {
      if (b.dataset.heroBanner === 'choisir' || !activeCompanionId()) {
        renderCompanionBox();
        $('#compBox').hidden = false;
        return;
      }
      b.classList.remove('is-petted');
      void b.offsetWidth;
      b.classList.add('is-petted');
      const n = BY[activeCompanionId()].n;
      if (PROFILE.comp.j === today()) {
        toast(`${n} est déjà tout content aujourd’hui.`);
        return;
      }
      PROFILE.comp.j = today();
      const up = gainCompanionAffinity(3);
      sfx('ui');
      vibe(25);
      toast(up ? `${n} est ravi : ${up} cœur${up > 1 ? 's' : ''} !` : `${n} ferme les yeux de bonheur.`);
      queueSave();
      refreshHome();
      return;
    }
    if (e.target.closest('[data-comp-p]')) {
      setTimeout(() => cur === 'accueil' && renderHome(), 0);
    }
  });
}
