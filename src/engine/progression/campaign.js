/* Campaign path: the next goal on the home screen, starting a campaign and the starter choice (added in v1.0). */

import { GYMS } from '../data/game-data.js';
import { BY, SCEN } from '../pokemon/pokemon.js';
import { CAMP_START, PROFILE, defProfile, isCamp } from '../state/game-state.js';
import { ARENAS, BADGES } from '../modes/gyms.js';
import { $, toast } from '../core/utils.js';
import { go } from '../core/navigation.js';
import { hideStarter, openStarterBox, refreshStarter } from '../../screens/overlays/shellOverlays.js';
import { squad } from '../team/team.js';
import { ELITE } from '../combat/items-bonds-ai.js';
import { __set_scSel, launch } from '../combat/ui.js';
import { SAVE_V, applySave, autoSave, closeSaves } from '../state/saves.js';
import { renderHome } from '../world/home.js';
import { RIVAL, RIVAL_KEYS } from '../modes/rival.js';
import { nextJohtoStep } from '../world/johto-story.js';
import { nextHoennStep } from '../world/hoenn.js';
import { confirmDialog } from '../ui/game-mode.js';
import { renderPrep } from '../combat/battle-prep.js';

/* ---- home: path ---- */
export function nextGoal() {
  if (PROFILE.tuto === 0 && PROFILE.battles === 0) {
    return ['tuto', 'Premier combat guidé'];
  }
  for (let i = 0; i < 8; i++) {
    // the rival returns after badges 2, 4 and 6 (Campaign)
    if (isCamp() && i && i % 2 === 0 && BADGES.length >= i && PROFILE.rival < i / 2) {
      return [RIVAL_KEYS[i / 2 - 1], 'Rival : ' + RIVAL.n];
    }
    // Team Dissonance strikes after badges 1, 3, 5 and 7 (Campaign, v4.11)
    if (isCamp() && i % 2 === 1 && BADGES.length >= i && (PROFILE.dissonance || 0) < (i + 1) / 2) {
      return ['td' + (i + 1) / 2, 'Team Dissonance'];
    }
    if (!BADGES.includes(i)) {
      return [ARENAS[i].k, GYMS[i].n];
    }
  }
  if (isCamp() && PROFILE.rival < 4) {
    return ['rv4', 'Rival : ' + RIVAL.n];
  }
  for (let i = 0; i < 4; i++) {
    if (PROFILE.elite < i + 1) {
      return [ELITE[i], SCEN[ELITE[i]].n];
    }
  }
  if (PROFILE.elite >= 5) {
    const jn = nextJohtoStep(); // Johto after Kanto (v4.15), with its story (v4.16)
    if (jn) {
      return jn;
    }
    const hn = nextHoennStep(); // Hoenn after Johto (v4.19)
    if (hn) {
      return hn;
    }
  }
  return ['champ', PROFILE.elite >= 5 ? 'Champion (revanche)' : 'Champion de la Ligue'];
}

/* ---- new campaign: starter choice ---- */
// #starter is rendered by React (src/screens/overlays/Starter.jsx)
export function openStarter() {
  openStarterBox();
}

function onStarterClick(e) {
  const d = e.target.closest('[data-sd]');
  if (d) {
    PROFILE.diff = d.dataset.sd;
    refreshStarter(); // difficulty buttons (aria-pressed)
    return;
  }
  const b = e.target.closest('[data-st]');
  if (!b) {
    if (e.target.id === 'starter') {
      hideStarter();
    }
    return;
  }
  if (b.dataset.st === 'x') {
    hideStarter();
    return;
  }
  const id = b.dataset.st,
    keep = { name: PROFILE.name, diff: PROFILE.diff };
  hideStarter();
  const box = [id, ...CAMP_START];
  applySave(
    {
      v: SAVE_V,
      savedAt: new Date().toISOString(),
      squad: box.slice(0, 4),
      badges: [],
      profile: Object.assign(defProfile(), keep, { mode: 'campagne', box, dex: [...box] }),
      battle: null,
    },
    { leaveBattle: true }
  );
  closeSaves();
  autoSave(true);
  go('accueil');
  renderHome();
  toast(`Campagne lancée avec ${BY[id].n}. Commencez par le combat guidé ou la Route 29.`);
}

// Instructions run at startup, in the original order (see index.js).
export function init() {
  document.addEventListener('click', e => {
    const g = e.target.closest('[data-goal]');
    if (g) {
      const k = g.dataset.goal;
      __set_scSel(k);
      go('combat');
      renderPrep();
      if (k === 'tuto' && squad.length) {
        launch();
      }
      return;
    }
    const c = e.target.closest('[data-camp]');
    if (c) {
      confirmDialog(
        'Commencer une campagne ?',
        'Vous choisirez votre partenaire, puis les chapitres s’enchaîneront depuis le premier badge.',
        openStarter
      ); // v4.30
    }
  });

  $('#starter').addEventListener('click', onStarterClick);
}
