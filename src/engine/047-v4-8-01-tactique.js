/* Section d'origine : v4.8-01-tactique.js */

import { MV } from './005-02-capacites.js';
import { BY, SCEN } from './009-03-pokemon.js';
import { PROFILE } from './011-05-etat-de-partie.js';
import { medal } from './014-08-outils.js';
import { CROCHETS } from './015-v4-8-00-crochets.js';
import { CDIR, K, P, affected, byUid, damage, flies, fromCube, hdist, inB, landed, mkUnit, nbrK, say, stun, targets, teff, toCube, uAt, uk } from './021-14-moteur-combat.js';
import { OBST, resolve, roleOf } from './023-16-roles-synergies-obstacles.js';
import { HC, poly, scSel } from './024-17-interface-combat.js';
import { PREF } from './026-20-campagne-tutoriel-son.js';
import { SHOP } from './032-v4-00-socle.js';
import { FOURNISSEURS_DEGATS, FOURNISSEURS_ROLES } from './044-v4-5-01-moteur-tactique.js';
import { MACHINES } from './045-v4-6-01-ct-cs.js';
import { rune413 } from './052-v4-13-01-roster-technique.js';
import { danger420Svg } from './060-v4-20-01-combat-intense.js';
import { duelCharge433 } from './068-v4-33-01-duel-et-tutoriel.js';

export let COLOSSES;


/* =====================================================================
   v4.8 : tactique
   ---------------------------------------------------------------------
   1. Pièges posés sur les cases : Picots, Piège de Roc, Toile Gluante.
      Un piège ne touche que le camp adverse. Il se déclenche quand un
      adversaire s'arrête dessus (déplacement, poussée, Force, Tornade) ;
      on ne peut pas le traverser sans s'y arrêter (sauf les volants).
      Il dure 6 manches. L'IA évite les pièges et sait en poser.
   2. Attaques chargées (« Tactique avancée ») : Lance-Soleil et Vol (CS02)
      partent en fin de manche, après les adversaires.
        - Lance-Soleil ×1,3, tout de suite sous le Soleil ; interrompu si
          le lanceur est K.O., endormi, gelé ou paralysé entre-temps.
        - Vol : le Pokémon est dans les airs pendant le tour adverse
          (les attaques passent sous lui), puis fond sur sa cible.
   3. Zones de contrôle (« Tactique avancée ») : entrer au contact d'un
      adversaire arrête le déplacement. Exemptés : volants, Spectre,
      Éclaireurs. Partir du contact reste libre.
   4. Vent (avec le « Plateau vivant ») : voir v4.7-01. Le brouillard
      dérive, le feu court 2 cases sous le vent, les attaques Vol font
      ×1,2 dans le sens du vent et ×0,85 contre.
   5. Colosses : Onix, Steelix et Léviator géants, sur 3 ou 4 cases.
      Immobiles, mais leurs attaques portent 2 cases plus loin.
      Le corps et la queue sont des cases à part entière : ils bloquent,
      se visent, balaient les cases voisines. Chaque partie intacte donne
      −3 dégâts au colosse (Carapace) ; briser une partie le blesse et le
      fait vaciller (son attaque annoncée est annulée).
   ===================================================================== */

/** Réglage « Tactique avancée » (Paramètres). Le combat guidé du prologue reste classique. */
export function tactiqueChoisie() {
  return PREF.tactique !== false && !(SCEN[scSel] && SCEN[scSel].tuto);
}


/** Profil : colosses vaincus. Fonctions déclarées : appelées dès le chargement de la partie. */
export function TAC0() {
  return { colosses: [] };
}


export function tacClean(p) {
  const o = TAC0();
  if (p && Array.isArray(p.colosses)) o.colosses = [...new Set(p.colosses.filter(k => /^co\d$/.test(k)))];
  return o;
}


export function poserPiege(S, u, m, k, ev) {
  const t = S.tiles[k];
  if (!t || t.rock || t.w || uAt(S, k)) {
    say(ev, 'Le piège ne tient pas ici.');
    return;
  }
  t.trap = { k: m.piege, side: u.side, by: u.uid, d: PIEGE_DUREE };
  say(ev, `${u.n} pose ${PIEGES[m.piege].n}.`);
  ev.push({ e: 'terrain', k });
}


/** Un Pokémon s'arrête sur une case : piège adverse ? */
export function piegeArrivee(S, v, ev) {
  if (!v || v.ko || v.seg) return;
  const k = uk(v),
    t = S.tiles[k],
    p = t && t.trap;
  if (!p || p.side === v.side) return;
  const n = PIEGES[p.k].n;
  if (p.k === 'roc') {
    say(ev, `${n} : des pierres s’abattent sur ${v.n}.`);
    damage(S, v, Math.max(1, Math.round(4 * teff('Roche', v.t))), ev, { ind: true });
  } else if (flies(v)) {
    say(ev, `${v.n} survole ${n}.`);
    return; // le piège reste
  } else if (p.k === 'picots') {
    say(ev, `${n} : ${v.n} marche sur les pointes.`);
    damage(S, v, 5, ev, { ind: true });
  } else if (v.tal === 'regardvif' || rune413(S, v)) say(ev, `${v.n} ignore la toile.`);
  else {
    v.web = Math.max(v.web, 2);
    say(ev, `${n} : ${v.n} est englué.`);
  }
  if (p.side === 'a') S.stats.pieges = (S.stats.pieges || 0) + 1; // succès (v4.9)
  t.trap = null;
  ev.push({ e: 'terrain', k });
}


/** L'IA : poser un piège quand elle n'a rien de mieux, ou dès le début du combat. */
export function planPiege(S, e, best, al) {
  const id = e.mv.find(x => MV[x] && MV[x].fx === 'piege');
  if (!id || e.seg || (best && !(S.round <= 2 && best.sc < 12))) return null;
  const m = MV[id];
  let bk = null,
    bs = -1e9;
  targets(S, e, m).forEach(k => {
    const d = Math.min(...al.map(a => hdist(a.pos, P(k))));
    if (d < 1) return;
    const s = -d * 3 - hdist(e.pos, P(k)) * 0.5;
    if (s > bs) {
      bs = s;
      bk = k;
    }
  });
  return bk ? { mv: id, k: bk } : null;
}


/* ---------- 2. Attaques chargées ---------- */
export function chargeDiffere(S, u, m) {
  if (!S.tac || u.side !== 'a' || !m.charge) return false;
  return !(m.charge === 'soleil' && S.wx && S.wx.k === 'soleil');
}


export function lancerCharge(S, u, mi, k) {
  const m = MV[u.mv[mi]],
    ev = [];
  u.chg = { mv: u.mv[mi], k };
  if (m.charge === 'vol') {
    u.vole = 1;
    say(ev, `${u.n} s’envole ! Il fondra sur sa cible en fin de manche, après les adversaires.`);
  } else say(ev, `${u.n} concentre son énergie : ${m.n} partira en fin de manche (×1,3), s’il n’est pas interrompu.`);
  ev.push({ e: 'chg', u: u.uid });
  return ev;
}


/** Une cible dans les airs : les attaques adverses passent sous elle. */
export function horsDAtteinte(S, v, u, ev) {
  if (v && v.vole && v.side !== u.side) {
    if (ev) say(ev, `${v.n} est dans les airs : l’attaque passe sous lui.`);
    return null;
  }
  return v;
}


export function dechargerCharges(S, ev) {
  S.units
    .filter(u => u.chg && duelCharge433(S, u)) // duel : après le tour adverse (v4.33)
    .forEach(u => {
      const c = u.chg,
        m = MV[c.mv],
        vol = u.vole;
      u.chg = null;
      u.vole = 0;
      if (u.ko || S.over) return;
      if (['SOM', 'GEL', 'PAR'].includes(u.badge) || u.skip > 0) {
        say(ev, `${u.n} est interrompu : ${m.n} échoue.`);
        return;
      }
      if (vol) {
        // il fond sur sa cible et se pose sur une case libre voisine, la plus proche de son départ
        const libres = nbrK(c.k)
          .filter(x => S.tiles[x] && !S.tiles[x].rock && (!uAt(S, x) || uAt(S, x) === u))
          .sort((a, b) => hdist(P(a), u.pos) - hdist(P(b), u.pos));
        if (libres.length && libres[0] !== uk(u)) {
          u.pos = P(libres[0]);
          ev.push({ e: 'mv', u: u.uid });
        }
        say(ev, `${u.n} fond sur sa cible !`);
        resolve(S, u, m, c.k).forEach(x => ev.push(x));
        S.stats.vols = (S.stats.vols || 0) + 1; // succès (v4.9)
        landed(S, u, ev);
      } else resolve(S, u, Object.assign({}, m, { p: Math.round(m.p * 1.3) }), c.k).forEach(x => ev.push(x));
    });
}


/* ---------- 3. Zones de contrôle et arrêts forcés (appelé par reach) ---------- */
function zoneControle(S, u, k) {
  if (!S.tac || flies(u) || u.t.includes('Spectre') || roleOf(u) === 'Éclaireur' || u.colosse || u.seg) return false;
  const p = P(k);
  return S.units.some(o => !o.ko && o.side !== u.side && hdist(o.pos, p) === 1);
}


/** Le déplacement s'arrête sur cette case (on peut y aller, pas la traverser). */
export function arretForce(S, u, k) {
  return (piegeHostile(S, u, k) && !flies(u)) || zoneControle(S, u, k);
}


/* ---------- 4. Vent : outils (l'effet sur le plateau est dans v4.7-01) ---------- */
/** La case voisine dans une direction (0 à 5), ou null au bord. */
export function pasVent(k, d) {
  const p = P(k),
    c = toCube(p[0], p[1]),
    D = CDIR[d],
    q = fromCube(c[0] + D[0], c[1] + D[1], c[2] + D[2]);
  return inB(q[0], q[1]) ? K(q[0], q[1]) : null;
}


/** La direction (0 à 5) qui va le plus de a vers b. */
function dirVers(a, b) {
  const A = toCube(a[0], a[1]),
    B2 = toCube(b[0], b[1]),
    v = [B2[0] - A[0], B2[1] - A[1], B2[2] - A[2]];
  if (!v[0] && !v[1] && !v[2]) return -1;
  let best = -1,
    bs = -1e9;
  CDIR.forEach((d, i) => {
    const s = d[0] * v[0] + d[1] * v[1] + d[2] * v[2];
    if (s > bs) {
      bs = s;
      best = i;
    }
  });
  return best;
}


export function chipVent(S) {
  if (!S || !S.vivant) return '';
  if (!S.vent) return '<span class="chip chip-vent" title="Pas de vent.">Vent calme</span>';
  const a = HC('3,2'),
    b = HC(pasVent('3,2', S.vent.d) || '3,2'),
    ang = Math.round((Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI);
  return `<span class="chip chip-vent" title="Attaques Vol ×1,2 dans le sens du vent, ×0,85 contre. Le brouillard dérive ; le feu court 2 cases sous le vent."><svg class="vent-fl" viewBox="0 0 16 16" aria-hidden="true" style="transform:rotate(${ang}deg)"><path d="M2 8h11M9 4l4 4-4 4"/></svg>Vent</span>`;
}


/** Dresse le colosse et ses parties à côté de lui (vers le fond du plateau). */
function faireColosse(S, u, x, D) {
  u.colosse = true;
  u.boss = true;
  let cur = uk(u);
  x.parts.forEach((nom, i) => {
    const k = nbrK(cur)
      .filter(n => S.tiles[n] && !S.tiles[n].rock && !uAt(S, n))
      .sort((a, b) => P(b)[0] - P(a)[0] || Math.abs(P(a)[1] - u.pos[1]) - Math.abs(P(b)[1] - u.pos[1]))[0];
    if (!k) return;
    const s = mkUnit(u.id, 'e', P(k), u.uid + 's' + i, Object.assign({}, D, { hb: x.shb, pb: Math.max(0, (x.pb || 0) - 2) }));
    Object.assign(s, { seg: true, of: u.uid, n: `${nom} ${de(u.n)}`, mv: ['coupdequeue'], tal: null, ferm: false });
    S.units.push(s);
    cur = k;
  });
}


/** Une partie brisée, ou le colosse à terre (appelé par damage). */
export function colosseKO(S, v, ev) {
  if (v.seg) {
    S.stats.ko--;
    const b = byUid(S, v.of);
    if (!b || b.ko) return;
    say(ev, `${v.n} est brisé ! ${b.n} vacille.`);
    S.stats.parts = (S.stats.parts || 0) + 1; // succès (v4.9)
    damage(S, b, Math.round(b.mhp * 0.12), ev, { ind: true });
    if (!b.ko) stun(S, b, 'PAR', ev, true);
  } else if (v.colosse)
    S.units.forEach(s => {
      if (s.seg && s.of === v.uid && !s.ko) {
        s.hp = 0;
        s.ko = true;
        s.intent = null;
        ev.push({ e: 'ko', u: s.uid });
      }
    });
}


/* ---------- à l'écran ---------- */
/** Pièges, chargements et liens des colosses, dessinés avec les marques. */
export function dessinTactique(S, k, x, y) {
  const t = S.tiles[k];
  let h = '';
  if (t.trap) {
    const c = t.trap.side === 'a' ? '#ffd75e' : '#ef6f6c',
      X = x.toFixed(1),
      Y = (y + 10).toFixed(1);
    if (t.trap.k === 'picots')
      h += `<g class="trap" transform="translate(${X},${Y})" style="--c:${c}"><path d="M-9 4l3-8 3 8M-3 4l3-8 3 8M3 4l3-8 3 8"/></g>`;
    else if (t.trap.k === 'roc')
      h += `<g class="trap" transform="translate(${X},${Y})" style="--c:${c}"><path d="M-9 4l2-6h5l2 6ZM1 4l2-8h5l2 8Z"/></g>`;
    else
      h += `<g class="trap web" transform="translate(${X},${Y})" style="--c:${c}"><path d="M-10 0h20M0-8v16M-7-6l14 12M7-6l-14 12"/><circle r="4"/><circle r="7.5"/></g>`;
  }
  h += danger420Svg(S, k, x, y); // dangers annoncés (v4.20)
  return h;
}


export function liensColosses(S) {
  let h = '';
  S.units.forEach(s => {
    if (!s.seg || s.ko) return;
    const i = +s.uid.split('s').pop(),
      prev = i > 0 ? byUid(S, s.of + 's' + (i - 1)) : byUid(S, s.of),
      a = prev && !prev.ko ? HC(uk(prev)) : null,
      b = HC(uk(s));
    if (a) h += `<line class="col-lien" x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}"/>`;
  });
  return h;
}


/** Les cases que vise une attaque chargée d'un allié. */
export function chargesSurPlateau(S) {
  let h = '';
  S.units.forEach(u => {
    if (!u.chg || u.ko) return;
    const m = MV[u.chg.mv];
    (u.vole ? [u.chg.k] : affected(S, u, m, u.chg.k)).forEach(k => {
      h += poly(k, 'h-charge');
    });
  });
  return h;
}


export function piegeTip(p) {
  return `${PIEGES[p.k].n} (${p.side === 'a' ? 'à vous' : 'adverse'}) : ${PIEGES[p.k].d}, encore ${p.d} manche${p.d > 1 ? 's' : ''}. On ne le traverse pas sans s’y arrêter`;
}

/* ---------- 1. Pièges ---------- */
const PIEGES = {
  picots: { n: 'Picots', d: '5 dégâts au premier adversaire qui s’y arrête, sauf volants' },
  roc: { n: 'Piège de Roc', d: 'dégâts selon la faiblesse à la Roche, volants compris' },
  toile: { n: 'Toile Gluante', d: 'englue le premier adversaire qui s’y arrête (−3 Mouvement), sauf volants' }
};


const PIEGE_DUREE = 6;


export const piegeHostile = (S, u, k) => {
  const t = S.tiles[k];
  return !!(t && t.trap && t.trap.side !== u.side);
};


/* ---------- 5. Colosses ---------- */
export const de = n => (/^[AEIOUYÉÈÊ]/i.test(n) ? 'd’' : 'de ') + n;


const colosseOf = k => COLOSSES.find(C => C.k === k) || null;


const partiesIntactes = (S, b) => S.units.filter(s => s.seg && s.of === b.uid && !s.ko).length;

// Instructions exécutées au démarrage, dans l'ordre d'origine (voir index.js).
export function __init() {

/* ---------- capacités ---------- */
Object.assign(MV, {
  picots: {
    n: 'Picots',
    t: 'Sol',
    p: 0,
    r: 3,
    sh: 'one',
    fx: 'piege',
    piege: 'picots',
    d: 'Pose des Picots sur une case libre à 3 cases : 5 dégâts au premier adversaire qui s’y arrête (sauf volants).'
  },
  piegederoc: {
    n: 'Piège de Roc',
    t: 'Roche',
    p: 0,
    r: 3,
    sh: 'one',
    fx: 'piege',
    piege: 'roc',
    d: 'Pose un Piège de Roc sur une case libre à 3 cases : dégâts selon la faiblesse à la Roche, volants compris.'
  },
  toilegluante: {
    n: 'Toile Gluante',
    t: 'Insecte',
    p: 0,
    r: 3,
    sh: 'one',
    fx: 'piege',
    piege: 'toile',
    d: 'Tend une Toile Gluante sur une case libre à 3 cases : le premier adversaire qui s’y arrête est englué (−3 Mouvement).'
  },
  volcs: {
    n: 'Vol',
    t: 'Vol',
    p: 12,
    r: 4,
    sh: 'one',
    charge: 'vol',
    d: 'Portée 4. Tactique avancée : s’envole (intouchable pendant le tour adverse), puis fond sur sa cible en fin de manche.'
  },
  coupdequeue: { n: 'Coup de Queue', t: 'Normal', p: 7, r: 0, sh: 'ring', d: 'Balaie les 6 cases autour.' }
});


MV.lancesoleil.charge = 'soleil';


MV.lancesoleil.d = 'Ligne de 3. ×1,5 sous le Soleil. Tactique avancée : part en fin de manche (×1,3), tout de suite sous le Soleil.';


CROCHETS.avantFinManche.push((S, ev) => {
  dechargerCharges(S, ev);
  // usure des pièges
  for (const k in S.tiles) {
    const t = S.tiles[k];
    if (t.trap && --t.trap.d <= 0) {
      t.trap = null;
      ev.push({ e: 'terrain', k });
    }
  }
});


FOURNISSEURS_DEGATS.push({
  id: 'vent',
  fournir: (c, { S, u, t, typ }) => {
    if (!S.vent || typ !== 'Vol' || !u.pos || !t.pos) return null;
    const d = dirVers(u.pos, t.pos);
    if (d === S.vent.d) return { mul: 1.2, libelle: 'Vent arrière' };
    if (d === (S.vent.d + 3) % 6) return { mul: 0.85, libelle: 'Vent de face' };
    return null;
  }
});


COLOSSES = [
  {
    k: 'co1',
    id: 'onix',
    n: 'Onix géant',
    title: 'le Serpent de roc',
    badges: 2,
    lv: 18,
    lim: 11,
    time: 'jour',
    bio: 'roche',
    at: 'Roche',
    hb: 140,
    pb: 6,
    shb: 30,
    mv: ['eboulement', 'jetpierres'],
    parts: ['Corps', 'Queue'],
    water: [],
    rock: ['3,0', '3,5'],
    escort: [
      ['racaillou', [6, 0], { mv: ['piegederoc', 'jetpierres'] }],
      ['racaillou', [6, 5], { mv: ['picots', 'jetpierres'] }]
    ],
    rew: [800, 8],
    d: 'Un Onix trois fois plus grand que les autres barre le col. Son corps et sa queue occupent leurs propres cases : brisez-les pour faire tomber sa carapace. Ses Racaillou posent des pièges.'
  },
  {
    k: 'co2',
    id: 'steelix',
    n: 'Steelix colossal',
    title: 'l’Anneau d’acier',
    badges: 5,
    lv: 32,
    lim: 12,
    time: 'nuit',
    bio: 'ligue',
    at: 'Acier',
    hb: 185,
    pb: 8,
    shb: 36,
    mv: ['eboulement', 'seisme'],
    parts: ['Anneaux', 'Corps', 'Queue'],
    water: [],
    rock: ['2,2'],
    escort: [
      ['grolem', [7, 0], { mv: ['piegederoc', 'eboulement'] }],
      ['magneton', [7, 5]]
    ],
    rew: [1400, 12],
    d: 'Steelix s’est enroulé sur quatre cases. Chaque anneau intact le protège ; chaque anneau brisé le fait vaciller. Restez loin de sa queue : elle balaie tout autour.'
  },
  {
    k: 'co3',
    id: 'leviator',
    n: 'Léviator des abysses',
    title: 'la Colère des flots',
    badges: 7,
    lv: 42,
    lim: 12,
    time: 'nuit',
    bio: 'gue',
    at: 'Eau',
    hb: 180,
    pb: 8,
    shb: 36,
    mv: ['hydrocanon', 'ouragan'],
    parts: ['Corps', 'Nageoires', 'Queue'],
    water: ['5,1', '5,2', '5,3', '6,1', '6,4'],
    rock: [],
    escort: [
      ['crustabri', [7, 0], { mv: ['picots', 'blizzard'] }],
      ['lokhlass', [7, 5]]
    ],
    rew: [2000, 16],
    d: 'Léviator surgit du lac, le corps déroulé sur quatre cases. Ses nageoires et sa queue frappent tout ce qui s’approche ; Crustabri sème des Picots sur la rive.'
  }
].filter(C => BY[C.id] && C.escort.every(([e]) => BY[e]));


COLOSSES.forEach(C => {
  C.escort.forEach(([, , x]) => x && x.mv && (x.mv = x.mv.filter(m => MV[m]))); // capacités absentes : ignorées
  SCEN[C.k] = {
    n: C.n,
    lvl: `Colosse · ${C.title}`,
    lim: C.lim,
    time: C.time,
    bio: C.bio,
    colosse: C.id,
    badges: C.badges,
    style: 'boss',
    at: C.at,
    water: C.water,
    rock: C.rock,
    hb: Math.round(C.hb / 4), // l'escorte
    pb: Math.max(0, C.pb - 2),
    lv: C.lv,
    d: C.d,
    foes: [[C.id, [5, 2], { boss: true, colosse: true, hb: C.hb, pb: C.pb, mv: C.mv, parts: C.parts, shb: C.shb }], ...C.escort]
  };
  OBST[C.k] = {};
});


FOURNISSEURS_ROLES.push({
  id: 'carapace',
  fournir: (c, { S, t }) => {
    if (!t.colosse) return null;
    const n = partiesIntactes(S, t);
    return n ? { add: -3 * n, libelle: 'Carapace' } : null;
  }
});


/* ---------- branchements sur le combat ---------- */
CROCHETS.creation.push((S, opt, D0) => {
  if (opt && opt.tactique) S.tac = true;
  (D0.foes || []).forEach(([, , x], i) => {
    const u = byUid(S, 'e' + i);
    if (!u || !x) return;
    if (x.mv) u.mv = x.mv.filter(m => MV[m]);
    if (x.colosse) faireColosse(S, u, x, D0);
  });
});


CROCHETS.progres.push((S, rew, win) => {
  const C = colosseOf(S.sc);
  if (!C || !win) return null;
  PROFILE.colosses = PROFILE.colosses || [];
  if (PROFILE.colosses.includes(C.k)) return null;
  PROFILE.colosses.push(C.k);
  rew.colosse = C.k;
  return C.rew;
});


CROCHETS.resultat.push(r => {
  if (!r.colosse) return '';
  const C = colosseOf(r.colosse);
  return `<div class="res-l"><h4>Colosse</h4><div class="rl">${medal(BY[C.id].t)}<span>${C.n} terrassé · ${PROFILE.colosses.length} / ${COLOSSES.length} colosses</span><b>★</b></div></div>`;
});


/* ---------- CT, DT et CS en Boutique ---------- */
[
  ['ct76', { num: 'CT76', mv: 'piegederoc', p: 2500, types: ['Roche', 'Sol', 'Acier'] }],
  ['dt01', { num: 'DT01', mv: 'picots', p: 2000, types: ['Sol', 'Insecte', 'Poison', 'Acier'] }],
  ['dt02', { num: 'DT02', mv: 'toilegluante', p: 2000, types: ['Insecte'] }],
  ['cs02', { num: 'CS02', mv: 'volcs', g: 12, cs: true, types: ['Vol', 'Dragon'] }]
].forEach(([k, M]) => {
  MACHINES[k] = M;
  const m = MV[M.mv];
  SHOP[k] = {
    n: `${M.num} · ${m.n}`,
    sn: M.num,
    d: `${m.t} · ${m.p ? 'Puissance ' + m.p + ' · ' : ''}${m.d}${M.cs ? ' Réutilisable.' : ' Usage unique.'}`,
    cat: 'machines',
    mv: M.mv,
    cs: !!M.cs,
    ...(M.g ? { g: M.g } : { p: M.p })
  };
});
}
