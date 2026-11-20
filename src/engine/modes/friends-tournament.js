/* =====================================================================
   Friends tournament (added in v4.17): your friends' teams back to back,
   no healing between battles.
   ===================================================================== */
import { BY, SCEN } from '../pokemon/pokemon.js';
import { BUDGET } from '../pokemon/evolution.js';
import { PROFILE } from '../state/game-state.js';
import { RC } from '../pokemon/roles-synergies.js';
import { $, toast } from '../core/utils.js';
import { HOOKS } from '../core/hooks.js';
import { squad, vBonus } from '../team/team.js';
import { armedBossRush, isBossRushBoss } from './boss-rush.js';
import { B, backToPrep, battleOpts, goFight, scSel } from '../combat/ui.js';
import { esc, queueSave } from '../state/saves.js';
import { ACHIEVEMENTS } from '../progression/achievements.js';
import { teamSize } from '../progression/campaign-challenges.js';
import { refreshHome } from '../../screens/home/homeStore.js';
import { buildFriendTeam, friendScore } from './friend-challenges.js';

const getTournamentRun = () => (PROFILE.tournoi && PROFILE.tournoi.run) || null;

function computeTournamentOrder() {
  return [...(PROFILE.friends || [])]
    .sort((a, b) => friendScore(a.s) - friendScore(b.s))
    .slice(0, 5)
    .map(a => a.id);
}

function launchTournament() {
  const ordering = computeTournamentOrder();
  if (ordering.length < 2) {
    return void toast('Il faut au moins 2 amis pour un tournoi.');
  }
  if (!squad.length) {
    return void toast('Composez d’abord une équipe.');
  }
  PROFILE.tournoi.run = { team: squad.slice(0, teamSize()), order: ordering, i: 0, hp: {} };
  queueSave();
  startTournamentBattle();
}

function startTournamentBattle() {
  const run = getTournamentRun();
  if (!run) {
    return;
  }
  const i = (PROFILE.friends || []).findIndex(a => a.id === run.order[run.i]);
  if (i < 0) {
    PROFILE.tournoi.run = null;
    return void toast('Un ami a quitté le carnet : le tournoi s’arrête.');
  }
  buildFriendTeam(i);
  Object.assign(SCEN.ami, {
    tournoi: run.order[run.i],
    n: `Tournoi · ${PROFILE.friends[i].n}`,
    lvl: `Tournoi entre amis · combat ${run.i + 1} sur ${run.order.length}`,
  });
  SCEN.ami.d =
    `Combat ${run.i + 1} sur ${run.order.length}. Vos Pokémon gardent leurs PV d’un combat à l’autre, et ceux qui tombent ne reviennent pas. ` +
    SCEN.ami.d;
  if (B) {
    backToPrep();
  }
  goFight('ami');
}

/** The frozen tournament team (read when battles are launched). */
export function tournamentTeam() {
  if (isBossRushBoss(scSel)) {
    return { team: armedBossRush().team, voice: vBonus(), opts: battleOpts() };
  } // Boss Rush: frozen team
  const run = getTournamentRun(),
    D = SCEN.ami || {};
  if (scSel !== 'ami' || !run || D.tournoi !== run.order[run.i]) {
    return null;
  }
  const c = run.team.reduce((t, id) => t + RC(id), 0);
  return { team: run.team, voice: Math.min(2, Math.floor((BUDGET - c) / 4)), opts: battleOpts() };
}

export function tournamentPanelHtml() {
  const L = PROFILE.friends || [],
    run = getTournamentRun(),
    T = PROFILE.tournoi || {};
  if (L.length < 2) {
    return '';
  }
  if (run) {
    const A = L.find(a => a.id === run.order[run.i]);
    return `<div class="home-tournament is-running"><span><b>Tournoi en cours · ${run.i} / ${run.order.length}</b><em>Prochain : ${A ? esc(A.n) : '?'} · votre équipe : ${run.team.map(id => BY[id].n).join(', ')}</em></span><span class="home-friends-buttons"><button type="button" class="button button-small button-primary" data-tournoi="suite">Continuer</button><button type="button" class="button button-small button-ghost" data-tournoi="abandon">Abandonner</button></span></div>`;
  }
  return `<div class="home-tournament"><span><b>Tournoi entre amis</b><em>${Math.min(5, L.length)} équipes à la suite, sans soin entre les combats. Record : ${T.best || 0}${T.winCount ? ` · remporté ${T.winCount} fois` : ''}.</em></span><button type="button" class="button button-small button-primary" data-tournoi="lancer">Lancer</button></div>`;
}

// Statements run at startup, in the original order (see index.js).
export function init() {
  HOOKS.combat.push((S, opt, D0) => {
    const run = getTournamentRun();
    if (!D0 || !D0.tournoi || !run || D0.tournoi !== run.order[run.i]) {
      return;
    }
    S.tournamentScene = D0.tournoi;
    S.units.forEach(u => {
      if (u.side !== 'a' || run.hp[u.sp] == null) {
        return;
      }
      const r = run.hp[u.sp];
      if (r <= 0) {
        u.hp = 0;
        u.ko = true;
      } else {
        u.hp = Math.max(1, Math.round(u.mhp * r));
      }
    });
  });

  HOOKS.progress.push((S, rew, win) => {
    const run = getTournamentRun();
    if (!S.tournamentScene || !run || S.tournamentScene !== run.order[run.i]) {
      return null;
    }
    if (SCEN.ami) {
      SCEN.ami.tournoi = null;
    } // "Rejouer" (Replay): an ordinary friendly challenge
    const T = PROFILE.tournoi;
    if (!win) {
      T.best = Math.max(T.best, run.i);
      T.run = null;
      rew.tournoi = { fin: true, i: run.i, n: run.order.length };
      return null;
    }
    S.units.filter(u => u.side === 'a').forEach(u => (run.hp[u.sp] = u.ko ? 0 : u.hp / u.mhp));
    run.i++;
    if (run.i >= run.order.length) {
      T.best = Math.max(T.best, run.order.length);
      T.winCount = (T.winCount || 0) + 1;
      T.run = null;
      rew.tournoi = { gagne: true, n: run.order.length };
      return [2000, 10];
    }
    const A = (PROFILE.friends || []).find(a => a.id === run.order[run.i]);
    rew.tournoi = { suite: true, i: run.i, n: run.order.length, displayName: A ? A.n : '' };
    return null;
  });

  HOOKS.battleResult.push(r => {
    const t = r.tournoi;
    if (!t) {
      return '';
    }
    if (t.gagne) {
      return `<div class="result-list"><h4>Tournoi entre amis</h4><div class="result-row"><span><b>Tournoi remporté !</b> ${t.n} équipes battues à la suite : +10 Éclats.</span><b>🏆</b></div></div>`;
    }
    if (t.fin) {
      return `<div class="result-list"><h4>Tournoi entre amis</h4><div class="result-row"><span>Le tournoi s’arrête au combat ${t.i + 1} sur ${t.n}. Record : ${PROFILE.tournoi.best} victoire${PROFILE.tournoi.best > 1 ? 's' : ''}.</span><b>${t.i} / ${t.n}</b></div></div>`;
    }
    return `<div class="result-list"><h4>Tournoi entre amis</h4><div class="result-row"><span>Victoire ${t.i} sur ${t.n}. Prochain adversaire : ${esc(t.displayName)}. Vos PV restent tels quels.</span><button type="button" class="button button-small button-primary" data-tournoi="suite">Combat suivant</button></div></div>`;
  });

  document.addEventListener('click', e => {
    const b = e.target.closest('[data-tournoi]');
    if (!b) {
      return;
    }
    const k = b.dataset.tournoi;
    if (k === 'lancer') {
      launchTournament();
    } else if (k === 'suite') {
      $('#cbResult').hidden = true;
      startTournamentBattle();
    } else if (k === 'abandon') {
      const run = getTournamentRun();
      if (run) {
        PROFILE.tournoi.best = Math.max(PROFILE.tournoi.best, run.i);
      }
      PROFILE.tournoi.run = null;
      queueSave();
      toast('Tournoi abandonné.');
      refreshHome();
    }
  });

  /* ---------- achievements ---------- */
  ACHIEVEMENTS.push({
    id: 'tournoi',
    n: 'Roi du tournoi',
    d: 'Remporter un tournoi entre amis.',
    t: 'Roi du tournoi',
    ok: () => ((PROFILE.tournoi || {}).winCount || 0) > 0,
  });
}
