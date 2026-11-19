/* Section d'origine : v4.11-01-monde.js */

import { MV } from './005-02-capacites.js';
import { BY, SCEN } from './009-03-pokemon.js';
import { PROFILE, isCamp } from './011-05-etat-de-partie.js';
import { $, RM, toast } from './014-08-outils.js';
import { refreshAccueil, setRoute } from '../screens/accueil/accueilStore.js';
import { CROCHETS } from './015-v4-8-00-crochets.js';
import { byUid } from './021-14-moteur-combat.js';
import { OBST } from './023-16-roles-synergies-obstacles.js';
import { B, __set_B, buildBoard, log, renderAll, ui } from './024-17-interface-combat.js';
import { queueSave } from './025-19-sauvegardes.js';
import { sfx, vibe } from './026-20-campagne-tutoriel-son.js';
import { playEv } from './028-22-effets-attaque.js';
import { AUTO } from './030-24-prestige-mise-en-scene.js';
import { SHOP, bagN } from './032-v4-00-socle.js';

export let REDIFF, dissonanceDe;
let SAISONS, saison, cleCadeau, pause, REDIFF_EN_COURS, DISSONANCE;


/* =====================================================================
   v4.11 : le monde
   ---------------------------------------------------------------------
   1. Événements du calendrier (date de l'appareil, fonctionne hors ligne) :
      Nuit des Spectres (20 oct. – 5 nov.), Givre de décembre (15 déc. –
      5 janv.), Floraison de printemps (20 mars – 30 avril), Canicule d'été
      (juillet – août), et le Week-end chromatique le reste de l'année.
      Les types de la saison sortent plus souvent des hautes herbes, leurs
      captures rapportent 1 Éclat, la météo s'invite dans les combats
      sauvages, et un cadeau attend sur l'Accueil (une fois par saison).
   2. Rediffusion du meilleur coup : pendant le combat, chaque action de
      vos Pokémon est notée (dégâts, K.O., réactions, accords, Éveils).
      L'écran de résultat propose de revoir la meilleure.
   3. La Team Dissonance : une organisation qui veut faire taire la
      Résonance. 4 combats d'histoire dans la Campagne, après les badges
      1, 3, 5 et 7 : des Sbires, l'Admin Vesper, l'Admin Cobalt, puis leur
      chef, Orphée Valcourt. Chacun avec sa règle (mutateur, pièges).
   ===================================================================== */

/* ---------- profil (fonctions déclarées : appelées dès le chargement) ---------- */
export function MON0() {
  return { dissonance: 0, cadeaux: {} };
}


export function monClean(p) {
  const o = MON0();
  if (!p || typeof p !== 'object') return o;
  if (Number.isFinite(p.dissonance)) o.dissonance = Math.max(0, Math.min(4, Math.floor(p.dissonance)));
  if (p.cadeaux && typeof p.cadeaux === 'object')
    for (const k in p.cadeaux) if (/^[a-z]+-\d{4}$/.test(k)) o.cadeaux[k] = 1;
  return o;
}


/** La saison du jour (fonction déclarée : le tirage des rencontres en a besoin). */
function saisonDu(d) {
  d = d || new Date();
  const md = (d.getMonth() + 1) * 100 + d.getDate();
  if (md >= 1020 && md <= 1105) return 'halloween';
  if (md >= 1215 || md <= 105) return 'hiver';
  if (md >= 320 && md <= 430) return 'printemps';
  if (md >= 701 && md <= 831) return 'ete';
  if (d.getDay() === 0 || d.getDay() === 6) return 'weekend';
  return null;
}


/** Poids d'une espèce dans les hautes herbes, selon la saison. */
export function poidsSaison(m) {
  const s = saison();
  return s && s.types.length && m.t.some(t => s.types.includes(t)) ? 3 : 1;
}


/** Chance de chromatique, selon la saison. */
export function multChroma() {
  const s = saison();
  return ((s && s.shiny) || 1) * (bagN('charme') ? 3 : 1); // Charme Chroma (v4.15)
}


function cadeauPris() {
  return !!(PROFILE.cadeaux && PROFILE.cadeaux[cleCadeau()]);
}


function prendreCadeau() {
  const s = saison();
  if (!s || !s.cadeau || cadeauPris()) return;
  PROFILE.cadeaux = PROFILE.cadeaux || {};
  PROFILE.cadeaux[cleCadeau()] = 1;
  const txt = [];
  for (const k in s.cadeau) {
    if (!SHOP[k]) continue;
    PROFILE.bag[k] = Math.min(99, bagN(k) + s.cadeau[k]);
    txt.push(`${s.cadeau[k]} × ${SHOP[k].n}`);
  }
  sfx('ui');
  vibe(30);
  toast(`Cadeau de la saison : ${txt.join(', ')} !`);
  queueSave();
  renderSaison();
}


/** Saison du jour sur la route (data-saison de #route). */
export function saisonRoute() {
  setRoute({ saison: saison() ? saisonDu() : '' });
}


/** Bloc #v4Saison de l'Accueil (src/screens/accueil/Bas.jsx) : la saison et son cadeau. */
export function saisonData() {
  const s = saison();
  return s ? { s, pris: cadeauPris() } : null;
}


export function renderSaison() {
  saisonRoute();
  refreshAccueil();
}


/** Le score d'une action, d'après ses événements. */
function scoreMoment(S, ev) {
  let d = 0,
    ko = 0,
    rx = 0,
    acc = '',
    evo = 0;
  ev.forEach(x => {
    const v = x.u && byUid(S, x.u);
    if (x.e === 'dmg' && v && v.side === 'e') d += x.v;
    if (x.e === 'ko' && v && v.side === 'e' && !v.seg) ko++;
    if (x.e === 'rx') rx++;
    if (x.e === 'evo') evo++;
    if (x.e === 'msg' && /^Accord de Résonance · ([^!]+)/.test(x.s)) acc = x.s.match(/^Accord de Résonance · ([^!]+)/)[1].trim();
  });
  return { s: d + ko * 30 + rx * 10 + (acc ? 25 : 0) + evo * 15, d, ko, rx, acc, evo };
}


/** Appelée par pAct et pEveil : garde la meilleure action du combat. */
export function noterMoment(S, u, nom, ev, avant, titre) {
  const R = REDIFF.get(S);
  if (!R || !ev || !avant) return;
  const sc = scoreMoment(S, ev);
  if (sc.s <= 0 || (R.best && R.best.score >= sc.s)) return;
  const det = [
    sc.d ? `${sc.d} dégâts` : '',
    sc.ko ? `${sc.ko} K.O.` : '',
    sc.rx ? `${sc.rx} réaction${sc.rx > 1 ? 's' : ''}` : '',
    sc.acc ? `Accord ${sc.acc}` : '',
    sc.evo ? 'Éveil' : ''
  ].filter(Boolean);
  R.best = {
    score: sc.s,
    avant,
    apres: JSON.stringify(S),
    ev: JSON.parse(JSON.stringify(ev)),
    label: `Manche ${S.round} · ${titre || `${u.n} · ${nom}`}`,
    det: det.join(' · ')
  };
}


async function rediffuser() {
  const R = B && REDIFF.get(B);
  if (!R || !R.best || REDIFF_EN_COURS) return;
  REDIFF_EN_COURS = true;
  const fin = B,
    res = $('#cbResult'),
    lent = RM || AUTO ? 0.2 : 1;
  try {
    res.hidden = true;
    __set_B(Object.assign(JSON.parse(R.best.avant), { over: null }));
    ui.busy = true;
    buildBoard();
    renderAll();
    log(`Rediffusion : ${R.best.label}`, 'arn');
    await pause(900 * lent);
    __set_B(Object.assign(JSON.parse(R.best.apres), { over: null }));
    renderAll();
    playEv(R.best.ev);
    await pause(3200 * lent);
  } finally {
    __set_B(fin);
    ui.busy = false;
    buildBoard();
    renderAll();
    res.hidden = false;
    REDIFF_EN_COURS = false;
  }
}


/** Les combats de la Dissonance à placer après le badge n (fonction déclarée, sans constante : sûre au chargement). */
export function dissonanceApres(n) {
  if (!isCamp()) return [];
  return { 1: ['td1'], 3: ['td2'], 5: ['td3'], 7: ['td4'] }[n] || [];
}

// Instructions exécutées au démarrage, dans l'ordre d'origine (voir index.js).
export function __init() {

/* =====================================================================
   1. Événements du calendrier
   ===================================================================== */
SAISONS = {
  halloween: {
    n: 'Nuit des Spectres',
    d: 'Les Pokémon Spectre, Ténèbres et Poison sortent des hautes herbes, la nuit tombe sur les combats sauvages, et chaque capture de ces types rapporte 1 Éclat.',
    types: ['Spectre', 'Ténèbres', 'Poison'],
    nuit: true,
    cadeau: { hyper: 3 },
    c: '#8a5cf6'
  },
  hiver: {
    n: 'Givre de décembre',
    d: 'Les Pokémon Glace et Eau sortent des hautes herbes, la grêle tombe sur les combats sauvages, et chaque capture de ces types rapporte 1 Éclat.',
    types: ['Glace', 'Eau'],
    wx: 'grele',
    cadeau: { super: 3, superpotion: 2 },
    c: '#8fd8ff'
  },
  printemps: {
    n: 'Floraison de printemps',
    d: 'Les Pokémon Plante, Fée et Insecte sortent des hautes herbes, et chaque capture de ces types rapporte 1 Éclat.',
    types: ['Plante', 'Fée', 'Insecte'],
    cadeau: { potion: 5 },
    c: '#7ac74c'
  },
  ete: {
    n: 'Canicule d’été',
    d: 'Les Pokémon Feu, Eau et Électrik sortent des hautes herbes, le soleil tape sur les combats sauvages, et chaque capture de ces types rapporte 1 Éclat.',
    types: ['Feu', 'Eau', 'Électrik'],
    wx: 'soleil',
    cadeau: { super: 5 },
    c: '#ee8130'
  },
  weekend: {
    n: 'Week-end chromatique',
    d: 'Le samedi et le dimanche, les Pokémon chromatiques sont deux fois plus fréquents.',
    types: [],
    shiny: 2,
    c: '#ffd75e'
  }
};


saison = () => SAISONS[saisonDu()] || null;


cleCadeau = () => `${saisonDu()}-${new Date().getFullYear()}`;


document.addEventListener('click', e => {
  if (e.target.closest('[data-cadeau]')) prendreCadeau();
});


/* =====================================================================
   2. Rediffusion du meilleur coup
   ===================================================================== */
REDIFF = new WeakMap();


pause = ms => new Promise(r => setTimeout(r, ms));


REDIFF_EN_COURS = false;


document.addEventListener('click', e => {
  if (e.target.closest('[data-rediff]')) rediffuser();
});


/* =====================================================================
   3. La Team Dissonance
   ===================================================================== */
DISSONANCE = [
  {
    k: 'td1',
    after: 1,
    n: 'Sbires de la Dissonance',
    who: 'Sbires de la Dissonance',
    pl: true,
    t: 'les petites mains de la Team Dissonance',
    lv: 16,
    hb: 6,
    pb: 1,
    time: 'nuit',
    bio: 'gue',
    at: 'Poison',
    water: ['5,0'],
    rock: ['3,4'],
    foes: [
      ['nosferapti', [6, 1]],
      ['fantominus', [6, 3], { mv: ['picots', 'lechouille'] }],
      ['malosse', [7, 4]]
    ],
    rew: [400, 3],
    q: 'Hé, toi ! Cette lueur, quand tes Pokémon s’éveillent… La Dissonance va l’éteindre. Écarte-toi.',
    w: 'Pff… Le chef ne va pas aimer ça.',
    l: 'Rentre chez toi. La Résonance, c’est fini.',
    d: 'Des Sbires en uniforme gris rôdent sur la route. Ils parlent d’« éteindre la Résonance ». Ils sèment des Picots.'
  },
  {
    k: 'td2',
    after: 3,
    n: 'Admin Vesper',
    who: 'Vesper',
    t: 'Admin de la Team Dissonance, la voix de l’ombre',
    lv: 26,
    hb: 12,
    pb: 2,
    time: 'nuit',
    bio: 'tour',
    at: 'Spectre',
    mut: 'eclipse',
    water: [],
    rock: ['3,1', '3,4'],
    foes: [
      ['spectrum', [6, 2]],
      ['nosferalto', [7, 1]],
      ['noctali', [6, 4]],
      ['fantominus', [7, 3], { mv: ['toilegluante', 'lechouille'] }]
    ],
    rew: [900, 6],
    q: 'La nuit, on n’entend plus rien. Ni les cris, ni la Résonance. Restons dans le noir, veux-tu ?',
    w: 'Tu brilles trop… Orphée saura te faire taire.',
    l: 'Chut. Écoute le silence.',
    d: 'Vesper a plongé la vieille tour dans une nuit sans fin : Spectre et Ténèbres y sont plus forts, et vos tirs portent moins loin.'
  },
  {
    k: 'td3',
    after: 5,
    n: 'Admin Cobalt',
    who: 'Cobalt',
    t: 'Admin de la Team Dissonance, l’ingénieur',
    lv: 34,
    hb: 18,
    pb: 3,
    time: 'jour',
    bio: 'ligue',
    at: 'Acier',
    mut: 'champ',
    water: [],
    rock: ['3,2'],
    foes: [
      ['magneton', [6, 2]],
      ['steelix', [7, 1]],
      ['cizayox', [6, 4]],
      ['magneti', [7, 3], { mv: ['piegederoc', 'eclair'] }]
    ],
    rew: [1400, 10],
    q: 'J’ai miné tout le plateau. Chaque pas que tu feras, je l’ai déjà calculé.',
    w: 'Impossible… mes calculs étaient justes. C’est ta Résonance qui fausse tout.',
    l: 'Prévisible. Comme une machine.',
    d: 'Cobalt a truffé son laboratoire de pièges qui touchent tout le monde. Regardez où vous mettez les pieds.'
  },
  {
    k: 'td4',
    after: 7,
    n: 'Orphée Valcourt',
    who: 'Orphée Valcourt',
    t: 'chef de la Team Dissonance',
    lv: 42,
    hb: 26,
    pb: 4,
    time: 'nuit',
    bio: 'arene',
    at: 'Ténèbres',
    mut: 'verre',
    water: ['4,0', '4,5'],
    rock: ['3,2', '3,3'],
    foes: [
      ['tyranocif', [6, 2], { boss: true, hb: 60, pb: 6 }],
      ['ectoplasma', [7, 1]],
      ['demolosse', [6, 4]],
      ['magneton', [7, 3]],
      ['nostenfer', [7, 5]]
    ],
    rew: [2500, 20],
    q: 'La Résonance enchaîne les Pokémon aux humains. Je vais briser ce lien, pour eux. Montre-moi qu’il vaut la peine d’exister.',
    w: 'Alors ce lien… est réel. Garde-le. La Dissonance se tait.',
    l: 'Tu vois ? Sans Résonance, il ne reste que le silence.',
    d: 'Le QG de la Dissonance. Orphée a réglé l’arène en « Canons de verre » : chaque coup compte double… pour tout le monde.'
  }
].filter(T => T.foes.every(([id]) => BY[id]));


dissonanceDe = k => DISSONANCE.find(T => T.k === k) || null;


DISSONANCE.forEach((T, i) => {
  T.foes.forEach(([, , x]) => x && x.mv && (x.mv = x.mv.filter(m => MV[m])));
  SCEN[T.k] = {
    n: T.n,
    lvl: `Team Dissonance · combat ${i + 1} sur 4`,
    lim: 11,
    time: T.time,
    bio: T.bio,
    dissonance: i + 1,
    after: T.after,
    style: i === 3 ? 'boss' : null,
    at: T.at,
    mut: T.mut || null,
    water: T.water,
    rock: T.rock,
    hb: T.hb,
    pb: T.pb,
    lv: T.lv,
    d: T.d,
    foes: T.foes
  };
  OBST[T.k] = i === 0 ? { grass: ['2,2', '3,2', '2,3'] } : {};
});


CROCHETS.progres.push((S, rew, win) => {
  const D = SCEN[S.sc] || {},
    o = [0, 0];
  // saison : les captures des types de la saison
  const s = saison();
  if (s && s.types.length && rew.caught && rew.caught.length) {
    const n = rew.caught.filter(c => BY[c.id] && BY[c.id].t.some(t => s.types.includes(t))).length;
    if (n) {
      o[1] += n;
      rew.saison = n;
    }
  }
  // la Dissonance
  if (win && D.dissonance && (PROFILE.dissonance || 0) < D.dissonance) {
    PROFILE.dissonance = D.dissonance;
    const T = DISSONANCE[D.dissonance - 1];
    o[0] += T.rew[0];
    o[1] += T.rew[1];
    rew.dissonance = D.dissonance;
  }
  return o[0] || o[1] ? o : null;
});


CROCHETS.resultat.push(r => {
  const o = [];
  if (r.saison)
    o.push(`<div class="res-l"><h4>${saison() ? saison().n : 'Saison'}</h4><div class="rl"><span>Capture de saison : +${r.saison} Éclat${r.saison > 1 ? 's' : ''}</span><b>✦</b></div></div>`);
  if (r.dissonance) {
    const T = DISSONANCE[r.dissonance - 1];
    o.push(
      `<div class="res-l"><h4>Team Dissonance</h4><div class="rl"><span>${T.who} ${T.pl ? 'sont battus' : 'est battu'} (${r.dissonance} / 4). « ${T.w} »${r.dissonance === 4 ? ' La Team Dissonance est dissoute.' : ''}</span><b>${r.dissonance} / 4</b></div></div>`
    );
  }
  const R = B && REDIFF.get(B);
  if (R && R.best)
    o.push(
      `<div class="res-l"><h4>Meilleur coup</h4><div class="rl rd"><span><b>${R.best.label}</b>${R.best.det ? ` · ${R.best.det}` : ''}</span><button type="button" class="b b-sm" data-rediff>Revoir</button></div></div>`
    );
  return o.join('');
});


// la saison s'invite dans les combats sauvages
CROCHETS.creation.push(S => {
  const s = saison();
  if (!s || S.sc !== 'sauvage') return;
  if (s.wx && !S.wx) S.wx = { k: s.wx, n: 5 };
  if (s.nuit) {
    S.time = 'nuit';
    if (S.cyc && !S.cyc.fige) S.cyc = { ph: 'nuit', n: 0 };
  }
});
}
