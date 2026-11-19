/* « Défis » (Challenges) hub: shared state and window for the Shadows, the daily challenge, specimens and prestige (added in v4.71). */

import { writeLS, toast } from '../core/utils.js';
import { squad } from '../team/team.js';
import { B, backToPrep, goFight } from '../combat/ui.js';
import { overlay } from '../progression/prestige.js';
import { shut } from '../../screens/overlays/tempStore.js';
import { today } from '../state/economy.js';
import { ok } from './challenge-scenes.js';
import { dqDef, dqMake, dqViol } from './daily-challenge.js';
import { adjustPrestige, preOk } from './challenge-prestige.js';
import { freeSpecimens, reviveSpecimen } from './ancient-specimens.js';

const KEY = 'res-daily-challenges';

/** Saved state: fossils, revived specimens, daily challenge (dq) and prestige (pre). */
export const readChallengeState = () => {
  try {
    return Object.assign(
      {
        fossils: 0,
        rev: [],
        dq: { d: '', done: false, streak: 0, best: 0, tot: 0, last: '' },
        pre: { n: 0, on: false },
      },
      JSON.parse(localStorage.getItem(KEY))
    );
  } catch (e) {
    return {
      fossils: 0,
      rev: [],
      dq: { d: '', done: false, streak: 0, best: 0, tot: 0, last: '' },
      pre: { n: 0, on: false },
    };
  }
};

export const writeChallengeState = o => {
  writeLS(KEY, o);
};

/** Opens the « Défis » window. */
export const openChallengesHub = () => {
  const X = readChallengeState(),
    D = X.dq,
    doneFlag = D.d === today() && D.done,
    di = dqDef();
  const freeOnes = freeSpecimens();
  const O = window.__shadowEpisodes,
    e = O.readValue().stepOf,
    endStep = e >= 4;
  // rendering: src/screens/overlays/transients/Windows.jsx (ChallengesHub)
  const o = overlay('daily-challenges-o', {
    shadowState: endStep
      ? { fin: endStep }
      : {
          fin: endStep,
          e,
          available: !!O.available(),
          titre: O.available() ? O.titre() : '',
          req: O.available() ? '' : O.req(),
        },
    forbidden: di.forbidden,
    streak: D.streak,
    best: D.best,
    tot: D.tot,
    fait: !!doneFlag,
    fossils: X.fossils,
    freeSlots: freeOnes.length,
    pre: { n: X.pre.n, on: !!X.pre.on },
    preOk: !!preOk(),
  });
  o.addEventListener('click', evt => {
    if (evt.target === o) {
      shut('daily-challenges-o');
    }
  });
};

// Statements run at startup, in the original order (see index.js).
export function init() {
  document.addEventListener(
    'click',
    e => {
      const b = e.target.closest && e.target.closest('[data-daily-challenges]');
      if (!b || b.disabled) {
        return;
      }
      e.stopPropagation();
      e.preventDefault();
      const v = b.dataset.dailyChallenges,
        X = readChallengeState();
      if (v === 'open') {
        return openChallengesHub();
      }
      if (v === 'close') {
        return shut('daily-challenges-o');
      }
      if (v === 'omb') {
        const O = window.__shadowEpisodes;
        if (!O.available() || !squad.length) {
          return toast(squad.length ? 'Épisode verrouillé.' : 'Composez d’abord une équipe.');
        }
        shut('daily-challenges-o');
        if (B) {
          backToPrep();
        }
        return goFight('omb470_' + (O.readValue().stepOf + 1));
      }
      if (v === 'dq') {
        if (!squad.length) {
          return toast('Composez d’abord une équipe.');
        }
        dqMake();
        shut('daily-challenges-o');
        if (B) {
          backToPrep();
        }
        return goFight('dq470');
      }
      if (v === 'rev' && !reviveSpecimen(X)) {
        return;
      }
      adjustPrestige(v, X);
      shut('daily-challenges-o');
      openChallengesHub();
    },
    true
  );
  /* « Défis » (Challenges) banner on the Home page (#dailyChallenges): rendered by React (src/screens/home/Banners.jsx) */
  window.__challenges = {
    readValue: readChallengeState,
    write: writeChallengeState,
    hub: openChallengesHub,
    makeDailyChallenge: dqMake,
    dailyViolation: dqViol,
    ok,
  };
}
