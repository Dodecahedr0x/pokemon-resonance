/* Section d'origine : v4.31-01-defis-tactiques.js */
import { bdClass } from '../screens/combat/board/boardStore.js';

import { GYMS } from './004-01-donnees.js';
import { BY, SCEN } from './009-03-pokemon.js';
import { PROFILE } from './011-05-etat-de-partie.js';
import { ARENAS, TERR } from './013-07-arenes.js';
import { $, toast } from './014-08-outils.js';
import { tokCl } from '../screens/combat/board/boardStore.js';
import { CROCHETS } from './015-v4-8-00-crochets.js';
import { go } from './016-09-navigation.js';
import { squad } from './020-13-equipe-cartes.js';
import { EMAX, P, hdist, uAt, uk } from './021-14-moteur-combat.js';
import { OBST } from './023-16-roles-synergies-obstacles.js';
import { B, L, __set_scSel, backToPrep, battleOpts, finish, launch, scSel, ui } from './024-17-interface-combat.js';
import { queueSave } from './025-19-sauvegardes.js';
import { PREF, PREPG, __set_PREPG, renderPrep } from './026-20-campagne-tutoriel-son.js';
import { V4, fmt, today } from './032-v4-00-socle.js';
import { renderWallet } from './035-v4-03-interface.js';
import { RIVAL_POS } from './043-v4-4-01-aventure-plus.js';
import { heureDe, voitLaNuit } from './046-v4-7-01-plateau-vivant.js';
import { hash416 } from './055-v4-16-01-johto-vivant.js';
import { NEWS416 } from './056-v4-16-1-01-finitions.js';
import { PROGRES429, alea429 } from './064-v4-29-01-qualite.js';
import { PANTH432, graver432 } from './067-v4-32-01-individus-et-confort.js';
import { duelFin433, duelOpts433 } from './068-v4-33-01-duel-et-tutoriel.js';
import { refreshCampPage } from '../screens/camp/campStore.js';

export let ENIGMES431, MAIT_SEUIL431, CAMPT431;
let ENIG_CUR431, n431, MAIT431, RELIQUES431, ECHO_POOL431, NOEUDS431, EVENTS431, ARN_ED431;
// lus par les onglets du Camp (src/screens/camp/tabs)
export { MAIT431, RELIQUES431, NOEUDS431, EVENTS431, ARN_ED431, enigEtat431, enigDuJour431, maitChoix431, relAlea431, REGLES431, TERRAINS431, areneCode431 };


function enigScen431(P) {
  const b = SCEN[P.b] || SCEN.gue;
  return {
    n: `Énigme · ${P.t}`,
    lvl: 'Énigme tactique',
    lim: 1,
    time: 'jour',
    bio: b.bio,
    water: (b.water || []).slice(),
    rock: (b.rock || []).slice(),
    hb: 0,
    pb: 0,
    lv: 30,
    at: BY[P.f[0][0]].t[0],
    foes: P.f.map(([id, c, r]) => [id, [c, r]]),
    catch: false,
    enigme431: P.id,
    sansProgres431: 1,
    d: 'Mettez K.O. tous les adversaires en une seule manche. Les adversaires ne jouent pas : tout se décide pendant votre tour.'
  };
}


function enigOpts431() {
  return { diff: 'normal', items: {}, fatigue: {}, links: {}, ordre: 'equipe', vivant: false, tactique: true, mut: null, doc430: '', defis: [], caracteres: false, desob: false, dojo: 0, apprises: {} };
}


function enigPrepare431(P) {
  ENIG_CUR431 = P;
  SCEN.enigme431 = enigScen431(P);
  OBST.enigme431 = {};
}


/* =====================================================================
   v4.31 : défis tactiques
   1. Brouillard de guerre (réglage) : on ne voit que ce que voient ses
      Pokémon. +25 % de Pokédollars en victoire.
   2. Énigmes tactiques : positions figées, tout mettre K.O. en une manche.
      Chaque énigme a été construite et vérifiée avec le moteur du jeu.
   3. Maîtrise des familles : après 10 combats, un bonus au choix sur deux.
   4. Écho profond : expédition de 8 étages à embranchements, PV conservés,
      une seule vie, reliques, marchand et événements.
   5. Arènes personnalisées : créer un combat, le partager par un code.
   Tout se trouve dans l’onglet Camp (sous-onglets).
   ===================================================================== */
export function V431_0() {
  return { enig431: null, mait431: {}, echo431: null, arenes431: [], arj431: null };
}


export function v431Clean(p) {
  const o = V431_0();
  if (!p || typeof p !== 'object') return o;
  const E = p.enig431;
  if (E && typeof E === 'object') {
    const s = {},
      n = {};
    if (E.s && typeof E.s === 'object') Object.keys(E.s).forEach(k => /^\d{1,3}$/.test(k) && (s[k] = n431(E.s[k], 1, 3)));
    if (E.n && typeof E.n === 'object') Object.keys(E.n).forEach(k => /^\d{1,3}$/.test(k) && (n[k] = n431(E.n[k], 0, 999)));
    o.enig431 = { s, n, j: typeof E.j === 'string' && /^\d{4}-\d\d-\d\d$/.test(E.j) ? E.j : '', jd: Array.isArray(E.jd) ? E.jd.filter(x => Number.isInteger(x) && x >= 0 && x < 999).slice(0, 3) : [], cur: Number.isInteger(E.cur) ? n431(E.cur, 0, 998) : 0 };
  }
  if (p.mait431 && typeof p.mait431 === 'object')
    Object.keys(p.mait431).forEach(k => {
      const m = p.mait431[k];
      if (BY[k] && m && typeof m === 'object') o.mait431[k] = { n: n431(m.n, 0, 99999), p: typeof m.p === 'string' && /^[a-z]{3,10}$/.test(m.p) ? m.p : '' };
    });
  const X = p.echo431;
  if (X && typeof X === 'object') {
    o.echo431 = { best: n431(X.best, 0, 8), wins: n431(X.wins, 0, 9999), run: null };
    const R = X.run;
    if (R && typeof R === 'object' && Array.isArray(R.team) && Array.isArray(R.map)) {
      const team = R.team.filter(t => Array.isArray(t) && BY[t[0]]).slice(0, 4).map(t => [t[0], Math.max(0, Math.min(1, +t[1] || 0))]);
      const map = R.map.filter(Array.isArray).slice(0, 8).map(f => f.filter(x => typeof x === 'string' && /^[a-z]{2,10}$/.test(x)).slice(0, 3));
      if (team.length && map.length === 8)
        o.echo431.run = {
          seed: n431(R.seed, 0, 2147483647),
          f: n431(R.f, 0, 8),
          team,
          rel: Array.isArray(R.rel) ? R.rel.filter(x => typeof x === 'string' && /^[a-z]{3,10}$/.test(x)).slice(0, 12) : [],
          ech: n431(R.ech, 0, 9999),
          map,
          path: Array.isArray(R.path) ? R.path.filter(Number.isInteger).slice(0, 8) : [],
          cur: Number.isInteger(R.cur) ? n431(R.cur, -1, 2) : -1,
          pv: Number.isFinite(R.pv) ? Math.max(0, Math.min(0.5, R.pv)) : 0,
          ev: typeof R.ev === 'string' && /^[a-z]{2,12}$/.test(R.ev) ? R.ev : ''
        };
    }
  }
  if (Array.isArray(p.arenes431)) o.arenes431 = p.arenes431.map(areneClean431).filter(Boolean).slice(0, 12);
  const J = p.arj431;
  if (J && typeof J === 'object' && typeof J.d === 'string') o.arj431 = { d: J.d.slice(0, 10), n: n431(J.n, 0, 99) };
  return o;
}


/** Une victoire « sans progression » (énigme, arène perso, Écho profond) : ni compteurs ni récompenses ordinaires. */
export function progresFixe431(S) {
  const D = SCEN[S.sc] || {},
    win = S.over === 'win',
    rew = { links: [], caught: [], items: [], gifts: [], tired: [], forms: [], badgeNew: false };
  let r = [0, 0];
  try {
    if (D.duel433) r = duelFin433(S, rew); // duel local (v4.33)
    else if (D.enigme431 != null) r = enigApres431(S, rew, win);
    else if (D.perso431) r = areneApres431(S, rew, win);
    else if (D.echo431) r = echoApres431(S, rew, win);
  } catch (e) {}
  const [m, g] = r || [0, 0];
  if (m || g) {
    PROFILE.money = Math.min(999999, (PROFILE.money || 0) + m);
    PROFILE.gems = Math.min(99999, (PROFILE.gems || 0) + g);
  }
  rew.money = D.duel433 ? null : m; // duel : pas de gains (v4.33)
  rew.gems = g;
  queueSave();
  return rew;
}


/** Équipe imposée : énigme (équipe de l’énigme) ou Écho profond (l’équipe de l’expédition). */
export function teamFixe431() {
  if (scSel === 'duel433' && SCEN.duel433 && SCEN.duel433.t1) return { team: SCEN.duel433.t1.slice(), voix: 0, opts: duelOpts433() }; // duel local (v4.33)
  if (scSel === 'enigme431' && ENIG_CUR431) return { team: ENIG_CUR431.a.map(x => x[0]), voix: 0, opts: enigOpts431() };
  if (scSel === 'echo431') {
    const R = echoRun431();
    if (!R) return null;
    const team = R.team.filter(t => t[1] > 0).map(t => t[0]);
    if (!team.length) return null;
    return { team, voix: 0, opts: Object.assign(battleOpts(), { mut: null, defis: [], fatigue: {}, fog431: brouillardChoisi431() }) };
  }
  return null;
}


/* ---------- 1. brouillard de guerre ---------- */
export function brouillardChoisi431() {
  const D = SCEN[scSel] || {};
  return !!PREF.fog431 && !D.tuto && !D.hebdo429 && D.enigme431 == null && !D.pret429;
}


export function vision431(S) {
  const vu = new Set(),
    nuit = heureDe(S) === 'nuit';
  S.units
    .filter(a => a.side === 'a' && !a.ko)
    .forEach(a => {
      const r = Math.max(1, 2 + (a.t.includes('Vol') || a.t.includes('Psy') ? 1 : 0) - (nuit && !voitLaNuit(a) ? 1 : 0));
      for (const k in S.tiles) if (hdist(a.pos, P(k)) <= r) vu.add(k);
    });
  return vu;
}


export function cache431(S, e, vu) {
  if (!S.fog431 || e.side !== 'e' || e.ko) return false;
  const k = uk(e);
  if (!vu.has(k)) return true;
  // dans les hautes herbes : il faut être au contact
  return !!(S.tiles[k] && S.tiles[k].grass && !S.units.some(a => a.side === 'a' && !a.ko && hdist(a.pos, e.pos) <= 1));
}


function brouillardRender431() {
  const on = !!(B && B.fog431 && !B.over),
    vu = on ? vision431(B) : null;
  bdClass('fog431', on); // classe de #bBoard, rendue par React
  if (L.t) for (const k in L.t) L.t[k].classList.toggle('fog431t', on && !vu.has(k));
  if (!B) return;
  // les plaques voilées (#bPlE) : rendues par React (Plates.jsx)
  B.units
    .filter(u => u.side === 'e')
    .forEach(u => {
      const c = on && cache431(B, u, vu),
        T = L.u && L.u[u.uid];
      if (T) tokCl(T, 'fog431', c); // classes du jeton : Units.jsx
    });
}


/* ---------- 2. énigmes tactiques ---------- */
function enigEtat431() {
  return (PROFILE.enig431 = PROFILE.enig431 || { s: {}, n: {}, j: '', jd: [], cur: 0 });
}


function enigDuJour431() {
  const d = today(),
    r = alea429('enig-' + d),
    L = ENIGMES431.map((x, i) => i);
  for (let i = L.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [L[i], L[j]] = [L[j], L[i]];
  }
  return L.slice(0, 3);
}


function enigDef431(i) {
  const x = ENIGMES431[i];
  if (!x) return null;
  return { id: i, t: `n° ${i + 1}`, b: x[0], a: x[1], f: x[2] };
}


function enigLancer431(i) {
  const P = enigDef431(i);
  if (!P) return;
  const E = enigEtat431();
  E.cur = i;
  enigPrepare431(P);
  __set_scSel('enigme431');
  __set_PREPG(null);
  go('combat');
  launch();
}


function enigApres431(S, rew, win) {
  const E = enigEtat431(),
    i = SCEN[S.sc].enigme431,
    k = String(i);
  E.n[k] = (E.n[k] || 0) + 1;
  rew.enig431 = { i, win, essai: E.n[k] };
  if (!win) return [0, 0];
  const st = 1 + ((S.stats.voix || 0) === 0 ? 1 : 0) + (E.n[k] === 1 ? 1 : 0),
    avant = E.s[k] || 0;
  E.s[k] = Math.max(avant, st);
  rew.enig431.st = st;
  let m = 0,
    g = 0;
  if (!avant) m += 150;
  if (E.j !== today()) {
    E.j = today();
    E.jd = [];
  }
  if (enigDuJour431().includes(i) && !E.jd.includes(i)) {
    E.jd.push(i);
    g += 3;
    rew.enig431.jour = 1;
  }
  return [m, g];
}


function indice431() {
  const P = ENIG_CUR431,
    x = P && ENIGMES431[P.id];
  if (!x) return '';
  return `Indice : commencez par ${BY[P.a[x[3]][0]].n}.`;
}


function maitChoix431(b) {
  const K = Object.keys(MAIT431);
  let h = 0;
  for (let i = 0; i < b.length; i++) h = (h * 31 + b.charCodeAt(i)) >>> 0;
  const a = h % K.length;
  return [K[a], K[(a + 1 + ((h >>> 5) % (K.length - 1))) % K.length]];
}


export function bonusDmg431(S, u, t, d) {
  if (!(d > 0) || !S) return d;
  let f = 1;
  const R = S.rel431 || [];
  if (u && u.side === 'a') {
    if (u.m431 === 'puissance') f *= 1.08;
    if (R.includes('braise')) f *= 1.1;
  }
  if (t && t.side === 'a') {
    if (t.m431 === 'garde') f *= 0.92;
    if (R.includes('ecaille')) f *= 0.9;
  }
  return f === 1 ? d : Math.max(1, Math.round(d * f));
}


export function bonusMov431(S, u) {
  if (!S || !u || u.side !== 'a') return 0;
  return (u.m431 === 'vif' ? 1 : 0) + ((S.rel431 || []).includes('plume') ? 1 : 0);
}


export function echoRun431() {
  return PROFILE.echo431 && PROFILE.echo431.run;
}


function echoCarte431(seed) {
  const r = alea429('echo-' + seed),
    T = ['combat', 'combat', 'elite', 'soin', 'marchand', 'evenement'],
    map = [];
  for (let f = 0; f < 8; f++) {
    if (f === 7) map.push(['boss']);
    else if (f === 0) map.push(['combat', 'combat']);
    else {
      const n = r() < 0.5 ? 2 : 3,
        L = [];
      while (L.length < n) {
        const t = T[Math.floor(r() * T.length)];
        if (L.filter(x => x === t).length < (t === 'combat' ? 2 : 1)) L.push(t);
      }
      if (!L.includes('combat') && !L.includes('elite')) L[0] = 'combat';
      map.push(L);
    }
  }
  return map;
}


function echoPartir431() {
  const team = squad.slice(0, 4).filter(id => BY[id]);
  if (team.length < 2) return toast('Il faut au moins 2 Pokémon dans l’équipe.');
  const X = (PROFILE.echo431 = PROFILE.echo431 || { best: 0, wins: 0, run: null }),
    seed = Math.floor(Math.random() * 2147483647);
  X.run = { seed, f: 0, team: team.map(id => [id, 1]), rel: [], ech: 20, map: echoCarte431(seed), path: [], cur: -1, pv: 0, ev: '' };
  queueSave();
  toast('L’Écho profond s’ouvre : 8 étages, une seule vie.');
  renderCampPage431();
}


function echoScen431(R, type) {
  const r = alea429('echo-f' + R.seed + '-' + R.f + '-' + R.path.length),
    pool = ECHO_POOL431[Math.min(7, R.f)].filter(k => SCEN[k] && SCEN[k].foes),
    bk = pool[Math.floor(r() * pool.length)] || 'gue',
    b = SCEN[bk],
    el = type === 'elite',
    D = Object.assign({}, b, {
      n: `Écho profond · étage ${R.f + 1}`,
      lvl: `${NOEUDS431[type][0]} · étage ${R.f + 1} / 8`,
      d: `${el ? 'Adversaires renforcés : une relique à la clé. ' : type === 'boss' ? 'Le gardien de l’Écho profond. ' : ''}Vos PV sont conservés d’un combat à l’autre ; un Pokémon K.O. quitte l’expédition.`,
      catch: false,
      echo431: type,
      sansProgres431: 1,
      hb: Math.round((b.hb || 20) * (el ? 1.3 : 1)),
      pb: (b.pb || 3) + (el ? 1 : 0)
    });
  PROGRES429.forEach(x => delete D[x]);
  SCEN.echo431 = D;
  OBST.echo431 = OBST[bk] || {};
}


function echoNoeud431(i) {
  const R = echoRun431();
  if (!R || R.ev) return;
  const L = R.map[R.f],
    t = L && L[i];
  if (!t) return;
  R.cur = i;
  if (t === 'combat' || t === 'elite' || t === 'boss') {
    echoScen431(R, t);
    __set_scSel('echo431');
    __set_PREPG(null);
    queueSave();
    go('combat');
    launch();
    return;
  }
  if (t === 'soin') {
    R.team.forEach(x => x[1] > 0 && (x[1] = Math.min(1, x[1] + 0.5)));
    toast('La Source soigne votre équipe : +50 % de PV.');
    echoAvance431(R);
  } else if (t === 'marchand') R.ev = 'marchand';
  else if (t === 'evenement') R.ev = ['autel', 'source', 'passe', 'pari'][Math.floor(alea429('ev' + R.seed + R.f)() * 4)];
  queueSave();
  renderCampPage431();
}


function echoAvance431(R) {
  R.path.push(R.cur);
  R.cur = -1;
  R.f++;
  R.ev = '';
  const X = PROFILE.echo431;
  X.best = Math.max(X.best || 0, R.f);
  queueSave();
}


function relAlea431(R, n) {
  const L = Object.keys(RELIQUES431).filter(k => !R.rel.includes(k)),
    r = alea429('rel' + R.seed + R.f + R.rel.length);
  for (let i = L.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [L[i], L[j]] = [L[j], L[i]];
  }
  return L.slice(0, n);
}


function echoFin431(R, gagne) {
  const X = PROFILE.echo431,
    f = gagne ? 8 : R.f,
    m = f * 300 + (gagne ? 2500 : 0),
    g = f * 2 + (gagne ? 20 : 0);
  X.best = Math.max(X.best || 0, f);
  if (gagne) X.wins = (X.wins || 0) + 1;
  X.run = null;
  return [m, g, f];
}


function echoApres431(S, rew, win) {
  const R = echoRun431();
  if (!R || R.cur < 0) return [0, 0];
  const type = R.map[R.f][R.cur],
    alive = R.team.filter(t => t[1] > 0),
    al = S.units.filter(u => u.side === 'a');
  al.forEach((u, i) => {
    const t = alive[i];
    if (!t) return;
    t[0] = BY[u.id] ? u.id : t[0]; // une évolution en combat reste acquise pendant l’expédition
    t[1] = u.ko ? 0 : Math.max(0.01, u.hp / u.mhp);
  });
  rew.echo431 = { type, f: R.f + 1, win };
  if (!win || !R.team.some(t => t[1] > 0)) {
    const [m, g, f] = echoFin431(R, false);
    rew.echo431.fin = { f, m, g };
    return [m, g];
  }
  if (R.rel.includes('baie')) R.team.forEach(t => t[1] > 0 && (t[1] = Math.min(1, t[1] + 0.15)));
  const gain = Math.round((type === 'elite' ? 35 : type === 'boss' ? 0 : 15 + R.f * 3) * (R.rel.includes('aimant') ? 1.5 : 1));
  R.ech += gain;
  rew.echo431.ech = gain;
  if (type === 'boss') {
    R.path.push(R.cur);
    const [m, g] = echoFin431(R, true);
    rew.echo431.fin = { f: 8, m, g, gagne: 1 };
    graver432('echo', PANTH432.echo, S.units.filter(u => u.side === 'a').map(u => u.id), S); // Panthéon (v4.32)
    return [m, g];
  }
  if (type === 'elite') R.ev = 'relique';
  else echoAvance431(R);
  if (type === 'elite') {
    R.path.push(R.cur);
    R.f++;
    R.cur = -1;
    PROFILE.echo431.best = Math.max(PROFILE.echo431.best || 0, R.f);
  }
  return [0, 0];
}


function echoChoix431(k) {
  const R = echoRun431();
  if (!R) return;
  const pv = f => R.team.forEach(t => t[1] > 0 && (t[1] = Math.max(0.05, Math.min(1, t[1] + f))));
  if (k === 'autel-ok') {
    pv(-0.2);
    const x = relAlea431(R, 1)[0];
    if (x) R.rel.push(x);
    toast(x ? `Relique : ${RELIQUES431[x][0]}.` : 'L’autel est vide.');
  } else if (k === 'source-pv') pv(0.3);
  else if (k === 'source-ech') R.ech += 25;
  else if (k === 'passe-pv') R.pv = Math.min(0.5, (R.pv || 0) + 0.1);
  else if (k === 'passe-ech') R.ech += 30;
  else if (k === 'pari-ok') {
    if (alea429('pari' + R.seed + R.f)() < 0.5) {
      R.ech += 60;
      toast('Pile : +60 Échos !');
    } else {
      pv(-0.2);
      toast('Face : chaque Pokémon perd 20 % de PV.');
    }
  } else if (k.startsWith('rel-')) {
    const x = k.slice(4);
    if (RELIQUES431[x] && !R.rel.includes(x)) R.rel.push(x);
    R.ev = '';
    queueSave();
    return renderCampPage431();
  } else if (k.startsWith('achat-')) {
    const a = k.slice(6),
      P = { potion: 20, relique: 45, rappel: 60 }[a];
    if (!P || R.ech < P) return toast('Pas assez d’Échos.');
    if (a === 'rappel' && !R.team.some(t => t[1] <= 0)) return toast('Aucun Pokémon à rappeler.');
    R.ech -= P;
    if (a === 'potion') pv(0.3);
    else if (a === 'relique') {
      const x = relAlea431(R, 1)[0];
      if (x) R.rel.push(x);
      toast(x ? `Relique : ${RELIQUES431[x][0]}.` : 'Plus de relique à vendre.');
    } else if (a === 'rappel') {
      const t = R.team.find(y => y[1] <= 0);
      t[1] = 0.3;
      toast(`${BY[t[0]].n} revient à 30 % de PV.`);
    }
    queueSave();
    return renderCampPage431();
  }
  echoAvance431(R);
  renderCampPage431();
}


/* ---------- 5. arènes personnalisées ---------- */
function areneClean431(a) {
  if (!a || typeof a !== 'object') return null;
  const f = Array.isArray(a.f) ? a.f.filter(id => typeof id === 'string' && BY[id] && !BY[id].leg).slice(0, 5) : [];
  if (!f.length || !SCEN[a.t] || !SCEN[a.t].foes) return null;
  return {
    id: typeof a.id === 'string' && /^[a-z0-9]{4,12}$/.test(a.id) ? a.id : Math.random().toString(36).slice(2, 10),
    n: String(a.n || 'Arène').replace(/[<>&"]/g, '').slice(0, 22) || 'Arène',
    au: String(a.au || '').replace(/[<>&"]/g, '').slice(0, 14),
    t: a.t,
    r: typeof a.r === 'string' && REGLES431().some(x => x[0] === a.r) ? a.r : '',
    h: a.h === 'nuit' ? 'nuit' : 'jour',
    lim: [6, 8, 10, 12].includes(a.lim) ? a.lim : 10,
    hb: [0, 10, 20, 30].includes(a.hb) ? a.hb : 10,
    f
  };
}


function REGLES431() {
  const L = [['', 'Aucune']];
  (typeof ARENAS !== 'undefined' ? ARENAS : []).forEach((A, i) => A.rule && GYMS[i] && L.push([A.rule, `Arène ${GYMS[i].t}`]));
  return L;
}


function TERRAINS431() {
  return [...new Set([...TERR, ...ARENAS.map(A => A.k)])].filter(k => SCEN[k] && SCEN[k].foes).map(k => [k, SCEN[k].n]);
}


function areneScen431(a) {
  const b = SCEN[a.t];
  SCEN.perso431 = {
    n: a.n,
    lvl: `Arène personnalisée${a.au ? ' · ' + a.au : ''}`,
    lim: a.lim,
    time: a.h,
    bio: b.bio,
    water: (b.water || []).slice(),
    rock: (b.rock || []).slice(),
    rule: a.r || undefined,
    hb: a.hb,
    pb: 3,
    lv: 50,
    at: BY[a.f[0]].t[0],
    foes: a.f.map((id, i) => [id, RIVAL_POS[i]]),
    catch: false,
    perso431: a.id,
    sansProgres431: 1,
    d: `Arène créée${a.au ? ' par ' + a.au : ''}. Ni progression ni capture : 200 ₽ par victoire (3 par jour).`
  };
  OBST.perso431 = OBST[a.t] || {};
}


function areneApres431(S, rew, win) {
  rew.perso431 = { win };
  if (!win) return [0, 0];
  const J = (PROFILE.arj431 = PROFILE.arj431 && PROFILE.arj431.d === today() ? PROFILE.arj431 : { d: today(), n: 0 });
  if (J.n >= 3) return [0, 0];
  J.n++;
  rew.perso431.m = 200;
  return [200, 0];
}


function areneCode431(a) {
  const o = { n: a.n, au: PROFILE.name || a.au || '', t: a.t, r: a.r, h: a.h, lim: a.lim, hb: a.hb, f: a.f };
  const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(o))))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return `ARN-${b64}-${hash416(b64)}`;
}


function lireArene431(txt) {
  const m = String(txt || '')
    .replace(/\s+/g, '')
    .match(/ARN-([A-Za-z0-9_-]+)-([a-z0-9]{4})/);
  if (!m) return null;
  if (hash416(m[1]) !== m[2]) return null;
  try {
    const b = m[1].replace(/-/g, '+').replace(/_/g, '/');
    return areneClean431(JSON.parse(decodeURIComponent(escape(atob(b + '==='.slice((b.length + 3) % 4))))));
  } catch (e) {
    return null;
  }
}


// La page Camp est rendue par React (src/screens/camp) : sous-onglets, Camp de base, Sorties,
// onglet ouvert. Ici, on valide l'onglet puis on reconstruit la page.
export function renderCampPage431() {
  const t = CAMPT431.some(x => x[0] === V4.campTab) ? V4.campTab : 'base';
  V4.campTab = t;
  refreshCampPage(t === 'base');
}


/* ---------- après chaque rendu du combat ---------- */
export function apresRendu431() {
  if (!B) return;
  try {
    brouillardRender431();
    // pastilles reliques et brouillard, bouton et phase de l'énigme : rendus par React (src/screens/combat/battle)
  } catch (e) {}
}


/** Énigme : texte de la barre du bas (lu par src/screens/combat/battle/Foot.jsx). */
export function phaseEnigme431() {
  const E = enigEtat431(),
    ess = ENIG_CUR431 ? E.n[String(ENIG_CUR431.id)] || 0 : 0;
  return `Énigme : tout mettre K.O. en une manche.${ess ? ' ' + indice431() : ''}`;
}


/* ---------- au démarrage : les combats spéciaux existent (reprise d’un combat sauvegardé) ---------- */
export function defis431Boot() {
  const E = PROFILE.enig431;
  enigPrepare431(enigDef431(E && ENIGMES431[E.cur] ? E.cur : 0));
  const R = echoRun431();
  if (R && R.cur >= 0 && R.map[R.f]) echoScen431(R, R.map[R.f][R.cur]);
  else if (!SCEN.echo431) echoScen431({ seed: 1, f: 0, path: [] }, 'combat');
  const A = PROFILE.arenes431 || [];
  areneScen431(A[0] || { id: 'demo', n: 'Arène', au: '', t: 'gue', r: '', h: 'jour', lim: 10, hb: 10, f: ['onix'] });
}

// Instructions exécutées au démarrage, dans l'ordre d'origine (voir index.js).
export function __init() {

/* énigmes construites et vérifiées hors ligne avec le moteur (gen_enig431.js) : [terrain, alliés [id, colonne, rangée, losanges], adversaires [id, colonne, rangée, PV], premier allié de la solution] */
ENIGMES431 = [["gue",[["aquali",1,0,0],["drackhaus",3,4,0],["cochignon",2,2,1]],[["marcacrin",4,3,12],["xatu",2,1,19],["maraiste",3,2,19]],1],["gue",[["cotovol",2,4,1],["reptincel",1,3,3],["magneton",0,2,1]],[["gardevoir",2,2,15],["lainergie",5,2,20]],1],["gue",[["noctali",1,1,1],["gardevoir",2,2,3],["floravol",1,0,1]],[["demolosse",5,2,20],["galifeu",3,2,35]],0],["tour",[["feurisson",1,3,1],["nosferalto",1,1,3],["flagadoss",3,3,0]],[["cotovol",3,5,18],["melodelfe",4,1,25]],2],["roche",[["flobio",3,0,3],["pikachu",2,4,3],["drackhaus",1,1,0]],[["porygon2",5,2,11],["papilusion",5,3,17]],0],["gue",[["maraiste",2,3,0],["xatu",3,1,0],["kadabra",3,3,1]],[["pharamp",4,5,17],["typhlosion",5,3,22]],2],["tour",[["spectrum",3,3,3],["carabaffe",0,5,0],["magneton",1,1,0]],[["fantominus",4,4,25],["foretress",5,2,16]],1],["gue",[["papilusion",2,1,1],["nostenfer",0,3,1],["pikachu",3,5,3]],[["mackogneur",2,3,14],["noctali",2,2,51]],0],["roche",[["carabaffe",1,4,3],["cochignon",2,4,1],["galeking",3,5,1]],[["pharamp",5,3,42],["marcacrin",3,2,21]],1],["tour",[["kirlia",1,4,0],["herbizarre",2,2,3],["raichu",2,0,0]],[["aligatueur",3,1,37],["carabaffe",3,3,25]],0],["tour",[["papilusion",1,4,0],["tetarte",2,1,0],["kadabra",2,0,3]],[["kokiyas",5,4,20],["gardevoir",2,3,26]],0],["tour",[["flobio",1,1,3],["lanturn",1,4,0],["macronium",1,5,0]],[["absol",2,1,20],["feurisson",3,5,33]],0],["gue",[["spectrum",1,5,3],["porygon2",1,1,0],["tygnon",3,2,0]],[["drattak",5,2,45],["salameche",4,0,21]],2],["roche",[["galegon",1,0,0],["tortank",2,5,1],["kadabra",2,0,3]],[["axoloto",3,0,27],["laggron",3,4,21]],1],["tour",[["xatu",3,5,1],["azumarill",0,5,1],["flobio",2,2,3]],[["cochignon",4,1,35],["arcko",5,4,18]],2],["tour",[["kirlia",0,0,3],["cizayox",0,5,3],["volcaropod",0,1,1]],[["flagadoss",5,2,12],["mackogneur",3,5,20]],1],["gue",[["flagadoss",2,3,1],["draco",3,5,1],["flobio",3,1,3]],[["pyroli",4,2,34],["migalos",3,2,38]],1],["tour",[["raichu",1,4,3],["kirlia",1,5,3],["mentali",2,4,3]],[["kaiminus",5,1,26],["kadabra",4,0,23],["voltali",2,0,21]],2],["roche",[["leviator",2,2,0],["drattak",0,3,3],["pikachu",1,2,1]],[["embrylex",3,5,37],["cizayox",5,0,24]],1],["gue",[["flobio",2,4,3],["volcaropod",0,4,3],["noctali",3,4,3]],[["machopeur",5,2,16],["kirlia",2,2,34]],0],["gue",[["spectrum",1,5,3],["galegon",0,2,1],["nostenfer",2,2,0]],[["tarsal",4,4,21],["drackhaus",3,1,36]],0],["tour",[["reptincel",2,4,3],["kirlia",1,1,3],["galegon",3,2,3]],[["hericendre",5,3,10],["flagadoss",5,0,31]],0],["roche",[["ymphect",2,2,3],["reptincel",1,5,3],["melodelfe",3,4,0]],[["minidraco",5,5,9],["magicarpe",4,1,19]],1],["roche",[["reptincel",0,1,3],["aquali",2,4,1],["flobio",3,2,1]],[["voltali",2,5,16],["debugant",4,1,26]],1],["gue",[["meganium",3,4,3],["drattak",0,1,1],["tortank",0,3,1]],[["arcko",3,0,42],["alakazam",5,5,21]],0],["roche",[["demolosse",1,3,1],["cochignon",1,0,1],["spectrum",0,1,0]],[["reptincel",4,5,21],["crustabri",4,1,20]],0],["tour",[["drackhaus",2,5,0],["gardevoir",1,1,0],["jungko",0,3,0]],[["scarhino",2,3,31],["pyroli",4,1,22]],0],["gue",[["leviator",2,3,0],["draco",3,5,3],["papilusion",0,5,1]],[["jungko",3,2,15],["evoli",2,1,16],["tetarte",2,4,28]],2],["tour",[["leviator",2,5,3],["gardevoir",0,1,1],["reptincel",3,3,3]],[["wattouat",5,1,14],["germignon",5,2,30],["mackogneur",4,3,16]],0],["roche",[["noarfang",0,0,3],["gardevoir",0,3,3],["drackhaus",1,4,3]],[["spectrum",2,2,37],["cotovol",5,1,14]],1],["tour",[["foretress",3,2,3],["flobio",0,2,0],["herbizarre",0,1,3]],[["aquali",2,2,44],["pichu",4,0,13]],2],["roche",[["migalos",2,1,3],["porygon2",0,5,0],["draco",3,0,3]],[["scarhino",5,1,14],["wattouat",3,2,18],["evoli",3,4,21]],1],["roche",[["drackhaus",1,0,1],["lanturn",2,0,0],["tortank",3,0,1]],[["absol",2,3,20],["macronium",5,2,9],["raichu",2,1,15]],0],["tour",[["leviator",0,1,3],["reptincel",1,4,3],["alakazam",3,2,0]],[["tenefix",4,0,14],["crocrodil",2,1,39]],1],["tour",[["raichu",2,3,3],["pyroli",1,1,1],["ectoplasma",1,2,0]],[["tarpaud",2,1,23],["raichu",3,2,23],["galekid",3,3,40]],1],["tour",[["draco",3,5,0],["florizarre",0,0,0],["kadabra",1,4,1]],[["natu",2,1,12],["malosse",4,1,19]],1],["tour",[["feurisson",0,1,3],["aquali",2,1,0],["galegon",1,1,1]],[["noctali",2,0,15],["melodelfe",4,4,35]],1],["gue",[["cochignon",1,5,1],["xatu",0,5,3],["floravol",2,2,3]],[["tenefix",3,5,28],["mackogneur",3,0,28]],0],["gue",[["lanturn",1,5,1],["feurisson",3,5,0],["draco",2,4,1]],[["galeking",4,0,8],["galeking",5,4,67]],2],["roche",[["pikachu",0,2,1],["feurisson",3,0,3],["cizayox",2,2,1]],[["tenefix",5,2,43],["galekid",3,4,21]],1],["roche",[["tarpaud",2,4,0],["draco",0,0,3],["crocrodil",3,5,3]],[["kirlia",2,5,14],["meganium",2,2,25]],0],["roche",[["drackhaus",2,3,1],["kicklee",1,1,0],["tetarte",1,4,1]],[["galifeu",3,4,12],["roucarnage",5,0,25]],0],["roche",[["raichu",1,1,0],["tartard",2,0,3],["drattak",2,1,3]],[["chenipan",3,2,36],["porygon2",4,3,27]],0],["gue",[["mentali",0,1,0],["crocrodil",0,2,3],["ymphect",1,0,1]],[["volcaropod",3,1,31],["natu",2,2,17],["evoli",4,4,26]],1],["roche",[["kapoera",0,1,0],["nostenfer",2,1,0],["migalos",0,5,0]],[["mentali",3,4,23],["absol",3,2,41]],2],["roche",[["alakazam",1,5,0],["ectoplasma",1,1,1],["dracaufeu",2,4,0]],[["lanturn",4,5,31],["galeking",2,2,19]],0],["gue",[["raichu",2,1,1],["brasegali",1,2,1],["kicklee",1,0,1]],[["arcanin",4,2,35],["granivol",3,0,22]],0],["roche",[["flobio",3,4,3],["floravol",2,4,1],["meganium",1,4,3]],[["phanpy",4,0,10],["roucoups",2,0,17]],1],["roche",[["leviator",1,1,1],["voltali",1,3,0],["massko",0,1,3]],[["kapoera",2,1,25],["pyroli",2,4,35]],1],["roche",[["feurisson",1,0,3],["flobio",1,1,3],["noarfang",3,5,1]],[["nosferapti",3,2,10],["brasegali",3,4,35]],2],["roche",[["spectrum",0,1,3],["nosferalto",2,0,3],["tortank",2,3,3]],[["tarsal",2,2,17],["phanpy",5,2,20]],1],["roche",[["feurisson",3,4,3],["noctali",2,4,3],["draco",2,2,0]],[["aquali",3,5,24],["insecateur",5,3,15]],1],["gue",[["aquali",1,3,1],["carabaffe",0,0,1],["floravol",1,4,3]],[["demolosse",3,3,33],["insecateur",5,5,20],["nosferapti",3,2,18]],2],["tour",[["reptincel",0,5,1],["typhlosion",0,1,3],["herbizarre",2,3,3]],[["limagma",3,2,10],["pikachu",2,2,29],["leviator",2,4,18]],1],["gue",[["dracaufeu",2,3,0],["nosferalto",1,1,1],["tetarte",3,0,1]],[["drackhaus",5,1,28],["voltali",5,0,23]],1],["gue",[["melodelfe",2,2,1],["nosferalto",0,2,3],["kapoera",3,2,1]],[["laggron",4,0,38],["mentali",5,2,19]],0],["gue",[["tyranocif",3,4,0],["aquali",3,2,1],["feurisson",0,3,0]],[["tarsal",4,3,21],["drattak",2,4,20]],1],["tour",[["floravol",0,0,0],["herbizarre",2,5,3],["roigada",2,2,1]],[["magneti",2,0,8],["machopeur",5,3,21]],0],["tour",[["draco",2,3,3],["florizarre",1,2,3],["steelix",2,0,0]],[["kicklee",5,3,24],["tarpaud",3,1,24]],0],["tour",[["aligatueur",1,5,0],["feurisson",3,3,3],["kirlia",0,0,0]],[["roucarnage",4,1,15],["jungko",4,4,22],["crustabri",2,0,16]],0]];


/* ---------- énigmes tactiques : construction (partagée avec le générateur) ---------- */
// Une énigme : P = { id, t, b (terrain), a: [[id, c, r, losanges]], f: [[id, c, r, PV]] }
ENIG_CUR431 = null;


CROCHETS.creation.push((S, opt, D0) => {
  if (D0 && (D0.sansProgres431 || D0.hebdo429)) S.fixe431 = 1; // ni compagnon ni Pension
});


CROCHETS.combat.push(S => {
  const P = ENIG_CUR431;
  if (S.sc !== 'enigme431' || !P) return;
  const al = S.units.filter(u => u.side === 'a'),
    fo = S.units.filter(u => u.side === 'e');
  P.a.forEach(([, c, r, en], i) => {
    const u = al[i];
    if (!u) return;
    u.pos = [c, r];
    u.en = Math.max(0, Math.min(EMAX, en || 0));
  });
  P.f.forEach(([, c, r, hp], i) => {
    const u = fo[i];
    if (!u) return;
    u.pos = [c, r]; // la position de l’énigme, pas celle choisie par l’IA
    if (hp) u.hp = Math.max(1, Math.min(u.mhp, hp));
  });
  S.lim = 1;
});


n431 = (x, lo, hi) => (Number.isFinite(x) ? Math.max(lo, Math.min(hi, Math.floor(x))) : lo);


CROCHETS.combat.push((S, opt) => {
  if (opt && opt.fog431) S.fog431 = 1;
});


// une case cachée : pas d’information sur l’adversaire qui s’y trouve (on peut toujours viser à l’aveugle)
$('#bSvg').addEventListener(
  'click',
  e => {
    if (!B || !B.fog431 || B.over || B.dep430 || ui.mode) return;
    const p = e.target.closest('[data-k]');
    if (!p) return;
    const u = uAt(B, p.dataset.k);
    if (u && cache431(B, u, vision431(B))) {
      e.stopPropagation();
      toast('Brouillard : rien en vue ici.');
    }
  },
  true
);


CROCHETS.progres.push((S, rew, win) => {
  if (!S.fog431) return null;
  rew.fog431 = 1;
  if (!win) return null;
  const m = Math.round(((rew.money || 0) * 0.25) / 10) * 10;
  rew.fogm431 = m;
  return m ? [m, 0] : null;
});


CROCHETS.resultat.push(r => (r.fog431 ? `<div class="res-l"><h4>Brouillard de guerre</h4><div class="rl"><span>${r.fogm431 ? 'Victoire à l’aveugle' : 'Combat dans le brouillard'}</span><b>${r.fogm431 ? '+' + fmt(r.fogm431) + ' ₽' : ''}</b></div></div>` : ''));


CROCHETS.resultat.push(r => {
  const e = r.enig431;
  if (!e) return '';
  const et = n => '★'.repeat(n) + '☆'.repeat(3 - n);
  return `<div class="res-l"><h4>Énigme n° ${e.i + 1}</h4><div class="rl"><span>${e.win ? `Résolue ${et(e.st)} · ${e.st === 3 ? 'du premier coup, sans Voix' : e.st === 2 ? (e.essai === 1 ? 'du premier coup' : 'sans dépenser de Voix') : 'réussie'}${e.jour ? ' · énigme du jour : +3 Éclats' : ''}` : `Ratée (essai ${e.essai}). Changez l’ordre de vos Pokémon et visez les mêmes cibles.`}</span><b>${e.win ? et(e.st) : ''}</b></div></div>`;
});


// en énigme, finir son tour sans avoir gagné, c’est perdre (les adversaires ne jouent pas)
document.addEventListener(
  'click',
  e => {
    if (!B || B.over || B.sc !== 'enigme431' || !e.target.closest('#bEnd') || ui.busy) return;
    e.preventDefault();
    e.stopPropagation();
    B.over = 'lose';
    B.timeout = true;
    finish();
  },
  true
);


document.addEventListener('click', e => {
  const b = e.target.closest('[data-enig431]');
  if (!b) return;
  enigLancer431(+b.dataset.enig431);
});


/* ---------- 3. maîtrise des familles ---------- */
MAIT431 = {
  puissance: ['Puissance', '+8 % de dégâts infligés'],
  robuste: ['Robustesse', '+10 % de PV maximum'],
  vif: ['Vivacité', '+1 Mouvement'],
  eveil: ['Éveil précoce', 'Commence avec 1 losange de plus'],
  garde: ['Garde', '−8 % de dégâts subis']
};


MAIT_SEUIL431 = 10;


CROCHETS.progres.push((S, rew) => {
  const D = SCEN[S.sc] || {};
  if (D.tuto || D.pret429) return null;
  const M = (PROFILE.mait431 = PROFILE.mait431 || {}),
    prets = [];
  S.units
    .filter(u => u.side === 'a' && BY[u.sp])
    .forEach(u => {
      const x = (M[u.sp] = M[u.sp] || { n: 0, p: '' });
      x.n++;
      if (x.n === MAIT_SEUIL431 && !x.p) prets.push(u.sp);
    });
  if (prets.length) rew.mait431 = prets;
  return null;
});


CROCHETS.resultat.push(r => (r.mait431 ? `<div class="res-l"><h4>Maîtrise</h4><div class="rl"><span>${r.mait431.map(b => BY[b].n).join(', ')} : un bonus de maîtrise est à choisir (Camp › Maîtrise).</span><b>★</b></div></div>` : ''));


CROCHETS.combat.push(S => {
  if (S.fixe431 && S.sc !== 'echo431') return;
  const M = PROFILE.mait431 || {};
  S.units
    .filter(u => u.side === 'a')
    .forEach(u => {
      const p = M[u.sp] && M[u.sp].p;
      if (!p || !MAIT431[p]) return;
      u.m431 = p;
      if (p === 'robuste') {
        u.mhp = Math.round(u.mhp * 1.1);
        u.hp = Math.min(u.mhp, Math.round(u.hp * 1.1));
      } else if (p === 'eveil') u.en = Math.min(EMAX, (u.en || 0) + 1);
    });
});


document.addEventListener('click', e => {
  const b = e.target.closest('[data-mait431]');
  if (!b) return;
  const base = b.dataset.mait431,
    k = b.dataset.k,
    M = (PROFILE.mait431 = PROFILE.mait431 || {}),
    x = M[base];
  if (!x || x.n < MAIT_SEUIL431 || !MAIT431[k] || !maitChoix431(base).includes(k)) return;
  if (x.p && x.p !== k) {
    if ((PROFILE.money || 0) < 500) return toast('Il faut 500 ₽ pour changer de maîtrise.');
    PROFILE.money -= 500;
  }
  x.p = k;
  toast(`${BY[base].n} : ${MAIT431[k][0]}.`);
  queueSave();
  renderWallet();
  renderCampPage431();
});


/* ---------- 4. Écho profond ---------- */
RELIQUES431 = {
  plume: ['Plume vive', '+1 Mouvement pour toute l’équipe.'],
  braise: ['Cœur ardent', '+10 % de dégâts infligés.'],
  ecaille: ['Écaille', '−10 % de dégâts subis.'],
  diapason: ['Diapason', 'Chaque Pokémon commence avec 1 losange de plus.'],
  cloche: ['Cloche claire', '+1 Voix maximum.'],
  baie: ['Baie dorée', 'Après chaque combat, +15 % de PV.'],
  aimant: ['Aimant à Échos', '+50 % d’Échos gagnés.'],
  talisman: ['Talisman', 'Chaque Pokémon survit une fois à un coup fatal par combat.']
};


ECHO_POOL431 = [
  ['gue', 'roche', 'a1', 'a2'],
  ['a3', 'a4', 'tour', 'td1'],
  ['a5', 'a6', 'j1', 'j2'],
  ['a7', 'j3', 'j4', 'h1'],
  ['a8', 'j5', 'j6', 'h2', 'h3'],
  ['j7', 'h4', 'h5', 'jd2'],
  ['j8', 'h6', 'h7', 'jd4'],
  ['jchamp', 'hchamp', 'lgraikou', 'lgentei', 'lgsuicune']
];


NOEUDS431 = { combat: ['Combat', 'i-fight'], elite: ['Élite', 'i-star'], soin: ['Source', 'i-heal'], marchand: ['Marchand', 'i-shop'], evenement: ['Événement', 'i-quest'], boss: ['Gardien', 'i-trophy'] };


CROCHETS.combat.push(S => {
  if (S.sc !== 'echo431') return;
  const R = echoRun431();
  if (!R) return;
  S.echo431 = 1;
  S.rel431 = R.rel.slice();
  const alive = R.team.filter(t => t[1] > 0),
    al = S.units.filter(u => u.side === 'a');
  al.forEach((u, i) => {
    const t = alive[i];
    if (!t) return;
    if (R.pv) u.mhp = Math.round(u.mhp * (1 + R.pv));
    u.hp = Math.max(1, Math.round(u.mhp * t[1]));
    if (S.rel431.includes('diapason')) u.en = Math.min(EMAX, (u.en || 0) + 1);
    if (S.rel431.includes('talisman')) u.ferm = true;
  });
  if (S.rel431.includes('cloche')) {
    S.vmax += 1;
    S.voix += 1;
  }
});


CROCHETS.resultat.push(r => {
  const e = r.echo431;
  if (!e) return '';
  if (e.fin)
    return `<div class="res-l"><h4>Écho profond</h4><div class="rl"><span>${e.fin.gagne ? 'Le gardien est vaincu : expédition réussie !' : `Expédition terminée à l’étage ${e.fin.f + (e.fin.gagne ? 0 : 1)}.`} Récompense : ${fmt(e.fin.m)} ₽ · ${e.fin.g} Éclats.</span><b>${e.fin.gagne ? '★' : ''}</b></div></div>`;
  return `<div class="res-l"><h4>Écho profond</h4><div class="rl"><span>Étage ${e.f} franchi${e.ech ? ` · +${e.ech} Échos` : ''}${e.type === 'elite' ? ' · une relique vous attend au Camp' : ''}. Vos PV sont conservés.</span><b>${e.f} / 8</b></div></div>`;
});


// après un combat de l’Écho profond : retour à la carte de l’expédition (pas de « Rejouer »)
document.addEventListener(
  'click',
  e => {
    const b = e.target.closest('#cbResult [data-res]');
    if (!b || !B || B.sc !== 'echo431') return;
    e.preventDefault();
    e.stopPropagation();
    backToPrep();
    __set_scSel('gue');
    V4.campTab = 'echo';
    go('camp');
  },
  true
);


EVENTS431 = {
  autel: ['Autel brisé', 'Une relique repose sur un autel fissuré. La prendre coûte 20 % des PV de chaque Pokémon.', [['Prendre la relique', 'autel-ok'], ['Passer son chemin', 'passer']]],
  source: ['Source claire', 'Une eau limpide chante doucement.', [['Boire (+30 % de PV)', 'source-pv'], ['Remplir les gourdes (+25 Échos)', 'source-ech']]],
  passe: ['Écho du passé', 'Un souvenir de vos premiers combats vous revient.', [['S’en inspirer (+10 % de PV max pour l’expédition)', 'passe-pv'], ['Le vendre (+30 Échos)', 'passe-ech']]],
  pari: ['Le Pari', 'Un dresseur masqué propose un jeu : pile, 60 Échos ; face, chaque Pokémon perd 20 % de PV.', [['Jouer', 'pari-ok'], ['Refuser', 'passer']]]
};


document.addEventListener('click', e => {
  const b = e.target.closest('[data-echo431]');
  if (!b) return;
  const a = b.dataset.echo431;
  if (a === 'partir') echoPartir431();
  else if (a === 'abandon') {
    const R = echoRun431();
    if (!R) return;
    if (!b.dataset.ok) {
      b.dataset.ok = '1';
      b.textContent = 'Confirmer l’abandon';
      return;
    }
    const [m, g, f] = echoFin431(R, false);
    PROFILE.money = Math.min(999999, (PROFILE.money || 0) + m);
    PROFILE.gems = Math.min(99999, (PROFILE.gems || 0) + g);
    toast(`Expédition abandonnée à l’étage ${f + 1} : ${fmt(m)} ₽ · ${g} Éclats.`);
    queueSave();
    renderWallet();
    renderCampPage431();
  } else if (a.startsWith('n')) echoNoeud431(+a.slice(1));
  else echoChoix431(a);
});


CROCHETS.resultat.push(r => (r.perso431 ? `<div class="res-l"><h4>Arène personnalisée</h4><div class="rl"><span>${r.perso431.win ? (r.perso431.m ? 'Victoire récompensée' : 'Victoire (déjà 3 récompenses aujourd’hui)') : 'Défaite'}</span><b>${r.perso431.m ? '+200 ₽' : ''}</b></div></div>` : ''));


ARN_ED431 = null;


document.addEventListener('change', e => {
  const x = e.target.closest('[data-ar]');
  if (!x || !ARN_ED431 || !ARN_ED431.a) return;
  const k = x.dataset.ar,
    E = ARN_ED431.a;
  if (/^f\d$/.test(k)) {
    E.f[+k[1]] = x.value;
  } else if (k === 'lim' || k === 'hb') E[k] = +x.value;
  else E[k] = x.value;
});


document.addEventListener('input', e => {
  const x = e.target.closest('[data-ar="n"]');
  if (x && ARN_ED431 && ARN_ED431.a) ARN_ED431.a.n = x.value;
});


document.addEventListener('click', e => {
  const b = e.target.closest('[data-arn431]');
  if (!b) return;
  const a = b.dataset.arn431,
    i = +b.dataset.i,
    A = (PROFILE.arenes431 = PROFILE.arenes431 || []);
  if (a === 'new') {
    if (A.length >= 12) return toast('12 arènes au plus : supprimez-en une.');
    ARN_ED431 = { i: -1, a: { n: 'Mon arène', t: 'gue', r: '', h: 'jour', lim: 10, hb: 10, f: ['onix', 'racaillou', '', '', ''] } };
  } else if (a === 'edit' && A[i]) ARN_ED431 = { i, a: Object.assign({}, A[i], { f: [...A[i].f, '', '', '', '', ''].slice(0, 5) }) };
  else if (a === 'annuler') ARN_ED431 = null;
  else if (a === 'save' && ARN_ED431) {
    const c = areneClean431(Object.assign({}, ARN_ED431.a, { f: ARN_ED431.a.f.filter(Boolean), au: PROFILE.name || '' }));
    if (!c) return toast('Choisissez au moins un adversaire.');
    if (ARN_ED431.i >= 0) A[ARN_ED431.i] = Object.assign(c, { id: A[ARN_ED431.i].id });
    else A.unshift(c);
    ARN_ED431 = null;
    queueSave();
    toast('Arène enregistrée.');
  } else if (a === 'suppr' && A[i]) {
    if (!b.dataset.ok) {
      b.dataset.ok = '1';
      b.textContent = 'Confirmer';
      return;
    }
    A.splice(i, 1);
    queueSave();
  } else if (a === 'code' && A[i]) ARN_ED431 = { code: i };
  else if (a === 'copier' && A[i]) {
    const t = areneCode431(A[i]);
    try {
      navigator.clipboard.writeText(t).then(
        () => toast('Code copié.'),
        () => toast('Sélectionnez le code et copiez-le.')
      );
    } catch (er) {
      toast('Sélectionnez le code et copiez-le.');
    }
    return;
  } else if (a === 'import') {
    const v = (document.getElementById('arnCode431') || {}).value,
      c = lireArene431(v);
    if (!c) return toast('Code d’arène illisible. Il commence par « ARN- ».');
    if (A.length >= 12) return toast('12 arènes au plus : supprimez-en une.');
    A.unshift(c);
    queueSave();
    toast(`Arène « ${c.n} » ajoutée.`);
  } else if (a === 'jouer' && A[i]) {
    areneScen431(A[i]);
    __set_scSel('perso431');
    __set_PREPG(null);
    go('combat');
    renderPrep();
    return;
  }
  renderCampPage431();
});


/* ---------- l’onglet Camp, en sous-onglets ---------- */
CAMPT431 = [
  ['base', 'Base'],
  ['enigmes', 'Énigmes'],
  ['echo', 'Écho profond'],
  ['arenes', 'Arènes'],
  ['maitrise', 'Maîtrise']
];


document.addEventListener('click', e => {
  const b = e.target.closest('[data-ct431]');
  if (!b) return;
  V4.campTab = b.dataset.ct431;
  renderCampPage431();
});


defis431Boot();


document.addEventListener('click', e => {
  if (!e.target.closest('[data-news="camp431"]')) return;
  e.stopPropagation();
  V4.campTab = 'enigmes';
  go('camp');
});


NEWS416.unshift(
  ['i-quest', 'Énigmes et Écho profond', `Camp › Énigmes : ${ENIGMES431.length} énigmes tactiques en une manche. Camp › Écho profond : 8 étages, une seule vie, des reliques.`, 'camp431'],
  ['i-league', 'Arènes et maîtrises', 'Créez une arène et partagez son code. Après 10 combats, chaque famille débloque une maîtrise. Option : brouillard de guerre (Paramètres).', null]
);


NEWS416.splice(8);
}
