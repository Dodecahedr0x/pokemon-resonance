/* Section d'origine : v4.20-01-combat-intense.js */

import { MV } from './005-02-capacites.js';
import { SCEN } from './009-03-pokemon.js';
import { toast } from './014-08-outils.js';
import { CROCHETS } from './015-v4-8-00-crochets.js';
import { EMAX, P, byUid, damage, fin, hdist, heal, inReach, nbrK, say, setMark, uAt, uk } from './021-14-moteur-combat.js';
import { resolve } from './023-16-roles-synergies-obstacles.js';
import { B, autoSel, clearAim, log, renderAll, ui } from './024-17-interface-combat.js';
import { FOURNISSEURS_DEGATS } from './044-v4-5-01-moteur-tactique.js';
import { SUCCES } from './048-v4-9-01-rejouabilite.js';
import { aXP, bossScen } from './053-v4-14-01-resonance.js';
import { MARK_T416 } from './055-v4-16-01-johto-vivant.js';
import { NEWS416 } from './056-v4-16-1-01-finitions.js';

export let encercle420;
let peutVigil420, autour420, METEO_T420, DANGERS;
export function __set_phaseBoss420(v) { return (phaseBoss420 = v); }


/* =====================================================================
   v4.20 : des combats plus intenses
   1. Vigilance : un Pokémon renonce à son attaque pour surveiller ; il
      frappe le premier adversaire qui arrive à sa portée pendant le tour
      ennemi, avant que celui-ci n’attaque.
   2. Encerclement : une cible au contact de 2 Pokémon adverses ou plus
      subit +20 % de dégâts et perd 1 Mouvement. Valable des deux côtés.
   3. Boss à phases : Championne, Maîtres, Conseil 4, légendes et Cobalt
      changent de tactique à 66 % puis à 33 % de leurs PV.
   4. Dangers annoncés : dans les grands combats, une zone est annoncée une
      manche à l’avance (éboulement, foudre, vague, flammes, onde) ; tout
      Pokémon qui y reste, allié ou adversaire, est touché.
   ===================================================================== */

/* ---------- 1. Vigilance ---------- */
/** La meilleure attaque de surveillance : la plus puissante qui touche la case. */
export function vigilCoup420(S, u, k) {
  return u.mv
    .map(id => MV[id])
    .filter(m => m && m.p > 0 && !m.xp && m.sh !== 'self' && m.sh !== 'ally' && m.sh !== 'ring' && inReach(S, u, m, k))
    .sort((a, b) => b.p - a.p)[0];
}


function pVigil420(S, u) {
  if (!peutVigil420(S, u)) return null;
  const ev = [];
  u.vigil = 1;
  u.acted = true;
  say(ev, `${u.n} se met en vigilance : il frappera le premier adversaire qui arrive à sa portée.`);
  return ev;
}


/** Après le déplacement d’un adversaire : les vigilants frappent avant son attaque. */
export function vigilance420(S, e, ev) {
  if (!e || e.ko || S.over || e.side !== 'e') return;
  const k = uk(e);
  for (const u of S.units) {
    if (u.side !== 'a' || u.ko || !u.vigil || u.sn) continue;
    const m = vigilCoup420(S, u, k);
    if (!m) continue;
    u.vigil = 0;
    S.stats.vigil = (S.stats.vigil || 0) + 1;
    say(ev, `Vigilance : ${u.n} intercepte ${e.n} avec ${m.n} !`);
    ev.push({ e: 'vigil420', u: u.uid, t: e.uid });
    resolve(S, u, m, k).forEach(x => ev.push(x));
    if (e.ko || S.over) return;
  }
}


/* ---------- 3. Boss à phases ---------- */
export function bossPhases420(S) {
  const D = SCEN[S.sc] || {};
  return !!(D.champ || D.jfinal || D.hfinal || D.elite || D.legend || D.hleg435 || D.cap435 || D.jdis === 4);
}


export function bossDe420(S) {
  if (S.boss420) return byUid(S, S.boss420);
  const e = S.units.filter(x => x.side === 'e' && !x.seg).sort((a, b) => (b.boss ? 1 : 0) - (a.boss ? 1 : 0) || b.mhp - a.mhp)[0];
  if (e) S.boss420 = e.uid;
  return e;
}


export function phaseBoss420(S, ev) {
  if (!bossPhases420(S) || S.over) return;
  const b = bossDe420(S);
  if (!b || b.ko) return;
  const r = b.hp / b.mhp,
    ph = b.phase420 || 1;
  if (ph < 2 && r <= 0.66) {
    b.phase420 = 2;
    b.boost = Math.max(b.boost || 0, 2);
    b.guard = Math.max(b.guard || 0, 2);
    const t = b.t.find(x => METEO_T420[x]),
      mk = b.t.map(x => MARK_T416[x]).find(Boolean);
    if (t) S.wx = { k: METEO_T420[t], n: 4 };
    else if (mk) nbrK(uk(b)).forEach(x => S.tiles[x] && !S.tiles[x].rock && setMark(S, x, mk, b.uid));
    say(ev, `${b.n} entre en phase 2 : la rage ! Renforcé, blindé${t ? ', et la météo change' : mk ? ', et le terrain se transforme' : ''}.`);
    ev.push({ e: 'arena', r: 'phase2' });
  }
  if (ph < 3 && r <= 0.33) {
    b.phase420 = 3;
    b.pb = (b.pb || 0) + 1;
    const ko = S.units.filter(x => x.side === 'e' && x.ko && !x.seg && !x.colosse && !x.caught && x !== b)[0];
    let x = null;
    if (ko) x = [uk(b), ...nbrK(uk(b))].find(y => S.tiles[y] && !S.tiles[y].rock && !uAt(S, y));
    if (ko && x) {
      Object.assign(ko, { ko: false, hp: Math.max(1, Math.round(ko.mhp * 0.4)), pos: P(x), badge: null, skip: 0, notes: null, intent: null });
      ev.push({ e: 'mv', u: ko.uid }, { e: 'heal', u: ko.uid, v: ko.hp });
      say(ev, `${b.n} entre en phase 3 : dernier souffle ! ${ko.n} revient au combat.`);
    } else {
      heal(S, b, Math.max(1, Math.round(b.mhp * 0.15)), ev);
      say(ev, `${b.n} entre en phase 3 : dernier souffle ! Il reprend des forces.`);
    }
    S.units.forEach(e2 => {
      if (e2.side === 'e' && !e2.ko && aXP(e2)) e2.en = Math.min(EMAX, (e2.en || 0) + 1);
    });
    ev.push({ e: 'arena', r: 'phase3' });
  }
}


function typeDanger420(S) {
  const t = (SCEN[S.sc] || {}).at || 'Normal';
  if (['Électrik'].includes(t)) return 'foudre';
  if (['Eau', 'Glace'].includes(t)) return 'vague';
  if (['Feu', 'Dragon'].includes(t)) return 'flammes';
  if (['Psy', 'Spectre', 'Ténèbres', 'Fée'].includes(t)) return 'onde';
  return 'eboulement';
}


function dangersActifs420(S) {
  const D = SCEN[S.sc] || {};
  return !!(S && !D.tuto && !D.ami && !D.wild && !D.tower && (bossScen(S) || D.jdis));
}


function dangerTour420(S, ev) {
  if (!dangersActifs420(S) || S.over) return;
  const Z = S.danger420;
  // résolution de la zone annoncée la manche précédente
  if (Z && S.round >= Z.r) {
    const T = DANGERS[Z.t];
    let n = 0;
    Z.k.forEach(k => {
      const u = uAt(S, k);
      if (u && !u.ko && !(Z.t === 'foudre' && u.t.includes('Sol'))) {
        damage(S, u, T.d, ev, { ind: true });
        n++;
      }
      if (T.mk && S.tiles[k] && !S.tiles[k].rock) setMark(S, k, T.mk, null);
    });
    say(ev, `${T.n} ! ${n ? `${n} Pokémon touché${n > 1 ? 's' : ''}.` : 'Personne n’était dans la zone.'}`);
    ev.push({ e: 'arena', r: 'danger' });
    S.danger420 = null;
    fin(S, ev);
  }
  // une nouvelle zone, annoncée pour la fin de la manche suivante (une manche sur deux)
  if (!S.danger420 && !S.over && S.round % 2 === 1) {
    const al = S.units.filter(u => u.side === 'a' && !u.ko);
    if (!al.length) return;
    const c = uk(al[Math.floor(Math.random() * al.length)]),
      v = nbrK(c).filter(k => S.tiles[k] && !S.tiles[k].rock),
      k = [c];
    while (k.length < 3 && v.length) k.push(v.splice(Math.floor(Math.random() * v.length), 1)[0]);
    S.danger420 = { k, t: typeDanger420(S), r: S.round + 1 };
    say(ev, `Danger : ${DANGERS[S.danger420.t].n} annoncé sur ${k.length} cases pour la fin de la prochaine manche. Sortez de la zone rouge !`);
  }
}


export function danger420Svg(S, k, x, y) {
  const Z = S && S.danger420;
  if (!Z || !Z.k.includes(k)) return '';
  return `<g class="danger420 dg-${Z.t}" transform="translate(${x.toFixed(1)},${y.toFixed(1)})"><circle r="15"/><path d="M0-9 9 7H-9Z"/><path class="dg-x" d="M0-4v5M0 4v1"/></g>`;
}


/* ---------- l’aide du panneau ---------- */
export function vigilBtn420(u) {
  if (!B || u.side !== 'a') return '';
  const ok = peutVigil420(B, u);
  return `<button type="button" class="vx${u.vigil ? ' on' : ''}" data-vigil420 ${ok ? '' : 'disabled'}><b>Vigilance</b><span>${u.vigil ? 'en garde' : 'action · surveille'}</span></button>`;
}


export function etatsCombat420(u) {
  if (!B) return '';
  const o = [];
  if (u.vigil) o.push('<span class="ux vg420">Vigilance : frappe le premier adversaire à sa portée</span>');
  if (encercle420(B, u)) o.push('<span class="ux enc420">Encerclé : −1 Mouvement, +20 % de dégâts reçus</span>');
  if (u.phase420 > 1) o.push(`<span class="ux ph420">Phase ${u.phase420}</span>`);
  return o.join('');
}

// Instructions exécutées au démarrage, dans l'ordre d'origine (voir index.js).
export function __init() {

peutVigil420 = (S, u) => !!(S && u && u.side === 'a' && !u.ko && !u.acted && !u.sn && S.phase === 'player' && u.mv.some(id => MV[id] && MV[id].p > 0));


CROCHETS.avantFinManche.push(S => S.units.forEach(u => (!S.duel433 || u.j433 !== 2) && (u.vigil = 0)));

 // duel : la Vigilance du J2 tient pendant le tour du J1 (v4.33)
document.addEventListener('click', e => {
  const b = e.target.closest('[data-vigil420]');
  if (!b || !B || ui.busy) return;
  const u = ui.sel && byUid(B, ui.sel);
  const ev = u && pVigil420(B, u);
  if (!ev) return;
  ui.undo = null;
  clearAim();
  log(ev.filter(x => x.e === 'msg').map(x => x.s).join(' '), 'sys');
  toast(`${u.n} surveille sa zone.`);
  autoSel();
  renderAll();
});


/* ---------- 2. Encerclement ---------- */
autour420 = (S, t, side) => S.units.filter(o => !o.ko && o.side === side && !o.seg && hdist(o.pos, t.pos) === 1).length;


encercle420 = (S, u) => !!(S && u && !u.ko && !u.seg && !u.colosse && autour420(S, u, u.side === 'a' ? 'e' : 'a') >= 2);


FOURNISSEURS_DEGATS.push({ id: 'encerclement', fournir: (c, { S, u, t }) => S && t && u && t.side !== u.side && !t.seg && autour420(S, t, u.side) >= 2 && { mul: 1.2, libelle: 'Encerclement' } });


METEO_T420 = { Feu: 'soleil', Eau: 'pluie', Glace: 'grele', Roche: 'sable', Sol: 'sable' };


/* ---------- 4. Dangers annoncés ---------- */
DANGERS = {
  eboulement: { n: 'Éboulement', d: 9, mk: 'fissure' },
  foudre: { n: 'Foudre', d: 8, mk: 'charge' },
  vague: { n: 'Vague', d: 7, mk: 'trempe' },
  flammes: { n: 'Flammes', d: 7, mk: 'brulant' },
  onde: { n: 'Onde', d: 8, mk: null }
};


CROCHETS.avantFinManche.push((S, ev) => {
  phaseBoss420(S, ev);
  dangerTour420(S, ev);
});


SUCCES.push(
  { id: 'vigil', n: 'Sentinelle', d: 'Intercepter un adversaire avec la Vigilance.', ok: c => (c.S.stats.vigil || 0) > 0 },
  { id: 'phases', n: 'Jusqu’au bout', d: 'Battre un Maître ou une légende après sa phase 3.', t: 'Inébranlable', ok: c => c.win && c.S.units.some(u => u.phase420 === 3) }
);


NEWS416.unshift(['i-bolt', 'Combats plus intenses', 'Vigilance (interceptez un adversaire), Encerclement (+20 %), Maîtres et légendes à 3 phases, dangers annoncés sur le plateau.', null]);
}
