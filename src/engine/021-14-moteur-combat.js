/* Section d'origine : 14-moteur-combat.js */

import { MT } from './001-moteur-tactique-noyau-tours.js';
import { EL, MK, MX } from './004-01-donnees.js';
import { MV } from './005-02-capacites.js';
import { BY, DEPLOY, EEVEE, FAMT, MKT, PKT, SCEN, TCH, WXN } from './009-03-pokemon.js';
import { ARR } from './010-04-evolution-en-combat.js';
import { ITEMS2, pairKey } from './011-05-etat-de-partie.js';
import { CROCHETS } from './015-v4-8-00-crochets.js';
import { DIFF, aiFallback, dmgItemsLinks, threatAt } from './022-15-systemes-objets-liens-ia.js';
import { NOTE, SANDOK, __set_NOTE, applyObst, dmgRolesTerrain, foeRetreat, hasSyn, ignObst, losBlocked, resolve, ricoTgt, roleOf, roundSupport } from './023-16-roles-synergies-obstacles.js';
import { aiStyleBonus, isShinyOwned } from './043-v4-4-01-aventure-plus.js';
import { FOURNISSEURS_DEGATS, JIT_BOSS, JIT_BOSS_HB, JIT_DMG, JIT_PB, JIT_PBM, ordreEnnemis, pvOrdre } from './044-v4-5-01-moteur-tactique.js';
import { ajouterApprises, avecApprise } from './045-v4-6-01-ct-cs.js';
import { heureDe, nuitPortee, vivantInit, vivantManche } from './046-v4-7-01-plateau-vivant.js';
import { arretForce, chargeDiffere, colosseKO, horsDAtteinte, lancerCharge, piegeArrivee, piegeHostile, planPiege, poserPiege } from './047-v4-8-01-tactique.js';
import { accordApres, desobeit } from './049-v4-10-01-identite.js';
import { REDIFF, noterMoment } from './050-v4-11-01-monde.js';
import { CIBLE412, SOI412, bonusMouv412, durees412, poserPrescience } from './051-v4-12-01-ct-epiques.js';
import { PRE413, apresCoup413, fin413, reflets413, rune413, soutienIA413 } from './052-v4-13-01-roster-technique.js';
import { aXP, apresCoup414, apresDegats414, coutXP, fin414, peutXP } from './053-v4-14-01-resonance.js';
import { fuiteMsg416 } from './055-v4-16-01-johto-vivant.js';
import { resoCand417 } from './057-v4-17-01-compagnons-et-resonance.js';
import { vigilance420 } from './060-v4-20-01-combat-intense.js';
import { expert429 } from './064-v4-29-01-qualite.js';
import { docDmg430, docMov430, jDmg430 } from './065-v4-30-01-camp-et-tactique.js';
import { bonusDmg431, bonusMov431 } from './066-v4-31-01-defis-tactiques.js';
import { talDmg432, talMov432 } from './067-v4-32-01-individus-et-confort.js';
import { duelPlan433, vigilDuel433 } from './068-v4-33-01-duel-et-tutoriel.js';
import { evoliHarmonie434 } from './069-v4-34-01-calibrage-et-evoli.js';

export let BW, BH, K, P, inB, CDIR, nbrK, mhpOf, uk, uAt, byUid, flies, effR, NEEDU, HOSTILE, EMAX, hasNx, BRANCHES;
let RXM, auContact, MENACE;
export function __set_stun(v) { return (stun = v); }
export function __set_fin(v) { return (fin = v); }
export function __set_pRelance(v) { return (pRelance = v); }


export function toCube(c, r) {
  const x = c - (r - (r & 1)) / 2;
  return [x, -x - r, r];
}


export function fromCube(x, y, z) {
  return [x + (z - (z & 1)) / 2, z];
}


export function hdist(a, b) {
  const A = toCube(a[0], a[1]),
    C = toCube(b[0], b[1]);
  return (Math.abs(A[0] - C[0]) + Math.abs(A[1] - C[1]) + Math.abs(A[2] - C[2])) / 2;
}


export function nbr(p) {
  const [x, y, z] = toCube(p[0], p[1]);
  return CDIR.map(d => fromCube(x + d[0], y + d[1], z + d[2])).filter(q => inB(q[0], q[1]));
}


export function teff(at, def) {
  const e = TCH[at];
  if (!e) return 1;
  let m = 1;
  def.forEach(t => {
    if (e[2].includes(t)) m *= 0;
    else if (e[0].includes(t)) m *= 2;
    else if (e[1].includes(t)) m *= 0.5;
  });
  return m;
}


function specOf(id) {
  const m = BY[id];
  return { id, n: m.n, t: m.t, s: m.s, mv: m.mv, tal: m.tal };
}


export function mkUnit(id, side, pos, uid, D) {
  const sp = specOf(id),
    hb = side === 'e' ? D.hb || 0 : 0,
    mhp = mhpOf(sp.s) + hb;
  const u = {
    uid,
    // les alliés gardent leur identité de famille (Liens, objets, fatigue, duos) même recrutés évolués
    sp: side === 'a' && BY[id] ? BY[id].base : id,
    id,
    side,
    n: sp.n,
    t: [...sp.t],
    s: [...sp.s],
    mv: [...sp.mv],
    tal: sp.tal,
    lv: side === 'e' ? D.lv : null,
    pb: side === 'e' ? D.pb || 0 : 0,
    hb,
    hp: mhp,
    mhp,
    pos: [pos[0], pos[1]],
    acted: false,
    moved: false,
    sn: false,
    skip: 0,
    badge: null,
    bru: 0,
    web: 0,
    guard: 0,
    anchor: 0,
    root: 0,
    prot: 0,
    boost: 0,
    ferm: sp.tal === 'fermete',
    intent: null,
    done: false,
    evolved: false,
    evo: 0,
    en: 0,
    ko: false
  };
  PKT.set(u.t, u.id); // types → espèce : le médaillon affiche la bonne illustration
  return u;
}


export function markAt(S, k) {
  const t = S.tiles[k];
  if (!t) return null;
  return t.mark ? t.mark.k : t.w ? 'trempe' : null;
}

 // cloué au sol : Gravité (v4.9)
function entryWx(S, u, ev) {
  if (u.tal === 'crachin') {
    S.wx = { k: 'pluie', n: 5 };
    ev && say(ev, `Crachin : ${u.n} fait tomber la pluie.`);
  }
  if (u.tal === 'sablevolant') {
    S.wx = { k: 'sable', n: 5 };
    ev && say(ev, `Sable Volant : ${u.n} lève une tempête de sable.`);
  }
}


export function newBattle(sc, team, bonus, opt) {
  opt = opt || {};
  const D0 = SCEN[sc],
    df = DIFF[opt.diff] || DIFF.normal,
    // difficulté : PV et puissance des adversaires, nombre de manches
    D = Object.assign({}, D0, {
      hb: Math.max(0, Math.round((D0.hb || 0) * df.hb * pvOrdre(opt) + (df.hbAdd || 0))),
      pb: Math.max(0, Math.round(((D0.pb || 0) + df.pb) * JIT_PBM) + JIT_PB),
      lim: Math.max(6, (D0.lim || 12) + df.lim)
    }),
    S = {
      sc,
      lim: D.lim || 12,
      time: D.time || 'jour',
      round: 1,
      phase: 'player',
      tiles: {},
      units: [],
      wx: null,
      voix: 3 + bonus,
      vmax: 3 + bonus,
      eveil: false,
      relance: false,
      over: null,
      lastAtk: null,
      stats: { rx: 0, ko: 0, voix: 0, evo: 0, pairs: {} },
      rxg: {},
      jit: true // v4.12 : intentions cachées, les adversaires décident à leur tour
    };
  for (let r = 0; r < BH; r++)
    for (let c = 0; c < BW; c++) S.tiles[K(c, r)] = { w: false, rock: false, mark: null, mud: 0, lava: 0, fog: 0 };
  D.water.forEach(k => (S.tiles[k].w = true));
  D.rock.forEach(k => (S.tiles[k].rock = true));
  if (D.fiss)
    for (const k in S.tiles) {
      const c = P(k)[0];
      if (c >= 3 && c <= 6 && !S.tiles[k].rock) S.tiles[k].mark = { k: 'fissure', d: 99, lv: 1, by: null };
    }
  team.slice(0, 4).forEach((id, i) => {
    const u = mkUnit(id, 'a', DEPLOY[i], 'a' + i, D);
    if (BY[id] && isShinyOwned(BY[id].base)) u.shiny = true; // vos chromatiques le restent en combat (v4.15)
    S.units.push(u);
  });
  D.foes.forEach(([id, p, x], i) => {
    // x : réglages d’un adversaire précis (boss légendaire, chromatique) ; ses PV suivent aussi la difficulté
    const Dx = x
        ? Object.assign(
            {},
            D,
            x,
            x.hb != null ? { hb: Math.max(0, Math.round(x.hb * df.hb * pvOrdre(opt) * (x.boss || x.colosse ? JIT_BOSS_HB : 1) + (df.hbAdd || 0))) } : {},
            x.pb != null ? { pb: Math.max(0, Math.round(x.pb * JIT_PBM) + JIT_PB) } : {}
          )
        : D,
      u = mkUnit(id, 'e', p, 'e' + i, Dx);
    if (x && x.shiny) u.shiny = true;
    if (x && x.boss) u.boss = true;
    S.units.push(u);
  });
  S.units.forEach(u => entryWx(S, u, null));
  vivantInit(S, opt); // plateau vivant : l'heure du scénario lance le cycle (v4.7-01)
  CROCHETS.creation.forEach(h => h(S, opt, D0)); // colosses, Tactique avancée… (v4.8)
  plan(S, []);
  // difficulté, Liens, objets tenus et fatigue (posés après les premières intentions adverses)
  S.diff = DIFF[opt.diff] ? opt.diff : 'normal';
  if (opt.ordre === 'vitesse') S.ordre = 'vitesse'; // ordre des tours par Vitesse (v4.5-01)
  ajouterApprises(S, opt.apprises); // CT et CS apprises (v4.6-01)
  S.links = {};
  S.noCatch = !D0.catch;
  S.stats.caught = [];
  S.stats.duo = 0;
  S.stats.rxk = {};
  const al = S.units.filter(u => u.side === 'a');
  for (let i = 0; i < al.length; i++)
    for (let j = i + 1; j < al.length; j++) {
      const k = pairKey(al[i].sp, al[j].sp),
        v = (opt.links || {})[k] || 0;
      if (v) S.links[k] = v;
    }
  al.forEach(u => {
    const it = (opt.items || {})[u.sp];
    if (it && ITEMS2[it]) {
      u.item = it;
      if (it === 'ceinture') u.belt = true;
      if (it === 'bandeau') u.pb = (u.pb || 0) + 2;
      if (it === 'lentille' && (hasNx(u) || aXP(u))) u.en = 1;
    }
    if (((opt.fatigue || {})[u.sp] || 0) >= 70) u.fat = true;
  });
  CROCHETS.combat.forEach(h => h(S, opt, D0));
  return S;
}

 // colosse : +2 portée (v4.8) // la nuit : −1 de portée (v4.7-01) // Onde de Choc sous la Pluie (v4.12)
export function movPts(S, u) {
  if (u.colosse || u.seg) return 0; // les colosses ne bougent pas (v4.8)
  const fr = u.tal === 'regardvif';
  if (u.root > 0 && !fr) return 0;
  let m = u.s[4];
  if (u.tal === 'glissade' && markAt(S, uk(u)) === 'trempe') m += 2;
  if (u.tal === 'chlorophylle' && S.wx && S.wx.k === 'soleil') m += 2;
  if (u.web > 0 && !fr) m -= 3;
  m = Math.max(0, m);
  m = Math.max(0, m + (u.item === 'grelot' ? 1 : 0) - (u.fat ? 1 : 0)); // Grelot Vif +1, fatigue −1
  if (hasSyn(S, u, 'escadrille') && (u.t.includes('Vol') || u.t.includes('Insecte'))) m++; // synergie Escadrille
  if (S.mutMov) m = Math.max(0, m + S.mutMov); // mutateurs Gravité, Frénésie (v4.9)
  if (u.car === 'vif') m++; // caractère Vif (v4.10)
  m = Math.max(0, m + bonusMouv412(S, u) + docMov430(S, u) + bonusMov431(S, u) + talMov432(S, u)); // doctrine (v4.30) ; Vent Arrière, Distorsion (v4.12), Gravité, Marque Ombre… (v4.13)
  return m;
}


export function reach(S, u) {
  const m = movPts(S, u),
    st = uk(u),
    best = { [st]: 0 },
    q = [[st, 0]],
    fl = flies(u),
    ok = SANDOK(u); // le sable coûte 2 Mouvements, sauf aux types Sol, Roche, Acier et aux volants
  while (q.length) {
    const [k, c0] = q.shift();
    for (const nk of nbrK(k)) {
      const t = S.tiles[nk];
      if (t.rock || uAt(S, nk)) continue;
      const c = c0 + (t.mud > 0 && !fl ? 3 : t.sand && !t.w && !ok ? 2 : 1);
      if (c <= m && (best[nk] === undefined || c < best[nk])) {
        best[nk] = c;
        if (!arretForce(S, u, nk)) q.push([nk, c]); // piège adverse, zone de contrôle : on s'y arrête (v4.8)
      }
    }
  }
  delete best[st];
  return best;
}


export function mvType(S, u, m) {
  if (u.tal === 'adaptabilite' && m.t === 'Normal') {
    const k = markAt(S, uk(u));
    if (k) return MKT[k];
  }
  return m.t;
}


function lineK(from, d, n) {
  const [x, y, z] = toCube(from[0], from[1]),
    o = [];
  for (let i = 1; i <= n; i++) {
    const p = fromCube(x + d[0] * i, y + d[1] * i, z + d[2] * i);
    if (!inB(p[0], p[1])) break;
    o.push(K(p[0], p[1]));
  }
  return o;
}


function canSee(S, u, k) {
  const v = uAt(S, k);
  if (!v || u.tal === 'echolocation') return true;
  const d = hdist(u.pos, P(k));
  if (S.tiles[k].fog > 0 && d > 1) return false; // brouillard
  return !(v.side !== u.side && S.tiles[k].grass && d > 2); // hautes herbes : cachées au-delà de 2 cases
}


export function targets(S, u, m) {
  if (m && ((m.xp && !peutXP(S, u, m)) || (u.item === 'mouchoir' && u.choix && MV[u.choix] && MV[u.choix] !== m))) return []; // v4.14
  const R = effR(u, m, S);
  if (m.sh === 'self' || m.sh === 'ring') return [uk(u)];
  const ign = ignObst(S, u, mvType(S, u, m)); // synergie Esprit : Psy et Spectre ignorent les obstacles
  if (m.sh === 'line') {
    const o = [];
    CDIR.forEach(d => {
      for (const k of lineK(u.pos, d, R)) {
        if (S.tiles[k].pil && !ign) break; // un pilier arrête la ligne
        if (!S.tiles[k].rock) o.push(k);
      }
    });
    return o;
  }
  let o = [];
  for (const k in S.tiles) {
    if (S.tiles[k].rock) continue;
    const d = hdist(u.pos, P(k));
    if (d < 1 || d > R) continue;
    const v = uAt(S, k);
    if (m.sh === 'ally') {
      if (v && v.side === u.side) o.push(k);
      continue;
    }
    if (NEEDU.includes(m.fx) && !v) continue;
    if (m.fx === 'piege' && (v || S.tiles[k].w || S.tiles[k].trap)) continue; // un piège se pose sur une case libre (v4.8)
    if (v && v.side === u.side && (m.p || m.fix || HOSTILE.includes(m.fx))) continue;
    if (!canSee(S, u, k)) continue;
    o.push(k);
  }
  if (m.sh === 'one') {
    // un pilier bloque les tirs à distance
    if (!ign) o = o.filter(k => hdist(u.pos, P(k)) < 2 || !losBlocked(S, u.pos, P(k)));
    // ricochet : viser un rocher pour toucher l’ennemi le plus proche derrière
    if (m.p && R >= 2 && u.side === 'a')
      for (const k in S.tiles) {
        const t = S.tiles[k];
        if (!t.rock || t.pil) continue;
        const d = hdist(u.pos, P(k));
        if (d < 1 || d > R) continue;
        if (!ign && d >= 2 && losBlocked(S, u.pos, P(k))) continue;
        if (ricoTgt(S, u, k)) o.push(k);
      }
  }
  return o;
}


export function affected(S, u, m, k) {
  let a;
  const R = effR(u, m, S),
    t = S.tiles[k];
  if (m.sh === 'one' && t && t.rock && !t.pil) {
    // ricochet sur un rocher
    const r = ricoTgt(S, u, k);
    return r ? [r] : [];
  }
  if (m.sh === 'self') a = [uk(u)];
  else if (m.sh === 'ring') a = nbrK(uk(u));
  else if (m.sh === 'line') {
    const stop = !ignObst(S, u, mvType(S, u, m));
    a = null;
    for (const d of CDIR) {
      const L = lineK(u.pos, d, R);
      if (L.includes(k)) {
        a = [];
        for (const x of L) {
          if (stop && S.tiles[x].pil) break; // un pilier arrête la ligne
          a.push(x);
        }
        break;
      }
    }
    if (!a) a = [k];
  } else if (m.sh === 'cone') {
    const n1 = nbrK(uk(u)),
      n2 = nbrK(k);
    a = [k, ...n1.filter(x => n2.includes(x))];
  } else if (m.sh === 'area') a = [k, ...nbrK(k)];
  else a = [k];
  if (m.pluie && m.sh === 'one' && S.wx && S.wx.k === 'pluie') a = [k, ...nbrK(k)]; // Onde de Choc sous la Pluie (v4.12)
  return a.filter(x => S.tiles[x] && !S.tiles[x].rock);
}


export function inReach(S, u, m, k) {
  if (m.sh === 'ring' || m.sh === 'self') return true;
  const R = effR(u, m, S),
    ign = ignObst(S, u, mvType(S, u, m)),
    d = hdist(u.pos, P(k));
  if (m.sh === 'line') {
    const L = CDIR.map(dd => lineK(u.pos, dd, R)).find(L => L.includes(k));
    if (!L) return false;
    if (!ign && L.slice(0, L.indexOf(k)).some(x => S.tiles[x].pil)) return false; // pilier sur la ligne
  } else {
    if (d < 1 || d > R) return false;
    if (!ign && m.sh === 'one' && d >= 2 && losBlocked(S, u.pos, P(k))) return false; // pilier entre les deux
  }
  // hautes herbes : une cible à plus de 2 cases est invisible
  const v = uAt(S, k);
  return !(v && v.side !== u.side && S.tiles[k].grass && d > 2 && u.tal !== 'echolocation');
}


function intimid(S, u) {
  return S.units.some(o => !o.ko && o.side !== u.side && o.tal === 'intimidation' && hdist(o.pos, u.pos) === 1);
}


/* dégâts d’une capacité : formule de base, puis objets et Liens, puis rôles, synergies et terrain */
export function dmgOf(S, u, m, t, typ, mult) {
  let d = dmgBase(S, u, m, t, typ, mult);
  if (d <= 0 || m.fix) return d;
  d = dmgItemsLinks(S, u, t, d, mult);
  return talDmg432(S, u, t, bonusDmg431(S, u, t, docDmg430(S, u, t, dmgRolesTerrain(S, u, m, t, typ, d)))); // doctrine (v4.30), maîtrise et reliques (v4.31), talent (v4.32)
}


function dmgBase(S, u, m, t, typ, mult) {
  let e = teff(typ, t.t);
  if (e === 0 && typ === 'Sol' && t.cloue && t.t.includes('Vol')) e = t.t.length > 1 ? teff(typ, t.t.filter(z => z !== 'Vol')) || 1 : 1; // Gravité : le Sol touche les Vol (v4.13)
  if (e === 0) return 0;
  if (typ === 'Sol' && t.tal === 'levitation' && !t.cloue) return 0;
  if (m.fix) return m.fix;
  if (!m.p) return 0;
  if (m.fx === 'devoreve' && t.badge !== 'SOM') return 0; // Dévorêve (v4.12)
  // multiplicateurs (météo, talents, état, même type) : fournis au pipeline du moteur tactique (v4.5-01)
  const x = MT.combinerModificateurs(
    e * mult,
    MT.collecter(FOURNISSEURS_DEGATS, 'degats', { S, u, m, t, typ }, 'attaquant')
  ).valeur;
  let d = Math.round((m.p + u.s[1] * 2 + (u.pb || 0)) * x);
  if (u.tal !== 'annulegarde' && m.fx !== 'percegarde')
    d -= t.s[2] + (u.tal === 'inconscient' ? 0 : (t.guard > 0 ? 2 : 0) + (t.anchor > 0 ? 2 : 0) + (t.tal === 'coque' ? 2 : 0));
  if (intimid(S, u)) d -= 3;
  if (u.affaibli > 0) d -= 3; // Feu Follet (v4.13)
  // v4.12 : sans intentions, chaque attaque adverse porte ; elle frappe un peu moins fort (après la Garde)
  if (S.jit && u.side === 'e' && !S.duel433 && JIT_DMG !== 1) d = Math.round(d * JIT_DMG * (u.boss || u.colosse ? JIT_BOSS : 1));
  return Math.max(1, d);
}


export function say(ev, s) {
  ev.push({ e: 'msg', s });
}


export function damage(S, v, d, ev, o) {
  o = o || {};
  if (!v || v.ko || d <= 0) return 0;
  if (o.ind && v.tal === 'gardemagik') return 0;
  if (v.prot > 0 && !o.ind) {
    say(ev, `${v.n} se protège avec Abri.`);
    return 0;
  }
  // Ceinture Force : un coup fatal laisse 1 PV (une fois)
  const belt = v.belt && !v.ferm && d >= v.hp;
  if (belt) {
    v.belt = false;
    d = v.hp - 1;
    if (d <= 0) {
      say(ev, `${v.n} tient bon grâce à la Ceinture Force !`);
      return 0;
    }
  }
  let nh = v.hp - d;
  if (nh <= 0 && v.ferm) {
    nh = 1;
    v.ferm = false;
    say(ev, `${v.n} tient bon grâce à Fermeté !`);
  }
  const real = v.hp - Math.max(0, nh);
  v.hp = Math.max(0, nh);
  ev.push({ e: 'dmg', u: v.uid, v: real });
  jDmg430(S, v, real, o); // journal tactique (v4.30)
  if ((v.side === 'a' || S.duel433) && v.hp > 0 && real >= v.mhp * 0.3) gainEn(S, v, 1, ev); // duel : les deux joueurs (v4.33)
  if (v.hp <= 0) {
    v.ko = true;
    v.intent = null;
    ev.push({ e: 'ko', u: v.uid });
    say(ev, `${v.n} est K.O.`);
    if (v.side === 'e') S.stats.ko++;
    if (v.side !== 'e' || S.duel433)
      S.units.forEach(o => {
        if (o.side === v.side && !o.ko && o !== v) gainEn(S, o, 1, ev);
      });
    if (v.seg || v.colosse) colosseKO(S, v, ev); // colosses (v4.8)
  }
  if (real > 0 && !o.ind) {
    v.touche = true; // Mitra-Poing (v4.13)
    if (!o.reflet) reflets413(S, v, real, ev); // Riposte, Voile Miroir, Prélèvem. Destin (v4.13)
  }
  if (real > 0) apresDegats414(S, v, real, o, ev); // Casque Brut, Baie Sitrus (v4.14)
  if (belt) say(ev, `${v.n} tient bon grâce à la Ceinture Force !`);
  return real;
}


export function heal(S, v, a, ev) {
  if (v && v.side === 'a' && S.syn && S.syn.includes('benediction')) a = Math.round(a * 1.5); // synergie Bénédiction
  if (v && v.item === 'grosseracine') a = Math.round(a * 1.5); // Grosse Racine (v4.14)
  if (!v || v.ko || a <= 0) return;
  const r = Math.min(a, v.mhp - v.hp);
  if (r <= 0) return;
  v.hp += r;
  ev.push({ e: 'heal', u: v.uid, v: r });
}


export function stun(S, v, lab, ev, nos) {
  if (!v || v.ko) return;
  if (v.tal === 'attention') {
    say(ev, `${v.n} reste concentré.`);
    return;
  }
  if (v.tal === 'armuremagma' && lab === 'GEL') {
    say(ev, `Armumagma : ${v.n} ne gèle pas.`); // v4.15
    return;
  }
  if (v.tal === 'souplesse' && lab === 'PAR') {
    say(ev, `${v.n} est trop souple pour être paralysé.`); // v4.13
    return;
  }
  if (rune413(S, v)) {
    say(ev, `Rune Protect : ${v.n} est protégé.`); // v4.13
    return;
  }
  v.badge = lab;
  v.bdgVu433 = 0;
  if (v.side === 'e' && !v.done && (v.intent || S.jit)) {
    v.intent = null;
    say(ev, S.duel433 ? `${v.n} perdra son prochain tour.` : S.jit ? `${v.n} ne pourra pas agir cette manche.` : `L’attaque de ${v.n} est annulée.`);
  } else if (v.side === 'a' && S.phase === 'player' && !v.acted) {
    v.acted = true;
    v.moved = true;
    v.sn = true;
  } else v.skip = 1;
  ev.push({ e: 'st', u: v.uid, s: lab });
  if (!nos && v.tal === 'synchro' && S.lastAtk) {
    const a = byUid(S, S.lastAtk);
    if (a && a.side !== v.side && !a.ko) {
      say(ev, `Synchro : ${a.n} subit le même sort.`);
      stun(S, a, lab, ev, true);
    }
  }
}


export function mDur(S, mk) {
  const w = S.wx && S.wx.k;
  if (
    (w === 'pluie' && mk === 'trempe') ||
    (w === 'soleil' && mk === 'brulant') ||
    (w === 'grele' && mk === 'givre') ||
    (w === 'sable' && mk === 'fissure')
  )
    return 3;
  if (w === 'soleil' && mk === 'trempe') return 1;
  if (S.vivant && w === 'pluie' && mk === 'brulant') return 1;
  return 2;
}


export function setMark(S, k, mk, by) {
  const t = S.tiles[k];
  if (t && !t.rock) t.mark = { k: mk, d: mDur(S, mk), lv: 1, by };
  // Amorce : les marques d’un Déclencheur durent une manche de plus
  if (t && t.mark && by) {
    const b = byUid(S, by);
    if (b && roleOf(b) === 'Déclencheur') t.mark.d += 1;
  }
}


export function net(S, k, mk) {
  const seen = { [k]: 0 },
    q = [k],
    edges = [];
  while (q.length) {
    const x = q.shift();
    for (const n of nbrK(x)) {
      if (seen[n] !== undefined || markAt(S, n) !== mk) continue;
      seen[n] = seen[x] + 1;
      edges.push([x, n, seen[n]]);
      q.push(n);
    }
  }
  return { seen, edges };
}


function moist(S, k) {
  return S.units.some(o => !o.ko && o.tal === 'moiteur' && hdist(o.pos, P(k)) <= 2);
}


function lien(S, a, b) {
  if (!a || !b || a === b) return;
  const A = byUid(S, a),
    C = byUid(S, b);
  if (!A || !C || A.side !== 'a' || C.side !== 'a') return;
  const key = [A.sp, C.sp].sort().join('|');
  S.stats.pairs[key] = (S.stats.pairs[key] || 0) + 1;
}


export function landed(S, v, ev) {
  if (!v || v.ko) return;
  v.mvR = S.round; // Poursuite (v4.13)
  const t = S.tiles[uk(v)];
  if (t.lava > 0 && !flies(v)) {
    say(ev, `${v.n} se brûle sur la lave.`);
    damage(S, v, v.tal === 'isograisse' ? 3 : 6, ev, { ind: true });
  }
  piegeArrivee(S, v, ev); // pièges (v4.8)
}


export function shove(S, v, from, n, ev, pull) {
  if (!v || v.ko || n <= 0) return;
  if (v.anchor > 0 || v.colosse || v.seg) {
    say(ev, `${v.n} est ancré et ne bouge pas.`);
    return;
  }
  const A = toCube(from[0], from[1]),
    C = toCube(v.pos[0], v.pos[1]);
  const dv = pull ? [A[0] - C[0], A[1] - C[1], A[2] - C[2]] : [C[0] - A[0], C[1] - A[1], C[2] - A[2]];
  let dir = CDIR[0],
    best = -1e9;
  CDIR.forEach(d => {
    const s = d[0] * dv[0] + d[1] * dv[1] + d[2] * dv[2];
    if (s > best) {
      best = s;
      dir = d;
    }
  });
  let moved = false;
  for (let i = 0; i < n; i++) {
    if (pull && hdist(v.pos, from) <= 1) break;
    const c = toCube(v.pos[0], v.pos[1]),
      np = fromCube(c[0] + dir[0], c[1] + dir[1], c[2] + dir[2]),
      nk = K(np[0], np[1]);
    if (!inB(np[0], np[1]) || S.tiles[nk].rock) {
      say(ev, `${v.n} heurte un obstacle.`);
      damage(S, v, 3, ev, { ind: true });
      break;
    }
    const o = uAt(S, nk);
    if (o) {
      say(ev, `${v.n} percute ${o.n}.`);
      damage(S, v, 3, ev, { ind: true });
      damage(S, o, 3, ev, { ind: true });
      break;
    }
    v.pos = np;
    moved = true;
    ev.push({ e: 'mv', u: v.uid });
  }
  if (moved) {
    say(ev, `${v.n} est ${pull ? 'attiré' : 'repoussé'}${markAt(S, uk(v)) === 'trempe' ? ' dans l’eau' : ''}.`);
    landed(S, v, ev);
  }
}


function react(S, rx, k, u, v, base, ev) {
  const t = S.tiles[k],
    by = t.mark ? t.mark.by : null;
  if (u.side === 'a') {
    S.stats.rx++;
    const R = (S.stats.rxk = S.stats.rxk || {}); // réactions préférées (étudiées par le Champion)
    R[rx] = (R[rx] || 0) + 1;
  }
  lien(S, by, u.uid);
  ev.push({ e: 'rx', k, rx });
  if (!S.rxg[u.uid]) {
    S.rxg[u.uid] = 1;
    gainEn(S, u, 1, ev);
  }
  if (by && !S.rxg[by]) {
    const pb = byUid(S, by);
    if (pb) {
      S.rxg[by] = 1;
      gainEn(S, pb, 1, ev);
    }
  }
  switch (rx) {
    case 'cc': {
      const N = net(S, k, 'trempe');
      ev.push({ e: 'chain', edges: N.edges, c: 'el' });
      let n = 0;
      for (const x in N.seen) {
        const d = N.seen[x];
        if (S.tiles[x].mark && S.tiles[x].mark.k === 'trempe') S.tiles[x].mark = null;
        const w = uAt(S, x);
        if (!w) continue;
        if (w.t.includes('Sol')) {
          say(ev, `${w.n} est insensible au courant.`);
          continue;
        }
        if (w.tal === 'absorbvolt') {
          say(ev, `${w.n} absorbe le courant.`);
          heal(S, w, 8, ev);
          continue;
        }
        if (x !== k && w.tal !== 'ecranpoudre')
          damage(S, w, Math.max(2, Math.round(base * 0.5 * Math.pow(0.85, d))), ev, { ind: true });
        if (!w.ko) {
          stun(S, w, 'PAR', ev);
          n++;
        }
      }
      say(ev, `Court-circuit ! ${n} Pokémon paralysé${n > 1 ? 's' : ''}.`);
      break;
    }
    case 'vap':
      [k, ...nbrK(k)].forEach(x => {
        S.tiles[x].fog = 2;
      });
      t.mark = null;
      say(ev, 'Vapeur : un brouillard couvre la zone.');
      break;
    case 'flo':
      [k, ...nbrK(k)].forEach(x => {
        const w = uAt(S, x);
        if (w && w.side === u.side) heal(S, w, Math.round(w.mhp * 0.2), ev);
      });
      setMark(S, k, 'enracine', u.uid);
      say(ev, 'Floraison : les alliés proches récupèrent.');
      break;
    case 'gel':
      if (v) stun(S, v, 'GEL', ev);
      setMark(S, k, 'givre', u.uid);
      say(ev, 'Gel !');
      break;
    case 'bou':
      t.mud = 3;
      t.mark = null;
      say(ev, 'Boue : la case ralentit pendant 3 manches.');
      break;
    case 'sur':
      t.mark = null;
      nbrK(k).forEach(x => {
        const w = uAt(S, x);
        if (w && w.tal !== 'ecranpoudre') damage(S, w, Math.max(2, Math.round(base * 0.5)), ev, { ind: true });
      });
      say(ev, 'Surtension : explosion !');
      break;
    case 'ter':
      t.mark = null;
      u.guard = 2;
      say(ev, `Mise à la terre : ${u.n} gagne +2 Garde.`);
      break;
    case 'emb': {
      const N = net(S, k, 'enracine');
      ev.push({ e: 'chain', edges: N.edges, c: 'fire' });
      for (const x in N.seen) {
        setMark(S, x, 'brulant', u.uid);
        const w = uAt(S, x);
        if (w && x !== k && w.tal !== 'ecranpoudre' && w.tal !== 'torche')
          damage(S, w, w.tal === 'isograisse' ? 3 : 6, ev, { ind: true });
        if (w && !w.ko && w.tal !== 'torche') w.bru = 3;
      }
      say(ev, 'Embrasement : le feu se propage.');
      break;
    }
    case 'fon':
      setMark(S, k, 'trempe', u.uid);
      say(ev, 'Fonte : choc thermique, la case devient Trempée.');
      break;
    case 'cou':
      t.lava = 2;
      t.mark = null;
      say(ev, 'Coulée : la case devient lave.');
      break;
    case 'bri':
      t.mark = null;
      say(ev, 'Bris : dégâts doublés.');
      break;
    case 'anc':
      t.mark = null;
      if (v) {
        if (v.side === u.side) {
          v.anchor = 2;
          say(ev, `${v.n} est ancré : +2 Garde.`);
        } else if (rune413(S, v)) say(ev, `Rune Protect : ${v.n} est protégé.`); // v4.13
        else {
          v.root = 2;
          say(ev, `${v.n} est enraciné au sol.`);
        }
      }
      break;
    case 'ban': {
      const N = net(S, k, 'trempe');
      ev.push({ e: 'chain', edges: N.edges, c: 'ice' });
      for (const x in N.seen) {
        setMark(S, x, 'givre', u.uid);
        const w = uAt(S, x);
        if (w) stun(S, w, 'GEL', ev);
      }
      say(ev, 'Banquise : tout le réseau d’eau gèle.');
      break;
    }
    case 'sei':
      nbrK(k).forEach(x => setMark(S, x, 'fissure', u.uid));
      setMark(S, k, 'fissure', u.uid);
      say(ev, 'Onde sismique : le sol se fissure.');
      break;
  }
}


export function fin(S, ev) {
  if (!S.over) {
    const a = S.units.some(x => x.side === 'a' && !x.ko),
      e = S.units.some(x => x.side === 'e' && !x.ko);
    if (!e) {
      S.over = 'win';
      ev.push({ e: 'over' });
    } else if (!a) {
      S.over = 'lose';
      ev.push({ e: 'over' });
    }
  }
  return ev;
}


export function retarget(S, e, src, fx, ev) {
  if (S.jit && e.side === 'e') {
    if (e.done) {
      say(ev, `${e.n} a déjà agi cette manche.`);
      return;
    }
    e.force = { fx, by: src.uid };
    ev.push({ e: 'ret', u: e.uid });
    say(
      ev,
      fx === 'taunt'
        ? `${e.n} est provoqué : il visera ${src.n}.`
        : fx === 'turn'
          ? `${e.n} est troublé : il frappera son allié le plus proche.`
          : `${e.n} est désorienté : il frappera l’unité la plus proche de lui.`
    );
    return;
  }
  if (!e.intent || e.done) {
    say(ev, `${e.n} n’a aucune attaque à détourner.`);
    return;
  }
  let tgt = null;
  if (fx === 'taunt') tgt = src;
  else {
    const pool = S.units.filter(o => !o.ko && o !== e && (fx === 'turn' ? o.side === e.side : true));
    pool.sort((a, b) => hdist(a.pos, e.pos) - hdist(b.pos, e.pos));
    tgt = pool[0] || null;
  }
  if (!tgt) {
    e.intent = null;
    say(ev, `L’attaque de ${e.n} est annulée.`);
    return;
  }
  e.intent.k = uk(tgt);
  ev.push({ e: 'ret', u: e.uid });
  say(ev, `${e.n} vise désormais ${tgt.n}.`);
}


export function resolveMove(S, u, m, k) {
  const ev = [];
  if (u.ko) return ev;
  const typ = mvType(S, u, m);
  S.lastAtk = u.uid;
  S.rxg = {};
  ev.push({ e: 'use', u: u.uid, k, ty: typ });
  S.acteur430 = u.uid; // journal tactique (v4.30)
  say(ev, `${u.n} utilise ${m.n} !`);
  if (m.wx) {
    S.wx = { k: m.wx, n: u.item === 'rochemeteo' ? 8 : 5 }; // Roche Météo (v4.14)
    say(ev, `Météo ${WXN[m.wx]} pendant ${S.wx.n} manches.`);
    return fin(S, ev);
  }
  if (m.sh === 'self') {
    if (m.fx === 'guard') {
      u.guard = 2;
      say(ev, `${u.n} gagne +2 Garde.`);
    } else if (m.fx === 'protect') {
      u.prot = 1;
      say(ev, `${u.n} se met à l’abri.`);
    } else if (m.fx === 'boost') {
      u.boost = 2;
      say(ev, `${u.n} aiguise ses attaques.`);
    } else if (m.fx === 'selfheal') heal(S, u, Math.round(u.mhp * (S.wx && S.wx.k === 'soleil' ? 0.6 : 0.4)), ev);
    else if (m.fx === 'rest') {
      heal(S, u, Math.round(u.mhp * 0.5), ev);
      u.skip = 1;
      u.badge = 'SOM';
      say(ev, `${u.n} s’endort.`);
    } else if (m.fx === 'reflect') {
      S.units.forEach(o => {
        if (!o.ko && o.side === u.side && hdist(o.pos, u.pos) <= 1) o.guard = 2;
      });
      say(ev, `Protection : ${u.n} et ses voisins gagnent +2 Garde.`);
    } else if (SOI412[m.fx]) SOI412[m.fx](S, u, ev); // v4.12
    return fin(S, ev);
  }
  if (m.fx === 'piege') {
    poserPiege(S, u, m, k, ev); // pièges (v4.8)
    return fin(S, ev);
  }
  if (m.fx === 'presc') {
    poserPrescience(S, u, m, k, ev); // Prescience (v4.12)
    return fin(S, ev);
  }
  const v0 = horsDAtteinte(S, uAt(S, k), u, null), // dans les airs : intouchable (v4.8)
    mk0 = markAt(S, k);
  if (m.fx === 'swap' && v0 && !v0.colosse && !v0.seg) {
    const a = u.pos;
    u.pos = v0.pos;
    v0.pos = a;
    ev.push({ e: 'mv', u: u.uid }, { e: 'mv', u: v0.uid });
    say(ev, `${u.n} échange sa place avec ${v0.n}.`);
    landed(S, v0, ev);
    return fin(S, ev);
  }
  if (m.fx === 'swapally' && v0) {
    const a = u.pos;
    u.pos = v0.pos;
    v0.pos = a;
    v0.guard = 2;
    ev.push({ e: 'mv', u: u.uid }, { e: 'mv', u: v0.uid });
    say(ev, `Relais avec ${v0.n} : +2 Garde.`);
    return fin(S, ev);
  }
  if (m.fx === 'heal' && v0) {
    heal(S, v0, Math.round(v0.mhp * 0.3), ev);
    return fin(S, ev);
  }
  if (m.fx === 'aide' && v0) {
    v0.aide = 1; // Coup d’Main (v4.12)
    ev.push({ e: 'st', u: v0.uid, s: 'AIDE' });
    say(ev, `Coup d’Main : la prochaine attaque de ${v0.n} cette manche frappera ×1,5.`);
    return fin(S, ev);
  }
  if (m.fx === 'mitra' && u.touche) {
    say(ev, `${u.n} a été touché : il perd sa concentration, Mitra-Poing échoue.`); // v4.13
    return fin(S, ev);
  }
  if (PRE413[m.fx] && v0) {
    PRE413[m.fx](S, u, m, v0, ev); // Malédiction, Feu Follet, Vantardise, Morphing (v4.13)
    return fin(S, ev);
  }
  if (['taunt', 'turn', 'confuse'].includes(m.fx) && v0) {
    retarget(S, v0, u, m.fx, ev);
    return fin(S, ev);
  }
  const fam = typ === 'Dragon' ? null : FAMT[typ] || null,
    sb = u.t.includes(typ) ? 1.2 : 1;
  let dealt = 0;
  for (const x of affected(S, u, m, k)) {
    const t = S.tiles[x],
      v = horsDAtteinte(S, uAt(S, x), u, ev),
      mk = markAt(S, x);
    if (m.fx === 'smoke') {
      t.fog = 2;
      continue;
    }
    let rx = null,
      mult = 1,
      ren = false;
    if (fam && mk && (m.p || m.fix || m.mk)) rx = MX[mk][EL.indexOf(fam)] || null;
    if (rx === 'ren') {
      ren = true;
      rx = null;
      if (t.mark) {
        t.mark.d += 1;
        t.mark.lv = 2;
      }
      say(ev, `Renfort : la marque ${MK.find(z => z.id === mk).n} s’intensifie.`);
    } else if (rx) {
      if (t.mark && t.mark.lv === 2) mult *= 1.25;
      if (rx === 'sur' && moist(S, x)) {
        say(ev, 'Moiteur empêche la Surtension.');
        rx = null;
      } else mult *= RXM[rx] || 1;
    }
    let base = Math.round(((m.p || 4) + u.s[1] * 2) * sb);
    if (v && !(v.side === u.side && m.sh === 'one') && (m.p || m.fix)) {
      const dmg = dmgOf(S, u, m, v, typ, mult),
        b0 = dmgOf(S, u, m, v, typ, 1);
      if (b0 > 0) base = b0;
      if (dmg > 0) {
        if (typ === 'Eau' && v.tal === 'absorbeau') {
          say(ev, `${v.n} absorbe l’eau.`);
          heal(S, v, dmg, ev);
        } else if (typ === 'Électrik' && v.tal === 'absorbvolt') {
          say(ev, `${v.n} absorbe le courant.`);
          heal(S, v, dmg, ev);
        } else if (typ === 'Électrik' && v.tal === 'paratonnerre') {
          say(ev, `Paratonnerre : ${v.n} attire la foudre et se renforce.`); // v4.13
          v.boost = Math.max(v.boost, 2);
        } else if (typ === 'Feu' && v.tal === 'torche') {
          say(ev, `Torche : ${v.n} absorbe les flammes et renforce ses attaques.`);
          v.boost = 2;
        } else {
          const e = teff(typ, v.t) || 1; // 0 seulement sous Gravité (v4.13)
          dealt += damage(S, v, dmg, ev, {});
          if (e > 1) say(ev, 'C’est super efficace !');
          else if (e < 1) say(ev, 'Ce n’est pas très efficace.');
        }
      } else if (teff(typ, v.t) === 0 || (typ === 'Sol' && v.tal === 'levitation')) say(ev, `Ça n’affecte pas ${v.n}.`);
      else if (m.fx === 'devoreve') say(ev, `${v.n} ne dort pas : Dévorêve échoue.`); // v4.12
    }
    if (v && !v.ko && v.side !== u.side && CIBLE412[m.fx]) CIBLE412[m.fx](S, u, v, x, mk, ev); // Vent Glace, Draco-Souffle, Bombe Beurk (v4.12)
    if (v) apresCoup413(S, u, m, v, x, mk, typ, ev); // Triple Pied, Vague Psy, Corps Maudit, Conversion 2 (v4.13)
    if (v) apresCoup414(S, u, m, v, x, typ, ev); // notes de Résonance (v4.14)
    if (rx) react(S, rx, x, u, v && !v.ko ? v : null, base, ev);
    else if (m.mk && !ren) setMark(S, x, m.mk, u.uid);
  }
  if (m.fx === 'smoke') say(ev, 'Un brouillard épais se lève.');
  if (m.fx === 'cut' && S.tiles[k] && S.tiles[k].grass) {
    S.tiles[k].grass = false; // CS01 Coupe
    say(ev, 'Coupe : les hautes herbes sont fauchées.');
    ev.push({ e: 'terrain', k });
  }
  const v1 = v0 && !v0.ko ? v0 : null;
  if (v1 && v1.side !== u.side) {
    if (m.fx === 'push') shove(S, v1, u.pos, m.v, ev, false);
    if (m.fx === 'pull') {
      if (mk0 === 'charge' || (u.tal === 'magnepiege' && v1.t.includes('Acier'))) shove(S, v1, u.pos, m.v, ev, true);
      else say(ev, 'Aimant : la cible n’est pas Chargée.');
    }
    if (m.fx === 'parc' && mk0 === 'charge') stun(S, v1, 'PAR', ev);
    if (m.fx === 'sleep') stun(S, v1, 'SOM', ev);
    if (m.fx === 'web') {
      if (v1.tal === 'regardvif' || rune413(S, v1)) say(ev, `${v1.n} ignore l’entrave.`);
      else {
        v1.web = 2;
        say(ev, `${v1.n} est ralenti.`);
      }
    }
    if (m.fx === 'root') {
      if (v1.tal === 'regardvif' || rune413(S, v1)) say(ev, `${v1.n} ignore l’entrave.`);
      else {
        v1.root = Math.max(v1.root, m.v || 2);
        say(ev, `${v1.n} ne peut plus bouger.`);
      }
    }
  }
  if (m.fx === 'drain' && dealt > 0) heal(S, u, Math.ceil(dealt / 2), ev);
  if (m.fx === 'devoreve' && dealt > 0) heal(S, u, Math.ceil(dealt / 2), ev); // Dévorêve (v4.12)
  if (u.aide && (m.p || m.fix)) u.aide = 0; // Coup d’Main consommé (v4.12)
  fin413(S, u, m, k, v0, v1, dealt, ev); // signatures (v4.13)
  fin414(S, u, m, dealt, ev); // Orbe Vie (v4.14)
  if (m.fx === 'recoil' && dealt > 0) {
    say(ev, `${u.n} subit le contrecoup.`);
    damage(S, u, Math.max(1, Math.round(dealt * 0.25)), ev, { ind: true });
  }
  if (m.fx === 'gguard' && !u.ko) {
    u.guard = 2;
  }
  if (m.fx === 'recharge' && !u.ko) {
    u.skip = 1;
    u.badge = 'REC';
    say(ev, `${u.n} doit recharger.`);
  }
  return fin(S, ev);
}


/* actions du joueur */
export function pMove(S, u, k) {
  const retreat = !!(u && u.hr && u.acted && !u.moved); // un Éclaireur qui a frappé peut encore se replier
  if (retreat) u.acted = false;
  let ev = null;
  try {
    if (S.phase !== 'player' || u.moved || u.acted || u.ko) return null;
    if (reach(S, u)[k] === undefined) return null;
    ev = [];
    u.pos = P(k);
    u.moved = true;
    ev.push({ e: 'mv', u: u.uid });
    landed(S, u, ev);
    if (S.duel433) vigilDuel433(S, u, ev); // duel : la Vigilance adverse (v4.33)
    ev = fin(S, ev);
  } finally {
    if (retreat) u.acted = true;
  }
  if (retreat) {
    u.hr = 0;
    say(ev, `${u.n} se replie.`);
  }
  return ev;
}


export function pAct(S, u, mi, k) {
  if (S.phase !== 'player' || u.acted || u.ko) return null;
  const m = MV[u.mv[mi]];
  if (!m || !targets(S, u, m).includes(k)) return null;
  const dso = desobeit(S, u); // désobéissance (v4.10)
  if (dso) {
    u.acted = true;
    u.moved = true;
    return dso;
  }
  const avant = REDIFF.has(S) ? JSON.stringify(S) : null; // rediffusion du meilleur coup (v4.11)
  const xpC = m.xp ? coutXP(u) : 0,
    tch0 = u.touche; // attaque Experte (v4.14)
  const mv0 = u.moved,
    ev = chargeDiffere(S, u, m) ? lancerCharge(S, u, mi, k) : resolve(S, u, m, k); // attaques chargées (v4.8)
  if (xpC && !(m.fx === 'mitra' && tch0)) {
    u.en = Math.max(0, u.en - xpC);
    say(ev, `Attaque Experte : ${u.n} libère ${xpC} losange${xpC > 1 ? 's' : ''} de Résonance.`);
  }
  if (u.item === 'mouchoir' && !u.choix) u.choix = u.mv[mi]; // Mouchoir Choix (v4.14)
  u.acted = true;
  u.moved = true;
  accordApres(S, u, m, ev); // Accords de Résonance (v4.10)
  // Éclaireur : frappe d’abord, se déplace ensuite
  if (!u.ko && !mv0 && u.side === 'a' && (roleOf(u) === 'Éclaireur' || m.fx === 'frappefuite') && !S.over && !u.chg) { // Aqua-Jet, Pisto-Poing (v4.13)
    u.moved = false;
    u.hr = 1;
  }
  if (m.fx === 'morphing' && u.morph && !u.ko && !S.over && u.side === 'a') {
    u.acted = false; // Morphing : il frappe aussitôt avec ce qu’il a copié (v4.13)
    say(ev, `${u.n} peut encore utiliser une capacité copiée.`);
  }
  if (avant) noterMoment(S, u, m.n, ev, avant);
  return ev;
}


export function gainEn(S, u, n, ev) {
  if (!u || u.ko || (u.side !== 'a' && !(S && S.duel433)) || !(hasNx(u) || aXP(u) || resoCand417(S, u))) return; // v4.14 : attaques Expertes ; v4.17 : Forme Résonante
  const b = u.en;
  u.en = Math.min(EMAX, u.en + n);
  if (u.en > b && ev) {
    ev.push({ e: 'en', u: u.uid, v: u.en - b });
    if (u.en === EMAX && hasNx(u)) ev.push({ e: 'ready', u: u.uid }, { e: 'msg', s: `${u.n} est prêt à s’éveiller.` });
    else if (u.en === EMAX && !u.resoMsg && resoCand417(S, u)) {
      u.resoMsg = 1;
      ev.push({ e: 'ready', u: u.uid }, { e: 'msg', s: `${u.n} peut entrer en Forme Résonante.` });
    }
  }
}


export function evoOpts(S, u) {
  const m = BY[u.id];
  if (!m || !m.nx) return [];
  if (m.nx === 'eevee') {
    const o = [],
      mk = markAt(S, uk(u));
    if (mk && EEVEE[mk]) o.push(EEVEE[mk]);
    o.push(EEVEE[heureDe(S)]);
    if (u.side === 'a') Object.values(EEVEE).forEach(x => o.includes(x) || o.push(x)); // v4.34 : vos Évoli choisissent librement
    return o;
  }
  if (BRANCHES[u.id]) return brancheOpts(S, u); // v4.13 : la voie dépend de la situation
  return Array.isArray(m.nx) ? [...m.nx] : [m.nx];
}


function brancheOpts(S, u) {
  const L = BRANCHES[u.id],
    o = L.filter(b => b.ok(S, u)).map(b => b.id);
  L.forEach(b => {
    if (b.def && !o.includes(b.id)) o.push(b.id);
  });
  return o.length ? o : [L[L.length - 1].id];
}


export function brancheWhy(S, u, id) {
  const b = (BRANCHES[u.id] || []).find(x => x.id === id);
  return !b ? '' : b.ok(S, u) ? b.why : 'Voie par défaut';
}


export function nextId(S, u) {
  const o = evoOpts(S, u);
  if (!o.length) return null;
  if (BRANCHES[u.id]) return o[0];
  if (Array.isArray(BY[u.id].nx)) return S.wx && S.wx.k === 'pluie' ? o[1] : o[0];
  return o[0];
}


export function eveilInfo(S, u) {
  const id = nextId(S, u);
  return id ? BY[id] : null;
}


export function canEveil(S, u) {
  return (
    !S.sansEveil && // défi Sans Éveil (v4.9)
    u.side === 'a' &&
    !u.ko &&
    S.phase === 'player' &&
    !u.acted &&
    !u.sn &&
    u.en >= EMAX &&
    S.voix >= 1 &&
    evoOpts(S, u).length > 0
  );
}


export function foeEvo(S, e) {
  return e.side === 'e' && !S.duel433 && !e.ko && !e.seg && !e.colosse && e.hp <= e.mhp * 0.5 && hasNx(e);
}


function arrive(S, u, ev) {
  const A = ARR[u.id];
  if (!A) return;
  ev.push({ e: 'arr', u: u.uid });
  say(ev, `Arrivée de ${u.n} : ${A[1]}`);
  const foes = r => S.units.filter(o => !o.ko && o.side !== u.side && hdist(o.pos, u.pos) <= r),
    mates = r => S.units.filter(o => !o.ko && o.side === u.side && o !== u && hdist(o.pos, u.pos) <= r);
  A[0].forEach(f => {
    if (f.k === 'ring') nbrK(uk(u)).forEach(x => setMark(S, x, f.mk, u.uid));
    else if (f.k === 'wx') {
      S.wx = { k: f.w, n: u.item === 'rochemeteo' ? 8 : 5 }; // Roche Météo (v4.14)
      say(ev, `Météo ${WXN[f.w]} pendant 5 manches.`);
    } else if (f.k === 'roar') foes(1).forEach(o => shove(S, o, u.pos, f.v, ev, false));
    else if (f.k === 'heal') mates(f.r).forEach(o => heal(S, o, Math.round(o.mhp * f.p), ev));
    else if (f.k === 'fog')
      [uk(u), ...nbrK(uk(u))].forEach(x => {
        S.tiles[x].fog = 2;
      });
    else if (f.k === 'sleep') foes(1).forEach(o => stun(S, o, 'SOM', ev, true));
    else if (f.k === 'confuse')
      foes(1).forEach(o => {
        if ((o.intent || S.jit) && !o.done) retarget(S, o, u, 'confuse', ev); // v4.13 : aussi sans intentions
        else if (o.tal !== 'regardvif') {
          o.web = Math.max(o.web, 2);
          say(ev, `${o.n} est désorienté et ralenti.`);
        }
      });
    else if (f.k === 'root')
      foes(1).forEach(o => {
        if (o.tal === 'regardvif') return;
        o.root = Math.max(o.root, f.v || 2);
        say(ev, `${o.n} ne peut plus bouger.`);
      });
    else if (f.k === 'guard') {
      u.guard = 2;
      if (f.who === 'allies')
        mates(1).forEach(o => {
          o.guard = 2;
        });
    } else if (f.k === 'boost') u.boost = 2;
  });
}


export function transform(S, u, id, ev) {
  const E = BY[id],
    old = u.n,
    om = u.mhp,
    oid = u.id,
    ot = [...u.t];
  u.id = E.id;
  u.n = E.n;
  u.t = [...E.t];
  u.s = [...E.s];
  u.mv = avecApprise(u, E.mv); // la capacité apprise par CT ou CS reste (v4.6-01)
  u.tal = E.tal;
  u.ferm = E.tal === 'fermete';
  const nm = mhpOf(E.s) + (u.hb || 0);
  u.mhp = nm;
  u.hp = Math.min(nm, u.hp + Math.max(0, nm - om) + Math.round(nm * 0.3));
  u.bru = 0;
  u.web = 0;
  u.root = 0;
  u.badge = null;
  u.skip = 0;
  u.evolved = true;
  u.evo++;
  u.en = 0;
  const tt = [...E.t];
  ev.push({ e: 'evo', u: u.uid, from: old, to: E.n, side: u.side, ft: ot, tt });
  if (u.side === 'a') (S.stats.evl = S.stats.evl || []).push([oid, id, S.round]);
  say(ev, `${old} évolue en ${E.n} !`);
  entryWx(S, u, ev);
  arrive(S, u, ev);
  if (u.fat) {
    u.fat = false;
    say(ev, `L’Éveil efface la fatigue de ${u.n}.`);
  }
  // types → espèce, pour les illustrations de l’évolution
  PKT.set(u.t, u.id);
  PKT.set(ot, oid);
  PKT.set(tt, id);
}


export function pEveil(S, u, id) {
  if (!canEveil(S, u)) return null;
  const o = evoOpts(S, u);
  if (!id) id = nextId(S, u);
  if (!o.includes(id)) return null;
  const ev = [],
    avant = REDIFF.has(S) ? JSON.stringify(S) : null, // rediffusion (v4.11)
    nom = u.n,
    harm434 = BY[u.id].nx === 'eevee' && evoliHarmonie434(S, u).includes(id); // Évoli en harmonie (v4.34)
  S.lastAtk = u.uid;
  S.voix -= 1;
  S.stats.voix += 1;
  S.stats.evo++;
  S.eveil = true;
  transform(S, u, id, ev);
  if (harm434 && !u.ko) {
    u.en = Math.min(EMAX, (u.en || 0) + 1);
    say(ev, `En harmonie : ${u.n} garde 1 losange.`);
  }
  u.acted = true;
  u.moved = true;
  const r = fin(S, ev);
  if (avant) noterMoment(S, u, null, r, avant, `Éveil : ${nom} devient ${u.n}`);
  return r;
}


export function pDodge(S, u, k) {
  if (S.phase !== 'player' || S.voix < 1 || u.ko || u.sn) return null;
  if (!nbrK(uk(u)).includes(k) || S.tiles[k].rock || uAt(S, k)) return null;
  const ev = [];
  u.pos = P(k);
  S.voix--;
  S.stats.voix++;
  ev.push({ e: 'mv', u: u.uid });
  say(ev, `Esquive : ${u.n} se décale.`);
  landed(S, u, ev);
  return fin(S, ev);
}


export function pRelance(S, u) {
  if (S.phase !== 'player' || S.voix < 2 || S.relance || !u.acted || u.ko || u.sn) return null;
  u.acted = false;
  u.moved = false;
  S.relance = true;
  S.voix -= 2;
  S.stats.voix += 2;
  return [{ e: 'msg', s: `Relance : ${u.n} peut rejouer.` }];
}


/* phase adverse */
function aiScore(S, e, m, k, pos) {
  const sim = Object.assign({}, e, { pos });
  let sc = 0,
    hitA = false;
  for (const x of affected(S, sim, m, k)) {
    const v = uAt(S, x);
    if (!v || v === e) continue;
    let d = dmgOf(S, sim, m, v, mvType(S, sim, m), 1);
    if (v.side === 'a') {
      sc += d + (d >= v.hp ? 30 : 0);
      if (d > 0) hitA = true;
    } else sc -= d * 1.2;
  }
  if (!hitA) return -1;
  sc += m.mk ? 1 : 0;
  sc += aiStyleBonus(S, e, m, k, sim); // chaque maître d’arène a son style (v4.4)
  // selon la difficulté : vise les Pokémon fragiles ou immobiles, met à l’abri ceux qui vont évoluer
  const lv = (DIFF[S.diff] || DIFF.normal).ai;
  if (sc <= 0 || !lv) return sc;
  for (const x of affected(S, sim, m, k)) {
    const v = uAt(S, x);
    if (!v || v.side !== 'a' || v === e) continue;
    const d = dmgOf(S, sim, m, v, mvType(S, sim, m), 1);
    if (d <= 0) continue;
    sc += (Math.min(d, v.hp) / v.mhp) * (lv > 1 ? 14 : 8);
    if (movPts(S, v) === 0 || v.root > 0) sc += lv > 1 ? 8 : 5;
  }
  if (hasNx(e) && e.hp <= e.mhp * 0.5) {
    const th = threatAt(S, e, pos);
    sc -= th >= e.hp ? (lv > 1 ? 45 : 26) : th * (lv > 1 ? 0.5 : 0.3);
  } else if (lv > 1 && threatAt(S, e, pos) >= e.hp) sc -= 12;
  if (lv > 1) sc += expert429(S, e, m, k, pos, sim); // Expert : attaques coordonnées (v4.29)
  return sc;
}


export function plan(S, ev) {
  if (!S._obs && S.round === 1) applyObst(S); // obstacles posés avant les premières intentions
  if (S.duel433) return duelPlan433(S, ev); // duel : deux joueurs, pas d’IA (v4.33)
  S.units
    .filter(e => e.side === 'e' && !e.ko)
    .sort((a, b) => b.s[3] - a.s[3])
    .forEach(e => {
      e.done = false;
      e.intent = null;
      e.perdu = 0; // v4.12 : action perdue cette manche (Éclipse…)
      e.force = null; // v4.12 : cible imposée (Charme, Onde Folie, Ultrason)
      e.prep = false; // v4.12 : déplacement de la manche déjà fait
      if (e.skip > 0) {
        e.skip = 0;
        say(
          ev,
          `${e.n} ${e.badge === 'REC' ? 'doit recharger' : 'est encore ' + (e.badge === 'GEL' ? 'gelé' : e.badge === 'SOM' ? 'endormi' : 'paralysé')}.`
        );
        return;
      }
      e.badge = null;
      choisirAction(S, e, ev); // il se place (et, dans l’ancien mode, annonce sa cible)
      if (S.jit) e.intent = null; // v4.12 : rien n’est annoncé, la cible se choisit à son tour
    });
  return ev;
}


/* =====================================================================
   v4.12 : intentions cachées
   ---------------------------------------------------------------------
   Plus aucune flèche ni case rouge. En début de manche, chaque
   adversaire s’avance sous vos yeux (comme avant) ; au moment d’agir, il
   frappe depuis sa case la meilleure cible à sa portée, selon les
   positions du moment. On ne peut plus « sortir de la case annoncée » :
   il faut sortir de sa portée, se couvrir, protéger les fragiles.
   Les effets qui agissaient sur une intention agissent sur l’action :
   - endormir, geler, paralyser avant son tour : il ne joue pas ;
   - Charme, Onde Folie, Ultrason : sa cible lui est imposée (force) ;
   - Éclipse : il perd son action (perdu).
   ===================================================================== */
/** La cible imposée à un adversaire, ou null (cible disparue : il joue normalement). */
export function cibleImposee(S, e) {
  const f = e.force;
  if (!f) return null;
  if (f.fx === 'taunt') {
    const s = byUid(S, f.by);
    return s && !s.ko ? s : null;
  }
  const pool = S.units.filter(o => !o.ko && o !== e && (f.fx === 'turn' ? o.side === e.side : true));
  pool.sort((a, b) => hdist(a.pos, e.pos) - hdist(b.pos, e.pos));
  return pool[0] || null;
}


/** Score d’une attaque contre la cible imposée : seuls comptent les dégâts sur elle. */
function scoreCible(S, e, m, k, pos, F) {
  const sim = Object.assign({}, e, { pos });
  let sc = 0;
  for (const x of affected(S, sim, m, k)) {
    const v = uAt(S, x);
    if (v === F) sc += dmgOf(S, sim, m, v, mvType(S, sim, m), 1) + 0.5;
  }
  return sc;
}


/** Hors de portée de sa cible imposée : il s’en rapproche. */
function approcherDe(S, e, opts, F, here) {
  let bk = here,
    bd = hdist(e.pos, F.pos);
  for (const pk in opts) {
    const d = hdist(P(pk), F.pos);
    if (d < bd) {
      bd = d;
      bk = pk;
    }
  }
  return [bk, `s’approche de ${F.n}`];
}


/** La décision d’un adversaire : se placer, puis viser (appelée à son tour en mode caché). */
function choisirAction(S, e, ev, surPlace) {
  const F = S.jit && surPlace ? cibleImposee(S, e) : null;
  const al = S.units.filter(a => a.side === 'a' && !a.ko);
  if (!al.length) return;
  const here = uk(e),
    opts = Object.assign({ [here]: 0 }, surPlace ? {} : reach(S, e));
  let best = null;
  for (const pk in opts) {
    const pos = P(pk),
      sim = Object.assign({}, e, { pos }),
      pen =
        (markAt(S, pk) === 'trempe' && !e.t.includes('Sol') ? 1.5 : 0) +
        (S.tiles[pk].lava > 0 ? 6 : 0) +
        (piegeHostile(S, e, pk) ? 7 : 0) -
        (pk === here ? 0.5 : 0);
    e.mv.forEach(mid => {
      const m = MV[mid];
      if (m.wx || !(m.p || m.fix) || m.sh === 'self' || m.sh === 'ally' || !peutXP(S, e, m)) return;
      let cands = [];
      if (m.sh === 'ring') cands = [pk];
      else
        (F ? [F] : al).forEach(a => {
          const ak = uk(a);
          if (S.tiles[ak].fog > 0 && hdist(pos, a.pos) > 1) return;
          if (inReach(S, sim, m, ak)) cands.push(ak);
        });
      if (F) cands = cands.filter(k => affected(S, sim, m, k).some(x => uAt(S, x) === F));
      cands.forEach(k => {
        const s = F ? scoreCible(S, e, m, k, pos, F) : aiScore(S, e, m, k, pos);
        if (s <= 0) return;
        const sc = s - pen;
        if (!best || sc > best.sc) best = { sc, pk, mid, k };
      });
    });
  }
  if (!best && !F) best = soutienIA413(S, e, opts, al, here); // capacités de soutien des nouvelles familles (v4.13)
  const pg = F ? null : planPiege(S, e, best, al); // poser un piège (v4.8)
  if (pg) e.intent = pg;
  else if (best) {
    if (best.pk !== here) {
      e.pos = P(best.pk);
      e.mvR = S.round; // Poursuite (v4.13)
      ev.push({ e: 'mv', u: e.uid });
      piegeArrivee(S, e, ev);
    }
    e.intent = { mv: best.mid, k: best.k };
  } else if (surPlace) {
    if (F) say(ev, `${e.n} ne peut pas atteindre ${F.n}.`); // sans cible imposée : il attend, sans bruit
  }
  else if (!e.seg) {
    const [bk, lab] = F ? approcherDe(S, e, opts, F, here) : aiFallback(S, e, opts, al, here);
    if (bk !== here) {
      e.pos = P(bk);
      e.mvR = S.round; // Poursuite (v4.13)
      ev.push({ e: 'mv', u: e.uid });
      piegeArrivee(S, e, ev);
    }
    say(ev, `${e.n} ${lab}.`);
  }
}


/** Mode caché : l’adversaire se place pour son action (séparé de l’attaque, pour que l’œil suive). */
export function preparerEnnemi(S, uid) {
  const e = byUid(S, uid),
    ev = [];
  if (!S.jit || !e || e.ko || S.over || e.done || e.prep) return ev;
  e.prep = true;
  if (e.badge || e.perdu) return ev;
  const F = cibleImposee(S, e);
  if (F && e.force) say(ev, e.force.fx === 'taunt' ? `${e.n} ne voit plus que ${F.n}.` : e.force.fx === 'turn' ? `${e.n}, troublé, se retourne contre ${F.n} !` : `${e.n}, désorienté, s’en prend à ${F.n}.`);
  choisirAction(S, e, ev, true);
  vigilance420(S, e, ev); // Vigilance : interception avant l’attaque (v4.20)
  return fin(S, ev);
}


export function zoneMenace(S, e) {
  const cle = S.round + '|' + e.uid + '|' + S.units.map(u => (u.ko ? 'x' : uk(u))).join(';') + '|' + (S.wx ? S.wx.k : '');
  if (MENACE.k === cle) return MENACE.z;
  const z = new Set(),
    opts = Object.assign({ [uk(e)]: 0 }, e.badge || e.perdu ? {} : reach(S, e));
  if (!(e.badge || e.perdu))
    for (const pk in opts) {
      const sim = Object.assign({}, e, { pos: P(pk) });
      e.mv.forEach(mid => {
        const m = MV[mid];
        if (!m || m.wx || !(m.p || m.fix) || m.sh === 'self' || m.sh === 'ally' || !peutXP(S, e, m)) return;
        if (m.sh === 'ring') {
          nbrK(pk).forEach(k => z.add(k));
          return;
        }
        for (const k in S.tiles) {
          if (S.tiles[k].rock || !inReach(S, sim, m, k)) continue;
          affected(S, sim, m, k).forEach(x => z.add(x));
        }
      });
    }
  MENACE.k = cle;
  MENACE.z = [...z];
  return MENACE.z;
}


export function startEnemy(S) {
  S.phase = 'enemy';
  return ordreEnnemis(S); // stratégie OrdreParPhases du moteur tactique (v4.5-01)
}


export function execFoe(S, uid) {
  const e = byUid(S, uid),
    ev = [];
  if (!e || e.ko || S.over) return ev;
  if (S.jit) {
    if (e.done) return ev;
    if (e.badge || e.perdu) {
      e.done = true;
      say(ev, `${e.n} ne peut pas agir.`);
      return ev;
    }
    if (!e.prep) preparerEnnemi(S, uid).forEach(x => ev.push(x)); // robots de test, appels directs
    e.done = true;
    if (e.ko || S.over) return fin(S, ev);
  } else e.done = true;
  if (!e.intent) {
    if (e.badge) say(ev, `${e.n} ne peut pas agir.`);
    return ev;
  }
  const m = MV[e.intent.mv],
    k = e.intent.k;
  e.intent = null;
  let r = ev;
  if (!inReach(S, e, m, k)) say(ev, `${e.n} utilise ${m.n}, mais la cible est hors de portée !`);
  else {
    const tgt = m.sh === 'one' ? uAt(S, k) : null;
    if (m.xp) e.en = Math.max(0, (e.en || 0) - coutXP(e)); // attaque Experte (v4.14)
    r = resolve(S, e, m, k);
    if (m.sh === 'one' && !tgt) r.push({ e: 'msg', s: 'La case visée est vide : l’attaque se perd.' });
    if (tgt && !tgt.ko && tgt.tal === 'statik' && !e.ko && hdist(e.pos, tgt.pos) === 1) {
      setMark(S, uk(e), 'charge', tgt.uid);
      r.push({ e: 'msg', s: `Statik : ${e.n} est Chargé.` });
    }
  }
  if (!e.ko && !S.over && roleOf(e) === 'Éclaireur' && !(e.root > 0)) foeRetreat(S, e, r);
  return r;
}


/* fin de manche : soutien des rôles, effets de la manche, puis Restes */
export function endRound(S) {
  S.acteur430 = null; // les effets de fin de manche n’ont pas d’auteur (v4.30)
  const ch = [];
  CROCHETS.avantFinManche.forEach(h => h(S, ch)); // attaques chargées, usure des pièges (v4.8)
  if (S.over) return ch;
  const pre = ch.concat(roundSupport(S)),
    ev = roundEffects(S);
  if (!S.over)
    S.units.forEach(u => {
      if (!u.ko && u.item === 'restes' && u.hp < u.mhp) heal(S, u, 3, ev);
    });
  return pre.concat(ev);
}


/** Effets de fin de manche d’un Pokémon : brûlure, poison, météo, lave, durées (v4.33 : fonction à part pour le duel). */
export function effetsUnite433(S, u, ev) {
  if (u.ko) return;
    if (u.bru > 0) {
      say(ev, `${u.n} souffre de sa brûlure.`);
      damage(S, u, u.tal === 'isograisse' ? 1 : 3, ev, { ind: true });
      u.bru--;
    }
    if (u.psn > 0 && !u.ko) {
      say(ev, `${u.n} souffre du poison.`); // Bombe Beurk (v4.12)
      damage(S, u, 3, ev, { ind: true });
      u.psn--;
    }
    u.aide = 0;
    if (S.wx && !u.ko) {
      if (S.wx.k === 'grele' && !u.t.includes('Glace')) damage(S, u, 2, ev, { ind: true });
      if (S.wx.k === 'sable' && !u.t.some(t => ['Roche', 'Sol', 'Acier'].includes(t)))
        damage(S, u, 2, ev, { ind: true });
    }
    if (!u.ko && S.tiles[uk(u)].lava > 0 && !flies(u)) damage(S, u, u.tal === 'isograisse' ? 2 : 4, ev, { ind: true });
    ['web', 'guard', 'anchor', 'root', 'boost'].forEach(f => {
      if (u[f] > 0) u[f]--;
    });
    u.prot = 0;
    if (u.tal === 'mue') {
      u.bru = 0;
      u.psn = 0;
      u.web = 0;
      u.root = 0;
    }
}


function roundEffects(S) {
  const ev = [];
  if (S.over) return ev;
  S.units.forEach(u => {
    if (u.ko || (S.duel433 && u.j433 === 2)) return; // duel : ceux du Joueur 2 au début de son tour (v4.33)
    effetsUnite433(S, u, ev);
  });
  for (const k in S.tiles) {
    const t = S.tiles[k];
    if (t.mark) {
      t.mark.d--;
      if (t.mark.d <= 0 || (S.wx && S.wx.k === 'soleil' && t.mark.k === 'trempe')) t.mark = null;
    }
    ['mud', 'lava', 'fog'].forEach(f => {
      if (t[f] > 0) t[f]--;
    });
  }
  vivantManche(S, ev); // plateau vivant : feu, pluie, grêle et heure (v4.7-01)
  durees412(S, ev); // Vent Arrière, Distorsion (v4.12)
  if (S.wx) {
    S.wx.n--;
    if (S.wx.n <= 0) {
      say(ev, `La météo ${WXN[S.wx.k]} se dissipe.`);
      S.wx = null;
    }
  }
  S.units
    .filter(e => foeEvo(S, e))
    .forEach(e => {
      say(ev, `${e.n} puise dans ses dernières forces…`);
      transform(S, e, nextId(S, e), ev);
    });
  fin(S, ev);
  if (S.over) return ev;
  if (S.round >= S.lim) {
    S.over = 'lose';
    S.timeout = true;
    if ((SCEN[S.sc] || {}).roam) S.fuite416 = true; // bête errante (v4.16)
    say(ev, S.duel433 ? 'Temps écoulé : les PV restants départagent les joueurs.' : S.fuite416 ? fuiteMsg416(S) : 'Temps écoulé : l’adversaire tient la position.');
    ev.push({ e: 'over' });
    return ev;
  }
  S.round++;
  S.relance = false;
  S.voix = S.vmax;
  S.phase = 'player';
  S.lastAtk = null;
  S.units.forEach(u => {
    if (u.side === 'a' && !u.ko && !S.duel433) gainEn(S, u, 1, ev); // duel : au début du tour de chacun (v4.33)
  });
  S.units.forEach(u => {
    if (u.ko) return;
    u.done = false;
    if (u.side === 'a' && !S.duel433) {
      u.sn = false;
      if (u.skip > 0) {
        u.skip = 0;
        u.acted = true;
        u.moved = true;
        u.sn = true;
      } else {
        u.acted = false;
        u.moved = false;
        u.badge = null;
      }
    }
  });
  plan(S, ev);
  return ev;
}


export function preview(S, uid, mi, k) {
  __set_NOTE([]); // notes de couverture, ricochet, gardiennage
  try {
    return previewCore(S, uid, mi, k);
  } finally {
    __set_NOTE(null);
  }
}


function previewCore(S, uid, mi, k) {
  const C = JSON.parse(JSON.stringify(S)),
    u = byUid(C, uid),
    ev = pAct(C, u, mi, k) || [],
    diff = [];
  C.units.forEach(x => {
    const o = byUid(S, x.uid),
      dh = x.hp - o.hp,
      st = x.badge && x.badge !== o.badge ? x.badge : null,
      can = !!(o.intent && !x.intent && !x.ko) || !!(S.jit && x.side === 'e' && !x.ko && !o.done && x.perdu && !o.perdu),
      ret = !!(o.intent && x.intent && o.intent.k !== x.intent.k) || !!(S.jit && x.force && !o.force),
      mv = o.pos[0] !== x.pos[0] || o.pos[1] !== x.pos[1],
      ko = x.ko && !o.ko,
      rt = x.root > o.root,
      wb = x.web > o.web,
      evw = x.side === 'e' && !x.ko && hasNx(x) && x.hp <= x.mhp * 0.5 && o.hp > o.mhp * 0.5,
      en = x.side === 'a' ? x.en - o.en : 0;
    if (dh || st || ko || can || ret || mv || rt || wb || evw || en > 0)
      diff.push({ uid: x.uid, n: x.n, side: x.side, dh, st, ko, can, ret, mv, rt, wb, evw, en });
  });
  const su = byUid(S, uid);
  return {
    diff,
    rxs: ev.filter(e => e.e === 'rx').map(e => e.rx),
    aff: affected(S, su, MV[su.mv[mi]], k),
    over: C.over,
    wx: ev.some(e => e.e === 'msg' && e.s.startsWith('Météo')),
    notes: NOTE
  };
}

// Instructions exécutées au démarrage, dans l'ordre d'origine (voir index.js).
export function __init() {

/* ===================== MOTEUR DE COMBAT v0.8 ===================== */
BW = 8,
  BH = 6;


K = (c, r) => c + ',' + r;


P = k => k.split(',').map(Number);


inB = (c, r) => c >= 0 && c < BW && r >= 0 && r < BH;


CDIR = [
  [1, -1, 0],
  [1, 0, -1],
  [0, 1, -1],
  [-1, 1, 0],
  [-1, 0, 1],
  [0, -1, 1]
];


nbrK = k => nbr(P(k)).map(q => K(q[0], q[1]));


mhpOf = s => 20 + s[0] * 8;


uk = u => K(u.pos[0], u.pos[1]);


uAt = (S, k) => S.units.find(u => !u.ko && uk(u) === k);


byUid = (S, id) => S.units.find(u => u.uid === id);


flies = u => !u.cloue && (u.t.includes('Vol') || u.tal === 'levitation');


effR = (u, m, S) =>
  m.r + (u.tal === 'oeilcompose' && m.r > 0 ? 1 : 0) + (u.colosse && m.r > 0 ? 2 : 0) - nuitPortee(S, u, m) + (m.pluie && S && S.wx && S.wx.k === 'pluie' ? 2 : 0) + (u.item === 'lentillezoom' && m.r >= 2 ? 1 : 0);


NEEDU = ['swap', 'swapally', 'push', 'pull', 'web', 'confuse', 'turn', 'taunt', 'heal', 'parc', 'sleep', 'root'];


HOSTILE = ['confuse', 'turn', 'taunt', 'push', 'pull', 'web', 'parc', 'sleep', 'root'];


RXM = { fon: 1.5, bri: 2, sur: 1.3 };


EMAX = 3;


hasNx = u => !!(BY[u.id] && BY[u.id].nx);


/* v4.13 · Éveils à embranchement : chaque voie a sa condition ; la voie « par défaut » reste toujours ouverte */
auContact = (S, u, camp) => S.units.filter(o => !o.ko && o !== u && (camp === 'allie' ? o.side === u.side : o.side !== u.side) && hdist(o.pos, u.pos) === 1).length;


BRANCHES = {
  tetarte: [
    { id: 'tarpaud', why: 'Case Trempée ou Pluie', ok: (S, u) => markAt(S, uk(u)) === 'trempe' || !!(S.wx && S.wx.k === 'pluie') },
    { id: 'tartard', why: 'Un adversaire au contact', ok: (S, u) => auContact(S, u) > 0, def: 1 }
  ],
  ramoloss: [
    { id: 'roigada', why: 'Un allié au contact', ok: (S, u) => auContact(S, u, 'allie') > 0 },
    { id: 'flagadoss', why: 'Case Trempée', ok: (S, u) => markAt(S, uk(u)) === 'trempe', def: 1 }
  ],
  debugant: [
    { id: 'kapoera', why: '2 adversaires au contact', ok: (S, u) => auContact(S, u) >= 2 },
    { id: 'kicklee', why: 'PV au-dessus de 50 %', ok: (S, u) => u.hp > u.mhp / 2 },
    { id: 'tygnon', why: 'PV à 50 % ou moins', ok: (S, u) => u.hp <= u.mhp / 2 }
  ]
};


/** v4.12 : toutes les cases qu'un adversaire peut atteindre ce tour-ci (déplacement + portée de ses attaques). */
MENACE = { k: '', z: [] };
}
