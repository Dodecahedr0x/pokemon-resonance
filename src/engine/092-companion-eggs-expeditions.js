/* Original section: 4.61: companion, breeding eggs, expeditions */

import { BY, MON, SCEN } from './009-pokemon.js';
import { ITEMS2, PROFILE } from './011-game-state.js';
import { writeLS, readLS, medal, toast } from './014-utils.js';
import { HOOKS } from './015-hooks.js';
import { sfx, vibe } from './026-campaign-tutorial-sound.js';
import { overlay } from './030-prestige-staging.js';
import { shut } from '../screens/overlays/tempStore.js';
import { SHOP, bagN, savePurse, today } from './032-v4-foundation.js';
import { renderBag } from './039-quests-shop.js';
import { DESTINATIONS, renderCampBase } from './049-identity.js';
import { hearts417, companionGain417, companionId417 } from './057-companions-resonance.js';
import { refreshHome } from '../screens/home/homeStore.js';
import { reward454, can454, rng454, txt454 } from './084-peddler-route-missions.js';
import { tmKeys455 } from './088-workshop-recipes.js';
import { badgeCount459 } from './090-item-quests-trophies.js';

let SCN461;
export { EGG461, egSt461, egPool461 }; // read by Shop › Eggs (React, src/screens/bag/Workshop.jsx)


/** Companion's Berry, Gift and Memories buttons (.cp461 in #v4Comp, rendering: src/screens/home/Companion.jsx). */
export function cp461Data() {
  const id = companionId417();
  if (!id) return null;
  const h = hearts417((PROFILE.comp && PROFILE.comp.aff) || 0),
    st = cpSt461();
  return { h, feed: st.feed, gift: st.gift, baie: bagN('baiemepo') > 0, isNew: h > (st.seen[id] || 0) };
}


function keepsakeOpen461() {
  const id = companionId417();
  if (!id) return;
  const m = BY[id],
    h = hearts417((PROFILE.comp && PROFILE.comp.aff) || 0),
    st = cpSt461();
  st.seen[id] = h;
  cpSave461(st);
  // one memory per heart (null: not unlocked yet); rendering: transients/Windows.jsx (Souv461)
  const rows = [1, 2, 3, 4, 5].map(i => (i <= h ? scene461(m, i) : null));
  const o = overlay('souv461', { n: m.n, rows });
  o.addEventListener('click', e => {
    if (e.target === o) shut('souv461');
  });
  refreshHome();
}


function egBuy461(k) {
  const O = EGG461[k],
    s = egSt461();
  if (!O || s.list.length >= 3 || !can454(O.cost) || !egPool461().length) return;
  reward454(O.cost);
  s.list.push({ k, left: O.batt, tot: O.batt });
  writeLS('res-eg461', s);
  sfx('ui');
  vibe(25);
  toast(`${O.n} acheté. Il éclora après ${O.batt} combats.`);
  savePurse();
  try {
    renderBag();
  } catch { /* Best effort: failure here is non-fatal. */ }
}


function egHatch461(e) {
  const pool = egPool461();
  if (!pool.length) return null;
  const O = EGG461[e.k],
    m = pool[Math.floor(Math.random() * pool.length)];
  PROFILE.box.push(m.id);
  if (!PROFILE.dex.includes(m.id)) PROFILE.dex.push(m.id);
  let sh = false;
  if (O.sh && Math.random() < O.sh && PROFILE.shiny && !PROFILE.shiny.includes(m.base)) {
    PROFILE.shiny.push(m.base);
    sh = true;
  }
  return { id: m.id, sh };
}


// Shop › Eggs: rendered by React (src/screens/bag/Workshop.jsx)

/** Return of expedition x (already cashed in by retrieve): a short tale, and sometimes a rare find. */
export function story461(x) {
  const D = DESTINATIONS[x.destinationId],
    h = HIST461[x.destinationId] || [],
    m = BY[x.id],
    hist = h.length ? `${m.n} ${h[Math.floor(Math.random() * h.length)]}.` : '';
  let rare = '';
  if (Math.random() < (x.ideal ? 0.35 : 0.12)) {
    const v = Math.random();
    if (v < 0.4) {
      PROFILE.gems += 3;
      rare = '3 Éclats rares';
    } else if (v < 0.7) {
      const lib = Object.keys(ITEMS2).filter(k => !PROFILE.items.includes(k));
      if (lib.length) {
        const k = lib[Math.floor(Math.random() * lib.length)];
        PROFILE.items.push(k);
        rare = `l’objet « ${ITEMS2[k].n} »`;
      } else {
        PROFILE.money += 1500;
        rare = '1 500 ₽';
      }
    } else {
      const pool = tmKeys455().filter(k => !bagN(k)),
        all = pool.length ? pool : tmKeys455();
      if (all.length) {
        const k = all[Math.floor(Math.random() * all.length)];
        PROFILE.bag[k] = Math.min(99, bagN(k) + 1);
        rare = `une CT : ${SHOP[k].n}`;
      }
    }
  }
  if (rare || hist) {
    sfx(rare ? 'win' : 'ui');
    toast(`${D.n} : ${hist}${rare ? ' Trouvaille rare : ' + rare + ' !' : ''}`);
  }
  savePurse();
  renderCampBase();
}

const jd461 = () => {
  try {
    return today();
  } catch (e) {
    return '';
  }
};


/* ---------- 1. Companion: memories, berry, gift ---------- */
const ACT461 = {
  Normal: ['se roule dans l’herbe à vos pieds', 'veille sur votre sac sans jamais le quitter des yeux'],
  Feu: ['fait danser une petite flamme au bout de sa queue', 'réchauffe vos mains par une nuit froide'],
  Eau: ['vous éclabousse d’une gerbe d’eau claire', 'vous guide jusqu’à une source cachée'],
  Plante: ['fait pousser une fleur au creux de votre main', 'étend ses feuilles au-dessus de vous pour vous abriter de la pluie'],
  Électrik: ['fait crépiter des étincelles autour de vous', 'allume votre lanterne d’un éclair tout doux'],
  Glace: ['dépose un flocon sur votre épaule', 'fige la rosée pour dessiner un petit sentier'],
  Combat: ['s’entraîne à vos côtés dès l’aube', 'vous protège d’un bras ferme quand la route devient raide'],
  Poison: ['garde ses distances, puis s’approche timidement', 'repère les baies dangereuses avant vous'],
  Sol: ['creuse un petit trou pour vous ramener un caillou brillant', 'sent la terre trembler avant tout le monde'],
  Vol: ['plane en cercles au-dessus de vous', 'vous montre le chemin depuis le ciel'],
  Psy: ['devine ce que vous allez dire avant même que vous parliez', 'fait flotter votre carnet pour vous l’apporter'],
  Insecte: ['dépose une feuille bien pliée à vos pieds', 'tisse un fil fin entre votre sac et son perchoir'],
  Roche: ['reste immobile comme un rocher pour vous laisser vous asseoir', 'protège le feu de camp de son corps'],
  Spectre: ['apparaît soudain derrière vous en riant', 'veille à vos côtés quand la nuit est trop noire'],
  Dragon: ['déploie ses ailes pour vous faire de l’ombre', 'pousse un cri qui fait trembler la forêt, rien que pour vous'],
  Ténèbres: ['vous observe de loin, puis s’approche en silence', 'surveille la route dans l’ombre pour que vous dormiez tranquille'],
  Acier: ['fait briller son corps au soleil', 'tient bon face au vent qui emporte votre tente'],
  Fée: ['sème une poussière brillante autour de vous', 'chante une mélodie qui apaise toute la clairière']
};


const scene461 = (m, h) => {
  const a = ACT461[(m.t && m.t[0]) || 'Normal'] || ACT461.Normal;
  return SCN461[h - 1](m.n, a);
};


const cpSt461 = () => {
  const s = readLS('res-cp461', {});
  if (s.d !== jd461()) {
    s.d = jd461();
    s.feed = 0;
    s.gift = 0;
  }
  s.seen = s.seen || {};
  return s;
};


const cpSave461 = s => writeLS('res-cp461', s);


const cpGift461 = (h, m) => {
  const r = rng454('cp461' + m.id);
  const v = r();
  if (h >= 5 && v < 0.3) return { g: 1 };
  if (v < 0.55) return { m: 150 + Math.floor(r() * 150) };
  if (v < 0.8) return { b: { potion: 1 } };
  return { b: { poke: 1 } };
};


/* ---------- 2. Breeding eggs ---------- */
const EGG461 = {
  mys: { n: 'Œuf mystère', cost: { m: -1500 }, price: '1 500 ₽', batt: 5, sh: 0, d: 'Une famille que vous n’avez pas encore. Éclot après 5 combats.' },
  rare: { n: 'Œuf rare', cost: { g: -6 }, price: '6 Éclats', batt: 8, sh: 0.15, d: 'Une famille inconnue, avec 15 % de chance d’un Pokémon chromatique. Éclot après 8 combats.' }
};


const egSt461 = () => {
  const s = readLS('res-eg461', { list: [], n: 0 });
  s.list = Array.isArray(s.list) ? s.list : [];
  return s;
};


const egPool461 = () => MON.filter(m => m.st === 1 && !m.leg && !m.isEnemy && m.base === m.id && !PROFILE.box.includes(m.id));


const HIST461 = {
  foret: ['a suivi un sentier couvert de mousse', 'a trouvé un tronc creux plein de baies'],
  lac: ['a longé les berges glacées', 'a repéré un reflet étrange au fond de l’eau'],
  grotte: ['a exploré une galerie étroite', 'a creusé près d’un filon brillant'],
  tour: ['a gravi des marches brûlées par le temps', 'a senti une présence au dernier étage'],
  plage: ['a couru sur le sable à marée basse', 'a trouvé un coffre rejeté par les vagues'],
  mont: ['a affronté le vent glacial en haut du col', 'a découvert un refuge oublié dans la neige'],
  ruines: ['a déchiffré des gravures très anciennes', 'a ressenti la Résonance vibrer dans les pierres']
};


export const lock461 = D => (D.min || 0) > badgeCount459();

// Instructions run at startup, in the original order (see index.js).
export function __init() {

SCN461 = [
  (n, a) => `${n} reste près de vous et ${a[0]}. C’est sa façon de vous dire bonjour.`,
  (n, a) => `Un soir, ${n} ${a[1]}. Vous comprenez qu’il commence à vous faire confiance.`,
  (n, a) => `Au détour d’un chemin, ${n} s’arrête et vous regarde. Puis il ${a[0]}, comme pour vous dire qu’il est là.`,
  (n, a) => `Pendant une longue marche, ${n} ${a[1]}. Il ne cherche plus à se cacher : il vous a choisi.`,
  (n, a) => `Après tous ces combats, ${n} ${a[0]}, puis se blottit contre vous. Vous n’avez plus besoin de mots : vous formez un duo inséparable.`
];


document.addEventListener(
  'click',
  e => {
    const b = e.target.closest && e.target.closest('[data-cp461]');
    if (!b) return;
    e.stopPropagation();
    e.preventDefault();
    const k = b.dataset.cp461,
      id = companionId417();
    if (k === 'close') return shut('souv461');
    if (!id || b.disabled) return;
    const m = BY[id],
      st = cpSt461();
    if (k === 'souv') return keepsakeOpen461();
    if (k === 'baie' && !st.feed && bagN('baiemepo') > 0) {
      PROFILE.bag.baiemepo = bagN('baiemepo') - 1;
      st.feed = 1;
      cpSave461(st);
      const up = companionGain417(5);
      sfx('ui');
      vibe(25);
      toast(up ? `${m.n} adore cette baie : ${up} cœur${up > 1 ? 's' : ''} !` : `${m.n} croque la baie avec bonheur : +5 d’affection.`);
      savePurse();
      refreshHome();
    } else if (k === 'cadeau') {
      const h = hearts417((PROFILE.comp && PROFILE.comp.aff) || 0);
      if (h < 3 || st.gift) return;
      const g = cpGift461(h, m);
      st.gift = 1;
      cpSave461(st);
      reward454(g);
      sfx('win');
      vibe([20, 30, 20]);
      toast(`${m.n} vous rapporte un cadeau : ${txt454(g)}.`);
      savePurse();
      refreshHome();
    }
  },
  true
);


HOOKS.progress.unshift((S, rew) => {
  try {
    const D = SCEN[S.sc] || {};
    if (D.tuto) return null;
    const s = egSt461();
    if (!s.list.length) return null;
    const out = [],
      keep = [];
    s.list.forEach(e => {
      e.left -= 1;
      if (e.left <= 0) {
        const r = egHatch461(e);
        if (r) out.push(r);
        else {
          const O = EGG461[e.k];
          reward454({ m: O.cost.m ? -O.cost.m : 0, g: O.cost.g ? -O.cost.g : 0 });
        }
      } else keep.push(e);
    });
    s.list = keep;
    s.n += out.length;
    writeLS('res-eg461', s);
    if (out.length) rew.eg461 = out;
  } catch { /* Best effort: failure here is non-fatal. */ }
  return null;
});


HOOKS.battleResult.unshift(r => {
  if (!r.eg461) return '';
  return r.eg461
    .map(x => `<div class="res-l"><h4>Élevage</h4><div class="rl">${medal(BY[x.id].t)}<span>Un œuf a éclos : ${BY[x.id].n}${x.sh ? ' chromatique !' : ''} rejoint votre Box !</span><b>🥚</b></div></div>`)
    .join('');
});


document.addEventListener(
  'click',
  e => {
    const b = e.target.closest && e.target.closest('[data-eg461]');
    if (!b || b.disabled) return;
    e.stopPropagation();
    e.preventDefault();
    egBuy461(b.dataset.eg461);
  },
  true
);




/* ---------- 3. Expeditions: new places and rare finds ---------- */
Object.assign(DESTINATIONS, {
  plage: { n: 'Plage des Marées', types: ['Eau', 'Vol', 'Normal', 'Roche'], duration: 4, m: [250, 450], g: [1, 3], obj: ['superpotion', 'super'], min: 1 },
  mont: { n: 'Mont Silence', types: ['Combat', 'Roche', 'Glace', 'Acier'], duration: 7, m: [500, 900], g: [3, 6], obj: ['hyper', 'superpotion'], min: 3 },
  ruines: { n: 'Ruines Anciennes', types: ['Psy', 'Spectre', 'Dragon', 'Fée'], duration: 8, m: [600, 1000], g: [4, 8], obj: ['hyper'], min: 5 }
});


// locked places in the expedition window: rendered by React (src/screens/overlays/ExpBox.jsx, lock461)


}
