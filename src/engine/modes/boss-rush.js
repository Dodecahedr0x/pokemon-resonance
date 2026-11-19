/* Boss Rush and run relics (added in v4.66). */

import { BY, SCEN } from '../pokemon/pokemon.js';
import { isCamp } from '../state/game-state.js';
import { ARENAS, BADGES } from './gyms.js';
import { $, writeLS, readLS, toast } from '../core/utils.js';
import { HOOKS } from '../core/hooks.js';
import { squad } from '../team/team.js';
import { heal } from '../combat/engine.js';
import { B, backToPrep, goFight, launch } from '../combat/ui.js';
import { esc } from '../state/saves.js';
import { sfx, vibe } from '../progression/campaign.js';
import { overlay } from '../progression/prestige.js';
import { shut } from '../../screens/overlays/tempStore.js';
import { refreshHome } from '../../screens/home/homeStore.js';
import { DAMAGE_PROVIDERS } from '../combat/tactical-engine.js';
import { teamSize } from '../progression/achievements-challenges.js';

function relicOffer(run) {
  const freeOnes = RELICS.filter(r => !run.relics.includes(r.id)).map(r => r.id);
  const out = [];
  while (out.length < 3 && freeOnes.length) {
    out.push(freeOnes.splice(Math.floor(Math.random() * freeOnes.length), 1)[0]);
  }
  return out;
}

function bossRushHub() {
  const st = bossRushState(),
    run = st.run;
  let d;
  if (!bossRushUnlocked()) {
    d = { mode: 'lock' };
  } else if (!run) {
    d = {
      mode: 'new',
      best: st.best,
      won: st.won || 0,
      teamNames: squad.length
        ? squad
            .slice(0, teamSize())
            .map(id => BY[id].n)
            .join(', ')
        : 'aucun Pokémon',
    };
  } else {
    const rl = runRelics(run)
      .map(id => RELICS.find(r => r.id === id))
      .filter(Boolean);
    const eq = run.team
      .map(
        id =>
          `${BY[id].n} ${Math.round((run.hp[BY[id].base] != null ? run.hp[BY[id].base] : run.hp[id] != null ? run.hp[id] : 1) * 100)} %`
      )
      .join(' · ');
    d = {
      mode: 'run',
      i: run.i,
      total: run.boss.length,
      eq,
      relics: rl.map(r => r.n),
      pend: run.pend
        ? run.pend.map(id => RELICS.find(r => r.id === id)).map(r => ({ id: r.id, n: r.n, d: r.d }))
        : null,
      boss: run.pend ? null : bossName(run.boss[run.i]),
    };
  }
  // rendering: src/screens/overlays/transients/Windows.jsx (BossRush)
  const o = overlay('boss-rush-o', d);
  o.addEventListener('click', e => {
    if (e.target === o) {
      shut('boss-rush-o');
    }
  });
}

function bossRushGo() {
  const run = currentRun();
  if (!run || run.pend) {
    return;
  }
  BOSS_RUSH.armed = true;
  shut('boss-rush-o');
  $('#cbResult').hidden = true;
  if (B) {
    backToPrep();
  }
  goFight(run.boss[run.i]);
  try {
    launch(); // the run's team is locked: we go straight into battle
  } catch {
    /* Best effort: failure here is non-fatal. */
  }
}

/** Boss Rush banner on the Home screen (#bossRush, rendered by src/screens/home/Banners.jsx). */
export function bossRushData() {
  const run = currentRun();
  return {
    i: run ? run.i + 1 : '5',
    txt: !bossRushUnlocked()
      ? 'Débloqué avec 5 badges'
      : run
        ? `Run en cours : boss ${run.i + 1} sur ${run.boss.length}`
        : `5 boss à la suite · record ${bossRushState().best}`,
  };
}

/** Boss Rush armed: the current run, otherwise null. The engine uses it to open the current boss,
    skip campaign challenges and lock the team (scenLock, challengeLaunch, tournamentTeam). */
export function armedBossRush() {
  return (BOSS_RUSH && BOSS_RUSH.armed && currentRun()) || null;
}

/** Is scenario k the boss to face right now in the armed Boss Rush? */
export function isBossRushBoss(k) {
  const run = armedBossRush();
  return !!run && k === run.boss[run.i];
}

export const RELICS = [
  { id: 'ecaille', n: 'Écaille ardente', d: '+10 % de dégâts pour toute l’équipe.' },
  { id: 'petale', n: 'Pétale de vie', d: 'Fin de manche : l’équipe récupère 5 % de ses PV max.' },
  { id: 'cristal', n: 'Cristal de Résonance', d: 'Chaque combat, toute l’équipe commence avec 1 losange.' },
  { id: 'bouclier', n: 'Bouclier d’écho', d: 'L’avant-garde commence chaque combat avec 2 de Garde.' },
  { id: 'tonique', n: 'Tonique', d: 'Après chaque boss battu, l’équipe récupère 25 % de ses PV max.' },
  { id: 'lentille', n: 'Lentille', d: '+15 % de dégâts sur une cible sous 50 % de PV.' },
  { id: 'coeur', n: 'Cœur léger', d: 'Après un boss, un Pokémon tombé revient avec 30 % de PV (une fois par run).' },
];

const BOSS_RUSH_KEY = 'res-boss-rush';

const bossRushState = () => readLS(BOSS_RUSH_KEY, { best: 0, won: 0, run: null });

const bossRushSave = s => {
  writeLS(BOSS_RUSH_KEY, s);
};

const BOSS_RUSH = { armed: false };

const currentRun = () => bossRushState().run;

const bossRushBosses = () => {
  const L = isCamp() ? ARENAS.filter((a, i) => BADGES.includes(i) || BADGES.includes(a.k)) : ARENAS; // BADGES: gym numbers (0 to 7)
  return L.slice(-5).map(a => a.k);
};

const bossRushUnlocked = () => (isCamp() ? BADGES.length >= 5 : true);

const runRelics = run => (run && run.relics ? run.relics : []);

const bossName = k => (SCEN[k] ? SCEN[k].n : k);

// Instructions run at startup, in the original order (see index.js).
export function init() {
  HOOKS.combat.push(S => {
    const run = currentRun();
    if (!BOSS_RUSH.armed || !run || S.sc !== run.boss[run.i]) {
      return;
    }
    S.bossRush = true;
    const al = S.units.filter(u => u.side === 'a');
    al.forEach(u => {
      const r = run.hp[u.sp];
      if (r == null) {
        return;
      }
      if (r <= 0) {
        u.hp = 0;
        u.ko = true;
      } else {
        u.hp = Math.max(1, Math.round(u.mhp * r));
      }
    });
    const R = runRelics(run);
    if (R.includes('cristal')) {
      al.forEach(u => !u.ko && (u.en = Math.max(u.en || 0, 1)));
    }
    if (R.includes('bouclier')) {
      const f = al.find(u => !u.ko);
      if (f) {
        f.guard = Math.max(f.guard || 0, 2);
      }
    }
  });

  HOOKS.beforeRoundEnd.push((S, ev) => {
    if (!S.bossRush || !runRelics(currentRun()).includes('petale')) {
      return;
    }
    S.units.filter(u => u.side === 'a' && !u.ko).forEach(u => heal(S, u, Math.max(1, Math.round(u.mhp * 0.05)), ev));
  });

  DAMAGE_PROVIDERS.push({
    id: 'relic-bonus',
    provide: (c, { S, u, t }) => {
      if (!S || !S.bossRush || !u || u.side !== 'a') {
        return false;
      }
      const R = runRelics(currentRun());
      let pc = 0;
      if (R.includes('ecaille')) {
        pc += 10;
      }
      if (R.includes('lentille') && t && t.hp / t.mhp < 0.5) {
        pc += 15;
      }
      return pc > 0 && { mul: 1 + pc / 100, labelText: 'Reliques' };
    },
  });

  HOOKS.progress.unshift((S, rew, win) => {
    try {
      const st = bossRushState(),
        run = st.run;
      if (!S.bossRush || !run || S.sc !== run.boss[run.i]) {
        return null;
      }
      BOSS_RUSH.armed = false;
      const n = run.boss.length;
      if (!win) {
        st.best = Math.max(st.best, run.i);
        st.run = null;
        bossRushSave(st);
        rew.bossRush = { fin: true, i: run.i, n };
        return run.i ? [100 * run.i, 0] : null;
      }
      S.units.filter(u => u.side === 'a').forEach(u => (run.hp[u.sp] = u.ko ? 0 : u.hp / u.mhp));
      run.i++;
      if (run.i >= n) {
        st.best = n;
        st.won = (st.won || 0) + 1;
        st.run = null;
        bossRushSave(st);
        rew.bossRush = { gagne: true, n };
        return [3000, 10];
      }
      if (run.relics.includes('tonique')) {
        Object.keys(run.hp).forEach(k => run.hp[k] > 0 && (run.hp[k] = Math.min(1, run.hp[k] + 0.25)));
      }
      if (run.relics.includes('coeur') && !run.coeur) {
        const k = Object.keys(run.hp).find(x => run.hp[x] <= 0);
        if (k) {
          run.hp[k] = 0.3;
          run.coeur = 1;
        }
      }
      run.pend = relicOffer(run);
      st.best = Math.max(st.best, run.i);
      bossRushSave(st);
      rew.bossRush = { suite: true, i: run.i, n, displayName: bossName(run.boss[run.i]) };
      return [150 * run.i, run.i >= 3 ? 1 : 0];
    } catch (e) {
      return null;
    }
  });

  HOOKS.battleResult.unshift(r => {
    const t = r.bossRush;
    if (!t) {
      return '';
    }
    if (t.gagne) {
      return `<div class="res-l"><h4>Boss Rush</h4><div class="rl"><span><b>Boss Rush terminé !</b> ${t.n} boss battus à la suite : +10 Éclats.</span><b>🏆</b></div></div>`;
    }
    if (t.fin) {
      return `<div class="res-l"><h4>Boss Rush</h4><div class="rl"><span>Le run s’arrête au boss ${t.i + 1} sur ${t.n}. Record : ${bossRushState().best}.</span></div></div>`;
    }
    return `<div class="res-l"><h4>Boss Rush</h4><div class="rl"><span>Boss ${t.i} sur ${t.n}. Prochain : ${esc(t.displayName)}. Vos PV ne se régénèrent pas.</span><button type="button" class="b b-sm b-gold" data-boss-rush="suite">Étape suivante</button></div></div>`;
  });

  document.addEventListener(
    'click',
    e => {
      const b = e.target.closest && e.target.closest('[data-boss-rush]');
      if (!b) {
        return;
      }
      e.stopPropagation();
      e.preventDefault();
      const v = b.dataset.bossRush,
        st = bossRushState();
      if (v === 'open') {
        return bossRushHub();
      }
      if (v === 'close') {
        return shut('boss-rush-o');
      }
      if (v === 'start') {
        if (!bossRushUnlocked() || !squad.length || st.run) {
          return;
        }
        st.run = { team: squad.slice(0, teamSize()), boss: bossRushBosses(), i: 0, hp: {}, relics: [], pend: null };
        bossRushSave(st);
        return bossRushGo();
      }
      if (v === 'go') {
        return bossRushGo();
      }
      if (v === 'suite') {
        $('#cbResult').hidden = true;
        return bossRushHub();
      }
      if (v === 'abandon') {
        if (st.run) {
          st.best = Math.max(st.best, st.run.i);
        }
        st.run = null;
        bossRushSave(st);
        BOSS_RUSH.armed = false;
        toast('Boss Rush abandonné.');
        shut('boss-rush-o');
        return refreshHome();
      }
      if (v.startsWith('rel:') && st.run && st.run.pend) {
        const id = v.slice(4);
        if (!st.run.pend.includes(id)) {
          return;
        }
        st.run.relics.push(id);
        st.run.pend = null;
        bossRushSave(st);
        sfx('win');
        vibe(25);
        toast('Relique obtenue : ' + RELICS.find(r => r.id === id).n + '.');
        return bossRushHub();
      }
    },
    true
  );
}
