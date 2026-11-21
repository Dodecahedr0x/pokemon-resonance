import { SCENARIOS } from '../pokemon/pokemon.js';
import { PROFILE } from '../state/game-state.js';
import { toast } from '../core/utils.js';
import { MAX_ENERGY, canAwaken } from '../combat/engine.js';
import { battle, ui } from '../combat/ui.js';
import { queueSave } from '../state/saves.js';
import { PREFERENCES, savePref } from './preferences.js';
import { AUTO } from '../progression/prestige.js';
import { hideTooltip, showTooltip } from '../../screens/overlays/shellOverlays.js';
import { notesOf } from '../combat/resonance.js';
import { resonanceCandidate } from '../combat/resonant-form.js';
import { hasBossPhases, isSurrounded } from '../combat/intensity.js';

/* Tips at the right time: Prof. Sorbier explains a mechanic the first time it appears in battle (added in v4.29). */

const TIP_TEXTS = {
  capture: [
    'Capturer un Pokémon',
    'Affaiblissez-le sous 25 % de ses PV et immobilisez-le (Sommeil, Paralysie, Gel, Racines ou Toile). Sélectionnez ensuite un allié à son contact, puis touchez l’adversaire : le panneau « Capture » lance la Ball pour 2 Voix.',
  ],
  // keys are tip ids, stored in the seen-tips list of saves
  reso: [
    'Notes de Résonance',
    'Chaque allié qui frappe la même cible dans la manche y pose une note. À 3 notes, Résonance : dégâts ×1,5 et un écho selon le type. Frappez ensemble !',
  ],
  eveil: [
    'L’Éveil',
    'Un de vos Pokémon a ses losanges pleins : sélectionnez-le, puis « Éveiller ». Il évolue en plein combat et devient plus fort tout de suite.',
  ],
  forme: [
    'Forme Résonante',
    'Un Pokémon au stade final, losanges pleins, peut prendre sa Forme Résonante pour 3 manches. Une seule fois par combat : gardez-la pour le moment clé.',
  ],
  encercle: [
    'Encerclement',
    'Un Pokémon au contact de 2 adversaires ou plus subit +20 % de dégâts et perd 1 Mouvement. Ça marche aussi contre eux : entourez les cibles !',
  ],
  phase: [
    'Boss à phases',
    'Ce boss change de tactique à 66 % puis à 33 % de ses PV. Gardez des Voix et des soins pour sa dernière phase.',
  ],
  danger: [
    'Dangers annoncés',
    'Une zone est annoncée une manche à l’avance : tout Pokémon qui y reste à la fin de la manche est touché, allié comme adversaire.',
  ],
  vigil: [
    'Vigilance',
    'Au lieu d’attaquer, un Pokémon peut surveiller : il frappe le premier adversaire qui entre à sa portée, avant que celui-ci n’attaque.',
  ],
};

export function seenTips(force) {
  if (
    !battle ||
    battle.over ||
    ui.busy ||
    ui.cutscene ||
    battle.phase !== 'player' ||
    (AUTO && !force) ||
    PREFERENCES.seenTips === false
  ) {
    return;
  }
  if ((SCENARIOS[battle.sc] || {}).tuto || document.getElementById('tip-card')) {
    return;
  }
  const seenSet = (PROFILE.seenTips = PROFILE.seenTips || {}),
    al = battle.units.filter(u => u.side === 'a' && !u.ko),
    en = battle.units.filter(u => u.side === 'e' && !u.ko),
    c = [];
  if (!battle.noCatch) {
    c.push('capture');
  }
  if (al.some(u => canAwaken(battle, u))) {
    c.push('eveil');
  }
  if (en.some(u => notesOf(battle, u) > 0)) {
    c.push('reso');
  }
  if (al.some(u => u.en >= MAX_ENERGY && resonanceCandidate(battle, u))) {
    c.push('forme');
  }
  if (al.some(u => isSurrounded(battle, u))) {
    c.push('encercle');
  }
  if (hasBossPhases(battle)) {
    c.push('phase');
  }
  if (battle.dangerZone) {
    c.push('danger');
  }
  if ((PROFILE.battles || 0) >= 2 && battle.round >= 2) {
    c.push('vigil');
  }
  const k = c.find(x => !seenSet[x]);
  if (!k) {
    return;
  }
  seenSet[k] = 1;
  queueSave();
  const [t, d] = TIP_TEXTS[k];
  showTooltip(t, d); // #tipCard: src/screens/overlays/BattleTip.jsx
}

export function endTooltip() {
  if (!battle || battle.over) {
    hideTooltip();
  }
}

// Statements run at startup, in the original order (see index.js).
export function init() {
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-tip-card]');
    if (!b) {
      return;
    }
    if (b.dataset.tipCard === 'off') {
      PREFERENCES.seenTips = false;
      savePref();
      toast('Astuces désactivées. Réactivez-les dans les Paramètres.');
    }
    hideTooltip();
    if (battle) {
      setTimeout(seenTips, 400);
    }
  });
}
