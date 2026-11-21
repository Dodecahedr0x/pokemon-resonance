/* Campaign challenges (Settings): Mono-type, Team of 3, No Awakening, Nuzlocke; each active one earns extra Shards (added in v4.9). */

import { POKEMON, SCENARIOS } from '../pokemon/pokemon.js';
import { PROFILE, isCamp } from '../state/game-state.js';
import { medal, toast } from '../core/utils.js';
import { HOOKS } from '../core/hooks.js';
import { __set_squad, renderSquad, save, squad } from '../team/team.js';
import { scSel } from '../combat/ui.js';
import { armedBossRush } from '../modes/boss-rush.js';
import { queueSave } from '../state/saves.js';
import { renderWallet } from '../ui/wallet.js';
import { renderParams } from '../ui/settings.js';
import { REPLAY0 } from './replayability-profile.js';

export let CHALLENGE_CONF;

export const CHALLENGES = {
  mono: ['Mono-type', 'Seuls les Pokémon du type choisi peuvent combattre.'],
  trio: ['Équipe de 3', 'Trois Pokémon par combat au lieu de quatre.'],
  sansEveil: ['Sans Éveil', 'Vos Pokémon ne s’éveillent pas en combat.'],
  nuzlocke: ['Nuzlocke', 'Un Pokémon mis K.O. tombe au combat : il ne combattra plus de cette campagne.'],
};

export const teamSize = () => (isCamp() && PROFILE.challenges && PROFILE.challenges.trio ? 3 : 4);

export function activeChallenges() {
  if (!isCamp() || !PROFILE.challenges) {
    return [];
  }
  return Object.keys(CHALLENGES).filter(k => PROFILE.challenges[k]);
}

export function isFallen(id) {
  return !!(
    isCamp() &&
    PROFILE.challenges &&
    PROFILE.challenges.nuzlocke &&
    POKEMON[id] &&
    (PROFILE.graves || []).includes(POKEMON[id].base)
  );
}

/** Can this Pokémon join the team? (null: yes; otherwise the reason) */
export function challengeRefusal(id) {
  if (!isCamp() || !PROFILE.challenges) {
    return null;
  }
  const m = POKEMON[id],
    d = PROFILE.challenges;
  if (!m) {
    return null;
  }
  if (isFallen(id)) {
    return `${POKEMON[m.base].n} est tombé au combat (Nuzlocke) : il ne combat plus.`;
  }
  if (d.mono && !m.t.includes(d.mono)) {
    return `Défi Mono-type ${d.mono} : ${m.n} n’est pas de ce type.`;
  }
  if (d.trio && squad.length >= 3 && !squad.some(x => POKEMON[x].base === m.base)) {
    return 'Défi Équipe de 3 : trois Pokémon au plus.';
  }
  return null;
}

/** Before starting a campaign battle. */
export function challengeLaunch() {
  if (armedBossRush()) {
    return null;
  }
  const D = SCENARIOS[scSel];
  if (!isCamp() || !D || D.tuto || D.tower) {
    return null;
  }
  const d = PROFILE.challenges || {},
    eq = squad.slice(0, teamSize());
  const t = eq.find(isFallen);
  if (t) {
    return `${POKEMON[t].n} est tombé au combat (Nuzlocke) : retirez-le de l’équipe.`;
  }
  if (d.mono) {
    const x = eq.find(id => !POKEMON[id].t.includes(d.mono));
    if (x) {
      return `Défi Mono-type ${d.mono} : ${POKEMON[x].n} n’est pas de ce type. Retirez-le de l’équipe.`;
    }
  }
  return null;
}

function updateChallenges() {
  queueSave();
  renderParams();
  renderWallet();
}

function onProgress(S, rew, win) {
  const D = SCENARIOS[S.sc] || {};
  let g = 0;
  const df = D.tuto || D.tower ? [] : activeChallenges();
  if (df.length) {
    rew.challenges = df;
    if (win) {
      const bonus = df.length * (rew.badgeNew ? 4 : 1);
      g += bonus;
      rew.challengeBonus = bonus;
    }
    if (df.includes('nuzlocke')) {
      PROFILE.graves = PROFILE.graves || [];
      const deadList = S.units.filter(u => u.side === 'a' && u.ko && POKEMON[u.sp]).map(u => POKEMON[u.sp].base);
      deadList.forEach(b => {
        if (!PROFILE.graves.includes(b)) {
          PROFILE.graves.push(b);
          (rew.graves = rew.graves || []).push(b);
        }
      });
      if (rew.graves) {
        __set_squad(squad.filter(id => !isFallen(id)));
        setTimeout(() => {
          try {
            save();
            renderSquad();
          } catch {
            /* Best effort: failure here is non-fatal. */
          }
        }, 0);
      }
    }
  }
  return g ? [0, g] : null;
}

// Statements run at startup, in the original order (see index.js).
export function init() {
  HOOKS.creation.push((S, opt, D0) => {
    if (opt && Array.isArray(opt.challenges) && opt.challenges.includes('sansEveil') && !D0.tuto) {
      S.sansEveil = true;
    }
  });

  HOOKS.progress.push(onProgress);

  HOOKS.battleResult.push(r =>
    r.challenges
      ? `<div class="result-list"><h4>Défis</h4><div class="result-row"><span>${r.challenges.map(k => CHALLENGES[k][0]).join(', ')}${r.challengeBonus ? ` : +${r.challengeBonus} Éclats` : ''}</span><b>${r.challenges.length}</b></div>${(
          r.graves || []
        )
          .map(
            b =>
              `<div class="result-row is-fallen">${medal(POKEMON[b].t)}<span>${POKEMON[b].n} est tombé au combat.</span><b>✝</b></div>`
          )
          .join('')}</div>`
      : ''
  );

  /* ---------- Settings: the challenges ---------- */
  CHALLENGE_CONF = false;

  document.addEventListener('change', e => {
    const x = e.target.closest('[data-defi]');
    if (!x || !isCamp()) {
      return;
    }
    PROFILE.challenges = PROFILE.challenges || REPLAY0().challenges;
    const k = x.dataset.defi;
    PROFILE.challenges[k] = k === 'mono' ? x.value : x.checked;
    if (k === 'mono' && x.value) {
      toast(`Défi Mono-type ${x.value} : seuls les Pokémon de ce type combattront.`);
    }
    updateChallenges();
  });

  document.addEventListener('click', e => {
    const n = e.target.closest('[data-nz]');
    if (!n || !isCamp()) {
      return;
    }
    const a = n.dataset.nz;
    PROFILE.challenges = PROFILE.challenges || REPLAY0().challenges;
    if (a === 'on') {
      CHALLENGE_CONF = true;
    } else if (a === 'non') {
      CHALLENGE_CONF = false;
    } else if (a === 'ok') {
      CHALLENGE_CONF = false;
      PROFILE.challenges.nuzlocke = true;
      PROFILE.graves = [];
      toast('Nuzlocke : chaque K.O. compte désormais.');
    } else if (a === 'stop') {
      PROFILE.challenges.nuzlocke = false;
      toast('Nuzlocke abandonné.');
    }
    updateChallenges();
  });
}
