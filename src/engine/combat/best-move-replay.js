/* Best-move replay: each action of your Pokémon is scored (damage, KOs, reactions, chords, Awakenings) and the result screen offers to rewatch the best one (added in v4.11). */

import { $, reducedMotion, wait } from '../core/utils.js';
import { HOOKS } from '../core/hooks.js';
import { byUid } from './engine.js';
import { battle, __set_battle, buildBoard, addLog, renderAll, ui } from './ui.js';
import { playEv } from './move-effects.js';
import { AUTO } from '../progression/prestige.js';

export let REPLAYS;
let REPLAY_IN_PROGRESS;

/** An action's score, based on its events. */
function currentScore(S, ev) {
  let d = 0,
    ko = 0,
    rx = 0,
    acc = '',
    evo = 0;
  ev.forEach(x => {
    const v = x.u && byUid(S, x.u);
    if (x.e === 'dmg' && v && v.side === 'e') {
      d += x.v;
    }
    if (x.e === 'ko' && v && v.side === 'e' && !v.seg) {
      ko++;
    }
    if (x.e === 'rx') {
      rx++;
    }
    if (x.e === 'evo') {
      evo++;
    }
    if (x.e === 'msg' && /^Accord de Résonance · ([^!]+)/.test(x.s)) {
      acc = x.s.match(/^Accord de Résonance · ([^!]+)/)[1].trim();
    }
  });
  return { s: d + ko * 30 + rx * 10 + (acc ? 25 : 0) + evo * 15, d, ko, rx, acc, evo };
}

/** Called by pAct and pAwaken: keeps the battle's best action. */
export function noteMoment(S, u, displayName, ev, previous, heading) {
  const R = REPLAYS.get(S);
  if (!R || !ev || !previous) {
    return;
  }
  const sc = currentScore(S, ev);
  if (sc.s <= 0 || (R.best && R.best.score >= sc.s)) {
    return;
  }
  const det = [
    sc.d ? `${sc.d} dégâts` : '',
    sc.ko ? `${sc.ko} K.O.` : '',
    sc.rx ? `${sc.rx} réaction${sc.rx > 1 ? 's' : ''}` : '',
    sc.acc ? `Accord ${sc.acc}` : '',
    sc.evo ? 'Éveil' : '',
  ].filter(Boolean);
  R.best = {
    score: sc.s,
    before: previous,
    apres: JSON.stringify(S),
    ev: JSON.parse(JSON.stringify(ev)),
    label: `Manche ${S.round} · ${heading || `${u.n} · ${displayName}`}`,
    det: det.join(' · '),
  };
}

async function rebroadcast() {
  const R = battle && REPLAYS.get(battle);
  if (!R || !R.best || REPLAY_IN_PROGRESS) {
    return;
  }
  REPLAY_IN_PROGRESS = true;
  const endStep = battle,
    res = $('#cbResult'),
    isSlow = reducedMotion || AUTO ? 0.2 : 1;
  try {
    res.hidden = true;
    __set_battle(Object.assign(JSON.parse(R.best.before), { over: null }));
    ui.busy = true;
    buildBoard();
    renderAll();
    addLog(`Rediffusion : ${R.best.label}`, 'arn');
    await wait(900 * isSlow);
    __set_battle(Object.assign(JSON.parse(R.best.apres), { over: null }));
    renderAll();
    playEv(R.best.ev);
    await wait(3200 * isSlow);
  } finally {
    __set_battle(endStep);
    ui.busy = false;
    buildBoard();
    renderAll();
    res.hidden = false;
    REPLAY_IN_PROGRESS = false;
  }
}

// Statements run at startup, in the original order (see index.js).
export function init() {
  REPLAYS = new WeakMap();

  REPLAY_IN_PROGRESS = false;

  document.addEventListener('click', e => {
    if (e.target.closest('[data-rediff]')) {
      rebroadcast();
    }
  });

  HOOKS.battleResult.push(() => {
    const R = battle && REPLAYS.get(battle);
    return R && R.best
      ? `<div class="result-list"><h4>Meilleur coup</h4><div class="result-row is-replay"><span><b>${R.best.label}</b>${R.best.det ? ` · ${R.best.det}` : ''}</span><button type="button" class="button button-small" data-rediff>Revoir</button></div></div>`
      : '';
  });
}
