/* Section d'origine : 4.60 : boss à phases, lieux secrets, PNJ itinérants */

import { TOD } from './017-home-route.js';
import { say } from './021-combat-engine.js';
import { B } from './024-combat-ui.js';
import { writeLS, readLS, mulberry32 } from './014-utils.js';
import { sfx, vibe } from './026-campaign-tutorial-sound.js';
import { leaderOf, overlay } from './030-prestige-staging.js';
import { shut, updateTemp } from '../screens/overlays/tempStore.js';
import { V4, savePurse, today } from './032-v4-foundation.js';
import { renderMap } from './037-map.js';
import { placesR } from './054-johto.js';
import { weatherDay417 } from './057-companions-resonance.js';
import { bossOf420, bossPhases420 } from './060-intense-combat.js';
import { reward454, can454, txt454 } from './084-peddler-route-missions.js';
import { badgeCount459 } from './090-item-quests-trophies.js';

export let SECRETS460;


/** Un Champion d’arène (boss sans phases) se déchaîne sous 50 % de PV. */
export function rage460(S, ev) {
  const b = bossOf420(S);
  if (b && !b.ko && !S.over && !bossPhases420(S) && !b.gym460 && leaderOf(S.sc) && b.hp / b.mhp <= 0.5) {
    b.gym460 = 1;
    b.boost = Math.max(b.boost || 0, 1);
    b.guard = Math.max(b.guard || 0, 1);
    say(ev, `${b.n} se déchaîne : dernière ligne droite ! ${repl460(b, 0)}`);
    ev.push({ e: 'arena', r: 'phase2' });
  }
}


/** Ligne de la fiche adverse : phase du boss, ou rage du Champion. */
export function resoBoss460(e) {
  if (!B || e.ko || e !== bossOf420(B)) return '';
  if (bossPhases420(B)) {
    const ph = e.phase420 || 1;
    return `<p class="bp-reso">${ph >= 3 ? 'Phase 3 : dernier souffle.' : ph === 2 ? 'Phase 2 : renforcé. La phase 3 arrive sous 33 % de PV.' : 'Phase 1. La phase 2 arrive sous 66 % de PV.'}</p>`;
  }
  if (leaderOf(B.sc)) return `<p class="bp-reso">${e.gym460 ? 'Il se déchaîne : renforcé.' : 'Il se déchaînera sous 50 % de PV.'}</p>`;
  return '';
}


export function repl460(b, i) {
  const t = (b.t && b.t[0]) || 'Normal',
    a = REPL460[t] || REPL460.Normal;
  return a[i] || a[0];
}


function pos460(seed, taken) {
  const r = rngS460(seed),
    pl = placesR().concat(taken || []);
  let x = 0,
    y = 0;
  for (let k = 0; k < 24; k++) {
    x = 70 + r() * 860;
    y = 90 + r() * 800;
    if (pl.every(p => Math.hypot(p.x - x, p.y - y) > 80)) break;
  }
  return { x, y };
}


export function scPos460() {
  const reg = V4.region || 'kanto',
    out = {},
    taken = [];
  SECRETS460.forEach(s => {
    const p = pos460('sc' + reg + s.id, taken);
    out[s.id] = p;
    taken.push(p);
  });
  return out;
}


function scOpen460(id) {
  const s = SECRETS460.find(x => x.id === id);
  if (!s) return;
  const st = scSt460(),
    first = !st.found[id];
  if (first) {
    st.found[id] = 1;
    writeLS('res-sc460', st);
    reward454(s.rew);
    savePurse();
    sfx('win');
    vibe([30, 40, 30]);
  }
  // rendu : src/screens/overlays/temporaires/Fenetres.jsx (Sc460)
  const o = overlay('sc460', { n: s.n, lore: s.lore, msg: first ? 'Vous trouvez : ' + txt454(s.rew) + '.' : 'Vous avez déjà exploré ce lieu.' });
  o.addEventListener('click', e => {
    if (e.target === o) shut('sc460');
  });
  renderMap();
}


export function pnSt460() {
  const d = today(),
    reg = V4.region || 'kanto',
    all = readLS('res-pn460', {});
  const k = reg;
  let s = all[k];
  if (!s || s.d !== d) {
    s = { d, done: false };
    all[k] = s;
    writeLS('res-pn460', all);
  }
  const r = rngS460('pn' + d + reg);
  s.i = Math.floor(r() * PNJ460.length);
  return { s, all, k };
}


export function pnPos460() {
  const d = today(),
    reg = V4.region || 'kanto',
    sc = Object.values(scPos460());
  return pos460('pnp' + d + reg, sc);
}


function pnOpen460() {
  const { s } = pnSt460(),
    N = PNJ460[s.i];
  const c = N.c.map(c => {
    const eff = c.cost ? 'Coût : ' + txt454(c.cost) : '';
    return { l: c.l, ok: can454(c.cost), eff: eff || null };
  });
  // rendu : src/screens/overlays/temporaires/Fenetres.jsx (Pn460)
  const o = overlay('pn460', { n: N.n, x: N.x, c, res: null });
  o.addEventListener('click', e => {
    if (e.target === o) shut('pn460');
  });
}


function pnPick460(j) {
  const { s, all, k } = pnSt460(),
    N = PNJ460[s.i],
    c = N.c[j];
  if (!c || s.done || !can454(c.cost)) return;
  if (c.cost) reward454(c.cost);
  if (c.ok) reward454(c.ok);
  all[k] = { d: s.d, done: true };
  writeLS('res-pn460', all);
  savePurse();
  sfx(c.ok ? 'ui' : 'hit');
  vibe(20);
  updateTemp('pn460', { res: c.t + (c.ok ? ' (' + txt454(c.ok) + ')' : '') });
  renderMap();
}


/* ---------- 5. Marqueurs (src/screens/carte/Marks.jsx), clics, Journal ---------- */

/* ---------- 1. Boss : répliques et phase de Champion d’arène ---------- */
const REPL460 = {
  Feu: ['« Mes flammes ne s’éteignent jamais ! »', '« Brûlez avec moi ! »'],
  Eau: ['« La marée monte, tenez bon si vous le pouvez ! »', '« Le déluge ne s’arrête pas ! »'],
  Plante: ['« Mes racines tiennent ce terrain ! »', '« La forêt ne recule pas ! »'],
  Électrik: ['« Ça vient de s’allumer ! »', '« Tous les circuits à fond ! »'],
  Glace: ['« Le froid fige les meilleurs plans. »', '« Un blizzard de plus ! »'],
  Combat: ['« Vous me poussez enfin à bout ! »', '« Un vrai combat commence ! »'],
  Poison: ['« Le venin agit lentement… »', '« Respirez, c’est le dernier souffle ! »'],
  Sol: ['« La terre gronde sous vos pieds ! »', '« Rien ne peut me déraciner ! »'],
  Vol: ['« Plus haut, plus vite ! »', '« Le ciel est à moi ! »'],
  Psy: ['« Je lis déjà votre prochain coup. »', '« Mon esprit ne vacille pas ! »'],
  Insecte: ['« L’essaim se réveille ! »', '« Vous ne verrez pas venir la suite ! »'],
  Roche: ['« Solide comme le roc ! »', '« Je ne céderai pas ! »'],
  Spectre: ['« Vous ne verrez que mon ombre… »', '« Vous ne m’échapperez pas ! »'],
  Dragon: ['« Le dragon se réveille ! »', '« Voici ma vraie puissance ! »'],
  Ténèbres: ['« Voilà où les ombres vous attendent. »', '« Je n’ai pas dit mon dernier mot ! »'],
  Acier: ['« L’acier plie, il ne rompt pas ! »', '« Rien ne perce ma garde ! »'],
  Fée: ['« La magie prend le dessus ! »', '« Vous allez voir de quoi je suis capable ! »'],
  Normal: ['« Je me suis assez retenu ! »', '« Maintenant, c’est sérieux ! »']
};


/* ---------- 2. Outils de carte ---------- */
const hash460 = s => {
  let h = 7;
  for (const ch of s) h = (Math.imul(h, 31) + ch.charCodeAt(0)) >>> 0;
  return h;
};


const rngS460 = s => mulberry32(hash460(s) || 1);


/* ---------- 3. Lieux secrets ---------- */
const weatherS460 = () => {
  try {
    return weatherDay417();
  } catch (e) {
    return null;
  }
};


export const scSt460 = () => readLS('res-sc460', { found: {} });


export const scVis460 = () => SECRETS460.filter(s => badgeCount459() >= s.min && s.ok());


/* ---------- 4. PNJ itinérants ---------- */
export const PNJ460 = [
  { n: 'Marchand de passage', x: 'Il ouvre sa malle : « Pour 300 ₽, je vous cède un morceau de roche brillante. »', c: [{ l: 'Acheter (300 ₽)', cost: { m: -300 }, ok: { g: 1 }, t: 'Vous repartez avec un éclat.' }, { l: 'Refuser poliment', t: 'Il hausse les épaules et reprend sa route.' }] },
  { n: 'Vieux randonneur', x: 'Il vous raconte une légende sur la Résonance autour d’un thé tiède.', c: [{ l: 'Écouter jusqu’au bout', ok: { m: 250 }, t: 'En remerciement, il vous glisse quelques pièces.' }, { l: 'Poursuivre', t: 'Vous le saluez et repartez.' }] },
  { n: 'Jeune dresseuse', x: 'Elle cherche un partenaire d’entraînement : « Une Potion pour moi, et je partage mes trouvailles ! »', c: [{ l: 'Donner une Potion', cost: { b: { potion: -1 } }, ok: { g: 2 }, t: 'Elle vous confie deux éclats trouvés sur la route.' }, { l: 'Plus tard', t: 'Elle vous souhaite bonne chance.' }] },
  { n: 'Pêcheur solitaire', x: 'Sa canne est cassée, mais sa boîte d’appâts déborde.', c: [{ l: 'Lui offrir une Poké Ball', cost: { b: { poke: -1 } }, ok: { m: 700 }, t: 'Il vous paie généreusement ce qu’il a pêché.' }, { l: 'Passer', t: 'Vous le laissez à ses lignes.' }] },
  { n: 'Chercheuse errante', x: 'Elle note les variations de Résonance : « Un Antidote m’aiderait à terminer ce relevé. »', c: [{ l: 'Donner un Antidote', cost: { b: { antidote: -1 } }, ok: { g: 2, m: 150 }, t: 'Elle partage ses résultats et vous remercie.' }, { l: 'Passer', t: 'Elle reprend ses notes.' }] },
  { n: 'Cuisinier ambulant', x: 'Une odeur de soupe flotte. « Un bol chaud avant la prochaine route ? »', c: [{ l: 'Accepter (100 ₽)', cost: { m: -100 }, ok: { b: { baiemepo: 1 } }, t: 'Il glisse une baie dans votre sac pour la route.' }, { l: 'Non merci', t: 'Il sourit et range sa marmite.' }] },
  { n: 'Dresseur voyageur', x: 'Il a perdu son chemin : « Montrez-moi la direction et je vous récompense. »', c: [{ l: 'L’indiquer', ok: { m: 400 }, t: 'Il vous donne une petite somme et s’éloigne.' }, { l: 'Poursuivre', t: 'Il cherchera tout seul.' }] },
  { n: 'Archiviste curieuse', x: 'Elle collectionne les légendes des routes : « Parlez-moi de votre aventure, je vous offre un souvenir. »', c: [{ l: 'Raconter', ok: { g: 3 }, t: 'Elle note tout et vous offre trois éclats.' }, { l: 'Pas aujourd’hui', t: 'Elle range son carnet.' }] }
];

// Instructions exécutées au démarrage, dans l'ordre d'origine (voir index.js).
export function __init() {

SECRETS460 = [
  { id: 's1', n: 'Source de la Lune', ind: 'Se révèle la nuit.', min: 0, ok: () => TOD === 'nuit', lore: 'Une eau claire coule sous les étoiles. Les anciens disaient que les premières notes de la Résonance y ont été entendues.', rew: { g: 3 } },
  { id: 's2', n: 'Clairière du Matin', ind: 'Se révèle le matin.', min: 0, ok: () => TOD === 'matin', lore: 'La rosée perle sur les baies. Quelqu’un a laissé là un panier, comme une offrande pour les dresseurs de passage.', rew: { b: { baiemepo: 2 } } },
  { id: 's3', n: 'Crique des Marées', ind: 'Se révèle sous la pluie, après le 1er badge.', min: 1, ok: () => weatherS460() === 'pluie', lore: 'La pluie dévoile un passage vers une crique. Une vieille caisse échouée contient de quoi payer un voyage.', rew: { m: 1200 } },
  { id: 's4', n: 'Dune Dorée', ind: 'Se révèle au soleil ou sous le sable, après le 2e badge.', min: 2, ok: () => ['soleil', 'sable'].includes(weatherS460()), lore: 'Entre deux dunes, un cercle de pierres brille. Des éclats y dorment depuis des siècles.', rew: { g: 4 } },
  { id: 's5', n: 'Cime Gelée', ind: 'Se révèle sous la grêle, après le 3e badge.', min: 3, ok: () => weatherS460() === 'grele', lore: 'Un refuge gelé, une lanterne encore tiède. Un randonneur y a laissé ses réserves de soins.', rew: { b: { superpotion: 3 }, m: 600 } },
  { id: 's6', n: 'Ruine de la Résonance', ind: 'Se révèle en journée, après le 4e badge.', min: 4, ok: () => TOD === 'jour', lore: 'Les murs gravés racontent la Dissonance, ce silence qui efface les notes. Au centre, un éclat de Résonance pur vibre encore.', rew: { g: 6 } }
];


// lieux secrets (.sc460) et personnage de passage (.pn460) sur la carte : rendus par React
// (src/screens/carte/Marks.jsx)


document.addEventListener(
  'click',
  e => {
    const t = e.target.closest && e.target.closest('[data-sc460],[data-pn460]');
    if (!t) return;
    e.stopPropagation();
    e.preventDefault();
    if (t.dataset.sc460 !== undefined) {
      const v = t.dataset.sc460;
      if (v === 'close') shut('sc460');
      else scOpen460(v);
    } else {
      const v = t.dataset.pn460;
      if (v === 'close') shut('pn460');
      else if (v === 'o') pnOpen460();
      else pnPick460(+v);
    }
  },
  true
);


// panneau « Lieux secrets » : rendu par React (src/screens/settings/panels/LieuxSecrets.jsx)

}
