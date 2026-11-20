import { BY, SCEN } from '../pokemon/pokemon.js';
import { PROFILE, isCamp } from '../state/game-state.js';
import { medal } from '../core/utils.js';
import { HOOKS } from '../core/hooks.js';
import { go } from '../core/navigation.js';
import { badgeSvg } from '../modes/league.js';
import { nbrK, say, setMark, uk } from '../combat/engine.js';
import { V4 } from '../ui/screen-state.js';
import { fmt } from '../state/economy.js';
import { PL, renderMap } from './map.js';
import { DAMAGE_PROVIDERS } from '../combat/tactical-engine.js';
import { ACHIEVEMENTS } from '../progression/achievements.js';
import { SCENES } from '../progression/story-dialogues.js';

/* =====================================================================
   v4.19: Hoenn
   - Third region, after the Johto Master title (Campaign);
     open from the start in Free mode.
   - 20 Hoenn Pokémon (Route 104), each with its final signature.
   - 8 gyms with rules (sand, ring, current, volcano, low blow, winds,
     warp, deluge) and the Hoenn Master, on an original map.
   ===================================================================== */
export function HOENN_REGION_0() {
  return { hoenn: [], hchamp: 0 };
}

export function hoennRegionClean(p) {
  const o = HOENN_REGION_0();
  if (!p || typeof p !== 'object') {
    return o;
  }
  if (Array.isArray(p.hoenn)) {
    o.hoenn = [...new Set(p.hoenn.filter(i => Number.isInteger(i) && i >= 0 && i < 8))];
  }
  o.hchamp = p.hchamp ? 1 : 0;
  return o;
}

// v4.46: Free mode included
export function isHoennRegion() {
  try {
    return V4.region === 'hoenn' && hoennOpen();
  } catch (e) {
    return false;
  }
}

export function nextHoennStep() {
  if (isCamp() && !PROFILE.jchamp) {
    return null;
  }
  for (let i = 0; i < 8; i++) {
    if (!(PROFILE.hoenn || []).includes(i)) {
      return ['h' + (i + 1), `Hoenn · Arène ${HGYMS[i]}`];
    }
  }
  if (!PROFILE.hchamp) {
    return ['hchamp', 'Maître de Hoenn'];
  }
  return null;
}

export function lockHoenn(k, D) {
  if (!PROFILE.jchamp) {
    return 'Hoenn s’ouvre après votre titre de Maître de Johto.';
  }
  if (D.hoenn > 0 && !(PROFILE.hoenn || []).includes(D.hoenn - 1)) {
    return `Gagnez d’abord le badge ${HGYMS[D.hoenn - 1]} de Hoenn.`;
  }
  if (D.hfinal && (PROFILE.hoenn || []).length < 8) {
    return 'Il faut les 8 badges de Hoenn.';
  }
  return null;
}

export function hoennLead(sc) {
  const D = SCEN[sc];
  if (!D) {
    return null;
  }
  if (D.hoenn != null) {
    return HLEAD[D.hoenn];
  }
  if (D.hfinal) {
    return HCHAMP_L;
  }
  return null;
}

export function hoennChapter(k) {
  const D = SCEN[k];
  if (!D) {
    return null;
  }
  if (D.hoenn != null) {
    return { c: `Hoenn · Chapitre ${D.hoenn + 1}`, t: D.n, who: HLEAD[D.hoenn].n, L: HLEAD[D.hoenn] };
  }
  if (D.hfinal) {
    return { c: 'Hoenn · Final', t: 'Le Maître de Hoenn', who: HCHAMP_L.n, L: HCHAMP_L };
  }
  return null;
}

export function hoennRewardLine(k) {
  const D = SCEN[k];
  const g = D.hfinal ? 20 : HREW[D.hoenn];
  return `<div class="v4-rew"><span class="v4-rew-b">${D.hfinal ? medal(['Dragon']) + 'Titre de Maître de Hoenn' : badgeSvg(D.hoenn, HGYMS[D.hoenn], 'mh' + D.hoenn) + 'Badge ' + HGYMS[D.hoenn]}</span><span><span class="v4-coin" aria-hidden="true">₽</span>+${fmt(D.hfinal ? 8000 : 3500 + 300 * D.hoenn)}</span><span><span class="v4-gemi"><svg><use href="#i-gem"/></svg></span>+${g}</span></div>`;
}

export function hoennProfessor(g) {
  if (g.k === 'hchamp') {
    return `Les huit badges de Hoenn sont à vous ! Le Maître, <b>${g.L.n}</b>, vous attend au sommet.`;
  }
  return `${g.k === 'h1' ? 'Bienvenue à Hoenn ! Des îles, un volcan, et vingt nouveaux Pokémon sur la Route 104. ' : 'Beau travail. '}Prochaine arène : <b>${g.L.n}</b>, ${g.L.t}.`;
}

export function hoennSetup(S, r, ev) {
  if (!/^jh\d$/.test(r || '')) {
    return;
  }
  if (r === 'jh1') {
    S.wx = { k: 'sable', n: 99 };
    say(ev, 'Arène Roche : une tempête de sable souffle sans fin.');
  }
  if (r === 'jh2') {
    say(ev, 'Arène Combat : au contact +25 %, à distance −25 %.');
  }
  if (r === 'jh3') {
    say(ev, 'Arène Électrik : le plateau se charge à chaque fin de manche.');
  }
  if (r === 'jh4') {
    S.wx = { k: 'soleil', n: 99 };
    S.units
      .filter(u => u.side === 'e')
      .forEach(e =>
        nbrK(uk(e)).forEach(x => S.tiles[x] && !S.tiles[x].rock && !S.tiles[x].w && setMark(S, x, 'brulant', null))
      );
    say(ev, 'Arène Feu : grand soleil, et le sol brûle autour des adversaires.');
  }
  if (r === 'jh5') {
    say(ev, 'Arène Normal : les adversaires s’acharnent sur vos Pokémon blessés (+30 %).');
  }
  if (r === 'jh6') {
    S.arriere = Object.assign(S.arriere || {}, { e: 99 });
    say(ev, 'Arène Vol : vent arrière permanent pour les adversaires (+2 Mouvement).');
  }
  if (r === 'jh7') {
    S.distorsion = 99;
    say(ev, 'Arène Psy : la Distorsion ne se dissipe jamais.');
  }
  if (r === 'jh8') {
    S.wx = { k: 'pluie', n: 99 };
    say(ev, 'Arène Eau : le déluge tombe sur tout le plateau.');
  }
}

export function hoennTick(S, r, ev) {
  if (r !== 'jh3' || S.over) {
    return;
  }
  const freeOnes = Object.keys(S.tiles).filter(
    k => !S.tiles[k].rock && !(S.tiles[k].mark && S.tiles[k].mark.k === 'charge')
  );
  let n = 0;
  for (let i = 0; i < 3 && freeOnes.length; i++) {
    setMark(S, freeOnes.splice(Math.floor(Math.random() * freeOnes.length), 1)[0], 'charge', null);
    n++;
  }
  if (n) {
    say(ev, `Arène Électrik : ${n} cases se chargent.`);
    ev.push({ e: 'arena', r });
  }
}

export const hoennOpen = () => !!PROFILE.jchamp;

/* ---------- gyms and masters ---------- */
const HGYMS = ['Roche', 'Combat', 'Électrik', 'Feu', 'Normal', 'Vol', 'Psy', 'Eau'];

const HLEAD = [
  {
    n: 'Agathe Silex',
    t: 'la Géologue',
    q: 'Le sable use tout, même les plus grands dresseurs.',
    w: 'Vous avez tenu dans la tempête. Bravo.',
    l: 'Le sable a eu raison de vous.',
  },
  {
    n: 'Néo Fracas',
    t: 'le Surfeur du Dojo',
    q: 'De loin, on hésite. De près, on se révèle.',
    w: 'Quel cran ! Vous êtes venu au contact.',
    l: 'Trop de distance, pas assez de cœur.',
  },
  {
    n: 'Volta Sénéchal',
    t: 'l’Inventeur',
    q: 'Mon arène est sous tension. Attention où vous mettez les pieds.',
    w: 'Court-circuité ! Je retourne à mes plans.',
    l: 'Le courant passe toujours chez moi.',
  },
  {
    n: 'Brune Cratère',
    t: 'la Gardienne du Volcan',
    q: 'Ici, le soleil ne se couche jamais et le sol brûle.',
    w: 'Vous avez éteint mon volcan. Respect.',
    l: 'Trop chaud pour vous ?',
  },
  {
    n: 'Théo Lenoir',
    t: 'le Père Tranquille',
    q: 'Mes Pokémon frappent toujours ceux qui chancellent.',
    w: 'Vous n’avez laissé personne chanceler.',
    l: 'Il fallait protéger vos blessés.',
  },
  {
    n: 'Albane Plume',
    t: 'la Pilote',
    q: 'Mes Pokémon ont le vent dans le dos. Rattrapez-les si vous pouvez.',
    w: 'Vous avez volé plus haut que nous.',
    l: 'Le vent était de notre côté.',
  },
  {
    n: 'les Jumeaux Miroir',
    t: 'Lise et Lou',
    q: 'Ici, les lents passent devant. Tout est à l’envers.',
    w: 'Vous avez lu dans le miroir mieux que nous.',
    l: 'Vous n’avez pas vu le monde à l’envers.',
  },
  {
    n: 'Marin Abysse',
    t: 'le Plongeur',
    q: 'La pluie ne s’arrête jamais sur mon arène. Savez-vous nager ?',
    w: 'Vous avez dompté le déluge.',
    l: 'Emporté par les flots.',
  },
];

const HCHAMP_L = {
  n: 'Silas Météore',
  t: 'Maître de Hoenn',
  q: 'Kanto, Johto… Et maintenant Hoenn. Montrez-moi jusqu’où va votre Résonance.',
  w: 'Trois régions, trois couronnes. Vous êtes une légende.',
  l: 'Hoenn est vaste. Revenez plus fort.',
};

const HREW = [4, 4, 5, 5, 6, 6, 7, 8];

/* ---------- Hoenn gym rules ---------- */
const sceneRule = S => (S && SCEN[S.sc] && SCEN[S.sc].rule) || '';

const HARENAS = [
  {
    k: 'h1',
    rule: 'jh1',
    time: 'jour',
    rock: ['3,1', '4,4'],
    water: [],
    hb: 22,
    pb: 5,
    lv: 64,
    foes: [
      ['galegon', [6, 1]],
      ['onix', [6, 3]],
      ['gravalanch', [6, 5]],
      ['galekid', [7, 2]],
    ],
    d: 'Une tempête de sable souffle pendant tout le combat : elle use chaque manche les Pokémon qui ne sont ni Roche, ni Sol, ni Acier.',
  },
  {
    k: 'h2',
    rule: 'jh2',
    time: 'jour',
    rock: ['3,2'],
    water: ['4,5'],
    hb: 26,
    pb: 5,
    lv: 65,
    foes: [
      ['galifeu', [6, 1]],
      ['mackogneur', [6, 3]],
      ['kapoera', [6, 5]],
      ['tygnon', [7, 2]],
    ],
    d: 'Le ring du Dojo : les attaques au contact font +25 %, celles à distance −25 %. Pour tout le monde.',
  },
  {
    k: 'h3',
    rule: 'jh3',
    time: 'nuit',
    rock: ['3,0', '4,5'],
    water: [],
    hb: 26,
    pb: 6,
    lv: 66,
    foes: [
      ['magneton', [6, 1]],
      ['lanturn', [6, 3]],
      ['raichu', [6, 5]],
      ['pharamp', [7, 2]],
    ],
    d: 'À chaque fin de manche, trois cases du plateau deviennent Chargées. Gare aux Courts-circuits.',
  },
  {
    k: 'h4',
    rule: 'jh4',
    time: 'jour',
    rock: ['3,3'],
    water: [],
    hb: 28,
    pb: 6,
    lv: 67,
    foes: [
      ['brasegali', [6, 2]],
      ['volcaropod', [6, 4]],
      ['arcanin', [7, 1]],
      ['typhlosion', [7, 3]],
    ],
    d: 'Grand soleil permanent, et le sol brûle autour des adversaires. L’Eau est affaiblie, le Feu renforcé.',
  },
  {
    k: 'h5',
    rule: 'jh5',
    time: 'jour',
    rock: ['3,1'],
    water: [],
    hb: 30,
    pb: 6,
    lv: 68,
    foes: [
      ['ronflex', [6, 2]],
      ['noarfang', [6, 4]],
      ['porygon2', [7, 1]],
      ['roucarnage', [7, 3]],
    ],
    d: 'Coup bas : les adversaires font +30 % de dégâts aux Pokémon sous la moitié de leurs PV. Protégez vos blessés.',
  },
  {
    k: 'h6',
    rule: 'jh6',
    time: 'jour',
    rock: [],
    water: ['3,2'],
    hb: 20,
    pb: 5,
    lv: 69,
    foes: [
      ['drattak', [6, 2]],
      ['cotovol', [6, 4]],
      ['roucarnage', [7, 1]],
      ['xatu', [7, 3]],
    ],
    d: 'Vent arrière permanent pour les adversaires : +2 Mouvement. Ils viennent vite, et de loin.',
  },
  {
    k: 'h7',
    rule: 'jh7',
    time: 'nuit',
    rock: ['3,1', '3,4'],
    water: [],
    hb: 30,
    pb: 7,
    lv: 70,
    foes: [
      ['gardevoir', [6, 2]],
      ['alakazam', [6, 4]],
      ['xatu', [7, 1]],
      ['mentali', [7, 3]],
    ],
    d: 'Distorsion permanente : les Pokémon lents gagnent du Mouvement. Les Remparts passent à l’attaque.',
  },
  {
    k: 'h8',
    rule: 'jh8',
    time: 'nuit',
    rock: ['3,2'],
    water: ['4,0', '5,0', '4,5', '5,5'],
    hb: 18,
    pb: 5,
    lv: 72,
    foes: [
      ['laggron', [6, 2]],
      ['flobio', [6, 4]],
      ['azumarill', [7, 1]],
      ['gobou', [7, 3]],
    ],
    d: 'Déluge : la pluie tombe pendant tout le combat et l’eau couvre une bonne partie du plateau.',
  },
].filter(a => a.foes.every(([id]) => BY[id]));

const palm = (x, y, s = 1) =>
  `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 0q2-10 0-20" stroke="#7a5a32" stroke-width="2.5" fill="none"/><path d="M0-20q-9-4-14 2M0-20q9-4 14 2M0-20q-4-9-11-9M0-20q4-9 11-9" stroke="#2f8a4a" stroke-width="3" fill="none" stroke-linecap="round"/></g>`;

const isle = (d, f) =>
  `<path d="${d}" fill="${f || 'url(#hLand)'}" stroke="#f1dfa6" stroke-width="6" stroke-linejoin="round"/>`;

const MAIN =
  'M70 420C60 340 120 280 210 270C280 262 300 210 380 190C460 170 520 120 610 130C700 140 760 200 820 230C890 262 940 320 930 390C920 450 860 470 800 460C740 450 700 480 640 500C560 528 470 520 400 500C330 480 270 520 200 520C130 520 80 480 70 420Z';

const ISLE1 = 'M270 560C268 535 300 522 335 528C370 535 380 560 362 578C340 596 285 590 270 560Z';

const ISLE2 = 'M780 470C778 446 812 432 846 440C880 448 888 476 866 494C842 512 790 500 780 470Z';

const ISLE3 = 'M835 260C832 238 862 226 892 232C922 238 930 262 912 278C890 296 842 286 835 260Z';

/* ---------- the Hoenn map (original artwork) ---------- */
export const PLACES_H = [
  { id: 'hwild', x: 215, y: 480, n: 'Route 104', s: 'Hautes herbes · Pokémon de Hoenn', grp: 'route', j: 1 },
  { id: 'h1', x: 140, y: 370, s: 'Arène 1 · ' + HLEAD[0].n, grp: 'aventure', j: 1 },
  { id: 'h2', x: 330, y: 560, s: 'Arène 2 · ' + HLEAD[1].n, grp: 'aventure', j: 1 },
  { id: 'h3', x: 360, y: 330, s: 'Arène 3 · ' + HLEAD[2].n, grp: 'aventure', j: 1 },
  { id: 'h4', x: 500, y: 215, s: 'Arène 4 · ' + HLEAD[3].n, grp: 'aventure', j: 1 },
  { id: 'h5', x: 545, y: 430, s: 'Arène 5 · ' + HLEAD[4].n, grp: 'aventure', j: 1 },
  { id: 'h6', x: 690, y: 320, s: 'Arène 6 · ' + HLEAD[5].n, grp: 'aventure', j: 1 },
  { id: 'h7', x: 830, y: 480, s: 'Arène 7 · ' + HLEAD[6].n, grp: 'aventure', j: 1 },
  { id: 'h8', x: 870, y: 260, s: 'Arène 8 · ' + HLEAD[7].n, grp: 'aventure', j: 1 },
  { id: 'hchamp', x: 760, y: 120, n: 'Plateau de Hoenn', s: 'Final · ' + HCHAMP_L.n, grp: 'aventure', j: 1 },
].filter(p => SCEN[p.id] || p.id === 'hwild');

export const HCHAIN = PLACES_H.map(p => p.id);

export const HMAP_SVG = `<svg class="map-svg is-hoenn" viewBox="0 0 1000 640" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
 <defs>
  <radialGradient id="hSea" cx="50%" cy="50%" r="80%"><stop offset="0" stop-color="#2fa3d6"/><stop offset=".6" stop-color="#1873b0"/><stop offset="1" stop-color="#0b3466"/></radialGradient>
  <linearGradient id="hLand" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#78b85c"/><stop offset="1" stop-color="#4f8f45"/></linearGradient>
  <radialGradient id="hDesert"><stop offset="0" stop-color="#ecd28a"/><stop offset="1" stop-color="#d8b866" stop-opacity="0"/></radialGradient>
  <radialGradient id="hAsh"><stop offset="0" stop-color="#8d8a96"/><stop offset="1" stop-color="#8d8a96" stop-opacity="0"/></radialGradient>
  <pattern id="hWave" width="64" height="26" patternUnits="userSpaceOnUse"><path d="M4 15q8-7 16 0t16 0" fill="none" stroke="#c7f0ff" stroke-width="1.2" opacity=".2"/></pattern>
  <clipPath id="hClip"><path d="${MAIN}"/></clipPath>
 </defs>
 <rect width="1000" height="640" fill="url(#hSea)"/><rect width="1000" height="640" fill="url(#hWave)"/>
 <g fill="none" stroke="#a6ecff" opacity=".22"><path d="${MAIN}" stroke-width="28"/><path d="${ISLE1}" stroke-width="20"/><path d="${ISLE2}" stroke-width="20"/><path d="${ISLE3}" stroke-width="20"/></g>
 ${isle(MAIN)}${isle(ISLE1)}${isle(ISLE2)}${isle(ISLE3)}
 <g clip-path="url(#hClip)">
  <ellipse cx="650" cy="250" rx="120" ry="70" fill="url(#hDesert)" opacity=".8"/>
  <ellipse cx="480" cy="200" rx="110" ry="70" fill="url(#hAsh)" opacity=".55"/>
  <ellipse cx="220" cy="400" rx="140" ry="90" fill="#2e7a3c" opacity=".35"/>
 </g>
 <g transform="translate(470 175)"><path d="M-60 40 -18-34h36L60 40Z" fill="#6d5a52" stroke="#3b2f2b" stroke-width="2"/><path d="M-18-34 0-40 18-34 10-22-10-22Z" fill="#e8622c"/><path d="M-6-40q-10-24 6-40q-4 16 8 24" fill="#9aa0a8" opacity=".7"/></g>
 ${palm(330, 548)}${palm(350, 556, 0.8)}${palm(815, 458)}${palm(860, 470, 0.9)}${palm(880, 250, 0.8)}${palm(160, 470, 0.9)}${palm(110, 430)}
 <g transform="translate(760 108)"><path d="M-30 6h60l-8-14h-44Z" fill="#eef2f8" stroke="#a4adbf" stroke-width="2"/><path d="M-10-8v-14h20v14" fill="#8fd3ff" stroke="#2c6d9a" stroke-width="2"/></g>
 <g fill="none" stroke="#e8f8ff" stroke-width="2" opacity=".45"><circle cx="600" cy="590" r="14"/><circle cx="600" cy="590" r="7"/><circle cx="960" cy="560" r="12"/><circle cx="40" cy="200" r="12"/></g>
 </svg>`;

// Startup statements, run in their original order (see index.js).
export function init() {
  HARENAS.forEach((a, i) => {
    SCEN[a.k] = Object.assign(
      {
        n: `Arène ${HGYMS[i]}`,
        lvl: `Hoenn · Arène ${i + 1} · Badge ${HGYMS[i]}`,
        lim: 10,
        bio: 'arene',
        hoenn: i,
        at: HGYMS[i],
      },
      a
    );
  });
  SCEN.hchamp = {
    n: 'Maître de Hoenn',
    lvl: 'Hoenn · Final',
    lim: 11,
    time: 'nuit',
    bio: 'ligue',
    at: 'Dragon',
    hfinal: true,
    rock: ['3,1', '4,4'],
    water: ['3,3'],
    hb: 20,
    pb: 5,
    lv: 74,
    foes: [
      ['drattak', [6, 1]],
      ['galeking', [6, 3]],
      ['gardevoir', [6, 5]],
      ['jungko', [7, 2]],
      ['absol', [7, 4]],
    ],
    d: 'Pas de règle d’arène : un adversaire complet, qui se sert de la Résonance, des attaques Expertes et de la Forme Résonante.',
  };
  HOOKS.progress.push((S, rew, win) => {
    const D = SCEN[S.sc] || {};
    if (!win || !isCamp()) {
      return null;
    }
    if (D.hoenn != null && !(PROFILE.hoenn || []).includes(D.hoenn)) {
      PROFILE.hoenn = [...(PROFILE.hoenn || []), D.hoenn];
      rew.hbadge = { i: D.hoenn };
      return [3500 + 300 * D.hoenn, HREW[D.hoenn]];
    }
    if (D.hfinal && !PROFILE.hchamp) {
      PROFILE.hchamp = 1;
      rew.hbadge = { final: true };
      return [8000, 20];
    }
    return null;
  });
  HOOKS.battleResult.push(r => {
    const h = r.hbadge;
    if (!h) {
      return '';
    }
    return h.final
      ? '<div class="res-l"><h4>Hoenn</h4><div class="rl"><span>Vous êtes Maître de Hoenn : trois régions conquises.</span><b>★</b></div></div>'
      : `<div class="res-l"><h4>Hoenn</h4><div class="rl"><span>Badge ${HGYMS[h.i]} de Hoenn obtenu.</span><b>${(PROFILE.hoenn || []).length} / 8</b></div></div>`;
  });
  ACHIEVEMENTS.push(
    {
      id: 'hoenn8',
      n: 'Huit badges de Hoenn',
      d: 'Gagner les 8 badges de Hoenn.',
      ok: () => (PROFILE.hoenn || []).length >= 8,
      p: () => [(PROFILE.hoenn || []).length, 8],
    },
    {
      id: 'hoenn',
      n: 'Triple couronne',
      d: 'Devenir Maître de Hoenn.',
      t: 'Triple couronne',
      ok: () => !!PROFILE.hchamp,
    }
  );
  DAMAGE_PROVIDERS.push(
    {
      id: 'ringdojo',
      provide: (c, { S, m }) =>
        sceneRule(S) === 'jh2' &&
        m &&
        m.p > 0 &&
        (m.r <= 1 ? { mul: 1.25, labelText: 'Ring du Dojo' } : { mul: 0.75, labelText: 'Ring du Dojo' }),
    },
    {
      id: 'coupbas',
      provide: (c, { S, u, t }) =>
        sceneRule(S) === 'jh5' &&
        u.side === 'e' &&
        t &&
        t.side === 'a' &&
        t.hp <= t.mhp / 2 && { mul: 1.3, labelText: 'Coup bas' },
    }
  );
  /* ---------- scenes and novelties ---------- */
  Object.assign(SCENES, {
    h1: [
      ['prof', 'Hoenn ! Des îles, un volcan, une mer immense… et vingt Pokémon que vous n’avez encore jamais vus.'],
      [
        'prof',
        'La première arène est celle d’Agathe Silex. Méfiez-vous du sable : il use tout ce qui n’est pas Roche, Sol ou Acier.',
      ],
      ['h1', 'Le sable use tout, même les plus grands dresseurs.'],
    ],
    hchamp: [
      ['prof', 'Trois régions… Vous êtes devant le dernier Maître. Je n’aurais jamais cru voir ça.'],
      ['hchamp', 'Kanto, Johto… Et maintenant Hoenn. Montrez-moi jusqu’où va votre Résonance.'],
    ],
  });
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-news="hoenn"]');
    if (!b) {
      return;
    }
    V4.region = 'hoenn';
    V4.mapSel = null;
    go('carte');
    renderMap();
  });
  PLACES_H.forEach(p => (PL[p.id] = p));
}
