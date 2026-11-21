import { SCENARIOS } from '../pokemon/pokemon.js';
import { PROFILE } from '../state/game-state.js';
import { HOOKS } from '../core/hooks.js';
import { MAX_ENERGY } from './engine.js';
import { selectedScenario } from './ui.js';
import { queueSave } from '../state/saves.js';
import { formatNumber } from '../state/economy.js';
import { refreshPrep } from '../../screens/combat/prep/prepStore.js';

/* =====================================================================
   Doctrines (added in v4.30): a bonus against a drawback, chosen before
   the battle.
   ===================================================================== */
export function chosenDoctrine() {
  const D = SCENARIOS[selectedScenario] || {};
  if (D.tuto || D.hebdo429 || D.enigme431) {
    return '';
  }
  return DOCTRINE_DEFS[PROFILE.doctrineChoice] ? PROFILE.doctrineChoice : '';
}

export function doctrineDamage(S, u, t, d) {
  const k = S && S.doctrineChoice;
  if (!k || !(d > 0)) {
    return d;
  }
  let f = 1;
  if (u && u.side === 'a') {
    f *= k === 'assaut' ? 1.15 : k === 'mobilite' || k === 'butin' ? 0.9 : 1;
  }
  if (t && t.side === 'a') {
    f *= k === 'assaut' ? 1.1 : k === 'rempart' ? 0.85 : 1;
  }
  return f === 1 ? d : Math.max(1, Math.round(d * f));
}

export function doctrineMove(S, u) {
  if (!S || !S.doctrineChoice || !u || u.side !== 'a') {
    return 0;
  }
  return S.doctrineChoice === 'mobilite' ? 1 : S.doctrineChoice === 'rempart' ? -1 : 0;
}

// « Doctrine » block (#doctrineChoice): rendered by React along with the battle selection.
export function doctrineRender() {
  refreshPrep();
}

export const DOCTRINE_DEFS = {
  assaut: { n: 'Assaut', d: 'Vos Pokémon infligent +15 % de dégâts.', c: 'Ils en subissent +10 %.' },
  rempart: { n: 'Rempart', d: 'Vos Pokémon subissent −15 % de dégâts.', c: '−1 Mouvement.' },
  mobilite: { n: 'Mobilité', d: '+1 Mouvement pour vos Pokémon.', c: 'Ils infligent −10 % de dégâts.' },
  resonance: {
    n: 'Résonance',
    d: 'Chaque Pokémon commence avec 1 losange de plus.',
    c: '−1 Voix maximum (avec 1 seule Voix : PV −10 %).',
  },
  commandement: { n: 'Commandement', d: '+1 Voix maximum dès le départ.', c: 'PV maximum −10 %.' },
  butin: { n: 'Butin', d: '+30 % de Pokédollars en cas de victoire.', c: 'Vos Pokémon infligent −10 % de dégâts.' },
};

// Startup statements, run in their original order (see index.js).
export function init() {
  HOOKS.combat.push((S, opt) => {
    const d = opt && opt.doctrineChoice;
    if (!d || !DOCTRINE_DEFS[d]) {
      return;
    }
    S.doctrineChoice = d;
    const al = S.units.filter(u => u.side === 'a');
    if (d === 'resonance') {
      al.forEach(u => (u.en = Math.min(MAX_ENERGY, (u.en || 0) + 1)));
      if (S.vmax > 1) {
        S.vmax -= 1;
        S.voice = Math.min(S.voice, S.vmax);
      } else {
        al.forEach(u => {
          u.mhp = Math.max(1, Math.round(u.mhp * 0.9));
          u.hp = Math.min(u.hp, u.mhp);
        });
      }
    } else if (d === 'commandement') {
      S.vmax += 1;
      S.voice += 1;
      al.forEach(u => {
        u.mhp = Math.max(1, Math.round(u.mhp * 0.9));
        u.hp = Math.min(u.hp, u.mhp);
      });
    }
  });

  HOOKS.progress.push((S, rew, win) => {
    if (!S.doctrineChoice) {
      return null;
    }
    rew.doctrineChoice = S.doctrineChoice;
    if (!win || S.doctrineChoice !== 'butin') {
      return null;
    }
    const m = Math.round(((rew.money || 0) * 0.3) / 10) * 10;
    rew.loot = m;
    return m ? [m, 0] : null;
  });

  HOOKS.battleResult.push(r =>
    r.doctrineChoice && DOCTRINE_DEFS[r.doctrineChoice]
      ? `<div class="result-list"><h4>Doctrine</h4><div class="result-row"><span>${DOCTRINE_DEFS[r.doctrineChoice].n}${r.loot ? ' : butin de la victoire' : ''}</span><b>${r.loot ? '+' + formatNumber(r.loot) + ' ₽' : ''}</b></div></div>`
      : ''
  );

  document.addEventListener('click', e => {
    const b = e.target.closest('[data-doctrine-choice]');
    if (!b) {
      return;
    }
    PROFILE.doctrineChoice = b.dataset.doctrineChoice;
    queueSave();
    doctrineRender();
  });
}
