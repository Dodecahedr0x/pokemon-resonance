/* Original section: v4.71: rivalry, challenge weather, trainer of the week, relic showcase, Shadows rematch, Ball training */

import { BY, SCEN } from './009-pokemon.js';
import { writeLS, toast } from './014-utils.js';
import { HOOKS } from './015-hooks.js';
import { save, squad } from './020-team-cards.js';
import { OBST } from './023-roles-synergies-obstacles.js';
import { B, backToPrep, goFight } from './024-combat-ui.js';
import { overlay } from './030-prestige-staging.js';
import { shut } from '../screens/overlays/tempStore.js';
import { today } from './032-v4-foundation.js';
import { DEXS } from './038-pokedex.js';
import { todayWeather } from './057-companions-resonance.js';
import { startCatchTiming } from './083-timed-catch-status.js';
import { applyReward } from './084-peddler-route-missions.js';
import { RELICS } from './097-boss-rush-relics.js';

// Statements run at startup, in the original order (see index.js).
export function __init() {
  (() => {
    const KEY = 'res-x2470';
    const DEF = () => ({
      rival: [],
      wk: { k: '', done: false, best: 0 },
      relics: [],
      inv: { d: '', done: false },
      ct: { d: '', n: 0, best: 0 },
    });
    const readValue = () => {
      try {
        return Object.assign(DEF(), JSON.parse(localStorage.getItem(KEY)));
      } catch (e) {
        return DEF();
      }
    };
    const write = o => {
      writeLS(KEY, o);
    };
    const hash = s => {
      let h = 17;
      for (const ch of s) {
        h = (h * 31 + ch.charCodeAt(0)) >>> 0;
      }
      return h;
    };
    const dateDay = () => today();
    const week = () => 'S' + Math.floor(Date.now() / (7 * 864e5));
    const ok = ids => ids.filter(i => BY[i]);
    const POS = [
      [6, 1],
      [6, 3],
      [7, 2],
      [7, 4],
    ];
    const mkFoes = ids => ok(ids).map((id, i) => [id, POS[i % POS.length]]);
    const WEATHER_NAME = { pluie: 'Pluie', soleil: 'Soleil', sable: 'Sable', grele: 'Grêle' };
    const weatherKind = () => {
      try {
        return todayWeather();
      } catch (e) {
        return null;
      }
    };

    /* ---- 3. Trainer of the week ---- */
    const NAMES = ['Léa Ferrand', 'Marc Dalbert', 'Inès Montarbre', 'Tom Lacrête', 'Sana Verdier', 'Hugo Brisemare'];
    const pool = () => ok(DEXS.map(m => m.id)).filter(id => BY[id] && !BY[id].isEnemy);
    const weekDef = () => {
      const h = hash(week());
      const p = pool();
      const ids = [0, 1, 2].map(i => p[(h + i * 977) % p.length]);
      return { n: NAMES[h % NAMES.length], ids, lv: 24 + (h % 6) };
    };
    const wkMake = () => {
      const D = weekDef();
      SCEN.wk470 = Object.assign(
        {
          n: 'Dresseur de la semaine',
          lvl: 'Semaine · ' + D.n,
          lim: 12,
          time: 'jour',
          bio: 'gue',
          d: D.n + ' vous attend avec une équipe qui change chaque semaine.',
          water: [],
          rock: ['3,0', '3,5'],
          hb: 4,
          pb: 1,
          lv: D.lv,
          foes: mkFoes(D.ids),
        },
        {}
      );
      try {
        OBST.wk470 = { pil: ['4,2'], grass: ['4,4'] };
      } catch {
        /* Best effort: failure here is non-fatal. */
      }
      return D;
    };
    wkMake();

    /* ---- 5. Inverted Shadows: Vaskar's rematch, harder ---- */
    SCEN.inv470 = Object.assign(
      {
        n: 'Ombres inversées',
        lvl: 'Revanche · Vaskar',
        lim: 14,
        time: 'nuit',
        bio: 'gue',
        d: 'Vaskar revient avec les Ombres renforcées. Une revanche sans répit, qui ne se refuse pas.',
        water: [],
        rock: ['3,0', '3,5'],
        hb: 8,
        pb: 2,
        lv: 44,
        foes: mkFoes(['absol', 'demolosse', 'tyranocif', 'noctali']),
      },
      {}
    );
    try {
      OBST.inv470 = { pil: ['4,2'], grass: ['4,4', '5,1'] };
    } catch {
      /* Best effort: failure here is non-fatal. */
    }

    /* ---- Rewards and tracking (progression) ---- */
    HOOKS.progress.unshift((S, rew, win) => {
      try {
        const k = S.sc || '';
        const X = readValue();
        let m = 0,
          g = 0;
        // 1. Rivalry: Kael reacts to the Shadows battles
        if (win && /^omb470_/.test(k)) {
          const n = +k.slice(7);
          X.rival.push(
            n < 4
              ? 'Kael : « Les Ombres reculent. Vaskar ne tardera pas à réagir. »'
              : 'Kael : « Vaskar est tombé. Je n’oublierai pas ce combat. »'
          );
          X.rival = X.rival.slice(-3);
        }
        // 2. Weather: daily challenge bonus
        if (win && k === 'dq470') {
          const w = weatherKind();
          if (w === 'pluie') {
            g += 1;
          }
          if (w === 'soleil') {
            m += 200;
          }
          if (w === 'sable' || w === 'grele') {
            g += 1;
          }
        }
        // 3. Trainer of the week: only one victory per week
        if (win && k === 'wk470') {
          if (X.wk.k !== week() || !X.wk.done) {
            X.wk = { k: week(), done: true, best: Math.max(X.wk.best || 0, 1) };
            m += 2000;
            g += 5;
          }
        }
        // 5. Vaskar's rematch: once a day
        if (win && k === 'inv470' && X.inv.d !== dateDay()) {
          X.inv = { d: dateDay(), done: true };
          m += 1500;
          g += 2;
        }
        // 4. Showcase: three or more relics give a Shard per victory
        if (X.relics.length >= 3 && win) {
          g += 1;
        }
        write(X);
        return m || g ? [m, g] : null;
      } catch (e) {
        return null;
      }
    });

    /* ---- 4. Relic showcase: each chosen relic is kept ---- */
    document.addEventListener(
      'click',
      e => {
        const b = e.target.closest && e.target.closest('[data-boss-rush^="rel:"]');
        if (!b) {
          return;
        }
        const id = b.dataset.bossRush.slice(4);
        const X = readValue();
        if (!X.relics.includes(id)) {
          X.relics.push(id);
          write(X);
        }
      },
      true
    );

    /* ---- 6. Ball training: five throws, personal score ---- */
    const trainingSession = () => {
      const X = readValue();
      if (X.ct.d !== dateDay()) {
        X.ct = { d: dateDay(), n: 0, best: X.ct.best || 0 };
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
        const Y = readValue();
        Y.ct = { d: dateDay(), n: (Y.ct.n || 0) + 1, best: Math.max(Y.ct.best || 0, score) };
        if (score >= 8) {
          applyReward({ b: { poke: 1 }, m: 200 });
          toast('Entraînement réussi : une Poké Ball et 200 ₽ !');
        } else {
          toast('Score : ' + score + ' / 10. Record : ' + Y.ct.best + '.');
        }
        write(Y);
        save();
        hub();
      };
      launchMove();
    };

    /* ---- "Plus de défis" (More challenges) window ---- */
    const hub = () => {
      const X = readValue(),
        W = weekDef(),
        w = weatherKind(),
        isFinished = X.wk.k === week() && X.wk.done,
        dayInv = X.inv.d === dateDay() && X.inv.done,
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
        ctRest: 3 - (X.ct.d === dateDay() ? X.ct.n : 0),
      });
      o.addEventListener('click', e => {
        if (e.target === o) {
          shut('x2470o');
        }
      });
    };
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
          return hub();
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
    window.__x2470 = { readValue, write, hub, weekDef, wkMake };
  })();
}
