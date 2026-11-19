/* Section d'origine : v4.73 : combat façon Pokémon (entrée, Poké Balls, barres de PV, évolution, cérémonie du badge) */

import { clearOverlay, paintOverlay } from '../screens/overlays/dialogsStore.js';
import { GYMS } from './004-01-donnees.js';
import { SCEN } from './009-03-pokemon.js';
import { ARENAS, BADGES } from './013-07-arenes.js';
import { $, RM, el } from './014-08-outils.js';
import { CROCHETS } from './015-v4-8-00-crochets.js';
import { badgeSvg } from './019-12-ligue.js';
import { uk } from './021-14-moteur-combat.js';
import { B, HC, L } from './024-17-interface-combat.js';
import { PREF, calme472, noise, tone, vibe } from './026-20-campagne-tutoriel-son.js';
import { AUTO, leaderOf } from './030-24-prestige-mise-en-scene.js';
import { boardSet, getBoard, tokCl, tokHas, unitsBatch } from '../screens/combat/board/boardStore.js';

// Instructions exécutées au démarrage, dans l'ordre d'origine (voir index.js).
export function __init() {

(() => {
  const H = document.documentElement;
  const auto = () => !!AUTO;
  const vite = () => {
    try {
      return !!PREF.fast;
    } catch (e) {
      return false;
    }
  };

  /* ---------- sons maison (synthétisés, aucun son officiel) ---------- */
  const SONS = {
    whoosh: () => noise(0, 0.32, 0.05, 1600),
    envoi: () => {
      noise(0, 0.04, 0.05, 4200);
      tone(620, 0.02, 0.09, 'square', 0.022, 1320);
    },
    retour: () => tone(1500, 0, 0.26, 'sine', 0.035, 320)
  };
  const son = k => {
    try {
      if (!PREF.sound || RM || PREF.pk473s === 0) return;
      SONS[k] && SONS[k]();
    } catch (e) {}
  };
  window.__son473 = son;

  /* ---------- dessins : Poké Ball en SVG ---------- */
  const ballSvg = r =>
    `<path class="pk-sbt" d="M${-r} 0A${r} ${r} 0 0 1 ${r} 0Z"/><path class="pk-sbb" d="M${-r} 0A${r} ${r} 0 0 0 ${r} 0Z"/><circle class="pk-sbn" r="${(r * 0.32).toFixed(2)}"/>`;
  const etincelles = (n, cls) => {
    let h = '';
    for (let i = 0; i < n; i++) h += `<circle class="${cls}" r="1.5" style="--a:${Math.round((360 / n) * i + 15)}deg"/>`;
    return h;
  };

  /* ---------- 1. entrée en combat ---------- */
  // #pk-btr est rendu par React (src/screens/overlays/Effets.jsx) : ses bandes sont
  // posées par le store (paintOverlay('btr')), sa classe (go, boss, sauvage, vite) ici.
  const btr = document.getElementById('pk-btr');
  let tBtr = 0;
  const genre = b => {
    const D = SCEN[b.sc] || {};
    if (D.wild && !D.legend) return 'sauvage';
    let boss = !!(D.rival || D.legend || b.sc === 'champ' || D.gym != null);
    try {
      boss = boss || ARENAS.findIndex(a => a.k === b.sc) >= 0 || !!leaderOf(b.sc);
    } catch (e) {}
    return boss ? 'boss' : 'dresseur';
  };
  const transition = b => {
    if (calme472() || auto()) return;
    btr.className = '';
    paintOverlay('btr', { on: true });
    void btr.offsetWidth;
    btr.className = 'go ' + genre(b) + (vite() ? ' vite' : '');
    son('whoosh');
    clearTimeout(tBtr);
    tBtr = setTimeout(() => {
      btr.className = '';
      clearOverlay('btr');
    }, vite() ? 700 : 1500);
  };

  /* ---------- 2. envoi des Pokémon et retour au K.O. ---------- */
  const ENTREE = new WeakMap();
  // calque des effets (React, dernier du plateau), créé au premier usage
  const couche = () => {
    if (!getBoard().pk) boardSet({ pk: true }, 'pk');
    return L.pk73 && L.pk73.isConnected ? L.pk73 : null;
  };
  const montrer = b => {
    try {
      if (!L || !L.u) return;
      unitsBatch(() => Object.values(L.u).forEach(T => tokCl(T, 'pk-wait', false))); // classes du jeton : Units.jsx
    } catch (e) {}
  };
  const preparer = b => {
    if (!b || calme472() || auto() || !L || !L.u) return;
    ENTREE.set(b, 1);
    b.units.forEach(u => {
      const T = L.u[u.uid];
      if (T && !u.ko) tokCl(T, 'pk-wait', true);
    });
    setTimeout(() => {
      if (ENTREE.get(b) === 1) {
        ENTREE.set(b, 2);
        montrer(b);
      }
    }, 9000);
  };
  const envoyer = b => {
    const g = couche();
    if (!g || calme472()) return montrer(b);
    const D = SCEN[b.sc] || {},
      wild = !!D.wild;
    const liste = b.units.filter(u => !u.ko && L.u[u.uid]);
    liste.sort((x, y) => (x.side === 'e' ? 0 : 1) - (y.side === 'e' ? 0 : 1));
    const pas = vite() ? 0.04 : 0.11;
    liste.forEach((u, i) => {
      const T = L.u[u.uid];
      let x, y;
      try {
        [x, y] = HC(uk(u));
      } catch (e) {
        tokCl(T, 'pk-wait', false);
        return;
      }
      const d = i * pas,
        sauvage = wild && u.side === 'e';
      const w = el('g', { transform: `translate(${x.toFixed(1)},${y.toFixed(1)})` }, g);
      w.style.setProperty('--d', d.toFixed(2) + 's');
      w.innerHTML = sauvage
        ? `<circle class="pk-wl-r" r="15"/>${etincelles(6, 'pk-lf')}`
        : `<circle class="pk-so-fl" r="17"/>${etincelles(6, 'pk-spk')}<g class="pk-so">${ballSvg(7)}</g>`;
      setTimeout(() => tokCl(T, 'pk-wait', false), (d + (sauvage ? 0.12 : 0.36)) * 1000);
      setTimeout(() => w.remove(), (d + 1.1) * 1000);
    });
    if (liste.length) son('envoi');
    setTimeout(() => montrer(b), liste.length * pas * 1000 + 900);
  };
  const retour = u => {
    const g = couche(),
      T = L.u && L.u[u.uid];
    if (!g || !T) return;
    let x, y;
    try {
      [x, y] = HC(uk(u));
    } catch (e) {
      return;
    }
    const D = (B && SCEN[B.sc]) || {},
      sauvage = !!D.wild && u.side === 'e';
    const w = el('g', { transform: `translate(${x.toFixed(1)},${y.toFixed(1)})` }, g);
    if (sauvage) w.innerHTML = '<circle class="pk-poof" r="14"/>';
    else {
      w.innerHTML = `<circle class="pk-ko-r" r="15"/><rect class="pk-ko-bm" x="-2" y="-42" width="4" height="42" rx="2"/><g transform="translate(0,-46)"><g class="pk-ko-b">${ballSvg(7.5)}</g></g>`;
      tokCl(T, 'pk-rouge', true);
      setTimeout(() => tokCl(T, 'pk-rouge', false), 800);
      son('retour');
    }
    setTimeout(() => w.remove(), 1300);
  };

  CROCHETS.avantPresentation.push(() => {
    if (B && !B.over) {
      preparer(B);
      transition(B);
    }
  });
  CROCHETS.avantBandeau.push(() => {
    try {
      if (B && ENTREE.get(B) === 1) {
        ENTREE.set(B, 2);
        envoyer(B);
      }
    } catch (e) {
      montrer(B);
    }
  });
  // un Pokémon qui vient de tomber K.O. retourne dans sa Poké Ball
  let etaitKo = null;
  CROCHETS.avantJeton.push(u => {
    etaitKo = null;
    const T = L.u && L.u[u.uid];
    etaitKo = T ? tokHas(T, 'ko') : null;
  });
  CROCHETS.apresJeton.push(u => {
    if (etaitKo === false && u.ko && !u.caught && !calme472() && !auto()) retour(u);
  });

  /* ---------- 3. les PV descendent progressivement ---------- */
  CROCHETS.barrePv.push(h => {
    try {
      if (calme472()) return h;
      const m = /--a:([\d.]+)%;--b:([\d.]+)%;animation-delay:-(\d+)ms/.exec(h);
      if (!m) return h;
      return h.replace(/<i class="([^"]*)" style="width:([\d.]+)%">/, (x, c, w) => `<i class="${c} pk-dr" style="width:${w}%;--pa:${m[1]}%;animation-delay:-${m[3]}ms">`);
    } catch (e) {
      return h;
    }
  });

  /* ---------- 7. cérémonie du badge ---------- */
  const FETE = new WeakSet();
  // #pk-badge est rendu par React (src/screens/overlays/Effets.jsx) ; hidden et .out restent posés ici
  const bc = document.getElementById('pk-badge');
  let tBc = 0;
  const fermerBadge = () => {
    if (bc.hidden || bc.classList.contains('out')) return;
    clearTimeout(tBc);
    bc.classList.add('out');
    setTimeout(() => {
      bc.hidden = true;
      bc.classList.remove('out');
      clearOverlay('badge');
    }, 300);
  };
  bc.addEventListener('click', fermerBadge);
  document.addEventListener('keydown', e => {
    if (!bc.hidden && (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ')) fermerBadge();
  });
  const feterBadge = () => {
    if (!B || !B.rew || !B.rew.badgeNew || FETE.has(B) || calme472() || auto()) return;
    const D = SCEN[B.sc] || {};
    let i = typeof D.gym === 'number' ? D.gym : -1;
    if (i < 0) i = ARENAS.findIndex(a => a.k === B.sc);
    if (i < 0) return;
    FETE.add(B);
    let chef = '';
    try {
      const Lc = leaderOf(B.sc);
      if (Lc && Lc.n) chef = Lc.n;
    } catch (e) {}
    const nom = (GYMS[i] && GYMS[i].t) || D.at || '';
    paintOverlay('badge', { svg: badgeSvg(i, (GYMS[i] && GYMS[i].t) || nom, 'pkbc' + i), chef, nom, n: BADGES.length });
    bc.hidden = false;
    try {
      vibe([20, 40, 20, 40, 90]);
    } catch (e) {}
    clearTimeout(tBc);
    tBc = setTimeout(fermerBadge, vite() ? 2400 : 4200);
  };
  const res = $('#cbResult');
  if (res && window.MutationObserver)
    new MutationObserver(() => {
      try {
        if (!res.hidden && res.querySelector('.res-card')) setTimeout(feterBadge, 250);
      } catch (e) {}
    }).observe(res, { childList: true });

  window.__combat473 = { transition, envoyer, retour, feterBadge, ENTREE, genre };
})();
}
