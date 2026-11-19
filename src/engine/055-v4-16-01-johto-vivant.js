/* Section d'origine : v4.16-01-johto-vivant.js */

import { EL, MX } from './004-01-donnees.js';
import { MV } from './005-02-capacites.js';
import { BY, MON, SCEN } from './009-03-pokemon.js';
import { RECRUIT } from './010-04-evolution-en-combat.js';
import { ITEMS2, PROFILE, isCamp, lvlOfPts, ownedItems, pairKey } from './011-05-etat-de-partie.js';
import { BADGES } from './013-07-arenes.js';
import { paintOverlay } from '../screens/overlays/dialogsStore.js';
import { $, medal, toast } from './014-08-outils.js';
import { CROCHETS } from './015-v4-8-00-crochets.js';
import { TOD } from './017-10-accueil-route.js';
import { __set_squad, renderSquad, save, squad } from './020-13-equipe-cartes.js';
import { P, hasNx, heal, nextId, say, setMark, transform } from './021-14-moteur-combat.js';
import { DUOT, wildScen } from './022-15-systemes-objets-liens-ia.js';
import { OBST } from './023-16-roles-synergies-obstacles.js';
import { B, backToPrep } from './024-17-interface-combat.js';
import { esc, queueSave } from './025-19-sauvegardes.js';
import { HELD_IMG, ICO414, ITM, SHOP, bagN, famOwned, fmt, today } from './032-v4-00-socle.js';
import { goFight } from './036-v4-04-accueil.js';
import { PL, placeName } from './037-v4-05-carte.js';
import { LEGS, isShinyOwned, shinyStyle } from './043-v4-4-01-aventure-plus.js';
import { FOURNISSEURS_DEGATS } from './044-v4-5-01-moteur-tactique.js';
import { MACHINES } from './045-v4-6-01-ct-cs.js';
import { SUCCES, estTombe } from './048-v4-9-01-rejouabilite.js';
import { enExpedition, renderCampBase } from './049-v4-10-01-identite.js';
import { multChroma } from './050-v4-11-01-monde.js';
import { HELD_SHOP, aXP } from './053-v4-14-01-resonance.js';
import { JCHAIN, JGYMS, PLACES_J, johtoOuvert, regionJ415 } from './054-v4-15-01-johto.js';
import { roamPos416 } from './056-v4-16-1-01-finitions.js';
import { deLieu417, domJour417 } from './057-v4-17-01-compagnons-et-resonance.js';
import { refreshAccueil } from '../screens/accueil/accueilStore.js';
import { hSetup419, hTick419 } from './059-v4-19-01-hoenn.js';
import { regFam421, regionNo421 } from './061-v4-21-01-capture-partout.js';
import { monHebdo429, wkClean429 } from './064-v4-29-01-qualite.js';
import { campOk430 } from './065-v4-30-01-camp-et-tactique.js';

export let CROWN416, ROAM, roamLeg416, roamActif416, roamOk416, fuiteMsg416, wildDom416, enPension416, MARK_T416, scoreDe416;
let SVGI416, JDIS, jdisDe, ROAM_H, TALIS, roamL416, couple416, PENS_SEL, MARK_N416, DUO_N416, DUO_DE416, DUOG416, AMI_POS, AMI_DEL, AMI_MODE;
export function __set_wildDom416(v) { return (wildDom416 = v); }
export { couple416, parents416, heritable416 }; // lus par la Pension du Camp (src/screens/camp)


/* =====================================================================
   v4.16 : Johto vivant
   1. L’histoire de Johto : la Néo-Dissonance de l’Admin Cobalt (4 combats,
      après les badges 2, 4, 6 et 8 de Johto ; le dernier ouvre le Plateau).
   2. Les bêtes errantes : Raikou, Entei et Suicune, réveillées à la Tour
      Cendrée, changent de lieu après chaque combat. Elles fuient au bout de
      4 manches et gardent leurs blessures : usez-les, puis apaisez-les.
      Chacune laisse un talisman (objet tenu unique). Elles restent, comme
      toutes les légendes, impossibles à recruter.
   3. Les Pokémon Dominants : rares, plus grands, plus forts, escortés.
      Battus ou capturés, ils laissent un trésor (CT, objet tenu, Éclats).
   4. La Pension, en couple : deux Pokémon déposés donnent un œuf de leur
      famille, avec une attaque héritée et plus de chances de chromatique.
   5. Les Liens : chaque duo au palier Duo a désormais sa technique
      combinée (selon ses types) ; 4 nouvelles techniques de Johto.
   6. Défis entre amis : une carte de dresseur à partager (un code texte),
      les équipes des amis à affronter, un classement commun.
   ===================================================================== */

/* ---------- profil (fonctions déclarées : appelées dès le chargement) ---------- */
export function V416_0() {
  return { jdis: 0, roam: {}, herit: {}, couple: [], tid: '', amis: [], jour: null, dom: 0, oeufs: 0 };
}


function amiClean416(a) {
  if (!a || typeof a !== 'object' || typeof a.id !== 'string' || !/^[a-z0-9]{6,12}$/.test(a.id)) return null;
  const t = (Array.isArray(a.t) ? a.t : [])
    .filter(x => Array.isArray(x) && BY[x[0]] && !BY[x[0]].ennemi)
    .slice(0, 4)
    .map(x => [x[0], MV[x[1]] ? x[1] : 0, ITEMS2[x[2]] ? x[2] : 0, x[3] ? 1 : 0, MV[x[4]] ? x[4] : 0]);
  if (!t.length) return null;
  const s = a.s && typeof a.s === 'object' ? a.s : {},
    I = (v, M) => (Number.isFinite(v) ? Math.max(0, Math.min(M, Math.floor(v))) : 0);
  const jr = a.jr && typeof a.jr.d === 'string' && /^\d{4}-\d\d-\d\d$/.test(a.jr.d) ? { d: a.jr.d, r: ['S', 'A', 'B'].includes(a.jr.r) ? a.jr.r : '', m: I(a.jr.m, 99) } : null;
  return {
    id: a.id,
    n: String(a.n || 'Dresseur').replace(/[<>&"]/g, '').slice(0, 14) || 'Dresseur',
    t,
    s: { b: I(s.b, 8), j: I(s.j, 8), e: I(s.e, 5), c: s.c ? 1 : 0, d: I(s.d, 999), tb: I(s.tb, 999), sh: I(s.sh, 999), w: I(s.w, 99999), m: s.m ? 1 : 0 },
    jr,
    dt: typeof a.dt === 'string' && /^\d{4}-\d\d-\d\d$/.test(a.dt) ? a.dt : '',
    w: I(a.w, 9999),
    l: I(a.l, 9999),
    dw: typeof a.dw === 'string' && /^\d{4}-\d\d-\d\d$/.test(a.dw) ? a.dw : '',
    wk: wkClean429(a.wk) // v4.29
  };
}


export function v416Clean(p) {
  const o = V416_0();
  if (!p || typeof p !== 'object') return o;
  if (Number.isFinite(p.jdis)) o.jdis = Math.max(0, Math.min(4, Math.floor(p.jdis)));
  if (p.roam && typeof p.roam === 'object')
    ['raikou', 'entei', 'suicune'].forEach(id => {
      const r = p.roam[id];
      if (!r || typeof r !== 'object') return;
      o.roam[id] = {
        at: typeof r.at === 'string' && /^j[a-z0-9]{1,6}$/.test(r.at) ? r.at : 'j1',
        hp: Number.isFinite(r.hp) ? Math.max(0.05, Math.min(1, r.hp)) : 1,
        ok: r.ok ? 1 : 0,
        vu: Number.isFinite(r.vu) ? Math.max(0, Math.min(999, Math.floor(r.vu))) : 0
      };
    });
  if (p.herit && typeof p.herit === 'object') for (const b in p.herit) if (BY[b] && MV[p.herit[b]]) o.herit[b] = p.herit[b];
  if (Array.isArray(p.couple)) o.couple = [...new Set(p.couple.filter(id => BY[id]))].slice(0, 2);
  if (typeof p.tid === 'string' && /^[a-z0-9]{6,12}$/.test(p.tid)) o.tid = p.tid;
  if (Array.isArray(p.amis)) o.amis = p.amis.map(amiClean416).filter(Boolean).slice(0, 12);
  if (p.jour && typeof p.jour.d === 'string' && /^\d{4}-\d\d-\d\d$/.test(p.jour.d))
    o.jour = { d: p.jour.d, r: ['S', 'A', 'B'].includes(p.jour.r) ? p.jour.r : '', m: Number.isFinite(p.jour.m) ? Math.max(0, Math.min(99, Math.floor(p.jour.m))) : 0 };
  if (Number.isFinite(p.dom)) o.dom = Math.max(0, Math.min(9999, Math.floor(p.dom)));
  if (Number.isFinite(p.oeufs)) o.oeufs = Math.max(0, Math.min(9999, Math.floor(p.oeufs)));
  return o;
}


/** La prochaine étape de Johto : arènes et histoire mêlées. */
export function jNext416() {
  const J = PROFILE.johto || [],
    d = PROFILE.jdis || 0,
    T = JDIS[d];
  for (let i = 0; i < 8; i++) {
    if (T && T.jafter <= i && J.length >= T.jafter) return [T.k, `Néo-Dissonance · ${T.n}`];
    if (!J.includes(i)) return ['j' + (i + 1), `Johto · Arène ${JGYMS[i]}`];
  }
  if (T) return [T.k, `Néo-Dissonance · ${T.n}`];
  if (!PROFILE.jchamp) return ['jchamp', 'Maître de Johto'];
  return null;
}


export function lockJ416(k, D) {
  const J = (PROFILE.johto || []).length;
  if (D.jdis) {
    if (J < D.jafter) return `La Néo-Dissonance frappera après votre ${D.jafter}e badge de Johto.`;
    if ((PROFILE.jdis || 0) < D.jdis - 1) return 'Battez d’abord le combat précédent de la Néo-Dissonance.';
    return null;
  }
  if (D.roam) return roamActif416() ? null : 'Les bêtes légendaires dorment encore sous la Tour Cendrée.';
  if (D.jfinal && J >= 8 && (PROFILE.jdis || 0) < 4 && !PROFILE.jchamp) return 'Arrêtez d’abord Cobalt au Relais du Plateau.';
  return undefined; // les règles de la v4.15 s’appliquent
}


export function chapJ416(k) {
  const D = SCEN[k];
  if (!D) return null;
  if (D.jdis) {
    const T = JDIS[D.jdis - 1];
    return { c: `Johto · Néo-Dissonance ${D.jdis} / 4`, t: T.lieu, who: T.who, L: T.L };
  }
  if (D.roam) {
    const L = roamLeg416(D.roam);
    return { c: 'Johto · Bête errante', t: `${L.n}, ${L.title}`, who: L.n, L: roamL416(D.roam) };
  }
  return null;
}


/** Sous la description d’un lieu : récompenses de l’histoire, état d’une bête errante. */
export function extraLine416(k) {
  const D = SCEN[k];
  if (D.jdis) {
    const T = JDIS[D.jdis - 1];
    if ((PROFILE.jdis || 0) >= D.jdis) return ''; // déjà vaincu : pas de seconde prime
    return `<div class="v4-rew"><span><span class="v4-coin" aria-hidden="true">₽</span>+${fmt(T.rew[0])}</span><span><span class="v4-gemi"><svg><use href="#i-gem"/></svg></span>+${T.rew[1]}</span></div>`;
  }
  if (D.roam) {
    const r = roamEtat416(D.roam),
      it = TALIS[D.roam];
    return `<div class="v4-rew"><span class="v4-rew-b rm-hp"><i style="width:${Math.round((r.hp || 1) * 100)}%"></i>PV ${Math.round((r.hp || 1) * 100)} %${r.vu ? ` · vu ${r.vu} fois` : ''}</span><span><img src="${ITM(HELD_IMG[it])}" alt="" loading="lazy">${ITEMS2[it].n}</span><span><span class="v4-gemi"><svg><use href="#i-gem"/></svg></span>+12</span></div>`;
  }
  return '';
}


export function leadJ416(sc) {
  const D = SCEN[sc];
  if (!D) return null;
  if (D.jdis) return JDIS[D.jdis - 1].L;
  if (D.roam) return roamL416(D.roam);
  return null;
}


/* ---------- règles des combats de l’histoire ---------- */
export function jdSetup416(S, r, ev) {
  if (r === 'jbrouille') say(ev, 'Brouilleur : en fin de manche, votre Pokémon le plus chargé perd 1 losange.');
  if (r === 'jcendre') say(ev, 'Tour Cendrée : chaque manche, deux cases prennent feu.');
  if (r === 'jonde') say(ev, 'Antenne Rouge : à la fin des manches 1 et 3, les Pokémon de Cobalt évoluent de force.');
  if (r === 'jmauvaise') say(ev, 'Relais de Mauvaise Onde : les notes de Résonance s’effacent en fin de manche.');
  if (r === 'jroam') roamSetup416(S, ev);
  hSetup419(S, r, ev); // arènes de Hoenn (v4.19)
  if (r === 'jdom') domSetup416(S, ev);
}


export function jdTick416(S, r, ev) {
  if (S.over) return;
  const R = S.round,
    es = S.units.filter(u => u.side === 'e' && !u.ko),
    al = S.units.filter(u => u.side === 'a' && !u.ko);
  if (r === 'jbrouille') {
    const u = al.filter(a => (a.en || 0) > 0).sort((a, b) => b.en - a.en)[0];
    if (u) {
      u.en = Math.max(0, u.en - 1);
      say(ev, `Brouilleur : ${u.n} perd 1 losange.`);
    }
  }
  if (r === 'jcendre') {
    const libres = Object.keys(S.tiles).filter(k => {
      const t = S.tiles[k],
        c = P(k)[0];
      return c >= 2 && c <= 5 && !t.rock && !t.w && !(t.mark && t.mark.k === 'brulant');
    });
    let n = 0;
    for (let i = 0; i < 2 && libres.length; i++) {
      const k = libres.splice(Math.floor(Math.random() * libres.length), 1)[0];
      setMark(S, k, 'brulant', null);
      n++;
    }
    if (n) {
      say(ev, `Tour Cendrée : ${n} case${n > 1 ? 's prennent' : ' prend'} feu.`);
      ev.push({ e: 'arena', r });
    }
  }
  if (r === 'jonde' && (R === 2 || R === 4)) {
    let n = 0;
    es.forEach(e => {
      if (e.seg || e.colosse || !hasNx(e)) return;
      const id = nextId(S, e);
      if (!id) return;
      transform(S, e, id, ev);
      n++;
    });
    say(ev, n ? `Antenne Rouge : ${n} Pokémon de Cobalt évoluent de force !` : 'Antenne Rouge : plus rien à faire évoluer.');
  }
  if (r === 'jmauvaise') {
    const n = es.filter(e => e.notes).length;
    es.forEach(e => (e.notes = null));
    if (n) say(ev, `Mauvaise Onde : ${n} note${n > 1 ? 's' : ''} de Résonance effacée${n > 1 ? 's' : ''}.`);
  }
  if (r === 'jdom') domTick416(S, ev);
  hTick419(S, r, ev); // arènes de Hoenn (v4.19)
}


export function roamEtat416(id) {
  PROFILE.roam = PROFILE.roam || {};
  if (!PROFILE.roam[id]) PROFILE.roam[id] = { at: ROAM_H[(ROAM.indexOf(id) * 3 + 2) % ROAM_H.length], hp: 1, ok: 0, vu: 0 };
  return PROFILE.roam[id];
}


function roamBouger416() {
  ROAM.forEach(id => {
    const r = roamEtat416(id);
    if (r.ok) return;
    const pris = ROAM.filter(x => x !== id).map(x => roamEtat416(x).at),
      pool = ROAM_H.filter(h => h !== r.at && !pris.includes(h));
    if (pool.length) r.at = pool[Math.floor(Math.random() * pool.length)];
  });
}


export function roamPlaces416() {
  if (!roamActif416()) return [];
  const pris = [];
  return ROAM.filter(id => !roamOk416(id)).map(id => {
    const h = PL[roamEtat416(id).at] || PL.j1,
      L = roamLeg416(id),
      [x, y] = roamPos416(h, pris), // v4.16.1 : la place la plus dégagée
      p = {
        id: 'r' + id,
        x,
        y,
        n: L.n,
        s: `Bête errante · près ${deLieu417(placeName(h))}`,
        grp: 'route',
        j: 1,
        roam: id
      };
    PL[p.id] = p;
    pris.push(p);
    return p;
  });
}


function roamSetup416(S, ev) {
  const D = SCEN[S.sc] || {},
    u = S.units.find(e => e.side === 'e' && e.id === D.roam);
  S.lim = D.fuite || 4;
  if (!u) return;
  const r = roamEtat416(D.roam);
  if (r.ok) return void say(ev, `${u.n} accepte un combat amical. Il s’enfuira au bout de ${S.lim} manches.`); // déjà apaisé : une revanche, sans prime
  u.hp = Math.max(1, Math.round(u.mhp * (r.hp || 1)));
  say(ev, r.hp < 1 ? `${u.n} porte encore les traces de votre dernière rencontre (${Math.round(r.hp * 100)} % de ses PV).` : `${u.n} vous a repéré. Il s’enfuira au bout de ${S.lim} manches.`);
}


export function domTirage416(id) {
  if (isCamp() && BADGES.length < 2 && !regionJ415()) return false;
  return Math.random() < (TOD === 'nuit' ? 0.1 : 0.07) * (id && id === domJour417() ? 3 : 1); // Dominant signalé (v4.17)
}


export function dom416(D, id, shiny) {
  const m = BY[id],
    voisins = RECRUIT.filter(x => x.id !== id && x.t.some(t => m.t.includes(t)) && regFam421(x.id) === regionNo421()), // escorte de la région (v4.21)
    proches = RECRUIT.filter(x => x.id !== id && regFam421(x.id) === regionNo421()),
    pool = voisins.length ? voisins : proches.length ? proches : RECRUIT.filter(x => x.id !== id),
    a = pool[Math.floor(Math.random() * pool.length)];
  Object.assign(D, {
    dom: true,
    rule: 'jdom',
    lim: 9,
    lvl: D.lvl.replace('rencontre', 'Dominant'),
    d: `Un ${m.n} Dominant, plus grand et plus fort que les autres, escorté par un ${a.n}. Son aura le blinde au début du combat puis toutes les 2 manches. Battu ou capturé, il laisse un trésor rare.`,
    foes: [
      [id, [6, 2], Object.assign({ boss: true, hb: D.hb * 2 + 12, pb: D.pb + 2 }, shiny ? { shiny: true } : {})],
      [a.id, [7, 4]]
    ]
  });
  return D;
}


function domSetup416(S, ev) {
  const u = S.units.find(e => e.side === 'e' && e.uid === 'e0');
  if (!u) return;
  u.dom = true;
  u.guard = Math.max(u.guard, 2);
  say(ev, `Aura du Dominant : ${u.n} est blindé (+2 Garde).`);
}


function domTick416(S, ev) {
  const u = S.units.find(e => e.dom && !e.ko);
  if (!u || S.round % 2 !== 1) return;
  u.guard = Math.max(u.guard, 2);
  u.boost = Math.max(u.boost || 0, 1);
  say(ev, `Aura du Dominant : ${u.n} se blinde et se renforce.`);
}


function domRecompense416(rew) {
  const r = Math.random(),
    o = { g: 2 };
  const cts = Object.keys(MACHINES).filter(k => SHOP[k] && !MACHINES[k].cs),
    neuves = cts.filter(k => !bagN(k)),
    held = Object.keys(HELD_SHOP).filter(k => HELD_SHOP[k].p && !PROFILE.items.includes(k));
  if (r < 0.45 && cts.length) {
    const L = neuves.length ? neuves : cts,
      k = L[Math.floor(Math.random() * L.length)];
    PROFILE.bag[k] = Math.min(99, bagN(k) + 1);
    o.ct = k;
  } else if (r < 0.7 && isCamp() && held.length) {
    const k = held[Math.floor(Math.random() * held.length)];
    PROFILE.items.push(k);
    o.item = k;
  } else {
    o.g += 4;
    o.m = 800;
  }
  rew.dom = o;
  PROFILE.dom = (PROFILE.dom || 0) + 1;
  return [o.m || 0, o.g];
}


function compatibles416(a, b) {
  if (!BY[a] || !BY[b] || a === b) return false;
  if (a === 'metamorph' || b === 'metamorph') return a !== b;
  return BY[a].t.some(t => BY[b].t.includes(t));
}


/** La mère donne la famille ; avec Métamorph, c’est l’autre parent. */
function parents416() {
  const c = couple416();
  if (c.length < 2 || !compatibles416(c[0], c[1])) return null;
  const mere = c[0] === 'metamorph' ? c[1] : c[0],
    pere = mere === c[0] ? c[1] : c[0];
  return { mere, pere, meta: c.includes('metamorph') };
}


function ligne416(b) {
  return MON.filter(m => m.base === b);
}


function heritable416(mere, pere) {
  if (pere === 'metamorph') return [];
  const deja = new Set(ligne416(mere).flatMap(m => m.mv));
  return [...new Set(ligne416(pere).flatMap(m => m.mv))].filter(k => MV[k] && MV[k].p > 0 && !MV[k].sig && !MV[k].xp && !deja.has(k));
}


/** Un œuf du couple : renvoie vrai s’il a éclos. */
export function pension416(rew) {
  const P2 = parents416();
  if (!P2) return false;
  const { mere, pere, meta } = P2,
    L = heritable416(mere, pere),
    mv = L.length ? L[Math.floor(Math.random() * L.length)] : null,
    ch = Math.min(0.75, (1 / 16) * multChroma() * (meta ? 2 : 1)),
    sh = Math.random() < ch;
  if (mv) PROFILE.herit[mere] = mv;
  if (sh && !PROFILE.shiny.includes(mere)) PROFILE.shiny.push(mere);
  if (!PROFILE.dex.includes(mere)) PROFILE.dex.push(mere);
  PROFILE.camp.oeuf = 0;
  PROFILE.oeufs = (PROFILE.oeufs || 0) + 1;
  rew.oeuf416 = { id: mere, pere, mv, sh };
  return true;
}


export function heritage416(b) {
  const k = b && PROFILE.herit && PROFILE.herit[b];
  if (!k || !MV[k]) return '';
  return `<div class="mvc ct-mvc her-mvc"><div class="t"><b>${MV[k].n}</b><span class="chip">Héritée</span></div><p>${MV[k].t} · ${MV[k].p ? 'Puissance ' + MV[k].p + ' · ' : ''}${MV[k].d || ''} Capacité transmise à la Pension.</p></div>`;
}


// la Pension du Camp de base est rendue par React : src/screens/camp/CampBase.jsx


/* choix du couple de la Pension : rendu par React (src/screens/overlays/PensBox.jsx) */
function renderPensBox() {
  const dispo = PROFILE.box.filter(id => BY[id] && !squad.some(s => BY[s].base === id) && !enExpedition(id) && !(typeof estTombe === 'function' && estTombe(id)));
  const ok = PENS_SEL.length === 2 && compatibles416(PENS_SEL[0], PENS_SEL[1]);
  paintOverlay('pens', {
    ok,
    L: dispo.map(id => {
      const i = PENS_SEL.indexOf(id);
      return { id, i, cp: PENS_SEL.length === 1 && i < 0 ? compatibles416(PENS_SEL[0], id) : null };
    })
  });
}


function duoGen416(x, y) {
  const k = pairKey(x, y);
  if (DUOG416[k]) return DUOG416[k];
  const a = BY[x],
    b = BY[y];
  if (!a || !b || x === y) return null;
  // on cherche d’abord un vrai enchaînement : une marque, puis le type qui la fait réagir
  const reagit = (mk, t) => {
    const i = EL.indexOf(t),
      id = MX[mk] && i >= 0 ? MX[mk][i] : null;
    return !!id && id !== 'ren';
  };
  let A = null,
    Bm = null,
    tA = null,
    tB = null;
  for (const [X, Y] of [
    [a, b],
    [b, a]
  ])
    for (const tx of X.t)
      for (const ty of Y.t)
        if (!A && MARK_T416[tx] && reagit(MARK_T416[tx], ty)) [A, Bm, tA, tB] = [X, Y, tx, ty];
  if (!A) {
    const mk = m => m.t.find(t => MARK_T416[t]);
    [A, Bm] = !mk(a) && mk(b) ? [b, a] : [a, b];
    tA = mk(A) || A.t[0];
    tB = Bm.t.find(t => t !== tA) || Bm.t[0];
  }
  const m = MARK_T416[tA] || null,
    n = tA === tB ? `Double ${DUO_N416[tA] || 'Assaut'}` : `${DUO_N416[tA] || 'Assaut'} ${DUO_DE416[tB] || 'combiné'}`;
  return (DUOG416[k] = {
    n,
    first: A.id,
    r: 3,
    gen: true,
    d: m ? `${A.n} rend la zone ${MARK_N416[m]}, ${Bm.n} frappe aussitôt dedans.` : `${A.n} ouvre une brèche, ${Bm.n} s’y engouffre.`,
    a: Object.assign({ n, t: tA, p: m ? 4 : 6, r: 3, sh: 'area' }, m ? { mk: m } : {}),
    b: { n, t: tB, p: 8, r: 4, sh: 'one' }
  });
}


export function duoDe416(k) {
  if (DUOT[k]) return DUOT[k];
  const [x, y] = String(k).split('|');
  return duoGen416(x, y);
}


/** Le Guide : les techniques fixes, puis celles de vos duos les plus avancés. */
export function duosListe416() {
  const o = Object.assign({}, DUOT);
  try {
    Object.entries(PROFILE.links || {})
    .filter(([k, v]) => !DUOT[k] && lvlOfPts(v) >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .forEach(([k]) => {
      const D = duoDe416(k);
      if (D) o[k] = D;
    });
  } catch (e) {} // appelé dès le chargement, avant ce module
  return o;
}


function monEtat416() {
  return {
    b: BADGES.length,
    j: (PROFILE.johto || []).length,
    e: Math.min(5, PROFILE.elite || 0),
    c: PROFILE.jchamp ? 1 : 0,
    d: famOwned(),
    tb: (PROFILE.tdr && PROFILE.tdr.best) || 0,
    sh: (PROFILE.shiny || []).length,
    w: PROFILE.wins || 0,
    m: isCamp() ? 1 : 0
  };
}


export function hash416(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0).toString(36).slice(-4).padStart(4, '0');
}


function carteCode416() {
  if (!PROFILE.tid) PROFILE.tid = (Math.random().toString(36).slice(2) + Date.now().toString(36)).replace(/[^a-z0-9]/g, '').slice(0, 10);
  const T = squad.slice(0, 4).map(id => {
    const b = BY[id].base,
      it = PROFILE.equip[b];
    return [id, PROFILE.apprises[b] || 0, it && ownedItems().includes(it) ? it : 0, isShinyOwned(b) ? 1 : 0, (PROFILE.herit || {})[b] || 0];
  });
  const o = {
    v: 1,
    id: PROFILE.tid,
    n: PROFILE.name || 'Dresseur',
    t: T,
    s: monEtat416(),
    jr: PROFILE.jour && PROFILE.jour.d === today() ? PROFILE.jour : null,
    dt: today(),
    wk: monHebdo429() // défi de la semaine (v4.29)
  };
  const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(o))))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return `RES-${b64}-${hash416(b64)}`;
}


function lireCode416(txt) {
  const m = String(txt || '')
    .replace(/\s+/g, '')
    .match(/RES-([A-Za-z0-9_-]+)-([a-z0-9]{4})/);
  if (!m) return { err: 'Aucun code de dresseur reconnu. Il commence par « RES- ».' };
  if (hash416(m[1]) !== m[2]) return { err: 'Ce code est incomplet ou abîmé. Demandez à votre ami de le renvoyer.' };
  try {
    const b = m[1].replace(/-/g, '+').replace(/_/g, '/'),
      o = JSON.parse(decodeURIComponent(escape(atob(b + '==='.slice((b.length + 3) % 4)))));
    const a = amiClean416(o);
    if (!a) return { err: 'Ce code ne contient pas d’équipe utilisable.' };
    return { a };
  } catch (e) {
    return { err: 'Ce code est illisible.' };
  }
}


function ajouterAmi416(txt) {
  const r = lireCode416(txt);
  if (r.err) return r.err;
  const a = r.a;
  if (a.id === PROFILE.tid) return 'C’est votre propre carte : partagez-la plutôt à vos amis !';
  PROFILE.amis = PROFILE.amis || [];
  const i = PROFILE.amis.findIndex(x => x.id === a.id);
  if (i >= 0) {
    const o = PROFILE.amis[i];
    PROFILE.amis[i] = Object.assign(a, { w: o.w, l: o.l, dw: o.dw });
    queueSave();
    return `Carte de ${a.n} mise à jour.`;
  }
  if (PROFILE.amis.length >= 12) return 'Votre carnet est plein (12 amis). Retirez-en un d’abord.';
  PROFILE.amis.push(a);
  queueSave();
  return `${a.n} rejoint vos défis entre amis !`;
}


export function amiBuild416(i) {
  const A = (PROFILE.amis || [])[i];
  if (!A) return false;
  const s = A.s,
    pw = s.b + s.j + s.e + (s.c ? 2 : 0);
  SCEN.ami = {
    n: `Défi · ${A.n}`,
    lvl: `Défi entre amis · ${A.n}`,
    lim: 10,
    time: i % 2 ? 'nuit' : 'jour',
    bio: 'arene',
    ami: i + 1,
    at: BY[A.t[0][0]].t[0],
    water: ['4,0'],
    rock: ['3,2', '4,4'],
    hb: 4 + Math.round(pw * 1.3),
    pb: Math.min(5, Math.floor(pw / 5)),
    lv: Math.min(64, 18 + pw * 2),
    d: `L’équipe de ${A.n}, telle qu’elle était sur sa carte${A.dt ? ' du ' + A.dt.split('-').reverse().join('/') : ''}. L’ordinateur la joue comme un vrai dresseur : capacités apprises, objets tenus, Résonance et attaques Expertes compris.`,
    foes: A.t.map((x, j) => (x[3] ? [x[0], AMI_POS[j], { shiny: true }] : [x[0], AMI_POS[j]]))
  };
  OBST.ami = {};
  return true;
}


function amiFight416(i) {
  if (!amiBuild416(i)) return;
  if (B) backToPrep();
  goFight('ami');
}


/** Défis entre amis de l'Accueil (#v4Amis, rendu : src/screens/accueil/Amis.jsx). */
export function amisData416() {
  const L = PROFILE.amis || [],
    moi = { n: PROFILE.name || 'Vous', s: monEtat416(), jr: PROFILE.jour && PROFILE.jour.d === today() ? PROFILE.jour : null, me: true },
    rows = [moi, ...L].map(a => Object.assign({ sc: scoreDe416(a.s) }, a)).sort((a, b) => b.sc - a.sc);
  const jour = a => (a.jr && a.jr.d === today() ? `✓${a.jr.r ? ' ' + a.jr.r : ''}${a.jr.m ? ' · ' + a.jr.m + ' m.' : ''}` : '—');
  return { L, rows, jour, del: AMI_DEL };
}


export function renderAmis416() {
  refreshAccueil();
}


/* carte de dresseur / ajout d’un ami : rendu par React (src/screens/overlays/AmiBox.jsx) */
function renderAmiBox() {
  if (AMI_MODE === 'carte')
    paintOverlay('ami', {
      mode: 'carte',
      nom: PROFILE.name || '',
      code: squad.length ? carteCode416() : '',
      equipe: squad.slice(0, 4).map(id => BY[id].n),
      partage: !!navigator.share
    });
  else if (AMI_MODE === 'ajout') paintOverlay('ami', { mode: 'ajout' });
}


async function copier416() {
  const ta = $('#amiCode');
  if (!ta) return;
  const txt = ta.value;
  try {
    await navigator.clipboard.writeText(txt);
    toast('Code copié : collez-le dans un message à vos amis.');
    return;
  } catch (e) {}
  try {
    ta.focus();
    ta.select();
    ta.setSelectionRange(0, txt.length);
    if (document.execCommand('copy')) {
      toast('Code copié : collez-le dans un message à vos amis.');
      return;
    }
  } catch (e) {}
  toast('Le code est sélectionné : appuyez longuement dessus pour le copier.');
}

// Instructions exécutées au démarrage, dans l'ordre d'origine (voir index.js).
export function __init() {

/* ---------- icônes originales ---------- */
SVGI416 = s => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">' + s + '</svg>');


Object.assign(ICO414, {
  'crin-orage': SVGI416(
    '<path d="M7 36c7-11 15-15 28-17" stroke="#2f3366" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M7 36c7-11 15-15 28-17" stroke="#9aa2e6" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="M28 5 17 25h8l-4 18 15-23h-8l5-15Z" fill="#ffd94a" stroke="#86650f" stroke-width="2" stroke-linejoin="round"/>'
  ),
  'braise-sacree': SVGI416(
    '<path d="M24 4c3 8 13 12 13 25a13 13 0 0 1-26 0c0-7 4-11 7-13 0 4 2 7 4 7 0-8-2-12 2-19Z" fill="#f2672e" stroke="#7a2412" stroke-width="2" stroke-linejoin="round"/><path d="M24 22c2 4 6 6 6 11a6 6 0 0 1-12 0c0-3 2-5 3-6 0 2 1 3 2 3 0-3 0-5 1-8Z" fill="#ffd34d"/>'
  ),
  'cristal-boreal': SVGI416(
    '<path d="M24 3 36 18 24 45 12 18Z" fill="#8fe3ff" stroke="#1f5d86" stroke-width="2" stroke-linejoin="round"/><path d="M24 3v42M12 18h24" stroke="#1f5d86" stroke-width="1.5" opacity=".6"/><path d="M24 3 30 18 24 45" fill="#d8f6ff" opacity=".7"/><path d="M38 6l1.5 3.5L43 11l-3.5 1.5L38 16l-1.5-3.5L33 11l3.5-1.5z" fill="#fff"/>'
  ),
  oeuf: SVGI416(
    '<path d="M24 5c9 0 15 14 15 23a15 15 0 0 1-30 0C9 19 15 5 24 5Z" fill="#fff6e0" stroke="#8b6b3d" stroke-width="2"/><circle cx="18" cy="22" r="4" fill="#7ac74c"/><circle cx="30" cy="31" r="5" fill="#7ac74c"/><circle cx="27" cy="14" r="2.5" fill="#7ac74c"/>'
  )
});


CROWN416 = '<svg class="dom-cr" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 18 4.5 7l5 5L12 4l2.5 8 5-5L21 18Z" fill="currentColor"/><path d="M3 20h18" stroke="currentColor" stroke-width="2"/></svg>';


/* =====================================================================
   1. L’histoire de Johto : la Néo-Dissonance
   ===================================================================== */
JDIS = [
  {
    k: 'jd1',
    jafter: 2,
    lieu: 'Puits aux Ondes',
    x: 300,
    y: 455,
    n: 'Sbires de la Néo-Dissonance',
    who: 'Les Sbires',
    pl: true,
    t: 'la Néo-Dissonance, aux ordres de Cobalt',
    rule: 'jbrouille',
    lv: 49,
    hb: 26,
    pb: 4,
    time: 'nuit',
    bio: 'gue',
    at: 'Ténèbres',
    water: ['4,0', '5,0'],
    rock: ['3,3'],
    foes: [
      ['nosferalto', [6, 1]],
      ['demolosse', [6, 3]],
      ['migalos', [6, 5]],
      ['noctali', [7, 2]]
    ],
    rew: [1800, 6],
    q: 'La Dissonance, dissoute ? Elle a juste changé de chef. Cobalt nous a promis une Résonance qui obéit.',
    w: 'Les balises sont grillées… Cobalt va devoir tout recommencer.',
    l: 'Bzzz. Plus de losanges, plus de Résonance. Simple.',
    d: 'Des Sbires en uniforme gris et rouge plantent des balises dans les herbes. Leur brouilleur aspire la Résonance : en fin de manche, votre Pokémon le plus chargé perd 1 losange.'
  },
  {
    k: 'jd2',
    jafter: 4,
    lieu: 'Tour Cendrée',
    x: 300,
    y: 190,
    n: 'Admin Vesper',
    who: 'Vesper',
    t: 'Admin de la Néo-Dissonance, la voix de l’ombre',
    rule: 'jcendre',
    mut: 'eclipse',
    lv: 53,
    hb: 30,
    pb: 5,
    time: 'nuit',
    bio: 'tour',
    at: 'Spectre',
    water: [],
    rock: ['3,1', '3,4'],
    foes: [
      ['ectoplasma', [6, 2]],
      ['demolosse', [7, 1]],
      ['noctali', [6, 4]],
      ['nostenfer', [7, 3]]
    ],
    rew: [2600, 8],
    q: 'Orphée nous avait dissous. Cobalt m’a rappelée. Je ne sais plus qui a raison… mais je sais encore me battre.',
    w: 'Les flammes… Trois ombres se sont réveillées sous la tour, et elles fuient à travers Johto. Ce n’est pas ce que je voulais.',
    l: 'Le feu et la nuit. Rien d’autre.',
    d: 'Vesper a mis le feu à la vieille tour pour couvrir la fuite de la Néo-Dissonance. Éclipse : Spectre et Ténèbres frappent plus fort, vos tirs portent moins loin. Chaque manche, deux cases prennent feu.'
  },
  {
    k: 'jd3',
    jafter: 6,
    lieu: 'Antenne Rouge',
    x: 515,
    y: 160,
    n: 'Admin Cobalt',
    who: 'Cobalt',
    t: 'l’ingénieur, chef de la Néo-Dissonance',
    rule: 'jonde',
    lv: 55,
    hb: 22,
    pb: 4,
    time: 'jour',
    bio: 'ligue',
    at: 'Électrik',
    water: ['5,0', '5,5'],
    rock: ['3,2'],
    foes: [
      ['magneti', [6, 1]],
      ['embrylex', [6, 3]],
      ['minidraco', [6, 5]],
      ['loupio', [7, 2]]
    ],
    rew: [3200, 10],
    q: 'L’Éveil ? Un caprice. Avec mon antenne, plus besoin de lien : ils évoluent quand JE le décide.',
    w: 'L’antenne grésille… Qu’importe. Le Relais est prêt. Rendez-vous au pied du Plateau.',
    l: 'Voilà ce qu’est une évolution maîtrisée.',
    d: 'L’Antenne Rouge force les Pokémon de Cobalt à évoluer : à la fin des manches 1 et 3, tous ceux qui le peuvent évoluent d’un coup. Frappez avant qu’ils ne grandissent.'
  },
  {
    k: 'jd4',
    jafter: 8,
    lieu: 'Relais du Plateau',
    x: 770,
    y: 290,
    n: 'Cobalt, le Relais',
    who: 'Cobalt',
    t: 'chef de la Néo-Dissonance',
    rule: 'jmauvaise',
    lv: 60,
    hb: 46,
    pb: 8,
    time: 'nuit',
    bio: 'arene',
    at: 'Acier',
    water: ['4,0', '4,5'],
    rock: ['3,2', '3,3'],
    foes: [
      ['steelix', [6, 2], { boss: true, hb: 80, pb: 8 }],
      ['magneton', [7, 1]],
      ['scarhino', [6, 4]],
      ['migalos', [7, 3]]
    ],
    rew: [4500, 16],
    q: 'Orphée a choisi le silence. Moi, je choisis le contrôle. Ta Résonance s’arrête ici, dans mon brouillage.',
    w: 'Orphée Valcourt surgit et coupe le Relais : « C’est fini, Cobalt. » La Néo-Dissonance se tait pour de bon.',
    l: 'Plus de notes, plus de Résonance. Juste du bruit.',
    d: 'Le Relais brouille la Résonance : en fin de manche, toutes les notes posées sur les adversaires s’effacent. Enchaînez vos coups dans la même manche.'
  }
].filter(T => T.foes.every(([id]) => BY[id]));


JDIS.forEach((T, i) => {
  T.L = { n: T.who, t: T.t, q: T.q, w: T.w, l: T.l };
  SCEN[T.k] = {
    n: T.n,
    lvl: `Néo-Dissonance · combat ${i + 1} sur 4`,
    lim: 11,
    time: T.time,
    bio: T.bio,
    jdis: i + 1,
    jafter: T.jafter,
    style: i === 3 ? 'boss' : null,
    at: T.at,
    mut: T.mut || null,
    rule: T.rule,
    water: T.water,
    rock: T.rock,
    hb: T.hb,
    pb: T.pb,
    lv: T.lv,
    d: T.d,
    foes: T.foes
  };
  OBST[T.k] = i === 0 ? { grass: ['2,2', '3,2', '2,3'] } : {};
  PLACES_J.push({ id: T.k, x: T.x, y: T.y, n: T.lieu, s: `Néo-Dissonance · ${T.who}`, grp: 'aventure', j: 1 });
});


JCHAIN.splice(JCHAIN.indexOf('j3'), 0, 'jd1');


JCHAIN.splice(JCHAIN.indexOf('j5'), 0, 'jd2');


JCHAIN.splice(JCHAIN.indexOf('j7'), 0, 'jd3');


JCHAIN.splice(JCHAIN.indexOf('jchamp'), 0, 'jd4');


PLACES_J.forEach(p => (PL[p.id] = p));


jdisDe = k => JDIS.find(T => T.k === k) || null;


/* =====================================================================
   2. Les bêtes errantes
   ===================================================================== */
ROAM = ['raikou', 'entei', 'suicune'];


ROAM_H = ['j1', 'j2', 'j3', 'j4', 'j5', 'j6', 'j7', 'j8', 'jwild', 'jlac'];


TALIS = { raikou: 'crinorage', entei: 'braisesacree', suicune: 'cristalboreal' };


Object.assign(ITEMS2, {
  crinorage: { n: 'Crin d’Orage', d: 'Talisman de Raikou : +1 Mouvement et +1 Puissance sur toutes ses attaques.', i: 'M13 2 5 14h6l-2 8 8-12h-6l2-8Z' },
  braisesacree: {
    n: 'Braise Sacrée',
    d: 'Talisman d’Entei : +20 % de dégâts tant qu’il a plus de la moitié de ses PV.',
    i: 'M12 2c1.5 4 6.5 6 6.5 12.5a6.5 6.5 0 0 1-13 0c0-3.5 2-5.5 3.5-6.5 0 2 1 3.5 2 3.5 0-4-1-6 1-9.5Z'
  },
  cristalboreal: { n: 'Cristal Boréal', d: 'Talisman de Suicune : en fin de manche, il récupère 8 % de ses PV max et se libère de la brûlure.', i: 'M12 2l6 7-6 13-6-13Z' }
});


Object.assign(HELD_IMG, { crinorage: 'crin-orage', braisesacree: 'braise-sacree', cristalboreal: 'cristal-boreal' });


roamLeg416 = id => LEGS.find(L => L.id === id);


roamL416 = id => {
  const L = roamLeg416(id);
  return { n: L.n, t: L.title, q: L.q, w: L.w, l: 'Il s’est enfui avant que vous ne puissiez l’apaiser.' };
};


roamActif416 = () => johtoOuvert() && (!isCamp() || (PROFILE.jdis || 0) >= 2);


roamOk416 = id => !!(PROFILE.roam && PROFILE.roam[id] && PROFILE.roam[id].ok);


ROAM.forEach(id => {
  const L = roamLeg416(id);
  if (!L) return;
  SCEN['r' + id] = {
    n: `${L.n} errant`,
    lvl: `Johto · ${L.title}`,
    lim: 10,
    fuite: 4,
    time: L.time,
    bio: L.bio,
    at: L.t[0],
    roam: id,
    rule: 'jroam',
    style: 'boss',
    water: L.water,
    rock: L.rock,
    hb: 30,
    pb: 5,
    lv: 56,
    d: `${L.n} rôde dans Johto. Il s’enfuit au bout de 4 manches, mais ses blessures restent d’une rencontre à l’autre : usez-le, retrouvez-le sur la carte, puis apaisez-le (PV à 0). Il laisse alors son talisman. Comme toutes les légendes, il ne se recrute pas.`,
    foes: [[id, [6, 2], { boss: true, hb: 320, pb: 8 }]]
  };
  OBST['r' + id] = { pil: ['4,0', '4,5'] };
});


fuiteMsg416 = S => {
  const D = SCEN[S.sc] || {},
    L = D.roam && roamLeg416(D.roam);
  return `${L ? L.n : 'La bête'} bondit hors du plateau et disparaît : il s’est enfui !`;
};


/* effets des talismans */
FOURNISSEURS_DEGATS.push({ id: 'braisesacree', fournir: (c, { u }) => u.item === 'braisesacree' && u.hp > u.mhp / 2 && { mul: 1.2, libelle: 'Braise Sacrée' } });


CROCHETS.avantFinManche.push((S, ev) => {
  S.units.forEach(u => {
    if (u.ko || u.item !== 'cristalboreal') return;
    if (u.bru) u.bru = 0;
    if (u.hp < u.mhp) heal(S, u, Math.max(1, Math.round(u.mhp * 0.08)), ev);
  });
});


/* =====================================================================
   3. Les Pokémon Dominants
   ===================================================================== */
wildDom416 = false;


/* =====================================================================
   4. La Pension, en couple
   ===================================================================== */
couple416 = () => (campOk430() ? (PROFILE.couple || []).filter(id => PROFILE.box.includes(id)) : []);


enPension416 = id => !!(campOk430() && BY[id] && couple416().includes(BY[id].base));


// #pensBox : rendu par React (src/screens/overlays/PensBox.jsx)


PENS_SEL = [];


/* =====================================================================
   5. Les Liens : une technique combinée pour chaque duo
   ===================================================================== */
Object.assign(DUOT, {
  'loupio|marill': {
    n: 'Abysse Lumineux',
    first: 'marill',
    r: 3,
    d: 'Marill inonde la zone, Loupio y allume ses lanternes électriques.',
    a: { n: 'Abysse Lumineux', t: 'Eau', p: 4, r: 3, sh: 'area', mk: 'trempe' },
    b: { n: 'Abysse Lumineux', t: 'Électrik', p: 9, r: 4, sh: 'one' }
  },
  'axoloto|limagma': {
    n: 'Geyser Volcanique',
    first: 'axoloto',
    r: 3,
    d: 'Axoloto détrempe le sol, Limagma y verse sa lave : la vapeur jaillit.',
    a: { n: 'Geyser Volcanique', t: 'Eau', p: 4, r: 3, sh: 'area', mk: 'trempe' },
    b: { n: 'Geyser Volcanique', t: 'Feu', p: 9, r: 4, sh: 'one' }
  },
  'granivol|mimigal': {
    n: 'Spores Gluantes',
    first: 'granivol',
    r: 3,
    d: 'Granivol sème des racines, Mimigal y tisse une toile empoisonnée.',
    a: { n: 'Spores Gluantes', t: 'Plante', p: 3, r: 3, sh: 'area', mk: 'enracine' },
    b: { n: 'Spores Gluantes', t: 'Poison', p: 8, r: 4, sh: 'one', fx: 'toxweb' }
  },
  'hoothoot|natu': {
    n: 'Vision Nocturne',
    first: 'natu',
    r: 3,
    d: 'Natu voit l’avenir, Hoothoot fond sur la cible au bon moment.',
    a: { n: 'Vision Nocturne', t: 'Psy', p: 6, r: 3, sh: 'area' },
    b: { n: 'Vision Nocturne', t: 'Vol', p: 9, r: 4, sh: 'one', fx: 'sleep' }
  }
});


MARK_T416 = { Eau: 'trempe', Électrik: 'charge', Feu: 'brulant', Plante: 'enracine', Glace: 'givre', Sol: 'fissure' };


MARK_N416 = { trempe: 'Trempée', charge: 'Chargée', brulant: 'Brûlante', enracine: 'Enracinée', givre: 'Givrée', fissure: 'Fissurée' };


DUO_N416 = {
  Eau: 'Torrent',
  Feu: 'Brasier',
  Plante: 'Ronces',
  Électrik: 'Orage',
  Glace: 'Blizzard',
  Sol: 'Faille',
  Roche: 'Éboulis',
  Vol: 'Bourrasque',
  Psy: 'Mirage',
  Spectre: 'Hantise',
  Ténèbres: 'Nuit',
  Dragon: 'Rugissement',
  Combat: 'Assaut',
  Normal: 'Charge',
  Poison: 'Miasme',
  Insecte: 'Essaim',
  Acier: 'Lame',
  Fée: 'Halo'
};


DUO_DE416 = {
  Eau: 'd’écume',
  Feu: 'de feu',
  Plante: 'de lianes',
  Électrik: 'd’éclairs',
  Glace: 'de givre',
  Sol: 'de sable',
  Roche: 'de roc',
  Vol: 'de plumes',
  Psy: 'd’esprit',
  Spectre: 'd’ombre',
  Ténèbres: 'de ténèbres',
  Dragon: 'de dragon',
  Combat: 'de poings',
  Normal: 'de force',
  Poison: 'de venin',
  Insecte: 'd’élytres',
  Acier: 'd’acier',
  Fée: 'de fées'
};


DUOG416 = {};


/* =====================================================================
   6. Défis entre amis
   ===================================================================== */
scoreDe416 = s => s.b * 100 + s.j * 120 + s.e * 60 + s.c * 400 + s.d * 10 + s.tb * 25 + s.sh * 15;


AMI_POS = [
  [6, 1],
  [6, 3],
  [6, 5],
  [7, 2]
];


// une valeur sûre tant qu’aucun défi n’est lancé
SCEN.ami = Object.assign({}, SCEN.gue || SCEN.tuto, { n: 'Défi entre amis', ami: 0 });


/* ---------- branchements : création des combats ---------- */
CROCHETS.combat.push((S, opt, D0) => {
  if (S.fixe431) return; // combats à règles fixes (v4.31)
  D0 = D0 || SCEN[S.sc] || {};
  // capacité héritée (Pension)
  S.units.forEach(u => {
    if (u.side !== 'a') return;
    const k = (PROFILE.herit || {})[u.sp];
    if (k && MV[k]) {
      u.hm = k;
      if (!u.mv.includes(k)) u.mv.push(k);
    }
  });
  // talismans des bêtes errantes
  S.units.forEach(u => {
    if (u.item === 'crinorage') u.pb = (u.pb || 0) + 1;
  });
  // l’équipe d’un ami : ses capacités apprises et ses objets
  if (D0.ami) {
    const A = (PROFILE.amis || [])[D0.ami - 1];
    if (A)
      A.t.forEach((x, j) => {
        const u = S.units.find(e => e.uid === 'e' + j);
        if (!u) return;
        [x[1], x[4]].forEach(k => k && MV[k] && !u.mv.includes(k) && u.mv.push(k));
        if (x[1]) u.ctm = x[1];
        if (x[4]) u.hm = x[4];
        const it = x[2];
        if (it && ITEMS2[it]) {
          u.item = it;
          if (it === 'ceinture') u.belt = true;
          if (it === 'bandeau') u.pb = (u.pb || 0) + 2;
          if (it === 'crinorage') u.pb = (u.pb || 0) + 1;
          if (it === 'lentille' && (hasNx(u) || aXP(u))) u.en = 1;
        }
      });
  }
});


/* ---------- branchements : après le combat ---------- */
CROCHETS.progres.push((S, rew, win) => {
  const D = SCEN[S.sc] || {},
    o = [0, 0];
  // Défi du jour : votre résultat, pour le classement entre amis
  if (rew.daily) PROFILE.jour = { d: today(), r: S.rank || '', m: S.round };
  // Néo-Dissonance
  if (win && D.jdis && (PROFILE.jdis || 0) < D.jdis) {
    PROFILE.jdis = D.jdis;
    const T = JDIS[D.jdis - 1];
    o[0] += T.rew[0];
    o[1] += T.rew[1];
    rew.jdis = D.jdis;
  }
  // bête errante
  if (D.roam) {
    const r = roamEtat416(D.roam),
      u = S.units.find(e => e.side === 'e' && e.id === D.roam);
    r.vu = (r.vu || 0) + 1;
    if (r.ok) {
      // déjà apaisé : une revanche amicale, sans prime
    } else if (u && u.ko) {
      r.ok = 1;
      r.hp = 0.05;
      const it = TALIS[D.roam];
      if (it && !PROFILE.items.includes(it)) PROFILE.items.push(it);
      o[0] += 1500;
      o[1] += 12;
      rew.roam = { id: D.roam, ok: true, it };
    } else if (u) {
      r.hp = Math.max(0.05, u.hp / u.mhp);
      rew.roam = { id: D.roam, ok: false, hp: r.hp };
    }
  }
  if (roamActif416() && !(D.tuto || D.tower)) roamBouger416();
  // Dominant
  if (D.dom) {
    if (win) {
      const x = domRecompense416(rew);
      o[0] += x[0];
      o[1] += x[1];
    }
    // un Dominant ne se rejoue pas : « Rejouer » relance une rencontre ordinaire
    const f = D.foes[0];
    wildScen(f[0], S.time, !!(f[2] && f[2].shiny), false);
  }
  // défi entre amis
  if (D.ami) {
    const A = (PROFILE.amis || [])[D.ami - 1];
    if (A) {
      if (win) A.w = (A.w || 0) + 1;
      else A.l = (A.l || 0) + 1;
      const prem = win && A.dw !== today();
      if (prem) {
        A.dw = today();
        o[1] += 3;
      }
      rew.ami = { n: A.n, win, w: A.w, l: A.l, prem };
    }
  }
  return o[0] || o[1] ? o : null;
});


CROCHETS.resultat.push(r => {
  const o = [];
  if (r.jdis) {
    const T = JDIS[r.jdis - 1];
    o.push(
      `<div class="res-l"><h4>Néo-Dissonance</h4><div class="rl"><span>${T.who} ${T.pl ? 'sont battus' : 'est battu'} (${r.jdis} / 4). « ${T.w} »${r.jdis === 2 ? ' <b>Raikou, Entei et Suicune errent désormais sur la carte de Johto.</b>' : ''}${r.jdis === 4 ? ' <b>Le Plateau de Johto vous est ouvert.</b>' : ''}</span><b>${r.jdis} / 4</b></div></div>`
    );
  }
  if (r.roam) {
    const L = roamLeg416(r.roam.id);
    o.push(
      r.roam.ok
        ? `<div class="res-l"><h4>Bête errante</h4><div class="rl">${medal(L.t)}<span>${L.n} est apaisé. « ${L.w} » Il vous laisse son talisman : <b>${ITEMS2[r.roam.it].n}</b>.</span><b>✦</b></div></div>`
        : `<div class="res-l"><h4>Bête errante</h4><div class="rl">${medal(L.t)}<span>${L.n} s’est enfui avec ${Math.round(r.roam.hp * 100)} % de ses PV. Il garde ses blessures : retrouvez-le sur la carte de Johto.</span><b>${Math.round(r.roam.hp * 100)} %</b></div></div>`
    );
  }
  if (r.dom) {
    const x = r.dom;
    o.push(
      `<div class="res-l"><h4>Trésor du Dominant</h4><div class="rl"><span>${
        x.ct ? `${SHOP[x.ct].n} rejoint votre Sac` : x.item ? `${ITEMS2[x.item].n} rejoint votre Sac (objet tenu)` : `${fmt(x.m || 0)} ₽ et des Éclats`
      }</span><b>${CROWN416}</b></div></div>`
    );
  }
  if (r.oeuf416) {
    const x = r.oeuf416;
    o.push(
      `<div class="res-l"><h4>Pension</h4><div class="rl${x.sh ? ' shn' : ''}"${x.sh ? ` style="${shinyStyle(x.id)}"` : ''}>${medal(BY[x.id].t)}<span>Un œuf a éclos : un ${BY[x.id].n}${x.sh ? ' <b>chromatique</b>' : ''} !${x.mv ? ` Il hérite de <b>${MV[x.mv].n}</b> grâce à ${BY[x.pere].n}.` : ''}</span><b><img class="res-egg" src="${ITM('oeuf')}" alt=""></b></div></div>`
    );
  }
  if (r.ami)
    o.push(
      `<div class="res-l"><h4>Défi entre amis</h4><div class="rl"><span>${r.ami.win ? 'Victoire' : 'Défaite'} contre l’équipe de ${esc(r.ami.n)} · ${r.ami.w} victoire${r.ami.w > 1 ? 's' : ''}, ${r.ami.l} défaite${r.ami.l > 1 ? 's' : ''}${r.ami.prem ? ' · première victoire du jour : +3 Éclats' : ''}.</span><b>${r.ami.w}–${r.ami.l}</b></div></div>`
    );
  return o.join('');
});


/* ---------- succès ---------- */
SUCCES.push(
  { id: 'neodis', n: 'Onde coupée', d: 'Vaincre la Néo-Dissonance à Johto.', t: 'Briseur d’ondes', ok: () => (PROFILE.jdis || 0) >= 4, p: () => [PROFILE.jdis || 0, 4] },
  { id: 'betes', n: 'Trois bêtes', d: 'Apaiser Raikou, Entei et Suicune.', t: 'Ami des bêtes', ok: () => ROAM.every(roamOk416), p: () => [ROAM.filter(roamOk416).length, 3] },
  { id: 'dominant', n: 'Chasseur de Dominants', d: 'Vaincre 3 Pokémon Dominants.', t: 'Chasseur', ok: () => (PROFILE.dom || 0) >= 3, p: () => [Math.min(3, PROFILE.dom || 0), 3] },
  { id: 'eleveur', n: 'Éleveur', d: 'Faire éclore un œuf de couple à la Pension.', t: 'Éleveur', ok: () => (PROFILE.oeufs || 0) >= 1 },
  { id: 'amis', n: 'Entre amis', d: 'Battre l’équipe d’un ami.', ok: () => (PROFILE.amis || []).some(a => a.w > 0) }
);


/* =====================================================================
   L’Accueil : Défis entre amis
   ===================================================================== */
// #v4Amis : rendu par React après .hm-quick (src/screens/accueil/Amis.jsx)
// #amiBox : rendu par React (src/screens/overlays/AmiBox.jsx)


AMI_DEL = -1;


AMI_MODE = null;


document.addEventListener('click', e => {
  const a = e.target.closest('[data-ami]');
  if (a) {
    const k = a.dataset.ami;
    if (k === 'carte' || k === 'ajout') {
      AMI_MODE = k;
      renderAmiBox();
      $('#amiBox').hidden = false;
      queueSave();
      return;
    }
    if (k === 'x') {
      $('#amiBox').hidden = true;
      renderAmis416();
      return;
    }
    if (k === 'copier') return void copier416();
    if (k === 'partager') {
      const ta = $('#amiCode');
      if (ta && navigator.share)
        navigator.share({ text: `Affronte mon équipe dans Pokémon Résonance ! Colle ce code dans « Défis entre amis » : ${ta.value}` }).catch(() => copier416());
      return;
    }
    if (k === 'valider') {
      const ta = $('#amiColle'),
        msg = ajouterAmi416(ta ? ta.value : ''),
        ok = /rejoint|mise à jour/.test(msg);
      if (ok) {
        $('#amiBox').hidden = true;
        toast(msg);
        renderAmis416();
      } else {
        const er = $('#amiErr');
        if (er) er.textContent = msg;
      }
      return;
    }
  }
  if (e.target.id === 'amiBox') {
    $('#amiBox').hidden = true;
    return;
  }
  const f = e.target.closest('[data-ami-fight]');
  if (f) {
    AMI_DEL = -1;
    if (!squad.length) return void toast('Composez d’abord une équipe.');
    return void amiFight416(+f.dataset.amiFight);
  }
  const d = e.target.closest('[data-ami-del]');
  if (d) {
    const i = +d.dataset.amiDel;
    if (AMI_DEL === i) {
      const A = PROFILE.amis[i];
      PROFILE.amis.splice(i, 1);
      AMI_DEL = -1;
      queueSave();
      if (A) toast(`${A.n} est retiré de vos défis.`);
    } else AMI_DEL = i;
    renderAmis416();
    return;
  }
  // Pension
  const p = e.target.closest('[data-pens]');
  if (p) {
    const k = p.dataset.pens;
    if (k === 'ouvrir') {
      PENS_SEL = [];
      renderPensBox();
      $('#pensBox').hidden = false;
    } else if (k === 'x') $('#pensBox').hidden = true;
    else if (k === 'rendre') {
      PROFILE.couple = [];
      toast('Le couple revient au camp.');
      queueSave();
      renderCampBase();
    } else if (k === 'ok' && PENS_SEL.length === 2 && compatibles416(PENS_SEL[0], PENS_SEL[1])) {
      PROFILE.couple = [...PENS_SEL];
      __set_squad(squad.filter(s => !PENS_SEL.includes(BY[s].base)));
      $('#pensBox').hidden = true;
      toast(`${BY[PENS_SEL[0]].n} et ${BY[PENS_SEL[1]].n} s’installent à la Pension.`);
      save();
      queueSave();
      renderCampBase();
      try {
        renderSquad();
      } catch (er) {}
    }
    return;
  }
  const pp = e.target.closest('[data-pens-p]');
  if (pp) {
    const id = pp.dataset.pensP,
      i = PENS_SEL.indexOf(id);
    if (i >= 0) PENS_SEL.splice(i, 1);
    else if (PENS_SEL.length < 2) PENS_SEL.push(id);
    else PENS_SEL = [PENS_SEL[0], id];
    renderPensBox();
    return;
  }
  if (e.target.id === 'pensBox') $('#pensBox').hidden = true;
});


document.addEventListener('input', e => {
  if (e.target.id !== 'amiNom') return;
  PROFILE.name = e.target.value.replace(/[<>&"]/g, '').slice(0, 14);
  const ta = $('#amiCode');
  if (ta && squad.length) ta.value = carteCode416();
  queueSave();
});
}
