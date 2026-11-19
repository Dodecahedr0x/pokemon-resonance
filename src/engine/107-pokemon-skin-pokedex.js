/* Section d'origine : v4.72 : habillage Pokémon (Pokédex, onglets Poké Ball, cartes de dresseur) */

import { $, $$ } from './014-utils.js';
import { CROCHETS } from './015-hooks.js';
import { cur } from './016-navigation.js';
import { PREF, calm472, savePref } from './026-campaign-tutorial-sound.js';
import { renderParams } from './040-settings.js';

// Instructions exécutées au démarrage, dans l'ordre d'origine (voir index.js).
export function __init() {

(() => {
  const H = document.documentElement;
  const on = k => PREF[k] !== 0;
  const doApply = () => H.classList.toggle('pk-calme', !on('pk472a'));

  /* ---------- éléments ajoutés : #pk-fond et #pk-iris sont rendus par React
     (src/screens/overlays/Effets.jsx) ; la classe .go de l’iris reste posée ici ---------- */
  const iris = document.getElementById('pk-iris');

  // voyants du logo de la barre du haut (.pk-leds) : rendus par React (src/components/Shell.jsx)

  /* ---------- ouverture en Poké Ball (barre du bas et menu) ---------- */
  let tIris = 0;
  const openOverlay = () => {
    if (calm472() || !on('pk472t')) return;
    iris.classList.remove('go');
    void iris.offsetWidth;
    iris.classList.add('go');
    clearTimeout(tIris);
    tIris = setTimeout(() => iris.classList.remove('go'), 700);
  };
  document.addEventListener(
    'click',
    e => {
      const a = e.target.closest && e.target.closest('.bnav [data-t],#v4Menu [data-t]');
      if (!a) return;
      let t = a.dataset.t;
      if (t === 'ligue') t = 'combat';
      if (t && t !== cur) openOverlay();
    },
    true
  );

  /* ---------- entrée des écrans : montée et balayage du scanner ---------- */
  const CAND = '.v4-panel,.v4-hero,.case,.sel-card,.gd-p,.gd-intro,.v4-it,.v4-qm,.cb-b,.v4-stats,.v4d-sec,.tip';
  let tEntry = 0;
  const entree = () => {
    if (calm472()) return;
    const pg = $('.page.on');
    if (!pg) return;
    clearTimeout(tEntry);
    $$('.pk-rise,.pk-fade,.pk-scan').forEach(x => x.classList.remove('pk-rise', 'pk-fade', 'pk-scan'));
    const isFixed = pg.id === 'combat';
    const vh = innerHeight * 1.25;
    const L = [...pg.querySelectorAll(CAND)].filter(x => {
      if (x.parentElement && x.parentElement.closest(CAND)) return false;
      const r = x.getBoundingClientRect();
      return r.width > 0 && r.top < vh;
    });
    L.slice(0, 12).forEach((x, i) => {
      x.style.setProperty('--pk-i', i);
      x.classList.add(isFixed ? 'pk-fade' : 'pk-rise');
      if (x.matches('.v4-panel,.v4-hero,.case')) x.classList.add('pk-scan');
    });
    tEntry = setTimeout(() => $$('.pk-rise,.pk-fade,.pk-scan').forEach(x => x.classList.remove('pk-rise', 'pk-fade', 'pk-scan')), 1900);
  };
  CROCHETS.page.push(previous => {
    if (cur !== previous) requestAnimationFrame(entree);
  });

  /* ---------- onde au toucher sur les boutons dorés ---------- */
  document.addEventListener(
    'pointerdown',
    e => {
      const b = e.target.closest && e.target.closest('.b-gold,.v4-cta');
      if (!b || calm472()) return;
      const cs = getComputedStyle(b);
      if (cs.overflow !== 'hidden' || cs.position === 'static') return;
      const r = b.getBoundingClientRect();
      const o = document.createElement('i');
      o.className = 'pk-onde';
      o.style.left = e.clientX - r.left + 'px';
      o.style.top = e.clientY - r.top + 'px';
      b.appendChild(o);
      setTimeout(() => o.remove(), 650);
    },
    { passive: true }
  );

  /* ---------- carte de résultat : bord holographique, sceau, gerbe : rendus par React (Result.jsx) ---------- */

  /* ---------- Paramètres : réglages de l'habillage ---------- */
  // panneau « Habillage Pokémon » : rendu par React (src/screens/settings/panels/HabillagePokemon.jsx)
  document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('[data-pk472]');
    if (!b) return;
    const k = b.dataset.pk472 === 't' ? 'pk472t' : 'pk472a';
    PREF[k] = on(k) ? 0 : 1;
    savePref();
    doApply();
    renderParams();
  });
  doApply();

  window.__habillage472 = { ouvrir: openOverlay, entree };
})();
}
