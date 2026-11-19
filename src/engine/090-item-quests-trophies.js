/* Original section: 4.59: item quests and trophies */

import { ITEMS2, PROFILE } from './011-game-state.js';
import { BADGES } from './013-gyms.js';
import { toast } from './014-utils.js';
import { sfx, vibe } from './026-campaign-tutorial-sound.js';
import { SHOP, bagN, savePurse } from './032-v4-foundation.js';
import { renderBag } from './039-quests-shop.js';
import { seed417 } from './057-companions-resonance.js';
import { reward454, txt454 } from './084-peddler-route-missions.js';
import { add455, cdSt455, tmKeys455, canIn455 } from './088-workshop-recipes.js';

let TROPH459;
export { QO459, TROPH459 }; // read by Shop › Quests and Trophies (React, src/screens/bag/Workshop.jsx)


export function qoSt459() {
  let s;
  try {
    s = JSON.parse(localStorage.getItem('res-qo459') || '{}');
  } catch (e) {
    s = {};
  }
  s.done = s.done || {};
  return s;
}


export function qoIn459(q) {
  /* needs: the item keys, and "ct" = a TM from the Bag */
  const o = {};
  for (const k in q.in) if (k !== 'ct') o[k] = q.in[k];
  return o;
}


export function qoOk459(q) {
  return canIn455(qoIn459(q)) && (!q.in.ct || !!tmPos459());
}


export function qoRewTxt459(r) {
  const a = [];
  if (r.m || r.g || r.b) a.push(txt454({ m: r.m, g: r.g, b: r.b }));
  if (r.item) a.push(ITEMS2[r.item].n + (PROFILE.items.includes(r.item) ? ' (déjà en votre possession : 2 500 ₽)' : ''));
  if (r.ct) a.push('une CT');
  return a.filter(Boolean).join(' + ');
}


function viewsCT459() {
  let seen = {};
  try {
    seen = JSON.parse(localStorage.getItem('res-vit455') || '{}');
  } catch (e) {}
  const learned = Object.values((PROFILE.ct && PROFILE.ct.apprises) || {});
  const all = Object.keys(SHOP).filter(k => SHOP[k].cat === 'machines' && !SHOP[k].g === !SHOP[k].g);
  return all.filter(k => seen[k] || bagN(k) > 0 || learned.includes(SHOP[k].mv)).length;
}


export function tpSt459() {
  let s;
  try {
    s = JSON.parse(localStorage.getItem('res-tp459') || '{}');
  } catch (e) {
    s = {};
  }
  return s;
}


// Shop › Quests and Trophies: rendered by React (src/screens/bag/Workshop.jsx)

const QO459 = [
  { id: 'q1', min: 0, qui: 'Infirmière Lise', txt: 'Une randonnée a mal tourné ce matin et la salle de soins est vide. Rapportez-moi de quoi remettre tout le monde sur pied.', in: { potion: 3 }, rew: { m: 800, b: { baiemepo: 1 } } },
  { id: 'q2', min: 0, qui: 'Pêcheur Marcel', txt: 'Je veux sortir un gros Pokémon de la rivière, mais mes Balls sont trop faibles. Prêtez-moi les vôtres, je vous laisse ma pierre porte-bonheur.', in: { poke: 2, super: 1 }, rew: { item: 'eaumystique' } },
  { id: 'q3', min: 1, qui: 'Randonneuse Clémence', txt: 'Mon groupe a été piqué et gelé en une seule nuit sur la route. Avec de quoi les soigner, je vous offre une baie qui ne rate jamais.', in: { antidote: 2, antigel: 2 }, rew: { item: 'baielum' } },
  { id: 'q4', min: 1, qui: 'Prof. Sorbier', txt: 'Pour mes recherches sur la Résonance, il me faut des soins plus solides que de simples Potions. Je vous remercie en Éclats.', in: { superpotion: 3 }, rew: { g: 2 } },
  { id: 'q5', min: 2, qui: 'Forgeron Armand', txt: 'J’ai besoin d’un disque de CT pour étudier le gravage. Prêtez-m’en un et je vous donne un charbon spécial de ma forge.', in: { ct: 1 }, rew: { item: 'charbon' } },
  { id: 'q6', min: 2, qui: 'Collectionneuse Opaline', txt: 'Ma vitrine de Balls n’est pas complète. Trois Super Balls et je vous trouve une CT rare dans mes réserves.', in: { super: 3 }, rew: { ct: 1, g: 1 } },
  { id: 'q7', min: 3, qui: 'Gardien du Phare', txt: 'La tempête a blessé tous mes Pokémon d’un coup. Deux Hyper Potions, et mes Lunettes Filtre sont à vous.', in: { hyperpotion: 2 }, rew: { item: 'filtre' } },
  { id: 'q8', min: 4, qui: 'Octave, ancien champion', txt: 'À mon époque, on gagnait avec de la Résonance pure. Montrez-moi une Gelée Résonante et un Rappel, je vous passe mon vieux gilet.', in: { gelee: 1, rappel: 1 }, rew: { item: 'cape' } },
  { id: 'q9', min: 4, qui: 'Aubergiste Solange', txt: 'Pour le grand banquet des dresseurs, il me faut quatre Baies Oran. Je vous offre la bannière de la maison.', in: { baieoran: 4 }, rew: { item: 'banniere' } },
  { id: 'q10', min: 6, qui: 'Maître Lucien', txt: 'Seuls les plus préparés m’intéressent. Deux Hyper Balls et un Rappel Max, et vous aurez ma Ceinture Noire.', in: { hyper: 2, rappelmax: 1 }, rew: { item: 'ceintnoire', g: 3 } }
];


export const badgeCount459 = () => BADGES.length;


const tmPos459 = () => tmKeys455().find(k => bagN(k) > 0);

// Statements run at startup, in the original order (see index.js).
export function __init() {

document.addEventListener(
  'click',
  e => {
    const b = e.target.closest && e.target.closest('[data-qo459]');
    if (!b || b.disabled) return;
    e.preventDefault();
    e.stopPropagation();
    const q = QO459.find(x => x.id === b.dataset.qo459),
      S = qoSt459();
    if (!q || S.done[q.id] || badgeCount459() < q.min || !qoOk459(q)) return;
    const tm = q.in.ct ? tmPos459() : null;
    add455(qoIn459(q), -1);
    if (tm) add455({ [tm]: 1 }, -1);
    const r = q.rew;
    reward454({ m: r.m, g: r.g, b: r.b });
    let extra = '';
    if (r.item) {
      if (PROFILE.items.includes(r.item)) PROFILE.money += 2500;
      else PROFILE.items = [...PROFILE.items, r.item];
      extra = ITEMS2[r.item].n;
    }
    if (r.ct) {
      const pool = tmKeys455().filter(k => !bagN(k)),
        all = pool.length ? pool : tmKeys455(),
        k = all[seed417('qo' + q.id) % all.length];
      PROFILE.bag[k] = Math.min(99, bagN(k) + 1);
      extra = (extra ? extra + ' + ' : '') + SHOP[k].n;
    }
    S.done[q.id] = 1;
    localStorage.setItem('res-qo459', JSON.stringify(S));
    sfx('win');
    vibe(25);
    toast(`${q.qui} : merci ! ${extra || txt454({ m: r.m, g: r.g, b: r.b })}`);
    savePurse();
    renderBag();
  },
  true
);


/* ---------- trophy box ---------- */
TROPH459 = [
  { id: 't1', t: 'Collection d’objets tenus', n: 5, v: () => PROFILE.items.length, g: 1 },
  { id: 't2', t: 'Collection d’objets tenus', n: 10, v: () => PROFILE.items.length, g: 2 },
  { id: 't3', t: 'Collection d’objets tenus', n: 20, v: () => PROFILE.items.length, g: 4 },
  { id: 't4', t: 'CT et CS vues', n: 10, v: () => viewsCT459(), g: 1 },
  { id: 't5', t: 'CT et CS vues', n: 25, v: () => viewsCT459(), g: 2 },
  { id: 't6', t: 'CT et CS vues', n: 40, v: () => viewsCT459(), g: 4 },
  { id: 't7', t: 'Quêtes d’objets', n: 3, v: () => Object.keys(qoSt459().done).length, g: 1 },
  { id: 't8', t: 'Quêtes d’objets', n: 6, v: () => Object.keys(qoSt459().done).length, g: 2 },
  { id: 't9', t: 'Quêtes d’objets', n: 10, v: () => Object.keys(qoSt459().done).length, g: 5 },
  { id: 't10', t: 'Cadeaux du jour d’affilée', n: 7, v: () => cdSt455().n, g: 3 }
];


document.addEventListener(
  'click',
  e => {
    const b = e.target.closest && e.target.closest('[data-tp459]');
    if (!b || b.disabled) return;
    e.preventDefault();
    e.stopPropagation();
    const T = TROPH459.find(x => x.id === b.dataset.tp459),
      S = tpSt459();
    if (!T || S[T.id] || T.v() < T.n) return;
    S[T.id] = 1;
    localStorage.setItem('res-tp459', JSON.stringify(S));
    reward454({ g: T.g });
    sfx('win');
    vibe(25);
    toast(`Trophée : +${T.g} Éclat${T.g > 1 ? 's' : ''}`);
    savePurse();
    renderBag();
  },
  true
);

}
