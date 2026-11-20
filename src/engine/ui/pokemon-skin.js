/* Pokémon skin (Pokédex, Poké Ball tabs, trainer cards) (added in v4.72). */

import { $, $$ } from '../core/utils.js';
import { HOOKS } from '../core/hooks.js';
import { cur } from '../core/navigation.js';
import { PREF, calmMotion, savePref } from './preferences.js';
import { renderParams } from './settings.js';

let H;

const on = k => PREF[k] !== 0;

const doApply = () => H.classList.toggle('pk-calme', !on('pokemonSkinA'));

/* ---------- added elements: #pk-fond and #pk-iris are rendered by React
     (src/screens/overlays/Effects.jsx); the iris's .go class is still set here ---------- */
let iris;

// top-bar logo lights (.pk-leds): rendered by React (src/components/Shell.jsx)

/* ---------- Poké Ball opening (bottom bar and menu) ---------- */
let tIris;

const openOverlay = () => {
  if (calmMotion() || !on('pokemonSkinT')) {
    return;
  }
  iris.classList.remove('go');
  void iris.offsetWidth;
  iris.classList.add('go');
  clearTimeout(tIris);
  tIris = setTimeout(() => iris.classList.remove('go'), 700);
};

/* ---------- screen entry: rise and scanner sweep ---------- */
const CAND = '.v4-panel,.v4-hero,.case,.sel-card,.gd-p,.gd-intro,.item-row,.v4-qm,.cb-b,.v4-stats,.dex-section,.tip';

let tEntry;

const entrance = () => {
  if (calmMotion()) {
    return;
  }
  const pg = $('.page.on');
  if (!pg) {
    return;
  }
  clearTimeout(tEntry);
  $$('.pk-rise,.pk-fade,.pk-scan').forEach(x => x.classList.remove('pk-rise', 'pk-fade', 'pk-scan'));
  const isFixed = pg.id === 'combat';
  const vh = innerHeight * 1.25;
  const L = [...pg.querySelectorAll(CAND)].filter(x => {
    if (x.parentElement && x.parentElement.closest(CAND)) {
      return false;
    }
    const r = x.getBoundingClientRect();
    return r.width > 0 && r.top < vh;
  });
  L.slice(0, 12).forEach((x, i) => {
    x.style.setProperty('--pk-i', i);
    x.classList.add(isFixed ? 'pk-fade' : 'pk-rise');
    if (x.matches('.v4-panel,.v4-hero,.case')) {
      x.classList.add('pk-scan');
    }
  });
  tEntry = setTimeout(
    () => $$('.pk-rise,.pk-fade,.pk-scan').forEach(x => x.classList.remove('pk-rise', 'pk-fade', 'pk-scan')),
    1900
  );
};

// Statements executed at startup, in the original order (see index.js).
export function init() {
  H = document.documentElement;
  iris = document.getElementById('pk-iris');
  tIris = 0;
  document.addEventListener(
    'click',
    e => {
      const a = e.target.closest && e.target.closest('.bnav [data-t],#v4Menu [data-t]');
      if (!a) {
        return;
      }
      let t = a.dataset.t;
      if (t === 'ligue') {
        t = 'combat';
      }
      if (t && t !== cur) {
        openOverlay();
      }
    },
    true
  );
  tEntry = 0;
  HOOKS.page.push(previous => {
    if (cur !== previous) {
      requestAnimationFrame(entrance);
    }
  });
  /* ---------- touch ripple on the gold buttons ---------- */
  document.addEventListener(
    'pointerdown',
    e => {
      const b = e.target.closest && e.target.closest('.b-gold,.v4-cta');
      if (!b || calmMotion()) {
        return;
      }
      const cs = getComputedStyle(b);
      if (cs.overflow !== 'hidden' || cs.position === 'static') {
        return;
      }
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
  /* ---------- result card: holographic edge, seal, burst: rendered by React (Result.jsx) ---------- */

  /* ---------- Settings: skin options ---------- */
  // "Habillage Pokémon" (Pokémon skin) panel: rendered by React (src/screens/settings/panels/PokemonSkin.jsx)
  document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('[data-pokemon-skin]');
    if (!b) {
      return;
    }
    const k = b.dataset.pokemonSkin === 't' ? 'pokemon-skin-t' : 'pokemon-skin-a';
    PREF[k] = on(k) ? 0 : 1;
    savePref();
    doApply();
    renderParams();
  });
  doApply();
  window.__skinStyling = { openOverlay, entrance };
}
