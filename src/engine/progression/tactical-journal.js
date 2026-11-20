import { BY, SCEN } from '../pokemon/pokemon.js';
import { PROFILE } from '../state/game-state.js';
import { medal } from '../core/utils.js';
import { HOOKS, hook } from '../core/hooks.js';
import { byUid } from '../combat/engine.js';
import { dailyKey } from '../modes/daily-battle.js';
import { DOCTRINE_DEFS } from '../combat/doctrines.js';

export { CATEGORY_NAMES }; // read by Quests › Journal (React)

/* =====================================================================
   Tactical journal (added in v4.30): report of each battle and
   statistics. Also holds the profile defaults and sanitizer of the
   v4.30 tactics state (doctrine choice and journal).
   ===================================================================== */
export function CAMP_TACTICS_0() {
  return { doctrineChoice: '', tacticsJournal: null };
}

export function campTacticsClean(p) {
  const o = CAMP_TACTICS_0();
  if (!p || typeof p !== 'object') {
    return o;
  }
  if (typeof p.doctrineChoice === 'string' && DOCTRINE_DEFS[p.doctrineChoice]) {
    o.doctrineChoice = p.doctrineChoice;
  }
  const J = p.tacticsJournal;
  if (J && typeof J === 'object') {
    const n = x => (Number.isFinite(x) ? Math.max(0, Math.min(1e9, Math.floor(x))) : 0),
      map = (m, lim) => {
        const r = {};
        if (m && typeof m === 'object') {
          Object.keys(m)
            .slice(0, lim)
            .forEach(k => BY[k] && (r[k] = n(m[k])));
        }
        return r;
      },
      cat = {};
    if (J.category && typeof J.category === 'object') {
      Object.keys(J.category).forEach(
        k =>
          Array.isArray(J.category[k]) &&
          /^[a-z]{3,12}$/.test(k) &&
          (cat[k] = [n(J.category[k][0]), n(J.category[k][1])])
      );
    }
    o.tacticsJournal = {
      n: n(J.n),
      w: n(J.w),
      runStreak: n(J.runStreak),
      best: n(J.best),
      dealt: n(J.dealt),
      taken: n(J.taken),
      ko: n(J.ko),
      mvp: map(J.mvp, 200),
      use: map(J.use, 200),
      category: cat,
      last: Array.isArray(J.last)
        ? J.last
            .filter(x => Array.isArray(x) && typeof x[0] === 'string')
            .slice(-10)
            .map(x => [
              String(x[0]).slice(0, 40),
              x[1] ? 1 : 0,
              typeof x[2] === 'string' ? x[2].slice(0, 2) : '',
              n(x[3]),
              BY[x[4]] ? x[4] : '',
            ])
        : [],
    };
  }
  return o;
}

export function log0430() {
  return { n: 0, w: 0, runStreak: 0, best: 0, dealt: 0, taken: 0, ko: 0, mvp: {}, use: {}, category: {}, last: [] };
}

export function journalDamage(S, v, real, o) {
  if (!S.stats) {
    return;
  }
  const J = S.stats.journalStats || (S.stats.journalStats = { d: {}, t: {}, k: {} });
  J.t[v.uid] = (J.t[v.uid] || 0) + real;
  const a = S.lastActor && byUid(S, S.lastActor);
  if (a && a.side !== v.side && !(o && o.ind)) {
    J.d[a.uid] = (J.d[a.uid] || 0) + real;
    if (v.hp <= 0) {
      J.k[a.uid] = (J.k[a.uid] || 0) + 1;
    }
  }
  hook('damage', S, v, real, o);
}

function scenarioCategory(sc, D) {
  if (D.gym != null || D.johto != null || D.hoenn != null) {
    return 'arenes';
  }
  if (D.elite || D.champ || D.jfinal || D.hfinal) {
    return 'ligue';
  }
  if (D.rival || D.rivalFight) {
    return 'rivaux';
  }
  if (D.dissonance || D.jdis || sc === 'hd429') {
    return 'dissonance';
  }
  if (D.legend || D.captureLegend || D.roam || D.hoennLegend || D.captureHoennLegend) {
    return 'legendes';
  }
  if (D.hebdo429 || D.tower || D.ami || sc === dailyKey()) {
    return 'defis';
  }
  if (sc === 'sauvage' || D.wild || D.route) {
    return 'sauvages';
  }
  return 'entrainement';
}

// Quests › Journal: rendered by React (src/screens/quests/Journal.jsx)

const CATEGORY_NAMES = {
  arenes: 'Arènes',
  ligue: 'Ligue',
  rivaux: 'Rivaux',
  dissonance: 'Dissonance',
  legendes: 'Légendes',
  challenges: 'Défis',
  sauvages: 'Sauvages',
  entrainement: 'Entraînement',
};

function onProgress(S, rew, win) {
  const D = SCEN[S.sc] || {};
  if (D.tuto) {
    return null;
  }
  const J0 = S.stats.journalStats || { d: {}, t: {}, k: {} },
    al = S.units.filter(u => u.side === 'a');
  const rows = al.map(u => ({
    uid: u.uid,
    id: u.id,
    sp: u.sp,
    d: J0.d[u.uid] || 0,
    t: J0.t[u.uid] || 0,
    k: J0.k[u.uid] || 0,
    ko: u.ko ? 1 : 0,
  }));
  const sc = r => r.d + r.k * 40 - r.ko * 15,
    mvp = rows.length ? rows.reduce((a, b) => (sc(b) > sc(a) ? b : a)) : null;
  rew.journalStats = { rows, mvp: mvp && mvp.d > 0 ? mvp.uid : null };
  // cumulative statistics
  const J = (PROFILE.tacticsJournal = PROFILE.tacticsJournal || log0430());
  J.n++;
  if (win) {
    J.w++;
    J.runStreak++;
    J.best = Math.max(J.best, J.runStreak);
  } else {
    J.runStreak = 0;
  }
  rows.forEach(r => {
    J.dealt += r.d;
    J.taken += r.t;
    J.ko += r.k;
    if (BY[r.sp]) {
      J.use[r.sp] = (J.use[r.sp] || 0) + 1;
    }
  });
  if (mvp && mvp.d > 0 && BY[mvp.sp]) {
    J.mvp[mvp.sp] = (J.mvp[mvp.sp] || 0) + 1;
  }
  const c = scenarioCategory(S.sc, D);
  J.category[c] = J.category[c] || [0, 0];
  J.category[c][win ? 0 : 1]++;
  J.last.push([
    (SCEN[S.sc] && SCEN[S.sc].n) || S.sc,
    win ? 1 : 0,
    S.rank || '',
    S.round || 0,
    mvp && mvp.d > 0 ? mvp.sp : '',
  ]);
  if (J.last.length > 10) {
    J.last = J.last.slice(-10);
  }
  return null;
}

// Startup statements, run in their original order (see index.js).
export function init() {
  HOOKS.progress.push(onProgress);

  HOOKS.battleResult.push(r => {
    const j = r.journalStats;
    if (!j || !j.rows.length) {
      return '';
    }
    const mx = Math.max(1, ...j.rows.map(x => x.d));
    return `<div class="result-list battle-report"><h4>Rapport tactique</h4>${j.rows
      .map(x => {
        const m = BY[x.id] || BY[x.sp];
        return `<div class="battle-report-r${j.mvp === x.uid ? ' mvp' : ''}${x.ko ? ' ko' : ''}">${medal(m.t, 'is-small')}<span class="battle-report-n"><b>${m.n}</b>${j.mvp === x.uid ? '<em>MVP</em>' : ''}</span><span class="battle-report-b"><i style="width:${Math.round((x.d / mx) * 100)}%"></i></span><span class="battle-report-v" title="Dégâts infligés · subis · K.O.">${x.d} <small>/ ${x.t}${x.k ? ` · ${x.k} K.O.` : ''}</small></span></div>`;
      })
      .join(
        ''
      )}<p class="battle-report-l">Dégâts infligés / subis. Statistiques complètes : Quêtes › Journal.</p></div>`;
  });
}
