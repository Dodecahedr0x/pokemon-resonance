import { MOVES } from '../data/moves.js';
import { POKEMON, SCENARIOS } from '../pokemon/pokemon.js';
import { HELD_ITEMS, PROFILE, isCamp } from '../state/game-state.js';
import { rosterCost } from '../pokemon/roles-synergies.js';
import { toast } from '../core/utils.js';
import { HOOKS } from '../core/hooks.js';
import {
  MAX_ENERGY,
  parseCellKey,
  byUid,
  damage,
  endStep,
  rewardIn,
  hasNx,
  hexDistance,
  heal,
  neighborKeys,
  retarget,
  pushMessage,
  setMark,
  shove,
  stun,
  typeEffectiveness,
  unitAt,
  unitKey,
} from './engine.js';
import { noteAdd } from './synergies-obstacles.js';
import { battle, energyPips } from './ui.js';
import { queueSave } from '../state/saves.js';
import { sfx, vibrate } from '../audio/sound-effects.js';
import { HEALS } from '../items/battle-potions.js';
import { HELD_IMG, SHOP, bagCount, today } from '../state/economy.js';
import { SCREEN_STATE } from '../ui/screen-state.js';
import { renderWallet } from '../ui/wallet.js';
import { renderBag } from '../progression/quests-shop.js';
import { LEGENDARIES } from '../modes/legendaries.js';
import { DAMAGE_PROVIDERS } from './tactical-engine.js';
import { withDe } from './tactics.js';
import { applyPoison } from '../moves/epic-tms.js';
import { hasRune } from '../moves/technical-roster.js';
import { isSurrounded } from './intensity.js';
import { ITEM_CAN_USE, ITEM_USE_EFFECTS } from '../items/balls-held-items.js';
import { bossResonanceHtml } from '../world/secret-places.js';

export let COMBAT_ITEMS;
let LEGENDARY_IDS, DAILY_OFFERS_CACHE;

export function rankId(id) {
  const m = POKEMON[id];
  if (!m) {
    return 'moyen';
  }
  if (LEGENDARY_IDS.has(id)) {
    return 'expert';
  }
  const c = rosterCost(id);
  return c <= 1 ? 'faible' : c <= 3 ? 'moyen' : c <= 5 ? 'fort' : 'expert';
}

export function bossScene(S) {
  if (!S) {
    return false;
  }
  const D = SCENARIOS[S.sc] || {};
  return (
    D.gym != null ||
    D.johto != null ||
    !!D.jfinal ||
    !!D.jdis ||
    !!D.roam ||
    !!D.ami ||
    D.hoenn != null ||
    !!D.hfinal ||
    !!D.elite ||
    !!D.champ ||
    !!D.rival ||
    !!D.colossus ||
    /^lg/.test(S.sc || '')
  );
}

export function canXP(S, u, m) {
  if (!m || !m.xp) {
    return true;
  }
  if (u.side === 'e' && !bossScene(S)) {
    return false;
  }
  return (u.en || 0) >= xpCost(u);
}

export function roleBadgeHtml(m, u) {
  if (!m || !m.rg || m.rg === 'soutien') {
    return '';
  }
  return ` <small class="mrg mrg-${m.rg}">${MRG[m.rg]}${m.xp ? ' ' + '◆'.repeat(u ? xpCost(u) : 2) : ''}</small>`;
}

export function moveBlockedMessage(S, u, m) {
  if (u && u.item === 'mouchoir' && u.choice && MOVES[u.choice] && MOVES[u.choice] !== m) {
    return `Mouchoir Choix : il ne peut plus lancer que ${MOVES[u.choice].n}.`;
  }
  if (m && m.xp && !canXP(S, u, m)) {
    const c = xpCost(u);
    return `Attaque Experte : il faut ${c} losange${c > 1 ? 's' : ''} de Résonance (${u.en || 0} / ${c}).`;
  }
  return '';
}

export function expertBlockHtml(u) {
  const c = xpCost(u),
    ok = u.en >= c;
  return `<div class="battle-energy is-expert${ok ? ' is-full' : ''}"><div class="battle-energy-head"><span class="caption">Résonance</span>${energyPips(u.en, 'lg')}</div><p class="battle-hint">Attaque Experte : ${c} losange${c > 1 ? 's' : ''}. ${ok ? 'Elle est prête.' : `Encore ${c - u.en} : fin de manche, réaction, coup encaissé, allié K.O.`}</p></div>`;
}

function gainDiamond(S, u, ev) {
  if (u.side === 'a') {
    rewardIn(S, u, 1, ev);
  } else if (hasXp(u)) {
    u.en = Math.min(MAX_ENERGY, (u.en || 0) + 1);
  }
}

function resonanceEcho(S, u, v, typ, x, ev) {
  if (ev.some(e => e.e === 'rx' && e.k === x)) {
    return '';
  } // the terrain's reaction has already resonated
  const prot = hasRune(S, v),
    isFree = v.ability === 'regardvif' || prot;
  switch (typ) {
    case 'Feu':
      if (v.t.includes('Feu') || v.ability === 'torche' || prot) {
        return '';
      }
      v.burn = Math.max(v.burn, 2);
      ev.push({ e: 'st', u: v.uid, s: 'BRÛ' });
      return `${v.n} est brûlé`;
    case 'Eau':
      setMark(S, unitKey(v), 'trempe', u.uid);
      return 'sa case est Trempée';
    case 'Électrik':
      if (v.t.includes('Sol')) {
        return '';
      }
      stun(S, v, 'PAR', ev, true);
      return v.badge === 'PAR' ? `${v.n} est paralysé` : '';
    case 'Plante':
      if (isFree) {
        return '';
      }
      v.root = Math.max(v.root, 2);
      return `${v.n} est enraciné`;
    case 'Glace':
      if (v.t.includes('Glace')) {
        return '';
      }
      stun(S, v, 'GEL', ev, true);
      return v.badge === 'GEL' ? `${v.n} est gelé` : '';
    case 'Sol':
      setMark(S, unitKey(v), 'fissure', u.uid);
      return 'sa case se fissure';
    case 'Roche':
    case 'Insecte':
      if (isFree) {
        return '';
      }
      v.web = Math.max(v.web, 2);
      return `${v.n} est ralenti`;
    case 'Combat':
    case 'Vol': {
      const p0 = unitKey(v);
      shove(S, v, u.pos, typ === 'Vol' ? 2 : 1, ev, false);
      return unitKey(v) !== p0 ? `${v.n} est repoussé` : '';
    }
    case 'Psy':
      if (prot) {
        return '';
      }
      if (v.side === 'e') {
        retarget(S, v, u, 'confuse', ev);
      } else {
        v.web = Math.max(v.web, 2);
      }
      return `${v.n} est désorienté`;
    case 'Spectre':
      v.maudit = Math.max(v.maudit || 0, 2);
      return `${v.n} est hanté`;
    case 'Ténèbres':
      v.weakened = Math.max(v.weakened || 0, 2);
      return `${v.n} est intimidé`;
    case 'Poison':
      return applyPoison(S, v, ev) ? `${v.n} est empoisonné` : '';
    case 'Dragon':
      damage(S, v, 6, ev, { ind: true, reflect: true });
      return 'l’écho draconique frappe encore';
    case 'Fée': {
      const a = S.units
        .filter(o => !o.ko && o.side === u.side && hexDistance(o.pos, u.pos) <= 3 && o.hp < o.mhp)
        .sort((p, q) => p.hp / p.mhp - q.hp / q.mhp)[0];
      if (!a) {
        return '';
      }
      heal(S, a, Math.round(a.mhp * 0.15), ev);
      return `${a.n} reprend des forces`;
    }
    case 'Acier':
      u.guard = Math.max(u.guard, 2);
      return `${u.n} gagne +2 Garde`;
    default:
      gainDiamond(S, u, ev);
      return `${u.n} gagne 1 losange`;
  }
}

/** After each target hit: the note, then Resonance on the third. */
export function afterHitResonance(S, u, m, v, x, typ, ev) {
  if (!v || v === u || v.side === u.side || v.seg || !(m.p || m.fix) || !resoOn(S, u)) {
    return;
  }
  if (typeEffectiveness(typ, v.t) === 0 && !(v.pinned && typ === 'Sol')) {
    return;
  }
  if (!v.notes || v.notes.r !== S.round) {
    v.notes = { r: S.round, n: 0, by: [] };
  }
  const N = v.notes;
  if (N.n >= 3 || N.by.includes(u.uid)) {
    return;
  }
  const previous = N.n;
  N.by.push(u.uid);
  N.n = Math.min(3, previous + weightNote(u));
  if (!previous && rankOfValue(u) === 'faible') {
    gainDiamond(S, u, ev);
  }
  if (N.n < 3) {
    if (!v.ko) {
      ev.push({ e: 'note', u: v.uid, n: N.n });
    }
    noteAdd(`${v.n} : ${N.n} note${N.n > 1 ? 's' : ''} de Résonance sur 3`);
    return;
  }
  if (u.side === 'a') {
    S.stats.resonant = (S.stats.resonant || 0) + 1;
  }
  ev.push({ e: 'reso', u: v.uid });
  noteAdd(`Résonance sur ${v.n} : ×${u.item === 'ceinturepro' ? '1,8' : '1,5'} et écho ${typ}`);
  const r = v.ko ? '' : resonanceEcho(S, u, v, typ, x, ev);
  pushMessage(ev, `Résonance ! ${v.n} vibre sous le coup ${withDe(u.n)}${r ? ` : ${r}` : ''}.`);
}

/* end of ability: Life Orb */
export function afterMoveHeldItems(S, u, m, dealt, ev) {
  if (u.item === 'orbevie' && dealt > 0 && !u.ko) {
    pushMessage(ev, `Orbe Vie : ${u.n} paie sa puissance.`);
    damage(S, u, Math.max(1, Math.round(u.mhp * 0.1)), ev, { ind: true, reflect: true });
  }
}

/* after damage taken: Rocky Helmet, Sitrus Berry */
export function afterDamageItems(S, v, real, o, ev) {
  if (!o.ind && !o.reflect && v.item === 'casquebrut') {
    const a = S.lastAtk && byUid(S, S.lastAtk);
    if (a && a !== v && !a.ko && a.side !== v.side && hexDistance(a.pos, v.pos) === 1) {
      pushMessage(ev, `Casque Brut : ${a.n} se blesse sur ${v.n}.`);
      damage(S, a, Math.max(1, Math.round(a.mhp * 0.1)), ev, { ind: true, reflect: true });
    }
  }
  if (v.item === 'sitrus' && !v.sitrus && !v.ko && v.hp <= v.mhp / 2) {
    v.sitrus = 1;
    pushMessage(ev, `Baie Sitrus : ${v.n} reprend des forces.`);
    heal(S, v, Math.round(v.mhp * 0.25), ev);
  }
}

/* ---------- display ---------- */
export function plateRankHtml(u) {
  const n = notesOf(battle, u);
  return `<span class="pl-rg rank-${rankOfValue(u)}">${stars(rankOfValue(u))}</span>${n && !u.ko ? `<span class="pl-nt" title="${n} note${n > 1 ? 's' : ''} de Résonance">${'♪'.repeat(n)}</span>` : ''}`;
}

export function foeResonanceNotes(e) {
  const n = notesOf(battle, e),
    o = [];
  if (n && !e.ko) {
    o.push(
      n >= 3
        ? 'Résonance déjà déclenchée sur lui cette manche.'
        : `Résonance : ${n} note${n > 1 ? 's' : ''} sur 3. Encore ${3 - n} pour la déclencher.`
    );
  }
  if (bossScene(battle) && hasXp(e)) {
    o.push(`Il accumule la Résonance : ${e.en || 0} / ${MAX_ENERGY} losanges, ${xpCost(e)} pour son attaque Experte.`);
  }
  return (o.length ? `<p class="battle-resonance-note">${o.join(' ')}</p>` : '') + bossResonanceHtml(e);
}

// Team ranks and Harmony: card rendered by React (src/screens/team/Analysis.jsx).

export function canUseBagItem(S, u, k) {
  const it = SHOP[k];
  if (
    !it ||
    !u ||
    u.ko ||
    u.side !== 'a' ||
    S.phase !== 'player' ||
    (S.itemsUsed || 0) >= BAG_MAX ||
    S.duel433 ||
    bagCount(k) < 1
  ) {
    return false;
  }
  if (HEALS.includes(k)) {
    return !u.acted && !u.sn && u.hp < u.mhp;
  }
  if (it.voice && S.voice < it.voice) {
    return false;
  }
  if (ITEM_CAN_USE[k]) {
    return !!ITEM_CAN_USE[k](S, u);
  }
  switch (k) {
    case 'rappel':
      return !u.acted && !u.sn && !!koAllyOf(S) && !!freeTileFor(S, u);
    case 'baieoran':
      return u.hp < u.mhp;
    case 'totalsoin':
      return !!(
        u.badge ||
        u.skip ||
        u.burn > 0 ||
        u.poisoned > 0 ||
        u.web > 0 ||
        u.root > 0 ||
        u.maudit > 0 ||
        u.weakened > 0
      );
    case 'cristal':
      return (hasNx(u) || hasXp(u)) && u.en < MAX_ENERGY;
    default:
      return true;
  }
}

export function useCombatItem(S, u, k) {
  const it = SHOP[k];
  if (!it || it.category !== 'combat' || !canUseBagItem(S, u, k)) {
    return null;
  }
  const ev = [];
  if (k === 'baieoran') {
    heal(S, u, 12, ev);
    pushMessage(ev, `Baie Oran : ${u.n} reprend des forces.`);
  } else if (k === 'totalsoin') {
    Object.assign(u, { badge: null, skip: 0, burn: 0, poisoned: 0, web: 0, root: 0, maudit: 0, weakened: 0 });
    pushMessage(ev, `Total Soin : ${u.n} est libéré de ses statuts.`);
  } else if (k === 'attaqueplus') {
    u.boost = Math.max(u.boost, 2);
    pushMessage(ev, `Attaque + : ${u.n} est Renforcé pendant 2 manches.`);
  } else if (k === 'defenseplus') {
    u.guard = Math.max(u.guard, 2);
    pushMessage(ev, `Défense + : ${u.n} gagne +2 Garde.`);
  } else if (k === 'vitesseplus') {
    u.agile = Math.max(u.agile || 0, 2);
    pushMessage(ev, `Vitesse + : ${u.n} gagne +1 Mouvement pendant 2 manches.`);
  } else if (k === 'cristal') {
    rewardIn(S, u, 1, ev);
    pushMessage(ev, `Cristal Résonant : ${u.n} gagne 1 losange.`);
  } else if (ITEM_USE_EFFECTS[k]) {
    ITEM_USE_EFFECTS[k](S, u, ev);
  } else if (k === 'rappel') {
    const o = koAllyOf(S),
      x = freeTileFor(S, u);
    Object.assign(o, {
      ko: false,
      hp: Math.max(1, Math.round(o.mhp * 0.4)),
      pos: parseCellKey(x),
      acted: true,
      moved: true,
      sn: false,
      skip: 0,
      badge: null,
      burn: 0,
      poisoned: 0,
      web: 0,
      root: 0,
      maudit: 0,
      requiem: 0,
      weakened: 0,
      en: 0,
      intent: null,
      notes: null,
    });
    ev.push({ e: 'mv', u: o.uid }, { e: 'heal', u: o.uid, v: o.hp });
    pushMessage(ev, `Rappel : ${o.n} revient au combat avec ${o.hp} PV. Il jouera à la prochaine manche.`);
  }
  if (it.voice) {
    S.voice -= it.voice;
    S.stats.voice = (S.stats.voice || 0) + it.voice;
  } else {
    u.acted = true;
    u.moved = true;
  }
  S.itemsUsed = (S.itemsUsed || 0) + 1;
  PROFILE.bag[k] = bagCount(k) - 1;
  if (!PROFILE.bag[k]) {
    delete PROFILE.bag[k];
  }
  return endStep(S, ev);
}

export function dailyOffers() {
  const d = today();
  if (DAILY_OFFERS_CACHE.d === d) {
    return DAILY_OFFERS_CACHE.k;
  }
  let h = 7;
  for (const c of d) {
    h = (h * 31 + c.charCodeAt(0)) >>> 0;
  }
  const rnd = () => (h = (Math.imul(h, 1103515245) + 12345) >>> 0) / 4294967296;
  const pools = [
    Object.keys(SHOP).filter(k => ['soins', 'combat'].includes(SHOP[k].category) && SHOP[k].p),
    Object.keys(HELD_SHOP).filter(k => HELD_SHOP[k].p),
    Object.keys(SHOP).filter(k => ['balls', 'machines'].includes(SHOP[k].category) && SHOP[k].p && !SHOP[k].cs),
  ];
  DAILY_OFFERS_CACHE = { d, k: pools.map(L => L[Math.floor(rnd() * L.length)]).filter(Boolean) };
  return DAILY_OFFERS_CACHE.k;
}

// Shop: daily offers and held items for sale, rendered by React (src/screens/bag/Offers.jsx, HeldItems.jsx)

function buyHeldItem(k) {
  const H = HELD_SHOP[k];
  if (!H || !isCamp() || PROFILE.items.includes(k)) {
    return;
  }
  const price = H.g || heldItemCost(k);
  if (H.g) {
    if (PROFILE.gems < price) {
      return;
    }
    PROFILE.gems -= price;
  } else {
    if (PROFILE.money < price) {
      return;
    }
    PROFILE.money -= price;
  }
  PROFILE.items.push(k);
  sfx('ui');
  vibrate(15);
  toast(`Acheté : ${HELD_ITEMS[k].n}. Confiez-le depuis la fiche d’un Pokémon.`);
  queueSave();
  renderWallet();
  renderBag();
}

/* =====================================================================
   v4.14: Resonance at the heart of combat
   1. Ranks Weak, Medium, Strong, Expert (from the form's CP cost).
      Each rank has its own advantage; three different ranks = Harmony.
   2. Ranked attacks. Offensive signatures become Expert and are paid
      for in Resonance diamonds: final forms accumulate them.
   3. Resonance notes: each different Pokémon that hits a target during
      the round leaves a note on it. At 3 notes: "Résonance !", ×1.5 and the
      type echo.
   4. Shop: held items, battle items, daily offers, rare
      merchant, battle Bag limited to 4 items.
   Champions, rival, Council, Master, legendaries and colossi benefit
   too; terrains and the Tower do not.
   ===================================================================== */

/* ---------- 1. ranks ---------- */
export const RANKS = {
  faible: {
    n: 'Faible',
    i: 1,
    k: 'Élan',
    d: 'Quand il pose la première note de Résonance sur une cible, il gagne 1 losange.',
  },
  moyen: { n: 'Moyen', i: 2, k: 'Relance', d: 'Ses coups comptent pour 2 notes de Résonance.' },
  fort: { n: 'Fort', i: 3, k: 'Impact', d: '+25 % de dégâts sur une cible qui porte déjà une note de Résonance.' },
  expert: { n: 'Expert', i: 4, k: 'Maîtrise', d: 'Ses attaques Expertes ne coûtent qu’1 losange au lieu de 2.' },
};

export const rankOfValue = u => rankId(u.id);

export const stars = r => '★'.repeat(RANKS[r].i);

export const rankTag = r =>
  `<span class="rank-tag rank-${r}" title="Rang ${RANKS[r].n} · ${RANKS[r].k} : ${RANKS[r].d}">${stars(r)}</span>`;

/* ---------- 2. ranked attacks, Expert attacks ---------- */
const XP_LEG = ['fatalfoudre', 'feusacre', 'frappepsy', 'aeroblast'];

// legendaries' attacks

const MRG = { soutien: 'Soutien', faible: 'Faible', moyen: 'Moyenne', fort: 'Forte', expert: 'Experte' };

export const hasXp = u => !!(u && u.mv && u.mv.some(x => MOVES[x] && MOVES[x].xp));

export const xpCost = u => (rankOfValue(u) === 'expert' ? 1 : 2);

const resoOn = (S, u) => !!u && (u.side === 'a' || bossScene(S));

export const rankLineHtml = u => {
  const r = rankOfValue(u);
  return `<p class="battle-ability is-rank"><b>${RANKS[r].n} · ${RANKS[r].k}.</b> ${RANKS[r].d}</p>`;
};

/* ---------- 3. Resonance notes and type echoes ---------- */
export const notesOf = (S, v) => (S && v && v.notes && v.notes.r === S.round ? v.notes.n : 0);

const weightNote = u => (rankOfValue(u) === 'moyen' ? 2 : 1) + (u.item === 'metronome' ? 1 : 0);

export const TYPE_ECHOES = {
  Feu: 'La cible est brûlée.',
  Eau: 'Sa case devient Trempée : de quoi préparer une réaction.',
  Électrik: 'La cible est paralysée (sauf type Sol).',
  Plante: 'La cible est enracinée.',
  Glace: 'La cible est gelée.',
  Sol: 'Sa case devient Fissurée.',
  Roche: 'La cible est ralentie.',
  Combat: 'La cible est repoussée d’une case.',
  Vol: 'La cible est repoussée de deux cases.',
  Psy: 'La cible est désorientée.',
  Spectre: 'La cible est hantée : 12 % de ses PV par manche, 2 manches.',
  Ténèbres: 'La cible est intimidée : −3 dégâts pendant 2 manches.',
  Poison: 'La cible est empoisonnée.',
  Insecte: 'La cible est engluée et ralentie.',
  Dragon: 'L’écho frappe encore : 6 dégâts de plus.',
  Fée: 'Votre Pokémon le plus blessé à 3 cases récupère 15 % de ses PV.',
  Acier: 'L’attaquant gagne +2 Garde.',
  Normal: 'L’attaquant gagne 1 losange.',
};

export const heldMoveBonus = (S, u) =>
  (u.item === 'mouchoir' ? 2 : 0) +
  (u.item === 'crinorage' ? 1 : 0) +
  (u.resonant > 0 ? 1 : 0) -
  (isSurrounded(S, u) ? 1 : 0);

// Crin d’Orage (v4.16), Resonant Form (v4.17), Encirclement (v4.20)

/* ---------- 4. Shop ---------- */
export const BAG_MAX = 4;

export const HELD_SHOP = {
  sitrus: { p: 2500 },
  rochemeteo: { p: 3000 },
  grosseracine: { p: 3000 },
  casquebrut: { p: 3500 },
  lentillezoom: { p: 3500 },
  mouchoir: { p: 4000 },
  orbevie: { p: 4500 },
  metronome: { g: 12 },
  ceinturepro: { g: 18 },
};

export const koAllyOf = S =>
  S.units
    .filter(o => o.side === 'a' && o.ko && !o.seg)
    .sort((a, b) => rosterCost(b.id) - rosterCost(a.id) || b.mhp - a.mhp)[0];

export const freeTileFor = (S, u) =>
  neighborKeys(unitKey(u)).find(x => S.tiles[x] && !S.tiles[x].rock && !unitAt(S, x) && !(S.tiles[x].lava > 0));

export const isDailyOffer = k => dailyOffers().includes(k);

export const dailyDiscount = (k, p) => (p && isDailyOffer(k) ? Math.round((p * 0.7) / 50) * 50 : p);

export const heldItemCost = k => dailyDiscount(k, HELD_SHOP[k].p);

const COMPETITIVE_HELD_ITEMS = {
  orbevie: {
    n: 'Orbe Vie',
    d: '+30 % de dégâts, mais perd 10 % de ses PV max après chaque attaque qui touche.',
    i: 'M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm0 3a5 5 0 0 1 5 5h-2a3 3 0 0 0-3-3Z',
  },
  casquebrut: {
    n: 'Casque Brut',
    d: 'Un adversaire qui le frappe au contact perd 10 % de ses PV max.',
    i: 'M4 16a8 8 0 0 1 16 0v3H4Z',
  },
  sitrus: {
    n: 'Baie Sitrus',
    d: 'Une fois par combat, quand ses PV passent sous la moitié : il récupère 25 % de ses PV max.',
    i: 'M12 7c-4 0-7 3-7 6.5S8 20 12 20s7-3 7-6.5S16 7 12 7Zm1-1c0-2 1-3 3-3.5V4c-1.5.5-2 1-2 2Z',
  },
  mouchoir: {
    n: 'Mouchoir Choix',
    d: '+2 Mouvement, mais il ne peut plus lancer que la première capacité utilisée.',
    i: 'M5 5h14l-3 6 3 8h-5l-2-6-2 6H5l3-8Z',
  },
  rochemeteo: {
    n: 'Roche Météo',
    d: 'La météo qu’il déclenche dure 3 manches de plus.',
    i: 'M6 18l-2-6 4-6h8l4 6-2 6Z',
  },
  grosseracine: {
    n: 'Grosse Racine',
    d: 'Les soins et drains qu’il reçoit rendent 50 % de plus.',
    i: 'M11 3h2v7l5 9h-2.3L13 13.5V21h-2v-7.5L8.3 19H6l5-9Z',
  },
  lentillezoom: {
    n: 'Lentille Zoom',
    d: '+1 Portée sur ses attaques de portée 2 ou plus.',
    i: 'M10 4a6 6 0 1 0 0 12 6 6 0 0 0 0-12Zm4.5 10.5 5.5 5.5-1.5 1.5-5.5-5.5Z',
  },
  metronome: {
    n: 'Métronome',
    d: 'Ses coups comptent pour 1 note de Résonance de plus.',
    i: 'M9 3h6l4 18H5Zm2.2 4L13 16h-1.6Z',
  },
  ceinturepro: {
    n: 'Ceinture Pro',
    d: 'Ses coups de Résonance font ×1,8 au lieu de ×1,5.',
    i: 'M3 10h18v4H3Zm8-2h4v8h-4Z',
  },
};

const CONSUMABLE_SHOP_ITEMS = {
  baieoran: {
    n: 'Baie Oran',
    sn: 'Oran',
    d: 'Rend 12 PV. Coûte 1 Voix, l’action reste libre.',
    p: 250,
    category: 'combat',
    img: 'oran-berry',
    voice: 1,
  },
  totalsoin: {
    n: 'Total Soin',
    sn: 'Total Soin',
    d: 'Libère de tous les statuts et entraves (paralysie, gel, sommeil, brûlure, poison, toile, racines, malédiction). Une manche déjà perdue le reste. Coûte 1 Voix.',
    p: 600,
    category: 'combat',
    img: 'full-heal',
    voice: 1,
  },
  attaqueplus: {
    n: 'Attaque +',
    sn: 'Attaque +',
    d: 'Renforcé pendant 2 manches. Coûte 1 Voix, l’action reste libre.',
    p: 800,
    category: 'combat',
    img: 'x-attack',
    voice: 1,
  },
  defenseplus: {
    n: 'Défense +',
    sn: 'Défense +',
    d: '+2 Garde pendant 2 manches. Coûte 1 Voix, l’action reste libre.',
    p: 800,
    category: 'combat',
    img: 'x-defense',
    voice: 1,
  },
  vitesseplus: {
    n: 'Vitesse +',
    sn: 'Vitesse +',
    d: '+1 Mouvement pendant 2 manches. Coûte 1 Voix, l’action reste libre.',
    p: 700,
    category: 'combat',
    img: 'x-speed',
    voice: 1,
  },
  cristal: {
    n: 'Cristal Résonant',
    sn: 'Cristal',
    d: '+1 losange de Résonance (Éveil ou attaque Experte). Coûte 1 Voix.',
    p: 1200,
    category: 'combat',
    img: 'star-piece',
    voice: 1,
  },
  rappel: {
    n: 'Rappel',
    sn: 'Rappel',
    d: 'Relève votre Pokémon K.O. le plus coûteux en PC, sur une case voisine, avec 40 % de ses PV. Utilise l’action.',
    p: 1500,
    category: 'combat',
    img: 'revive',
  },
};

// Statements executed at startup, in the original order (see index.js).
export function init() {
  LEGENDARY_IDS = new Set(LEGENDARIES.map(l => l.id));

  for (const k in MOVES) {
    const m = MOVES[k];
    if (!m || typeof m !== 'object') {
      continue;
    }
    const deg = m.p > 0 || m.fix > 0;
    m.rg = !deg
      ? 'soutien'
      : m.sig || XP_LEG.includes(k)
        ? 'expert'
        : m.fix || m.p >= 10
          ? 'fort'
          : m.p >= 7
            ? 'moyen'
            : 'faible';
    if (m.rg === 'expert') {
      m.xp = 1;
    }
  }

  DAMAGE_PROVIDERS.push(
    {
      id: 'resonance',
      provide: (c, { S, u, m, t }) => {
        if (!S || !t || !u || t.side === u.side || !(m.p || m.fix) || !resoOn(S, u) || t.seg) {
          return false;
        }
        const n = notesOf(S, t);
        if (n >= 3 || (n && t.notes.by.includes(u.uid)) || n + weightNote(u) < 3) {
          return false;
        }
        return { mul: u.item === 'ceinturepro' ? 1.8 : 1.5, labelText: 'Résonance' };
      },
    },
    {
      id: 'impact',
      provide: (c, { S, u, t }) =>
        !!t &&
        t.side !== u.side &&
        rankOfValue(u) === 'fort' &&
        resoOn(S, u) &&
        notesOf(S, t) > 0 && { mul: 1.25, labelText: 'Impact' },
    },
    {
      id: 'orbevie',
      provide: (c, { u, m }) => u.item === 'orbevie' && (m.p > 0 || m.fix > 0) && { mul: 1.3, labelText: 'Orbe Vie' },
    }
  );

  /* ---------- combat: start, end of round, Harmony ---------- */
  HOOKS.combat.push(S => {
    const al = S.units.filter(u => u.side === 'a');
    if (al.length >= 3 && new Set(al.map(rankOfValue)).size >= 3) {
      S.harmonie = true;
      al.forEach(u => {
        if (hasNx(u) || hasXp(u)) {
          u.en = Math.max(u.en || 0, 1);
        }
      });
    }
    if (bossScene(S)) {
      S.units.forEach(e => {
        if (e.side === 'e' && hasXp(e)) {
          e.en = Math.max(e.en || 0, 1);
        }
      });
    }
  });

  HOOKS.beforeRoundEnd.push(S => {
    if (!bossScene(S)) {
      return;
    }
    S.units.forEach(e => {
      if (e.side === 'e' && !e.ko && hasXp(e)) {
        e.en = Math.min(MAX_ENERGY, (e.en || 0) + 1);
      }
    });
  });

  HOOKS.progress.push((S, rew) => {
    if (S.stats && S.stats.resonant) {
      rew.resonant = S.stats.resonant;
    }
  });

  HOOKS.battleResult.push(r =>
    r.resonant
      ? `<div class="result-list"><h4>Résonance</h4><div class="result-row"><span>Résonances déclenchées par votre équipe</span><b>${r.resonant}</b></div></div>`
      : ''
  );

  Object.assign(HELD_ITEMS, COMPETITIVE_HELD_ITEMS);

  Object.assign(HELD_IMG, {
    orbevie: 'life-orb',
    casquebrut: 'rocky-helmet',
    sitrus: 'sitrus-berry',
    mouchoir: 'choice-scarf',
    rochemeteo: 'damp-rock',
    grosseracine: 'big-root',
    lentillezoom: 'zoom-lens',
    metronome: 'metronome',
    ceinturepro: 'expert-belt',
  });

  Object.assign(SHOP, CONSUMABLE_SHOP_ITEMS);

  COMBAT_ITEMS = Object.keys(SHOP).filter(k => SHOP[k].category === 'combat');

  /* daily offers: three items at −30%, the same for the whole day */
  DAILY_OFFERS_CACHE = { d: '', k: [] };

  document.addEventListener('click', e => {
    const h = e.target.closest('[data-buyh]');
    if (h) {
      buyHeldItem(h.dataset.buyh);
      return;
    }
    const o = e.target.closest('[data-offre]');
    if (o) {
      SCREEN_STATE.bagView = 'boutique';
      SCREEN_STATE.bagCategory = o.dataset.offre;
      renderBag();
    }
  });

  /* ---------- the Guide: ranks, Expert attacks, notes and echoes, rendered by React (Tactics.jsx) ---------- */
}
