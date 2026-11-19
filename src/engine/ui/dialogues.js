/* Pokémon world (dialogues, silhouettes, maps, badge case, Shop, Bag, sounds) (added in v4.73). */

import { PROFILE } from '../state/game-state.js';
import { RM } from '../core/utils.js';
import { HOOKS } from '../core/hooks.js';
import { cur } from '../core/navigation.js';
import { PREF, savePref } from './preferences.js';
import { noise, tone } from '../audio/sound-effects.js';
import { AUTO } from '../progression/prestige.js';
import { renderBag } from '../progression/quests-shop.js';
import { markPurchase } from '../../screens/bag/bagStore.js';
import { renderParams } from './settings.js';
import { refreshGrid } from '../../screens/team/teamStore.js';

let H;

let on;

let directText;

/* ---------- 10. house UI sounds (synthesized) ---------- */
const SOUNDS = {
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
  suite: () => tone(1175, 0, 0.05, 'square', 0.015),
};

let playSound;

const TAB_LIST =
  '.v4-tabs>button,.v4-reg>button,.gd-tabs>button,.v4-cats>button,.v4-seg>button,.scn-tabs>button,.stabs>.stab,.sel-tabs>button';

/* Shop counter and pocket bag: rendered by React (src/screens/bag/Counter.jsx) */

/* ---------- 4. text typed letter by letter ---------- */
// [typed element, framed box, absolute arrow?]
const DLG = [
  ['#story-scene .sc-tx', e => e.closest('.sc-card'), false],
  ['#coach .co-in p', e => e.closest('.co-in'), false],
  ['#tip-card p', e => e.closest('#tip-card'), false],
  ['.tip .dlgbox', e => e, true],
  ['.v4h-prof > p', e => e, false],
  ['.intro .dlgbox', e => e, true],
  ['.sel-card .dlgbox', e => e, true],
  ['.pk-mart-dlg', e => e, true],
];

const SKIP = '.dlg-who,button,input,select,textarea,label,svg,.pk-fl,.pav,.b';

const SEEN = new Set();

const JOBS = new Map();

const visible = e => !!(e.offsetParent || (e.getClientRects && e.getClientRects().length));

const key = e => e.textContent.replace(/\s+/g, ' ').trim();

let finishUp;

let write;

/* ---------- common pass after each screen change ---------- */
let rafScan;

let schedule;

function scan() {
  rafScan = 0;
  try {
    for (const [sel, boxOf, abs] of DLG) {
      document.querySelectorAll(sel).forEach(e => {
        const box = boxOf(e);
        if (!box) {
          return;
        }
        if (!box.classList.contains('pk-dlg')) {
          box.classList.add('pk-dlg');
        }
        const hostName = abs ? box : e;
        if (!hostName.querySelector(':scope > .pk-fl')) {
          hostName.insertAdjacentHTML('beforeend', `<i class="pk-fl${abs ? ' abs' : ''}" aria-hidden="true"></i>`);
        }
        // text already written once: we do not read the layout (avoids a forced recalculation on every DOM change)
        if (JOBS.has(e) || SEEN.has(key(e)) || !visible(e)) {
          return;
        }
        write(e, box);
      });
    }
    // cards: shinies captured
    const sh = (PROFILE && PROFILE.shiny) || [];
    // only when the Pokédex is displayed (otherwise hundreds of cards re-read on every battle action)
    // the React grid (Grid.jsx) renders pk-shiny and "✦ Chromatique" (Shiny): we redraw it if it has fallen behind
    if (
      cur === 'pokedex' &&
      [...document.querySelectorAll('#pokedex .fcard')].some(c => {
        const b = c.querySelector('[data-open]');
        const id = b && b.dataset.open;
        return c.classList.contains('pk-shiny') !== !!(id && sh.includes(id));
      })
    ) {
      refreshGrid();
    }
  } catch {
    /* Best effort: failure here is non-fatal. */
  }
}

// Statements executed at startup, in the original order (see index.js).
export function init() {
  H = document.documentElement;
  on = k => PREF[k] !== 0;
  directText = () => {
    try {
      return !!RM || H.classList.contains('a11y-rm') || !on('pokeStyleT') || !!AUTO;
    } catch (e) {
      return true;
    }
  };
  playSound = k => {
    try {
      if (!PREF.sound || RM || !on('pokeStyleS')) {
        return;
      }
      SOUNDS[k] && SOUNDS[k]();
    } catch {
      /* Best effort: failure here is non-fatal. */
    }
  };
  document.addEventListener(
    'click',
    e => {
      const t = e.target;
      if (!t || !t.closest) {
        return;
      }
      const nav = t.closest('.bnav [data-t],#v4Menu [data-t]');
      if (nav) {
        let k = nav.dataset.t;
        if (k === 'ligue') {
          k = 'combat';
        }
        if (k && k !== cur) {
          playSound('ball');
        }
        return;
      }
      const o = t.closest(TAB_LIST);
      if (o && o.getAttribute('aria-selected') !== 'true' && o.getAttribute('aria-pressed') !== 'true') {
        return playSound('bip');
      }
      if (t.closest('[data-scene="suite"],[data-co]')) {
        playSound('suite');
      }
    },
    true
  );
  finishUp = j => {
    if (j.fini) {
      return;
    }
    j.fini = true;
    cancelAnimationFrame(j.raf);
    j.wraps.forEach(([w, t]) => {
      if (w.parentNode) {
        w.parentNode.replaceChild(document.createTextNode(t), w);
      }
    });
    if (j.box) {
      j.box.classList.remove('pk-typing');
    }
    JOBS.delete(j.el);
  };
  write = (e, box) => {
    const k = key(e);
    if (!k) {
      return;
    }
    if (SEEN.has(k)) {
      return;
    }
    SEEN.add(k);
    if (directText()) {
      return;
    }
    const nodes = [];
    const tw = document.createTreeWalker(e, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = tw.nextNode())) {
      if (!n.data.trim()) {
        continue;
      }
      const s = n.parentElement && n.parentElement.closest(SKIP);
      if (s && e.contains(s)) {
        continue;
      }
      nodes.push(n);
    }
    if (!nodes.length) {
      return;
    }
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
    const j = {
      el: e,
      box,
      spans,
      wraps,
      k: 0,
      t0: performance.now(),
      ms: PREF.fast ? 11 : Math.max(8, Math.min(26, 2600 / spans.length)),
      fini: false,
      raf: 0,
    };
    if (box) {
      box.classList.add('pk-typing');
    }
    JOBS.set(e, j);
    const tick = now => {
      if (j.fini) {
        return;
      }
      if (!e.isConnected) {
        return finishUp(j);
      }
      // at most ~22 updates per second: several letters at once, fewer recalculations
      if (now - (j.last || 0) < 45 && j.k) {
        j.raf = requestAnimationFrame(tick);
        return;
      }
      j.last = now;
      const k2 = Math.min(spans.length, Math.floor((now - j.t0) / j.ms) + 1);
      for (let i = j.k; i < k2; i++) {
        spans[i].classList.add('v');
      }
      j.k = k2;
      if (k2 >= spans.length) {
        return finishUp(j);
      }
      j.raf = requestAnimationFrame(tick);
    };
    j.raf = requestAnimationFrame(tick);
  };
  // touching the box finishes the text; in a scene, the first touch does not advance
  document.addEventListener(
    'click',
    e => {
      if (!JOBS.size || !e.target || !e.target.closest) {
        return;
      }
      for (const j of [...JOBS.values()]) {
        const zone = j.box || j.el;
        const scene = j.el.closest('#story-scene');
        if (scene && scene.contains(e.target)) {
          if (e.target.closest('[data-scene="passer"]')) {
            finishUp(j);
            return;
          }
          finishUp(j);
          e.stopPropagation();
          e.preventDefault();
          return;
        }
        if (zone && zone.contains(e.target) && !e.target.closest('button,a,input,select,textarea')) {
          finishUp(j);
        }
      }
    },
    true
  );
  rafScan = 0;
  schedule = () => {
    if (!rafScan) {
      rafScan = requestAnimationFrame(scan);
    }
  };
  if (window.MutationObserver) {
    new MutationObserver(schedule).observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['hidden'],
    });
  }
  HOOKS.page.push(schedule);
  /* ---------- 9. Shop and Bag ---------- */
  // counter, pocket bag and pk-mart / pk-bag classes: React (src/screens/bag) and renderBag()
  HOOKS.purchase.push(() => {
    markPurchase();
    playSound('caisse');
    if (cur === 'sac') {
      renderBag();
    }
  });
  /* ---------- Settings: options added to "Habillage Pokémon" (Pokémon skin) ---------- */
  // buttons added to "Habillage Pokémon" (Pokémon skin): rendered by React (src/screens/settings/panels/PokemonSkin.jsx)
  document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('[data-poke-style]');
    if (!b) {
      return;
    }
    const k = b.dataset.pokeStyle === 't' ? 'poke-style-t' : 'poke-style-s';
    PREF[k] = on(k) ? 0 : 1;
    savePref();
    renderParams();
    if (k === 'pokeStyleS' && on(k)) {
      playSound('bip');
    }
  });
  schedule();
  window.__worldDialogues = { scan, write, finishUp, JOBS, VU: SEEN, son: playSound };
}
