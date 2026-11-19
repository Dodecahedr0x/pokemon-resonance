/* Section d'origine : v4.71 : rivalité, météo du défi, dresseur de la semaine, vitrine de reliques, Ombres revanche, entraînement de Ball */

import { BY, SCEN } from './009-pokemon.js';
import { writeLS, toast } from './014-utils.js';
import { CROCHETS } from './015-hooks.js';
import { save, squad } from './020-team-cards.js';
import { OBST } from './023-roles-synergies-obstacles.js';
import { B, backToPrep, goFight } from './024-combat-ui.js';
import { overlay } from './030-prestige-staging.js';
import { shut } from '../screens/overlays/tempStore.js';
import { today } from './032-v4-foundation.js';
import { DEXS } from './038-pokedex.js';
import { weatherDay417 } from './057-companions-resonance.js';
import { timing453 } from './083-timed-catch-status.js';
import { reward454 } from './084-peddler-route-missions.js';
import { RELIC466 } from './097-boss-rush-relics.js';

// Instructions exécutées au démarrage, dans l'ordre d'origine (voir index.js).
export function __init() {

(() => {
  const KEY = 'res-x2470';
  const DEF = () => ({ rival: [], wk: { k: '', done: false, best: 0 }, rel: [], inv: { d: '', done: false }, ct: { d: '', n: 0, best: 0 } });
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
    for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    return h;
  };
  const dateDay = () => today();
  const week = () => 'S' + Math.floor(Date.now() / (7 * 864e5));
  const ok = ids => ids.filter(i => BY[i]);
  const POS = [[6, 1], [6, 3], [7, 2], [7, 4]];
  const mkFoes = ids => ok(ids).map((id, i) => [id, POS[i % POS.length]]);
  const METEO_NOM = { pluie: 'Pluie', soleil: 'Soleil', sable: 'Sable', grele: 'Grêle' };
  const weatherKind = () => { try { return weatherDay417(); } catch (e) { return null; } };

  /* ---- 3. Dresseur de la semaine ---- */
  const NOMS = ['Léa Ferrand', 'Marc Dalbert', 'Inès Montarbre', 'Tom Lacrête', 'Sana Verdier', 'Hugo Brisemare'];
  const pool = () => ok(DEXS.map(m => m.id)).filter(id => BY[id] && !BY[id].ennemi);
  const weekDef = () => {
    const h = hash(week());
    const p = pool();
    const ids = [0, 1, 2].map(i => p[(h + i * 977) % p.length]);
    return { n: NOMS[h % NOMS.length], ids, lv: 24 + (h % 6) };
  };
  const wkMake = () => {
    const D = weekDef();
    SCEN.wk470 = Object.assign({ n: 'Dresseur de la semaine', lvl: 'Semaine · ' + D.n, lim: 12, time: 'jour', bio: 'gue', d: D.n + ' vous attend avec une équipe qui change chaque semaine.', water: [], rock: ['3,0', '3,5'], hb: 4, pb: 1, lv: D.lv, foes: mkFoes(D.ids) }, {});
    try {
      OBST.wk470 = { pil: ['4,2'], grass: ['4,4'] };
    } catch (e) {}
    return D;
  };
  wkMake();

  /* ---- 5. Ombres inversées : revanche de Vaskar, plus dure ---- */
  SCEN.inv470 = Object.assign({ n: 'Ombres inversées', lvl: 'Revanche · Vaskar', lim: 14, time: 'nuit', bio: 'gue', d: 'Vaskar revient avec les Ombres renforcées. Une revanche sans répit, qui ne se refuse pas.', water: [], rock: ['3,0', '3,5'], hb: 8, pb: 2, lv: 44, foes: mkFoes(['absol', 'demolosse', 'tyranocif', 'noctali']) }, {});
  try {
    OBST.inv470 = { pil: ['4,2'], grass: ['4,4', '5,1'] };
  } catch (e) {}


  /* ---- Récompenses et suivi (progression) ---- */
  CROCHETS.progres.unshift((S, rew, win) => {
    try {
      const k = S.sc || '';
      const X = readValue();
      let m = 0,
        g = 0;
      // 1. Rivalité : Kael réagit aux combats des Ombres
      if (win && /^omb470_/.test(k)) {
        const n = +k.slice(7);
        X.rival.push(n < 4 ? 'Kael : « Les Ombres reculent. Vaskar ne tardera pas à réagir. »' : 'Kael : « Vaskar est tombé. Je n’oublierai pas ce combat. »');
        X.rival = X.rival.slice(-3);
      }
      // 2. Météo : bonus du défi quotidien
      if (win && k === 'dq470') {
        const w = weatherKind();
        if (w === 'pluie') g += 1;
        if (w === 'soleil') m += 200;
        if (w === 'sable' || w === 'grele') g += 1;
      }
      // 3. Dresseur de la semaine : une seule victoire par semaine
      if (win && k === 'wk470') {
        if (X.wk.k !== week() || !X.wk.done) {
          X.wk = { k: week(), done: true, best: Math.max(X.wk.best || 0, 1) };
          m += 2000;
          g += 5;
        }
      }
      // 5. Revanche de Vaskar : une fois par jour
      if (win && k === 'inv470' && X.inv.d !== dateDay()) {
        X.inv = { d: dateDay(), done: true };
        m += 1500;
        g += 2;
      }
      // 4. Vitrine : trois reliques ou plus donnent un Éclat par victoire
      if (X.rel.length >= 3 && win) g += 1;
      write(X);
      return m || g ? [m, g] : null;
    } catch (e) {
      return null;
    }
  });

  /* ---- 4. Vitrine de reliques : chaque relique choisie est gardée ---- */
  document.addEventListener(
    'click',
    e => {
      const b = e.target.closest && e.target.closest('[data-br466^="rel:"]');
      if (!b) return;
      const id = b.dataset.br466.slice(4);
      const X = readValue();
      if (!X.rel.includes(id)) {
        X.rel.push(id);
        write(X);
      }
    },
    true
  );

  /* ---- 6. Entraînement de Ball : cinq lancers, score personnel ---- */
  const trainingSession = () => {
    const X = readValue();
    if (X.ct.d !== dateDay()) X.ct = { d: dateDay(), n: 0, best: X.ct.best || 0 };
    if (X.ct.n >= 3) return toast('Trois séances aujourd’hui : revenez demain.');
    let hits = 0,
      score = 0;
    const launchMove = () => {
      if (hits >= 5) return endStep();
      timing453(q => {
        hits++;
        score += q === 'perfect' ? 2 : q === 'ok' ? 1 : 0;
        launchMove();
      });
    };
    const endStep = () => {
      const Y = readValue();
      Y.ct = { d: dateDay(), n: (Y.ct.n || 0) + 1, best: Math.max(Y.ct.best || 0, score) };
      if (score >= 8) {
        reward454({ b: { poke: 1 }, m: 200 });
        toast('Entraînement réussi : une Poké Ball et 200 ₽ !');
      } else toast('Score : ' + score + ' / 10. Record : ' + Y.ct.best + '.');
      write(Y);
      save();
      hub();
    };
    launchMove();
  };

  /* ---- Fenêtre « Plus de défis » ---- */
  const hub = () => {
    const X = readValue(),
      W = weekDef(),
      w = weatherKind(),
      isFinished = X.wk.k === week() && X.wk.done,
      dayInv = X.inv.d === dateDay() && X.inv.done,
      storyFinished = (window.__ombre470 && window.__ombre470.lire().etape >= 4),
      showcase = RELIC466.map(r => ({ r, on: X.rel.includes(r.id) })),
      nb = showcase.filter(v => v.on).length;
    // rendu : src/screens/overlays/temporaires/Fenetres.jsx (X2470)
    const o = overlay('x2470o', {
      lignes: (X.rival.length ? X.rival : ['Kael : « Je reviendrai, dresseur. »']).slice(-2),
      meteo: METEO_NOM[w] || 'Temps calme',
      bonus: w === 'pluie' || w === 'sable' || w === 'grele' ? 'le défi quotidien rapporte +1 Éclat' : w === 'soleil' ? 'le défi quotidien rapporte +200 ₽' : 'aucun bonus aujourd’hui',
      fini: !!isFinished,
      wn: W.n,
      nb,
      vitrine: showcase.map(v => ({ on: v.on, n: v.r.n, d: v.r.d })),
      histoireFinie: !!storyFinished,
      jourInv: !!dayInv,
      ctBest: X.ct.best,
      ctRest: 3 - (X.ct.d === dateDay() ? X.ct.n : 0)
    });
    o.addEventListener('click', e => {
      if (e.target === o) shut('x2470o');
    });
  };
  document.addEventListener(
    'click',
    e => {
      const b = e.target.closest && e.target.closest('[data-x2470]');
      if (!b || b.disabled) return;
      e.stopPropagation();
      e.preventDefault();
      const v = b.dataset.x2470;
      if (v === 'open') return hub();
      if (v === 'close') return shut('x2470o');
      if (!squad.length) return toast('Composez d’abord une équipe.');
      if (v === 'wk') {
        wkMake();
        shut('x2470o');
        if (B) backToPrep();
        return goFight('wk470');
      }
      if (v === 'inv') {
        shut('x2470o');
        if (B) backToPrep();
        return goFight('inv470');
      }
      if (v === 'ct') {
        shut('x2470o');
        return trainingSession();
      }
    },
    true
  );

  /* bouton « Plus de défis » sous la barre Défis de l’Accueil */
  /* le bouton #x2470 est rendu par React (src/screens/accueil/Bannieres.jsx) */
  window.__x2470 = { lire: readValue, ecrire: write, hub, semaineDef: weekDef, wkMake };
})();
}
