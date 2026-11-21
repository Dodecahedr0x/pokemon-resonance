import { POKEMON, SCENARIOS } from '../pokemon/pokemon.js';
import { HELD_ITEMS, PROFILE } from '../state/game-state.js';
import { medal } from '../core/utils.js';
import { HOOKS } from '../core/hooks.js';
import { SPARK, shinyStyle } from '../pokemon/shiny.js';
import { LEGENDARIES } from './legendaries.js';
import { towerIdle, towerRun } from './resonance-tower.js';

/* Adventure+ save fields and battle rewards: shinies, rival, legendary bosses and Resonance Tower (added in v4.4). */

/* ---------- profile: new fields (all optional in old saves) ---------- */
export function defaultAdventureProfile() {
  return { shiny: [], rival: 0, legends: [], tdr: { best: 0, run: null }, johto: [], jchamp: 0, lac: 0 };
}

export function aplusClean(p) {
  const o = defaultAdventureProfile();
  if (!p || typeof p !== 'object') {
    return o;
  }
  if (Array.isArray(p.shiny)) {
    o.shiny = [...new Set(p.shiny.filter(id => POKEMON[id] && !POKEMON[id].leg))];
  }
  if (Number.isFinite(p.rival)) {
    o.rival = Math.max(0, Math.min(4, Math.floor(p.rival)));
  }
  if (Array.isArray(p.johto)) {
    o.johto = [...new Set(p.johto.filter(i => Number.isInteger(i) && i >= 0 && i < 8))];
  } // v4.15
  o.jchamp = p.jchamp ? 1 : 0;
  o.lac = p.lac ? 1 : 0;
  if (Array.isArray(p.legends)) {
    o.legends = [...new Set(p.legends.filter(id => LEGENDARIES.some(L => L.id === id)))];
  }
  const t = p.tdr;
  if (t && typeof t === 'object') {
    if (Number.isFinite(t.best)) {
      o.tdr.best = Math.max(0, Math.min(999, Math.floor(t.best)));
    }
    const r = t.run;
    if (
      r &&
      typeof r === 'object' &&
      Number.isFinite(r.seed) &&
      Number.isFinite(r.floor) &&
      Array.isArray(r.team) &&
      r.team.length === 4 &&
      r.team.every(id => POKEMON[id] && !POKEMON[id].leg)
    ) {
      o.tdr.run = {
        seed: Math.floor(r.seed) % 1e9,
        floor: Math.max(1, Math.min(999, Math.floor(r.floor))),
        team: [...r.team],
        voice: Number.isFinite(r.voice) ? Math.max(0, Math.min(2, Math.floor(r.voice))) : 0,
        items: {},
        reward: !!r.reward,
      };
      if (r.items && typeof r.items === 'object') {
        for (const k in r.items) {
          if (POKEMON[k] && HELD_ITEMS[r.items[k]]) {
            o.tdr.run.items[k] = r.items[k];
          }
        }
      }
    }
  }
  return o;
}

/* =====================================================================
   Progression: rewards for the new battles (called by applyProgress)
   ===================================================================== */
export function aplusProgress(S, rew) {
  const D = SCENARIOS[S.sc] || {},
    win = S.over === 'win';
  let m = 0,
    g = 0;
  /* shinies captured */
  (S.stats.shiny || []).forEach(id => {
    const b = POKEMON[id] ? POKEMON[id].id : null;
    if (!b) {
      return;
    }
    if (!PROFILE.shiny.includes(b)) {
      PROFILE.shiny.push(b);
    }
    (rew.shiny = rew.shiny || []).push(b);
  });
  if (win && D.rival && PROFILE.rival < D.rival) {
    PROFILE.rival = D.rival;
    m += 300 + D.rival * 100;
    g += 4;
    rew.rival = D.rival;
  }
  if (win && D.legend && !PROFILE.legends.includes(D.legend)) {
    PROFILE.legends.push(D.legend);
    m += 1200;
    g += 15;
    rew.legend = D.legend;
  }
  if (S.sc === 'tdr' && D.tower) {
    const run = towerRun();
    if (run) {
      const f = run.floor;
      if (win) {
        PROFILE.tdr.best = Math.max(PROFILE.tdr.best, f);
        m += 60 * f;
        if (f % 5 === 0) {
          g += 6;
        }
        run.floor = f + 1;
        run.reward = true;
        rew.tdr = { cleared: f, next: f + 1, best: PROFILE.tdr.best };
      } else {
        PROFILE.tdr.best = Math.max(PROFILE.tdr.best, f - 1);
        PROFILE.tdr.run = null;
        rew.tdr = { cleared: f - 1, end: true, best: PROFILE.tdr.best };
        towerIdle();
      }
    }
  }
  HOOKS.progress.forEach(h => {
    const r = h(S, rew, win); // colossi, achievements... (v4.8+)
    if (r) {
      m += r[0] || 0;
      g += r[1] || 0;
    }
  });
  if (m || g) {
    PROFILE.money = Math.min(999999, (PROFILE.money || 0) + m);
    PROFILE.gems = Math.min(99999, (PROFILE.gems || 0) + g);
    rew.money = (rew.money || 0) + m;
    rew.gems = (rew.gems || 0) + g;
  }
}

/* lines added to the result screen */
export function aplusRewHtml(r) {
  const o = [];
  if (r.shiny && r.shiny.length) {
    o.push(
      `<div class="result-list"><h4>Chromatique</h4>${r.shiny.map(id => `<div class="result-row is-shiny" style="${shinyStyle(id)}">${medal(POKEMON[id].t)}<span>${POKEMON[id].n} chromatique rejoint votre collection</span><b>${SPARK}</b></div>`).join('')}</div>`
    );
  }
  if (r.rival) {
    o.push(
      `<div class="result-list"><h4>Rival</h4><div class="result-row"><span>${r.rival < 4 ? `Kael est battu (${r.rival} / 4). Il reviendra plus fort.` : 'Kael est battu pour de bon. La Ligue vous attend.'}</span><b>${r.rival} / 4</b></div></div>`
    );
  }
  if (r.legend) {
    o.push(
      `<div class="result-list"><h4>Légende</h4><div class="result-row">${medal(POKEMON[r.legend].t)}<span>${POKEMON[r.legend].n} vaincu · ${PROFILE.legends.length} / 6 légendes</span><b>★</b></div></div>`
    );
  }
  if (r.tdr) {
    o.push(
      `<div class="result-list"><h4>Tour de Résonance</h4><div class="result-row"><span>${r.tdr.end ? `Ascension terminée à l’étage ${r.tdr.cleared}.` : `Étage ${r.tdr.cleared} franchi. Une récompense vous attend avant l’étage ${r.tdr.next}.`} Record : étage ${r.tdr.best}.</span><b>${r.tdr.cleared}</b></div></div>`
    );
  }
  HOOKS.battleResult.forEach(h => o.push(h(r) || '')); // v4.8+
  return o.join('');
}
