/* Original section: v4-07-quests-shop.js */

import { refreshQuests } from '../screens/quests/questsStore.js';
import { refreshBag } from '../screens/bag/bagStore.js';
import { ELITE } from './022-items-bonds-ai.js';
import { ARENAS, BADGES } from './013-gyms.js';
import { PROFILE } from './011-game-state.js';
import { $, toast } from './014-utils.js';
import { hook } from './015-hooks.js';
import { queueSave } from './025-saves.js';
import { sfx, vibe } from './026-campaign-tutorial-sound.js';
import { SHOP, V4, bagN, clampI, countS, familyOwned, maxLink } from './032-v4-foundation.js';
import { renderWallet } from './035-interface.js';
import { costOf } from './049-identity.js';

// Quests page: src/screens/quests; Bag and Shop page: src/screens/bag.
export let SQ;

function claim(id) {
  const q = SQ.find(x => x.id === id);
  if (!q || PROFILE.qc[id] || q.v() < q.n) {
    return;
  }
  PROFILE.qc[id] = 1;
  const r = q.r;
  if (r.money) {
    PROFILE.money = Math.min(999999, PROFILE.money + r.money);
  }
  if (r.gems) {
    PROFILE.gems += r.gems;
  }
  if (r.bag) {
    for (const k in r.bag) {
      PROFILE.bag[k] = Math.min(99, bagN(k) + r.bag[k]);
    }
  }
  sfx('win');
  vibe(30);
  toast(`Récompense reçue : ${q.t}`);
  queueSave();
  renderWallet();
  renderQuests();
}

// The Quests page is rendered by React (src/screens/quests): redrawing = rebuilding it.
export function renderQuests() {
  if (!$('#quetes')) {
    return;
  }
  refreshQuests();
}

/* ---------- Bag and Shop ---------- */
// The Bag and Shop page is rendered by React (src/screens/bag): redrawing = rebuilding it.
export function renderBag() {
  const pg = $('#sac');
  if (!pg) {
    return;
  }
  if (V4.bagView === 'sac' && V4.bagCategory === 'rares') {
    V4.bagCategory = 'held';
  }
  // Shop or Bag styling (v4.73): classes of the section, which stays mounted
  const shop = V4.bagView !== 'sac';
  pg.classList.toggle('pk-mart', shop);
  pg.classList.toggle('pk-bag', !shop);
  refreshBag(shop);
}

export function buy(k) {
  const it = SHOP[k],
    q = V4.qty[k] || 1;
  if (!it) {
    return;
  }
  const price = it.g ? it.g * q : costOf(k) * q; // Workshop (v4.10)
  if (bagN(k) + q > 99 || ((it.cs || it.keyItem) && bagN(k))) {
    return;
  }
  const previous = PROFILE.money + ':' + PROFILE.gems;
  if (it.g) {
    if (PROFILE.gems < price) {
      return;
    }
    PROFILE.gems -= price;
  } else {
    if (PROFILE.money < price) {
      return;
    }
    PROFILE.money -= price;
  }
  PROFILE.bag[k] = bagN(k) + q;
  V4.qty[k] = 1;
  sfx('ui');
  vibe(15);
  toast(`Acheté : ${q} × ${it.n}`);
  queueSave();
  renderWallet();
  renderBag();
  if (PROFILE.money + ':' + PROFILE.gems !== previous) {
    hook('purchase');
  }
}

export const MAINQ = () => ['tuto', ...ARENAS.map(a => a.k), ...ELITE, 'champ'];

// Statements run at startup, in the original order (see index.js).
export function __init() {
  /* ---------- Quests: main, side, event ---------- */
  SQ = [
    { id: 'win3', t: 'Premiers pas', d: 'Gagnez 3 combats.', v: () => PROFILE.wins, n: 3, r: { money: 400 } },
    {
      id: 'cap1',
      t: 'Un compagnon sauvage',
      d: 'Capturez un Pokémon.',
      v: () => PROFILE.caught,
      n: 1,
      r: { bag: { poke: 3 } },
    },
    {
      id: 'evo5',
      t: 'Première Résonance',
      d: 'Éveillez 5 Pokémon en plein combat.',
      v: () => PROFILE.awakenings,
      n: 5,
      r: { bag: { potion: 2 } },
    },
    {
      id: 'rx20',
      t: 'Alchimiste',
      d: 'Déclenchez 20 réactions de types.',
      v: () => PROFILE.rx,
      n: 20,
      r: { money: 600 },
    },
    { id: 'rankS', t: 'Sans faute', d: 'Obtenez un rang S.', v: countS, n: 1, r: { gems: 5 } },
    {
      id: 'cap5',
      t: 'Chasseur des hautes herbes',
      d: 'Capturez 5 Pokémon.',
      v: () => PROFILE.caught,
      n: 5,
      r: { bag: { super: 2 } },
    },
    { id: 'dex10', t: 'Collectionneur', d: 'Réunissez 10 familles.', v: familyOwned, n: 10, r: { money: 800 } },
    {
      id: 'ko40',
      t: 'Puissance brute',
      d: 'Mettez 40 Pokémon K.O.',
      v: () => PROFILE.kos,
      n: 40,
      r: { bag: { superpotion: 2 } },
    },
    { id: 'link3', t: 'Lien Duo', d: 'Amenez deux Pokémon au palier Duo.', v: maxLink, n: 3, r: { gems: 10 } },
    { id: 'badge4', t: 'Mi-parcours', d: 'Obtenez 4 badges.', v: () => BADGES.length, n: 4, r: { bag: { hyper: 2 } } },
    { id: 'win15', t: 'Vétéran', d: 'Gagnez 15 combats.', v: () => PROFILE.wins, n: 15, r: { money: 1500 } },
    { id: 'rankS5', t: 'Perfectionniste', d: 'Obtenez le rang S sur 5 terrains.', v: countS, n: 5, r: { gems: 15 } },
    {
      id: 'badge8',
      t: 'Huit badges',
      d: 'Obtenez les 8 badges.',
      v: () => BADGES.length,
      n: 8,
      r: { bag: { master: 1 } },
    },
    { id: 'dex30', t: 'Pokédex complet', d: 'Réunissez les 30 familles.', v: familyOwned, n: 30, r: { gems: 30 } },
  ];

  document.addEventListener('click', e => {
    const t = e.target.closest('[data-qtab]');
    if (t) {
      V4.questTab = t.dataset.qtab;
      renderQuests();
      return;
    }
    const c = e.target.closest('[data-claim]');
    if (c) {
      claim(c.dataset.claim);
    }
  });

  document.addEventListener('click', e => {
    const a = e.target.closest('[data-sacv]');
    if (a) {
      V4.bagView = a.dataset.sacv;
      renderBag();
      return;
    }
    const c = e.target.closest('[data-sacc]');
    if (c) {
      V4.bagCategory = c.dataset.sacc;
      renderBag();
      return;
    }
    const q = e.target.closest('[data-qk]');
    if (q) {
      const k = q.dataset.qk;
      V4.qty[k] = clampI((V4.qty[k] || 1) + +q.dataset.qd, 1, 10);
      renderBag();
      return;
    }
    const b = e.target.closest('[data-buy]');
    if (b) {
      buy(b.dataset.buy);
    }
  });
}
