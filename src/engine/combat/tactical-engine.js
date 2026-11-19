import { MT } from './turn-core.js';
import { MV, TAL } from '../data/moves.js';
import { SCEN } from '../pokemon/pokemon.js';
import { toast } from '../core/utils.js';
import { byUid, execFoe, flies, hdist, markAt, uk } from './engine.js';
import { ACT, STATUSED, coverOf, ignObst, noteAdd, roleOf } from './synergies-obstacles.js';
import { B, autoSel, clearAim, endOfRound, finish, log, placeEnemy, renderAll, scSel, ui } from './ui.js';
import { PREF } from '../ui/preferences.js';
import { playEv } from './move-effects.js';
import { coopPlayer } from '../modes/coop.js';
import { battleDelay } from './quick-battle.js';

export let SPEED_PROVIDERS, JIT_PBM, JIT_PB, JIT_DMG, JIT_BOSS, JIT_BOSS_HB, DAMAGE_PROVIDERS, ROLE_PROVIDERS;
let JIT_HB;

/* =====================================================================
   v4.5: the tactical engine plugged into Resonance combat
   ---------------------------------------------------------------------
   The tactical core (modifiers, turn-order strategies) is the MT object
   of combat/turn-core.js.
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
    if (!views.has(u)) {
      views.set(u, { id: u.uid, camp: u.side, ref: u });
    }
    return views.get(u);
  };
  return {
    status: { roundCount: { played: [], charges: [] } },
    bus: { emit() {} },
    aliveUnits: () => S.units.filter(u => !u.ko).map(view),
    unitRef: id => view(byUid(S, id)),
    // classic: raw Speed, as before; by Speed: effective Speed
    stat: (v, displayName) =>
      displayName !== 'vit'
        ? 0
        : speedMode
          ? S.distorsion > 0
            ? 20 - effSpeed(S, v.ref).amountValue
            : effSpeed(S, v.ref).amountValue
          : v.ref.s[3], // Distortion: slowest first (v4.12)
    priority: v => (speedMode && v.ref.side === 'e' && v.ref.intent ? MV[v.ref.intent.mv].prio || 0 : 0),
    // on equal Speed: arrival order (classic); by Speed, your Pokémon first, then the round's draw
    rankIndex: v =>
      speedMode && S.tiebreak ? (v.camp === 'a' ? 0 : 1) + (S.tiebreak[v.id] || 0) : S.units.indexOf(v.ref),
  };
}

/** Order in which opponents carry out their attacks (classic mode). */
export function enemyOrder(S) {
  return new MT.OrderByPhases(turnAdapter(S, 'equipe')).phaseOrder('e').map(v => v.id);
}

function effSpeed(S, u) {
  return MT.combineModifiers(u.s[3], MT.collect(SPEED_PROVIDERS, 'vit', { S, u }, 'unite'));
}

/** The queue is computed once per round, after the opponents' announcements (as the games compute the order at the start of a turn). */
function prepareRound(S) {
  S.tiebreak = {};
  S.units.forEach(u => (S.tiebreak[u.uid] = Math.random()));
  S.turnQueue = new MT.OrderBySpeed(turnAdapter(S, 'vitesse')).turnOrder().map(v => v.id);
  S.queueSpeeds = S.turnQueue.map(id => Math.round(effSpeed(S, byUid(S, id)).amountValue * 10) / 10);
  S.queueRound = S.round;
  S.queueIndex = -1;
  advanceQueue(S);
}

/** Advance to the next one: skip KO'd units and allies that can no longer act (asleep, or already committed to a Duo). */
function advanceQueue(S) {
  S.queueIndex += 1;
  while (S.queueIndex < S.turnQueue.length) {
    const u = byUid(S, S.turnQueue[S.queueIndex]);
    if (u && !u.ko && !(u.side === 'a' && (u.sn || u.acted))) {
      return;
    }
    S.queueIndex += 1;
  }
}

/** The Pokémon whose turn it is (null: the round is over, or we are not in Speed mode). */
export function currentActor(S) {
  if (!S || S.order !== 'vitesse' || S.over || S.phase !== 'player') {
    return null;
  }
  if (S.queueRound !== S.round || !S.turnQueue) {
    prepareRound(S);
  }
  let u = byUid(S, S.turnQueue[S.queueIndex]);
  while (u && u.ko) {
    advanceQueue(S);
    u = byUid(S, S.turnQueue[S.queueIndex]);
  }
  return u || null;
}

function playCurrentEnemy(S) {
  const u = currentActor(S);
  if (!u || u.side !== 'e') {
    return [];
  }
  const ev = execFoe(S, u.uid);
  advanceQueue(S);
  return ev;
}

function endAllyTurn(S) {
  const u = currentActor(S);
  if (!u || u.side !== 'a') {
    return;
  }
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
  if (!B || B.order !== 'vitesse' || B.over) {
    return;
  }
  const S0 = B;
  ui.busy = true;
  ui.skipSpeedup = false;
  renderAll();
  const step = async () => {
    if (!B || B !== S0) {
      return;
    }
    if (B.over) {
      ui.busy = false;
      finish();
      return;
    }
    const u = currentActor(B);
    if (!u) {
      // end of the round, then chain on: a faster opponent can open the next round
      if (await endOfRound(S0)) {
        unrollSpeed();
      }
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
    if (await placeEnemy(S0, u.uid)) {
      return;
    } // v4.12: it positions itself first, in front of you
    const ev = playCurrentEnemy(B);
    renderAll();
    playEv(ev);
    setTimeout(step, battleDelay(200, 380, 900));
  };
  setTimeout(step, battleDelay(60, 160, 420));
}

/** Order by Speed: only the ally whose turn it is can be commanded. */
export function canSelect(u) {
  if (B && B.coop && u.side === 'a' && coopPlayer(u) !== B.coop) {
    toast(`C’est au Joueur ${B.coop} de jouer.`); // co-op (v4.18)
    return false;
  }
  const cur = B && currentActor(B);
  if (!cur || u === cur || B.order !== 'vitesse') {
    return true;
  }
  toast(cur.side === 'a' ? `C’est au tour de ${cur.n}.` : 'Les adversaires jouent.');
  return false;
}

/** "Next": the current ally is done, the queue advances. */
export function endTurnSpeed() {
  if (!B || ui.busy || B.over || B.phase !== 'player' || B.order !== 'vitesse') {
    return;
  }
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

export const hpOrder = opt => (opt && opt.order === 'vitesse' ? HP_ORDER_SPEED : 1) * JIT_HB;

/* ---------- 4. Damage: the modifier providers ----------
   Same order and same values as the old formula (identical down to the last
   digit, verified by the engine test). To add an effect: one line here.        */
const lowHp = (u, s) => u.hp / u.mhp <= s;

// Statements executed at startup, in the original order (see index.js).
export function init() {
  SPEED_PROVIDERS = [
    { id: 'paralysie', provide: (c, { u }) => u.badge === 'PAR' && { mul: 0.5, labelText: 'Paralysie' } },
    {
      id: 'boue',
      provide: (c, { S, u }) =>
        S.tiles[uk(u)].mud > 0 &&
        solid(u) &&
        !u.t.some(t => t === 'Sol' || t === 'Eau') && { mul: 0.5, labelText: 'Boue' },
    },
    {
      id: 'givre',
      provide: (c, { S, u }) =>
        markAt(S, uk(u)) === 'givre' && solid(u) && { mul: u.t.includes('Glace') ? 1.25 : 0.75, labelText: 'Givre' },
    },
    {
      id: 'glissade',
      provide: (c, { S, u }) =>
        u.ability === 'glissade' &&
        ((S.wx && S.wx.k === 'pluie') || markAt(S, uk(u)) === 'trempe') && { mul: 2, labelText: 'Glissade' },
    },
    {
      id: 'chlorophylle',
      provide: (c, { S, u }) =>
        u.ability === 'chlorophylle' && S.wx && S.wx.k === 'soleil' && { mul: 2, labelText: 'Chlorophylle' },
    },
    { id: 'eclaireur', provide: (c, { u }) => roleOf(u) === 'Éclaireur' && { add: 1, labelText: 'Éclaireur' } },
  ];

  /* v4.12: without announced intents, the opponent always hits the best target within its reach.
   In exchange, its bonus HP and bonus power go down (tuned with the test bot: same win
   rates as in v4.11 for a player who positions well). */
  ((JIT_HB = 0.8),
    (JIT_PBM = 0.7),
    (JIT_PB = 0),
    (JIT_DMG = 0.75),
    (JIT_BOSS = 0.8), // boss (legendaries, colossi, Tower): damage
    (JIT_BOSS_HB = 0.6));

  // boss: bonus HP (shorter battles: every opponent hit counts)

  DAMAGE_PROVIDERS = [
    // weather
    {
      id: 'meteo',
      provide: (c, { S, m, typ }) => {
        const W = S.wx && S.wx.k,
          out = [];
        if (W === 'pluie') {
          if (typ === 'Eau') {
            out.push({ mul: 1.5, labelText: 'Pluie' });
          }
          if (typ === 'Feu') {
            out.push({ mul: 0.5, labelText: 'Pluie' });
          }
        }
        if (W === 'soleil') {
          if (typ === 'Feu') {
            out.push({ mul: 1.5, labelText: 'Soleil' });
          }
          if (typ === 'Eau') {
            out.push({ mul: 0.5, labelText: 'Soleil' });
          }
          if (m.sun) {
            out.push({ mul: 1.5, labelText: 'Soleil' });
          }
        }
        return out;
      },
    },
    // attacker's abilities
    {
      id: 'talent',
      provide: (c, { u, typ }) => {
        if (
          (u.ability === 'brasier' && typ === 'Feu' && lowHp(u, 0.34)) ||
          (u.ability === 'torrent' && typ === 'Eau' && lowHp(u, 0.34)) ||
          (u.ability === 'essaim' && typ === 'Insecte' && lowHp(u, 0.34)) ||
          (u.ability === 'engrais' && typ === 'Plante' && lowHp(u, 0.5))
        ) {
          return { mul: 1.5, labelText: TAL[u.ability].n };
        }
      },
    },
    {
      id: 'cran',
      provide: (c, { u }) => u.ability === 'cran' && (u.burn > 0 || u.badge) && { mul: 1.5, labelText: 'Cran' },
    },
    { id: 'boost', provide: (c, { u }) => u.boost > 0 && { mul: 1.5, labelText: 'Renforcé' } },
    // target's ability
    {
      id: 'isograisse',
      provide: (c, { t, typ }) =>
        t.ability === 'isograisse' && (typ === 'Feu' || typ === 'Glace') && { mul: 0.5, labelText: 'Isograisse' },
    },
    // same type as the attacker
    { id: 'stab', provide: (c, { u, typ }) => u.t.includes(typ) && { mul: 1.2, labelText: 'Même type' } },
  ];

  /* roles, synergies and terrain: applied after the base formula (multipliers then flat bonuses) */
  ROLE_PROVIDERS = [
    {
      id: 'frappeur',
      provide: (c, { S, u }) =>
        roleOf(u) === 'Frappeur' &&
        S.units.some(
          o => !o.ko && o.side === u.side && o.uid !== u.uid && roleOf(o) === 'Rempart' && hdist(o.pos, u.pos) === 1
        ) && {
          mul: 1.25,
          labelText: 'Frappeur couvert par un Rempart',
        },
    },
    {
      id: 'verrou',
      provide: (c, { S, u, t }) =>
        t.side !== u.side &&
        STATUSED(t) &&
        S.units.some(o => !o.ko && o.side === u.side && roleOf(o) === 'Verrou') && { mul: 1.25, labelText: 'Verrou' },
    },
    {
      id: 'synergies',
      provide: (c, { S, u, t, typ }) => {
        if (u.side !== 'a' || !S.syn) {
          return null;
        }
        const s = S.syn,
          out = [];
        if (s.includes('forge') && (typ === 'Feu' || typ === 'Roche')) {
          out.push({ add: 2, labelText: 'Forge' });
        }
        if (s.includes('tempete') && typ === 'Électrik' && markAt(S, uk(t)) === 'trempe') {
          out.push({ mul: 1.25, labelText: 'Tempête' });
        }
        if (s.includes('dojo') && hdist(u.pos, t.pos) === 1) {
          out.push({ add: 2, labelText: 'Dojo' });
        }
        if (s.includes('banquise') && typ === 'Glace') {
          out.push({ add: 3, labelText: 'Banquise' });
        }
        if (s.includes('draco') && (typ === 'Dragon' || typ === 'Vol')) {
          out.push({ add: 2, labelText: 'Draco' });
        }
        return out;
      },
    },
    {
      id: 'acier',
      provide: (c, { S, t }) =>
        t.side === 'a' &&
        S.syn &&
        S.syn.includes('acier') &&
        t.t.some(z => z === 'Ténèbres' || z === 'Acier') && { add: -2, labelText: 'Acier' },
    },
    {
      id: 'sable',
      provide: (c, { S, t }) => {
        const tt = S.tiles[uk(t)];
        return (
          tt &&
          tt.sand &&
          !tt.w &&
          t.t.some(z => z === 'Sol' || z === 'Roche' || z === 'Acier') && { add: -2, labelText: 'Sable' }
        );
      },
    },
    {
      id: 'garde',
      provide: (c, { u }) => ACT && ACT.guard && ACT.u.uid === u.uid && { mul: 0.75, labelText: 'Interception' },
    },
    {
      id: 'couvert',
      provide: (c, { S, u, m, t, typ }) => {
        if (ACT && ACT.rico && ACT.u.uid === u.uid) {
          noteAdd(`Ricochet sur ${t.n} : −25 %`);
          return { mul: 0.75, labelText: 'Ricochet' };
        }
        if (
          !(ACT && ACT.guard) &&
          (m.sh === 'one' || m.sh === 'line') &&
          !ignObst(S, u, typ) &&
          coverOf(S, u.pos, t.pos)
        ) {
          noteAdd(`${t.n} est à couvert : −40 %`);
          return { mul: 0.6, labelText: 'À couvert' };
        }
      },
    },
  ];

  // #bOrdre, after the arena rule: rendered by React (TopBar.jsx)
}
