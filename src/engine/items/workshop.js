/* Workshop, recipes, orders, draw, showcase, daily gift (added in v4.57). */

import { ITEMS2, PROFILE } from '../state/game-state.js';
import { writeLS, toast } from '../core/utils.js';
import { sfx, vibrate } from '../audio/sound-effects.js';
import { SHOP, bagCount, savePurse, today } from '../state/economy.js';
import { refreshHome } from '../../screens/home/homeStore.js';
import { renderBag } from '../progression/quests-shop.js';
import { applyReward, seededRng, rewardText } from '../world/route-events.js';

export { loadToday, RECIPES, FUSION_COST }; // read by Shop › Workshop and Draw (React, src/screens/bag/Workshop.jsx)

/* ---------- TM fusion ---------- */
export function fusionDonors(target) {
  const d = [];
  tmKeys()
    .filter(k => k !== target && bagCount(k) > 0)
    .sort((a, b) => SHOP[a].p - SHOP[b].p)
    .forEach(k => {
      for (let i = 0; i < bagCount(k) && d.length < 2; i++) {
        d.push(k);
      }
    });
  return d.length === 2 ? d : null;
}

export function tmFusionTargets() {
  const r = seededRng('tm-fusion'),
    pool = tmKeys().filter(k => !bagCount(k)),
    out = [];
  while (out.length < 4 && pool.length) {
    out.push(pool.splice(Math.floor(r() * pool.length), 1)[0]);
  }
  return out;
}

/* ---------- daily orders ---------- */
export function dailyOrders() {
  const r = seededRng('daily-orders'),
    pool = ['potion', 'poke', 'super', 'antidote', 'antigel', 'baieoran', 'superpotion'],
    a = pool.splice(Math.floor(r() * pool.length), 1)[0],
    b = pool.splice(Math.floor(r() * pool.length), 1)[0],
    st = loadToday('res-craft-bench', { d: today(), cmd: {}, spin: 0 });
  return [
    { id: 'c1', in: { [a]: 2 + Math.floor(r() * 2) }, rew: { g: 1 } },
    { id: 'c2', in: { [b]: 3 }, rew: { m: 900 } },
  ].map(c => ({ ...c, done: !!st.cmd[c.id] }));
}

function dailySpin() {
  const st = loadToday('res-craft-bench', { d: today(), cmd: {}, spin: 0 });
  if (st.spin >= 4) {
    return;
  }
  if (st.spin > 0) {
    if (PROFILE.money < FUSION_COST) {
      return;
    }
    PROFILE.money -= FUSION_COST;
  }
  const r = seededRng('dailySpin' + st.spin)();
  const tot = SPIN_PRIZES.reduce((a, l) => a + l.w, 0);
  let x = r * tot,
    lot = SPIN_PRIZES[0];
  for (const l of SPIN_PRIZES) {
    if ((x -= l.w) < 0) {
      lot = l;
      break;
    }
  }
  let t = lot.t;
  if (lot.ct) {
    const cts = tmKeys(),
      k = cts[Math.floor(seededRng('daily-spin-tm' + st.spin)() * cts.length)];
    PROFILE.bag[k] = Math.min(99, bagCount(k) + 1);
    t = SHOP[k].n;
  } else {
    applyReward(lot.o);
  }
  st.spin++;
  st.last = t;
  writeLS('res-craft-bench', st);
  sfx('win');
  vibrate(25);
  toast('Tirage : ' + t);
  savePurse();
}

/* ---------- showcase (displayed by React: src/screens/bag/Workshop.jsx) ---------- */
// Marks the TMs / HMs in the Bag or already learned as seen, then returns the showcase state.
export function tmShowcase() {
  let seen;
  try {
    seen = JSON.parse(localStorage.getItem('res-tm-showcase') || '{}');
  } catch (e) {
    seen = {};
  }
  const learned = Object.values((PROFILE.ct && PROFILE.ct.learnedTms) || {});
  const cts = tmKeys(),
    cs = Object.keys(SHOP).filter(k => SHOP[k].cs);
  [...cts, ...cs].forEach(k => {
    if (bagCount(k) > 0 || learned.includes(SHOP[k].mv)) {
      seen[k] = 1;
    }
  });
  writeLS('res-tm-showcase', seen);
  return { seen, tms: cts, cs };
}

/* ---------- Shop tabs (Workshop, Draw…): rendered by React (src/screens/bag/Workshop.jsx) ---------- */

function yesterdayDate() {
  const t = new Date(today() + 'T12:00:00Z');
  t.setUTCDate(t.getUTCDate() - 1);
  return t.toISOString().slice(0, 10);
}

export function dailyGiftState() {
  let s;
  try {
    s = JSON.parse(localStorage.getItem('res-dailygift') || '{}');
  } catch (e) {
    s = {};
  }
  s.n = s.n || 0;
  if (s.last && s.last !== today() && s.last !== yesterdayDate()) {
    s.n = 0;
  }
  return s;
}

/** "Cadeau du jour" (Daily gift) button on the Home screen (#dailygift, rendered by src/screens/home/Banners.jsx). */
export function dailyGiftData() {
  const s = dailyGiftState(),
    doneFlag = s.last === today(),
    j = doneFlag ? Math.max(0, s.n - 1) % 7 : s.n % 7,
    R = DAILY_GIFTS[j],
    txt = [rewardText(R), R.ct ? '1 CT' : ''].filter(Boolean).join(' + ');
  return { fait: doneFlag, j, txt };
}

const loadToday = (k, d) => {
  let s;
  try {
    s = JSON.parse(localStorage.getItem(k) || 'null');
  } catch (e) {
    s = null;
  }
  return s && s.d === today() ? s : d;
};

const itemName = k => (SHOP[k] ? SHOP[k].n : (ITEMS2[k] || {}).n || k);

export const tmKeys = () => Object.keys(SHOP).filter(k => SHOP[k].category === 'machines' && !SHOP[k].cs && !SHOP[k].g);

export const ingredientsText = o =>
  Object.keys(o)
    .map(k => `${o[k]} × ${itemName(k)}`)
    .join(' + ');

export const addItems = (o, direction) => {
  for (const k in o) {
    PROFILE.bag[k] = Math.max(0, Math.min(99, bagCount(k) + direction * o[k]));
    if (!PROFILE.bag[k]) {
      delete PROFILE.bag[k];
    }
  }
};

export const hasIngredients = o => Object.keys(o).every(k => bagCount(k) >= o[k]);

/* ---------- recipe book ---------- */
const RECIPES = [
  { id: 'r1', in: { potion: 3 }, out: { superpotion: 1 }, m: 0 },
  { id: 'r2', in: { superpotion: 3 }, out: { hyperpotion: 1 }, m: 200 },
  { id: 'r3', in: { poke: 3 }, out: { super: 1 }, m: 200 },
  { id: 'r4', in: { super: 3 }, out: { hyper: 1 }, m: 400 },
  { id: 'r5', in: { antigel: 2, antidote: 2 }, out: { totalsoin: 1 }, m: 0 },
  { id: 'r6', in: { baieoran: 3 }, out: { baiemepo: 1 }, m: 0 },
  { id: 'r7', in: { attaqueplus: 2, defenseplus: 2 }, out: { gelee: 1 }, m: 500 },
  { id: 'r8', in: { rappel: 2 }, out: { rappelmax: 1 }, m: 1000 },
];

/* ---------- peddler's draw ---------- */
const SPIN_PRIZES = [
  { w: 25, t: 'Poké Ball × 3', o: { b: { poke: 3 } } },
  { w: 22, t: 'Potion × 2', o: { b: { potion: 2 } } },
  { w: 14, t: 'Super Ball', o: { b: { super: 1 } } },
  { w: 10, t: 'Antigel et Antidote', o: { b: { antigel: 1, antidote: 1 } } },
  { w: 10, t: '400 ₽', o: { m: 400 } },
  { w: 6, t: 'Hyper Potion', o: { b: { hyperpotion: 1 } } },
  { w: 6, t: '1 Éclat de Résonance', o: { g: 1 } },
  { w: 4, t: 'Une CT au hasard', ct: 1 },
  { w: 3, t: 'Baie Mepo', o: { b: { baiemepo: 1 } } },
];

const FUSION_COST = 900;

/* ---------- daily gift ---------- */
const DAILY_GIFTS = [
  { m: 300, b: { potion: 1 } },
  { b: { poke: 2 } },
  { m: 800 },
  { g: 1 },
  { b: { super: 2, hyperpotion: 1 } },
  { m: 1500 },
  { g: 3, ct: 1 },
];

function onWorkshopClick(e) {
  const b = e.target.closest && e.target.closest('[data-craft-bench]');
  if (!b || b.disabled) {
    return;
  }
  e.preventDefault();
  e.stopPropagation();
  const [a, k] = b.dataset.craftBench.split(':');
  if (a === 'rec') {
    const r = RECIPES.find(x => x.id === k);
    if (!r || !hasIngredients(r.in) || PROFILE.money < r.m) {
      return;
    }
    addItems(r.in, -1);
    PROFILE.money -= r.m;
    addItems(r.out, 1);
    toast('Préparé : ' + ingredientsText(r.out));
  } else if (a === 'fus') {
    const d = fusionDonors(k);
    if (!tmKeys().includes(k) || bagCount(k) || !d || PROFILE.money < 1000) {
      return;
    }
    d.forEach(x => addItems({ [x]: 1 }, -1));
    PROFILE.money -= 1000;
    PROFILE.bag[k] = 1;
    toast('Fusion réussie : ' + SHOP[k].n);
  } else if (a === 'cmd') {
    const c = dailyOrders().find(x => x.id === k),
      st = loadToday('res-craft-bench', { d: today(), cmd: {}, spin: 0 });
    if (!c || c.done || !hasIngredients(c.in)) {
      return;
    }
    addItems(c.in, -1);
    applyReward(c.rew);
    st.cmd[k] = 1;
    writeLS('res-craft-bench', st);
    toast('Commande livrée : ' + rewardText(c.rew));
  } else if (a === 'spin') {
    dailySpin();
    renderBag();
    return;
  } else {
    return;
  }
  sfx('ui');
  vibrate(15);
  savePurse();
  renderBag();
}

// Instructions run at startup, in the original order (see index.js).
export function init() {
  document.addEventListener('click', onWorkshopClick, true);

  document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('[data-dailygift]');
    if (!b) {
      return;
    }
    const s = dailyGiftState();
    if (s.last === today()) {
      return;
    }
    const R = DAILY_GIFTS[s.n % 7];
    applyReward(R);
    let extra = '';
    if (R.ct) {
      const cts = tmKeys(),
        k = cts[Math.floor(seededRng('daily-gift-tm')() * cts.length)];
      PROFILE.bag[k] = Math.min(99, bagCount(k) + 1);
      extra = ' + ' + SHOP[k].n;
    }
    s.n++;
    s.last = today();
    writeLS('res-dailygift', s);
    sfx('win');
    vibrate(25);
    toast('Cadeau du jour : ' + rewardText(R) + extra);
    savePurse();
    refreshHome(); // #dailygift button
  });
}
