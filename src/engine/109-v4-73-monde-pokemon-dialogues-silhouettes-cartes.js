/* Section d'origine : v4.73 : monde Pokémon (dialogues, silhouettes, cartes, boîte à badges, Boutique, Sac, sons) */

import { PROFILE } from './011-05-etat-de-partie.js';
import { RM } from './014-08-outils.js';
import { CROCHETS } from './015-v4-8-00-crochets.js';
import { cur } from './016-09-navigation.js';
import { PREF, noise, savePref, tone } from './026-20-campagne-tutoriel-son.js';
import { AUTO } from './030-24-prestige-mise-en-scene.js';
import { renderBag } from './039-v4-07-quetes-boutique.js';
import { marquerAchat } from '../screens/sac/sacStore.js';
import { renderParams } from './040-v4-08-parametres.js';
import { refreshGrid } from '../screens/equipe/equipeStore.js';

// Instructions exécutées au démarrage, dans l'ordre d'origine (voir index.js).
export function __init() {

(() => {
  const H = document.documentElement;
  const on = k => PREF[k] !== 0;
  const texteDirect = () => {
    try {
      return !!RM || H.classList.contains('a11y-rm') || !on('pk473t') || !!AUTO;
    } catch (e) {
      return true;
    }
  };

  /* ---------- 10. sons d'interface maison (synthétisés) ---------- */
  const SONS = {
    bip: () => {
      tone(1760, 0, 0.035, 'square', 0.016);
      tone(2349, 0.045, 0.04, 'square', 0.016);
    },
    ball: () => {
      noise(0, 0.03, 0.045, 5200);
      tone(540, 0, 0.04, 'square', 0.02, 270);
      tone(880, 0.06, 0.07, 'triangle', 0.03, 1320);
    },
    caisse: () => {
      tone(1318, 0, 0.07, 'triangle', 0.04);
      tone(1760, 0.08, 0.18, 'triangle', 0.04);
    },
    suite: () => tone(1175, 0, 0.05, 'square', 0.015)
  };
  const son = k => {
    try {
      if (!PREF.sound || RM || !on('pk473s')) return;
      SONS[k] && SONS[k]();
    } catch (e) {}
  };
  const ONGLETS = '.v4-tabs>button,.v4-reg>button,.gd-tabs>button,.v4-cats>button,.v4-seg>button,.scn-tabs>button,.stabs>.stab,.sel-tabs>button';
  document.addEventListener(
    'click',
    e => {
      const t = e.target;
      if (!t || !t.closest) return;
      const nav = t.closest('.bnav [data-t],#v4Menu [data-t]');
      if (nav) {
        let k = nav.dataset.t;
        if (k === 'ligue') k = 'combat';
        if (k && k !== cur) son('ball');
        return;
      }
      const o = t.closest(ONGLETS);
      if (o && o.getAttribute('aria-selected') !== 'true' && o.getAttribute('aria-pressed') !== 'true') return son('bip');
      if (t.closest('[data-scene="suite"],[data-co]')) son('suite');
    },
    true
  );

  /* comptoir de la Boutique et sac à poches : rendus par React (src/screens/sac/Comptoir.jsx) */

  /* ---------- 4. texte qui s'écrit lettre par lettre ---------- */
  // [élément tapé, boîte encadrée, flèche absolue ?]
  const DLG = [
    ['#scene417 .sc-tx', e => e.closest('.sc-card'), false],
    ['#coach .co-in p', e => e.closest('.co-in'), false],
    ['#tip429 p', e => e.closest('#tip429'), false],
    ['.tip .dlgbox', e => e, true],
    ['.v4h-prof > p', e => e, false],
    ['.intro .dlgbox', e => e, true],
    ['.sel-card .dlgbox', e => e, true],
    ['.pk-mart-dlg', e => e, true]
  ];
  const SKIP = '.dlg-who,button,input,select,textarea,label,svg,.pk-fl,.pav,.b';
  const VU = new Set();
  const JOBS = new Map();
  const visible = e => !!(e.offsetParent || (e.getClientRects && e.getClientRects().length));
  const cle = e => e.textContent.replace(/\s+/g, ' ').trim();
  const finir = j => {
    if (j.fini) return;
    j.fini = true;
    cancelAnimationFrame(j.raf);
    j.wraps.forEach(([w, t]) => {
      if (w.parentNode) w.parentNode.replaceChild(document.createTextNode(t), w);
    });
    if (j.box) j.box.classList.remove('pk-typing');
    JOBS.delete(j.el);
  };
  const ecrire = (e, box) => {
    const k = cle(e);
    if (!k) return;
    if (VU.has(k)) return;
    VU.add(k);
    if (texteDirect()) return;
    const nodes = [];
    const tw = document.createTreeWalker(e, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = tw.nextNode())) {
      if (!n.data.trim()) continue;
      const s = n.parentElement && n.parentElement.closest(SKIP);
      if (s && e.contains(s)) continue;
      nodes.push(n);
    }
    if (!nodes.length) return;
    const spans = [],
      wraps = [];
    nodes.forEach(t => {
      const w = document.createElement('span');
      w.className = 'pk-tw';
      const txt = t.data;
      for (const ch of txt) {
        const c = document.createElement('span');
        c.className = 'pk-c';
        c.textContent = ch;
        w.appendChild(c);
        spans.push(c);
      }
      t.parentNode.replaceChild(w, t);
      wraps.push([w, txt]);
    });
    const j = { el: e, box, spans, wraps, k: 0, t0: performance.now(), ms: PREF.fast ? 11 : Math.max(8, Math.min(26, 2600 / spans.length)), fini: false, raf: 0 };
    if (box) box.classList.add('pk-typing');
    JOBS.set(e, j);
    const tick = now => {
      if (j.fini) return;
      if (!e.isConnected) return finir(j);
      // au plus ~22 mises à jour par seconde : plusieurs lettres à la fois, moins de recalculs
      if (now - (j.last || 0) < 45 && j.k) {
        j.raf = requestAnimationFrame(tick);
        return;
      }
      j.last = now;
      const k2 = Math.min(spans.length, Math.floor((now - j.t0) / j.ms) + 1);
      for (let i = j.k; i < k2; i++) spans[i].classList.add('v');
      j.k = k2;
      if (k2 >= spans.length) return finir(j);
      j.raf = requestAnimationFrame(tick);
    };
    j.raf = requestAnimationFrame(tick);
  };
  // toucher la boîte termine le texte ; dans une scène, le premier toucher ne fait pas avancer
  document.addEventListener(
    'click',
    e => {
      if (!JOBS.size || !e.target || !e.target.closest) return;
      for (const j of [...JOBS.values()]) {
        const zone = j.box || j.el;
        const scene = j.el.closest('#scene417');
        if (scene && scene.contains(e.target)) {
          if (e.target.closest('[data-scene="passer"]')) {
            finir(j);
            return;
          }
          finir(j);
          e.stopPropagation();
          e.preventDefault();
          return;
        }
        if (zone && zone.contains(e.target) && !e.target.closest('button,a,input,select,textarea')) finir(j);
      }
    },
    true
  );

  /* ---------- passe commune après chaque changement d'écran ---------- */
  let rafScan = 0;
  const planifier = () => {
    if (!rafScan) rafScan = requestAnimationFrame(scan);
  };
  function scan() {
    rafScan = 0;
    try {
      for (const [sel, boxOf, abs] of DLG) {
        document.querySelectorAll(sel).forEach(e => {
          const box = boxOf(e);
          if (!box) return;
          if (!box.classList.contains('pk-dlg')) box.classList.add('pk-dlg');
          const hote = abs ? box : e;
          if (!hote.querySelector(':scope > .pk-fl')) hote.insertAdjacentHTML('beforeend', `<i class="pk-fl${abs ? ' abs' : ''}" aria-hidden="true"></i>`);
          // texte déjà écrit une fois : on ne lit pas la mise en page (évite un recalcul forcé à chaque changement du DOM)
          if (JOBS.has(e) || VU.has(cle(e)) || !visible(e)) return;
          ecrire(e, box);
        });
      }
      // cartes : chromatiques capturés
      const sh = (PROFILE && PROFILE.shiny) || [];
      // seulement quand le Pokédex est affiché (sinon des centaines de cartes relues à chaque action de combat)
      // la grille React (Grille.jsx) rend pk-shiny et « ✦ Chromatique » : on la redessine si elle a pris du retard
      if (
        cur === 'pokedex' &&
        [...document.querySelectorAll('#pokedex .fcard')].some(c => {
          const b = c.querySelector('[data-open]');
          const id = b && b.dataset.open;
          return c.classList.contains('pk-shiny') !== !!(id && sh.includes(id));
        })
      )
        refreshGrid();
    } catch (e) {}
  }
  if (window.MutationObserver) new MutationObserver(planifier).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden'] });
  CROCHETS.page.push(planifier);

  /* ---------- 9. Boutique et Sac ---------- */
  // comptoir, sac à poches et classes pk-mart / pk-bag : React (src/screens/sac) et renderBag()
  CROCHETS.achat.push(() => {
    marquerAchat();
    son('caisse');
    if (cur === 'sac') renderBag();
  });

  /* ---------- Paramètres : réglages ajoutés à « Habillage Pokémon » ---------- */
  // boutons ajoutés à « Habillage Pokémon » : rendus par React (src/screens/settings/panels/HabillagePokemon.jsx)
  document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('[data-pk473]');
    if (!b) return;
    const k = b.dataset.pk473 === 't' ? 'pk473t' : 'pk473s';
    PREF[k] = on(k) ? 0 : 1;
    savePref();
    renderParams();
    if (k === 'pk473s' && on(k)) son('bip');
  });

  planifier();
  window.__monde473 = { scan, ecrire, finir, JOBS, VU, son };
})();
}
