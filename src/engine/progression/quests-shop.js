import { refreshQuests } from '../../screens/quests/questsStore.js';
import { refreshBag } from '../../screens/bag/bagStore.js';
import { ELITE } from '../combat/items-bonds-ai.js';
import { ARENAS, BADGES } from '../modes/gyms.js';
import { PROFILE } from '../state/game-state.js';
import { $, toast } from '../core/utils.js';
import { hook } from '../core/hooks.js';
import { queueSave } from '../state/saves.js';
import { sfx, vibrate } from '../audio/sound-effects.js';
import { SHOP, bagCount, clampInt } from '../state/economy.js';
import { SCREEN_STATE } from '../ui/screen-state.js';
import { countSRanks, familyOwned, maxLink } from './trainer-stats.js';
import { renderWallet } from '../ui/wallet.js';
import { costOf } from './base-camp.js';

// Quests page: src/screens/quests; Bag and Shop page: src/screens/bag.
export let SIDE_QUESTS;

function claim(id) {
  const q = SIDE_QUESTS.find(x => x.id === id);
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
      PROFILE.bag[k] = Math.min(99, bagCount(k) + r.bag[k]);
    }
  }
  sfx('win');
  vibrate(30);
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
  if (SCREEN_STATE.bagView === 'sac' && SCREEN_STATE.bagCategory === 'rares') {
    SCREEN_STATE.bagCategory = 'held';
  }
  // Shop or Bag styling (v4.73): classes of the section, which stays mounted
  const shop = SCREEN_STATE.bagView !== 'sac';
  pg.classList.toggle('is-shop', shop);
  pg.classList.toggle('is-bag', !shop);
  refreshBag(shop);
}

export function buyShopItem(k) {
  const it = SHOP[k],
    q = SCREEN_STATE.qty[k] || 1;
  if (!it) {
    return;
  }
  const price = it.g ? it.g * q : costOf(k) * q; // Workshop (v4.10)
  if (bagCount(k) + q > 99 || ((it.cs || it.keyItem) && bagCount(k))) {
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
  PROFILE.bag[k] = bagCount(k) + q;
  SCREEN_STATE.qty[k] = 1;
  sfx('ui');
  vibrate(15);
  toast(`Acheté : ${q} × ${it.n}`);
  queueSave();
  renderWallet();
  renderBag();
  if (PROFILE.money + ':' + PROFILE.gems !== previous) {
    hook('purchase');
  }
}

export const mainQuestSteps = () => ['tuto', ...ARENAS.map(a => a.k), ...ELITE, 'champ'];

// Statements run at startup, in the original order (see index.js).
export function init() {
  /* ---------- Quests: main, side, event ---------- */
  SIDE_QUESTS = [
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
    { id: 'rankS', t: 'Sans faute', d: 'Obtenez un rang S.', v: countSRanks, n: 1, r: { gems: 5 } },
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
    {
      id: 'rankS5',
      t: 'Perfectionniste',
      d: 'Obtenez le rang S sur 5 terrains.',
      v: countSRanks,
      n: 5,
      r: { gems: 15 },
    },
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
      SCREEN_STATE.questTab = t.dataset.qtab;
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
      SCREEN_STATE.bagView = a.dataset.sacv;
      renderBag();
      return;
    }
    const c = e.target.closest('[data-sacc]');
    if (c) {
      SCREEN_STATE.bagCategory = c.dataset.sacc;
      renderBag();
      return;
    }
    const q = e.target.closest('[data-qk]');
    if (q) {
      const k = q.dataset.qk;
      SCREEN_STATE.qty[k] = clampInt((SCREEN_STATE.qty[k] || 1) + +q.dataset.qd, 1, 10);
      renderBag();
      return;
    }
    const b = e.target.closest('[data-buy]');
    if (b) {
      buyShopItem(b.dataset.buy);
    }
  });
}
