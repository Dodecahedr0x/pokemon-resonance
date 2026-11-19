import { paintOverlay } from '../../screens/overlays/dialogsStore.js';
import { PROFILE } from '../state/game-state.js';
import { BADGES } from '../modes/gyms.js';
import { toast } from '../core/utils.js';
import { SLOTS, SV, newGame, openSaves, putSlot } from '../state/saves.js';
import { openStarter } from '../progression/campaign.js';
import { renderParams } from './settings.js';

/* =====================================================================
   Game mode in Settings (added in v4.30): changing mode asks for a
   confirmation and offers to put the game away in a slot.
   ===================================================================== */
export function gameInProgress() {
  return (PROFILE.battles || 0) > 0 || BADGES.length > 0;
}

function freeOverlaySlot() {
  return SLOTS.find(k => !SV.local[k]) || null;
}

/** A confirmation before any new game. suite() is only called once the player agrees. */
export function confirmDialog(heading, text, next) {
  if (!gameInProgress()) {
    return next();
  }
  // #newGame: rendered by React on first call (src/screens/overlays/NewGameConfirm.jsx); hidden stays set here
  paintOverlay('new-game', {
    titre: heading,
    bodyText: text,
    combats: PROFILE.battles || 0,
    badges: BADGES.length,
    sl: freeOverlaySlot(),
  });
  const el = document.getElementById('new-game');
  el.hidden = false;
  confirmDialog.suite = next;
  const f = el.querySelector('[data-new-game="non"].b');
  if (f) {
    f.focus();
  }
}

// Startup statements, run in their original order (see index.js).
export function init() {
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-new-game]');
    if (!b) {
      return;
    }
    const el = document.getElementById('new-game'),
      a = b.dataset.newGame,
      next = confirmDialog.suite;
    if (el) {
      el.hidden = true;
    }
    confirmDialog.suite = null;
    if (a === 'saves') {
      return openSaves();
    }
    if (a === 'ranger') {
      const sl = freeOverlaySlot();
      if (sl) {
        putSlot(sl);
      }
    }
    if ((a === 'ranger' || a === 'oui') && next) {
      next();
    }
  });

  document.addEventListener('click', e => {
    const b = e.target.closest('[data-game-mode]');
    if (!b) {
      return;
    }
    if (b.dataset.gameMode === 'camp') {
      confirmDialog(
        'Commencer une campagne ?',
        'Vous choisirez votre partenaire, puis les chapitres s’enchaîneront depuis le premier badge.',
        openStarter
      );
    } else {
      confirmDialog(
        'Passer en mode Libre ?',
        'Tous les combats seront ouverts. Votre Campagne ne sera conservée que si vous la rangez dans un emplacement.',
        () => {
          newGame();
          toast('Nouvelle partie en mode Libre.');
          renderParams();
        }
      );
    }
  });
}
