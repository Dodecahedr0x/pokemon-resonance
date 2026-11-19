/* Original section: v4.20-01-intense-combat.js */

import { MV } from './005-moves.js';
import { SCEN } from './009-pokemon.js';
import { toast } from './014-utils.js';
import { HOOKS } from './015-hooks.js';
import {
  EMAX,
  P,
  byUid,
  damage,
  endStep,
  hdist,
  heal,
  inReach,
  nbrK,
  say,
  setMark,
  uAt,
  uk,
} from './021-combat-engine.js';
import { resolve } from './023-roles-synergies-obstacles.js';
import { B, autoSel, clearAim, log, renderAll, ui } from './024-combat-ui.js';
import { DAMAGE_PROVIDERS } from './044-tactical-engine.js';
import { ACHIEVEMENTS } from './048-replayability.js';
import { hasXp, bossScene } from './053-resonance.js';
import { MARK_T416 } from './055-living-johto.js';
import { rage460, repl460 } from './091-phase-bosses-secret-places.js';

/* =====================================================================
   v4.20: more intense battles
   1. Vigilance: a Pokémon gives up its attack to keep watch; it
      strikes the first opponent that comes within its reach during the
      enemy turn, before that opponent attacks.
   2. Encirclement: a target in contact with 2 or more opposing Pokémon
      takes +20% damage and loses 1 Movement. Applies to both sides.
   3. Phase bosses: Champion, Masters, Elite Four, legends and Cobalt
      change tactics at 66% then at 33% of their HP.
   4. Announced hazards: in big battles, a zone is announced one
      round in advance (rockslide, lightning, wave, flames, shockwave); any
      Pokémon that stays there, ally or opponent, is hit.
   ===================================================================== */

/* ---------- 1. Vigilance ---------- */
/** The best watch attack: the most powerful one that hits the tile. */
export function vigilHit420(S, u, k) {
  return u.mv
    .map(id => MV[id])
    .filter(m => m && m.p > 0 && !m.xp && m.sh !== 'self' && m.sh !== 'ally' && m.sh !== 'ring' && inReach(S, u, m, k))
    .sort((a, b) => b.p - a.p)[0];
}

function pVigil420(S, u) {
  if (!canVigil420(S, u)) {
    return null;
  }
  const ev = [];
  u.vigilance = 1;
  u.acted = true;
  say(ev, `${u.n} se met en vigilance : il frappera le premier adversaire qui arrive à sa portée.`);
  return ev;
}

/** After an opponent moves: the watchers strike before its attack. */
export function vigilance420(S, e, ev) {
  if (!e || e.ko || S.over || e.side !== 'e') {
    return;
  }
  const k = uk(e);
  for (const u of S.units) {
    if (u.side !== 'a' || u.ko || !u.vigilance || u.sn) {
      continue;
    }
    const m = vigilHit420(S, u, k);
    if (!m) {
      continue;
    }
    u.vigilance = 0;
    S.stats.vigilance = (S.stats.vigilance || 0) + 1;
    say(ev, `Vigilance : ${u.n} intercepte ${e.n} avec ${m.n} !`);
    ev.push({ e: 'vigil420', u: u.uid, t: e.uid });
    resolve(S, u, m, k).forEach(x => ev.push(x));
    if (e.ko || S.over) {
      return;
    }
  }
}

/* ---------- 3. Phase bosses ---------- */
export function bossPhases420(S) {
  const D = SCEN[S.sc] || {};
  return !!(D.champ || D.jfinal || D.hfinal || D.elite || D.legend || D.hleg435 || D.cap435 || D.jdis === 4);
}

export function bossOf420(S) {
  if (S.boss420) {
    return byUid(S, S.boss420);
  }
  const e = S.units
    .filter(x => x.side === 'e' && !x.seg)
    .sort((a, b) => (b.boss ? 1 : 0) - (a.boss ? 1 : 0) || b.mhp - a.mhp)[0];
  if (e) {
    S.boss420 = e.uid;
  }
  return e;
}

function phaseBoss420(S, ev) {
  const b = bossOf420(S),
    previous = b ? b.phase420 || 1 : 0;
  rage460(S, ev);
  changePhase420(S, ev);
  if (b && bossPhases420(S) && (b.phase420 || 1) > previous && !b.ko) {
    say(ev, repl460(b, b.phase420 === 3 ? 1 : 0));
  } // boss line (v4.60)
}

function changePhase420(S, ev) {
  if (!bossPhases420(S) || S.over) {
    return;
  }
  const b = bossOf420(S);
  if (!b || b.ko) {
    return;
  }
  const r = b.hp / b.mhp,
    ph = b.phase420 || 1;
  if (ph < 2 && r <= 0.66) {
    b.phase420 = 2;
    b.boost = Math.max(b.boost || 0, 2);
    b.guard = Math.max(b.guard || 0, 2);
    const t = b.t.find(x => WEATHER_T420[x]),
      mk = b.t.map(x => MARK_T416[x]).find(Boolean);
    if (t) {
      S.wx = { k: WEATHER_T420[t], n: 4 };
    } else if (mk) {
      nbrK(uk(b)).forEach(x => S.tiles[x] && !S.tiles[x].rock && setMark(S, x, mk, b.uid));
    }
    say(
      ev,
      `${b.n} entre en phase 2 : la rage ! Renforcé, blindé${t ? ', et la météo change' : mk ? ', et le terrain se transforme' : ''}.`
    );
    ev.push({ e: 'arena', r: 'phase2' });
  }
  if (ph < 3 && r <= 0.33) {
    b.phase420 = 3;
    b.pb = (b.pb || 0) + 1;
    const ko = S.units.filter(x => x.side === 'e' && x.ko && !x.seg && !x.colossus && !x.caught && x !== b)[0];
    let x = null;
    if (ko) {
      x = [uk(b), ...nbrK(uk(b))].find(y => S.tiles[y] && !S.tiles[y].rock && !uAt(S, y));
    }
    if (ko && x) {
      Object.assign(ko, {
        ko: false,
        hp: Math.max(1, Math.round(ko.mhp * 0.4)),
        pos: P(x),
        badge: null,
        skip: 0,
        notes: null,
        intent: null,
      });
      ev.push({ e: 'mv', u: ko.uid }, { e: 'heal', u: ko.uid, v: ko.hp });
      say(ev, `${b.n} entre en phase 3 : dernier souffle ! ${ko.n} revient au combat.`);
    } else {
      heal(S, b, Math.max(1, Math.round(b.mhp * 0.15)), ev);
      say(ev, `${b.n} entre en phase 3 : dernier souffle ! Il reprend des forces.`);
    }
    S.units.forEach(e2 => {
      if (e2.side === 'e' && !e2.ko && hasXp(e2)) {
        e2.en = Math.min(EMAX, (e2.en || 0) + 1);
      }
    });
    ev.push({ e: 'arena', r: 'phase3' });
  }
}

function typeDanger420(S) {
  const t = (SCEN[S.sc] || {}).at || 'Normal';
  if (['Électrik'].includes(t)) {
    return 'foudre';
  }
  if (['Eau', 'Glace'].includes(t)) {
    return 'vague';
  }
  if (['Feu', 'Dragon'].includes(t)) {
    return 'flammes';
  }
  if (['Psy', 'Spectre', 'Ténèbres', 'Fée'].includes(t)) {
    return 'onde';
  }
  return 'eboulement';
}

function activeDangers420(S) {
  const D = SCEN[S.sc] || {};
  return !!(S && !D.tuto && !D.ami && !D.wild && !D.tower && (bossScene(S) || D.jdis));
}

function dangerTurn420(S, ev) {
  if (!activeDangers420(S) || S.over) {
    return;
  }
  const Z = S.danger420;
  // resolution of the zone announced the previous round
  if (Z && S.round >= Z.r) {
    const T = DANGERS[Z.t];
    let n = 0;
    Z.k.forEach(k => {
      const u = uAt(S, k);
      if (u && !u.ko && !(Z.t === 'foudre' && u.t.includes('Sol'))) {
        damage(S, u, T.d, ev, { ind: true });
        n++;
      }
      if (T.mk && S.tiles[k] && !S.tiles[k].rock) {
        setMark(S, k, T.mk, null);
      }
    });
    say(ev, `${T.n} ! ${n ? `${n} Pokémon touché${n > 1 ? 's' : ''}.` : 'Personne n’était dans la zone.'}`);
    ev.push({ e: 'arena', r: 'danger' });
    S.danger420 = null;
    endStep(S, ev);
  }
  // a new zone, announced for the end of the next round (every other round)
  if (!S.danger420 && !S.over && S.round % 2 === 1) {
    const al = S.units.filter(u => u.side === 'a' && !u.ko);
    if (!al.length) {
      return;
    }
    const c = uk(al[Math.floor(Math.random() * al.length)]),
      v = nbrK(c).filter(k => S.tiles[k] && !S.tiles[k].rock),
      k = [c];
    while (k.length < 3 && v.length) {
      k.push(v.splice(Math.floor(Math.random() * v.length), 1)[0]);
    }
    S.danger420 = { k, t: typeDanger420(S), r: S.round + 1 };
    say(
      ev,
      `Danger : ${DANGERS[S.danger420.t].n} annoncé sur ${k.length} cases pour la fin de la prochaine manche. Sortez de la zone rouge !`
    );
  }
}

export function danger420Svg(S, k, x, y) {
  const Z = S && S.danger420;
  if (!Z || !Z.k.includes(k)) {
    return '';
  }
  return `<g class="danger420 dg-${Z.t}" transform="translate(${x.toFixed(1)},${y.toFixed(1)})"><circle r="15"/><path d="M0-9 9 7H-9Z"/><path class="dg-x" d="M0-4v5M0 4v1"/></g>`;
}

/* ---------- panel help ---------- */
export function vigilBtn420(u) {
  if (!B || u.side !== 'a') {
    return '';
  }
  const ok = canVigil420(B, u);
  return `<button type="button" class="vx${u.vigilance ? ' on' : ''}" data-vigil420 ${ok ? '' : 'disabled'}><b>Vigilance</b><span>${u.vigilance ? 'en garde' : 'action · surveille'}</span></button>`;
}

export function battleStates420(u) {
  if (!B) {
    return '';
  }
  const o = [];
  if (u.vigilance) {
    o.push('<span class="ux vg420">Vigilance : frappe le premier adversaire à sa portée</span>');
  }
  if (surrounded420(B, u)) {
    o.push('<span class="ux enc420">Encerclé : −1 Mouvement, +20 % de dégâts reçus</span>');
  }
  if (u.phase420 > 1) {
    o.push(`<span class="ux ph420">Phase ${u.phase420}</span>`);
  }
  return o.join('');
}

const canVigil420 = (S, u) =>
  !!(
    S &&
    u &&
    u.side === 'a' &&
    !u.ko &&
    !u.acted &&
    !u.sn &&
    S.phase === 'player' &&
    u.mv.some(id => MV[id] && MV[id].p > 0)
  );

/* ---------- 2. Encirclement ---------- */
const around420 = (S, t, side) =>
  S.units.filter(o => !o.ko && o.side === side && !o.seg && hdist(o.pos, t.pos) === 1).length;

export const surrounded420 = (S, u) =>
  !!(S && u && !u.ko && !u.seg && !u.colossus && around420(S, u, u.side === 'a' ? 'e' : 'a') >= 2);

const WEATHER_T420 = { Feu: 'soleil', Eau: 'pluie', Glace: 'grele', Roche: 'sable', Sol: 'sable' };

/* ---------- 4. Announced hazards ---------- */
const DANGERS = {
  eboulement: { n: 'Éboulement', d: 9, mk: 'fissure' },
  foudre: { n: 'Foudre', d: 8, mk: 'charge' },
  vague: { n: 'Vague', d: 7, mk: 'trempe' },
  flammes: { n: 'Flammes', d: 7, mk: 'brulant' },
  onde: { n: 'Onde', d: 8, mk: null },
};

// Statements run at startup, in the original order (see index.js).
export function __init() {
  HOOKS.beforeRoundEnd.push(S => S.units.forEach(u => (!S.duel433 || u.j433 !== 2) && (u.vigilance = 0)));

  // duel: P2's Vigilance holds during P1's turn (v4.33)
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-vigil420]');
    if (!b || !B || ui.busy) {
      return;
    }
    const u = ui.sel && byUid(B, ui.sel);
    const ev = u && pVigil420(B, u);
    if (!ev) {
      return;
    }
    ui.undo = null;
    clearAim();
    log(
      ev
        .filter(x => x.e === 'msg')
        .map(x => x.s)
        .join(' '),
      'sys'
    );
    toast(`${u.n} surveille sa zone.`);
    autoSel();
    renderAll();
  });

  DAMAGE_PROVIDERS.push({
    id: 'encerclement',
    provide: (c, { S, u, t }) =>
      S &&
      t &&
      u &&
      t.side !== u.side &&
      !t.seg &&
      around420(S, t, u.side) >= 2 && { mul: 1.2, labelText: 'Encerclement' },
  });

  HOOKS.beforeRoundEnd.push((S, ev) => {
    phaseBoss420(S, ev);
    dangerTurn420(S, ev);
  });

  ACHIEVEMENTS.push(
    {
      id: 'vigil',
      n: 'Sentinelle',
      d: 'Intercepter un adversaire avec la Vigilance.',
      ok: c => (c.S.stats.vigilance || 0) > 0,
    },
    {
      id: 'phases',
      n: 'Jusqu’au bout',
      d: 'Battre un Maître ou une légende après sa phase 3.',
      t: 'Inébranlable',
      ok: c => c.win && c.S.units.some(u => u.phase420 === 3),
    }
  );
}
