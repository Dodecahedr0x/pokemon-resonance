/* =====================================================================
   Companion Pokémon (added in v4.17): it waits for you on the Team
   page (and in the Home hero), its affection grows with your battles and grants bonuses.
   ===================================================================== */
import { BY, MON, SCEN } from '../pokemon/pokemon.js';
import { PROFILE, isCamp } from '../state/game-state.js';
import { $, medal, toast } from '../core/utils.js';
import { HOOKS } from '../core/hooks.js';
import { hasNx, pushMessage } from '../combat/engine.js';
import { queueSave } from '../state/saves.js';
import { sfx, vibe } from '../audio/sound-effects.js';
import { today } from '../state/economy.js';
import { isShinyOwned } from '../pokemon/shiny.js';
import { DAMAGE_PROVIDERS } from '../combat/tactical-engine.js';
import { ACHIEVEMENTS } from './achievements.js';
import { hasXp } from '../combat/resonance.js';
import { refreshHome } from '../../screens/home/homeStore.js';
import { paintOverlay } from '../../screens/overlays/dialogsStore.js';
import { resonanceCandidate } from '../combat/resonant-form.js';

const AFF_T = [10, 30, 60, 100, 150];

export const affinityHearts = a => AFF_T.filter(t => a >= t).length;

export const activeCompanionId = () => {
  const c = PROFILE.comp;
  return c && BY[c.id] && PROFILE.box.includes(BY[c.id].base) ? c.id : ''; // Free mode too (v4.21)
};

const COMP_MOOD = [
  '{n} vous observe avec curiosité.',
  '{n} trottine à vos côtés.',
  '{n} se blottit contre vous.',
  '{n} rayonne de confiance.',
  '{n} vous suit partout, l’air fier.',
  '{n} et vous, vous vous comprenez sans un mot.',
];

const COMP_BONUS = [
  [2, 'Confiance', 'commence chaque combat avec 1 losange'],
  [3, 'Tenir bon', 'survit une fois à un coup fatal avec 1 PV'],
  [4, 'Complicité', '+10 % de dégâts'],
  [5, 'Lien parfait', 'se libère seul de ses statuts en fin de manche'],
];

export function gainCompanionAffinity(n) {
  const c = PROFILE.comp;
  if (!c || !c.id) {
    return 0;
  }
  const previous = affinityHearts(c.aff);
  c.aff = Math.min(255, (c.aff || 0) + n);
  return affinityHearts(c.aff) > previous ? affinityHearts(c.aff) : 0;
}

/** The companion panel (#v4Comp, on the Team page, rendered by src/screens/team/Companion.jsx). */
export function companionPanelData() {
  const id = activeCompanionId();
  if (!id) {
    return null;
  }
  const m = BY[id],
    a = PROFILE.comp.aff || 0,
    h = affinityHearts(a);
  return {
    m,
    h,
    pr: h >= 5 ? 100 : Math.round(((a - (AFF_T[h - 1] || 0)) / (AFF_T[h] - (AFF_T[h - 1] || 0))) * 100),
    petting: PROFILE.comp.j === today(),
    mood: COMP_MOOD[h].replace('{n}', m.n),
    sh: isShinyOwned(m.base),
    bonus:
      h >= 2
        ? COMP_BONUS.filter(([n]) => h >= n)
            .map(([, t]) => t)
            .join(' · ')
        : '',
  };
}

/* companion choice: rendered by React (src/screens/overlays/CompBox.jsx) */
export function renderCompanionBox() {
  const L = MON.filter(
    m =>
      !m.isEnemy &&
      !m.leg &&
      PROFILE.box.includes(m.base) &&
      (m.st === 1 || (isCamp() && (PROFILE.forms || []).includes(m.id)))
  ).slice(0, 80);
  paintOverlay('comp', { L: L.map(m => m.id), cur: activeCompanionId(), bonus: COMP_BONUS });
}

function onCompanionPokemonClick(e) {
  const b = e.target.closest('[data-comp]');
  if (b) {
    const k = b.dataset.comp;
    if (k === 'choisir') {
      renderCompanionBox();
      $('#compBox').hidden = false;
    } else if (k === 'x') {
      $('#compBox').hidden = true;
    } else if (k === 'caresser' && activeCompanionId() && PROFILE.comp.j !== today()) {
      PROFILE.comp.j = today();
      const up = gainCompanionAffinity(3);
      sfx('ui');
      vibe(25);
      toast(
        up
          ? `${BY[activeCompanionId()].n} est ravi : ${up} cœur${up > 1 ? 's' : ''} !`
          : `${BY[activeCompanionId()].n} ferme les yeux de bonheur.`
      );
      queueSave();
      refreshHome();
    }
    return;
  }
  const p = e.target.closest('[data-comp-p]');
  if (p) {
    const id = p.dataset.compP;
    if (PROFILE.comp.id !== id) {
      PROFILE.comp = {
        id,
        aff: PROFILE.comp.id && BY[PROFILE.comp.id] && BY[PROFILE.comp.id].base === BY[id].base ? PROFILE.comp.aff : 0,
        j: PROFILE.comp.j,
      };
    }
    $('#compBox').hidden = true;
    toast(`${BY[id].n} devient votre compagnon.`);
    queueSave();
    refreshHome();
    return;
  }
  if (e.target.id === 'compBox') {
    $('#compBox').hidden = true;
  }
}

// Statements run at startup, in the original order (see index.js).
export function init() {
  HOOKS.combat.push(S => {
    if (S.restricted) {
      return;
    } // fixed-rule battles: no companion bonus (v4.31)
    const id = activeCompanionId();
    if (!id) {
      return;
    }
    const u = S.units.find(x => x.side === 'a' && x.sp === BY[id].base);
    if (!u) {
      return;
    }
    const h = affinityHearts(PROFILE.comp.aff);
    u.comp = h || 1;
    if (h >= 2 && (hasNx(u) || hasXp(u) || resonanceCandidate(S, u))) {
      u.en = Math.max(u.en, 1);
    }
    if (h >= 3) {
      u.belt = true;
    }
  });

  DAMAGE_PROVIDERS.push({
    id: 'complicite',
    provide: (c, { u }) => u.comp >= 4 && { mul: 1.1, labelText: 'Complicité' },
  });

  HOOKS.beforeRoundEnd.push((S, ev) => {
    S.units.forEach(u => {
      if (u.ko || !(u.comp >= 5) || !(u.badge || u.burn || u.web || u.root)) {
        return;
      }
      u.badge = null;
      u.skip = 0;
      u.burn = 0;
      u.web = 0;
      u.root = 0;
      pushMessage(ev, `${u.n} se secoue pour vous : statuts dissipés.`);
    });
  });

  HOOKS.progress.push((S, rew, win) => {
    const id = activeCompanionId(),
      D = SCEN[S.sc] || {};
    if (!id || D.tuto) {
      return null;
    }
    const u = S.units.find(x => x.side === 'a' && x.sp === BY[id].base);
    if (!u) {
      return null;
    }
    const n = win ? 3 : 2,
      up = gainCompanionAffinity(n);
    rew.companionReward = { id, n, up };
    return null;
  });

  HOOKS.battleResult.push(r => {
    const c = r.companionReward;
    if (!c) {
      return '';
    }
    const h = affinityHearts(PROFILE.comp.aff || 0),
      B2 = COMP_BONUS.find(([n]) => n === c.up);
    return `<div class="result-list"><h4>Compagnon</h4><div class="result-row">${medal(BY[c.id].t)}<span>${BY[c.id].n} : +${c.n} d’affection${c.up ? ` · <b>${c.up} cœur${c.up > 1 ? 's' : ''} !</b>${B2 ? ` Nouveau bonus : ${B2[1]} (${B2[2]}).` : ''}` : ''}</span><b class="cp-h">${'♥'.repeat(h) || '♡'}</b></div></div>`;
  });

  // #compBox: rendered by React (src/screens/overlays/CompBox.jsx)

  document.addEventListener('click', onCompanionPokemonClick);

  /* ---------- achievements ---------- */
  ACHIEVEMENTS.push({
    id: 'complice',
    n: 'Inséparables',
    d: 'Atteindre 5 cœurs avec votre compagnon.',
    t: 'Inséparables',
    ok: () => affinityHearts((PROFILE.comp || {}).aff || 0) >= 5,
  });
}
