/* Original section: v4.71: Shadow battles, ancient specimens, daily challenge, prestige */

import { BY, SCEN } from './009-pokemon.js';
import { PROFILE, isCamp } from './011-game-state.js';
import { BADGES } from './013-gyms.js';
import { writeLS, toast } from './014-utils.js';
import { HOOKS } from './015-hooks.js';
import { save, squad } from './020-team-cards.js';
import { OBST } from './023-roles-synergies-obstacles.js';
import { B, backToPrep, goFight, scSel } from './024-combat-ui.js';
import { sfx } from './026-campaign-tutorial-sound.js';
import { overlay } from './030-prestige-staging.js';
import { shut } from '../screens/overlays/tempStore.js';
import { today } from './032-v4-foundation.js';
import { DEXS } from './038-pokedex.js';
import { teamSize } from './048-replayability.js';
import { routeEvent } from './084-peddler-route-missions.js';

// Startup statements, run in their original order (see index.js).
export function __init() {
  (() => {
    const KEY = 'res-daily-challenges';
    const readX = () => {
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
    const writeX = o => {
      writeLS(KEY, o);
    };
    const ok = ids => ids.filter(i => BY[i]);
    const POS = [
      [6, 1],
      [6, 3],
      [7, 2],
      [7, 4],
      [6, 5],
    ];
    const mkFoes = ids => ok(ids).map((id, i) => [id, POS[i % POS.length]]);

    /* ---- 1. Shadow battles ---- */
    const SHADOWS = [
      { ids: ['racaillou', 'nosferapti'], lv: 12, hb: 2 },
      { ids: ['malosse', 'nosferapti', 'tenefix'], lv: 20, hb: 3 },
      { ids: ['malosse', 'absol', 'tenefix', 'noctali'], lv: 28, hb: 4 },
      { ids: ['absol', 'demolosse', 'tyranocif', 'noctali'], lv: 36, hb: 6 },
    ];
    const baseScene = (n, lvl, d, lv, hb, foes) => ({
      n,
      lvl,
      lim: 14,
      time: 'nuit',
      bio: 'gue',
      d,
      water: [],
      rock: ['3,0', '3,5'],
      hb,
      pb: 0,
      lv,
      foes,
    });
    SHADOWS.forEach((o, i) => {
      const k = 'omb470_' + (i + 1);
      SCEN[k] = Object.assign(
        baseScene(
          i === 3 ? 'Vaskar, chef des Ombres' : 'Les Ombres · épisode ' + (i + 1),
          'Histoire · épisode ' + (i + 1),
          'Repoussez les Ombres de Résonance.',
          o.lv,
          o.hb,
          mkFoes(o.ids)
        ),
        { shadowStep: i + 1 }
      );
      try {
        OBST[k] = { pil: ['4,2'], grass: ['4,4'] };
      } catch {
        /* Best effort: failure here is non-fatal. */
      }
    });

    /* ---- 5. Daily challenge ---- */
    const TYPES = ['Feu', 'Eau', 'Plante', 'Électrik', 'Psy', 'Combat', 'Insecte', 'Sol'];
    const seedValue = sel => {
      let h = 7;
      for (const ch of today() + sel) {
        h = (h * 33 + ch.charCodeAt(0)) >>> 0;
      }
      return h;
    };
    const dqDef = () => {
      const pool = ok(DEXS.map(m => m.id));
      const nb = 3 + (seedValue('n') % 2);
      const ids = [];
      for (let i = 0; i < nb; i++) {
        ids.push(pool[seedValue('f' + i) % pool.length]);
      }
      const forbiddenSet = TYPES[seedValue('t') % TYPES.length];
      const hb = 2 + (seedValue('h') % 4);
      return { ids, forbidden: forbiddenSet, hb, lv: 18 + (seedValue('l') % 10) };
    };
    const dqMake = () => {
      const D = dqDef();
      SCEN.dq470 = Object.assign(
        baseScene(
          'Défi quotidien',
          'Défi · type interdit : ' + D.forbidden,
          'Aucun Pokémon de type ' + D.forbidden + ' dans votre équipe. Adversaires renforcés.',
          D.lv,
          D.hb,
          mkFoes(D.ids)
        ),
        { dq470: D.forbidden }
      );
      try {
        OBST.dq470 = { pil: ['4,2'], grass: ['4,4', '5,1'] };
      } catch {
        /* Best effort: failure here is non-fatal. */
      }
      return D;
    };
    dqMake();

    const dqViol = () => {
      const D = SCEN.dq470 && SCEN.dq470.dq470;
      return D ? squad.slice(0, teamSize()).find(id => BY[id] && BY[id].t.includes(D)) : null;
    };
    HOOKS.launchRefusal.push(() => {
      const v = scSel === 'dq470' && dqViol();
      return v ? BY[v].n + ' est de type ' + SCEN.dq470.dq470 + ' : retirez-le de l’équipe.' : null;
    });

    /* ---- 7. Prestige ---- */
    const preOk = () => (isCamp() ? BADGES.length >= 8 || (PROFILE.elite || 0) > 0 : true);
    HOOKS.creation.push(S => {
      const P = readX().pre;
      if (!P.on || !P.n || !S || !S.units || /^(omb470_|dq470)/.test(S.sc || '')) {
        return;
      }
      S.units.forEach(u => {
        if (u.side === 'e') {
          u.mhp += 2 * P.n;
          u.hp += 2 * P.n;
        }
      });
    });

    /* ---- shared progression (victories) ---- */
    HOOKS.progress.unshift((S, rew, win) => {
      try {
        if (!win) {
          return null;
        }
        const X = readX();
        let m = 0,
          g = 0;
        const k = S.sc || '';
        if (/^omb470_/.test(k)) {
          const n = +k.slice(7),
            O = window.__shadowEpisodes;
          if (O && O.readValue().stepOf === n - 1) {
            O.write({ stepOf: n });
            X.fossils += 1;
            m += 400 * n;
            g += n;
            try {
              const st = routeEvent().st;
              writeLS('res-route-event', { d: st.d, done: true, res: 'Les Ombres ont été repoussées.' });
            } catch {
              /* Best effort: failure here is non-fatal. */
            }
          }
        } else if (k === 'dq470') {
          const D = X.dq;
          if (!(D.d === today() && D.done)) {
            const yesterdayKey = new Date(Date.now() - 864e5);
            const h =
              yesterdayKey.getFullYear() +
              '-' +
              String(yesterdayKey.getMonth() + 1).padStart(2, '0') +
              '-' +
              String(yesterdayKey.getDate()).padStart(2, '0');
            D.streak = D.last === h ? D.streak + 1 : 1;
            D.best = Math.max(D.best, D.streak);
            D.tot += 1;
            D.last = today();
            D.d = today();
            D.done = true;
            X.fossils += 1;
            m += 500 + 100 * Math.min(D.streak, 7);
            g += 2;
          }
        } else if (X.pre.on && X.pre.n) {
          m += 150 * X.pre.n;
          g += X.pre.n >= 3 ? 1 : 0;
        }
        writeX(X);
        return m || g ? [m, g] : null;
      } catch (e) {
        return null;
      }
    });

    /* ---- link with the episodes: « Affronter » (Face) button ---- */
    // returns true: the « Affronter » choice leads to battle instead of resolving the encounter
    HOOKS.beforeRouteChoice.push(j => {
      try {
        const { E, st } = routeEvent();
        if (E && E.ombre && !st.done && E.c[j] && E.c[j].fight) {
          if (!squad.length) {
            toast('Composez d’abord une équipe.');
            return true;
          }
          const k = 'omb470_' + (window.__shadowEpisodes.readValue().stepOf + 1);
          if (!SCEN[k]) {
            return true;
          }
          shut('event-choice');
          if (B) {
            backToPrep();
          }
          goFight(k);
          return true;
        }
      } catch {
        /* Best effort: failure here is non-fatal. */
      }
      return false;
    });

    /* ---- « Défis » hub: specimens, daily, prestige ---- */
    const REV = () => ok(['tenefix', 'malosse', 'demolosse', 'tyranocif']);
    const hub = () => {
      const X = readX(),
        D = X.dq,
        doneFlag = D.d === today() && D.done,
        di = dqDef();
      const freeOnes = REV().filter(id => !PROFILE.box.includes(id) && !(PROFILE.dex || []).includes(id));
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
          X = readX();
        if (v === 'open') {
          return hub();
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
        if (v === 'rev') {
          const freeOnes = REV().filter(id => !PROFILE.box.includes(id) && !(PROFILE.dex || []).includes(id));
          if (X.fossils < 1 || !freeOnes.length) {
            return;
          }
          const id = freeOnes[Math.floor(Math.random() * freeOnes.length)];
          X.fossils -= 1;
          X.rev.push(id);
          PROFILE.box.push(id);
          if (!PROFILE.dex.includes(id)) {
            PROFILE.dex.push(id);
          }
          writeX(X);
          try {
            save();
          } catch {
            /* Best effort: failure here is non-fatal. */
          }
          sfx('win');
          toast(BY[id].n + ' rejoint votre Boîte !');
        }
        if (v === 'pre+' && X.pre.n < 5) {
          X.pre.n += 1;
          X.pre.on = true;
          writeX(X);
        }
        if (v === 'pre') {
          X.pre.on = !X.pre.on;
          writeX(X);
        }
        shut('daily-challenges-o');
        hub();
      },
      true
    );
    /* « Défis » (Challenges) banner on the Home page (#dailyChallenges): rendered by React (src/screens/home/Banners.jsx) */
    window.__challenges = {
      readValue: readX,
      write: writeX,
      hub,
      makeDailyChallenge: dqMake,
      dailyViolation: dqViol,
      ok,
    };
  })();
}
