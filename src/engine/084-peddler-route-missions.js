/* Original section: 4.54: peddler, route encounters, Pokédex missions */

import { ITEMS2, PROFILE } from './011-game-state.js';
import { writeLS, mulberry32, toast } from './014-utils.js';
import { HOOKS, hook } from './015-hooks.js';
import { sfx, vibe } from './026-campaign-tutorial-sound.js';
import { overlay } from './030-prestige-staging.js';
import { shut, updateTemp } from '../screens/overlays/tempStore.js';
import { SHOP, bagN, fmt, ownedFam, savePurse, today } from './032-v4-foundation.js';
import { refreshMap } from '../screens/map/mapStore.js';
import { DEXS } from './038-pokedex.js';
import { refreshDex } from '../screens/dex/dexStore.js';
import { renderBag } from './039-quests-shop.js';
import { costOf0 } from './049-identity.js';
import { HELD_SHOP, costHeld414 } from './053-resonance.js';
import { seed417 } from './057-companions-resonance.js';


export function peddler454() {
  const d = today(),
    r = rng454('ambu'),
    present = seed417('ambu7') % 7 < 4;
  const keyList = Object.keys(SHOP).filter(k => !SHOP[k].g && !SHOP[k].cs && !SHOP[k].cle && k !== 'master' && ['balls', 'soins', 'combat'].includes(SHOP[k].cat));
  const pick = [];
  const pool = keyList.slice();
  while (pick.length < 3 && pool.length) pick.push(pool.splice(Math.floor(r() * pool.length), 1)[0]);
  const cts = Object.keys(SHOP).filter(k => SHOP[k].cat === 'machines' && !SHOP[k].cs && !SHOP[k].g);
  if (cts.length) pick.push(cts[Math.floor(r() * cts.length)]);
  const held = Object.keys(HELD_SHOP).filter(k => !HELD_SHOP[k].g && !PROFILE.items.includes(k));
  const th = held.length ? held[Math.floor(r() * held.length)] : null;
  const st = LS454('res-am454', d) || { d, got: {} };
  return { present, nom: NAMES454[seed417('ambunom') % NAMES454.length], pick, th, st };
}


// Shop › Peddler: rendered by React (src/screens/bag/Peddler.jsx)


export function ev454() {
  const d = today(),
    i = seed417('ev454') % EV454.length,
    st = LS454('res-ev454', d) || { d, done: false };
  return HOOKS.rencontreRoute.reduce((r, f) => f(r), { E: EV454[i], i, st });
}


function evOpen454() {
  const { E, st } = ev454();
  if (st.done) return;
  const c = E.c.map(choice => {
    const eff = [choice.cost ? 'Coût : ' + txt454(choice.cost) : '', choice.p && choice.p < 1 ? `${Math.round(choice.p * 100)} % de réussite` : ''].filter(Boolean).join(' · ');
    return { l: choice.l, ok: can454(choice.cost), eff: eff || null };
  });
  // rendered by src/screens/overlays/transients/Windows.jsx (Ev454)
  const o = overlay('evs454', { t: E.t, x: E.x, c, res: null });
  o.addEventListener('click', e => {
    if (e.target === o) shut('evs454');
  });
}


export function evPick454(j) {
  for (const f of HOOKS.avantChoixRoute) if (f(j)) return;
  solve454(j);
  hook('choixRoute', j);
}


function solve454(j) {
  const { E, st } = ev454(),
    c = E.c[j];
  if (!c || st.done || !can454(c.cost)) return;
  reward454(c.cost);
  let issue = 'ok';
  if (c.p && c.p < 1) issue = rng454('ev454r' + j)() < c.p ? 'ok' : 'ko';
  const g = issue === 'ok' ? c.ok : c.ko,
    t = (issue === 'ok' ? c.okT : c.koT) || (c.cost ? 'Affaire conclue.' : 'Vous poursuivez votre route.');
  if (g) reward454(g);
  const res = t + (g && txt454(g) ? ' (' + txt454(g) + ')' : '');
  writeLS('res-ev454', { d: st.d, done: true, res });
  sfx(issue === 'ok' ? 'ui' : 'hit');
  vibe(issue === 'ok' ? 20 : 40);
  savePurse();
  updateTemp('evs454', { res: { ok: issue === 'ok', txt: res } });
  refreshMap(); // "Rencontre sur la route" (Route encounter) banner (#ev454, src/screens/map/EvBar.jsx)
}


export function week454() {
  const t = new Date(today() + 'T00:00:00Z'),
    j = Math.floor(t.getTime() / 86400000 + 3);
  return 'w' + Math.floor(j / 7);
}


export function msSt454() {
  let s;
  try {
    s = JSON.parse(localStorage.getItem('res-ms454') || '{}');
  } catch (e) {
    s = {};
  }
  s.pal = s.pal || {};
  s.ty = s.ty || {};
  return s;
}


export function typesMs454() {
  const cnt = {};
  DEXS.forEach(m => {
    (m.t || []).forEach(t => {
      cnt[t] = cnt[t] || { tot: 0, own: 0 };
      cnt[t].tot++;
      if (ownedFam(m.id)) cnt[t].own++;
    });
  });
  const ts = Object.keys(cnt)
    .filter(t => cnt[t].tot >= 4)
    .sort();
  const w = week454();
  let h = 7;
  for (const ch of w) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const a = ts[h % ts.length],
    b = ts[(h * 7 + 3) % ts.length];
  return [a, b === a ? ts[(h + 1) % ts.length] : b].map(t => ({ t, n: Math.min(4, cnt[t].tot), own: cnt[t].own }));
}



const LS454 = (k, d) => {
  let s;
  try {
    s = JSON.parse(localStorage.getItem(k) || 'null');
  } catch (e) {
    s = null;
  }
  return s && s.d === d ? s : null;
};


export const rng454 = sel => mulberry32(seed417(sel) || 1);


export const reward454 = (o, _t) => {
  /* applies a gain/cost {m,g,b:{k:n}} */
  if (!o) return;
  if (o.m) PROFILE.money = Math.max(0, PROFILE.money + o.m);
  if (o.g) PROFILE.gems = Math.max(0, PROFILE.gems + o.g);
  if (o.b) for (const k in o.b) PROFILE.bag[k] = Math.max(0, bagN(k) + o.b[k]);
};


export const can454 = c => {
  if (!c) return true;
  if (c.m && PROFILE.money + c.m < 0) return false;
  if (c.g && PROFILE.gems + c.g < 0) return false;
  if (c.b) for (const k in c.b) if (bagN(k) + c.b[k] < 0) return false;
  return true;
};


export const txt454 = o => {
  if (!o) return '';
  const a = [];
  if (o.m) a.push(`${o.m > 0 ? '+' : '−'}${fmt(Math.abs(o.m))} ₽`);
  if (o.g) a.push(`${o.g > 0 ? '+' : '−'}${Math.abs(o.g)} Éclat${Math.abs(o.g) > 1 ? 's' : ''}`);
  if (o.b) for (const k in o.b) a.push(`${o.b[k] > 0 ? '+' : '−'}${Math.abs(o.b[k])} ${SHOP[k] ? SHOP[k].n : k}`);
  return a.join(', ');
};


/* ---------- 1. peddler ---------- */
const NAMES454 = ['Basile', 'Maëlle', 'Hugo', 'Iris', 'Gaspard', 'Solène', 'Théo'];


/* ---------- 2. route encounters ---------- */
const EV454 = [
  {
    t: 'Un vieux pêcheur',
    x: 'Un pêcheur peine à remonter ses filets sur la rive.',
    c: [
      { l: 'L’aider à tirer', p: 0.75, ok: { m: 400 }, okT: 'Belle prise ! Il partage ses gains.', ko: {}, koT: 'Rien que des algues, mais il vous remercie.' },
      { l: 'Acheter ses prises', cost: { m: -300 }, ok: { b: { potion: 2 } }, okT: 'Il vous glisse 2 Potions dans un panier.' },
      { l: 'Passer son chemin' }
    ]
  },
  {
    t: 'Une pierre qui brille',
    x: 'Un éclat de lumière sort d’un rocher fissuré.',
    c: [
      { l: 'Creuser', p: 0.5, ok: { g: 2 }, okT: 'Deux Éclats de Résonance sortent de la roche !', ko: { m: -200 }, koT: 'Votre pioche improvisée casse. Il faut la remplacer.' },
      { l: 'Laisser en place' }
    ]
  },
  {
    t: 'Un dresseur épuisé',
    x: 'Son Pokémon n’a plus de forces et il n’a rien pour le soigner.',
    c: [
      { l: 'Donner une Potion', cost: { b: { potion: -1 } }, ok: { g: 1, m: 300 }, okT: 'Il vous remercie avec un Éclat et un peu d’argent.' },
      { l: 'Lui souhaiter bon courage' }
    ]
  },
  {
    t: 'Un troc',
    x: 'Un randonneur échange volontiers des Balls, si vous êtes d’accord.',
    c: [
      { l: 'Poké Ball contre Super Ball', cost: { b: { poke: -1 } }, ok: { b: { super: 1 } }, okT: 'L’échange est conclu.' },
      { l: 'Refuser poliment' }
    ]
  },
  {
    t: 'Un orage approche',
    x: 'Le ciel noircit. Un abri est tout près, mais un éclat luit dans le champ.',
    c: [
      { l: 'Courir jusqu’à l’éclat', p: 0.6, ok: { g: 3 }, okT: 'Vous l’attrapez juste avant l’averse : 3 Éclats !', ko: { m: -300 }, koT: 'Glissade dans la boue : une poche est déchirée.' },
      { l: 'S’abriter' }
    ]
  },
  {
    t: 'Un voyageur mystérieux',
    x: 'Il sort une pièce d’un air amusé : pile ou face ?',
    c: [
      { l: 'Jouer 200 ₽', cost: { m: -200 }, p: 0.5, ok: { m: 400 }, okT: 'Gagné ! Il double la mise.', ko: {}, koT: 'Perdu. Il rit et s’éloigne.' },
      { l: 'Écouter son histoire', ok: { g: 1 }, okT: 'Il vous laisse un Éclat pour votre patience.' },
      { l: 'Refuser' }
    ]
  },
  {
    t: 'Un nid abandonné',
    x: 'Un nid vide contient des baies et quelques objets.',
    c: [
      { l: 'Fouiller le nid', ok: { b: { poke: 3 } }, okT: 'Trois Poké Balls oubliées par un dresseur !' },
      { l: 'Laisser en paix', ok: { g: 1 }, okT: 'Un Pokémon vous observe, puis dépose un Éclat à vos pieds.' }
    ]
  },
  {
    t: 'Un pique-nique',
    x: 'Un couple de promeneurs vous invite à partager leur repas.',
    c: [
      { l: 'Offrir une Potion', cost: { b: { potion: -1 } }, ok: { m: 600 }, okT: 'Ils insistent pour vous dédommager.' },
      { l: 'Partager un moment', ok: { m: 100 }, okT: 'Une bonne pause, et une petite pièce en cadeau.' }
    ]
  }
];


/* ---------- 3. Pokédex missions ---------- */
export const PAL454 = [
  [5, { m: 500 }],
  [10, { g: 1 }],
  [20, { m: 1500 }],
  [35, { g: 2 }],
  [50, { m: 3000 }],
  [75, { g: 3 }],
  [100, { m: 5000 }],
  [119, { g: 5 }]
];

// Statements run at startup, in the original order (see index.js).
export function __init() {

document.addEventListener(
  'click',
  e => {
    const b = e.target.closest && e.target.closest('[data-am454]');
    if (!b) return;
    e.preventDefault();
    e.stopPropagation();
    const A = peddler454(),
      k = b.dataset.am454;
    if (!A.present) return;
    if (k.startsWith('h:')) {
      const h = k.slice(2);
      if (h !== A.th || A.st.got[k]) return;
      const px = Math.round((costHeld414(h) * 0.8) / 50) * 50;
      if (PROFILE.money < px) return;
      PROFILE.money -= px;
      PROFILE.items.push(h);
      A.st.got[k] = 1;
      toast(`Acheté : ${ITEMS2[h].n}. Confiez-le depuis la fiche d’un Pokémon.`);
    } else {
      if (!A.pick.includes(k) || (A.st.got[k] || 0) >= (SHOP[k].mv ? 1 : 3) || bagN(k) >= 99) return;
      const px = Math.max(50, Math.round((costOf0(k) * 0.75) / 50) * 50);
      if (PROFILE.money < px) return;
      PROFILE.money -= px;
      PROFILE.bag[k] = bagN(k) + 1;
      A.st.got[k] = (A.st.got[k] || 0) + 1;
      toast(`Acheté : 1 × ${SHOP[k].n}`);
    }
    writeLS('res-am454', A.st);
    sfx('ui');
    vibe(15);
    savePurse();
    renderBag();
  },
  true
);


document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('[data-ev454]');
  if (!b) return;
  const v = b.dataset.ev454;
  if (v === 'open') evOpen454();
  else if (v === 'close') shut('evs454');
  else evPick454(+v);
});


document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('[data-ms454]');
  if (!b || b.disabled) return;
  const S = msSt454(),
    [k, v] = b.dataset.ms454.split(':');
  if (k === 'p') {
    const p = PAL454.find(x => x[0] === +v);
    if (!p || S.pal[v] || DEXS.filter(m => ownedFam(m.id)).length < p[0]) return;
    S.pal[v] = 1;
    reward454(p[1]);
    toast('Mission accomplie : ' + txt454(p[1]));
  } else {
    const t = typesMs454().find(x => x.t === v);
    if (!t || t.own < t.n || S.ty[week454() + v]) return;
    S.ty[week454() + v] = 1;
    reward454({ g: 1 });
    toast('Spécialiste ' + v + ' : +1 Éclat');
  }
  writeLS('res-ms454', S);
  sfx('ui');
  vibe(20);
  savePurse();
  refreshDex(); // missions (#ms454) rendered by React: src/screens/dex/Missions.jsx
});

}
