/* Peddler, route encounters, Pokédex missions (added in v4.54). */

import { ITEMS2, PROFILE } from '../state/game-state.js';
import { writeLS, mulberry32, toast } from '../core/utils.js';
import { HOOKS, hook } from '../core/hooks.js';
import { sfx, vibrate } from '../audio/sound-effects.js';
import { overlay } from '../progression/prestige.js';
import { shut, updateTemp } from '../../screens/overlays/tempStore.js';
import { SHOP, bagCount, formatNumber, savePurse, today } from '../state/economy.js';
import { ownedFam } from '../progression/trainer-stats.js';
import { refreshMap } from '../../screens/map/mapStore.js';
import { DEX_SPECIES } from '../progression/pokedex.js';
import { refreshDex } from '../../screens/dex/dexStore.js';
import { renderBag } from '../progression/quests-shop.js';
import { costOf0 } from '../progression/base-camp.js';
import { HELD_SHOP, heldItemCost } from '../combat/resonance.js';
import { dailySeed } from './pokegear.js';

export function todaysPeddler() {
  const d = today(),
    r = seededRng('ambu'),
    present = dailySeed('ambu7') % 7 < 4;
  const keyList = Object.keys(SHOP).filter(
    k =>
      !SHOP[k].g &&
      !SHOP[k].cs &&
      !SHOP[k].keyItem &&
      k !== 'master' &&
      ['balls', 'soins', 'combat'].includes(SHOP[k].category)
  );
  const pick = [];
  const pool = keyList.slice();
  while (pick.length < 3 && pool.length) {
    pick.push(pool.splice(Math.floor(r() * pool.length), 1)[0]);
  }
  const cts = Object.keys(SHOP).filter(k => SHOP[k].category === 'machines' && !SHOP[k].cs && !SHOP[k].g);
  if (cts.length) {
    pick.push(cts[Math.floor(r() * cts.length)]);
  }
  const held = Object.keys(HELD_SHOP).filter(k => !HELD_SHOP[k].g && !PROFILE.items.includes(k));
  const th = held.length ? held[Math.floor(r() * held.length)] : null;
  const st = loadDailyState('res-wanderer', d) || { d, got: {} };
  return { present, displayName: MERCHANT_NAMES[dailySeed('ambunom') % MERCHANT_NAMES.length], pick, th, st };
}

// Shop › Peddler: rendered by React (src/screens/bag/Peddler.jsx)

export function routeEvent() {
  const d = today(),
    i = dailySeed('routeEvent') % ROUTE_EVENTS.length,
    st = loadDailyState('res-route-event', d) || { d, done: false };
  return HOOKS.routeEncounter.reduce((r, f) => f(r), { E: ROUTE_EVENTS[i], i, st });
}

function openRouteEvent() {
  const { E, st } = routeEvent();
  if (st.done) {
    return;
  }
  const c = E.c.map(choice => {
    const eff = [
      choice.cost ? 'Coût : ' + rewardText(choice.cost) : '',
      choice.p && choice.p < 1 ? `${Math.round(choice.p * 100)} % de réussite` : '',
    ]
      .filter(Boolean)
      .join(' · ');
    return { l: choice.l, ok: canAfford(choice.cost), eff: eff || null };
  });
  // rendered by src/screens/overlays/transients/Windows.jsx (RouteEncounter)
  const o = overlay('event-choice', { t: E.t, x: E.x, c, res: null });
  o.addEventListener('click', e => {
    if (e.target === o) {
      shut('event-choice');
    }
  });
}

export function pickRouteChoice(j) {
  for (const f of HOOKS.beforeRouteChoice) {
    if (f(j)) {
      return;
    }
  }
  resolveChoice(j);
  hook('routeChoice', j);
}

function resolveChoice(j) {
  const { E, st } = routeEvent(),
    c = E.c[j];
  if (!c || st.done || !canAfford(c.cost)) {
    return;
  }
  applyReward(c.cost);
  let issue = 'ok';
  if (c.p && c.p < 1) {
    issue = seededRng('routeEventR' + j)() < c.p ? 'ok' : 'ko';
  }
  const g = issue === 'ok' ? c.ok : c.ko,
    t = (issue === 'ok' ? c.successText : c.failText) || (c.cost ? 'Affaire conclue.' : 'Vous poursuivez votre route.');
  if (g) {
    applyReward(g);
  }
  const res = t + (g && rewardText(g) ? ' (' + rewardText(g) + ')' : '');
  writeLS('res-route-event', { d: st.d, done: true, res });
  sfx(issue === 'ok' ? 'ui' : 'hit');
  vibrate(issue === 'ok' ? 20 : 40);
  savePurse();
  updateTemp('event-choice', { res: { ok: issue === 'ok', txt: res } });
  refreshMap(); // "Rencontre sur la route" (Route encounter) banner (#routeEvent, src/screens/map/EvBar.jsx)
}

export function weekKey() {
  const t = new Date(today() + 'T00:00:00Z'),
    j = Math.floor(t.getTime() / 86400000 + 3);
  return 'w' + Math.floor(j / 7);
}

export function missionState() {
  let s;
  try {
    s = JSON.parse(localStorage.getItem('res-dex-mission') || '{}');
  } catch (e) {
    s = {};
  }
  s.pal = s.pal || {};
  s.ty = s.ty || {};
  return s;
}

export function typeProgress() {
  const cnt = {};
  DEX_SPECIES.forEach(m => {
    (m.t || []).forEach(t => {
      cnt[t] = cnt[t] || { tot: 0, own: 0 };
      cnt[t].tot++;
      if (ownedFam(m.id)) {
        cnt[t].own++;
      }
    });
  });
  const ts = Object.keys(cnt)
    .filter(t => cnt[t].tot >= 4)
    .sort();
  const w = weekKey();
  let h = 7;
  for (const ch of w) {
    h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  }
  const a = ts[h % ts.length],
    b = ts[(h * 7 + 3) % ts.length];
  return [a, b === a ? ts[(h + 1) % ts.length] : b].map(t => ({ t, n: Math.min(4, cnt[t].tot), own: cnt[t].own }));
}

const loadDailyState = (k, d) => {
  let s;
  try {
    s = JSON.parse(localStorage.getItem(k) || 'null');
  } catch (e) {
    s = null;
  }
  return s && s.d === d ? s : null;
};

export const seededRng = sel => mulberry32(dailySeed(sel) || 1);

export const applyReward = (o, _t) => {
  /* applies a gain/cost {m,g,b:{k:n}} */
  if (!o) {
    return;
  }
  if (o.m) {
    PROFILE.money = Math.max(0, PROFILE.money + o.m);
  }
  if (o.g) {
    PROFILE.gems = Math.max(0, PROFILE.gems + o.g);
  }
  if (o.b) {
    for (const k in o.b) {
      PROFILE.bag[k] = Math.max(0, bagCount(k) + o.b[k]);
    }
  }
};

export const canAfford = c => {
  if (!c) {
    return true;
  }
  if (c.m && PROFILE.money + c.m < 0) {
    return false;
  }
  if (c.g && PROFILE.gems + c.g < 0) {
    return false;
  }
  if (c.b) {
    for (const k in c.b) {
      if (bagCount(k) + c.b[k] < 0) {
        return false;
      }
    }
  }
  return true;
};

export const rewardText = o => {
  if (!o) {
    return '';
  }
  const a = [];
  if (o.m) {
    a.push(`${o.m > 0 ? '+' : '−'}${formatNumber(Math.abs(o.m))} ₽`);
  }
  if (o.g) {
    a.push(`${o.g > 0 ? '+' : '−'}${Math.abs(o.g)} Éclat${Math.abs(o.g) > 1 ? 's' : ''}`);
  }
  if (o.b) {
    for (const k in o.b) {
      a.push(`${o.b[k] > 0 ? '+' : '−'}${Math.abs(o.b[k])} ${SHOP[k] ? SHOP[k].n : k}`);
    }
  }
  return a.join(', ');
};

/* ---------- 1. peddler ---------- */
const MERCHANT_NAMES = ['Basile', 'Maëlle', 'Hugo', 'Iris', 'Gaspard', 'Solène', 'Théo'];

/* ---------- 2. route encounters ---------- */
const ROUTE_EVENTS = [
  {
    t: 'Un vieux pêcheur',
    x: 'Un pêcheur peine à remonter ses filets sur la rive.',
    c: [
      {
        l: 'L’aider à tirer',
        p: 0.75,
        ok: { m: 400 },
        successText: 'Belle prise ! Il partage ses gains.',
        ko: {},
        failText: 'Rien que des algues, mais il vous remercie.',
      },
      {
        l: 'Acheter ses prises',
        cost: { m: -300 },
        ok: { b: { potion: 2 } },
        successText: 'Il vous glisse 2 Potions dans un panier.',
      },
      { l: 'Passer son chemin' },
    ],
  },
  {
    t: 'Une pierre qui brille',
    x: 'Un éclat de lumière sort d’un rocher fissuré.',
    c: [
      {
        l: 'Creuser',
        p: 0.5,
        ok: { g: 2 },
        successText: 'Deux Éclats de Résonance sortent de la roche !',
        ko: { m: -200 },
        failText: 'Votre pioche improvisée casse. Il faut la remplacer.',
      },
      { l: 'Laisser en place' },
    ],
  },
  {
    t: 'Un dresseur épuisé',
    x: 'Son Pokémon n’a plus de forces et il n’a rien pour le soigner.',
    c: [
      {
        l: 'Donner une Potion',
        cost: { b: { potion: -1 } },
        ok: { g: 1, m: 300 },
        successText: 'Il vous remercie avec un Éclat et un peu d’argent.',
      },
      { l: 'Lui souhaiter bon courage' },
    ],
  },
  {
    t: 'Un troc',
    x: 'Un randonneur échange volontiers des Balls, si vous êtes d’accord.',
    c: [
      {
        l: 'Poké Ball contre Super Ball',
        cost: { b: { poke: -1 } },
        ok: { b: { super: 1 } },
        successText: 'L’échange est conclu.',
      },
      { l: 'Refuser poliment' },
    ],
  },
  {
    t: 'Un orage approche',
    x: 'Le ciel noircit. Un abri est tout près, mais un éclat luit dans le champ.',
    c: [
      {
        l: 'Courir jusqu’à l’éclat',
        p: 0.6,
        ok: { g: 3 },
        successText: 'Vous l’attrapez juste avant l’averse : 3 Éclats !',
        ko: { m: -300 },
        failText: 'Glissade dans la boue : une poche est déchirée.',
      },
      { l: 'S’abriter' },
    ],
  },
  {
    t: 'Un voyageur mystérieux',
    x: 'Il sort une pièce d’un air amusé : pile ou face ?',
    c: [
      {
        l: 'Jouer 200 ₽',
        cost: { m: -200 },
        p: 0.5,
        ok: { m: 400 },
        successText: 'Gagné ! Il double la mise.',
        ko: {},
        failText: 'Perdu. Il rit et s’éloigne.',
      },
      { l: 'Écouter son histoire', ok: { g: 1 }, successText: 'Il vous laisse un Éclat pour votre patience.' },
      { l: 'Refuser' },
    ],
  },
  {
    t: 'Un nid abandonné',
    x: 'Un nid vide contient des baies et quelques objets.',
    c: [
      { l: 'Fouiller le nid', ok: { b: { poke: 3 } }, successText: 'Trois Poké Balls oubliées par un dresseur !' },
      { l: 'Laisser en paix', ok: { g: 1 }, successText: 'Un Pokémon vous observe, puis dépose un Éclat à vos pieds.' },
    ],
  },
  {
    t: 'Un pique-nique',
    x: 'Un couple de promeneurs vous invite à partager leur repas.',
    c: [
      {
        l: 'Offrir une Potion',
        cost: { b: { potion: -1 } },
        ok: { m: 600 },
        successText: 'Ils insistent pour vous dédommager.',
      },
      { l: 'Partager un moment', ok: { m: 100 }, successText: 'Une bonne pause, et une petite pièce en cadeau.' },
    ],
  },
];

/* ---------- 3. Pokédex missions ---------- */
export const MISSION_TIERS = [
  [5, { m: 500 }],
  [10, { g: 1 }],
  [20, { m: 1500 }],
  [35, { g: 2 }],
  [50, { m: 3000 }],
  [75, { g: 3 }],
  [100, { m: 5000 }],
  [119, { g: 5 }],
];

function onWandererClick(e) {
  const b = e.target.closest && e.target.closest('[data-wanderer]');
  if (!b) {
    return;
  }
  e.preventDefault();
  e.stopPropagation();
  const A = todaysPeddler(),
    k = b.dataset.wanderer;
  if (!A.present) {
    return;
  }
  if (k.startsWith('h:')) {
    const h = k.slice(2);
    if (h !== A.th || A.st.got[k]) {
      return;
    }
    const px = Math.round((heldItemCost(h) * 0.8) / 50) * 50;
    if (PROFILE.money < px) {
      return;
    }
    PROFILE.money -= px;
    PROFILE.items.push(h);
    A.st.got[k] = 1;
    toast(`Acheté : ${ITEMS2[h].n}. Confiez-le depuis la fiche d’un Pokémon.`);
  } else {
    if (!A.pick.includes(k) || (A.st.got[k] || 0) >= (SHOP[k].mv ? 1 : 3) || bagCount(k) >= 99) {
      return;
    }
    const px = Math.max(50, Math.round((costOf0(k) * 0.75) / 50) * 50);
    if (PROFILE.money < px) {
      return;
    }
    PROFILE.money -= px;
    PROFILE.bag[k] = bagCount(k) + 1;
    A.st.got[k] = (A.st.got[k] || 0) + 1;
    toast(`Acheté : 1 × ${SHOP[k].n}`);
  }
  writeLS('res-wanderer', A.st);
  sfx('ui');
  vibrate(15);
  savePurse();
  renderBag();
}

function onDexMissionClick(e) {
  const b = e.target.closest && e.target.closest('[data-dex-mission]');
  if (!b || b.disabled) {
    return;
  }
  const S = missionState(),
    [k, v] = b.dataset.dexMission.split(':');
  if (k === 'p') {
    const p = MISSION_TIERS.find(x => x[0] === +v);
    if (!p || S.pal[v] || DEX_SPECIES.filter(m => ownedFam(m.id)).length < p[0]) {
      return;
    }
    S.pal[v] = 1;
    applyReward(p[1]);
    toast('Mission accomplie : ' + rewardText(p[1]));
  } else {
    const t = typeProgress().find(x => x.t === v);
    if (!t || t.own < t.n || S.ty[weekKey() + v]) {
      return;
    }
    S.ty[weekKey() + v] = 1;
    applyReward({ g: 1 });
    toast('Spécialiste ' + v + ' : +1 Éclat');
  }
  writeLS('res-dex-mission', S);
  sfx('ui');
  vibrate(20);
  savePurse();
  refreshDex(); // missions (#dexMission) rendered by React: src/screens/dex/Missions.jsx
}

// Statements run at startup, in the original order (see index.js).
export function init() {
  document.addEventListener('click', onWandererClick, true);

  document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('[data-route-event]');
    if (!b) {
      return;
    }
    const v = b.dataset.routeEvent;
    if (v === 'open') {
      openRouteEvent();
    } else if (v === 'close') {
      shut('event-choice');
    } else {
      pickRouteChoice(+v);
    }
  });

  document.addEventListener('click', onDexMissionClick);
}
