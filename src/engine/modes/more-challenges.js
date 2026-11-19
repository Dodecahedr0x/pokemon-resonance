/* « Plus de défis » (More challenges) window: shared state of the rivalry, trainer of the week, relic showcase,
   Shadows rematch and Ball training (added in v4.71). */

import { toast, writeLS } from '../core/utils.js';
import { squad } from '../team/team.js';
import { B, backToPrep, goFight } from '../combat/ui.js';
import { overlay } from '../progression/prestige.js';
import { shut } from '../../screens/overlays/tempStore.js';
import { today } from '../state/economy.js';
import { RELICS } from './boss-rush.js';
import { week, weekDef, wkMake } from './trainer-of-the-week.js';
import { WEATHER_NAME, weatherKind } from './challenge-weather.js';
import { trainingSession } from './ball-training.js';

const KEY = 'res-x2470';
const DEF = () => ({
  rival: [],
  wk: { k: '', done: false, best: 0 },
  relics: [],
  inv: { d: '', done: false },
  ct: { d: '', n: 0, best: 0 },
});

export const readMoreChallenges = () => {
  try {
    return Object.assign(DEF(), JSON.parse(localStorage.getItem(KEY)));
  } catch (e) {
    return DEF();
  }
};

export const writeMoreChallenges = o => {
  writeLS(KEY, o);
};

/** Opens the « Plus de défis » window. */
export const openMoreChallenges = () => {
  const X = readMoreChallenges(),
    W = weekDef(),
    w = weatherKind(),
    isFinished = X.wk.k === week() && X.wk.done,
    dayInv = X.inv.d === today() && X.inv.done,
    storyFinished = window.__shadowEpisodes && window.__shadowEpisodes.readValue().stepOf >= 4,
    showcase = RELICS.map(r => ({ r, on: X.relics.includes(r.id) })),
    nb = showcase.filter(v => v.on).length;
  // rendered: src/screens/overlays/transients/Windows.jsx (X2470)
  const o = overlay('x2470o', {
    lines: (X.rival.length ? X.rival : ['Kael : « Je reviendrai, dresseur. »']).slice(-2),
    meteo: WEATHER_NAME[w] || 'Temps calme',
    bonus:
      w === 'pluie' || w === 'sable' || w === 'grele'
        ? 'le défi quotidien rapporte +1 Éclat'
        : w === 'soleil'
          ? 'le défi quotidien rapporte +200 ₽'
          : 'aucun bonus aujourd’hui',
    fini: !!isFinished,
    wn: W.n,
    nb,
    showcase: showcase.map(v => ({ on: v.on, n: v.r.n, d: v.r.d })),
    storyDone: !!storyFinished,
    dayInv: !!dayInv,
    ctBest: X.ct.best,
    ctRest: 3 - (X.ct.d === today() ? X.ct.n : 0),
  });
  o.addEventListener('click', e => {
    if (e.target === o) {
      shut('x2470o');
    }
  });
};

// Statements run at startup, in the original order (see index.js).
export function init() {
  document.addEventListener(
    'click',
    e => {
      const b = e.target.closest && e.target.closest('[data-x2470]');
      if (!b || b.disabled) {
        return;
      }
      e.stopPropagation();
      e.preventDefault();
      const v = b.dataset.x2470;
      if (v === 'open') {
        return openMoreChallenges();
      }
      if (v === 'close') {
        return shut('x2470o');
      }
      if (!squad.length) {
        return toast('Composez d’abord une équipe.');
      }
      if (v === 'wk') {
        wkMake();
        shut('x2470o');
        if (B) {
          backToPrep();
        }
        return goFight('wk470');
      }
      if (v === 'inv') {
        shut('x2470o');
        if (B) {
          backToPrep();
        }
        return goFight('inv470');
      }
      if (v === 'ct') {
        shut('x2470o');
        return trainingSession();
      }
    },
    true
  );

  /* "Plus de défis" (More challenges) button under the Challenges bar on the Home screen */
  /* the #x2470 button is rendered by React (src/screens/home/Banners.jsx) */
  window.__x2470 = {
    readValue: readMoreChallenges,
    write: writeMoreChallenges,
    hub: openMoreChallenges,
    weekDef,
    wkMake,
  };
}
