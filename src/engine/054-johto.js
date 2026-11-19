/* Original section: v4.15-01-johto.js */

import { SCEN } from './009-pokemon.js';
import { ITEMS2, PROFILE, isCamp } from './011-game-state.js';
import { medal } from './014-utils.js';
import { HOOKS } from './015-hooks.js';
import { TOD, setTod } from './017-home-route.js';
import { setRoute } from '../screens/home/homeStore.js';
import { badgeSvg } from './019-league.js';
import { EMAX, P, hdist, heal, nbrK, say, setMark, shove, uAt, uk } from './021-combat-engine.js';
import { scenLock } from './022-items-bonds-ai.js';
import { wonOf } from './031-home-journey.js';
import { HELD_IMG, ICO414, ITM, SHOP, V4 } from './032-v4-foundation.js';
import { PL, PLACES, renderMap } from './037-map.js';
import { DAMAGE_PROVIDERS } from './044-tactical-engine.js';
import { hourOf } from './046-living-board.js';
import { TARGET412, SELF412, applyPoison } from './051-epic-tms.js';
import { rune413 } from './052-technical-roster.js';
import { hasXp } from './053-resonance.js';
import { chapJ416, extraLine416, jdSetup416, jdTick416, leadJ416, lockJ416, roamPlaces416 } from './055-living-johto.js';
import { PLACES_H, chapH419, hRewardLine419, hoennOpen, leadH419, regionH419 } from './059-hoenn.js';

export let PLACES_J, JMAP_SVG;

 // v4.46: Free mode included
export function regionJ415() {
  try {
    return V4.region === 'johto' && johtoOpen();
  } catch (e) {
    return false;
  }
}


export function routeName() {
  return regionH419() ? 'Route 104' : regionJ415() ? 'Route 32' : 'Route 29'; // Hoenn (v4.19)
}


export function lockJ415(k, D) {
  if (PROFILE.elite < 5) return 'Johto s’ouvre après votre victoire sur la Championne Auriane Vale.';
  const l16 = lockJ416(k, D); // story, roaming beasts (v4.16)
  if (l16 !== undefined) return l16;
  if (D.johto > 0 && !(PROFILE.johto || []).includes(D.johto - 1)) return `Gagnez d’abord le badge ${JGYMS[D.johto - 1]} de Johto.`;
  if (D.jfinal && (PROFILE.johto || []).length < 8) return 'Il faut les 8 badges de Johto.';
  if (D.lac && (PROFILE.johto || []).length < 3) return 'Le Lac Colère s’agite après votre 3e badge de Johto.';
  return null;
}


export function leadJ415(sc) {
  const D = SCEN[sc];
  if (!D) return null;
  const l16 = leadJ416(sc) || leadH419(sc); // v4.16, Hoenn (v4.19)
  if (l16) return l16;
  if (D.johto != null) return JLEAD[D.johto];
  if (D.jfinal) return JCHAMP_L;
  return null;
}


export function chapJ415(k) {
  const D = SCEN[k];
  if (!D) return null;
  const c16 = chapJ416(k) || chapH419(k); // v4.16, Hoenn (v4.19)
  if (c16) return c16;
  if (D.johto != null) return { c: `Johto · Chapitre ${D.johto + 1}`, t: D.n, who: JLEAD[D.johto].n, L: JLEAD[D.johto] };
  if (D.jfinal) return { c: 'Johto · Final', t: 'Le Maître de Johto', who: JCHAMP_L.n, L: JCHAMP_L };
  if (D.lac) return { c: 'Johto · Événement', t: 'Le Léviator rouge', who: 'Lac Colère' };
  return null;
}


export function jRewardLine415(k) {
  const D = SCEN[k];
  if (D && (D.roam || D.jdis)) return extraLine416(k); // v4.16
  if (D && (D.hoenn != null || D.hfinal)) return hRewardLine419(k); // Hoenn (v4.19)
  if (!D || (D.johto == null && !D.jfinal)) return '';
  const R = D.jfinal ? { item: 'metronome', g: 15 } : JREW[D.johto],
    gi = D.johto,
    it = R.item && ITEMS2[R.item];
  return `<div class="v4-rew"><span class="v4-rew-b">${D.jfinal ? medal(['Dragon']) + 'Titre de Maître' : badgeSvg(gi, JGYMS[gi], 'mj' + gi) + 'Badge ' + JGYMS[gi]}</span>${it ? `<span><img src="${ITM(HELD_IMG[R.item])}" alt="" loading="lazy">${it.n}</span>` : ''}<span><span class="v4-gemi"><svg><use href="#i-gem"/></svg></span>${R.g}</span></div>`;
}


/* ---------- Johto gym rules ---------- */
export function jSetup415(S, r, ev) {
  if (!r || r[0] !== 'j') return;
  const es = S.units.filter(u => u.side === 'e');
  if (r === 'jvol') say(ev, 'Arène Vol : des rafales balaient le plateau une manche sur deux.');
  if (r === 'jinsecte') {
    ['3,1', '3,2', '3,3', '3,4', '4,2', '4,4'].forEach(k => {
      const t = S.tiles[k];
      if (t && !t.rock && !uAt(S, k)) t.trap = { k: 'toile', side: 'e', by: null, d: 99 };
    });
    say(ev, 'Arène Insecte : des Toiles Gluantes couvrent le centre.');
  }
  if (r === 'jnormal') say(ev, 'Arène Normal : le troupeau récupère 6 % de ses PV en fin de manche.');
  if (r === 'jspectre') {
    S.cyc = { ph: 'nuit', n: 0, fige: true };
    say(ev, 'Arène Spectre : nuit éternelle. Le premier adversaire vaincu reviendra.');
  }
  if (r === 'jcombat') say(ev, 'Arène Combat : au contact, les adversaires deviennent Renforcés.');
  if (r === 'jacier') {
    es.forEach(e => (e.guard = Math.max(e.guard, 2)));
    say(ev, 'Arène Acier : les adversaires sont blindés (+2 Garde).');
  }
  if (r === 'jglace') {
    S.wx = { k: 'grele', n: 99 };
    for (const k in S.tiles) if (P(k)[0] >= 6 && !S.tiles[k].rock && !uAt(S, k)) setMark(S, k, 'givre', null);
    say(ev, 'Arène Glace : la Grêle tombe, le fond du camp adverse est Givré.');
  }
  if (r === 'jdragon') say(ev, 'Arène Dragon : le souffle ancestral nourrit la Résonance adverse.');
  jdSetup416(S, r, ev); // story, beasts, Dominants (v4.16)
}


export function jTick415(S, r, ev) {
  if (!r || r[0] !== 'j' || S.over) return;
  const R = S.round,
    es = S.units.filter(u => u.side === 'e'),
    al = S.units.filter(u => u.side === 'a' && !u.ko);
  if (r === 'jvol' && R % 2 === 0) {
    let n = 0;
    al.forEach(u => {
      if (u.t.includes('Vol')) return;
      const [c, rw] = u.pos,
        p0 = uk(u);
      shove(S, u, [c + 1, rw], 1, ev, false);
      if (uk(u) !== p0) n++;
    });
    say(ev, n ? `Arène Vol : une rafale repousse ${n} de vos Pokémon.` : 'Arène Vol : la rafale passe sans emporter personne.');
    ev.push({ e: 'arena', r });
  }
  if (r === 'jnormal')
    {es.forEach(e => {
      if (!e.ko && e.hp < e.mhp) heal(S, e, Math.max(1, Math.round(e.mhp * 0.06)), ev);
    });}
  if (r === 'jspectre')
    {es.forEach(e => {
      if (!e.ko || S.revenant || e.caught || e.seg) return; // only one revenant per battle
      const x = uAt(S, uk(e)) ? nbrK(uk(e)).find(y => S.tiles[y] && !S.tiles[y].rock && !uAt(S, y)) : uk(e);
      if (!x) return;
      e.revenu = 1;
      S.revenant = e.uid;
      Object.assign(e, { ko: false, hp: Math.max(1, Math.round(e.mhp * 0.3)), pos: P(x), badge: null, skip: 0, notes: null, intent: null });
      ev.push({ e: 'mv', u: e.uid }, { e: 'heal', u: e.uid, v: e.hp });
      say(ev, `Arène Spectre : ${e.n} revient d’entre les ombres !`);
    });}
  if (r === 'jcombat')
    {es.forEach(e => {
      if (!e.ko && al.some(a => hdist(a.pos, e.pos) === 1)) e.boost = Math.max(e.boost, 2);
    });}
  if (r === 'jacier' && R % 3 === 0) {
    es.forEach(e => {
      if (!e.ko) e.guard = Math.max(e.guard, 2);
    });
    say(ev, 'Arène Acier : le blindage se referme (+2 Garde).');
  }
  if (r === 'jdragon')
    {es.forEach(e => {
      if (!e.ko && hasXp(e)) e.en = Math.min(EMAX, (e.en || 0) + 1);
    });}
  jdTick416(S, r, ev); // story, Dominants (v4.16)
}

 // + roaming beasts (v4.16), Hoenn (v4.19)
export function placeStateJ(p, gk) {
  if (p.id === 'jwild') return johtoOpen() ? 'open' : 'lock';
  if (p.id === 'hwild') return hoennOpen() ? 'open' : 'lock'; // v4.19
  if (p.id === gk) return 'next';
  if (wonOf(p.id)) return 'done';
  if (scenLock(p.id)) return 'lock';
  return 'open';
}


// Map region, tabs, title, captured families (v4.28): rendered by React
// (src/screens/map/). Only the Route 29 panel remains (#route, rendered in the home page).
export function regionUi415() {
  setRoute({ sign: routeName() }); // name displayed on the route (Route.jsx)
}

/* =====================================================================
   v4.15: Johto
   - 20 Johto Pokémon (Route 32, after the Champion in Campaign).
   - The Johto chapter: eight gyms with their own rules, Lake of Rage and
     the Johto Master, on a second map (original artwork).
   - Shinies: your shiny Pokémon stay shiny in battle;
     Shiny Charm at the rare merchant.
   ===================================================================== */

/* ---------- Johto: gyms, masters, rewards ---------- */
export const JGYMS = ['Vol', 'Insecte', 'Normal', 'Spectre', 'Combat', 'Acier', 'Glace', 'Dragon'];


const JLEAD = [
  {
    n: 'Zéphyrine Altair',
    t: 'la Danseuse des Vents',
    q: 'Le vent ne se bat pas. Il pousse, et il attend que vous tombiez.',
    w: 'Vous avez tenu au sol. Le vent vous salue.',
    l: 'Vous étiez au mauvais endroit quand la rafale est passée.'
  },
  {
    n: 'Bastien Sylve',
    t: 'le Collectionneur d’Élytres',
    q: 'Mes Pokémon tissent pendant que vous réfléchissez.',
    w: 'Vous avez coupé chaque fil. Bien joué.',
    l: 'Pris dans la toile, comme les autres.'
  },
  {
    n: 'Capucine Moreau',
    t: 'la Fermière',
    q: 'Mes Pokémon récupèrent plus vite que vous ne frappez.',
    w: 'Vous avez frappé plus vite que mon troupeau ne guérit. Respect.',
    l: 'Le troupeau finit toujours par l’emporter.'
  },
  {
    n: 'Ilian Brume',
    t: 'le Veilleur de la Tour',
    q: 'Ce qui tombe ici ne reste pas tombé.',
    w: 'Vous les avez renvoyés pour de bon.',
    l: 'Je vous avais prévenu : ils reviennent.'
  },
  {
    n: 'Tao Roche-Vive',
    t: 'le Maître de la Cascade',
    q: 'Approchez. C’est au plus près que tout se décide.',
    w: 'Un combat honnête, au corps à corps. Merci.',
    l: 'Vous avez reculé une fois de trop.'
  },
  {
    n: 'Elsa Fanal',
    t: 'la Gardienne du Phare',
    q: 'L’acier ne craint pas l’usure. Il la provoque.',
    w: 'Vous avez trouvé la faille dans le blindage.',
    l: 'Mon blindage a tenu. Le vôtre, non.'
  },
  {
    n: 'Grégoire Frimas',
    t: 'l’Ermite du Lac Gelé',
    q: 'Ici, la grêle ne s’arrête jamais. Habituez-vous.',
    w: 'Vous avez réchauffé ma vieille arène.',
    l: 'Le froid finit toujours par gagner.'
  },
  {
    n: 'Ysolde Wyrm',
    t: 'la Gardienne du Sanctuaire',
    q: 'Mon cousin Aldric vous a parlé des dragons. Moi, je vais vous les montrer.',
    w: 'Le Sanctuaire vous reconnaît.',
    l: 'Revenez quand vos Pokémon auront appris l’humilité.'
  }
];


const JCHAMP_L = {
  n: 'Orion Céleste',
  t: 'Maître de Johto',
  q: 'Kanto vous a couronné. Johto, lui, vous juge.',
  w: 'Deux régions, et un seul nom sur toutes les lèvres : le vôtre.',
  l: 'Johto ne se laisse pas conquérir en une fois.'
};


const JREW = [
  { item: 'lentillezoom', g: 3 },
  { item: 'casquebrut', g: 3 },
  { item: 'sitrus', g: 3 },
  { item: 'rochemeteo', g: 4 },
  { item: 'grosseracine', g: 4 },
  { item: 'orbevie', g: 5 },
  { item: 'mouchoir', g: 5 },
  { item: 'ceinturepro', g: 6 }
];


const JARENAS = [
  {
    k: 'j1',
    rule: 'jvol',
    lim: 10,
    time: 'jour',
    rock: ['3,1', '4,4'],
    water: [],
    hb: 18,
    pb: 3,
    lv: 46,
    foes: [
      ['noarfang', [6, 1]],
      ['roucarnage', [6, 3]],
      ['cotovol', [6, 5]],
      ['xatu', [7, 2]]
    ],
    d: 'Toutes les 2 manches, une rafale repousse d’une case vers l’ouest vos Pokémon qui ne sont pas de type Vol. Les rochers vous servent d’abri.'
  },
  {
    k: 'j2',
    rule: 'jinsecte',
    lim: 10,
    time: 'jour',
    rock: ['3,0'],
    water: ['4,5'],
    hb: 40,
    pb: 6,
    lv: 48,
    foes: [
      ['migalos', [6, 1]],
      ['scarhino', [6, 3]],
      ['cizayox', [6, 5]],
      ['papilusion', [7, 2]]
    ],
    d: 'Six Toiles Gluantes couvrent le centre du plateau : un Pokémon qui s’y arrête est englué. Les Pokémon Vol passent au-dessus.'
  },
  {
    k: 'j3',
    rule: 'jnormal',
    lim: 10,
    time: 'jour',
    rock: ['3,2'],
    water: [],
    hb: 28,
    pb: 4,
    lv: 50,
    foes: [
      ['ronflex', [6, 2]],
      ['porygon2', [6, 4]],
      ['noarfang', [7, 1]],
      ['metamorph', [7, 3]]
    ],
    d: 'En fin de manche, chaque adversaire récupère 6 % de ses PV max. Concentrez vos coups : les blessures légères ne durent pas.'
  },
  {
    k: 'j4',
    rule: 'jspectre',
    lim: 11,
    time: 'nuit',
    rock: ['2,1', '4,4'],
    water: [],
    hb: 14,
    pb: 4,
    lv: 52,
    foes: [
      ['ectoplasma', [6, 1]],
      ['spectrum', [6, 3]],
      ['spectrum', [6, 5]],
      ['noctali', [7, 2]]
    ],
    d: 'Nuit éternelle. Le premier adversaire mis K.O. revient en fin de manche avec 30 % de ses PV : il faudra le battre deux fois.'
  },
  {
    k: 'j5',
    rule: 'jcombat',
    lim: 10,
    time: 'jour',
    rock: [],
    water: ['3,2', '3,3'],
    hb: 32,
    pb: 5,
    lv: 54,
    foes: [
      ['tygnon', [6, 1]],
      ['kicklee', [6, 3]],
      ['kapoera', [6, 5]],
      ['scarhino', [7, 2]],
      ['mackogneur', [7, 4]]
    ],
    d: 'Défi au corps à corps : un adversaire qui finit la manche au contact d’un de vos Pokémon devient Renforcé. Gardez vos distances, ou frappez le premier.'
  },
  {
    k: 'j6',
    rule: 'jacier',
    lim: 10,
    time: 'nuit',
    rock: ['3,1', '3,4'],
    water: [],
    hb: 36,
    pb: 6,
    lv: 55,
    foes: [
      ['steelix', [6, 2]],
      ['magneton', [6, 4]],
      ['foretress', [7, 1]],
      ['cizayox', [7, 3]]
    ],
    d: 'Blindage : les adversaires commencent avec +2 Garde, renouvelée toutes les 3 manches. Frappez entre deux blindages, ou ignorez la Garde (Lame de Roc, Inconscient).'
  },
  {
    k: 'j7',
    rule: 'jglace',
    lim: 10,
    time: 'jour',
    rock: ['2,2'],
    water: ['5,0', '5,5'],
    hb: 20,
    pb: 4,
    lv: 56,
    foes: [
      ['cochignon', [6, 1]],
      ['lokhlass', [6, 3]],
      ['crustabri', [6, 5]],
      ['marcacrin', [7, 2]]
    ],
    d: 'La Grêle tombe pendant tout le combat et le fond du camp adverse commence Givré. Le Feu fait fondre la glace : Fonte et Vapeur sont vos alliées.'
  },
  {
    k: 'j8',
    rule: 'jdragon',
    lim: 10,
    time: 'nuit',
    rock: ['3,0', '4,5'],
    water: [],
    hb: 42,
    pb: 7,
    lv: 58,
    foes: [
      ['dracolosse', [6, 1]],
      ['draco', [6, 3]],
      ['draco', [6, 5]],
      ['leviator', [7, 2]]
    ],
    d: 'Souffle ancestral : chaque manche, les adversaires gagnent un losange de Résonance de plus. Leurs attaques Expertes partent deux fois plus souvent.'
  }
];


export const johtoOpen = () => PROFILE.elite >= 5;


export const JCHAIN = ['jwild', 'j1', 'j2', 'j3', 'j4', 'j5', 'j6', 'j7', 'j8', 'jchamp'];


export const placesR = () => (V4.region === 'hoenn' ? PLACES_H : V4.region === 'johto' ? [...PLACES_J, ...roamPlaces416()] : PLACES);

// Startup statements, run in their original order (see index.js).
export function __init() {

/* ---------- moves and abilities of the new families ---------- */
Object.assign(TARGET412, {
  toxweb(S, u, v, x, mk, ev) {
    applyPoison(S, v, ev);
    if (v.tal === 'regardvif' || rune413(S, v)) return;
    v.web = Math.max(v.web, 2);
    say(ev, `${v.n} est englué.`);
  },
  affaiblit(S, u, v, x, mk, ev) {
    v.affaibli = Math.max(v.affaibli || 0, 2);
    say(ev, `${v.n} est intimidé : −3 dégâts pendant 2 manches.`);
  },
  bourbier(S, u, v, x, mk, ev) {
    if (v.tal === 'regardvif' || rune413(S, v)) return;
    v.web = Math.max(v.web, 2);
  }
});


Object.assign(SELF412, {
  carapace(S, u, ev) {
    u.guard = Math.max(u.guard, 3);
    nbrK(uk(u)).forEach(x => {
      if (S.tiles[x] && !S.tiles[x].rock) setMark(S, x, 'brulant', u.uid);
    });
    say(ev, `${u.n} durcit sa carapace : +2 Garde, cases voisines Brûlantes.`);
  }
});


DAMAGE_PROVIDERS.push(
  { id: 'nocturne', fournir: (c, { S, u }) => u.tal === 'nocturne' && S && hourOf(S) === 'nuit' && { mul: 1.25, libelle: 'Nocturne' } },
  { id: 'forcepure', fournir: (c, { u, m }) => u.tal === 'forcepure' && m.r === 1 && m.p > 0 && { mul: 1.3, libelle: 'Force Pure' } }
);


/* ---------- shinies ---------- */
Object.assign(ICO414, {
  'shiny-charm':
    'data:image/svg+xml;charset=utf-8,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path d="M24 4l4 12 12 4-12 4-4 12-4-12-12-4 12-4z" fill="#ffd75e" stroke="#8a6a12" stroke-width="2" stroke-linejoin="round"/><path d="M37 30l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#9be7ff" stroke="#2a6f8a" stroke-width="1.5" stroke-linejoin="round"/><path d="M11 30l1.5 3.5L16 35l-3.5 1.5L11 40l-1.5-3.5L6 35l3.5-1.5z" fill="#ffb3e0" stroke="#7b2d58" stroke-width="1.5" stroke-linejoin="round"/></svg>'
    )
});


SHOP.charme = {
  n: 'Charme Chroma',
  sn: 'Charme',
  d: 'Objet clé : dans les hautes herbes, les Pokémon chromatiques apparaissent trois fois plus souvent. Un seul suffit.',
  g: 25,
  cat: 'rares',
  img: 'shiny-charm',
  cle: 1
};


JARENAS.forEach((a, i) => {
  SCEN[a.k] = Object.assign({ n: `Arène ${JGYMS[i]}`, lvl: `Johto · Arène ${i + 1} · Badge ${JGYMS[i]}`, bio: 'arene', johto: i, at: JGYMS[i] }, a);
});


SCEN.jchamp = {
  n: 'Maître de Johto',
  lvl: 'Johto · Final',
  lim: 11,
  time: 'nuit',
  bio: 'ligue',
  at: 'Dragon',
  jfinal: true,
  rock: ['3,1', '4,4'],
  water: ['3,3'],
  hb: 22,
  pb: 4,
  lv: 62,
  foes: [
    ['tyranocif', [6, 1]],
    ['dracolosse', [6, 3]],
    ['azumarill', [6, 5]],
    ['lanturn', [7, 2]]
  ],
  d: 'Pas de règle d’arène : un adversaire complet, qui se sert des notes de Résonance et des attaques Expertes.'
};


SCEN.jlac = {
  n: 'Lac Colère',
  lvl: 'Johto · Léviator rouge',
  lim: 10,
  time: 'nuit',
  bio: 'gue',
  at: 'Eau',
  lac: true,
  catch: true,
  water: ['3,0', '4,0', '5,0', '3,1', '4,1', '5,1', '4,2', '5,2'],
  rock: ['1,4'],
  hb: 30,
  pb: 5,
  lv: 46,
  foes: [
    ['leviator', [6, 2], { shiny: true }],
    ['magicarpe', [6, 0]],
    ['magicarpe', [6, 4]]
  ],
  d: 'Un Léviator rouge sème la panique sur le lac. Affaiblissez-le sous 25 % de ses PV, immobilisez-le, puis capturez-le au contact : il rejoindra votre Box en chromatique.'
};


HOOKS.progres.push((S, rew, win) => {
  const D = SCEN[S.sc] || {};
  if (!win || !isCamp()) return null;
  if (D.lac) PROFILE.lac = 1;
  if (D.johto != null && !(PROFILE.johto || []).includes(D.johto)) {
    PROFILE.johto = [...(PROFILE.johto || []), D.johto];
    const R = JREW[D.johto];
    rew.jbadge = { i: D.johto };
    if (R.item && !PROFILE.items.includes(R.item)) {
      PROFILE.items.push(R.item);
      rew.jbadge.item = R.item;
    }
    return [2500 + 250 * D.johto, R.g];
  }
  if (D.jfinal && !PROFILE.jchamp) {
    PROFILE.jchamp = 1;
    rew.jbadge = { final: true };
    if (!PROFILE.items.includes('metronome')) {
      PROFILE.items.push('metronome');
      rew.jbadge.item = 'metronome';
    }
    return [6000, 15];
  }
  return null;
});


HOOKS.resultat.push(r => {
  const j = r.jbadge;
  if (!j) return '';
  const it = j.item ? ` · ${ITEMS2[j.item].n} rejoint votre Sac` : '';
  return j.final
    ? `<div class="res-l"><h4>Johto</h4><div class="rl"><span>Vous êtes Maître de Johto${it}.</span><b>★</b></div></div>`
    : `<div class="res-l"><h4>Johto</h4><div class="rl"><span>Badge ${JGYMS[j.i]} de Johto obtenu${it}.</span><b>${(PROFILE.johto || []).length} / 8</b></div></div>`;
});


/* ---------- the Johto map (original artwork) ---------- */
PLACES_J = [
  { id: 'jwild', x: 610, y: 470, n: 'Route 32', s: 'Hautes herbes · Pokémon de Johto', grp: 'route', j: 1 },
  { id: 'j1', x: 730, y: 405, s: 'Arène 1 · ' + JLEAD[0].n, grp: 'aventure', j: 1 },
  { id: 'j2', x: 520, y: 520, s: 'Arène 2 · ' + JLEAD[1].n, grp: 'aventure', j: 1 },
  { id: 'j3', x: 420, y: 380, s: 'Arène 3 · ' + JLEAD[2].n, grp: 'aventure', j: 1 },
  { id: 'j4', x: 420, y: 215, s: 'Arène 4 · ' + JLEAD[3].n, grp: 'aventure', j: 1 },
  { id: 'j5', x: 150, y: 430, s: 'Arène 5 · ' + JLEAD[4].n, grp: 'aventure', j: 1 },
  { id: 'j6', x: 175, y: 250, s: 'Arène 6 · ' + JLEAD[5].n, grp: 'aventure', j: 1 },
  { id: 'j7', x: 640, y: 215, s: 'Arène 7 · ' + JLEAD[6].n, grp: 'aventure', j: 1 },
  { id: 'jlac', x: 600, y: 95, n: 'Lac Colère', s: 'Événement · Léviator rouge', grp: 'entrainement', j: 1 },
  { id: 'j8', x: 845, y: 165, s: 'Arène 8 · ' + JLEAD[7].n, grp: 'aventure', j: 1 },
  { id: 'jchamp', x: 895, y: 360, n: 'Plateau de Johto', s: 'Final · ' + JCHAMP_L.n, grp: 'aventure', j: 1 }
];


PLACES_J.forEach(p => (PL[p.id] = p));


document.addEventListener('click', e => {
  const b = e.target.closest('.v4-reg [data-reg]');
  if (!b) return;
  V4.region = b.dataset.reg;
  V4.mapSel = null;
  renderMap();
  setTod(TOD);
});


JMAP_SVG = (() => {
  const tree = (x, y, s = 1) =>
    `<g transform="translate(${x} ${y}) scale(${s})"><circle r="9" cy="-4" fill="#1d5a3a"/><circle r="7" cx="-6" cy="2" fill="#246b42"/><circle r="7" cx="6" cy="2" fill="#20623d"/><circle r="4" cx="-2" cy="-8" fill="#3f9458" opacity=".8"/></g>`;
  const forest = (cx, cy, n, sp) => {
    let o = '';
    for (let i = 0; i < n; i++) {
      const a = i * 2.399,
        r = Math.sqrt(i) * sp;
      o += tree((cx + Math.cos(a) * r).toFixed(0), (cy + Math.sin(a) * r * 0.7).toFixed(0), 0.8 + ((i * 37) % 5) / 12);
    }
    return o;
  };
  const mount = (x, y, s, snow) =>
    `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-30 18 -4 -26 6 -12 14 -22 34 18Z" fill="url(#jRock)"/>${snow ? '<path d="M-4 -26 6 -12 1 -8-4-14-9-6-14-10Z" fill="#f4f8ff"/><path d="M14 -22 22 -8 17-5 13-12 9-7Z" fill="#e7eefb"/>' : ''}</g>`;
  const town = (x, y) =>
    `<g transform="translate(${x} ${y})"><rect x="-13" y="-4" width="9" height="8" fill="#f2e7d0"/><path d="M-14-4-8.5-10-3-4Z" fill="#3f6fb5"/><rect x="-1" y="-7" width="10" height="11" fill="#eef1f6"/><path d="M-2-7 4-13 10-7Z" fill="#b5523f"/></g>`;
  const LAND =
    'M70 300C58 225 115 158 205 136C292 115 372 146 462 122C552 98 640 66 752 78C858 90 940 140 952 230C962 318 932 382 902 432C862 494 784 504 724 540C652 585 560 592 478 572C398 552 356 600 276 590C196 580 150 522 110 472C82 432 76 362 70 300Z';
  const ISLE = 'M40 470C34 440 70 422 104 432C134 441 140 470 120 488C98 506 50 500 40 470Z';
  const WHIRL = (x, y) => `<g transform="translate(${x} ${y})" fill="none" stroke="#bfe9ff" stroke-width="2" opacity=".5"><circle r="12"/><circle r="6"/></g>`;
  return `<svg class="map-svg map-j" viewBox="0 0 1000 640" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
 <defs>
  <radialGradient id="jSea" cx="50%" cy="45%" r="75%"><stop offset="0" stop-color="#2d84c4"/><stop offset=".55" stop-color="#1b5c9c"/><stop offset="1" stop-color="#0b2a57"/></radialGradient>
  <linearGradient id="jLand" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6aa95a"/><stop offset=".55" stop-color="#58994e"/><stop offset="1" stop-color="#477f44"/></linearGradient>
  <linearGradient id="jRock" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#b0aab8"/><stop offset="1" stop-color="#5f5a72"/></linearGradient>
  <radialGradient id="jIce"><stop offset="0" stop-color="#e8f7ff"/><stop offset="1" stop-color="#9fd3f2" stop-opacity="0"/></radialGradient>
  <radialGradient id="jAutumn"><stop offset="0" stop-color="#e8a04a"/><stop offset="1" stop-color="#c46a2a" stop-opacity="0"/></radialGradient>
  <radialGradient id="jLight" cx="65%" cy="20%" r="70%"><stop offset="0" stop-color="#ffe3c8" stop-opacity=".32"/><stop offset="1" stop-color="#ffe3c8" stop-opacity="0"/></radialGradient>
  <pattern id="jWave" width="60" height="24" patternUnits="userSpaceOnUse"><path d="M4 14q8-7 16 0t16 0" fill="none" stroke="#bfe9ff" stroke-width="1.2" opacity=".18"/></pattern>
  <clipPath id="jClip"><path d="${LAND}"/></clipPath>
 </defs>
 <rect width="1000" height="640" fill="url(#jSea)"/><rect width="1000" height="640" fill="url(#jWave)"/>
 <g fill="none" stroke="#9fe3ff" stroke-linejoin="round"><path d="${LAND}" stroke-width="26" opacity=".22"/><path d="${ISLE}" stroke-width="20" opacity=".2"/></g>
 <g stroke="#e9d9a2" stroke-width="7" stroke-linejoin="round"><path d="${LAND}" fill="url(#jLand)"/><path d="${ISLE}" fill="url(#jLand)"/></g>
 <g clip-path="url(#jClip)">
  <ellipse cx="420" cy="230" rx="130" ry="90" fill="url(#jAutumn)" opacity=".55"/>
  <ellipse cx="700" cy="170" rx="150" ry="90" fill="url(#jIce)" opacity=".55"/>
  <ellipse cx="560" cy="470" rx="160" ry="90" fill="#9ad877" opacity=".2"/>
 </g>
 <path d="M548 92c-14-24 20-44 56-40 40 4 58 26 44 46-14 20-84 22-100-6Z" fill="#3a9ee0" stroke="#bfefff" stroke-width="2.5"/>
 <path d="M600 104 640 180 690 230 760 300 805 360" fill="none" stroke="#3a9ee0" stroke-width="7" stroke-linecap="round" opacity=".85"/>
 ${forest(520, 548, 18, 9)}${forest(300, 300, 10, 8)}${forest(760, 470, 8, 8)}${forest(250, 520, 6, 8)}
 ${mount(800, 130, 1.2, 1)}${mount(860, 200, 0.9, 1)}${mount(720, 120, 0.8, 1)}${mount(110, 300, 0.9, 0)}${mount(90, 360, 0.7, 0)}${mount(930, 300, 0.8, 0)}
 <g transform="translate(445 196)"><path d="M-14 22h28l-4-10h-20z" fill="#7a3b2a"/><path d="M-12 12h24l-5-9h-14z" fill="#9a4a32"/><path d="M-9 3h18l-4-9h-10z" fill="#b8573a"/><path d="M-6-6h12l-6-12z" fill="#d06a42"/></g>
 <g transform="translate(140 236)"><path d="M-6 18h12l-3-34h-6z" fill="#f2f2f2" stroke="#8a93a6" stroke-width="1.5"/><path d="M-4-16h8v-6h-8z" fill="#ffd75e"/><path d="M0-19l-26-10M0-19l26-10" stroke="#fff3b0" stroke-width="2" opacity=".6"/></g>
 <g transform="translate(895 340)"><path d="M-30 6h60l-8-14h-44Z" fill="#e9eef7" stroke="#a4adbf" stroke-width="2"/><path d="M-10-8v-14h20v14" fill="#c9a6ff" stroke="#6b4aa0" stroke-width="2"/></g>
 ${WHIRL(150, 590)}${WHIRL(230, 612)}${WHIRL(90, 560)}
 ${town(730, 420)}${town(520, 535)}${town(420, 395)}${town(420, 232)}${town(110, 455)}${town(175, 268)}${town(640, 232)}${town(845, 182)}${town(610, 488)}
 <rect width="1000" height="640" fill="url(#jLight)"/>
 </svg>`;
})();
}
