/* Section d'origine : 4.57 : atelier, recettes, commandes, tirage, vitrine, cadeau du jour */

import { ITEMS2, PROFILE } from './011-game-state.js';
import { writeLS, toast } from './014-utils.js';
import { sfx, vibe } from './026-campaign-tutorial-sound.js';
import { SHOP, bagN, savePurse, today } from './032-v4-foundation.js';
import { refreshHome } from '../screens/home/homeStore.js';
import { renderBag } from './039-quests-shop.js';
import { reward454, rng454, txt454 } from './084-peddler-route-missions.js';

export { LJ455, RECETTES455, COUT455 }; // lus par Boutique › Atelier et Tirage (React, src/screens/sac/Atelier.jsx)


/* ---------- fusion de CT ---------- */
export function donors455(target) {
  const d = [];
  ctKeys455()
    .filter(k => k !== target && bagN(k) > 0)
    .sort((a, b) => SHOP[a].p - SHOP[b].p)
    .forEach(k => {
      for (let i = 0; i < bagN(k) && d.length < 2; i++) d.push(k);
    });
  return d.length === 2 ? d : null;
}


export function fusionTargets455() {
  const r = rng454('fusion455'),
    pool = ctKeys455().filter(k => !bagN(k)),
    out = [];
  while (out.length < 4 && pool.length) out.push(pool.splice(Math.floor(r() * pool.length), 1)[0]);
  return out;
}


/* ---------- commandes du jour ---------- */
export function commands455() {
  const r = rng454('cmd455'),
    pool = ['potion', 'poke', 'super', 'antidote', 'antigel', 'baieoran', 'superpotion'],
    a = pool.splice(Math.floor(r() * pool.length), 1)[0],
    b = pool.splice(Math.floor(r() * pool.length), 1)[0],
    st = LJ455('res-at455', { d: today(), cmd: {}, spin: 0 });
  return [
    { id: 'c1', in: { [a]: 2 + Math.floor(r() * 2) }, rew: { g: 1 } },
    { id: 'c2', in: { [b]: 3 }, rew: { m: 900 } }
  ].map(c => ({ ...c, done: !!st.cmd[c.id] }));
}


function spin455() {
  const st = LJ455('res-at455', { d: today(), cmd: {}, spin: 0 });
  if (st.spin >= 4) return;
  if (st.spin > 0) {
    if (PROFILE.money < COUT455) return;
    PROFILE.money -= COUT455;
  }
  const r = rng454('spin455' + st.spin)();
  let tot = LOTS455.reduce((a, l) => a + l.w, 0),
    x = r * tot,
    lot = LOTS455[0];
  for (const l of LOTS455) {
    if ((x -= l.w) < 0) {
      lot = l;
      break;
    }
  }
  let t = lot.t;
  if (lot.ct) {
    const cts = ctKeys455(),
      k = cts[Math.floor(rng454('spinct455' + st.spin)() * cts.length)];
    PROFILE.bag[k] = Math.min(99, bagN(k) + 1);
    t = SHOP[k].n;
  } else reward454(lot.o);
  st.spin++;
  st.last = t;
  writeLS('res-at455', st);
  sfx('win');
  vibe(25);
  toast('Tirage : ' + t);
  savePurse();
}


/* ---------- vitrine (affichée par React : src/screens/sac/Atelier.jsx) ---------- */
// Marque comme vues les CT / CS du Sac ou déjà apprises, puis renvoie l'état de la vitrine.
export function showcase455() {
  let seen;
  try {
    seen = JSON.parse(localStorage.getItem('res-vit455') || '{}');
  } catch (e) {
    seen = {};
  }
  const learned = Object.values((PROFILE.ct && PROFILE.ct.apprises) || {});
  const cts = ctKeys455(),
    cs = Object.keys(SHOP).filter(k => SHOP[k].cs);
  [...cts, ...cs].forEach(k => {
    if (bagN(k) > 0 || learned.includes(SHOP[k].mv)) seen[k] = 1;
  });
  writeLS('res-vit455', seen);
  return { seen, cts, cs };
}


/* ---------- onglets de la Boutique (Atelier, Tirage…) : rendus par React (src/screens/sac/Atelier.jsx) ---------- */


function yesterday455() {
  const t = new Date(today() + 'T12:00:00Z');
  t.setUTCDate(t.getUTCDate() - 1);
  return t.toISOString().slice(0, 10);
}


export function cdSt455() {
  let s;
  try {
    s = JSON.parse(localStorage.getItem('res-cd455') || '{}');
  } catch (e) {
    s = {};
  }
  s.n = s.n || 0;
  if (s.last && s.last !== today() && s.last !== yesterday455()) s.n = 0;
  return s;
}


/** Bouton « Cadeau du jour » de l'Accueil (#cd455, rendu : src/screens/accueil/Bannieres.jsx). */
export function cdData455() {
  const s = cdSt455(),
    doneFlag = s.last === today(),
    j = doneFlag ? Math.max(0, s.n - 1) % 7 : s.n % 7,
    R = CADEAU455[j],
    txt = [txt454(R), R.ct ? '1 CT' : ''].filter(Boolean).join(' + ');
  return { fait: doneFlag, j, txt };
}

const LJ455 = (k, d) => {
  let s;
  try {
    s = JSON.parse(localStorage.getItem(k) || 'null');
  } catch (e) {
    s = null;
  }
  return s && s.d === today() ? s : d;
};


const nameIt455 = k => (SHOP[k] ? SHOP[k].n : (ITEMS2[k] || {}).n || k);


export const ctKeys455 = () => Object.keys(SHOP).filter(k => SHOP[k].cat === 'machines' && !SHOP[k].cs && !SHOP[k].g);


export const txtIn455 = o => Object.keys(o).map(k => `${o[k]} × ${nameIt455(k)}`).join(' + ');


export const add455 = (o, direction) => {
  for (const k in o) {
    PROFILE.bag[k] = Math.max(0, Math.min(99, bagN(k) + direction * o[k]));
    if (!PROFILE.bag[k]) delete PROFILE.bag[k];
  }
};


export const canIn455 = o => Object.keys(o).every(k => bagN(k) >= o[k]);


/* ---------- livre de recettes ---------- */
const RECETTES455 = [
  { id: 'r1', in: { potion: 3 }, out: { superpotion: 1 }, m: 0 },
  { id: 'r2', in: { superpotion: 3 }, out: { hyperpotion: 1 }, m: 200 },
  { id: 'r3', in: { poke: 3 }, out: { super: 1 }, m: 200 },
  { id: 'r4', in: { super: 3 }, out: { hyper: 1 }, m: 400 },
  { id: 'r5', in: { antigel: 2, antidote: 2 }, out: { totalsoin: 1 }, m: 0 },
  { id: 'r6', in: { baieoran: 3 }, out: { baiemepo: 1 }, m: 0 },
  { id: 'r7', in: { attaqueplus: 2, defenseplus: 2 }, out: { gelee: 1 }, m: 500 },
  { id: 'r8', in: { rappel: 2 }, out: { rappelmax: 1 }, m: 1000 }
];


/* ---------- tirage du colporteur ---------- */
const LOTS455 = [
  { w: 25, t: 'Poké Ball × 3', o: { b: { poke: 3 } } },
  { w: 22, t: 'Potion × 2', o: { b: { potion: 2 } } },
  { w: 14, t: 'Super Ball', o: { b: { super: 1 } } },
  { w: 10, t: 'Antigel et Antidote', o: { b: { antigel: 1, antidote: 1 } } },
  { w: 10, t: '400 ₽', o: { m: 400 } },
  { w: 6, t: 'Hyper Potion', o: { b: { hyperpotion: 1 } } },
  { w: 6, t: '1 Éclat de Résonance', o: { g: 1 } },
  { w: 4, t: 'Une CT au hasard', ct: 1 },
  { w: 3, t: 'Baie Mepo', o: { b: { baiemepo: 1 } } }
];


const COUT455 = 900;


/* ---------- cadeau du jour ---------- */
const CADEAU455 = [
  { m: 300, b: { potion: 1 } },
  { b: { poke: 2 } },
  { m: 800 },
  { g: 1 },
  { b: { super: 2, hyperpotion: 1 } },
  { m: 1500 },
  { g: 3, ct: 1 }
];

// Instructions exécutées au démarrage, dans l'ordre d'origine (voir index.js).
export function __init() {

document.addEventListener(
  'click',
  e => {
    const b = e.target.closest && e.target.closest('[data-at455]');
    if (!b || b.disabled) return;
    e.preventDefault();
    e.stopPropagation();
    const [a, k] = b.dataset.at455.split(':');
    if (a === 'rec') {
      const r = RECETTES455.find(x => x.id === k);
      if (!r || !canIn455(r.in) || PROFILE.money < r.m) return;
      add455(r.in, -1);
      PROFILE.money -= r.m;
      add455(r.out, 1);
      toast('Préparé : ' + txtIn455(r.out));
    } else if (a === 'fus') {
      const d = donors455(k);
      if (!ctKeys455().includes(k) || bagN(k) || !d || PROFILE.money < 1000) return;
      d.forEach(x => add455({ [x]: 1 }, -1));
      PROFILE.money -= 1000;
      PROFILE.bag[k] = 1;
      toast('Fusion réussie : ' + SHOP[k].n);
    } else if (a === 'cmd') {
      const c = commands455().find(x => x.id === k),
        st = LJ455('res-at455', { d: today(), cmd: {}, spin: 0 });
      if (!c || c.done || !canIn455(c.in)) return;
      add455(c.in, -1);
      reward454(c.rew);
      st.cmd[k] = 1;
      writeLS('res-at455', st);
      toast('Commande livrée : ' + txt454(c.rew));
    } else if (a === 'spin') {
      spin455();
      renderBag();
      return;
    } else return;
    sfx('ui');
    vibe(15);
    savePurse();
    renderBag();
  },
  true
);


document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('[data-cd455]');
  if (!b) return;
  const s = cdSt455();
  if (s.last === today()) return;
  const R = CADEAU455[s.n % 7];
  reward454(R);
  let extra = '';
  if (R.ct) {
    const cts = ctKeys455(),
      k = cts[Math.floor(rng454('cdct455')() * cts.length)];
    PROFILE.bag[k] = Math.min(99, bagN(k) + 1);
    extra = ' + ' + SHOP[k].n;
  }
  s.n++;
  s.last = today();
  writeLS('res-cd455', s);
  sfx('win');
  vibe(25);
  toast('Cadeau du jour : ' + txt454(R) + extra);
  savePurse();
  refreshHome(); // bouton #cd455
});

}
