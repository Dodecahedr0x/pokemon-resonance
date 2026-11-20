/* Phased bosses, secret places, wandering NPCs (added in v4.60). */

import { TOD } from './home-route.js';
import { say } from '../combat/engine.js';
import { B } from '../combat/ui.js';
import { writeLS, readLS, mulberry32 } from '../core/utils.js';
import { sfx, vibe } from '../audio/sound-effects.js';
import { leaderOf, overlay } from '../progression/prestige.js';
import { shut, updateTemp } from '../../screens/overlays/tempStore.js';
import { V4 } from '../ui/screen-state.js';
import { savePurse, today } from '../state/economy.js';
import { renderMap } from './map.js';
import { placesR } from './johto.js';
import { todayWeather } from './pokegear.js';
import { getBoss, hasBossPhases } from '../combat/intensity.js';
import { applyReward, canAfford, rewardText } from './route-events.js';
import { badgeTotal } from '../progression/item-quests.js';

/** A gym Champion (boss without phases) goes berserk below 50% HP. */
export function bossEnrage(S, ev) {
  const b = getBoss(S);
  if (b && !b.ko && !S.over && !hasBossPhases(S) && !b.enraged && leaderOf(S.sc) && b.hp / b.mhp <= 0.5) {
    b.enraged = 1;
    b.boost = Math.max(b.boost || 0, 1);
    b.guard = Math.max(b.guard || 0, 1);
    say(ev, `${b.n} se déchaîne : dernière ligne droite ! ${bossLine(b, 0)}`);
    ev.push({ e: 'arena', r: 'phase2' });
  }
}

/** Row of the opponent sheet: boss phase, or the Champion's rage. */
export function bossResonanceHtml(e) {
  if (!B || e.ko || e !== getBoss(B)) {
    return '';
  }
  if (hasBossPhases(B)) {
    const ph = e.bossPhase || 1;
    return `<p class="battle-resonance-note">${ph >= 3 ? 'Phase 3 : dernier souffle.' : ph === 2 ? 'Phase 2 : renforcé. La phase 3 arrive sous 33 % de PV.' : 'Phase 1. La phase 2 arrive sous 66 % de PV.'}</p>`;
  }
  if (leaderOf(B.sc)) {
    return `<p class="battle-resonance-note">${e.enraged ? 'Il se déchaîne : renforcé.' : 'Il se déchaînera sous 50 % de PV.'}</p>`;
  }
  return '';
}

export function bossLine(b, i) {
  const t = (b.t && b.t[0]) || 'Normal',
    a = TYPE_LINES[t] || TYPE_LINES.Normal;
  return a[i] || a[0];
}

function pickPosition(seed, taken) {
  const r = stringSeededRng(seed),
    pl = placesR().concat(taken || []);
  let x = 0,
    y = 0;
  for (let k = 0; k < 24; k++) {
    x = 70 + r() * 860;
    y = 90 + r() * 800;
    if (pl.every(p => Math.hypot(p.x - x, p.y - y) > 80)) {
      break;
    }
  }
  return { x, y };
}

export function secretPositions() {
  const reg = V4.region || 'kanto',
    out = {},
    taken = [];
  SECRET_PLACES.forEach(s => {
    const p = pickPosition('sc' + reg + s.id, taken);
    out[s.id] = p;
    taken.push(p);
  });
  return out;
}

function secretOpen(id) {
  const s = SECRET_PLACES.find(x => x.id === id);
  if (!s) {
    return;
  }
  const st = secretState(),
    first = !st.found[id];
  if (first) {
    st.found[id] = 1;
    writeLS('res-secret-places', st);
    applyReward(s.rew);
    savePurse();
    sfx('win');
    vibe([30, 40, 30]);
  }
  // rendering: src/screens/overlays/transients/Windows.jsx (SecretPlace)
  const o = overlay('secret-places', {
    n: s.n,
    lore: s.lore,
    msg: first ? 'Vous trouvez : ' + rewardText(s.rew) + '.' : 'Vous avez déjà exploré ce lieu.',
  });
  o.addEventListener('click', e => {
    if (e.target === o) {
      shut('secret-places');
    }
  });
  renderMap();
}

export function npcState() {
  const d = today(),
    reg = V4.region || 'kanto',
    all = readLS('res-passerby', {});
  const k = reg;
  let s = all[k];
  if (!s || s.d !== d) {
    s = { d, done: false };
    all[k] = s;
    writeLS('res-passerby', all);
  }
  const r = stringSeededRng('pn' + d + reg);
  s.i = Math.floor(r() * WANDERING_NPCS.length);
  return { s, all, k };
}

export function npcPositions() {
  const d = today(),
    reg = V4.region || 'kanto',
    sc = Object.values(secretPositions());
  return pickPosition('pnp' + d + reg, sc);
}

function npcOpenOverlay() {
  const { s } = npcState(),
    N = WANDERING_NPCS[s.i];
  const c = N.c.map(choice => {
    const eff = choice.cost ? 'Coût : ' + rewardText(choice.cost) : '';
    return { l: choice.l, ok: canAfford(choice.cost), eff: eff || null };
  });
  // rendering: src/screens/overlays/transients/Windows.jsx (PassingNpc)
  const o = overlay('passerby', { n: N.n, x: N.x, c, res: null });
  o.addEventListener('click', e => {
    if (e.target === o) {
      shut('passerby');
    }
  });
}

function npcPickChoice(j) {
  const { s, all, k } = npcState(),
    N = WANDERING_NPCS[s.i],
    c = N.c[j];
  if (!c || s.done || !canAfford(c.cost)) {
    return;
  }
  if (c.cost) {
    applyReward(c.cost);
  }
  if (c.ok) {
    applyReward(c.ok);
  }
  all[k] = { d: s.d, done: true };
  writeLS('res-passerby', all);
  savePurse();
  sfx(c.ok ? 'ui' : 'hit');
  vibe(20);
  updateTemp('passerby', { res: c.t + (c.ok ? ' (' + rewardText(c.ok) + ')' : '') });
  renderMap();
}

/* ---------- 5. Markers (src/screens/map/Marks.jsx), clicks, Journal ---------- */

/* ---------- 1. Bosses: lines and gym Champion phase ---------- */
const TYPE_LINES = {
  Feu: ['« Mes flammes ne s’éteignent jamais ! »', '« Brûlez avec moi ! »'],
  Eau: ['« La marée monte, tenez bon si vous le pouvez ! »', '« Le déluge ne s’arrête pas ! »'],
  Plante: ['« Mes racines tiennent ce terrain ! »', '« La forêt ne recule pas ! »'],
  Électrik: ['« Ça vient de s’allumer ! »', '« Tous les circuits à fond ! »'],
  Glace: ['« Le froid fige les meilleurs plans. »', '« Un blizzard de plus ! »'],
  Combat: ['« Vous me poussez enfin à bout ! »', '« Un vrai combat commence ! »'],
  Poison: ['« Le venin agit lentement… »', '« Respirez, c’est le dernier souffle ! »'],
  Sol: ['« La terre gronde sous vos pieds ! »', '« Rien ne peut me déraciner ! »'],
  Vol: ['« Plus haut, plus vite ! »', '« Le ciel est à moi ! »'],
  Psy: ['« Je lis déjà votre prochain coup. »', '« Mon esprit ne vacille pas ! »'],
  Insecte: ['« L’essaim se réveille ! »', '« Vous ne verrez pas venir la suite ! »'],
  Roche: ['« Solide comme le roc ! »', '« Je ne céderai pas ! »'],
  Spectre: ['« Vous ne verrez que mon ombre… »', '« Vous ne m’échapperez pas ! »'],
  Dragon: ['« Le dragon se réveille ! »', '« Voici ma vraie puissance ! »'],
  Ténèbres: ['« Voilà où les ombres vous attendent. »', '« Je n’ai pas dit mon dernier mot ! »'],
  Acier: ['« L’acier plie, il ne rompt pas ! »', '« Rien ne perce ma garde ! »'],
  Fée: ['« La magie prend le dessus ! »', '« Vous allez voir de quoi je suis capable ! »'],
  Normal: ['« Je me suis assez retenu ! »', '« Maintenant, c’est sérieux ! »'],
};

/* ---------- 2. Map tools ---------- */
const hashString = s => {
  let h = 7;
  for (const ch of s) {
    h = (Math.imul(h, 31) + ch.charCodeAt(0)) >>> 0;
  }
  return h;
};

const stringSeededRng = s => mulberry32(hashString(s) || 1);

/* ---------- 3. Secret places ---------- */
const currentWeather = () => {
  try {
    return todayWeather();
  } catch (e) {
    return null;
  }
};

export const secretState = () => readLS('res-secret-places', { found: {} });

export const visibleSecrets = () => SECRET_PLACES.filter(s => badgeTotal() >= s.min && s.ok());

/* ---------- 4. Wandering NPCs ---------- */
export const WANDERING_NPCS = [
  {
    n: 'Marchand de passage',
    x: 'Il ouvre sa malle : « Pour 300 ₽, je vous cède un morceau de roche brillante. »',
    c: [
      { l: 'Acheter (300 ₽)', cost: { m: -300 }, ok: { g: 1 }, t: 'Vous repartez avec un éclat.' },
      { l: 'Refuser poliment', t: 'Il hausse les épaules et reprend sa route.' },
    ],
  },
  {
    n: 'Vieux randonneur',
    x: 'Il vous raconte une légende sur la Résonance autour d’un thé tiède.',
    c: [
      { l: 'Écouter jusqu’au bout', ok: { m: 250 }, t: 'En remerciement, il vous glisse quelques pièces.' },
      { l: 'Poursuivre', t: 'Vous le saluez et repartez.' },
    ],
  },
  {
    n: 'Jeune dresseuse',
    x: 'Elle cherche un partenaire d’entraînement : « Une Potion pour moi, et je partage mes trouvailles ! »',
    c: [
      {
        l: 'Donner une Potion',
        cost: { b: { potion: -1 } },
        ok: { g: 2 },
        t: 'Elle vous confie deux éclats trouvés sur la route.',
      },
      { l: 'Plus tard', t: 'Elle vous souhaite bonne chance.' },
    ],
  },
  {
    n: 'Pêcheur solitaire',
    x: 'Sa canne est cassée, mais sa boîte d’appâts déborde.',
    c: [
      {
        l: 'Lui offrir une Poké Ball',
        cost: { b: { poke: -1 } },
        ok: { m: 700 },
        t: 'Il vous paie généreusement ce qu’il a pêché.',
      },
      { l: 'Passer', t: 'Vous le laissez à ses lignes.' },
    ],
  },
  {
    n: 'Chercheuse errante',
    x: 'Elle note les variations de Résonance : « Un Antidote m’aiderait à terminer ce relevé. »',
    c: [
      {
        l: 'Donner un Antidote',
        cost: { b: { antidote: -1 } },
        ok: { g: 2, m: 150 },
        t: 'Elle partage ses résultats et vous remercie.',
      },
      { l: 'Passer', t: 'Elle reprend ses notes.' },
    ],
  },
  {
    n: 'Cuisinier ambulant',
    x: 'Une odeur de soupe flotte. « Un bol chaud avant la prochaine route ? »',
    c: [
      {
        l: 'Accepter (100 ₽)',
        cost: { m: -100 },
        ok: { b: { baiemepo: 1 } },
        t: 'Il glisse une baie dans votre sac pour la route.',
      },
      { l: 'Non merci', t: 'Il sourit et range sa marmite.' },
    ],
  },
  {
    n: 'Dresseur voyageur',
    x: 'Il a perdu son chemin : « Montrez-moi la direction et je vous récompense. »',
    c: [
      { l: 'L’indiquer', ok: { m: 400 }, t: 'Il vous donne une petite somme et s’éloigne.' },
      { l: 'Poursuivre', t: 'Il cherchera tout seul.' },
    ],
  },
  {
    n: 'Archiviste curieuse',
    x: 'Elle collectionne les légendes des routes : « Parlez-moi de votre aventure, je vous offre un souvenir. »',
    c: [
      { l: 'Raconter', ok: { g: 3 }, t: 'Elle note tout et vous offre trois éclats.' },
      { l: 'Pas aujourd’hui', t: 'Elle range son carnet.' },
    ],
  },
];

export const SECRET_PLACES = [
  {
    id: 's1',
    n: 'Source de la Lune',
    ind: 'Se révèle la nuit.',
    min: 0,
    ok: () => TOD === 'nuit',
    lore: 'Une eau claire coule sous les étoiles. Les anciens disaient que les premières notes de la Résonance y ont été entendues.',
    rew: { g: 3 },
  },
  {
    id: 's2',
    n: 'Clairière du Matin',
    ind: 'Se révèle le matin.',
    min: 0,
    ok: () => TOD === 'matin',
    lore: 'La rosée perle sur les baies. Quelqu’un a laissé là un panier, comme une offrande pour les dresseurs de passage.',
    rew: { b: { baiemepo: 2 } },
  },
  {
    id: 's3',
    n: 'Crique des Marées',
    ind: 'Se révèle sous la pluie, après le 1er badge.',
    min: 1,
    ok: () => currentWeather() === 'pluie',
    lore: 'La pluie dévoile un passage vers une crique. Une vieille caisse échouée contient de quoi payer un voyage.',
    rew: { m: 1200 },
  },
  {
    id: 's4',
    n: 'Dune Dorée',
    ind: 'Se révèle au soleil ou sous le sable, après le 2e badge.',
    min: 2,
    ok: () => ['soleil', 'sable'].includes(currentWeather()),
    lore: 'Entre deux dunes, un cercle de pierres brille. Des éclats y dorment depuis des siècles.',
    rew: { g: 4 },
  },
  {
    id: 's5',
    n: 'Cime Gelée',
    ind: 'Se révèle sous la grêle, après le 3e badge.',
    min: 3,
    ok: () => currentWeather() === 'grele',
    lore: 'Un refuge gelé, une lanterne encore tiède. Un randonneur y a laissé ses réserves de soins.',
    rew: { b: { superpotion: 3 }, m: 600 },
  },
  {
    id: 's6',
    n: 'Ruine de la Résonance',
    ind: 'Se révèle en journée, après le 4e badge.',
    min: 4,
    ok: () => TOD === 'jour',
    lore: 'Les murs gravés racontent la Dissonance, ce silence qui efface les notes. Au centre, un éclat de Résonance pur vibre encore.',
    rew: { g: 6 },
  },
];

// Instructions run at startup, in the original order (see index.js).
export function init() {
  // secret places (.map-secret) and passing character (.map-passerby) on the map: rendered by React
  // (src/screens/map/Marks.jsx)

  document.addEventListener(
    'click',
    e => {
      const t = e.target.closest && e.target.closest('[data-secret-places],[data-passerby]');
      if (!t) {
        return;
      }
      e.stopPropagation();
      e.preventDefault();
      if (t.dataset.secretPlaces !== undefined) {
        const v = t.dataset.secretPlaces;
        if (v === 'close') {
          shut('secret-places');
        } else {
          secretOpen(v);
        }
      } else {
        const v = t.dataset.passerby;
        if (v === 'close') {
          shut('passerby');
        } else if (v === 'o') {
          npcOpenOverlay();
        } else {
          npcPickChoice(+v);
        }
      }
    },
    true
  );
}
