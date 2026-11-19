/* Section d'origine : v4-08-parametres.js */

import { refreshSettings } from '../screens/settings/settingsStore.js';
import { DIFFS, PROFILE } from './011-game-state.js';
import { toast } from './014-utils.js';
import { placeAlert } from './017-home-route.js';
import { B, renderAll } from './024-combat-ui.js';
import { queueSave } from './025-saves.js';
import { PREF, savePref, sfx, vibe } from './026-campaign-tutorial-sound.js';
import { musLevel } from './070-theme-music-player.js';
import { V4 } from './032-v4-foundation.js';
import { renderWallet } from './035-interface.js';
import { centerMap, renderMap } from './037-map.js';
import { renderDex } from './038-pokedex.js';
import { renderBag, renderQuests } from './039-quests-shop.js';
import { renderCampPage431 } from './066-tactical-challenges.js';

// La page Paramètres est rendue par React (src/screens/settings) : redessiner = la reconstruire.
export function renderParams() {
  refreshSettings();
}


export function v4After(t) {
  document.documentElement.dataset.page = t;
  // bouton Menu marqué pour les pages du menu : src/components/Nav.jsx (BottomNav)
  if (t === 'carte') {
    renderMap();
    requestAnimationFrame(() => {
      centerMap();
      try {
        placeAlert();
      } catch (e) {}
    });
  } else if (t === 'dex') renderDex();
  else if (t === 'quetes') renderQuests();
  else if (t === 'sac') renderBag();
  else if (t === 'params') renderParams();
  else if (t === 'camp') renderCampPage431(); // sous-onglets (v4.31)
  renderWallet();
}

// Instructions exécutées au démarrage, dans l'ordre d'origine (voir index.js).
export function __init() {

/* ---------- Paramètres : son, vibrations, partie ---------- */
if (PREF.musVol === undefined) PREF.musVol = 0.7;


if (PREF.sfxVol === undefined) PREF.sfxVol = 0.8;


document.addEventListener('change', e => {
  const p = e.target.closest('[data-pref]');
  if (!p) return;
  PREF[p.dataset.pref] = p.checked;
  savePref();
  if (p.dataset.pref === 'vibe' && p.checked) vibe(40);
  if (p.dataset.pref === 'sound' && p.checked) setTimeout(() => sfx('ui'), 30);
  if (B)
    try {
      renderAll();
    } catch (x) {}
});


document.addEventListener('input', e => {
  const v = e.target.closest('[data-vol]');
  if (v) {
    PREF[v.dataset.vol] = +v.value / 100;
    const b = v.parentElement.querySelector('b');
    if (b) b.textContent = v.value + ' %';
    if (v.dataset.vol === 'musVol') musLevel();
    clearTimeout(V4.volT);
    V4.volT = setTimeout(() => {
      savePref();
      if (v.dataset.vol === 'sfxVol') sfx('ui');
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
      sfxVol: 0.8
    });
    savePref();
    renderParams();
    toast('Paramètres réinitialisés.');
  }
});


/* ---------- branchements ---------- */


// Les pages v4 (carte, dex, quêtes, sac, paramètres) sont rendues par React (src/screens).
}
