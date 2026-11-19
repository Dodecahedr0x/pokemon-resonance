/* Section d'origine : 15-systemes-objets-liens-ia.js */

import { GYMS, RX } from './004-01-donnees.js';
import { MV } from './005-02-capacites.js';
import { BY, MON, SCEN } from './009-03-pokemon.js';
import { PROFILE, isCamp, lvlOfPts, pairKey } from './011-05-etat-de-partie.js';
import { BADGES } from './013-07-arenes.js';
import { P, byUid, dmgOf, effR, fin, hasNx, hdist, movPts, mvType, say, targets, teff, uk } from './021-14-moteur-combat.js';
import { resolve } from './023-16-roles-synergies-obstacles.js';
import { B } from './024-17-interface-combat.js';
import { CHAMP_L } from './030-24-prestige-mise-en-scene.js';
import { BALL_SEL, CAP_K, SHOP, __set_BALL_SEL, bagN } from './032-v4-00-socle.js';
import { renderWallet } from './035-v4-03-interface.js';
import { RIVAL_STEPS } from './043-v4-4-01-aventure-plus.js';
import { lockJ415, regionJ415, routeNom } from './054-v4-15-01-johto.js';
import { dom416, duoDe416 } from './055-v4-16-01-johto-vivant.js';
import { lockH419, regionH419 } from './059-v4-19-01-hoenn.js';
import { lockRiv429 } from './064-v4-29-01-qualite.js';
import { HLEG435 } from './071-v4-38-les-legendaires-de-hoenn.js';

export let DIFF, immob, DUOT, ELITE;
let RX_COUNTER;
export function __set_captureReq(v) { return (captureReq = v); }
export function __set_scenLock(v) { return (scenLock = v); }


export function linkLvl(S, a, b) {
  return lvlOfPts((S.links || {})[pairKey(a, b)] || 0);
}


/* --- dégâts : Évoluroc, Lien Soutien (−1), Lien Synchro (+25 % sur les réactions du duo) --- */
export function dmgItemsLinks(S, u, t, d, mult) {
  if (t.side === 'a') {
    let red = 0;
    if (t.item === 'evoluroc' && hasNx(t)) red++;
    if (
      S.links &&
      S.units.some(o => o !== t && !o.ko && o.side === 'a' && hdist(o.pos, t.pos) === 1 && linkLvl(S, t.sp, o.sp) >= 1)
    )
      red++;
    if (red) d = Math.max(1, d - red);
  }
  if (mult > 1 && u.side === 'a' && t.side === 'e' && S.links) {
    const tl = S.tiles[uk(t)],
      mk = tl && tl.mark;
    if (mk && mk.by && mk.by !== u.uid) {
      const p = byUid(S, mk.by);
      if (p && p.side === 'a' && linkLvl(S, u.sp, p.sp) >= 2) d = Math.round(d * 1.25);
    }
  }
  return d;
}


export function captureReq(S, u, e) {
  const r = [
    { ok: !S.noCatch, t: 'Pokémon sauvage' },
    { ok: e.hp <= e.mhp * 0.25, t: 'PV sous 25 %' },
    { ok: immob(e), t: 'immobilisé : Gel, Paralysie, Sommeil, Racines ou Toile' },
    { ok: !!u && !u.ko && hdist(u.pos, e.pos) === 1, t: 'un allié au contact' },
    { ok: !!u && !u.acted && !u.sn, t: 'cet allié n’a pas encore agi' },
    { ok: S.voix >= 2, t: '2 Voix' }
  ];
  if ((SCEN[S.sc] || {}).cap429) r.push({ ok: e.sp === SCEN[S.sc].cap429, t: 'la légende elle-même, pas son escorte' }); // v4.29
  if ((SCEN[S.sc] || {}).cap435) {
    const L = HLEG435.find(x => x.id === SCEN[S.sc].cap435); // légendes de Hoenn (v4.38)
    r.push({ ok: e.sp === L.id, t: 'la légende elle-même, pas son escorte' }, { ok: !!L.cap.f(S, L, e), t: L.cap.t });
  }
  // la Ball choisie change les conditions
  const k = CAP_K,
    h = e.hp / e.mhp;
  if (k === 'super' || k === 'hyper') r[1] = { ok: h <= 0.4, t: 'PV sous 40 %' };
  if (k === 'hyper') r[2] = { ok: true, t: 'Hyper Ball : pas besoin d’immobiliser' };
  if (k === 'master') {
    r[1] = { ok: true, t: 'Master Ball : PV indifférents' };
    r[2] = { ok: true, t: 'Master Ball : pas besoin d’immobiliser' };
  }
  r.push({ ok: bagN(k) > 0, t: `une ${SHOP[k].n} dans le Sac` });
  return r;
}


export function canCapture(S, u, e) {
  return !!(
    S.phase === 'player' &&
    u &&
    e &&
    u.side === 'a' &&
    e.side === 'e' &&
    !e.ko &&
    captureReq(S, u, e).every(x => x.ok)
  );
}


export function pCapture(S, u, e) {
  if (!canCapture(S, u, e)) return null;
  const k = CAP_K;
  const ev = [];
  S.voix -= 2;
  S.stats.voix += 2;
  e.ko = true;
  e.caught = true;
  e.intent = null;
  S.stats.caught.push(e.sp);
  if (e.shiny) (S.stats.shiny = S.stats.shiny || []).push(e.sp);
  u.acted = true;
  u.moved = true;
  ev.push({ e: 'catch', u: e.uid, by: u.uid });
  say(ev, `${e.n} est capturé !`);
  fin(S, ev);
  if (S === B) {
    // une Ball du Sac est consommée
    PROFILE.bag[k] = Math.max(0, bagN(k) - 1);
    if (!PROFILE.bag[k]) delete PROFILE.bag[k];
    __set_BALL_SEL(null);
    ev.unshift({ e: 'msg', s: `${SHOP[k].n} lancée !` });
    setTimeout(renderWallet, 0);
  }
  return ev;
}


export function duoOf(S, u, p) {
  if (!u || !p || u === p || u.side !== 'a' || p.side !== 'a') return null;
  const D = duoDe416(pairKey(u.sp, p.sp)); // chaque duo a sa technique (v4.16)
  return D && linkLvl(S, u.sp, p.sp) >= 3 ? D : null;
}


export function duoParts(S, u, p) {
  const D = duoOf(S, u, p);
  if (!D) return null;
  const A = u.sp === D.first ? u : p;
  return { D, A, Bu: A === u ? p : u };
}


export function canDuo(S, u, p) {
  return !!(
    S.phase === 'player' &&
    duoOf(S, u, p) &&
    !u.ko &&
    !p.ko &&
    !u.acted &&
    !p.acted &&
    !u.sn &&
    !p.sn &&
    S.voix >= 2 &&
    hdist(u.pos, p.pos) <= 2
  );
}


export function duoTargets(S, u, p) {
  const X = duoParts(S, u, p);
  if (!X) return [];
  const { D, A } = X;
  if (D.a.sh === 'line') return targets(S, A, D.a);
  const o = [];
  for (const k in S.tiles) {
    if (S.tiles[k].rock) continue;
    const d = hdist(A.pos, P(k));
    if (d >= 1 && d <= D.r) o.push(k);
  }
  return o;
}


export function pDuo(S, u, p, k) {
  if (!canDuo(S, u, p) || !duoTargets(S, u, p).includes(k)) return null;
  const { D, A, Bu } = duoParts(S, u, p),
    ev = [];
  S.voix -= 2;
  S.stats.voix += 2;
  S.stats.duo++;
  say(ev, `Technique combinée : ${D.n} !`);
  ev.push({ e: 'duo', a: A.uid, b: Bu.uid });
  resolve(S, A, D.a, k).forEach(x => ev.push(x));
  if (!S.over && !Bu.ko) resolve(S, Bu, D.b, k).forEach(x => ev.push(x));
  u.acted = u.moved = p.acted = p.moved = true;
  return fin(S, ev);
}


/* --- aperçu générique (mêmes règles que l’aperçu des capacités) --- */
export function previewRun(S, run, aff) {
  const C = JSON.parse(JSON.stringify(S)),
    ev = run(C) || [],
    diff = [];
  C.units.forEach(x => {
    const o = byUid(S, x.uid),
      dh = x.hp - o.hp,
      st = x.badge && x.badge !== o.badge ? x.badge : null,
      can = !!(o.intent && !x.intent && !x.ko) || !!(S.jit && x.side === 'e' && !x.ko && !o.done && x.perdu && !o.perdu),
      ret = !!(o.intent && x.intent && o.intent.k !== x.intent.k) || !!(S.jit && x.force && !o.force),
      mv = o.pos[0] !== x.pos[0] || o.pos[1] !== x.pos[1],
      ko = x.ko && !o.ko && !x.caught,
      rt = x.root > o.root,
      wb = x.web > o.web,
      evw = x.side === 'e' && !x.ko && hasNx(x) && x.hp <= x.mhp * 0.5 && o.hp > o.mhp * 0.5,
      en = x.side === 'a' ? x.en - o.en : 0,
      cg = !!x.caught && !o.caught;
    if (dh || st || ko || can || ret || mv || rt || wb || evw || en > 0 || cg)
      diff.push({ uid: x.uid, n: x.n, side: x.side, dh, st, ko, can, ret, mv, rt, wb, evw, en, cg });
  });
  return {
    diff,
    rxs: ev.filter(e => e.e === 'rx').map(e => e.rx),
    aff: aff || [],
    over: C.over,
    wx: ev.some(e => e.e === 'msg' && e.s.startsWith('Météo'))
  };
}


/* --- IA : vise les Pokémon fragiles ou immobiles, met à l’abri ceux qui vont évoluer --- */
export function threatAt(S, e, pos) {
  let t = 0;
  S.units.forEach(a => {
    if (a.side !== 'a' || a.ko) return;
    let mr = 0,
      best = 0;
    a.mv.forEach(id => {
      const m = MV[id];
      if (!(m.p || m.fix) || m.sh === 'self') return;
      mr = Math.max(mr, m.sh === 'ring' ? 1 : effR(a, m, S));
      best = Math.max(best, dmgOf(S, a, m, e, mvType(S, a, m), 1));
    });
    if (mr && hdist(a.pos, pos) <= movPts(S, a) + mr) t += best;
  });
  return t;
}


export function aiFallback(S, e, opts, al, here) {
  const lv = (DIFF[S.diff] || DIFF.normal).ai;
  if (lv && hasNx(e) && e.hp <= e.mhp * 0.5) {
    let bk = here,
      bt = threatAt(S, e, e.pos);
    for (const pk in opts) {
      const t = threatAt(S, e, P(pk)) + (S.tiles[pk].lava > 0 ? 6 : 0);
      if (t < bt) {
        bt = t;
        bk = pk;
      }
    }
    return [bk, 'se met à l’abri pour évoluer'];
  }
  let bk = here,
    bd = 1e9;
  for (const pk in opts) {
    const d = Math.min(...al.map(a => hdist(P(pk), a.pos)));
    if (d < bd) {
      bd = d;
      bk = pk;
    }
  }
  return [bk, 's’approche'];
}


export function wildScen(id, tod, shiny, dom) {
  const m = BY[id],
    b = BADGES.length;
  SCEN.sauvage = {
    n: `${m.n}${dom ? ' Dominant' : ''}${shiny ? ' chromatique' : ''}${dom ? '' : ' sauvage'}`,
    lvl: routeNom() + ' · rencontre',
    lim: 8,
    time: tod === 'nuit' ? 'nuit' : 'jour',
    bio: 'gue',
    water: ['5,0', '5,1'],
    rock: ['3,4'],
    hb: 6 + b * 3 + (regionJ415() ? 10 : 0) + (regionH419() ? 18 : 0),
    pb: Math.min(3, Math.floor(b / 2)),
    lv: 6 + b * 4 + (regionJ415() ? 8 : 0) + (regionH419() ? 16 : 0),
    catch: true,
    wild: true,
    d: 'Affaiblissez-le sous 25 % de ses PV, immobilisez-le (Gel, Paralysie, Sommeil, Racines, Toile), puis capturez-le au contact pour 2 Voix. K.O., il s’enfuit.',
    foes: [shiny ? [id, [6, 2], { shiny: true }] : [id, [6, 2]]]
  };
  if (dom) dom416(SCEN.sauvage, id, shiny); // Pokémon Dominant (v4.16)
  return SCEN.sauvage;
}


export function champBuild() {
  const H = (PROFILE.hist || []).slice(-10),
    atk = {},
    def = {},
    rx = {};
  H.forEach(h => {
    (h.atk || []).forEach(t => (atk[t] = (atk[t] || 0) + 1));
    (h.def || []).forEach(t => (def[t] = (def[t] || 0) + 1));
    Object.entries(h.rx || {}).forEach(([k, v]) => (rx[k] = (rx[k] || 0) + v));
  });
  const topRx = Object.entries(rx).sort((a, b) => b[1] - a[1])[0],
    cnt = RX_COUNTER[topRx && topRx[0]];
  const pool = MON.filter(m => m.st >= 2 || !m.nx);
  const score = m => {
    let s = m.s[0] + m.s[1] + m.s[2];
    for (const t in atk) {
      const e = teff(t, m.t);
      s += atk[t] * (e === 0 ? 2.5 : e < 1 ? 1.2 : e > 1 ? -1.4 : 0);
    }
    for (const t in def) {
      if (m.mv.some(id => MV[id].p && teff(MV[id].t, [t]) > 1)) s += def[t] * 0.8;
    }
    if (cnt && ((cnt.t || []).some(t => m.t.includes(t)) || (cnt.tal || []).includes(m.tal)))
      s += 4 + (topRx[1] || 0) * 0.6;
    return s;
  };
  const ranked = pool.map(m => ({ m, s: score(m) })).sort((a, b) => b.s - a.s),
    pick = [],
    fams = new Set();
  for (const x of ranked) {
    if (pick.length >= 4) break;
    if (fams.has(x.m.base)) continue;
    pick.push(x.m);
    fams.add(x.m.base);
  }
  const mid = ranked.find(x => x.m.nx && x.m.st === 2 && !fams.has(x.m.base));
  if (mid) pick.push(mid.m);
  else {
    const f = ranked.find(x => !fams.has(x.m.base));
    if (f) pick.push(f.m);
  }
  const topAtk = Object.entries(atk)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(x => x[0]);
  const why = [];
  if (!H.length) why.push('Aucun combat étudié : il aligne sa meilleure équipe.');
  else {
    why.push(`${H.length} combat${H.length > 1 ? 's' : ''} étudié${H.length > 1 ? 's' : ''}.`);
    if (topAtk.length)
      why.push(`Vos attaques favorites : ${topAtk.join(' et ')}. Il aligne des Pokémon qui les encaissent.`);
    if (cnt) {
      const c = pick.find(m => (cnt.t || []).some(t => m.t.includes(t)) || (cnt.tal || []).includes(m.tal));
      why.push(`Votre réaction préférée : ${RX[topRx[0]].n}.${c ? ` ${c.n} est là : ${cnt.why}.` : ''}`);
    }
  }
  const POS = [
    [6, 1],
    [7, 2],
    [6, 3],
    [7, 4],
    [6, 5]
  ];
  SCEN.champ = {
    n: 'Champion de la Ligue',
    lvl: `Final · ${CHAMP_L.n}`,
    lim: 10,
    time: 'nuit',
    bio: 'ligue',
    champ: true,
    style: 'piege',
    d: why.join(' '),
    why,
    water: ['4,2', '5,2', '4,3'],
    rock: ['3,0', '3,5'],
    hb: 42,
    pb: 7,
    lv: 55,
    foes: pick.slice(0, 5).map((m, i) => [m.id, POS[i]])
  };
  return SCEN.champ;
}


/* --- disponibilité d’un combat selon le mode --- */
export function scenLock(k) {
  const D = SCEN[k];
  if (!D || !isCamp()) return null;
  if (D.rival429) return lockRiv429(D); // Kael, les Échos (v4.29)
  if (D.hebdo429 && BADGES.length < 2) return 'Le défi de la semaine s’ouvre après 2 badges.';
  if (D.hoenn != null || D.hfinal) return lockH419(k, D); // Hoenn (v4.19)
  if (D.johto != null || D.jfinal || D.lac || D.jdis || D.roam) return lockJ415(k, D); // Johto (v4.15, v4.16)
  if (D.gym != null && D.gym > 0 && !BADGES.includes(D.gym - 1)) return `Gagnez d’abord le badge ${GYMS[D.gym - 1].t}.`;
  if (D.elite) {
    if (BADGES.length < 8) return 'Il faut les 8 badges.';
    if (PROFILE.elite < D.elite - 1) return `Battez d’abord ${SCEN[ELITE[D.elite - 2]].n}.`;
  }
  if (D.champ && PROFILE.elite < 4) return 'Battez d’abord le Conseil 4.';
  if (D.rival && BADGES.length < RIVAL_STEPS[D.rival - 1].after)
    return `Kael vous attend après le badge n° ${RIVAL_STEPS[D.rival - 1].after}.`;
  if ((D.legend || D.tower) && PROFILE.elite < 5) return 'Après-jeu : battez d’abord la Championne.';
  if (D.dissonance && BADGES.length < D.after) return `La Team Dissonance frappera après le badge n° ${D.after}.`; // v4.11
  if (D.dissonance && (PROFILE.dissonance || 0) < D.dissonance - 1) return 'Battez d’abord le combat précédent de la Dissonance.';
  if (D.colosse && BADGES.length < D.badges) return `Il faut ${D.badges} badges pour affronter ce colosse.`; // v4.8
  // l’exhibition de la Ligue (niveau 40) n’est pas ouverte dès le premier jour
  if (k === 'ligue' && BADGES.length < 4) return 'Exhibition réservée aux dresseurs qui ont 4 badges.';
  return null;
}

// Instructions exécutées au démarrage, dans l'ordre d'origine (voir index.js).
export function __init() {

/* ===================== SYSTÈMES v1.0 : objets, Liens, duos, capture, fatigue, difficulté, IA ===================== */
DIFF = {
  facile: { hb: 0.4, pb: -1, lim: 2, ai: 0 },
  normal: { hb: 1, pb: 0, lim: 0, ai: 1 },
  expert: { hb: 1.3, hbAdd: 4, pb: 1, lim: -1, ai: 2 }
};


/* --- capture --- */
immob = e => ['GEL', 'PAR', 'SOM'].includes(e.badge) || e.root > 0 || e.web > 0;


/* --- techniques combinées (palier 3 de Lien) --- */
DUOT = {
  'magicarpe|pichu': {
    n: 'Pluie d’Orage',
    first: 'magicarpe',
    r: 3,
    d: 'Magicarpe trempe une zone, Pichu y lance le Court-circuit.',
    a: { n: 'Pluie d’Orage', t: 'Eau', p: 4, r: 3, sh: 'area', mk: 'trempe' },
    b: { n: 'Pluie d’Orage', t: 'Électrik', p: 9, r: 4, sh: 'one' }
  },
  'bulbizarre|salameche': {
    n: 'Mur de Cendres',
    first: 'bulbizarre',
    r: 3,
    d: 'Une ligne de racines que Salamèche embrase aussitôt.',
    a: { n: 'Mur de Cendres', t: 'Plante', p: 3, r: 3, sh: 'line', mk: 'enracine' },
    b: { n: 'Mur de Cendres', t: 'Feu', p: 8, r: 4, sh: 'one' }
  },
  'lokhlass|racaillou': {
    n: 'Avalanche',
    first: 'lokhlass',
    r: 3,
    d: 'Une zone gelée, brisée par un éboulement.',
    a: { n: 'Avalanche', t: 'Glace', p: 6, r: 3, sh: 'area', mk: 'givre' },
    b: { n: 'Avalanche', t: 'Sol', p: 7, r: 4, sh: 'area' }
  },
  'machoc|onix': {
    n: 'Séisme Tellurique',
    first: 'onix',
    r: 3,
    d: 'Onix fissure le sol, Machoc y déclenche l’onde sismique.',
    a: { n: 'Séisme Tellurique', t: 'Roche', p: 5, r: 3, sh: 'area', mk: 'fissure' },
    b: { n: 'Séisme Tellurique', t: 'Combat', p: 9, r: 4, sh: 'one' }
  },
  'abra|fantominus': {
    n: 'Cauchemar',
    first: 'fantominus',
    r: 3,
    d: 'Une vague d’ombre, puis Abra endort la cible.',
    a: { n: 'Cauchemar', t: 'Spectre', p: 7, r: 3, sh: 'area' },
    b: { n: 'Cauchemar', t: 'Psy', p: 5, r: 4, sh: 'one', fx: 'sleep' }
  },
  'germignon|hericendre': {
    n: 'Brasier Floral',
    first: 'germignon',
    r: 3,
    d: 'Un parterre de racines, embrasé par Héricendre.',
    a: { n: 'Brasier Floral', t: 'Plante', p: 3, r: 3, sh: 'area', mk: 'enracine' },
    b: { n: 'Brasier Floral', t: 'Feu', p: 8, r: 4, sh: 'one' }
  },
  'kaiminus|wattouat': {
    n: 'Marais Électrique',
    first: 'kaiminus',
    r: 3,
    d: 'Kaiminus inonde la zone, Wattouat l’électrise.',
    a: { n: 'Marais Électrique', t: 'Eau', p: 5, r: 3, sh: 'area', mk: 'trempe' },
    b: { n: 'Marais Électrique', t: 'Électrik', p: 8, r: 4, sh: 'one' }
  },
  'carapuce|magneti': {
    n: 'Torrent Magnétique',
    first: 'carapuce',
    r: 3,
    d: 'Carapuce trempe la cible, Magnéti la foudroie.',
    a: { n: 'Torrent Magnétique', t: 'Eau', p: 6, r: 3, sh: 'area', mk: 'trempe' },
    b: { n: 'Torrent Magnétique', t: 'Électrik', p: 8, r: 4, sh: 'one' }
  }
};


/* --- Conseil 4, combat guidé, rencontres sauvages --- */
Object.assign(SCEN, {
  tuto: {
    n: 'Combat guidé',
    lvl: 'Tutoriel · 6 étapes',
    lim: 10,
    time: 'jour',
    bio: 'gue',
    d: 'Deux Pokémon sauvages pour apprendre à lire, bouger, frapper et s’éveiller.',
    water: ['4,2', '4,3'],
    rock: ['3,0'],
    hb: 0,
    pb: 0,
    lv: 4,
    catch: true,
    tuto: true,
    foes: [
      ['roucool', [5, 1]],
      ['chenipan', [6, 4]]
    ]
  },
  c1: {
    n: 'Conseil 4 · les Ombres',
    lvl: 'Conseil 4 · 1 sur 4',
    lim: 9,
    time: 'nuit',
    bio: 'arene',
    at: 'Spectre',
    elite: 1,
    d: 'Spectres et chauves-souris : des attaques qui détournent et endorment. Gardez vos Pokémon groupés.',
    water: [],
    rock: ['3,1', '3,4'],
    hb: 36,
    pb: 6,
    lv: 44,
    foes: [
      ['spectrum', [6, 1]],
      ['nosferalto', [6, 3]],
      ['ectoplasma', [7, 2]],
      ['noctali', [6, 5]]
    ]
  },
  c2: {
    n: 'Conseil 4 · les Poings',
    lvl: 'Conseil 4 · 2 sur 4',
    lim: 9,
    time: 'jour',
    bio: 'arene',
    at: 'Combat',
    elite: 2,
    d: 'Des cogneurs qui annulent la Garde. Faites-les venir dans vos marques.',
    water: ['4,0', '4,5'],
    rock: ['3,2'],
    hb: 35,
    pb: 5,
    lv: 46,
    foes: [
      ['machopeur', [6, 1]],
      ['tartard', [6, 3]],
      ['mackogneur', [7, 2]],
      ['crocrodil', [6, 5]]
    ]
  },
  c3: {
    n: 'Conseil 4 · les Dragons',
    lvl: 'Conseil 4 · 3 sur 4',
    lim: 9,
    time: 'nuit',
    bio: 'arene',
    at: 'Dragon',
    elite: 3,
    d: 'Léviator, Dracolosse et leurs alliés. La Glace et le Gel sont vos meilleures armes.',
    water: ['4,2', '4,3', '5,2'],
    rock: ['2,0', '2,5'],
    hb: 34,
    pb: 6,
    lv: 48,
    foes: [
      ['draco', [6, 1]],
      ['leviator', [6, 3]],
      ['dracolosse', [7, 2]],
      ['ymphect', [6, 5]]
    ]
  },
  c4: {
    n: 'Conseil 4 · les Flammes Noires',
    lvl: 'Conseil 4 · 4 sur 4',
    lim: 9,
    time: 'nuit',
    bio: 'arene',
    at: 'Ténèbres',
    elite: 4,
    d: 'Feu et Ténèbres, sans pitié pour les Pokémon Psy. Le dernier verrou avant le Champion.',
    water: [],
    rock: ['3,0', '3,5', '4,3'],
    hb: 40,
    pb: 7,
    lv: 50,
    foes: [
      ['demolosse', [6, 1]],
      ['arcanin', [6, 3]],
      ['tyranocif', [7, 2]],
      ['typhlosion', [6, 5]],
      ['noctali', [7, 4]]
    ]
  }
});


SCEN.gue.catch = true;


SCEN.roche.catch = true;


SCEN.tour.catch = true;


SCEN.ligue.n = 'Ligue · Exhibition';


SCEN.ligue.d =
  'Un match d’exhibition contre une équipe de la Ligue : Léviator ouvre, Draco, Têtarte, Pikachu et Caninos attendent leur moment.';


ELITE = ['c1', 'c2', 'c3', 'c4'];


/* --- le Champion lit vos 10 derniers combats --- */
RX_COUNTER = {
  cc: { t: ['Sol'], why: 'insensible aux Courts-circuits' },
  sur: { tal: ['moiteur'], why: 'Moiteur empêche vos Surtensions' },
  emb: { tal: ['torche'], t: ['Feu'], why: 'les flammes ne le brûlent pas' },
  gel: { t: ['Feu', 'Glace'], why: 'le Gel ne le retient pas' },
  ban: { t: ['Feu', 'Glace'], why: 'la Banquise ne le retient pas' },
  bou: { t: ['Vol'], tal: ['levitation'], why: 'la Boue ne le ralentit pas' },
  sei: { t: ['Vol'], tal: ['levitation'], why: 'il survole vos ondes sismiques' },
  cou: { t: ['Vol'], tal: ['isograisse'], why: 'la lave ne le gêne pas' },
  vap: { tal: ['echolocation'], why: 'il voit à travers la vapeur' },
  flo: { t: ['Feu'], why: 'il brûle vos Floraisons' },
  anc: { tal: ['regardvif'], why: 'Regard Vif ignore les entraves' }
};
}
