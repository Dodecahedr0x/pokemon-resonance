/* Original section: v4.5-01-tactical-engine.js */

import { MT } from './001-tactical-engine-turn-core.js';
import { MV, TAL } from './005-moves.js';
import { SCEN } from './009-pokemon.js';
import { toast } from './014-utils.js';
import { byUid, execFoe, flies, hdist, markAt, uk } from './021-combat-engine.js';
import { ACT, STATUSED, coverOf, ignObst, noteAdd, roleOf } from './023-roles-synergies-obstacles.js';
import { B, autoSel, clearAim, endOfRound, finish, log, placeEnemy, renderAll, scSel, ui } from './024-combat-ui.js';
import { PREF } from './026-campaign-tutorial-sound.js';
import { playEv } from './028-move-effects.js';
import { player418 } from './058-fishing-safari-coop.js';
import { dl428 } from './063-combat-catches-home.js';

export let SPEED_PROVIDERS, JIT_PBM, JIT_PB, JIT_DMG, JIT_BOSS, JIT_BOSS_HB, DAMAGE_PROVIDERS, ROLE_PROVIDERS;
let JIT_HB;


/* =====================================================================
   v4.5: the tactical engine plugged into Resonance combat
   ---------------------------------------------------------------------
   The tactical core (modifiers, turn-order strategies) is the MT object
   of 001-tactical-engine-turn-core.js.
   This file is the ADAPTER: it presents a game battle (S) to the engine
   in the shape the engine expects (living units, Speed, priority,
   rank), without changing any game rules.

   1. Turn order
      - "Par équipe" (By team: classic, default): the engine's
        OrderByPhases strategy orders the opponents. Result identical to
        before (verified by the 594 battles of the engine test).
      - "Par Vitesse" (By Speed: new, setting in Settings): the
        OrderBySpeed strategy mixes allies and opponents. Each round,
        everyone plays once, from fastest to slowest; a priority attack
        announced by the opponent (Quick Attack, Extreme Speed) goes first.
        Attacks are still announced: you see the blow coming, but a
        faster opponent strikes before you can dodge it.
   2. Effective Speed: the engine's modifier pipeline (mud, frost,
      paralysis, Slide, Chlorophyll, Scout).
   3. Damage: the formula's multipliers (weather, abilities, status) and
      those of roles, synergies and terrain go through the same pipeline
      (providers below, called by dmgBase and dmgRolesField).
   ===================================================================== */

/* ---------- 1. The adapter ---------- */
/** The "engine" view of a game battle. mode: 'team' (classic) or 'speed'. */
function turnAdapter(S, mode) {
  const views = new Map(),
    speedMode = mode === 'vitesse';
  const view = u => {
    if (!views.has(u)) views.set(u, { id: u.uid, camp: u.side, ref: u });
    return views.get(u);
  };
  return {
    etat: { tours: { joues: [], charges: [] } },
    bus: { emit() {} },
    unitesVivantes: () => S.units.filter(u => !u.ko).map(view),
    unite: id => view(byUid(S, id)),
    // classic: raw Speed, as before; by Speed: effective Speed
    stat: (v, displayName) => (displayName !== 'vit' ? 0 : speedMode ? (S.distorsion > 0 ? 20 - effSpeed(S, v.ref).valeur : effSpeed(S, v.ref).valeur) : v.ref.s[3]), // Distortion: slowest first (v4.12)
    priorite: v => (speedMode && v.ref.side === 'e' && v.ref.intent ? MV[v.ref.intent.mv].prio || 0 : 0),
    // on equal Speed: arrival order (classic); by Speed, your Pokémon first, then the round's draw
    rang: v => (speedMode && S.tirage ? (v.camp === 'a' ? 0 : 1) + (S.tirage[v.id] || 0) : S.units.indexOf(v.ref))
  };
}


/** Order in which opponents carry out their attacks (classic mode). */
export function enemyOrder(S) {
  return new MT.OrdreParPhases(turnAdapter(S, 'equipe')).ordrePhase('e').map(v => v.id);
}


function effSpeed(S, u) {
  return MT.combinerModificateurs(u.s[3], MT.collecter(SPEED_PROVIDERS, 'vit', { S, u }, 'unite'));
}


/** The queue is computed once per round, after the opponents' announcements (as the games compute the order at the start of a turn). */
function prepareRound(S) {
  S.tirage = {};
  S.units.forEach(u => (S.tirage[u.uid] = Math.random()));
  S.file = new MT.OrdreParVitesse(turnAdapter(S, 'vitesse')).ordreDuTour().map(v => v.id);
  S.vfile = S.file.map(id => Math.round(effSpeed(S, byUid(S, id)).valeur * 10) / 10);
  S.fileManche = S.round;
  S.ifile = -1;
  advanceQueue(S);
}


/** Advance to the next one: skip KO'd units and allies that can no longer act (asleep, or already committed to a Duo). */
function advanceQueue(S) {
  S.ifile += 1;
  while (S.ifile < S.file.length) {
    const u = byUid(S, S.file[S.ifile]);
    if (u && !u.ko && !(u.side === 'a' && (u.sn || u.acted))) return;
    S.ifile += 1;
  }
}


/** The Pokémon whose turn it is (null: the round is over, or we are not in Speed mode). */
export function currentActor(S) {
  if (!S || S.ordre !== 'vitesse' || S.over || S.phase !== 'player') return null;
  if (S.fileManche !== S.round || !S.file) prepareRound(S);
  let u = byUid(S, S.file[S.ifile]);
  while (u && u.ko) {
    advanceQueue(S);
    u = byUid(S, S.file[S.ifile]);
  }
  return u || null;
}


function playCurrentEnemy(S) {
  const u = currentActor(S);
  if (!u || u.side !== 'e') return [];
  const ev = execFoe(S, u.uid);
  advanceQueue(S);
  return ev;
}


function endAllyTurn(S) {
  const u = currentActor(S);
  if (!u || u.side !== 'a') return;
  u.acted = true;
  u.moved = true;
  advanceQueue(S);
}


/* ---------- 5. Speed mode interface ---------- */
/** The player's setting (Settings). The prologue's guided battle always stays classic. */
export function chosenOrder() {
  return PREF.vitesse && !(SCEN[scSel] && SCEN[scSel].tuto) ? 'vitesse' : 'equipe';
}


// The timeline (#bOrdre): who plays, in what order, this round. Rendered by React
// (src/screens/combat/battle/TopBar.jsx).


/** Makes the opponents play until the next ally's turn (or until the end of the round). */
export function unrollSpeed() {
  if (!B || B.ordre !== 'vitesse' || B.over) return;
  const S0 = B;
  ui.busy = true;
  ui.turbo428 = false;
  renderAll();
  const step = async () => {
    if (!B || B !== S0) return;
    if (B.over) {
      ui.busy = false;
      finish();
      return;
    }
    const u = currentActor(B);
    if (!u) {
      // end of the round, then chain on: a faster opponent can open the next round
      if (await endOfRound(S0)) unrollSpeed();
      return;
    }
    if (u.side === 'a') {
      ui.busy = false;
      ui.act = null;
      autoSel();
      renderAll();
      log(`À ${u.n} de jouer.`, 'sys');
      return;
    }
    ui.act = u.uid;
    if (await placeEnemy(S0, u.uid)) return; // v4.12: it positions itself first, in front of you
    const ev = playCurrentEnemy(B);
    renderAll();
    playEv(ev);
    setTimeout(step, dl428(200, 380, 900));
  };
  setTimeout(step, dl428(60, 160, 420));
}


/** Order by Speed: only the ally whose turn it is can be commanded. */
export function canSelect(u) {
  if (B && B.coop && u.side === 'a' && player418(u) !== B.coop) {
    toast(`C’est au Joueur ${B.coop} de jouer.`); // co-op (v4.18)
    return false;
  }
  const cur = B && currentActor(B);
  if (!cur || u === cur || B.ordre !== 'vitesse') return true;
  toast(cur.side === 'a' ? `C’est au tour de ${cur.n}.` : 'Les adversaires jouent.');
  return false;
}


/** "Next": the current ally is done, the queue advances. */
export function endTurnSpeed() {
  if (!B || ui.busy || B.over || B.phase !== 'player' || B.ordre !== 'vitesse') return;
  ui.undo = null;
  ui.tile = null;
  clearAim();
  ui.selE = null;
  endAllyTurn(B);
  unrollSpeed();
}

/* ---------- 2. Effective Speed ---------- */
const solid = u => !flies(u);

/* ---------- 3. "Order by Speed" mode: the round's queue ---------- */
/* Balancing: by Speed, you lose the advantage of always playing first.
   In exchange, the opponents' bonus HP is reduced (tuned with the test bot). */
const HP_ORDER_SPEED = 0.7;

export const hpOrder = opt => (opt && opt.ordre === 'vitesse' ? HP_ORDER_SPEED : 1) * JIT_HB;

/* ---------- 4. Damage: the modifier providers ----------
   Same order and same values as the old formula (identical down to the last
   digit, verified by the engine test). To add an effect: one line here.        */
const lowHp = (u, s) => u.hp / u.mhp <= s;

// Statements executed at startup, in the original order (see index.js).
export function __init() {

SPEED_PROVIDERS = [
  { id: 'paralysie', fournir: (c, { u }) => u.badge === 'PAR' && { mul: 0.5, libelle: 'Paralysie' } },
  {
    id: 'boue',
    fournir: (c, { S, u }) =>
      S.tiles[uk(u)].mud > 0 && solid(u) && !u.t.some(t => t === 'Sol' || t === 'Eau') && { mul: 0.5, libelle: 'Boue' }
  },
  {
    id: 'givre',
    fournir: (c, { S, u }) =>
      markAt(S, uk(u)) === 'givre' && solid(u) && { mul: u.t.includes('Glace') ? 1.25 : 0.75, libelle: 'Givre' }
  },
  {
    id: 'glissade',
    fournir: (c, { S, u }) =>
      u.tal === 'glissade' &&
      ((S.wx && S.wx.k === 'pluie') || markAt(S, uk(u)) === 'trempe') && { mul: 2, libelle: 'Glissade' }
  },
  {
    id: 'chlorophylle',
    fournir: (c, { S, u }) =>
      u.tal === 'chlorophylle' && S.wx && S.wx.k === 'soleil' && { mul: 2, libelle: 'Chlorophylle' }
  },
  { id: 'eclaireur', fournir: (c, { u }) => roleOf(u) === 'Éclaireur' && { add: 1, libelle: 'Éclaireur' } }
];


/* v4.12: without announced intents, the opponent always hits the best target within its reach.
   In exchange, its bonus HP and bonus power go down (tuned with the test bot: same win
   rates as in v4.11 for a player who positions well). */
JIT_HB = 0.8,
  JIT_PBM = 0.7,
  JIT_PB = 0,
  JIT_DMG = 0.75,
  JIT_BOSS = 0.8, // boss (legendaries, colossi, Tower): damage
  JIT_BOSS_HB = 0.6;

 // boss: bonus HP (shorter battles: every opponent hit counts)


DAMAGE_PROVIDERS = [
  // weather
  {
    id: 'meteo',
    fournir: (c, { S, m, typ }) => {
      const W = S.wx && S.wx.k,
        out = [];
      if (W === 'pluie') {
        if (typ === 'Eau') out.push({ mul: 1.5, libelle: 'Pluie' });
        if (typ === 'Feu') out.push({ mul: 0.5, libelle: 'Pluie' });
      }
      if (W === 'soleil') {
        if (typ === 'Feu') out.push({ mul: 1.5, libelle: 'Soleil' });
        if (typ === 'Eau') out.push({ mul: 0.5, libelle: 'Soleil' });
        if (m.sun) out.push({ mul: 1.5, libelle: 'Soleil' });
      }
      return out;
    }
  },
  // attacker's abilities
  {
    id: 'talent',
    fournir: (c, { u, typ }) => {
      if (
        (u.tal === 'brasier' && typ === 'Feu' && lowHp(u, 0.34)) ||
        (u.tal === 'torrent' && typ === 'Eau' && lowHp(u, 0.34)) ||
        (u.tal === 'essaim' && typ === 'Insecte' && lowHp(u, 0.34)) ||
        (u.tal === 'engrais' && typ === 'Plante' && lowHp(u, 0.5))
      )
        {return { mul: 1.5, libelle: TAL[u.tal].n };}
    }
  },
  { id: 'cran', fournir: (c, { u }) => u.tal === 'cran' && (u.bru > 0 || u.badge) && { mul: 1.5, libelle: 'Cran' } },
  { id: 'boost', fournir: (c, { u }) => u.boost > 0 && { mul: 1.5, libelle: 'Renforcé' } },
  // target's ability
  {
    id: 'isograisse',
    fournir: (c, { t, typ }) =>
      t.tal === 'isograisse' && (typ === 'Feu' || typ === 'Glace') && { mul: 0.5, libelle: 'Isograisse' }
  },
  // same type as the attacker
  { id: 'stab', fournir: (c, { u, typ }) => u.t.includes(typ) && { mul: 1.2, libelle: 'Même type' } }
];


/* roles, synergies and terrain: applied after the base formula (multipliers then flat bonuses) */
ROLE_PROVIDERS = [
  {
    id: 'frappeur',
    fournir: (c, { S, u }) =>
      roleOf(u) === 'Frappeur' &&
      S.units.some(
        o => !o.ko && o.side === u.side && o.uid !== u.uid && roleOf(o) === 'Rempart' && hdist(o.pos, u.pos) === 1
      ) && {
        mul: 1.25,
        libelle: 'Frappeur couvert par un Rempart'
      }
  },
  {
    id: 'verrou',
    fournir: (c, { S, u, t }) =>
      t.side !== u.side &&
      STATUSED(t) &&
      S.units.some(o => !o.ko && o.side === u.side && roleOf(o) === 'Verrou') && { mul: 1.25, libelle: 'Verrou' }
  },
  {
    id: 'synergies',
    fournir: (c, { S, u, t, typ }) => {
      if (u.side !== 'a' || !S.syn) return null;
      const s = S.syn,
        out = [];
      if (s.includes('forge') && (typ === 'Feu' || typ === 'Roche')) out.push({ add: 2, libelle: 'Forge' });
      if (s.includes('tempete') && typ === 'Électrik' && markAt(S, uk(t)) === 'trempe')
        {out.push({ mul: 1.25, libelle: 'Tempête' });}
      if (s.includes('dojo') && hdist(u.pos, t.pos) === 1) out.push({ add: 2, libelle: 'Dojo' });
      if (s.includes('banquise') && typ === 'Glace') out.push({ add: 3, libelle: 'Banquise' });
      if (s.includes('draco') && (typ === 'Dragon' || typ === 'Vol')) out.push({ add: 2, libelle: 'Draco' });
      return out;
    }
  },
  {
    id: 'acier',
    fournir: (c, { S, t }) =>
      t.side === 'a' &&
      S.syn &&
      S.syn.includes('acier') &&
      t.t.some(z => z === 'Ténèbres' || z === 'Acier') && { add: -2, libelle: 'Acier' }
  },
  {
    id: 'sable',
    fournir: (c, { S, t }) => {
      const tt = S.tiles[uk(t)];
      return (
        tt &&
        tt.sand &&
        !tt.w &&
        t.t.some(z => z === 'Sol' || z === 'Roche' || z === 'Acier') && { add: -2, libelle: 'Sable' }
      );
    }
  },
  {
    id: 'garde',
    fournir: (c, { u }) => ACT && ACT.guard && ACT.u.uid === u.uid && { mul: 0.75, libelle: 'Interception' }
  },
  {
    id: 'couvert',
    fournir: (c, { S, u, m, t, typ }) => {
      if (ACT && ACT.rico && ACT.u.uid === u.uid) {
        noteAdd(`Ricochet sur ${t.n} : −25 %`);
        return { mul: 0.75, libelle: 'Ricochet' };
      }
      if (
        !(ACT && ACT.guard) &&
        (m.sh === 'one' || m.sh === 'line') &&
        !ignObst(S, u, typ) &&
        coverOf(S, u.pos, t.pos)
      ) {
        noteAdd(`${t.n} est à couvert : −40 %`);
        return { mul: 0.6, libelle: 'À couvert' };
      }
    }
  }
];


// #bOrdre, after the arena rule: rendered by React (TopBar.jsx)
}
