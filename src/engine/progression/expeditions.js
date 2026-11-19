import { BY, SCEN } from '../pokemon/pokemon.js';
import { PROFILE, inBox } from '../state/game-state.js';
import { $, toast } from '../core/utils.js';
import { HOOKS } from '../core/hooks.js';
import { __set_squad, renderSquad, save, squad } from '../team/team.js';
import { queueSave } from '../state/saves.js';
import { sfx } from '../audio/sound-effects.js';
import { SHOP, bagN, fmt } from '../state/economy.js';
import { renderWallet } from '../ui/wallet.js';
import { isFallen } from './campaign-challenges.js';
import { isInDaycare } from './daycare.js';
import { campOpen } from './camp.js';
import { level, renderCampBase } from './base-camp.js';
import { lockedByBadges, expeditionStory } from './companion-eggs.js';
import { paintOverlay } from '../../screens/overlays/dialogsStore.js';

let EXP_DEST;
export { placesExp }; // read by the base Camp (src/screens/camp)

/* =====================================================================
   Expeditions (added in v4.10): a Pokémon from the Box leaves for a few
   battles and comes back with Pokédollars, Shards and items (doubled if
   its types match the location). While away, it does not fight.
   ===================================================================== */

// or at the Daycare (v4.16)
export function expRefusal(id) {
  if (isInDaycare(id)) {
    return `${BY[BY[id].base].n} est à la Pension : reprenez le couple au Camp pour le faire combattre.`;
  } // v4.16
  return onExpedition(id) ? `${BY[BY[id].base].n} est en expédition : il reviendra bientôt.` : null;
}

export function send(id, dest) {
  const D = DESTINATIONS[dest];
  if (D && lockedByBadges(D)) {
    return toast(`${D.n} : accessible après ${D.min} badges.`);
  }
  if (!campOpen() || !D || !inBox(id) || onExpedition(id) || PROFILE.exp.length >= placesExp()) {
    return;
  }
  const r = () => Math.random(),
    between = ([a, b]) => Math.round((a + r() * (b - a)) / 10) * 10,
    bon = BY[id].t.some(t => D.types.includes(t)),
    x = bon ? 2 : 1,
    obj = D.obj.filter(o => SHOP[o]);
  const payout = {
    m: between(D.m) * x,
    g: Math.round(D.g[0] + r() * (D.g[1] - D.g[0])) * x,
    o: obj.length ? obj[Math.floor(r() * obj.length)] : null,
    q: x,
  };
  PROFILE.exp.push({ id, destinationId: dest, fin: PROFILE.battles + D.duration, gain: payout, ideal: bon });
  __set_squad(squad.filter(s => BY[s].base !== BY[id].base));
  toast(
    `${BY[id].n} part pour ${D.n}${bon ? ' : un terrain qui lui convient' : ''}. Retour dans ${D.duration} combats.`
  );
  save();
  queueSave();
  renderCampBase();
  try {
    renderSquad();
  } catch {
    /* Best effort: failure here is non-fatal. */
  }
}

export function retrieve(i) {
  const x = PROFILE.exp[i];
  if (!x || PROFILE.battles < x.fin) {
    return;
  }
  PROFILE.money = Math.min(999999, PROFILE.money + x.gain.m);
  PROFILE.gems = Math.min(99999, PROFILE.gems + x.gain.g);
  if (x.gain.o) {
    PROFILE.bag[x.gain.o] = Math.min(99, bagN(x.gain.o) + x.gain.q);
  }
  PROFILE.exp.splice(i, 1);
  sfx('ui');
  toast(
    `${BY[x.id].n} revient de ${DESTINATIONS[x.destinationId].n} : ${fmt(x.gain.m)} ₽${x.gain.g ? `, ${x.gain.g} Éclats` : ''}${x.gain.o ? `, ${x.gain.q} × ${SHOP[x.gain.o].n}` : ''}.`
  );
  queueSave();
  renderWallet();
  renderCampBase();
  try {
    expeditionStory(x); // story and rare find (v4.61)
  } catch {
    /* Best effort: failure here is non-fatal. */
  }
}

/* expedition window: rendered by React (src/screens/overlays/ExpBox.jsx) */
export function renderExpBox() {
  const available = PROFILE.box.filter(
    id => BY[id] && !squad.some(s => BY[s].base === id) && !onExpedition(id) && !isFallen(id)
  );
  paintOverlay('exp', { destinationId: EXP_DEST, available });
}

export const DESTINATIONS = {
  foret: {
    n: 'Forêt de Jade',
    types: ['Plante', 'Insecte', 'Vol'],
    duration: 3,
    m: [150, 300],
    g: [0, 1],
    obj: ['potion', 'poke'],
  },
  lac: {
    n: 'Lac Colère',
    types: ['Eau', 'Glace', 'Normal'],
    duration: 4,
    m: [200, 400],
    g: [1, 2],
    obj: ['superpotion', 'super'],
  },
  grotte: {
    n: 'Grotte Sombre',
    types: ['Roche', 'Sol', 'Acier', 'Combat'],
    duration: 5,
    m: [300, 600],
    g: [2, 4],
    obj: ['hyper', 'superpotion'],
  },
  tour: {
    n: 'Tour Cendrée',
    types: ['Feu', 'Spectre', 'Psy', 'Ténèbres', 'Dragon', 'Électrik', 'Poison', 'Fée'],
    duration: 6,
    m: [400, 800],
    g: [3, 6],
    obj: ['hyper'],
  },
};

export const onExpedition = id =>
  !!(campOpen() && PROFILE.exp && BY[id] && PROFILE.exp.some(x => BY[x.id].base === BY[id].base)) || isInDaycare(id);

const placesExp = () => level('guet');

// Startup statements, run in their original order (see index.js).
export function init() {
  // #expBox: rendered by React (src/screens/overlays/ExpBox.jsx)
  EXP_DEST = null;

  document.addEventListener('click', e => {
    if (e.target.closest('[data-camp-b]')) {
      return; // a Base Camp building (progression/base-camp.js)
    }
    const r = e.target.closest('[data-exp-r]');
    if (r) {
      return retrieve(+r.dataset.expR);
    }
    if (e.target.closest('[data-exp-new]')) {
      EXP_DEST = null;
      renderExpBox();
      $('#expBox').hidden = false;
      return;
    }
    const d = e.target.closest('[data-exp-d]');
    if (d) {
      EXP_DEST = d.dataset.expD || null;
      renderExpBox();
      return;
    }
    const p = e.target.closest('[data-exp-p]');
    if (p && EXP_DEST) {
      send(p.dataset.expP, EXP_DEST);
      $('#expBox').hidden = true;
      return;
    }
    if (e.target.closest('[data-exp-x]') || e.target.id === 'expBox') {
      $('#expBox').hidden = true;
    }
  });

  HOOKS.progress.push((S, rew) => {
    const D = SCEN[S.sc] || {};
    if (!campOpen() || D.tuto || D.tower) {
      return null;
    }
    // expeditions returned
    const rev = (PROFILE.exp || []).filter(x => PROFILE.battles >= x.fin).length;
    if (rev) {
      rew.exp = rev;
    }
    return null;
  });

  HOOKS.battleResult.push(r =>
    r.exp
      ? `<div class="res-l"><h4>Expéditions</h4><div class="rl"><span>${r.exp} Pokémon ${r.exp > 1 ? 'sont revenus' : 'est revenu'} d’expédition : récupérez leurs trouvailles au Camp (Accueil).</span><b>${r.exp}</b></div></div>`
      : ''
  );
}
