import { refreshSettings } from '../../screens/settings/settingsStore.js';
import { DIFFS, PROFILE } from '../state/game-state.js';
import { toast } from '../core/utils.js';
import { placeAlert } from '../world/home-route.js';
import { B, renderAll } from '../combat/ui.js';
import { queueSave } from '../state/saves.js';
import { PREF, savePref } from './preferences.js';
import { sfx, vibe } from '../audio/sound-effects.js';
import { musLevel } from '../audio/music.js';
import { V4 } from './screen-state.js';
import { renderWallet } from './wallet.js';
import { centerMap, renderMap } from '../world/map.js';
import { renderDex } from '../progression/pokedex.js';
import { renderBag, renderQuests } from '../progression/quests-shop.js';
import { renderCampPage } from '../modes/camp-challenges.js';

// The Settings page is rendered by React (src/screens/settings): redrawing = rebuilding it.
export function renderParams() {
  refreshSettings();
}

export function v4After(t) {
  document.documentElement.dataset.page = t;
  // Menu button marked for the menu pages: src/components/Nav.jsx (BottomNav)
  if (t === 'carte') {
    renderMap();
    requestAnimationFrame(() => {
      centerMap();
      try {
        placeAlert();
      } catch {
        /* Best effort: failure here is non-fatal. */
      }
    });
  } else if (t === 'dex') {
    renderDex();
  } else if (t === 'quetes') {
    renderQuests();
  } else if (t === 'sac') {
    renderBag();
  } else if (t === 'params') {
    renderParams();
  } else if (t === 'camp') {
    renderCampPage();
  } // sub-tabs (v4.31)
  renderWallet();
}

// Statements run at startup, in the original order (see index.js).
export function init() {
  /* ---------- Settings: sound, vibrations, game ---------- */
  if (PREF.musVol === undefined) {
    PREF.musVol = 0.7;
  }

  if (PREF.sfxVol === undefined) {
    PREF.sfxVol = 0.8;
  }

  document.addEventListener('change', e => {
    const p = e.target.closest('[data-pref]');
    if (!p) {
      return;
    }
    PREF[p.dataset.pref] = p.checked;
    savePref();
    if (p.dataset.pref === 'vibe' && p.checked) {
      vibe(40);
    }
    if (p.dataset.pref === 'sound' && p.checked) {
      setTimeout(() => sfx('ui'), 30);
    }
    if (B) {
      try {
        renderAll();
      } catch {
        /* Best effort: failure here is non-fatal. */
      }
    }
  });

  document.addEventListener('input', e => {
    const v = e.target.closest('[data-vol]');
    if (v) {
      PREF[v.dataset.vol] = +v.value / 100;
      const b = v.parentElement.querySelector('b');
      if (b) {
        b.textContent = v.value + ' %';
      }
      if (v.dataset.vol === 'musVol') {
        musLevel();
      }
      clearTimeout(V4.volT);
      V4.volT = setTimeout(() => {
        savePref();
        if (v.dataset.vol === 'sfxVol') {
          sfx('ui');
        }
      }, 250);
      return;
    }
    if (e.target.id === 'v4Nm') {
      PROFILE.name = e.target.value.slice(0, 14);
      queueSave();
      renderWallet();
    }
  });

  document.addEventListener('click', e => {
    const d = e.target.closest('[data-diff]');
    if (d) {
      PROFILE.diff = d.dataset.diff;
      queueSave();
      renderParams();
      toast(`Difficulté : ${DIFFS[PROFILE.diff]}`);
      return;
    }
    if (e.target.closest('[data-v4reset]')) {
      Object.assign(PREF, {
        sound: false,
        vibe: false,
        fast: false,
        info: false,
        music: false,
        musVol: 0.7,
        sfxVol: 0.8,
      });
      savePref();
      renderParams();
      toast('Paramètres réinitialisés.');
    }
  });

  /* ---------- hookups ---------- */

  // The v4 pages (map, dex, quests, bag, settings) are rendered by React (src/screens).
}
