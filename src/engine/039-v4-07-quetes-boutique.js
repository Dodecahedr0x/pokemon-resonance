/* Section d'origine : v4-07-quetes-boutique.js */

import { refreshQuetes } from '../screens/quetes/quetesStore.js';
import { refreshSac } from '../screens/sac/sacStore.js';
import { ELITE } from './022-15-systemes-objets-liens-ia.js';
import { ARENAS, BADGES } from './013-07-arenes.js';
import { PROFILE } from './011-05-etat-de-partie.js';
import { $, toast } from './014-08-outils.js';
import { queueSave } from './025-19-sauvegardes.js';
import { sfx, vibe } from './026-20-campagne-tutoriel-son.js';
import { SHOP, V4, bagN, clampI, countS, famOwned, maxLink } from './032-v4-00-socle.js';
import { renderWallet } from './035-v4-03-interface.js';
import { prixDe } from './049-v4-10-01-identite.js';

// Page Quêtes : src/screens/quetes ; page Sac et Boutique : src/screens/sac.
export let SQ, MAINQ;
export function __set_buy(v) { return (buy = v); }


function claim(id) {
  const q = SQ.find(x => x.id === id);
  if (!q || PROFILE.qc[id] || q.v() < q.n) return;
  PROFILE.qc[id] = 1;
  const r = q.r;
  if (r.money) PROFILE.money = Math.min(999999, PROFILE.money + r.money);
  if (r.gems) PROFILE.gems += r.gems;
  if (r.bag) for (const k in r.bag) PROFILE.bag[k] = Math.min(99, bagN(k) + r.bag[k]);
  sfx('win');
  vibe(30);
  toast(`Récompense reçue : ${q.t}`);
  queueSave();
  renderWallet();
  renderQuests();
}


// La page Quêtes est rendue par React (src/screens/quetes) : redessiner = la reconstruire.
export function renderQuests() {
  if (!$('#quetes')) return;
  refreshQuetes();
}


/* ---------- Sac et Boutique ---------- */
// La page Sac et Boutique est rendue par React (src/screens/sac) : redessiner = la reconstruire.
export function renderBag() {
  const pg = $('#sac');
  if (!pg) return;
  if (V4.sacV === 'sac' && V4.sacC === 'rares') V4.sacC = 'held';
  // habillage Boutique ou Sac (v4.73) : classes de la section, qui reste montée
  const boutique = V4.sacV !== 'sac';
  pg.classList.toggle('pk-mart', boutique);
  pg.classList.toggle('pk-bag', !boutique);
  refreshSac(boutique);
}


export function buy(k) {
  const it = SHOP[k],
    q = V4.qty[k] || 1;
  if (!it) return;
  const price = it.g ? it.g * q : prixDe(k) * q; // Atelier (v4.10)
  if (bagN(k) + q > 99 || ((it.cs || it.cle) && bagN(k))) return;
  if (it.g) {
    if (PROFILE.gems < price) return;
    PROFILE.gems -= price;
  } else {
    if (PROFILE.money < price) return;
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
}

// Instructions exécutées au démarrage, dans l'ordre d'origine (voir index.js).
export function __init() {

/* ---------- Quêtes : principales, secondaires, événement ---------- */
SQ = [
  { id: 'win3', t: 'Premiers pas', d: 'Gagnez 3 combats.', v: () => PROFILE.wins, n: 3, r: { money: 400 } },
  {
    id: 'cap1',
    t: 'Un compagnon sauvage',
    d: 'Capturez un Pokémon.',
    v: () => PROFILE.caught,
    n: 1,
    r: { bag: { poke: 3 } }
  },
  {
    id: 'evo5',
    t: 'Première Résonance',
    d: 'Éveillez 5 Pokémon en plein combat.',
    v: () => PROFILE.evos,
    n: 5,
    r: { bag: { potion: 2 } }
  },
  {
    id: 'rx20',
    t: 'Alchimiste',
    d: 'Déclenchez 20 réactions de types.',
    v: () => PROFILE.rx,
    n: 20,
    r: { money: 600 }
  },
  { id: 'rankS', t: 'Sans faute', d: 'Obtenez un rang S.', v: countS, n: 1, r: { gems: 5 } },
  {
    id: 'cap5',
    t: 'Chasseur des hautes herbes',
    d: 'Capturez 5 Pokémon.',
    v: () => PROFILE.caught,
    n: 5,
    r: { bag: { super: 2 } }
  },
  { id: 'dex10', t: 'Collectionneur', d: 'Réunissez 10 familles.', v: famOwned, n: 10, r: { money: 800 } },
  {
    id: 'ko40',
    t: 'Puissance brute',
    d: 'Mettez 40 Pokémon K.O.',
    v: () => PROFILE.kos,
    n: 40,
    r: { bag: { superpotion: 2 } }
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
    r: { bag: { master: 1 } }
  },
  { id: 'dex30', t: 'Pokédex complet', d: 'Réunissez les 30 familles.', v: famOwned, n: 30, r: { gems: 30 } }
];


MAINQ = () => ['tuto', ...ARENAS.map(a => a.k), ...ELITE, 'champ'];


document.addEventListener('click', e => {
  const t = e.target.closest('[data-qtab]');
  if (t) {
    V4.qTab = t.dataset.qtab;
    renderQuests();
    return;
  }
  const c = e.target.closest('[data-claim]');
  if (c) claim(c.dataset.claim);
});


document.addEventListener('click', e => {
  const a = e.target.closest('[data-sacv]');
  if (a) {
    V4.sacV = a.dataset.sacv;
    renderBag();
    return;
  }
  const c = e.target.closest('[data-sacc]');
  if (c) {
    V4.sacC = c.dataset.sacc;
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
  if (b) buy(b.dataset.buy);
});
}
