/* Balls, healing, battle items, held items and extra TMs (added in v4.56). */

import { MOVES } from '../data/moves.js';
import { SCENARIOS } from '../pokemon/pokemon.js';
import { HELD_ITEMS } from '../state/game-state.js';
import { HOOKS } from '../core/hooks.js';
import { timeOfDay } from '../world/home-route.js';
import { MAX_ENERGY, parseCellKey, rewardIn, hasNx, heal, pushMessage, typeEffectiveness } from '../combat/engine.js';
import { immobilize } from '../combat/items-bonds-ai.js';
import { BALLS } from './ball-choice.js';
import { HEALS } from './battle-potions.js';
import { HELD_IMG, SHOP } from '../state/economy.js';
import { ITEM_ICONS } from '../assets/item-icons.js';
import { DAMAGE_PROVIDERS } from '../combat/tactical-engine.js';
import { MACHINES } from '../moves/tms.js';
import { COMBAT_ITEMS, HELD_SHOP, hasXp, freeTileFor, koAllyOf } from '../combat/resonance.js';

/* ---------- icons ---------- */
const ICON_STROKE = '#1b1b22';

const ballIcon = (top, bot, extra) =>
  `<circle cx="24" cy="24" r="17" fill="${bot}" stroke="${ICON_STROKE}" stroke-width="2"/><path d="M7 24a17 17 0 0 1 34 0z" fill="${top}" stroke="${ICON_STROKE}" stroke-width="2"/><path d="M7 24h34" stroke="${ICON_STROKE}" stroke-width="3"/><circle cx="24" cy="24" r="5" fill="#fff" stroke="${ICON_STROKE}" stroke-width="2"/>${extra || ''}`;

const flaskIcon = (c, c2) =>
  `<path d="M19 7h10v6l6 9v16a4 4 0 0 1-4 4H17a4 4 0 0 1-4-4V22l6-9z" fill="${c}" stroke="${ICON_STROKE}" stroke-width="2" stroke-linejoin="round"/><rect x="18" y="4" width="12" height="5" rx="2" fill="${c2}" stroke="${ICON_STROKE}" stroke-width="2"/><path d="M17 27h14" stroke="#fff" stroke-width="2.5" opacity=".7"/>`;

export const berryIcon = c =>
  `<circle cx="24" cy="27" r="14" fill="${c}" stroke="${ICON_STROKE}" stroke-width="2"/><path d="M24 13c1-5 5-7 10-7-2 4-5 6-10 7z" fill="#5cb85c" stroke="#2f6b2f" stroke-width="2"/><circle cx="19" cy="22" r="3.5" fill="#fff" opacity=".5"/>`;

export const orbIcon = (c, g) =>
  `<circle cx="24" cy="25" r="15" fill="${c}" stroke="${ICON_STROKE}" stroke-width="2"/><circle cx="18" cy="19" r="4" fill="#fff" opacity=".45"/>${g || ''}`;

export const wrapSvg = s =>
  'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">${s}</svg>`);

/* ---------- Balls ---------- */
const isNightTime = S => ((SCENARIOS[S.sc] || {}).time || timeOfDay) === 'nuit';

const isWaterOrBug = e => e.t.includes('Eau') || e.t.includes('Insecte');

export const BALL_CAPTURE_CHECKS = {};

/* ---------- held items ---------- */
const TYPE_ITEMS = {
  charbon: 'Feu',
  eaumystique: 'Eau',
  graine: 'Plante',
  aimantelec: 'Électrik',
  glaceeternelle: 'Glace',
  ceintnoire: 'Combat',
  cuiller: 'Psy',
};

const HELD_ITEM_ICONS = {
  'quick-ball': ballIcon(
    '#3b8be8',
    '#f4f4f4',
    '<path d="M27 8l-7 9h6l-4 8" fill="none" stroke="#ffd45b" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>'
  ),
  'dusk-ball': ballIcon(
    '#2d2d3d',
    '#7b7b86',
    '<circle cx="15" cy="15" r="2" fill="#ffd45b"/><circle cx="33" cy="15" r="2" fill="#ffd45b"/><circle cx="24" cy="10" r="2" fill="#ffd45b"/>'
  ),
  'net-ball': ballIcon(
    '#3fb59a',
    '#f4f4f4',
    '<path d="M12 14l24 8M16 10l20 14M12 22l20-12" stroke="#0e4a3e" stroke-width="1.4" opacity=".7"/>'
  ),
  'weak-ball': ballIcon(
    '#f08fb0',
    '#f4f4f4',
    '<path d="M24 8v9m-4-4l4 4 4-4" fill="none" stroke="#7b2d58" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>'
  ),
  'hyper-potion': flaskIcon('#f2994a', '#f2d45c'),
  'ice-heal': flaskIcon('#8fd9ff', '#f2f2f2'),
  antidote: flaskIcon('#b57be8', '#f2f2f2'),
  'mepo-berry': berryIcon('#f2d45c'),
  'jelly-res': orbIcon(
    '#f59ac0',
    '<path d="M24 14l3 8 8 1-6 5 2 8-7-5-7 5 2-8-6-5 8-1z" fill="#fff3b0" stroke="#7b2d58" stroke-width="1.5"/>'
  ),
  'max-revive': `<path d="M24 4l14 20-14 20-14-20z" fill="#ffd45b" stroke="#8a6d0f" stroke-width="2" stroke-linejoin="round"/><path d="M24 11l8 13-8 13" fill="#fff3b0" opacity=".7"/><circle cx="24" cy="24" r="4" fill="#fff"/>`,
  charcoal: orbIcon('#3a3a3f', '<path d="M24 15c4 4 5 8 2 12-1 2-4 2-5 0-2-3-1-7 3-12z" fill="#ff7a2f"/>'),
  'mystic-water': orbIcon('#43a3ff', '<path d="M24 14c4 6 6 9 4 13-1 2-7 2-8 0-2-4 0-7 4-13z" fill="#d8f0ff"/>'),
  'miracle-seed': orbIcon('#58b85a', '<path d="M24 14c6 2 8 8 4 13-5 0-9-4-4-13z" fill="#e5ffd0"/>'),
  magnet: `<path d="M10 12h10v18a4 4 0 0 0 8 0V12h10v18a14 14 0 0 1-28 0z" fill="#e5484d" stroke="${ICON_STROKE}" stroke-width="2" stroke-linejoin="round"/><path d="M10 12h10v7H10zM28 12h10v7H28z" fill="#dfe6ee" stroke="${ICON_STROKE}" stroke-width="2"/>`,
  'never-melt-ice': orbIcon(
    '#a9e7ff',
    '<path d="M24 14v22M14 25h20M17 17l14 16M31 17L17 33" stroke="#fff" stroke-width="2" opacity=".8"/>'
  ),
  'black-belt': `<path d="M4 19h40v10H4z" fill="#1d1d24" stroke="#000" stroke-width="2"/><rect x="18" y="15" width="12" height="18" rx="3" fill="#c9c9d1" stroke="#000" stroke-width="2"/>`,
  'twisted-spoon': `<path d="M30 6a8 10 20 1 1-14 8c2 3 5 4 8 5l-12 22" fill="none" stroke="#c9b6ff" stroke-width="4" stroke-linecap="round"/>`,
  'wise-glasses': `<circle cx="15" cy="26" r="9" fill="#d8f0ff" stroke="${ICON_STROKE}" stroke-width="3"/><circle cx="33" cy="26" r="9" fill="#d8f0ff" stroke="${ICON_STROKE}" stroke-width="3"/><path d="M24 26h0M6 24l-2-8M42 24l2-8" stroke="${ICON_STROKE}" stroke-width="3"/>`,
  'iron-vest': `<path d="M12 8l6 4h12l6-4 4 8-4 6v20H12V22l-4-6z" fill="#8fa4b5" stroke="${ICON_STROKE}" stroke-width="2" stroke-linejoin="round"/><path d="M24 12v32" stroke="${ICON_STROKE}" stroke-width="2"/>`,
  'war-flag': `<path d="M12 5v40" stroke="${ICON_STROKE}" stroke-width="3"/><path d="M12 8h26l-6 8 6 8H12z" fill="#e5484d" stroke="${ICON_STROKE}" stroke-width="2" stroke-linejoin="round"/>`,
  'wing-boots': `<path d="M13 6h14v20l10 6v8H11V30l2-4z" fill="#3fbf7f" stroke="${ICON_STROKE}" stroke-width="2" stroke-linejoin="round"/><path d="M33 14c5-3 9-1 11 4-4 0-8 0-11-4z" fill="#fff" stroke="${ICON_STROKE}" stroke-width="2"/>`,
};

export const SPECIAL_BALLS = {
  rapide: {
    pv: (S, e) => e.hp / e.mhp <= ((S.round || 1) <= 2 ? 0.5 : 0.25),
    hpText: 'Rapide Ball : PV sous 50 % pendant les manches 1 et 2, sinon 25 %',
    im: (S, e) => immobilize(e),
    tim: 'immobilisé : Gel, Paralysie, Sommeil, Racines ou Toile',
  },
  sombre: {
    pv: (S, e) => e.hp / e.mhp <= (isNightTime(S) ? 0.4 : 0.25),
    hpText: 'Sombre Ball : PV sous 40 % la nuit, sinon 25 %',
    im: (S, e) => immobilize(e),
    tim: 'immobilisé : Gel, Paralysie, Sommeil, Racines ou Toile',
  },
  filet: {
    pv: (S, e) => e.hp / e.mhp <= (isWaterOrBug(e) ? 0.4 : 0.25),
    hpText: 'Filet Ball : PV sous 40 % sur une cible Eau ou Insecte, sinon 25 %',
    im: (S, e) => isWaterOrBug(e) || immobilize(e),
    tim: 'Filet Ball : cible Eau ou Insecte, ou immobilisée',
  },
  faiblo: {
    pv: (S, e) => e.hp / e.mhp <= 0.25,
    hpText: 'PV sous 25 %',
    im: (S, e) => e.hp / e.mhp <= 0.15 || immobilize(e),
    tim: 'Faiblo Ball : PV sous 15 %, ou cible immobilisée',
  },
};

export const ITEM_CAN_USE = {
  antigel: (S, u) => u.skip > 0 || ['GEL', 'PAR', 'SOM'].includes(u.badge),
  antidote: (S, u) => u.burn > 0 || u.poisoned > 0,
  baiemepo: (S, u) => u.hp < u.mhp,
  gelee: (S, u) => (hasNx(u) || hasXp(u)) && u.en < MAX_ENERGY,
  rappelmax: (S, u) => !u.acted && !u.sn && !!koAllyOf(S) && !!freeTileFor(S, u),
};

export const ITEM_USE_EFFECTS = {
  antigel: (S, u, ev) => {
    Object.assign(u, { badge: null, skip: 0 });
    pushMessage(ev, `Antigel : ${u.n} retrouve ses moyens.`);
  },
  antidote: (S, u, ev) => {
    Object.assign(u, { burn: 0, poisoned: 0 });
    pushMessage(ev, `Antidote : ${u.n} est soigné.`);
  },
  baiemepo: (S, u, ev) => {
    heal(S, u, Math.ceil(u.mhp * 0.3), ev);
    pushMessage(ev, `Baie Mepo : ${u.n} reprend des forces.`);
  },
  gelee: (S, u, ev) => {
    rewardIn(S, u, 2, ev);
    pushMessage(ev, `Gelée Résonante : ${u.n} gagne 2 losanges.`);
  },
  rappelmax: (S, u, ev) => {
    const o = koAllyOf(S),
      x = freeTileFor(S, u);
    Object.assign(o, {
      ko: false,
      hp: Math.max(1, Math.round(o.mhp * 0.8)),
      pos: parseCellKey(x),
      acted: true,
      moved: true,
      sn: false,
      skip: 0,
      badge: null,
      burn: 0,
      poisoned: 0,
      web: 0,
      root: 0,
      maudit: 0,
      requiem: 0,
      weakened: 0,
      en: 0,
      intent: null,
      notes: null,
    });
    ev.push({ e: 'mv', u: o.uid }, { e: 'heal', u: o.uid, v: o.hp });
    pushMessage(ev, `Rappel Max : ${o.n} revient au combat avec ${o.hp} PV. Il jouera à la prochaine manche.`);
  },
};

const BALL_AND_REMEDY_SHOP_ITEMS = {
  rapide: {
    n: 'Rapide Ball',
    sn: 'Rapide',
    d: 'Plus facile en début de combat : PV sous 50 % pendant les manches 1 et 2. Immobilisation requise.',
    p: 900,
    category: 'balls',
    img: 'quick-ball',
  },
  sombre: {
    n: 'Sombre Ball',
    sn: 'Sombre',
    d: 'La nuit, elle capture dès 40 % de PV restants. Immobilisation requise.',
    p: 900,
    category: 'balls',
    img: 'dusk-ball',
  },
  filet: {
    n: 'Filet Ball',
    sn: 'Filet',
    d: 'Sur un Pokémon Eau ou Insecte : PV sous 40 %, sans immobilisation.',
    p: 800,
    category: 'balls',
    img: 'net-ball',
  },
  faiblo: {
    n: 'Faiblo Ball',
    sn: 'Faiblo',
    d: 'Sous 15 % de PV, plus besoin d’immobiliser la cible.',
    p: 1000,
    category: 'balls',
    img: 'weak-ball',
  },
  hyperpotion: {
    n: 'Hyper Potion',
    sn: 'Hyper Potion',
    d: 'En combat : rend 85 % des PV à un allié. Utilise son action.',
    p: 1300,
    category: 'soins',
    img: 'hyper-potion',
    heal: 0.85,
  },
  antigel: {
    n: 'Antigel',
    sn: 'Antigel',
    d: 'Libère de la paralysie, du gel et du sommeil. Coûte 1 Voix, l’action reste libre.',
    p: 300,
    category: 'combat',
    img: 'ice-heal',
    voice: 1,
  },
  antidote: {
    n: 'Antidote',
    sn: 'Antidote',
    d: 'Soigne la brûlure et le poison. Coûte 1 Voix, l’action reste libre.',
    p: 250,
    category: 'combat',
    img: 'antidote',
    voice: 1,
  },
  baiemepo: {
    n: 'Baie Mepo',
    sn: 'Mepo',
    d: 'Rend 30 % des PV max. Coûte 1 Voix, l’action reste libre.',
    p: 600,
    category: 'combat',
    img: 'mepo-berry',
    voice: 1,
  },
  gelee: {
    n: 'Gelée Résonante',
    sn: 'Gelée',
    d: '+2 losanges de Résonance (Éveil ou attaque Experte). Coûte 1 Voix.',
    p: 2400,
    category: 'combat',
    img: 'jelly-res',
    voice: 1,
  },
  rappelmax: {
    n: 'Rappel Max',
    sn: 'Rappel Max',
    d: 'Relève votre Pokémon K.O. le plus coûteux en PC, sur une case voisine, avec 80 % de ses PV. Utilise l’action.',
    p: 4000,
    category: 'combat',
    img: 'max-revive',
  },
};

const TYPE_HELD_ITEMS = {
  charbon: {
    n: 'Charbon',
    d: '+20 % de dégâts des capacités de type Feu.',
    i: 'M12 3c3 3 6 6 4 11-1 3-6 3-7 0-2-5 0-8 3-11Z',
  },
  eaumystique: {
    n: 'Eau Mystique',
    d: '+20 % de dégâts des capacités de type Eau.',
    i: 'M12 3c4 6 6 9 4 13-1 2-7 2-8 0-2-4 0-7 4-13Z',
  },
  graine: {
    n: 'Graine Miracle',
    d: '+20 % de dégâts des capacités de type Plante.',
    i: 'M12 4c6 2 8 8 4 13-5 0-9-4-4-13Z',
  },
  aimantelec: {
    n: 'Aimant',
    d: '+20 % de dégâts des capacités de type Électrik.',
    i: 'M5 5h5v8a2 2 0 0 0 4 0V5h5v8a7 7 0 0 1-14 0Z',
  },
  glaceeternelle: {
    n: 'Glace Éternelle',
    d: '+20 % de dégâts des capacités de type Glace.',
    i: 'M12 3v18M4 12h16M6 6l12 12M18 6 6 18',
  },
  ceintnoire: {
    n: 'Ceinture Noire',
    d: '+20 % de dégâts des capacités de type Combat.',
    i: 'M2 9h20v6H2ZM9 7h6v10H9Z',
  },
  cuiller: {
    n: 'Cuiller Tordue',
    d: '+20 % de dégâts des capacités de type Psy.',
    i: 'M15 3a5 6 20 1 1-8 5c1 2 3 3 5 3l-6 10',
  },
  filtre: {
    n: 'Lunettes Filtre',
    d: 'Réduit de 25 % les dégâts des attaques super efficaces contre ce Pokémon.',
    i: 'M3 12a4 4 0 1 0 8 0 4 4 0 0 0-8 0Zm10 0a4 4 0 1 0 8 0 4 4 0 0 0-8 0Z',
  },
  cape: { n: 'Gilet de Fer', d: 'Réduit de 15 % tous les dégâts subis.', i: 'M6 4l3 2h6l3-2 2 4-2 3v9H6v-9L4 8Z' },
  banniere: {
    n: 'Bannière de Guerre',
    d: 'Commence le combat Renforcé pendant 1 manche.',
    i: 'M6 3v18M6 4h12l-3 4 3 4H6',
  },
  bottes: {
    n: 'Bottes Ailées',
    d: 'Commence le combat avec +1 Mouvement pendant 1 manche.',
    i: 'M7 3h7v9l5 3v5H5v-5l2-2Z',
  },
};

// Statements executed at startup, in the original order (see index.js).
export function init() {
  for (const k in HELD_ITEM_ICONS) {
    ITEM_ICONS[k] = wrapSvg(HELD_ITEM_ICONS[k]);
  }
  for (const k in SPECIAL_BALLS) {
    BALL_CAPTURE_CHECKS[k] = (S, e) => SPECIAL_BALLS[k].pv(S, e) && SPECIAL_BALLS[k].im(S, e);
  }
  Object.assign(SHOP, BALL_AND_REMEDY_SHOP_ITEMS);
  BALLS.push('rapide', 'sombre', 'filet', 'faiblo');
  HEALS.push('hyperpotion');
  COMBAT_ITEMS.push('antigel', 'antidote', 'baiemepo', 'gelee', 'rappelmax');
  Object.assign(HELD_ITEMS, TYPE_HELD_ITEMS);
  Object.assign(HELD_IMG, {
    charbon: 'charcoal',
    eaumystique: 'mystic-water',
    graine: 'miracle-seed',
    aimantelec: 'magnet',
    glaceeternelle: 'never-melt-ice',
    ceintnoire: 'black-belt',
    cuiller: 'twisted-spoon',
    filtre: 'wise-glasses',
    cape: 'iron-vest',
    banniere: 'war-flag',
    bottes: 'wing-boots',
  });
  Object.assign(HELD_SHOP, {
    charbon: { p: 2500 },
    eaumystique: { p: 2500 },
    graine: { p: 2500 },
    aimantelec: { p: 2500 },
    glaceeternelle: { p: 2500 },
    ceintnoire: { p: 2500 },
    cuiller: { p: 2500 },
    filtre: { p: 3500 },
    cape: { p: 4000 },
    banniere: { p: 2000 },
    bottes: { p: 2000 },
  });
  DAMAGE_PROVIDERS.push(
    {
      id: 'type-item-boost',
      provide: (c, { u, m, typ }) =>
        !!u &&
        TYPE_ITEMS[u.item] &&
        TYPE_ITEMS[u.item] === typ &&
        (m.p > 0 || m.fix > 0) && { mul: 1.2, labelText: HELD_ITEMS[u.item].n },
    },
    {
      id: 'filter-guard',
      provide: (c, { u, t, m, typ }) =>
        !!t &&
        t.item === 'filtre' &&
        !!u &&
        t.side !== u.side &&
        (m.p > 0 || m.fix > 0) &&
        typeEffectiveness(typ, t.t) > 1 && { mul: 0.75, labelText: 'Lunettes Filtre' },
    },
    {
      id: 'cape-guard',
      provide: (c, { u, t, m }) =>
        !!t &&
        t.item === 'cape' &&
        !!u &&
        t.side !== u.side &&
        (m.p > 0 || m.fix > 0) && { mul: 0.85, labelText: 'Gilet de Fer' },
    }
  );
  HOOKS.combat.push(S => {
    S.units.forEach(u => {
      if (u.side !== 'a' || u.ko) {
        return;
      }
      if (u.item === 'banniere') {
        u.boost = Math.max(u.boost || 0, 1);
      }
      if (u.item === 'bottes') {
        u.agile = Math.max(u.agile || 0, 1);
      }
    });
  });
  /* ---------- extra TMs ---------- */
  [
    ['ct25', { num: 'CT25', mv: 'tonnerre', p: 3500, types: ['Électrik', 'Normal', 'Eau', 'Vol', 'Acier', 'Dragon'] }],
    ['ct35', { num: 'CT35', mv: 'lanceflammes', p: 3500, types: ['Feu', 'Dragon', 'Normal', 'Combat', 'Sol'] }],
    ['ct03', { num: 'CT03', mv: 'hydrocanon', p: 4000, types: ['Eau', 'Dragon', 'Acier', 'Roche'] }],
    ['ct21', { num: 'CT21', mv: 'tranchherbe', p: 2500, types: ['Plante', 'Insecte', 'Normal', 'Poison'] }],
    ['ct32', { num: 'CT32', mv: 'coupcroix', p: 3000, types: ['Combat', 'Normal', 'Roche', 'Sol', 'Acier'] }],
    [
      'ct46',
      {
        num: 'CT46',
        mv: 'machouille',
        p: 3000,
        types: ['Ténèbres', 'Normal', 'Feu', 'Électrik', 'Combat', 'Dragon', 'Poison'],
      },
    ],
    [
      'ct47',
      {
        num: 'CT47',
        mv: 'griffeacier',
        p: 2500,
        types: ['Acier', 'Normal', 'Combat', 'Insecte', 'Roche', 'Dragon', 'Ténèbres'],
      },
    ],
    ['ct06', { num: 'CT06', mv: 'ondeboreale', p: 3000, types: ['Glace', 'Eau', 'Psy', 'Vol', 'Spectre', 'Fée'] }],
    ['ct48', { num: 'CT48', mv: 'eboulement', p: 2500, types: ['Roche', 'Sol', 'Combat', 'Acier', 'Normal'] }],
    ['ct09', { num: 'CT09', mv: 'vibraqua', p: 2500, types: ['Eau', 'Glace', 'Normal', 'Dragon', 'Psy'] }],
    ['ct10', { num: 'CT10', mv: 'ultralaser', p: 5000, types: ['Normal', 'Dragon', 'Acier', 'Électrik', 'Psy'] }],
    ['ct13', { num: 'CT13', mv: 'rayonsignal', p: 3000, types: ['Insecte', 'Psy', 'Plante', 'Fée', 'Vol'] }],
    ['ct19', { num: 'CT19', mv: 'triplattaque', p: 3500, forAll: true }],
    ['ct20', { num: 'CT20', mv: 'chocmental', p: 1500, types: ['Psy', 'Spectre', 'Normal', 'Fée', 'Ténèbres'] }],
    ['ct44', { num: 'CT44', mv: 'repos', p: 2500, forAll: true }],
    ['ct45', { num: 'CT45', mv: 'abri', p: 2000, forAll: true }],
    ['ct49', { num: 'CT49', mv: 'synthese', p: 2500, types: ['Plante', 'Normal', 'Fée', 'Eau'] }],
    ['ct50', { num: 'CT50', mv: 'hypnose', p: 2500, types: ['Psy', 'Spectre', 'Poison', 'Ténèbres', 'Plante'] }],
    ['ct56', { num: 'CT56', mv: 'cageeclair', p: 2500, types: ['Électrik', 'Acier', 'Eau', 'Dragon'] }],
    ['ct57', { num: 'CT57', mv: 'poudredodo', p: 2000, types: ['Plante', 'Insecte', 'Poison', 'Fée'] }],
    ['ct58', { num: 'CT58', mv: 'danselames', p: 3500, forAll: true }],
    ['ct60', { num: 'CT60', mv: 'grele', p: 3000, types: ['Glace', 'Eau', 'Vol', 'Roche', 'Dragon'] }],
  ].forEach(([k, M]) => {
    if (MACHINES[k] || !MOVES[M.mv]) {
      return;
    }
    MACHINES[k] = M;
    const m = MOVES[M.mv];
    SHOP[k] = {
      n: `${M.num} · ${m.n}`,
      sn: M.num,
      d: `${m.t} · ${m.p ? 'Puissance ' + m.p + ' · ' : m.pp ? 'Puissance ' + m.pp + ' · ' : ''}${m.d || ''} Usage unique.`,
      category: 'machines',
      mv: M.mv,
      cs: false,
      p: M.p,
    };
  });
}
