/* Ball training: five timed throws for a personal score, three sessions a day (added in v4.71). */

import { toast } from '../core/utils.js';
import { save } from '../team/team.js';
import { today } from '../state/economy.js';
import { startCatchTiming } from '../combat/timed-catch.js';
import { applyReward } from '../world/route-events.js';
import { openMoreChallenges, readMoreChallenges, writeMoreChallenges } from './more-challenges.js';

/** Starts a training session, then reopens the « Plus de défis » window. */
export const trainingSession = () => {
  const X = readMoreChallenges();
  if (X.ct.d !== today()) {
    X.ct = { d: today(), n: 0, best: X.ct.best || 0 };
  }
  if (X.ct.n >= 3) {
    return toast('Trois séances aujourd’hui : revenez demain.');
  }
  let hits = 0,
    score = 0;
  const launchMove = () => {
    if (hits >= 5) {
      return endStep();
    }
    startCatchTiming(q => {
      hits++;
      score += q === 'perfect' ? 2 : q === 'ok' ? 1 : 0;
      launchMove();
    });
  };
  const endStep = () => {
    const Y = readMoreChallenges();
    Y.ct = { d: today(), n: (Y.ct.n || 0) + 1, best: Math.max(Y.ct.best || 0, score) };
    if (score >= 8) {
      applyReward({ b: { poke: 1 }, m: 200 });
      toast('Entraînement réussi : une Poké Ball et 200 ₽ !');
    } else {
      toast('Score : ' + score + ' / 10. Record : ' + Y.ct.best + '.');
    }
    writeMoreChallenges(Y);
    save();
    openMoreChallenges();
  };
  launchMove();
};
