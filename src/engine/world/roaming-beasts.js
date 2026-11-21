/* =====================================================================
   Roaming beasts (added in v4.16): Raikou, Entei and Suicune, awakened
   at the Burned Tower, change location after every battle. They flee
   after 4 rounds and keep their wounds: wear them down, then calm them.
   Each one leaves a talisman (a unique held item). Like all
   legendaries, they cannot be recruited.
   ===================================================================== */
import { SCEN } from '../pokemon/pokemon.js';
import { ITEMS2, PROFILE, isCamp } from '../state/game-state.js';
import { medal } from '../core/utils.js';
import { HOOKS } from '../core/hooks.js';
import { heal, pushMessage } from '../combat/engine.js';
import { OBST } from '../combat/synergies-obstacles.js';
import { HELD_IMG } from '../state/economy.js';
import { ITEM_ICONS } from '../assets/item-icons.js';
import { PLACE_BY_ID, placeName } from './map.js';
import { LEGS } from '../modes/legendaries.js';
import { DAMAGE_PROVIDERS } from '../combat/tactical-engine.js';
import { ACHIEVEMENTS } from '../progression/achievements.js';
import { PLACES_J, johtoOpen } from './johto.js';
import { placeWithArticle } from './pokegear.js';

export const ROAM = ['raikou', 'entei', 'suicune'];

const ROAM_H = ['j1', 'j2', 'j3', 'j4', 'j5', 'j6', 'j7', 'j8', 'jwild', 'jlac'];

export const TALIS = { raikou: 'crinorage', entei: 'braisesacree', suicune: 'cristalboreal' };

/* ---------- original icons ---------- */
export const svgDataUri = s =>
  'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">' + s + '</svg>');

export const findRoamLegend = id => LEGS.find(L => L.id === id);

export const roamLegendInfo = id => {
  const L = findRoamLegend(id);
  return { n: L.n, t: L.title, q: L.q, w: L.w, l: 'Il s’est enfui avant que vous ne puissiez l’apaiser.' };
};

export const isRoamingActive = () => johtoOpen() && (!isCamp() || (PROFILE.jdis || 0) >= 2);

export const roamerCaught = id => !!(PROFILE.roam && PROFILE.roam[id] && PROFILE.roam[id].ok);

export const fleeMessage = S => {
  const D = SCEN[S.sc] || {},
    L = D.roam && findRoamLegend(D.roam);
  return `${L ? L.n : 'La bête'} bondit hors du plateau et disparaît : il s’est enfui !`;
};

export function getRoamState(id) {
  PROFILE.roam = PROFILE.roam || {};
  if (!PROFILE.roam[id]) {
    PROFILE.roam[id] = { at: ROAM_H[(ROAM.indexOf(id) * 3 + 2) % ROAM_H.length], hp: 1, ok: 0, seenFlags: 0 };
  }
  return PROFILE.roam[id];
}

function moveRoamers() {
  ROAM.forEach(id => {
    const r = getRoamState(id);
    if (r.ok) {
      return;
    }
    const takenSet = ROAM.filter(x => x !== id).map(x => getRoamState(x).at),
      pool = ROAM_H.filter(h => h !== r.at && !takenSet.includes(h));
    if (pool.length) {
      r.at = pool[Math.floor(Math.random() * pool.length)];
    }
  });
}

export function roamingPlaces() {
  if (!isRoamingActive()) {
    return [];
  }
  const takenSet = [];
  return ROAM.filter(id => !roamerCaught(id)).map(id => {
    const h = PLACE_BY_ID[getRoamState(id).at] || PLACE_BY_ID.j1,
      L = findRoamLegend(id),
      [x, y] = pickRoamSpot(h, takenSet), // v4.16.1: the clearest spot
      p = {
        id: 'r' + id,
        x,
        y,
        n: L.n,
        s: `Bête errante · près ${placeWithArticle(placeName(h))}`,
        grp: 'route',
        j: 1,
        roam: id,
      };
    PLACE_BY_ID[p.id] = p;
    takenSet.push(p);
    return p;
  });
}

export function setupRoaming(S, ev) {
  const D = SCEN[S.sc] || {},
    u = S.units.find(e => e.side === 'e' && e.id === D.roam);
  S.lim = D.flee || 4;
  if (!u) {
    return;
  }
  const r = getRoamState(D.roam);
  if (r.ok) {
    return void pushMessage(ev, `${u.n} accepte un combat amical. Il s’enfuira au bout de ${S.lim} manches.`);
  } // already calmed: a rematch, no bounty
  u.hp = Math.max(1, Math.round(u.mhp * (r.hp || 1)));
  pushMessage(
    ev,
    r.hp < 1
      ? `${u.n} porte encore les traces de votre dernière rencontre (${Math.round(r.hp * 100)} % de ses PV).`
      : `${u.n} vous a repéré. Il s’enfuira au bout de ${S.lim} manches.`
  );
}

// Instructions run at startup, in the original order (see index.js).
/* Marker placement: the beast's marker covers the other places as little as possible (added in v4.16.1). */
/** A free spot next to where the beast roams: its marker and name cover no other place. */
function pickRoamSpot(h, takenSet) {
  const C = [
      [110, 0],
      [-110, 0],
      [95, -58],
      [-95, -58],
      [95, 62],
      [-95, 62],
      [0, -96],
      [0, 100],
      [150, 0],
      [-150, 0],
    ],
    labelBox = (x, y) => [x - 62, y - 28, x + 62, y + 52], // the circle and the name label
    inter = (a, b) =>
      Math.max(0, Math.min(a[2], b[2]) - Math.max(a[0], b[0])) *
      Math.max(0, Math.min(a[3], b[3]) - Math.max(a[1], b[1])),
    others = [...PLACES_J, ...takenSet].map(p => labelBox(p.x, p.y));
  let best = [h.x + 110, h.y],
    bs = Infinity;
  C.forEach(([dx, dy], i) => {
    const x = Math.max(60, Math.min(940, h.x + dx)),
      y = Math.max(40, Math.min(590, h.y + dy)),
      b = labelBox(x, y),
      sc = others.reduce((t, o) => t + inter(b, o), 0) + i;
    if (sc < bs) {
      bs = sc;
      best = [x, y];
    }
  });
  return best;
}

export function init() {
  Object.assign(ITEM_ICONS, {
    'crin-orage': svgDataUri(
      '<path d="M7 36c7-11 15-15 28-17" stroke="#2f3366" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M7 36c7-11 15-15 28-17" stroke="#9aa2e6" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="M28 5 17 25h8l-4 18 15-23h-8l5-15Z" fill="#ffd94a" stroke="#86650f" stroke-width="2" stroke-linejoin="round"/>'
    ),
    'braise-sacree': svgDataUri(
      '<path d="M24 4c3 8 13 12 13 25a13 13 0 0 1-26 0c0-7 4-11 7-13 0 4 2 7 4 7 0-8-2-12 2-19Z" fill="#f2672e" stroke="#7a2412" stroke-width="2" stroke-linejoin="round"/><path d="M24 22c2 4 6 6 6 11a6 6 0 0 1-12 0c0-3 2-5 3-6 0 2 1 3 2 3 0-3 0-5 1-8Z" fill="#ffd34d"/>'
    ),
    'cristal-boreal': svgDataUri(
      '<path d="M24 3 36 18 24 45 12 18Z" fill="#8fe3ff" stroke="#1f5d86" stroke-width="2" stroke-linejoin="round"/><path d="M24 3v42M12 18h24" stroke="#1f5d86" stroke-width="1.5" opacity=".6"/><path d="M24 3 30 18 24 45" fill="#d8f6ff" opacity=".7"/><path d="M38 6l1.5 3.5L43 11l-3.5 1.5L38 16l-1.5-3.5L33 11l3.5-1.5z" fill="#fff"/>'
    ),
  });

  Object.assign(ITEMS2, {
    crinorage: {
      n: 'Crin d’Orage',
      d: 'Talisman de Raikou : +1 Mouvement et +1 Puissance sur toutes ses attaques.',
      i: 'M13 2 5 14h6l-2 8 8-12h-6l2-8Z',
    },
    braisesacree: {
      n: 'Braise Sacrée',
      d: 'Talisman d’Entei : +20 % de dégâts tant qu’il a plus de la moitié de ses PV.',
      i: 'M12 2c1.5 4 6.5 6 6.5 12.5a6.5 6.5 0 0 1-13 0c0-3.5 2-5.5 3.5-6.5 0 2 1 3.5 2 3.5 0-4-1-6 1-9.5Z',
    },
    cristalboreal: {
      n: 'Cristal Boréal',
      d: 'Talisman de Suicune : en fin de manche, il récupère 8 % de ses PV max et se libère de la brûlure.',
      i: 'M12 2l6 7-6 13-6-13Z',
    },
  });

  Object.assign(HELD_IMG, { crinorage: 'crin-orage', braisesacree: 'braise-sacree', cristalboreal: 'cristal-boreal' });

  ROAM.forEach(id => {
    const L = findRoamLegend(id);
    if (!L) {
      return;
    }
    SCEN['r' + id] = {
      n: `${L.n} errant`,
      lvl: `Johto · ${L.title}`,
      lim: 10,
      flee: 4,
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
      foes: [[id, [6, 2], { boss: true, hb: 320, pb: 8 }]],
    };
    OBST['r' + id] = { pil: ['4,0', '4,5'] };
  });

  /* talisman effects */
  DAMAGE_PROVIDERS.push({
    id: 'braisesacree',
    provide: (c, { u }) => u.item === 'braisesacree' && u.hp > u.mhp / 2 && { mul: 1.2, labelText: 'Braise Sacrée' },
  });

  HOOKS.beforeRoundEnd.push((S, ev) => {
    S.units.forEach(u => {
      if (u.ko || u.item !== 'cristalboreal') {
        return;
      }
      if (u.burn) {
        u.burn = 0;
      }
      if (u.hp < u.mhp) {
        heal(S, u, Math.max(1, Math.round(u.mhp * 0.08)), ev);
      }
    });
  });

  /* ---------- hooks: battle creation ---------- */
  HOOKS.combat.push(S => {
    if (S.restricted) {
      return;
    } // fixed-rule battles (v4.31)
    // roaming beast talismans
    S.units.forEach(u => {
      if (u.item === 'crinorage') {
        u.pb = (u.pb || 0) + 1;
      }
    });
  });

  /* ---------- hooks: after the battle ---------- */
  HOOKS.progress.push((S, rew) => {
    const D = SCEN[S.sc] || {},
      o = [0, 0];
    if (D.roam) {
      const r = getRoamState(D.roam),
        u = S.units.find(e => e.side === 'e' && e.id === D.roam);
      r.seenFlags = (r.seenFlags || 0) + 1;
      if (r.ok) {
        // already calmed: a friendly rematch, no bounty
      } else if (u && u.ko) {
        r.ok = 1;
        r.hp = 0.05;
        const it = TALIS[D.roam];
        if (it && !PROFILE.items.includes(it)) {
          PROFILE.items.push(it);
        }
        o[0] += 1500;
        o[1] += 12;
        rew.roam = { id: D.roam, ok: true, it };
      } else if (u) {
        r.hp = Math.max(0.05, u.hp / u.mhp);
        rew.roam = { id: D.roam, ok: false, hp: r.hp };
      }
    }
    if (isRoamingActive() && !(D.tuto || D.tower)) {
      moveRoamers();
    }
    return o[0] || o[1] ? o : null;
  });

  HOOKS.battleResult.push(r => {
    if (!r.roam) {
      return '';
    }
    const L = findRoamLegend(r.roam.id);
    return r.roam.ok
      ? `<div class="result-list"><h4>Bête errante</h4><div class="result-row">${medal(L.t)}<span>${L.n} est apaisé. « ${L.w} » Il vous laisse son talisman : <b>${ITEMS2[r.roam.it].n}</b>.</span><b>✦</b></div></div>`
      : `<div class="result-list"><h4>Bête errante</h4><div class="result-row">${medal(L.t)}<span>${L.n} s’est enfui avec ${Math.round(r.roam.hp * 100)} % de ses PV. Il garde ses blessures : retrouvez-le sur la carte de Johto.</span><b>${Math.round(r.roam.hp * 100)} %</b></div></div>`;
  });

  /* ---------- achievements ---------- */
  ACHIEVEMENTS.push({
    id: 'betes',
    n: 'Trois bêtes',
    d: 'Apaiser Raikou, Entei et Suicune.',
    t: 'Ami des bêtes',
    ok: () => ROAM.every(roamerCaught),
    p: () => [ROAM.filter(roamerCaught).length, 3],
  });
}
