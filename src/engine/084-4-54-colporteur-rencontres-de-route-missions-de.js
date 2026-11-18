/* Section d'origine : 4.54 : colporteur, rencontres de route, missions de Pokédex */

import { ITEMS2, PROFILE } from './011-05-etat-de-partie.js';
import { toast } from './014-08-outils.js';
import { queueSave } from './025-19-sauvegardes.js';
import { sfx, vibe } from './026-20-campagne-tutoriel-son.js';
import { overlay } from './030-24-prestige-mise-en-scene.js';
import { fermer, majTemp } from '../screens/overlays/tempStore.js';
import { SHOP, bagN, fmt, ownedFam, today } from './032-v4-00-socle.js';
import { renderWallet } from './035-v4-03-interface.js';
import { refreshCarte } from '../screens/carte/carteStore.js';
import { DEXS } from './038-v4-06-pokedex.js';
import { refreshDex } from '../screens/dex/dexStore.js';
import { renderBag } from './039-v4-07-quetes-boutique.js';
import { prixDe0 } from './049-v4-10-01-identite.js';
import { HELD_SHOP, prixHeld414 } from './053-v4-14-01-resonance.js';
import { NEWS416 } from './056-v4-16-1-01-finitions.js';
import { graine417 } from './057-v4-17-01-compagnons-et-resonance.js';

export let LSS454, rng454, gain454, peut454, txt454, PAL454;
let LS454, refresh454, NOMS454, EV454;
export function __set_ev454(v) { return (ev454 = v); }
export function __set_evPick454(v) { return (evPick454 = v); }


export function ambu454() {
  const d = today(),
    r = rng454('ambu'),
    present = graine417('ambu7') % 7 < 4;
  const clés = Object.keys(SHOP).filter(k => !SHOP[k].g && !SHOP[k].cs && !SHOP[k].cle && k !== 'master' && ['balls', 'soins', 'combat'].includes(SHOP[k].cat));
  const pick = [];
  const pool = clés.slice();
  while (pick.length < 3 && pool.length) pick.push(pool.splice(Math.floor(r() * pool.length), 1)[0]);
  const cts = Object.keys(SHOP).filter(k => SHOP[k].cat === 'machines' && !SHOP[k].cs && !SHOP[k].g);
  if (cts.length) pick.push(cts[Math.floor(r() * cts.length)]);
  const tenus = Object.keys(HELD_SHOP).filter(k => !HELD_SHOP[k].g && !PROFILE.items.includes(k));
  const th = tenus.length ? tenus[Math.floor(r() * tenus.length)] : null;
  const st = LS454('res-am454', d) || { d, got: {} };
  return { present, nom: NOMS454[graine417('ambunom') % NOMS454.length], pick, th, st };
}


// Boutique › Colporteur : rendu par React (src/screens/sac/Colporteur.jsx)


export function ev454() {
  const d = today(),
    i = graine417('ev454') % EV454.length,
    st = LS454('res-ev454', d) || { d, done: false };
  return { E: EV454[i], i, st };
}


// bandeau « Rencontre sur la route » (#ev454, au-dessus du panneau de la carte) :
// rendu par React (src/screens/carte/EvBar.jsx)
function evBar454() {
  refreshCarte();
}


function evOpen454() {
  const { E, st } = ev454();
  if (st.done) return;
  const c = E.c.map(c => {
    const eff = [c.cost ? 'Coût : ' + txt454(c.cost) : '', c.p && c.p < 1 ? `${Math.round(c.p * 100)} % de réussite` : ''].filter(Boolean).join(' · ');
    return { l: c.l, ok: peut454(c.cost), eff: eff || null };
  });
  // rendu : src/screens/overlays/temporaires/Fenetres.jsx (Ev454)
  const o = overlay('evs454', { t: E.t, x: E.x, c, res: null });
  o.addEventListener('click', e => {
    if (e.target === o) fermer('evs454');
  });
}


export function evPick454(j) {
  const { E, i, st } = ev454(),
    c = E.c[j];
  if (!c || st.done || !peut454(c.cost)) return;
  gain454(c.cost);
  let issue = 'ok';
  if (c.p && c.p < 1) issue = rng454('ev454r' + j)() < c.p ? 'ok' : 'ko';
  const g = issue === 'ok' ? c.ok : c.ko,
    t = (issue === 'ok' ? c.okT : c.koT) || (c.cost ? 'Affaire conclue.' : 'Vous poursuivez votre route.');
  if (g) gain454(g);
  const res = t + (g && txt454(g) ? ' (' + txt454(g) + ')' : '');
  LSS454('res-ev454', { d: st.d, done: true, res });
  sfx(issue === 'ok' ? 'ui' : 'hit');
  vibe(issue === 'ok' ? 20 : 40);
  refresh454();
  majTemp('evs454', { res: { ok: issue === 'ok', txt: res } });
  evBar454();
}


export function sem454() {
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
  const w = sem454();
  let h = 7;
  for (const ch of w) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const a = ts[h % ts.length],
    b = ts[(h * 7 + 3) % ts.length];
  return [a, b === a ? ts[(h + 1) % ts.length] : b].map(t => ({ t, n: Math.min(4, cnt[t].tot), own: cnt[t].own }));
}



// Instructions exécutées au démarrage, dans l'ordre d'origine (voir index.js).
export function __init() {

LS454 = (k, d) => {
  let s;
  try {
    s = JSON.parse(localStorage.getItem(k) || 'null');
  } catch (e) {
    s = null;
  }
  return s && s.d === d ? s : null;
};


LSS454 = (k, v) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch (e) {}
};


rng454 = sel => {
  let a = graine417(sel) || 1;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};


gain454 = (o, t) => {
  /* applique un gain/coût {m,g,b:{k:n}} */
  if (!o) return;
  if (o.m) PROFILE.money = Math.max(0, PROFILE.money + o.m);
  if (o.g) PROFILE.gems = Math.max(0, PROFILE.gems + o.g);
  if (o.b) for (const k in o.b) PROFILE.bag[k] = Math.max(0, bagN(k) + o.b[k]);
};


peut454 = c => {
  if (!c) return true;
  if (c.m && PROFILE.money + c.m < 0) return false;
  if (c.g && PROFILE.gems + c.g < 0) return false;
  if (c.b) for (const k in c.b) if (bagN(k) + c.b[k] < 0) return false;
  return true;
};


txt454 = o => {
  if (!o) return '';
  const a = [];
  if (o.m) a.push(`${o.m > 0 ? '+' : '−'}${fmt(Math.abs(o.m))} ₽`);
  if (o.g) a.push(`${o.g > 0 ? '+' : '−'}${Math.abs(o.g)} Éclat${Math.abs(o.g) > 1 ? 's' : ''}`);
  if (o.b) for (const k in o.b) a.push(`${o.b[k] > 0 ? '+' : '−'}${Math.abs(o.b[k])} ${SHOP[k] ? SHOP[k].n : k}`);
  return a.join(', ');
};


refresh454 = () => {
  try {
    queueSave();
    renderWallet();
  } catch (e) {}
};


/* ---------- 1. colporteur ---------- */
NOMS454 = ['Basile', 'Maëlle', 'Hugo', 'Iris', 'Gaspard', 'Solène', 'Théo'];


document.addEventListener(
  'click',
  e => {
    const b = e.target.closest && e.target.closest('[data-am454]');
    if (!b) return;
    e.preventDefault();
    e.stopPropagation();
    const A = ambu454(),
      k = b.dataset.am454;
    if (!A.present) return;
    if (k.startsWith('h:')) {
      const h = k.slice(2);
      if (h !== A.th || A.st.got[k]) return;
      const px = Math.round((prixHeld414(h) * 0.8) / 50) * 50;
      if (PROFILE.money < px) return;
      PROFILE.money -= px;
      PROFILE.items.push(h);
      A.st.got[k] = 1;
      toast(`Acheté : ${ITEMS2[h].n}. Confiez-le depuis la fiche d’un Pokémon.`);
    } else {
      if (!A.pick.includes(k) || (A.st.got[k] || 0) >= (SHOP[k].mv ? 1 : 3) || bagN(k) >= 99) return;
      const px = Math.max(50, Math.round((prixDe0(k) * 0.75) / 50) * 50);
      if (PROFILE.money < px) return;
      PROFILE.money -= px;
      PROFILE.bag[k] = bagN(k) + 1;
      A.st.got[k] = (A.st.got[k] || 0) + 1;
      toast(`Acheté : 1 × ${SHOP[k].n}`);
    }
    LSS454('res-am454', A.st);
    sfx('ui');
    vibe(15);
    refresh454();
    renderBag();
  },
  true
);


/* ---------- 2. rencontres sur la route ---------- */
EV454 = [
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


document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('[data-ev454]');
  if (!b) return;
  const v = b.dataset.ev454;
  if (v === 'open') evOpen454();
  else if (v === 'close') fermer('evs454');
  else evPick454(+v);
});


/* ---------- 3. missions de Pokédex ---------- */
PAL454 = [
  [5, { m: 500 }],
  [10, { g: 1 }],
  [20, { m: 1500 }],
  [35, { g: 2 }],
  [50, { m: 3000 }],
  [75, { g: 3 }],
  [100, { m: 5000 }],
  [119, { g: 5 }]
];


document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('[data-ms454]');
  if (!b || b.disabled) return;
  const S = msSt454(),
    [k, v] = b.dataset.ms454.split(':');
  if (k === 'p') {
    const p = PAL454.find(x => x[0] === +v);
    if (!p || S.pal[v] || DEXS.filter(m => ownedFam(m.id)).length < p[0]) return;
    S.pal[v] = 1;
    gain454(p[1]);
    toast('Mission accomplie : ' + txt454(p[1]));
  } else {
    const t = typesMs454().find(x => x.t === v);
    if (!t || t.own < t.n || S.ty[sem454() + v]) return;
    S.ty[sem454() + v] = 1;
    gain454({ g: 1 });
    toast('Spécialiste ' + v + ' : +1 Éclat');
  }
  try {
    localStorage.setItem('res-ms454', JSON.stringify(S));
  } catch (er) {}
  sfx('ui');
  vibe(20);
  refresh454();
  refreshDex(); // missions (#ms454) rendues par React : src/screens/dex/Missions.jsx
});


NEWS416.unshift(['i-gem', 'Colporteur, rencontres et missions', 'Un colporteur passe certains jours avec des prix réduits (Boutique). Une rencontre par jour sur la Carte, avec des choix. Dans le Pokédex, des missions à paliers et des spécialistes de la semaine donnent Éclats et Pokédollars.']);


NEWS416.splice(8);
}
