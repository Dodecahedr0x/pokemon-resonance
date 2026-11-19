/* Item quests and trophies (added in v4.59). */

import { ITEMS2, PROFILE } from '../state/game-state.js';
import { BADGES } from '../modes/gyms.js';
import { toast } from '../core/utils.js';
import { sfx, vibe } from '../audio/sound-effects.js';
import { SHOP, bagN, savePurse } from '../state/economy.js';
import { renderBag } from './quests-shop.js';
import { dailySeed } from '../world/pokegear.js';
import { applyReward, rewardText } from '../world/route-events.js';
import { addItems, dailyGiftState, tmKeys, hasIngredients } from '../items/workshop.js';

export { QUESTS, TROPHIES }; // read by Shop › Quests and Trophies (React, src/screens/bag/Workshop.jsx)

export function questState() {
  let s;
  try {
    s = JSON.parse(localStorage.getItem('res-quest-log') || '{}');
  } catch (e) {
    s = {};
  }
  s.done = s.done || {};
  return s;
}

export function questCost(q) {
  /* needs: the item keys, and "ct" = a TM from the Bag */
  const o = {};
  for (const k in q.in) {
    if (k !== 'ct') {
      o[k] = q.in[k];
    }
  }
  return o;
}

export function questUnlocked(q) {
  return hasIngredients(questCost(q)) && (!q.in.ct || !!ownedTmKey());
}

export function questRewardText(r) {
  const a = [];
  if (r.m || r.g || r.b) {
    a.push(rewardText({ m: r.m, g: r.g, b: r.b }));
  }
  if (r.item) {
    a.push(ITEMS2[r.item].n + (PROFILE.items.includes(r.item) ? ' (déjà en votre possession : 2 500 ₽)' : ''));
  }
  if (r.ct) {
    a.push('une CT');
  }
  return a.filter(Boolean).join(' + ');
}

function tmSeenCount() {
  let seen = {};
  try {
    seen = JSON.parse(localStorage.getItem('res-tm-showcase') || '{}');
  } catch {
    /* Best effort: failure here is non-fatal. */
  }
  const learned = Object.values((PROFILE.ct && PROFILE.ct.learnedTms) || {});
  const all = Object.keys(SHOP).filter(k => SHOP[k].category === 'machines' && !SHOP[k].g === !SHOP[k].g);
  return all.filter(k => seen[k] || bagN(k) > 0 || learned.includes(SHOP[k].mv)).length;
}

export function trophyState() {
  let s;
  try {
    s = JSON.parse(localStorage.getItem('res-trophy-room') || '{}');
  } catch (e) {
    s = {};
  }
  return s;
}

// Shop › Quests and Trophies: rendered by React (src/screens/bag/Workshop.jsx)

const QUESTS = [
  {
    id: 'q1',
    min: 0,
    giver: 'Infirmière Lise',
    txt: 'Une randonnée a mal tourné ce matin et la salle de soins est vide. Rapportez-moi de quoi remettre tout le monde sur pied.',
    in: { potion: 3 },
    rew: { m: 800, b: { baiemepo: 1 } },
  },
  {
    id: 'q2',
    min: 0,
    giver: 'Pêcheur Marcel',
    txt: 'Je veux sortir un gros Pokémon de la rivière, mais mes Balls sont trop faibles. Prêtez-moi les vôtres, je vous laisse ma pierre porte-bonheur.',
    in: { poke: 2, super: 1 },
    rew: { item: 'eaumystique' },
  },
  {
    id: 'q3',
    min: 1,
    giver: 'Randonneuse Clémence',
    txt: 'Mon groupe a été piqué et gelé en une seule nuit sur la route. Avec de quoi les soigner, je vous offre une baie qui ne rate jamais.',
    in: { antidote: 2, antigel: 2 },
    rew: { item: 'baielum' },
  },
  {
    id: 'q4',
    min: 1,
    giver: 'Prof. Sorbier',
    txt: 'Pour mes recherches sur la Résonance, il me faut des soins plus solides que de simples Potions. Je vous remercie en Éclats.',
    in: { superpotion: 3 },
    rew: { g: 2 },
  },
  {
    id: 'q5',
    min: 2,
    giver: 'Forgeron Armand',
    txt: 'J’ai besoin d’un disque de CT pour étudier le gravage. Prêtez-m’en un et je vous donne un charbon spécial de ma forge.',
    in: { ct: 1 },
    rew: { item: 'charbon' },
  },
  {
    id: 'q6',
    min: 2,
    giver: 'Collectionneuse Opaline',
    txt: 'Ma vitrine de Balls n’est pas complète. Trois Super Balls et je vous trouve une CT rare dans mes réserves.',
    in: { super: 3 },
    rew: { ct: 1, g: 1 },
  },
  {
    id: 'q7',
    min: 3,
    giver: 'Gardien du Phare',
    txt: 'La tempête a blessé tous mes Pokémon d’un coup. Deux Hyper Potions, et mes Lunettes Filtre sont à vous.',
    in: { hyperpotion: 2 },
    rew: { item: 'filtre' },
  },
  {
    id: 'q8',
    min: 4,
    giver: 'Octave, ancien champion',
    txt: 'À mon époque, on gagnait avec de la Résonance pure. Montrez-moi une Gelée Résonante et un Rappel, je vous passe mon vieux gilet.',
    in: { gelee: 1, rappel: 1 },
    rew: { item: 'cape' },
  },
  {
    id: 'q9',
    min: 4,
    giver: 'Aubergiste Solange',
    txt: 'Pour le grand banquet des dresseurs, il me faut quatre Baies Oran. Je vous offre la bannière de la maison.',
    in: { baieoran: 4 },
    rew: { item: 'banniere' },
  },
  {
    id: 'q10',
    min: 6,
    giver: 'Maître Lucien',
    txt: 'Seuls les plus préparés m’intéressent. Deux Hyper Balls et un Rappel Max, et vous aurez ma Ceinture Noire.',
    in: { hyper: 2, rappelmax: 1 },
    rew: { item: 'ceintnoire', g: 3 },
  },
];

export const badgeTotal = () => BADGES.length;

const ownedTmKey = () => tmKeys().find(k => bagN(k) > 0);

/* ---------- trophy box ---------- */
const TROPHIES = [
  { id: 't1', t: 'Collection d’objets tenus', n: 5, v: () => PROFILE.items.length, g: 1 },
  { id: 't2', t: 'Collection d’objets tenus', n: 10, v: () => PROFILE.items.length, g: 2 },
  { id: 't3', t: 'Collection d’objets tenus', n: 20, v: () => PROFILE.items.length, g: 4 },
  { id: 't4', t: 'CT et CS vues', n: 10, v: () => tmSeenCount(), g: 1 },
  { id: 't5', t: 'CT et CS vues', n: 25, v: () => tmSeenCount(), g: 2 },
  { id: 't6', t: 'CT et CS vues', n: 40, v: () => tmSeenCount(), g: 4 },
  { id: 't7', t: 'Quêtes d’objets', n: 3, v: () => Object.keys(questState().done).length, g: 1 },
  { id: 't8', t: 'Quêtes d’objets', n: 6, v: () => Object.keys(questState().done).length, g: 2 },
  { id: 't9', t: 'Quêtes d’objets', n: 10, v: () => Object.keys(questState().done).length, g: 5 },
  { id: 't10', t: 'Cadeaux du jour d’affilée', n: 7, v: () => dailyGiftState().n, g: 3 },
];

// Statements run at startup, in the original order (see index.js).
export function init() {
  document.addEventListener(
    'click',
    e => {
      const b = e.target.closest && e.target.closest('[data-quest-log]');
      if (!b || b.disabled) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      const q = QUESTS.find(x => x.id === b.dataset.questLog),
        S = questState();
      if (!q || S.done[q.id] || badgeTotal() < q.min || !questUnlocked(q)) {
        return;
      }
      const tm = q.in.ct ? ownedTmKey() : null;
      addItems(questCost(q), -1);
      if (tm) {
        addItems({ [tm]: 1 }, -1);
      }
      const r = q.rew;
      applyReward({ m: r.m, g: r.g, b: r.b });
      let extra = '';
      if (r.item) {
        if (PROFILE.items.includes(r.item)) {
          PROFILE.money += 2500;
        } else {
          PROFILE.items = [...PROFILE.items, r.item];
        }
        extra = ITEMS2[r.item].n;
      }
      if (r.ct) {
        const pool = tmKeys().filter(k => !bagN(k)),
          all = pool.length ? pool : tmKeys(),
          k = all[dailySeed('qo' + q.id) % all.length];
        PROFILE.bag[k] = Math.min(99, bagN(k) + 1);
        extra = (extra ? extra + ' + ' : '') + SHOP[k].n;
      }
      S.done[q.id] = 1;
      localStorage.setItem('res-quest-log', JSON.stringify(S));
      sfx('win');
      vibe(25);
      toast(`${q.giver} : merci ! ${extra || rewardText({ m: r.m, g: r.g, b: r.b })}`);
      savePurse();
      renderBag();
    },
    true
  );
  document.addEventListener(
    'click',
    e => {
      const b = e.target.closest && e.target.closest('[data-trophy-room]');
      if (!b || b.disabled) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      const T = TROPHIES.find(x => x.id === b.dataset.trophyRoom),
        S = trophyState();
      if (!T || S[T.id] || T.v() < T.n) {
        return;
      }
      S[T.id] = 1;
      localStorage.setItem('res-trophy-room', JSON.stringify(S));
      applyReward({ g: T.g });
      sfx('win');
      vibe(25);
      toast(`Trophée : +${T.g} Éclat${T.g > 1 ? 's' : ''}`);
      savePurse();
      renderBag();
    },
    true
  );
}
