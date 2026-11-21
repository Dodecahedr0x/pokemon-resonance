import { MT } from './turn-core.js';
import { EL, MK, MX } from '../data/game-data.js';
import { MV } from '../data/moves.js';
import { BY, DEPLOY, EEVEE, FAMT, MKT, PKT, SCEN, TCH, WXN } from '../pokemon/pokemon.js';
import { ARR } from '../pokemon/evolution.js';
import { ITEMS2, pairKey } from '../state/game-state.js';
import { HOOKS } from '../core/hooks.js';
import { DIFF, aiFallback, dmgItemsLinks, threatAt } from './items-bonds-ai.js';
import {
  NOTE,
  SANDOK,
  __set_NOTE,
  applyObst,
  dmgRolesField,
  foeRetreat,
  hasSyn,
  ignObst,
  losBlocked,
  resolve,
  ricoTgt,
  roleOf,
  roundSupport,
} from './synergies-obstacles.js';
import { aiStyleBonus } from './leader-styles.js';
import { isShinyOwned } from '../pokemon/shiny.js';
import {
  DAMAGE_PROVIDERS,
  JIT_BOSS,
  JIT_BOSS_HB,
  JIT_DMG,
  JIT_PB,
  JIT_PBM,
  enemyOrder,
  hpOrder,
} from './tactical-engine.js';
import { addLearned, withLearned } from '../moves/tms.js';
import { hourOf, nightRange, aliveInit, aliveRound } from './living-board.js';
import {
  forceStop,
  deferredCharge,
  colossusKO,
  outOfReach,
  launchCharge,
  trapArrival,
  hostileTrap,
  trapPlan,
  placeTrap,
} from './tactics.js';
import { chordAfter } from './resonance-chords.js';
import { disobeys } from '../team/characters.js';
import { REPLAYS, noteMoment } from './best-move-replay.js';
import {
  TARGET_MOVE_EFFECTS,
  SELF_MOVE_EFFECTS,
  tailwindMoveBonus,
  tickFieldEffects,
  placeForesight,
} from '../moves/epic-tms.js';
import {
  PRE_MOVE_EFFECTS,
  afterHitSignatures,
  afterMoveSignatures,
  reflectEffects,
  hasRune,
  aiSupportMove,
} from '../moves/technical-roster.js';
import { hasXp, afterHitResonance, afterDamageItems, xpCost, afterMoveHeldItems, canXP } from './resonance.js';
import { fleeMessage } from '../world/roaming-beasts.js';
import { resonanceCandidate } from './resonant-form.js';
import { vigilanceStrike } from './intensity.js';
import { expertCoordination } from './expert-ai.js';
import { doctrineDamage, doctrineMove } from './doctrines.js';
import { journalDamage } from '../progression/tactical-journal.js';
import { masteryDamageBonus, masteryMoveBonus } from '../progression/family-mastery.js';
import { talentDamage, talentMove } from '../team/individuals.js';
import { duelAiPlan, duelVigilance } from '../modes/duel.js';
import { eeveeHarmony } from '../pokemon/eevee.js';

export let BW, BH;

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

export function neighbors(p) {
  const [x, y, z] = toCube(p[0], p[1]);
  return CDIR.map(d => fromCube(x + d[0], y + d[1], z + d[2])).filter(q => inBoard(q[0], q[1]));
}

export function teff(at, def) {
  const e = TCH[at];
  if (!e) {
    return 1;
  }
  let m = 1;
  def.forEach(t => {
    if (e[2].includes(t)) {
      m *= 0;
    } else if (e[0].includes(t)) {
      m *= 2;
    } else if (e[1].includes(t)) {
      m *= 0.5;
    }
  });
  return m;
}

function specOf(id) {
  const m = BY[id];
  return { id, n: m.n, t: m.t, s: m.s, mv: m.mv, ability: m.ability };
}

export function mkUnit(id, side, pos, uid, D) {
  const sp = specOf(id),
    hb = side === 'e' ? D.hb || 0 : 0,
    mhp = mhpOf(sp.s) + hb;
  const u = {
    uid,
    // allies keep their family identity (Bonds, items, fatigue, duos) even when recruited already evolved
    sp: side === 'a' && BY[id] ? BY[id].base : id,
    id,
    side,
    n: sp.n,
    t: [...sp.t],
    s: [...sp.s],
    mv: [...sp.mv],
    ability: sp.ability,
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
    burn: 0,
    web: 0,
    guard: 0,
    anchor: 0,
    root: 0,
    prot: 0,
    boost: 0,
    sturdy: sp.ability === 'fermete',
    intent: null,
    done: false,
    evolved: false,
    evo: 0,
    en: 0,
    ko: false,
  };
  PKT.set(u.t, u.id); // types → species: the medallion shows the right illustration
  return u;
}

export function markAt(S, k) {
  const t = S.tiles[k];
  if (!t) {
    return null;
  }
  return t.mark ? t.mark.k : t.w ? 'trempe' : null;
}

// grounded: Gravity (v4.9)
function entryWx(S, u, ev) {
  if (u.ability === 'crachin') {
    S.wx = { k: 'pluie', n: 5 };
    ev && pushMessage(ev, `Crachin : ${u.n} fait tomber la pluie.`);
  }
  if (u.ability === 'sablevolant') {
    S.wx = { k: 'sable', n: 5 };
    ev && pushMessage(ev, `Sable Volant : ${u.n} lève une tempête de sable.`);
  }
}

// Voices per round at the start of a battle: 3, plus the team bonus (vBonus, free PC).
export const startVoice = bonus => 3 + bonus;

export function newBattle(sc, team, bonus, opt) {
  opt = opt || {};
  const D0 = SCEN[sc],
    df = DIFF[opt.diff] || DIFF.normal,
    // difficulty: opponents' HP and power, number of rounds
    D = Object.assign({}, D0, {
      hb: Math.max(0, Math.round((D0.hb || 0) * df.hb * hpOrder(opt) + (df.hbAdd || 0))),
      pb: Math.max(0, Math.round(((D0.pb || 0) + df.pb) * JIT_PBM) + JIT_PB),
      lim: Math.max(6, (D0.lim || 12) + df.lim),
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
      voice: startVoice(bonus),
      vmax: startVoice(bonus),
      eveil: false,
      retrigger: false,
      over: null,
      lastAtk: null,
      stats: { rx: 0, ko: 0, voice: 0, evo: 0, pairs: {} },
      rxg: {},
      jit: true, // v4.12: hidden intentions, opponents decide on their own turn
    };
  for (let r = 0; r < BH; r++) {
    for (let c = 0; c < BW; c++) {
      S.tiles[K(c, r)] = { w: false, rock: false, mark: null, mud: 0, lava: 0, fog: 0 };
    }
  }
  D.water.forEach(k => (S.tiles[k].w = true));
  D.rock.forEach(k => (S.tiles[k].rock = true));
  if (D.fiss) {
    for (const k in S.tiles) {
      const c = P(k)[0];
      if (c >= 3 && c <= 6 && !S.tiles[k].rock) {
        S.tiles[k].mark = { k: 'fissure', d: 99, lv: 1, by: null };
      }
    }
  }
  team.slice(0, 4).forEach((id, i) => {
    const u = mkUnit(id, 'a', DEPLOY[i], 'a' + i, D);
    if (BY[id] && isShinyOwned(BY[id].base)) {
      u.shiny = true;
    } // your shinies stay shiny in battle (v4.15)
    S.units.push(u);
  });
  D.foes.forEach(([id, p, x], i) => {
    // x: settings for a specific opponent (legendary boss, shiny); its HP also follow the difficulty
    const Dx = x
        ? Object.assign(
            {},
            D,
            x,
            x.hb != null
              ? {
                  hb: Math.max(
                    0,
                    Math.round(x.hb * df.hb * hpOrder(opt) * (x.boss || x.colossus ? JIT_BOSS_HB : 1) + (df.hbAdd || 0))
                  ),
                }
              : {},
            x.pb != null ? { pb: Math.max(0, Math.round(x.pb * JIT_PBM) + JIT_PB) } : {}
          )
        : D,
      u = mkUnit(id, 'e', p, 'e' + i, Dx);
    if (x && x.shiny) {
      u.shiny = true;
    }
    if (x && x.boss) {
      u.boss = true;
    }
    S.units.push(u);
  });
  S.units.forEach(u => entryWx(S, u, null));
  aliveInit(S, opt); // living board: the scenario's time of day starts the cycle (v4.7-01)
  HOOKS.creation.forEach(h => h(S, opt, D0)); // colossi, Advanced Tactics… (v4.8)
  plan(S, []);
  // difficulty, Bonds, held items and fatigue (applied after the opponents' first intentions)
  S.diff = DIFF[opt.diff] ? opt.diff : 'normal';
  if (opt.order === 'vitesse') {
    S.order = 'vitesse';
  } // turn order by Speed (v4.5-01)
  addLearned(S, opt.learnedTms); // learned TMs and HMs (v4.6-01)
  S.links = {};
  S.noCatch = !D0.catch;
  S.stats.caught = [];
  S.stats.duo = 0;
  S.stats.rxk = {};
  const al = S.units.filter(u => u.side === 'a');
  for (let i = 0; i < al.length; i++) {
    for (let j = i + 1; j < al.length; j++) {
      const k = pairKey(al[i].sp, al[j].sp),
        v = (opt.links || {})[k] || 0;
      if (v) {
        S.links[k] = v;
      }
    }
  }
  al.forEach(u => {
    const it = (opt.items || {})[u.sp];
    if (it && ITEMS2[it]) {
      u.item = it;
      if (it === 'ceinture') {
        u.belt = true;
      }
      if (it === 'bandeau') {
        u.pb = (u.pb || 0) + 2;
      }
      if (it === 'lentille' && (hasNx(u) || hasXp(u))) {
        u.en = 1;
      }
    }
    if (((opt.fatigue || {})[u.sp] || 0) >= 70) {
      u.fat = true;
    }
  });
  HOOKS.combat.forEach(h => h(S, opt, D0));
  return S;
}

// colossus: +2 range (v4.8) // at night: −1 range (v4.7-01) // Shock Wave in the Rain (v4.12)
export function movPts(S, u) {
  if (u.colossus || u.seg) {
    return 0;
  } // colossi do not move (v4.8)
  const fr = u.ability === 'regardvif';
  if (u.root > 0 && !fr) {
    return 0;
  }
  let m = u.s[4];
  if (u.ability === 'glissade' && markAt(S, unitKey(u)) === 'trempe') {
    m += 2;
  }
  if (u.ability === 'chlorophylle' && S.wx && S.wx.k === 'soleil') {
    m += 2;
  }
  if (u.web > 0 && !fr) {
    m -= 3;
  }
  m = Math.max(0, m);
  m = Math.max(0, m + (u.item === 'grelot' ? 1 : 0) - (u.fat ? 1 : 0)); // Grelot Vif +1, fatigue −1
  if (hasSyn(S, u, 'escadrille') && (u.t.includes('Vol') || u.t.includes('Insecte'))) {
    m++;
  } // Squadron synergy
  if (S.mutatorMove) {
    m = Math.max(0, m + S.mutatorMove);
  } // Gravity, Frenzy mutators (v4.9)
  if (u.temperament === 'vif') {
    m++;
  } // Quick nature (v4.10)
  m = Math.max(0, m + tailwindMoveBonus(S, u) + doctrineMove(S, u) + masteryMoveBonus(S, u) + talentMove(S, u)); // doctrine (v4.30); Tailwind, Trick Room (v4.12), Gravity, Shadow Mark… (v4.13)
  return m;
}

export function reach(S, u) {
  const m = movPts(S, u),
    st = unitKey(u),
    best = { [st]: 0 },
    q = [[st, 0]],
    fl = flies(u),
    ok = SANDOK(u); // sand costs 2 Movement, except for Ground, Rock and Steel types and flyers
  while (q.length) {
    const [k, c0] = q.shift();
    for (const nk of nbrK(k)) {
      const t = S.tiles[nk];
      if (t.rock || unitAt(S, nk)) {
        continue;
      }
      const c = c0 + (t.mud > 0 && !fl ? 3 : t.sand && !t.w && !ok ? 2 : 1);
      if (c <= m && (best[nk] === undefined || c < best[nk])) {
        best[nk] = c;
        if (!forceStop(S, u, nk)) {
          q.push([nk, c]);
        } // enemy trap, control zone: movement stops there (v4.8)
      }
    }
  }
  delete best[st];
  return best;
}

export function mvType(S, u, m) {
  if (u.ability === 'adaptabilite' && m.t === 'Normal') {
    const k = markAt(S, unitKey(u));
    if (k) {
      return MKT[k];
    }
  }
  return m.t;
}

function lineK(from, d, n) {
  const [x, y, z] = toCube(from[0], from[1]),
    o = [];
  for (let i = 1; i <= n; i++) {
    const p = fromCube(x + d[0] * i, y + d[1] * i, z + d[2] * i);
    if (!inBoard(p[0], p[1])) {
      break;
    }
    o.push(K(p[0], p[1]));
  }
  return o;
}

function canSee(S, u, k) {
  const v = unitAt(S, k);
  if (!v || u.ability === 'echolocation') {
    return true;
  }
  const d = hdist(u.pos, P(k));
  if (S.tiles[k].fog > 0 && d > 1) {
    return false;
  } // fog
  return !(v.side !== u.side && S.tiles[k].grass && d > 2); // tall grass: hidden beyond 2 cells
}

export function targets(S, u, m) {
  if (m && ((m.xp && !canXP(S, u, m)) || (u.item === 'mouchoir' && u.choice && MV[u.choice] && MV[u.choice] !== m))) {
    return [];
  } // v4.14
  const R = effR(u, m, S);
  if (m.sh === 'self' || m.sh === 'ring') {
    return [unitKey(u)];
  }
  const ign = ignObst(S, u, mvType(S, u, m)); // Spirit synergy: Psychic and Ghost ignore obstacles
  if (m.sh === 'line') {
    const o = [];
    CDIR.forEach(d => {
      for (const k of lineK(u.pos, d, R)) {
        if (S.tiles[k].pil && !ign) {
          break;
        } // a pillar stops the line
        if (!S.tiles[k].rock) {
          o.push(k);
        }
      }
    });
    return o;
  }
  let o = [];
  for (const k in S.tiles) {
    if (S.tiles[k].rock) {
      continue;
    }
    const d = hdist(u.pos, P(k));
    if (d < 1 || d > R) {
      continue;
    }
    const v = unitAt(S, k);
    if (m.sh === 'ally') {
      if (v && v.side === u.side) {
        o.push(k);
      }
      continue;
    }
    if (NEEDU.includes(m.fx) && !v) {
      continue;
    }
    if (m.fx === 'piege' && (v || S.tiles[k].w || S.tiles[k].trap)) {
      continue;
    } // a trap is placed on a free cell (v4.8)
    if (v && v.side === u.side && (m.p || m.fix || HOSTILE.includes(m.fx))) {
      continue;
    }
    if (!canSee(S, u, k)) {
      continue;
    }
    o.push(k);
  }
  if (m.sh === 'one') {
    // a pillar blocks ranged shots
    if (!ign) {
      o = o.filter(k => hdist(u.pos, P(k)) < 2 || !losBlocked(S, u.pos, P(k)));
    }
    // ricochet: aim at a rock to hit the nearest enemy behind it
    if (m.p && R >= 2 && u.side === 'a') {
      for (const k in S.tiles) {
        const t = S.tiles[k];
        if (!t.rock || t.pil) {
          continue;
        }
        const d = hdist(u.pos, P(k));
        if (d < 1 || d > R) {
          continue;
        }
        if (!ign && d >= 2 && losBlocked(S, u.pos, P(k))) {
          continue;
        }
        if (ricoTgt(S, u, k)) {
          o.push(k);
        }
      }
    }
  }
  return o;
}

export function affected(S, u, m, k) {
  let a;
  const R = effR(u, m, S),
    t = S.tiles[k];
  if (m.sh === 'one' && t && t.rock && !t.pil) {
    // ricochet off a rock
    const r = ricoTgt(S, u, k);
    return r ? [r] : [];
  }
  if (m.sh === 'self') {
    a = [unitKey(u)];
  } else if (m.sh === 'ring') {
    a = nbrK(unitKey(u));
  } else if (m.sh === 'line') {
    const stop = !ignObst(S, u, mvType(S, u, m));
    a = null;
    for (const d of CDIR) {
      const L = lineK(u.pos, d, R);
      if (L.includes(k)) {
        a = [];
        for (const x of L) {
          if (stop && S.tiles[x].pil) {
            break;
          } // a pillar stops the line
          a.push(x);
        }
        break;
      }
    }
    if (!a) {
      a = [k];
    }
  } else if (m.sh === 'cone') {
    const n1 = nbrK(unitKey(u)),
      n2 = nbrK(k);
    a = [k, ...n1.filter(x => n2.includes(x))];
  } else if (m.sh === 'area') {
    a = [k, ...nbrK(k)];
  } else {
    a = [k];
  }
  if (m.pluie && m.sh === 'one' && S.wx && S.wx.k === 'pluie') {
    a = [k, ...nbrK(k)];
  } // Shock Wave in the Rain (v4.12)
  return a.filter(x => S.tiles[x] && !S.tiles[x].rock);
}

export function inReach(S, u, m, k) {
  if (m.sh === 'ring' || m.sh === 'self') {
    return true;
  }
  const R = effR(u, m, S),
    ign = ignObst(S, u, mvType(S, u, m)),
    d = hdist(u.pos, P(k));
  if (m.sh === 'line') {
    const L = CDIR.map(dd => lineK(u.pos, dd, R)).find(line => line.includes(k));
    if (!L) {
      return false;
    }
    if (!ign && L.slice(0, L.indexOf(k)).some(x => S.tiles[x].pil)) {
      return false;
    } // pillar on the line
  } else {
    if (d < 1 || d > R) {
      return false;
    }
    if (!ign && m.sh === 'one' && d >= 2 && losBlocked(S, u.pos, P(k))) {
      return false;
    } // pillar in between
  }
  // tall grass: a target more than 2 cells away is invisible
  const v = unitAt(S, k);
  return !(v && v.side !== u.side && S.tiles[k].grass && d > 2 && u.ability !== 'echolocation');
}

function intimidate(S, u) {
  return S.units.some(o => !o.ko && o.side !== u.side && o.ability === 'intimidation' && hdist(o.pos, u.pos) === 1);
}

/* damage of a move: base formula, then items and Bonds, then roles, synergies and terrain */
export function dmgOf(S, u, m, t, typ, mult) {
  let d = dmgBase(S, u, m, t, typ, mult);
  if (d <= 0 || m.fix) {
    return d;
  }
  d = dmgItemsLinks(S, u, t, d, mult);
  return talentDamage(S, u, t, masteryDamageBonus(S, u, t, doctrineDamage(S, u, t, dmgRolesField(S, u, m, t, typ, d)))); // doctrine (v4.30), mastery and relics (v4.31), ability (v4.32)
}

function dmgBase(S, u, m, t, typ, mult) {
  let e = teff(typ, t.t);
  if (e === 0 && typ === 'Sol' && t.pinned && t.t.includes('Vol')) {
    e =
      t.t.length > 1
        ? teff(
            typ,
            t.t.filter(z => z !== 'Vol')
          ) || 1
        : 1;
  } // Gravity: Ground hits Flying (v4.13)
  if (e === 0) {
    return 0;
  }
  if (typ === 'Sol' && t.ability === 'levitation' && !t.pinned) {
    return 0;
  }
  if (m.fix) {
    return m.fix;
  }
  if (!m.p) {
    return 0;
  }
  if (m.fx === 'devoreve' && t.badge !== 'SOM') {
    return 0;
  } // Dream Eater (v4.12)
  // multipliers (weather, abilities, status, same type): supplied to the tactical engine's pipeline (v4.5-01)
  const x = MT.combineModifiers(
    e * mult,
    MT.collect(DAMAGE_PROVIDERS, 'degats', { S, u, m, t, typ }, 'attaquant')
  ).amountValue;
  let d = Math.round((m.p + u.s[1] * 2 + (u.pb || 0)) * x);
  if (u.ability !== 'annulegarde' && m.fx !== 'percegarde') {
    d -=
      t.s[2] +
      (u.ability === 'inconscient'
        ? 0
        : (t.guard > 0 ? 2 : 0) + (t.anchor > 0 ? 2 : 0) + (t.ability === 'coque' ? 2 : 0));
  }
  if (intimidate(S, u)) {
    d -= 3;
  }
  if (u.weakened > 0) {
    d -= 3;
  } // Will-O-Wisp (v4.13)
  // v4.12: without intentions, every enemy attack lands; it hits a little softer (after Guard)
  if (S.jit && u.side === 'e' && !S.duel433 && JIT_DMG !== 1) {
    d = Math.round(d * JIT_DMG * (u.boss || u.colossus ? JIT_BOSS : 1));
  }
  return Math.max(1, d);
}

export function pushMessage(ev, s) {
  ev.push({ e: 'msg', s });
}

export function damage(S, v, d, ev, o) {
  o = o || {};
  if (!v || v.ko || d <= 0) {
    return 0;
  }
  if (o.ind && v.ability === 'gardemagik') {
    return 0;
  }
  if (v.prot > 0 && !o.ind) {
    pushMessage(ev, `${v.n} se protège avec Abri.`);
    return 0;
  }
  // Focus Sash: a fatal hit leaves 1 HP (once)
  const belt = v.belt && !v.sturdy && d >= v.hp;
  if (belt) {
    v.belt = false;
    d = v.hp - 1;
    if (d <= 0) {
      pushMessage(ev, `${v.n} tient bon grâce à la Ceinture Force !`);
      return 0;
    }
  }
  let nh = v.hp - d;
  if (nh <= 0 && v.sturdy) {
    nh = 1;
    v.sturdy = false;
    pushMessage(ev, `${v.n} tient bon grâce à Fermeté !`);
  }
  const real = v.hp - Math.max(0, nh);
  v.hp = Math.max(0, nh);
  ev.push({ e: 'dmg', u: v.uid, v: real });
  journalDamage(S, v, real, o); // tactical log (v4.30)
  if ((v.side === 'a' || S.duel433) && v.hp > 0 && real >= v.mhp * 0.3) {
    rewardIn(S, v, 1, ev);
  } // duel: both players (v4.33)
  if (v.hp <= 0) {
    v.ko = true;
    v.intent = null;
    ev.push({ e: 'ko', u: v.uid });
    pushMessage(ev, `${v.n} est K.O.`);
    if (v.side === 'e') {
      S.stats.ko++;
    }
    if (v.side !== 'e' || S.duel433) {
      S.units.forEach(ally => {
        if (ally.side === v.side && !ally.ko && ally !== v) {
          rewardIn(S, ally, 1, ev);
        }
      });
    }
    if (v.seg || v.colossus) {
      colossusKO(S, v, ev);
    } // colossi (v4.8)
  }
  if (real > 0 && !o.ind) {
    v.touche = true; // Mach Punch (v4.13)
    if (!o.reflect) {
      reflectEffects(S, v, real, ev);
    } // Counter, Mirror Coat, Destiny Bond (v4.13)
  }
  if (real > 0) {
    afterDamageItems(S, v, real, o, ev);
  } // Rocky Helmet, Sitrus Berry (v4.14)
  if (belt) {
    pushMessage(ev, `${v.n} tient bon grâce à la Ceinture Force !`);
  }
  return real;
}

export function heal(S, v, a, ev) {
  if (v && v.side === 'a' && S.syn && S.syn.includes('benediction')) {
    a = Math.round(a * 1.5);
  } // Blessing synergy
  if (v && v.item === 'grosseracine') {
    a = Math.round(a * 1.5);
  } // Big Root (v4.14)
  if (!v || v.ko || a <= 0) {
    return;
  }
  const r = Math.min(a, v.mhp - v.hp);
  if (r <= 0) {
    return;
  }
  v.hp += r;
  ev.push({ e: 'heal', u: v.uid, v: r });
}

export function stun(S, v, lab, ev, noSync) {
  if (!v || v.ko) {
    return;
  }
  if (v.item === 'baielum' && !v.lumBerryUsed) {
    // held item (v4.58): cancels the first status inflicted
    v.lumBerryUsed = 1;
    pushMessage(ev, `Baie Lum : ${v.n} annule l’état ${lab}.`);
    return;
  }
  if (v.ability === 'attention') {
    pushMessage(ev, `${v.n} reste concentré.`);
    return;
  }
  if (v.ability === 'armuremagma' && lab === 'GEL') {
    pushMessage(ev, `Armumagma : ${v.n} ne gèle pas.`); // v4.15
    return;
  }
  if (v.ability === 'souplesse' && lab === 'PAR') {
    pushMessage(ev, `${v.n} est trop souple pour être paralysé.`); // v4.13
    return;
  }
  if (hasRune(S, v)) {
    pushMessage(ev, `Rune Protect : ${v.n} est protégé.`); // v4.13
    return;
  }
  v.badge = lab;
  v.stunBadgeSeen = 0;
  if (v.side === 'e' && !v.done && (v.intent || S.jit)) {
    v.intent = null;
    pushMessage(
      ev,
      S.duel433
        ? `${v.n} perdra son prochain tour.`
        : S.jit
          ? `${v.n} ne pourra pas agir cette manche.`
          : `L’attaque de ${v.n} est annulée.`
    );
  } else if (v.side === 'a' && S.phase === 'player' && !v.acted) {
    v.acted = true;
    v.moved = true;
    v.sn = true;
  } else {
    v.skip = 1;
  }
  ev.push({ e: 'st', u: v.uid, s: lab });
  if (!noSync && v.ability === 'synchro' && S.lastAtk) {
    const a = byUid(S, S.lastAtk);
    if (a && a.side !== v.side && !a.ko) {
      pushMessage(ev, `Synchro : ${a.n} subit le même sort.`);
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
  ) {
    return 3;
  }
  if (w === 'soleil' && mk === 'trempe') {
    return 1;
  }
  if (S.livingBoard && w === 'pluie' && mk === 'brulant') {
    return 1;
  }
  return 2;
}

export function setMark(S, k, mk, by) {
  const t = S.tiles[k];
  if (t && !t.rock) {
    t.mark = { k: mk, d: mDur(S, mk), lv: 1, by };
  }
  // Primer: a Trigger's marks last one more round
  if (t && t.mark && by) {
    const b = byUid(S, by);
    if (b && roleOf(b) === 'Déclencheur') {
      t.mark.d += 1;
    }
  }
}

export function net(S, k, mk) {
  const seen = { [k]: 0 },
    q = [k],
    edges = [];
  while (q.length) {
    const x = q.shift();
    for (const n of nbrK(x)) {
      if (seen[n] !== undefined || markAt(S, n) !== mk) {
        continue;
      }
      seen[n] = seen[x] + 1;
      edges.push([x, n, seen[n]]);
      q.push(n);
    }
  }
  return { seen, edges };
}

function moist(S, k) {
  return S.units.some(o => !o.ko && o.ability === 'moiteur' && hdist(o.pos, P(k)) <= 2);
}

function linkRef(S, a, b) {
  if (!a || !b || a === b) {
    return;
  }
  const A = byUid(S, a),
    C = byUid(S, b);
  if (!A || !C || A.side !== 'a' || C.side !== 'a') {
    return;
  }
  const key = [A.sp, C.sp].sort().join('|');
  S.stats.pairs[key] = (S.stats.pairs[key] || 0) + 1;
}

export function landed(S, v, ev) {
  if (!v || v.ko) {
    return;
  }
  v.mvR = S.round; // Pursuit (v4.13)
  const t = S.tiles[unitKey(v)];
  if (t.lava > 0 && !flies(v)) {
    pushMessage(ev, `${v.n} se brûle sur la lave.`);
    damage(S, v, v.ability === 'isograisse' ? 3 : 6, ev, { ind: true });
  }
  trapArrival(S, v, ev); // traps (v4.8)
}

export function shove(S, v, from, n, ev, pull) {
  if (!v || v.ko || n <= 0) {
    return;
  }
  if (v.anchor > 0 || v.colossus || v.seg) {
    pushMessage(ev, `${v.n} est ancré et ne bouge pas.`);
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
    if (pull && hdist(v.pos, from) <= 1) {
      break;
    }
    const c = toCube(v.pos[0], v.pos[1]),
      np = fromCube(c[0] + dir[0], c[1] + dir[1], c[2] + dir[2]),
      nk = K(np[0], np[1]);
    if (!inBoard(np[0], np[1]) || S.tiles[nk].rock) {
      pushMessage(ev, `${v.n} heurte un obstacle.`);
      damage(S, v, 3, ev, { ind: true });
      break;
    }
    const o = unitAt(S, nk);
    if (o) {
      pushMessage(ev, `${v.n} percute ${o.n}.`);
      damage(S, v, 3, ev, { ind: true });
      damage(S, o, 3, ev, { ind: true });
      break;
    }
    v.pos = np;
    moved = true;
    ev.push({ e: 'mv', u: v.uid });
  }
  if (moved) {
    pushMessage(
      ev,
      `${v.n} est ${pull ? 'attiré' : 'repoussé'}${markAt(S, unitKey(v)) === 'trempe' ? ' dans l’eau' : ''}.`
    );
    landed(S, v, ev);
  }
}

// Counts the reaction in the player's stats, links its author and grants the first-reaction rewards.
function recordReaction(S, rx, k, u, by, ev) {
  if (u.side === 'a') {
    S.stats.rx++;
    const R = (S.stats.rxk = S.stats.rxk || {}); // preferred reactions (studied by the Champion)
    R[rx] = (R[rx] || 0) + 1;
  }
  linkRef(S, by, u.uid);
  ev.push({ e: 'rx', k, rx });
  if (!S.rxg[u.uid]) {
    S.rxg[u.uid] = 1;
    rewardIn(S, u, 1, ev);
  }
  if (by && !S.rxg[by]) {
    const pb = byUid(S, by);
    if (pb) {
      S.rxg[by] = 1;
      rewardIn(S, pb, 1, ev);
    }
  }
}

// Short circuit: the current runs through the Soaked network, damaging and paralysing.
function reactShortCircuit(S, k, base, ev) {
  const N = net(S, k, 'trempe');
  ev.push({ e: 'chain', edges: N.edges, c: 'el' });
  let n = 0;
  for (const x in N.seen) {
    const d = N.seen[x];
    if (S.tiles[x].mark && S.tiles[x].mark.k === 'trempe') {
      S.tiles[x].mark = null;
    }
    const w = unitAt(S, x);
    if (!w) {
      continue;
    }
    if (w.t.includes('Sol')) {
      pushMessage(ev, `${w.n} est insensible au courant.`);
      continue;
    }
    if (w.ability === 'absorbvolt') {
      pushMessage(ev, `${w.n} absorbe le courant.`);
      heal(S, w, 8, ev);
      continue;
    }
    if (x !== k && w.ability !== 'ecranpoudre') {
      damage(S, w, Math.max(2, Math.round(base * 0.5 * Math.pow(0.85, d))), ev, { ind: true });
    }
    if (!w.ko) {
      stun(S, w, 'PAR', ev);
      n++;
    }
  }
  pushMessage(ev, `Court-circuit ! ${n} Pokémon paralysé${n > 1 ? 's' : ''}.`);
}

// Bloom: heals nearby allies and roots the tile.
function reactBloom(S, k, u, ev) {
  [k, ...nbrK(k)].forEach(x => {
    const w = unitAt(S, x);
    if (w && w.side === u.side) {
      heal(S, w, Math.round(w.mhp * 0.2), ev);
    }
  });
  setMark(S, k, 'enracine', u.uid);
  pushMessage(ev, 'Floraison : les alliés proches récupèrent.');
}

// Surge: clears the mark and damages every unit around the tile.
function reactSurge(S, k, t, base, ev) {
  t.mark = null;
  nbrK(k).forEach(x => {
    const w = unitAt(S, x);
    if (w && w.ability !== 'ecranpoudre') {
      damage(S, w, Math.max(2, Math.round(base * 0.5)), ev, { ind: true });
    }
  });
  pushMessage(ev, 'Surtension : explosion !');
}

// Wildfire: fire spreads through the Rooted network, burning the units on it.
function reactWildfire(S, k, u, ev) {
  const N = net(S, k, 'enracine');
  ev.push({ e: 'chain', edges: N.edges, c: 'fire' });
  for (const x in N.seen) {
    setMark(S, x, 'brulant', u.uid);
    const w = unitAt(S, x);
    if (w && x !== k && w.ability !== 'ecranpoudre' && w.ability !== 'torche') {
      damage(S, w, w.ability === 'isograisse' ? 3 : 6, ev, { ind: true });
    }
    if (w && !w.ko && w.ability !== 'torche') {
      w.burn = 3;
    }
  }
  pushMessage(ev, 'Embrasement : le feu se propage.');
}

// Anchor: an ally gains Guard, a foe is rooted (unless protected by a rune).
function reactAnchor(S, t, u, v, ev) {
  t.mark = null;
  if (v) {
    if (v.side === u.side) {
      v.anchor = 2;
      pushMessage(ev, `${v.n} est ancré : +2 Garde.`);
    } else if (hasRune(S, v)) {
      pushMessage(ev, `Rune Protect : ${v.n} est protégé.`);
    } // v4.13
    else {
      v.root = 2;
      pushMessage(ev, `${v.n} est enraciné au sol.`);
    }
  }
}

// Ice floe: the whole Soaked network freezes.
function reactIceFloe(S, k, u, ev) {
  const N = net(S, k, 'trempe');
  ev.push({ e: 'chain', edges: N.edges, c: 'ice' });
  for (const x in N.seen) {
    setMark(S, x, 'givre', u.uid);
    const w = unitAt(S, x);
    if (w) {
      stun(S, w, 'GEL', ev);
    }
  }
  pushMessage(ev, 'Banquise : tout le réseau d’eau gèle.');
}

// Applies the board effect of reaction rx on tile k (t is that tile).
function applyReactionEffect(S, rx, k, t, u, v, base, ev) {
  switch (rx) {
    case 'cc':
      reactShortCircuit(S, k, base, ev);
      break;
    case 'vap':
      [k, ...nbrK(k)].forEach(x => {
        S.tiles[x].fog = 2;
      });
      t.mark = null;
      pushMessage(ev, 'Vapeur : un brouillard couvre la zone.');
      break;
    case 'flo':
      reactBloom(S, k, u, ev);
      break;
    case 'gel':
      if (v) {
        stun(S, v, 'GEL', ev);
      }
      setMark(S, k, 'givre', u.uid);
      pushMessage(ev, 'Gel !');
      break;
    case 'bou':
      t.mud = 3;
      t.mark = null;
      pushMessage(ev, 'Boue : la case ralentit pendant 3 manches.');
      break;
    case 'sur':
      reactSurge(S, k, t, base, ev);
      break;
    case 'ter':
      t.mark = null;
      u.guard = 2;
      pushMessage(ev, `Mise à la terre : ${u.n} gagne +2 Garde.`);
      break;
    case 'emb':
      reactWildfire(S, k, u, ev);
      break;
    case 'fon':
      setMark(S, k, 'trempe', u.uid);
      pushMessage(ev, 'Fonte : choc thermique, la case devient Trempée.');
      break;
    case 'cou':
      t.lava = 2;
      t.mark = null;
      pushMessage(ev, 'Coulée : la case devient lave.');
      break;
    case 'bri':
      t.mark = null;
      pushMessage(ev, 'Bris : dégâts doublés.');
      break;
    case 'anc':
      reactAnchor(S, t, u, v, ev);
      break;
    case 'ban':
      reactIceFloe(S, k, u, ev);
      break;
    case 'sei':
      nbrK(k).forEach(x => setMark(S, x, 'fissure', u.uid));
      setMark(S, k, 'fissure', u.uid);
      pushMessage(ev, 'Onde sismique : le sol se fissure.');
      break;
  }
}

// Triggers reaction rx on tile k: bookkeeping and rewards first, then the board effect.
function react(S, rx, k, u, v, base, ev) {
  const t = S.tiles[k],
    by = t.mark ? t.mark.by : null;
  recordReaction(S, rx, k, u, by, ev);
  applyReactionEffect(S, rx, k, t, u, v, base, ev);
}

export function endStep(S, ev) {
  HOOKS.beforeVerdict.forEach(h => h(S, ev));
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
      pushMessage(ev, `${e.n} a déjà agi cette manche.`);
      return;
    }
    e.force = { fx, by: src.uid };
    ev.push({ e: 'ret', u: e.uid });
    pushMessage(
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
    pushMessage(ev, `${e.n} n’a aucune attaque à détourner.`);
    return;
  }
  let tgt = null;
  if (fx === 'taunt') {
    tgt = src;
  } else {
    const pool = S.units.filter(o => !o.ko && o !== e && (fx === 'turn' ? o.side === e.side : true));
    pool.sort((a, b) => hdist(a.pos, e.pos) - hdist(b.pos, e.pos));
    tgt = pool[0] || null;
  }
  if (!tgt) {
    e.intent = null;
    pushMessage(ev, `L’attaque de ${e.n} est annulée.`);
    return;
  }
  e.intent.k = unitKey(tgt);
  ev.push({ e: 'ret', u: e.uid });
  pushMessage(ev, `${e.n} vise désormais ${tgt.n}.`);
}

// Records the move as the latest action and announces it in the journal.
function announceMove(S, u, m, k, typ, ev) {
  S.lastAtk = u.uid;
  S.rxg = {};
  ev.push({ e: 'use', u: u.uid, k, ty: typ });
  S.lastActor = u.uid; // tactical log (v4.30)
  pushMessage(ev, `${u.n} utilise ${m.n} !`);
}

// Weather move: sets the weather and its duration.
function applyWeatherMove(S, u, m, ev) {
  S.wx = { k: m.wx, n: u.item === 'rochemeteo' ? 8 : 5 }; // Weather Rock (v4.14)
  pushMessage(ev, `Météo ${WXN[m.wx]} pendant ${S.wx.n} manches.`);
}

// Self-targeted move: guard, protect, boost, heals, rest, reflect or a registered self effect.
function applySelfMove(S, u, m, ev) {
  if (m.fx === 'guard') {
    u.guard = 2;
    pushMessage(ev, `${u.n} gagne +2 Garde.`);
  } else if (m.fx === 'protect') {
    u.prot = 1;
    pushMessage(ev, `${u.n} se met à l’abri.`);
  } else if (m.fx === 'boost') {
    u.boost = 2;
    pushMessage(ev, `${u.n} aiguise ses attaques.`);
  } else if (m.fx === 'selfheal') {
    heal(S, u, Math.round(u.mhp * (S.wx && S.wx.k === 'soleil' ? 0.6 : 0.4)), ev);
  } else if (m.fx === 'rest') {
    heal(S, u, Math.round(u.mhp * 0.5), ev);
    u.skip = 1;
    u.badge = 'SOM';
    pushMessage(ev, `${u.n} s’endort.`);
  } else if (m.fx === 'reflect') {
    S.units.forEach(o => {
      if (!o.ko && o.side === u.side && hdist(o.pos, u.pos) <= 1) {
        o.guard = 2;
      }
    });
    pushMessage(ev, `Protection : ${u.n} et ses voisins gagnent +2 Garde.`);
  } else if (SELF_MOVE_EFFECTS[m.fx]) {
    SELF_MOVE_EFFECTS[m.fx](S, u, ev);
  } // v4.12
}

// Tile-placed moves (trap, Future Sight); returns true when the move was one of them.
function applyPlacedMove(S, u, m, k, ev) {
  if (m.fx === 'piege') {
    placeTrap(S, u, m, k, ev); // traps (v4.8)
    return true;
  }
  if (m.fx === 'presc') {
    placeForesight(S, u, m, k, ev); // Future Sight (v4.12)
    return true;
  }
  return false;
}

// Non-damaging moves on the main target (swaps, heal, help, retarget…); returns true when one applied.
function applyUtilityMove(S, u, m, v0, ev) {
  if (m.fx === 'swap' && v0 && !v0.colossus && !v0.seg) {
    const a = u.pos;
    u.pos = v0.pos;
    v0.pos = a;
    ev.push({ e: 'mv', u: u.uid }, { e: 'mv', u: v0.uid });
    pushMessage(ev, `${u.n} échange sa place avec ${v0.n}.`);
    landed(S, v0, ev);
    return true;
  }
  if (m.fx === 'swapally' && v0) {
    const a = u.pos;
    u.pos = v0.pos;
    v0.pos = a;
    v0.guard = 2;
    ev.push({ e: 'mv', u: u.uid }, { e: 'mv', u: v0.uid });
    pushMessage(ev, `Relais avec ${v0.n} : +2 Garde.`);
    return true;
  }
  if (m.fx === 'heal' && v0) {
    heal(S, v0, Math.round(v0.mhp * 0.3), ev);
    return true;
  }
  if (m.fx === 'aide' && v0) {
    v0.aide = 1; // Helping Hand (v4.12)
    ev.push({ e: 'st', u: v0.uid, s: 'AIDE' });
    pushMessage(ev, `Coup d’Main : la prochaine attaque de ${v0.n} cette manche frappera ×1,5.`);
    return true;
  }
  if (m.fx === 'mitra' && u.touche) {
    pushMessage(ev, `${u.n} a été touché : il perd sa concentration, Mitra-Poing échoue.`); // v4.13
    return true;
  }
  if (PRE_MOVE_EFFECTS[m.fx] && v0) {
    PRE_MOVE_EFFECTS[m.fx](S, u, m, v0, ev); // Curse, Will-O-Wisp, Swagger, Transform (v4.13)
    return true;
  }
  if (['taunt', 'turn', 'confuse'].includes(m.fx) && v0) {
    retarget(S, v0, u, m.fx, ev);
    return true;
  }
  return false;
}

// Finds the reaction triggered on tile x and its damage multiplier; a reinforcement strengthens the mark instead.
function tileReaction(S, m, family, t, x, mk, ev) {
  let rx = null,
    mult = 1,
    ren = false;
  if (family && mk && (m.p || m.fix || m.mk)) {
    rx = MX[mk][EL.indexOf(family)] || null;
  }
  if (rx === 'ren') {
    ren = true;
    rx = null;
    if (t.mark) {
      t.mark.d += 1;
      t.mark.lv = 2;
    }
    pushMessage(ev, `Renfort : la marque ${MK.find(z => z.id === mk).n} s’intensifie.`);
  } else if (rx) {
    if (t.mark && t.mark.lv === 2) {
      mult *= 1.25;
    }
    if (rx === 'sur' && moist(S, x)) {
      pushMessage(ev, 'Moiteur empêche la Surtension.');
      rx = null;
    } else {
      mult *= RXM[rx] || 1;
    }
  }
  return { rx, mult, ren };
}

// Deals the move's damage to v (or lets an ability absorb it); returns the reaction base and the damage dealt.
function strikeTarget(S, u, m, v, typ, mult, base, ev) {
  let dealt = 0,
    reactionBase = base;
  const dmg = dmgOf(S, u, m, v, typ, mult),
    b0 = dmgOf(S, u, m, v, typ, 1);
  if (b0 > 0) {
    reactionBase = b0;
  }
  if (dmg > 0) {
    if (typ === 'Eau' && v.ability === 'absorbeau') {
      pushMessage(ev, `${v.n} absorbe l’eau.`);
      heal(S, v, dmg, ev);
    } else if (typ === 'Électrik' && v.ability === 'absorbvolt') {
      pushMessage(ev, `${v.n} absorbe le courant.`);
      heal(S, v, dmg, ev);
    } else if (typ === 'Électrik' && v.ability === 'paratonnerre') {
      pushMessage(ev, `Paratonnerre : ${v.n} attire la foudre et se renforce.`); // v4.13
      v.boost = Math.max(v.boost, 2);
    } else if (typ === 'Feu' && v.ability === 'torche') {
      pushMessage(ev, `Torche : ${v.n} absorbe les flammes et renforce ses attaques.`);
      v.boost = 2;
    } else {
      const e = teff(typ, v.t) || 1; // 0 only under Gravity (v4.13)
      dealt += damage(S, v, dmg, ev, {});
      if (e > 1) {
        pushMessage(ev, 'C’est super efficace !');
      } else if (e < 1) {
        pushMessage(ev, 'Ce n’est pas très efficace.');
      }
    }
  } else if (teff(typ, v.t) === 0 || (typ === 'Sol' && v.ability === 'levitation')) {
    pushMessage(ev, `Ça n’affecte pas ${v.n}.`);
  } else if (m.fx === 'devoreve') {
    pushMessage(ev, `${v.n} ne dort pas : Dévorêve échoue.`);
  } // v4.12
  return { base: reactionBase, dealt };
}

// Resolves the move on one affected tile (damage, on-hit effects, reaction or mark); returns the damage dealt.
function hitTile(S, u, m, typ, family, sb, x, ev) {
  let dealt = 0;
  const t = S.tiles[x],
    v = outOfReach(S, unitAt(S, x), u, ev),
    mk = markAt(S, x);
  if (m.fx === 'smoke') {
    t.fog = 2;
    return dealt;
  }
  const { rx, mult, ren } = tileReaction(S, m, family, t, x, mk, ev);
  let base = Math.round(((m.p || 4) + u.s[1] * 2) * sb);
  if (v && !(v.side === u.side && m.sh === 'one') && (m.p || m.fix)) {
    const hit = strikeTarget(S, u, m, v, typ, mult, base, ev);
    base = hit.base;
    dealt += hit.dealt;
  }
  if (v && !v.ko && v.side !== u.side && TARGET_MOVE_EFFECTS[m.fx]) {
    TARGET_MOVE_EFFECTS[m.fx](S, u, v, x, mk, ev);
  } // Icy Wind, Dragon Breath, Sludge Bomb (v4.12)
  if (v) {
    afterHitSignatures(S, u, m, v, x, mk, typ, ev);
  } // Triple Kick, Psywave, Cursed Body, Conversion 2 (v4.13)
  if (v) {
    afterHitResonance(S, u, m, v, x, typ, ev);
  } // Resonance notes (v4.14)
  if (rx) {
    react(S, rx, x, u, v && !v.ko ? v : null, base, ev);
  } else if (m.mk && !ren) {
    setMark(S, x, m.mk, u.uid);
  }
  return dealt;
}

// Area aftermath of the move: smoke message and Cut on tall grass.
function applyAreaAftermath(S, m, k, ev) {
  if (m.fx === 'smoke') {
    pushMessage(ev, 'Un brouillard épais se lève.');
  }
  if (m.fx === 'cut' && S.tiles[k] && S.tiles[k].grass) {
    S.tiles[k].grass = false; // HM01 Cut
    pushMessage(ev, 'Coupe : les hautes herbes sont fauchées.');
    ev.push({ e: 'terrain', k });
  }
}

// Control effects on the surviving enemy main target: push, pull, paralysis, sleep, web, root.
function applyControlEffects(S, u, m, v1, mk0, ev) {
  if (m.fx === 'push') {
    shove(S, v1, u.pos, m.v, ev, false);
  }
  if (m.fx === 'pull') {
    if (mk0 === 'charge' || (u.ability === 'magnepiege' && v1.t.includes('Acier'))) {
      shove(S, v1, u.pos, m.v, ev, true);
    } else {
      pushMessage(ev, 'Aimant : la cible n’est pas Chargée.');
    }
  }
  if (m.fx === 'parc' && mk0 === 'charge') {
    stun(S, v1, 'PAR', ev);
  }
  if (m.fx === 'sleep') {
    stun(S, v1, 'SOM', ev);
  }
  if (m.fx === 'web') {
    if (v1.ability === 'regardvif' || hasRune(S, v1)) {
      pushMessage(ev, `${v1.n} ignore l’entrave.`);
    } else {
      v1.web = 2;
      pushMessage(ev, `${v1.n} est ralenti.`);
    }
  }
  if (m.fx === 'root') {
    if (v1.ability === 'regardvif' || hasRune(S, v1)) {
      pushMessage(ev, `${v1.n} ignore l’entrave.`);
    } else {
      v1.root = Math.max(v1.root, m.v || 2);
      pushMessage(ev, `${v1.n} ne peut plus bouger.`);
    }
  }
}

// Effects on the user after the move: drain, Helping Hand, signatures, held items, recoil, guard, recharge.
function applyUserAftermath(S, u, m, k, v0, v1, dealt, ev) {
  if (m.fx === 'drain' && dealt > 0) {
    heal(S, u, Math.ceil(dealt / 2), ev);
  }
  if (m.fx === 'devoreve' && dealt > 0) {
    heal(S, u, Math.ceil(dealt / 2), ev);
  } // Dream Eater (v4.12)
  if (u.aide && (m.p || m.fix)) {
    u.aide = 0;
  } // Helping Hand consumed (v4.12)
  afterMoveSignatures(S, u, m, k, v0, v1, dealt, ev); // signatures (v4.13)
  afterMoveHeldItems(S, u, m, dealt, ev); // Life Orb (v4.14)
  if (m.fx === 'recoil' && dealt > 0) {
    pushMessage(ev, `${u.n} subit le contrecoup.`);
    damage(S, u, Math.max(1, Math.round(dealt * 0.25)), ev, { ind: true });
  }
  if (m.fx === 'gguard' && !u.ko) {
    u.guard = 2;
  }
  if (m.fx === 'recharge' && !u.ko) {
    u.skip = 1;
    u.badge = 'REC';
    pushMessage(ev, `${u.n} doit recharger.`);
  }
}

export function resolveMove(S, u, m, k) {
  const ev = [];
  if (u.ko) {
    return ev;
  }
  const typ = mvType(S, u, m);
  announceMove(S, u, m, k, typ, ev);
  if (m.wx) {
    applyWeatherMove(S, u, m, ev);
    return endStep(S, ev);
  }
  if (m.sh === 'self') {
    applySelfMove(S, u, m, ev);
    return endStep(S, ev);
  }
  if (applyPlacedMove(S, u, m, k, ev)) {
    return endStep(S, ev);
  }
  const v0 = outOfReach(S, unitAt(S, k), u, null), // airborne: untouchable (v4.8)
    mk0 = markAt(S, k);
  if (applyUtilityMove(S, u, m, v0, ev)) {
    return endStep(S, ev);
  }
  const family = typ === 'Dragon' ? null : FAMT[typ] || null,
    sb = u.t.includes(typ) ? 1.2 : 1;
  let dealt = 0;
  for (const x of affected(S, u, m, k)) {
    dealt += hitTile(S, u, m, typ, family, sb, x, ev);
  }
  applyAreaAftermath(S, m, k, ev);
  const v1 = v0 && !v0.ko ? v0 : null;
  if (v1 && v1.side !== u.side) {
    applyControlEffects(S, u, m, v1, mk0, ev);
  }
  applyUserAftermath(S, u, m, k, v0, v1, dealt, ev);
  return endStep(S, ev);
}

/* player actions */
export function pMove(S, u, k) {
  const retreat = !!(u && u.hr && u.acted && !u.moved); // a Scout that has struck can still fall back
  if (retreat) {
    u.acted = false;
  }
  let ev = null;
  try {
    if (S.phase !== 'player' || u.moved || u.acted || u.ko) {
      return null;
    }
    if (reach(S, u)[k] === undefined) {
      return null;
    }
    ev = [];
    u.pos = P(k);
    u.moved = true;
    ev.push({ e: 'mv', u: u.uid });
    landed(S, u, ev);
    if (S.duel433) {
      duelVigilance(S, u, ev);
    } // duel: the opponent's Vigilance (v4.33)
    ev = endStep(S, ev);
  } finally {
    if (retreat) {
      u.acted = true;
    }
  }
  if (retreat) {
    u.hr = 0;
    pushMessage(ev, `${u.n} se replie.`);
  }
  return ev;
}

export function pAct(S, u, mi, k) {
  if (S.phase !== 'player' || u.acted || u.ko) {
    return null;
  }
  const m = MV[u.mv[mi]];
  if (!m || !targets(S, u, m).includes(k)) {
    return null;
  }
  const dso = disobeys(S, u); // disobedience (v4.10)
  if (dso) {
    u.acted = true;
    u.moved = true;
    return dso;
  }
  const previous = REPLAYS.has(S) ? JSON.stringify(S) : null; // best-move replay (v4.11)
  const xpC = m.xp ? xpCost(u) : 0,
    tch0 = u.touche; // Expert attack (v4.14)
  const mv0 = u.moved,
    ev = deferredCharge(S, u, m) ? launchCharge(S, u, mi, k) : resolve(S, u, m, k); // charged attacks (v4.8)
  if (xpC && !(m.fx === 'mitra' && tch0)) {
    u.en = Math.max(0, u.en - xpC);
    pushMessage(ev, `Attaque Experte : ${u.n} libère ${xpC} losange${xpC > 1 ? 's' : ''} de Résonance.`);
  }
  if (u.item === 'mouchoir' && !u.choice) {
    u.choice = u.mv[mi];
  } // Choice Scarf (v4.14)
  u.acted = true;
  u.moved = true;
  chordAfter(S, u, m, ev); // Resonance Chords (v4.10)
  // Scout: strikes first, moves afterwards
  if (!u.ko && !mv0 && u.side === 'a' && (roleOf(u) === 'Éclaireur' || m.fx === 'frappefuite') && !S.over && !u.chg) {
    // Aqua Jet, Bullet Punch (v4.13)
    u.moved = false;
    u.hr = 1;
  }
  if (m.fx === 'morphing' && u.morph && !u.ko && !S.over && u.side === 'a') {
    u.acted = false; // Transform: it immediately strikes with what it copied (v4.13)
    pushMessage(ev, `${u.n} peut encore utiliser une capacité copiée.`);
  }
  if (previous) {
    noteMoment(S, u, m.n, ev, previous);
  }
  return ev;
}

export function rewardIn(S, u, n, ev) {
  if (!u || u.ko || (u.side !== 'a' && !(S && S.duel433)) || !(hasNx(u) || hasXp(u) || resonanceCandidate(S, u))) {
    return;
  } // v4.14: Expert attacks; v4.17: Resonant Form
  const b = u.en;
  u.en = Math.min(EMAX, u.en + n);
  if (u.en > b && ev) {
    ev.push({ e: 'en', u: u.uid, v: u.en - b });
    if (u.en === EMAX && hasNx(u)) {
      ev.push({ e: 'ready', u: u.uid }, { e: 'msg', s: `${u.n} est prêt à s’éveiller.` });
    } else if (u.en === EMAX && !u.resonanceMsg && resonanceCandidate(S, u)) {
      u.resonanceMsg = 1;
      ev.push({ e: 'ready', u: u.uid }, { e: 'msg', s: `${u.n} peut entrer en Forme Résonante.` });
    }
  }
}

export function evoOpts(S, u) {
  const m = BY[u.id];
  if (!m || !m.nx) {
    return [];
  }
  if (m.nx === 'eevee') {
    const o = [],
      mk = markAt(S, unitKey(u));
    if (mk && EEVEE[mk]) {
      o.push(EEVEE[mk]);
    }
    o.push(EEVEE[hourOf(S)]);
    if (u.side === 'a') {
      Object.values(EEVEE).forEach(x => o.includes(x) || o.push(x));
    } // v4.34: your Eevee choose freely
    return o;
  }
  if (BRANCHES[u.id]) {
    return branchOpts(S, u);
  } // v4.13: the path depends on the situation
  return Array.isArray(m.nx) ? [...m.nx] : [m.nx];
}

function branchOpts(S, u) {
  const L = BRANCHES[u.id],
    o = L.filter(b => b.ok(S, u)).map(b => b.id);
  L.forEach(b => {
    if (b.def && !o.includes(b.id)) {
      o.push(b.id);
    }
  });
  return o.length ? o : [L[L.length - 1].id];
}

export function branchWhy(S, u, id) {
  const b = (BRANCHES[u.id] || []).find(x => x.id === id);
  return !b ? '' : b.ok(S, u) ? b.why : 'Voie par défaut';
}

export function nextId(S, u) {
  const o = evoOpts(S, u);
  if (!o.length) {
    return null;
  }
  if (BRANCHES[u.id]) {
    return o[0];
  }
  if (Array.isArray(BY[u.id].nx)) {
    return S.wx && S.wx.k === 'pluie' ? o[1] : o[0];
  }
  return o[0];
}

export function awakeningInfo(S, u) {
  const id = nextId(S, u);
  return id ? BY[id] : null;
}

export function canAwaken(S, u) {
  return (
    !S.sansEveil && // No Awakening challenge (v4.9)
    u.side === 'a' &&
    !u.ko &&
    S.phase === 'player' &&
    !u.acted &&
    !u.sn &&
    u.en >= EMAX &&
    S.voice >= 1 &&
    evoOpts(S, u).length > 0
  );
}

export function foeEvo(S, e) {
  return e.side === 'e' && !S.duel433 && !e.ko && !e.seg && !e.colossus && e.hp <= e.mhp * 0.5 && hasNx(e);
}

function arrive(S, u, ev) {
  const A = ARR[u.id];
  if (!A) {
    return;
  }
  ev.push({ e: 'arr', u: u.uid });
  pushMessage(ev, `Arrivée de ${u.n} : ${A[1]}`);
  const foes = r => S.units.filter(o => !o.ko && o.side !== u.side && hdist(o.pos, u.pos) <= r),
    mates = r => S.units.filter(o => !o.ko && o.side === u.side && o !== u && hdist(o.pos, u.pos) <= r);
  A[0].forEach(f => {
    if (f.k === 'ring') {
      nbrK(unitKey(u)).forEach(x => setMark(S, x, f.mk, u.uid));
    } else if (f.k === 'wx') {
      S.wx = { k: f.w, n: u.item === 'rochemeteo' ? 8 : 5 }; // Weather Rock (v4.14)
      pushMessage(ev, `Météo ${WXN[f.w]} pendant 5 manches.`);
    } else if (f.k === 'roar') {
      foes(1).forEach(o => shove(S, o, u.pos, f.v, ev, false));
    } else if (f.k === 'heal') {
      mates(f.r).forEach(o => heal(S, o, Math.round(o.mhp * f.p), ev));
    } else if (f.k === 'fog') {
      [unitKey(u), ...nbrK(unitKey(u))].forEach(x => {
        S.tiles[x].fog = 2;
      });
    } else if (f.k === 'sleep') {
      foes(1).forEach(o => stun(S, o, 'SOM', ev, true));
    } else if (f.k === 'confuse') {
      foes(1).forEach(o => {
        if ((o.intent || S.jit) && !o.done) {
          retarget(S, o, u, 'confuse', ev);
        } // v4.13: also without intentions
        else if (o.ability !== 'regardvif') {
          o.web = Math.max(o.web, 2);
          pushMessage(ev, `${o.n} est désorienté et ralenti.`);
        }
      });
    } else if (f.k === 'root') {
      foes(1).forEach(o => {
        if (o.ability === 'regardvif') {
          return;
        }
        o.root = Math.max(o.root, f.v || 2);
        pushMessage(ev, `${o.n} ne peut plus bouger.`);
      });
    } else if (f.k === 'guard') {
      u.guard = 2;
      if (f.who === 'allies') {
        mates(1).forEach(o => {
          o.guard = 2;
        });
      }
    } else if (f.k === 'boost') {
      u.boost = 2;
    }
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
  u.mv = withLearned(u, E.mv); // the move learned by TM or HM is kept (v4.6-01)
  u.ability = E.ability;
  u.sturdy = E.ability === 'fermete';
  const nm = mhpOf(E.s) + (u.hb || 0);
  u.mhp = nm;
  u.hp = Math.min(nm, u.hp + Math.max(0, nm - om) + Math.round(nm * 0.3));
  u.burn = 0;
  u.web = 0;
  u.root = 0;
  u.badge = null;
  u.skip = 0;
  u.evolved = true;
  u.evo++;
  u.en = 0;
  const tt = [...E.t];
  ev.push({ e: 'evo', u: u.uid, from: old, to: E.n, side: u.side, ft: ot, tt });
  if (u.side === 'a') {
    (S.stats.evl = S.stats.evl || []).push([oid, id, S.round]);
  }
  pushMessage(ev, `${old} évolue en ${E.n} !`);
  entryWx(S, u, ev);
  arrive(S, u, ev);
  if (u.fat) {
    u.fat = false;
    pushMessage(ev, `L’Éveil efface la fatigue de ${u.n}.`);
  }
  // types → species, for the evolution illustrations
  PKT.set(u.t, u.id);
  PKT.set(ot, oid);
  PKT.set(tt, id);
}

export function pAwaken(S, u, id) {
  if (!canAwaken(S, u)) {
    return null;
  }
  const o = evoOpts(S, u);
  if (!id) {
    id = nextId(S, u);
  }
  if (!o.includes(id)) {
    return null;
  }
  const ev = [],
    previous = REPLAYS.has(S) ? JSON.stringify(S) : null, // replay (v4.11)
    displayName = u.n,
    inHarmony = BY[u.id].nx === 'eevee' && eeveeHarmony(S, u).includes(id); // Eevee in harmony (v4.34)
  S.lastAtk = u.uid;
  S.voice -= 1;
  S.stats.voice += 1;
  S.stats.evo++;
  S.eveil = true;
  transform(S, u, id, ev);
  if (inHarmony && !u.ko) {
    u.en = Math.min(EMAX, (u.en || 0) + 1);
    pushMessage(ev, `En harmonie : ${u.n} garde 1 losange.`);
  }
  u.acted = true;
  u.moved = true;
  const r = endStep(S, ev);
  if (previous) {
    noteMoment(S, u, null, r, previous, `Éveil : ${displayName} devient ${u.n}`);
  }
  return r;
}

export function pDodge(S, u, k) {
  if (S.phase !== 'player' || S.voice < 1 || u.ko || u.sn) {
    return null;
  }
  if (!nbrK(unitKey(u)).includes(k) || S.tiles[k].rock || unitAt(S, k)) {
    return null;
  }
  const ev = [];
  u.pos = P(k);
  S.voice--;
  S.stats.voice++;
  ev.push({ e: 'mv', u: u.uid });
  pushMessage(ev, `Esquive : ${u.n} se décale.`);
  landed(S, u, ev);
  return endStep(S, ev);
}

export function pReroll(S, u) {
  if (S.phase !== 'player' || S.voice < 2 || S.retrigger || !u.acted || u.ko || u.sn) {
    return null;
  }
  u.acted = false;
  u.moved = false;
  u.restartedRound = 0; // guided turn: the Pokémon restarts from the Move step
  S.retrigger = true;
  S.voice -= 2;
  S.stats.voice += 2;
  return [{ e: 'msg', s: `Relance : ${u.n} peut rejouer.` }];
}

/* opponent phase */
function aiScore(S, e, m, k, pos) {
  const sim = Object.assign({}, e, { pos });
  let sc = 0,
    hitA = false;
  for (const x of affected(S, sim, m, k)) {
    const v = unitAt(S, x);
    if (!v || v === e) {
      continue;
    }
    const d = dmgOf(S, sim, m, v, mvType(S, sim, m), 1);
    if (v.side === 'a') {
      sc += d + (d >= v.hp ? 30 : 0);
      if (d > 0) {
        hitA = true;
      }
    } else {
      sc -= d * 1.2;
    }
  }
  if (!hitA) {
    return -1;
  }
  sc += m.mk ? 1 : 0;
  sc += aiStyleBonus(S, e, m, k, sim); // each gym leader has their own style (v4.4)
  // depending on difficulty: targets fragile or immobile Pokémon, shelters those about to evolve
  const lv = (DIFF[S.diff] || DIFF.normal).ai;
  if (sc <= 0 || !lv) {
    return sc;
  }
  for (const x of affected(S, sim, m, k)) {
    const v = unitAt(S, x);
    if (!v || v.side !== 'a' || v === e) {
      continue;
    }
    const d = dmgOf(S, sim, m, v, mvType(S, sim, m), 1);
    if (d <= 0) {
      continue;
    }
    sc += (Math.min(d, v.hp) / v.mhp) * (lv > 1 ? 14 : 8);
    if (movPts(S, v) === 0 || v.root > 0) {
      sc += lv > 1 ? 8 : 5;
    }
  }
  if (hasNx(e) && e.hp <= e.mhp * 0.5) {
    const th = threatAt(S, e, pos);
    sc -= th >= e.hp ? (lv > 1 ? 45 : 26) : th * (lv > 1 ? 0.5 : 0.3);
  } else if (lv > 1 && threatAt(S, e, pos) >= e.hp) {
    sc -= 12;
  }
  if (lv > 1) {
    sc += expertCoordination(S, e, m, k, pos, sim);
  } // Expert: coordinated attacks (v4.29)
  return sc;
}

export function plan(S, ev) {
  if (!S._obs && S.round === 1) {
    applyObst(S);
  } // obstacles placed before the first intentions
  if (S.duel433) {
    return duelAiPlan(S, ev);
  } // duel: two players, no AI (v4.33)
  S.units
    .filter(e => e.side === 'e' && !e.ko)
    .sort((a, b) => b.s[3] - a.s[3])
    .forEach(e => {
      e.done = false;
      e.intent = null;
      e.isLost = 0; // v4.12: action lost this round (Eclipse…)
      e.force = null; // v4.12: forced target (Charm, Confuse Ray, Supersonic)
      e.prep = false; // v4.12: this round's movement already done
      if (e.skip > 0) {
        e.skip = 0;
        pushMessage(
          ev,
          `${e.n} ${e.badge === 'REC' ? 'doit recharger' : 'est encore ' + (e.badge === 'GEL' ? 'gelé' : e.badge === 'SOM' ? 'endormi' : 'paralysé')}.`
        );
        return;
      }
      e.badge = null;
      chooseAction(S, e, ev); // it positions itself (and, in the old mode, announces its target)
      if (S.jit) {
        e.intent = null;
      } // v4.12: nothing is announced, the target is chosen on its turn
    });
  return ev;
}

/* =====================================================================
   v4.12: hidden intentions
   ---------------------------------------------------------------------
   No more arrows or red cells. At the start of the round, each
   opponent advances in front of you (as before); when it acts, it
   strikes the best target within range from its own cell, based on the
   positions at that moment. You can no longer "step out of the announced
   cell": you have to get out of its range, take cover, protect the fragile.
   Effects that used to act on an intention now act on the action:
   - put to sleep, frozen, paralyzed before its turn: it does not play;
   - Charm, Confuse Ray, Supersonic: its target is imposed on it (force);
   - Eclipse: it loses its action (lost).
   ===================================================================== */
/** The target imposed on an opponent, or null (target gone: it plays normally). */
export function forcedTarget(S, e) {
  const f = e.force;
  if (!f) {
    return null;
  }
  if (f.fx === 'taunt') {
    const s = byUid(S, f.by);
    return s && !s.ko ? s : null;
  }
  const pool = S.units.filter(o => !o.ko && o !== e && (f.fx === 'turn' ? o.side === e.side : true));
  pool.sort((a, b) => hdist(a.pos, e.pos) - hdist(b.pos, e.pos));
  return pool[0] || null;
}

/** Score of an attack against the imposed target: only the damage dealt to it counts. */
function targetScore(S, e, m, k, pos, F) {
  const sim = Object.assign({}, e, { pos });
  let sc = 0;
  for (const x of affected(S, sim, m, k)) {
    const v = unitAt(S, x);
    if (v === F) {
      sc += dmgOf(S, sim, m, v, mvType(S, sim, m), 1) + 0.5;
    }
  }
  return sc;
}

/** Out of range of its imposed target: it moves closer. */
function approach(S, e, opts, F, here) {
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

/** An opponent's decision: position itself, then aim (called on its turn in hidden mode). */
function chooseAction(S, e, ev, inPlace) {
  const F = S.jit && inPlace ? forcedTarget(S, e) : null;
  const al = S.units.filter(a => a.side === 'a' && !a.ko);
  if (!al.length) {
    return;
  }
  const here = unitKey(e),
    opts = Object.assign({ [here]: 0 }, inPlace ? {} : reach(S, e));
  let best = null;
  for (const pk in opts) {
    const pos = P(pk),
      sim = Object.assign({}, e, { pos }),
      pen =
        (markAt(S, pk) === 'trempe' && !e.t.includes('Sol') ? 1.5 : 0) +
        (S.tiles[pk].lava > 0 ? 6 : 0) +
        (hostileTrap(S, e, pk) ? 7 : 0) -
        (pk === here ? 0.5 : 0);
    e.mv.forEach(mid => {
      const m = MV[mid];
      if (m.wx || !(m.p || m.fix) || m.sh === 'self' || m.sh === 'ally' || !canXP(S, e, m)) {
        return;
      }
      let cands = [];
      if (m.sh === 'ring') {
        cands = [pk];
      } else {
        (F ? [F] : al).forEach(a => {
          const ak = unitKey(a);
          if (S.tiles[ak].fog > 0 && hdist(pos, a.pos) > 1) {
            return;
          }
          if (inReach(S, sim, m, ak)) {
            cands.push(ak);
          }
        });
      }
      if (F) {
        cands = cands.filter(k => affected(S, sim, m, k).some(x => unitAt(S, x) === F));
      }
      cands.forEach(k => {
        const s = F ? targetScore(S, e, m, k, pos, F) : aiScore(S, e, m, k, pos);
        if (s <= 0) {
          return;
        }
        const sc = s - pen;
        if (!best || sc > best.sc) {
          best = { sc, pk, mid, k };
        }
      });
    });
  }
  if (!best && !F) {
    best = aiSupportMove(S, e, opts, al, here);
  } // support moves of the new families (v4.13)
  const pg = F ? null : trapPlan(S, e, best, al); // place a trap (v4.8)
  if (pg) {
    e.intent = pg;
  } else if (best) {
    if (best.pk !== here) {
      e.pos = P(best.pk);
      e.mvR = S.round; // Pursuit (v4.13)
      ev.push({ e: 'mv', u: e.uid });
      trapArrival(S, e, ev);
    }
    e.intent = { mv: best.mid, k: best.k };
  } else if (inPlace) {
    if (F) {
      pushMessage(ev, `${e.n} ne peut pas atteindre ${F.n}.`);
    } // no imposed target: it waits, quietly
  } else if (!e.seg) {
    const [bk, lab] = F ? approach(S, e, opts, F, here) : aiFallback(S, e, opts, al, here);
    if (bk !== here) {
      e.pos = P(bk);
      e.mvR = S.round; // Pursuit (v4.13)
      ev.push({ e: 'mv', u: e.uid });
      trapArrival(S, e, ev);
    }
    pushMessage(ev, `${e.n} ${lab}.`);
  }
}

/** Hidden mode: the opponent positions itself for its action (separate from the attack, so the eye can follow). */
export function prepareEnemy(S, uid) {
  const e = byUid(S, uid),
    ev = [];
  if (!S.jit || !e || e.ko || S.over || e.done || e.prep) {
    return ev;
  }
  e.prep = true;
  if (e.badge || e.isLost) {
    return ev;
  }
  const F = forcedTarget(S, e);
  if (F && e.force) {
    pushMessage(
      ev,
      e.force.fx === 'taunt'
        ? `${e.n} ne voit plus que ${F.n}.`
        : e.force.fx === 'turn'
          ? `${e.n}, troublé, se retourne contre ${F.n} !`
          : `${e.n}, désorienté, s’en prend à ${F.n}.`
    );
  }
  chooseAction(S, e, ev, true);
  vigilanceStrike(S, e, ev); // Vigilance: interception before the attack (v4.20)
  return endStep(S, ev);
}

export function threatZone(S, e) {
  const key =
    S.round + '|' + e.uid + '|' + S.units.map(u => (u.ko ? 'x' : unitKey(u))).join(';') + '|' + (S.wx ? S.wx.k : '');
  if (THREAT.k === key) {
    return THREAT.z;
  }
  const z = new Set(),
    opts = Object.assign({ [unitKey(e)]: 0 }, e.badge || e.isLost ? {} : reach(S, e));
  if (!(e.badge || e.isLost)) {
    for (const pk in opts) {
      const sim = Object.assign({}, e, { pos: P(pk) });
      e.mv.forEach(mid => {
        const m = MV[mid];
        if (!m || m.wx || !(m.p || m.fix) || m.sh === 'self' || m.sh === 'ally' || !canXP(S, e, m)) {
          return;
        }
        if (m.sh === 'ring') {
          nbrK(pk).forEach(k => z.add(k));
          return;
        }
        for (const k in S.tiles) {
          if (S.tiles[k].rock || !inReach(S, sim, m, k)) {
            continue;
          }
          affected(S, sim, m, k).forEach(x => z.add(x));
        }
      });
    }
  }
  THREAT.k = key;
  THREAT.z = [...z];
  return THREAT.z;
}

export function startEnemy(S) {
  S.phase = 'enemy';
  return enemyOrder(S); // OrderByPhases strategy of the tactical engine (v4.5-01)
}

export function execFoe(S, uid) {
  const e = byUid(S, uid),
    ev = [];
  if (!e || e.ko || S.over) {
    return ev;
  }
  if (S.jit) {
    if (e.done) {
      return ev;
    }
    if (e.badge || e.isLost) {
      e.done = true;
      pushMessage(ev, `${e.n} ne peut pas agir.`);
      return ev;
    }
    if (!e.prep) {
      prepareEnemy(S, uid).forEach(x => ev.push(x));
    } // test robots, direct calls
    e.done = true;
    if (e.ko || S.over) {
      return endStep(S, ev);
    }
  } else {
    e.done = true;
  }
  if (!e.intent) {
    if (e.badge) {
      pushMessage(ev, `${e.n} ne peut pas agir.`);
    }
    return ev;
  }
  const m = MV[e.intent.mv],
    k = e.intent.k;
  e.intent = null;
  let r = ev;
  if (!inReach(S, e, m, k)) {
    pushMessage(ev, `${e.n} utilise ${m.n}, mais la cible est hors de portée !`);
  } else {
    const tgt = m.sh === 'one' ? unitAt(S, k) : null;
    if (m.xp) {
      e.en = Math.max(0, (e.en || 0) - xpCost(e));
    } // Expert attack (v4.14)
    r = resolve(S, e, m, k);
    if (m.sh === 'one' && !tgt) {
      r.push({ e: 'msg', s: 'La case visée est vide : l’attaque se perd.' });
    }
    if (tgt && !tgt.ko && tgt.ability === 'statik' && !e.ko && hdist(e.pos, tgt.pos) === 1) {
      setMark(S, unitKey(e), 'charge', tgt.uid);
      r.push({ e: 'msg', s: `Statik : ${e.n} est Chargé.` });
    }
  }
  if (!e.ko && !S.over && roleOf(e) === 'Éclaireur' && !(e.root > 0)) {
    foeRetreat(S, e, r);
  }
  return r;
}

/* end of round: role support, round effects, then Leftovers */
export function endRound(S) {
  S.lastActor = null; // end-of-round effects have no author (v4.30)
  const ch = [];
  HOOKS.beforeRoundEnd.forEach(h => h(S, ch)); // charged attacks, trap wear (v4.8)
  if (S.over) {
    return ch;
  }
  const pre = ch.concat(roundSupport(S)),
    ev = roundEffects(S);
  if (!S.over) {
    S.units.forEach(u => {
      if (!u.ko && u.item === 'restes' && u.hp < u.mhp) {
        heal(S, u, 3, ev);
      }
    });
  }
  return pre.concat(ev);
}

/** End-of-round effects of a Pokémon: burn, poison, weather, lava, durations (v4.33: separate function for the duel). */
export function unitRoundEffects(S, u, ev) {
  if (u.ko) {
    return;
  }
  if (u.burn > 0) {
    pushMessage(ev, `${u.n} souffre de sa brûlure.`);
    damage(S, u, u.ability === 'isograisse' ? 1 : 3, ev, { ind: true });
    u.burn--;
  }
  if (u.poisoned > 0 && !u.ko) {
    pushMessage(ev, `${u.n} souffre du poison.`); // Sludge Bomb (v4.12)
    damage(S, u, 3, ev, { ind: true });
    u.poisoned--;
  }
  u.aide = 0;
  if (S.wx && !u.ko) {
    if (S.wx.k === 'grele' && !u.t.includes('Glace')) {
      damage(S, u, 2, ev, { ind: true });
    }
    if (S.wx.k === 'sable' && !u.t.some(t => ['Roche', 'Sol', 'Acier'].includes(t))) {
      damage(S, u, 2, ev, { ind: true });
    }
  }
  if (!u.ko && S.tiles[unitKey(u)].lava > 0 && !flies(u)) {
    damage(S, u, u.ability === 'isograisse' ? 2 : 4, ev, { ind: true });
  }
  ['web', 'guard', 'anchor', 'root', 'boost'].forEach(f => {
    if (u[f] > 0) {
      u[f]--;
    }
  });
  u.prot = 0;
  if (u.ability === 'mue') {
    u.burn = 0;
    u.poisoned = 0;
    u.web = 0;
    u.root = 0;
  }
}

function roundEffects(S) {
  const ev = [];
  if (S.over) {
    return ev;
  }
  S.units.forEach(u => {
    if (u.ko || (S.duel433 && u.duelPlayer === 2)) {
      return;
    } // duel: Player 2's at the start of their turn (v4.33)
    unitRoundEffects(S, u, ev);
  });
  for (const k in S.tiles) {
    const t = S.tiles[k];
    if (t.mark) {
      t.mark.d--;
      if (t.mark.d <= 0 || (S.wx && S.wx.k === 'soleil' && t.mark.k === 'trempe')) {
        t.mark = null;
      }
    }
    ['mud', 'lava', 'fog'].forEach(f => {
      if (t[f] > 0) {
        t[f]--;
      }
    });
  }
  aliveRound(S, ev); // living board: fire, rain, hail and time of day (v4.7-01)
  tickFieldEffects(S, ev); // Tailwind, Trick Room (v4.12)
  if (S.wx) {
    S.wx.n--;
    if (S.wx.n <= 0) {
      pushMessage(ev, `La météo ${WXN[S.wx.k]} se dissipe.`);
      S.wx = null;
    }
  }
  S.units
    .filter(e => foeEvo(S, e))
    .forEach(e => {
      pushMessage(ev, `${e.n} puise dans ses dernières forces…`);
      transform(S, e, nextId(S, e), ev);
    });
  endStep(S, ev);
  if (S.over) {
    return ev;
  }
  if (S.round >= S.lim) {
    S.over = 'lose';
    S.timeout = true;
    if ((SCEN[S.sc] || {}).roam) {
      S.fled = true;
    } // wandering beast (v4.16)
    pushMessage(
      ev,
      S.duel433
        ? 'Temps écoulé : les PV restants départagent les joueurs.'
        : S.fled
          ? fleeMessage(S)
          : 'Temps écoulé : l’adversaire tient la position.'
    );
    ev.push({ e: 'over' });
    return ev;
  }
  S.round++;
  S.retrigger = false;
  S.voice = S.vmax;
  S.phase = 'player';
  S.lastAtk = null;
  S.units.forEach(u => {
    if (u.side === 'a' && !u.ko && !S.duel433) {
      rewardIn(S, u, 1, ev);
    } // duel: at the start of each player's turn (v4.33)
  });
  S.units.forEach(u => {
    if (u.ko) {
      return;
    }
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
  __set_NOTE([]); // coverage, ricochet and guarding notes
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
      can =
        !!(o.intent && !x.intent && !x.ko) || !!(S.jit && x.side === 'e' && !x.ko && !o.done && x.isLost && !o.isLost),
      ret = !!(o.intent && x.intent && o.intent.k !== x.intent.k) || !!(S.jit && x.force && !o.force),
      mv = o.pos[0] !== x.pos[0] || o.pos[1] !== x.pos[1],
      ko = x.ko && !o.ko,
      rt = x.root > o.root,
      wb = x.web > o.web,
      evw = x.side === 'e' && !x.ko && hasNx(x) && x.hp <= x.mhp * 0.5 && o.hp > o.mhp * 0.5,
      en = x.side === 'a' ? x.en - o.en : 0;
    if (dh || st || ko || can || ret || mv || rt || wb || evw || en > 0) {
      diff.push({ uid: x.uid, n: x.n, side: x.side, dh, st, ko, can, ret, mv, rt, wb, evw, en });
    }
  });
  const su = byUid(S, uid);
  return {
    diff,
    rxs: ev.filter(e => e.e === 'rx').map(e => e.rx),
    aff: affected(S, su, MV[su.mv[mi]], k),
    over: C.over,
    wx: ev.some(e => e.e === 'msg' && e.s.startsWith('Météo')),
    notes: NOTE,
  };
}

/* ===================== BATTLE ENGINE v0.8 ===================== */
export const K = (c, r) => c + ',' + r;

export const P = k => k.split(',').map(Number);

export const inBoard = (c, r) => c >= 0 && c < BW && r >= 0 && r < BH;

export const CDIR = [
  [1, -1, 0],
  [1, 0, -1],
  [0, 1, -1],
  [-1, 1, 0],
  [-1, 0, 1],
  [0, -1, 1],
];

export const nbrK = k => neighbors(P(k)).map(q => K(q[0], q[1]));

export const mhpOf = s => 20 + s[0] * 8;

export const unitKey = u => K(u.pos[0], u.pos[1]);

export const unitAt = (S, k) => S.units.find(u => !u.ko && unitKey(u) === k);

export const byUid = (S, id) => S.units.find(u => u.uid === id);

export const flies = u => !u.pinned && (u.t.includes('Vol') || u.ability === 'levitation');

export const effR = (u, m, S) =>
  m.r +
  (u.ability === 'oeilcompose' && m.r > 0 ? 1 : 0) +
  (u.colossus && m.r > 0 ? 2 : 0) -
  nightRange(S, u, m) +
  (m.pluie && S && S.wx && S.wx.k === 'pluie' ? 2 : 0) +
  (u.item === 'lentillezoom' && m.r >= 2 ? 1 : 0);

export const NEEDU = [
  'swap',
  'swapally',
  'push',
  'pull',
  'web',
  'confuse',
  'turn',
  'taunt',
  'heal',
  'parc',
  'sleep',
  'root',
];

export const HOSTILE = ['confuse', 'turn', 'taunt', 'push', 'pull', 'web', 'parc', 'sleep', 'root'];

const RXM = { fon: 1.5, bri: 2, sur: 1.3 };

export const EMAX = 3;

export const hasNx = u => !!(BY[u.id] && BY[u.id].nx);

/* v4.13 · Branching Awakenings: each path has its own condition; the "default" path always stays open */
const onContact = (S, u, camp) =>
  S.units.filter(
    o => !o.ko && o !== u && (camp === 'allie' ? o.side === u.side : o.side !== u.side) && hdist(o.pos, u.pos) === 1
  ).length;

/** v4.12: every cell an opponent can reach this turn (movement + range of its attacks). */
const THREAT = { k: '', z: [] };

export const BRANCHES = {
  tetarte: [
    {
      id: 'tarpaud',
      why: 'Case Trempée ou Pluie',
      ok: (S, u) => markAt(S, unitKey(u)) === 'trempe' || !!(S.wx && S.wx.k === 'pluie'),
    },
    { id: 'tartard', why: 'Un adversaire au contact', ok: (S, u) => onContact(S, u) > 0, def: 1 },
  ],
  ramoloss: [
    { id: 'roigada', why: 'Un allié au contact', ok: (S, u) => onContact(S, u, 'allie') > 0 },
    { id: 'flagadoss', why: 'Case Trempée', ok: (S, u) => markAt(S, unitKey(u)) === 'trempe', def: 1 },
  ],
  debugant: [
    { id: 'kapoera', why: '2 adversaires au contact', ok: (S, u) => onContact(S, u) >= 2 },
    { id: 'kicklee', why: 'PV au-dessus de 50 %', ok: (S, u) => u.hp > u.mhp / 2 },
    { id: 'tygnon', why: 'PV à 50 % ou moins', ok: (S, u) => u.hp <= u.mhp / 2 },
  ],
};

// Instructions run at startup, in the original order (see index.js).
export function init() {
  ((BW = 8), (BH = 6));
}
