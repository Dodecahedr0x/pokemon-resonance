/* Original section: v4.9-01-rejouabilite.js */

import { TYPES } from './004-data.js';
import { BY, SCEN } from './009-pokemon.js';
import { PROFILE, isCamp } from './011-game-state.js';
import { BADGES } from './013-gyms.js';
import { medal, tc, toast } from './014-utils.js';
import { HOOKS } from './015-hooks.js';
import { __set_squad, renderSquad, save, squad } from './020-team-cards.js';
import { P, hasNx, uAt } from './021-combat-engine.js';
import { scSel } from './024-combat-ui.js';
import { brWeapon466 } from './097-boss-rush-relics.js';
import { queueSave } from './025-saves.js';
import { PREF } from './026-campaign-tutorial-sound.js';
import { renderWallet } from './035-interface.js';
import { renderQuests } from './039-quests-shop.js';
import { renderParams } from './040-settings.js';
import { ROLE_PROVIDERS } from './044-tactical-engine.js';

export let ACHIEVEMENTS;
export let CHALLENGE_CONF;


/* =====================================================================
   v4.9: replayability
   ---------------------------------------------------------------------
   1. Mutators: a randomly drawn rule changes the whole battle
      (Déluge, Nuit éternelle, Gravité, Canons de verre, Champ de pièges…).
      Each Tower floor has one (except legend floors); optionally,
      Training battles too (+50% Pokédollars).
   2. Campaign challenges (Settings): Mono-type, Team of 3, No Awakening,
      Nuzlocke (a K.O.'d Pokémon no longer fights). Each active challenge
      earns extra Shards.
   3. Achievements and titles: 25 achievements (in Quests), 18 of which
      grant a title to wear next to your name.
   ===================================================================== */

/* ---------- profile (declared functions: called as soon as the game loads) ---------- */
export function REPLAY0() {
  return {
    succes: {},
    titre: '',
    cumul: {},
    defis: { mono: '', trio: false, sansEveil: false, nuzlocke: false },
    tombes: []
  };
}


export function replayClean(p) {
  const o = REPLAY0();
  if (!p || typeof p !== 'object') return o;
  if (p.succes && typeof p.succes === 'object')
    {for (const k in p.succes) if (/^[a-z0-9]{2,16}$/.test(k) && Number.isFinite(p.succes[k])) o.succes[k] = p.succes[k];}
  if (typeof p.titre === 'string' && o.succes[p.titre]) o.titre = p.titre;
  if (p.cumul && typeof p.cumul === 'object')
    {for (const k in p.cumul) if (/^[a-z]{2,12}$/.test(k) && Number.isFinite(p.cumul[k])) o.cumul[k] = Math.max(0, Math.floor(p.cumul[k]));}
  const d = p.defis;
  if (d && typeof d === 'object') {
    if (typeof d.mono === 'string' && TYPES[d.mono]) o.defis.mono = d.mono;
    ['trio', 'sansEveil', 'nuzlocke'].forEach(k => (o.defis[k] = !!d[k]));
  }
  if (Array.isArray(p.tombes)) o.tombes = [...new Set(p.tombes.filter(id => BY[id] && BY[id].base === id))];
  return o;
}


/* =====================================================================
   1. Mutators
   ===================================================================== */
/** Names and descriptions (declared function: the Tower needs it as soon as the game loads). */
export function mutInfo(id) {
  return (
    {
      deluge: ['Déluge', 'Pluie pendant tout le combat.', 'Eau'],
      canicule: ['Canicule', 'Soleil pendant tout le combat.', 'Feu'],
      blizzard: ['Grêle éternelle', 'Grêle pendant tout le combat.', 'Glace'],
      simoun: ['Simoun', 'Tempête de sable pendant tout le combat.', 'Sol'],
      eclipse: ['Nuit éternelle', 'Il fait nuit tout le combat : Spectre et Ténèbres ×1,2, −1 de portée au-delà de 2 cases.', 'Ténèbres'],
      gravite: ['Gravité', 'Personne ne vole ni ne lévite (pièges et Sol touchent tout le monde), et −1 Mouvement pour tous.', 'Psy'],
      frenesie: ['Frénésie', '+1 Mouvement pour tous.', 'Vol'],
      verre: ['Canons de verre', 'Tous les dégâts ×1,5, des deux côtés.', 'Combat'],
      remparts: ['Remparts', 'Tous les dégâts ×0,7, et 3 manches de plus.', 'Acier'],
      echo: ['Écho', '+2 Voix à chaque manche.', 'Fée'],
      champ: ['Champ de pièges', '6 pièges posés au hasard au milieu du plateau. Ils touchent les deux camps.', 'Roche'],
      eveil: ['Éveil précoce', 'Vos Pokémon commencent avec 2 points d’Éveil sur 3.', 'Dragon']
    }[id] || null
  );
}


/** A Tower floor's mutator: from floor 2 on, except legend floors. */
export function mutOfTurn(run, f) {
  if (!run || f < 2 || f % 5 === 0) return null;
  const ids = ['deluge', 'canicule', 'blizzard', 'simoun', 'eclipse', 'gravite', 'frenesie', 'verre', 'remparts', 'echo', 'champ', 'eveil'];
  return ids[Math.abs(Math.floor(run.seed * 7 + f * 13)) % ids.length];
}


/** Optional: a random mutator for Training battles. */
export function mutTraining() {
  const D = SCEN[scSel];
  if (!PREF.mutEntr || !D || D.tuto || D.tower || D.rule || D.elite || D.champ || D.legend || D.hleg435 || D.cap435 || D.rival || D.rival429 || D.hebdo429) return null;
  return MUT_IDS[Math.floor(Math.random() * MUT_IDS.length)];
}


function applyMutator(S, id) {
  if (!mutInfo(id)) return;
  S.mut = id;
  if (WEATHER_MUT[id]) S.wx = { k: WEATHER_MUT[id], n: 99 };
  if (id === 'eclipse') {
    S.time = 'nuit';
    S.cyc = { ph: 'nuit', n: 0, fige: true };
  }
  if (id === 'gravite') {
    S.mutMov = -1;
    S.units.forEach(u => (u.cloue = true));
  }
  if (id === 'frenesie') S.mutMov = 1;
  if (id === 'remparts') S.lim += 3;
  if (id === 'echo') {
    S.vmax += 2;
    S.voix += 2;
  }
  if (id === 'eveil') S.units.forEach(u => u.side === 'a' && hasNx(u) && (u.en = Math.max(u.en, 2)));
  if (id === 'champ') {
    const freeOnes = Object.keys(S.tiles).filter(k => {
      const t = S.tiles[k],
        c = P(k)[0];
      return c >= 2 && c <= 5 && !t.rock && !t.w && !uAt(S, k) && !t.trap;
    });
    const kinds = ['picots', 'picots', 'roc', 'toile'];
    for (let i = 0; i < 6 && freeOnes.length; i++) {
      const k = freeOnes.splice(Math.floor(Math.random() * freeOnes.length), 1)[0];
      S.tiles[k].trap = { k: kinds[i % kinds.length], side: 'n', by: null, d: 99 };
    }
  }
}


export function chipMut(S) {
  if (!S || !S.mut) return '';
  const I = mutInfo(S.mut);
  return `<span class="chip chip-mut" title="${I[1]}"><i style="background:${tc(I[2])}"></i>${I[0]}</span>`;
}


export function activeChallenges() {
  if (!isCamp() || !PROFILE.defis) return [];
  return Object.keys(CHALLENGES).filter(k => PROFILE.defis[k]);
}


export function isFallen(id) {
  return !!(isCamp() && PROFILE.defis && PROFILE.defis.nuzlocke && BY[id] && (PROFILE.tombes || []).includes(BY[id].base));
}


/** Can this Pokémon join the team? (null: yes; otherwise the reason) */
export function challengeRefusal(id) {
  if (!isCamp() || !PROFILE.defis) return null;
  const m = BY[id],
    d = PROFILE.defis;
  if (!m) return null;
  if (isFallen(id)) return `${BY[m.base].n} est tombé au combat (Nuzlocke) : il ne combat plus.`;
  if (d.mono && !m.t.includes(d.mono)) return `Défi Mono-type ${d.mono} : ${m.n} n’est pas de ce type.`;
  if (d.trio && squad.length >= 3 && !squad.some(x => BY[x].base === m.base)) return 'Défi Équipe de 3 : trois Pokémon au plus.';
  return null;
}


/** Before starting a campaign battle. */
export function challengeLaunch() {
  if (brWeapon466()) return null;
  const D = SCEN[scSel];
  if (!isCamp() || !D || D.tuto || D.tower) return null;
  const d = PROFILE.defis || {},
    eq = squad.slice(0, teamSize());
  const t = eq.find(isFallen);
  if (t) return `${BY[t].n} est tombé au combat (Nuzlocke) : retirez-le de l’équipe.`;
  if (d.mono) {
    const x = eq.find(id => !BY[id].t.includes(d.mono));
    if (x) return `Défi Mono-type ${d.mono} : ${BY[x].n} n’est pas de ce type. Retirez-le de l’équipe.`;
  }
  return null;
}


/** Checks achievements; returns those just unlocked. */
function verifySuccess(c) {
  PROFILE.succes = PROFILE.succes || {};
  const freshList = [];
  ACHIEVEMENTS.forEach(s => {
    if (PROFILE.succes[s.id]) return;
    let ok = false;
    try {
      ok = !!s.ok(c);
    } catch { /* Best effort: failure here is non-fatal. */ }
    if (ok) {
      PROFILE.succes[s.id] = Date.now();
      freshList.push(s.id);
    }
  });
  return freshList;
}


export function displayedTitle() {
  return PROFILE.titre && PROFILE.succes && PROFILE.succes[PROFILE.titre] ? titleOf(PROFILE.titre) : '';
}


/* ---------- Quests: the Achievements tab, rendered by React (src/screens/quests/Achievements.jsx) ---------- */


function updateChallenges() {
  queueSave();
  renderParams();
  renderWallet();
}

const MUT_IDS = ['deluge', 'canicule', 'blizzard', 'simoun', 'eclipse', 'gravite', 'frenesie', 'verre', 'remparts', 'echo', 'champ', 'eveil'];


const WEATHER_MUT = { deluge: 'pluie', canicule: 'soleil', blizzard: 'grele', simoun: 'sable' };


/* =====================================================================
   2. Campaign challenges
   ===================================================================== */
export const CHALLENGES = {
  mono: ['Mono-type', 'Seuls les Pokémon du type choisi peuvent combattre.'],
  trio: ['Équipe de 3', 'Trois Pokémon par combat au lieu de quatre.'],
  sansEveil: ['Sans Éveil', 'Vos Pokémon ne s’éveillent pas en combat.'],
  nuzlocke: ['Nuzlocke', 'Un Pokémon mis K.O. tombe au combat : il ne combattra plus de cette campagne.']
};


export const teamSize = () => (isCamp() && PROFILE.defis && PROFILE.defis.trio ? 3 : 4);


/* =====================================================================
   3. Achievements and titles
   ===================================================================== */
const cumulative = k => (PROFILE.cumul && PROFILE.cumul[k]) || 0;


const titleOf = id => (ACHIEVEMENTS.find(s => s.id === id) || {}).t || '';

// Statements run at startup, in the original order (see index.js).
export function __init() {

ROLE_PROVIDERS.push({
  id: 'mutateur',
  fournir: (c, { S }) =>
    S.mut === 'verre' ? { mul: 1.5, libelle: 'Canons de verre' } : S.mut === 'remparts' ? { mul: 0.7, libelle: 'Remparts' } : null
});


ACHIEVEMENTS = [
  { id: 'victoire', n: 'Première victoire', d: 'Gagner un combat.', ok: c => c.win },
  { id: 'eclair', n: 'Éclair', d: 'Gagner en 3 manches ou moins.', t: 'Éclair', ok: c => c.win && c.S.round <= 3 },
  { id: 'intact', n: 'Intouchable', d: 'Gagner sans perdre un seul Pokémon.', t: 'Intouchable', ok: c => c.win && c.S.units.every(u => u.side !== 'a' || !u.ko) },
  { id: 'alchimiste', n: 'Alchimiste', d: 'Déclencher 5 réactions dans un même combat.', t: 'Alchimiste', ok: c => (c.S.stats.rx || 0) >= 5 },
  { id: 'eveils', n: 'Triple Éveil', d: 'Réussir 3 Éveils dans un même combat.', ok: c => (c.S.stats.evo || 0) >= 3 },
  { id: 'capture10', n: 'Collection', d: 'Capturer 10 Pokémon.', t: 'As de la capture', ok: () => PROFILE.caught >= 10, p: () => [PROFILE.caught, 10] },
  { id: 'badges4', n: 'Mi-parcours', d: 'Gagner 4 badges.', ok: () => BADGES.length >= 4, p: () => [BADGES.length, 4] },
  { id: 'badges8', n: 'Huit badges', d: 'Gagner les 8 badges.', t: 'Élite des arènes', ok: () => BADGES.length >= 8, p: () => [BADGES.length, 8] },
  { id: 'champion', n: 'Sacre', d: 'Battre la Championne de la Ligue.', t: 'Légende de la Ligue', ok: () => PROFILE.elite >= 5 },
  { id: 'kael', n: 'Rival vaincu', d: 'Battre Kael les 4 fois.', ok: () => PROFILE.rival >= 4, p: () => [PROFILE.rival, 4] },
  { id: 'legendes', n: 'Légende vivante', d: 'Vaincre les 6 légendes.', t: 'Légende vivante', ok: () => PROFILE.legends.length >= 6, p: () => [PROFILE.legends.length, 6] },
  { id: 'tour10', n: 'Cime de la Tour', d: 'Atteindre l’étage 10 de la Tour de Résonance.', t: 'Cime de la Tour', ok: () => PROFILE.tdr.best >= 10, p: () => [PROFILE.tdr.best, 10] },
  { id: 'chroma', n: 'Œil de lynx', d: 'Capturer un Pokémon chromatique.', t: 'Œil de lynx', ok: () => PROFILE.shiny.length >= 1 },
  { id: 'colosses', n: 'Tombe-colosses', d: 'Vaincre les 3 colosses.', t: 'Tombe-colosses', ok: () => (PROFILE.colosses || []).length >= 3, p: () => [(PROFILE.colosses || []).length, 3] },
  { id: 'briseur', n: 'Briseur de carapaces', d: 'Briser 6 parties de colosse.', ok: () => cumulative('parts') >= 6, p: () => [cumulative('parts'), 6] },
  { id: 'pyromane', n: 'Pyromane', d: 'Le feu court sur 15 cases de hautes herbes.', t: 'Pyromane', ok: () => cumulative('feu') >= 15, p: () => [cumulative('feu'), 15] },
  { id: 'noctambule', n: 'Noctambule', d: 'Gagner un combat qui s’achève de nuit.', t: 'Noctambule', ok: c => c.win && c.S.cyc && c.S.cyc.ph === 'nuit' },
  { id: 'pieges', n: 'As des pièges', d: 'L’adversaire tombe dans 10 de vos pièges.', t: 'As des pièges', ok: () => cumulative('pieges') >= 10, p: () => [cumulative('pieges'), 10] },
  { id: 'aviateur', n: 'As du ciel', d: 'Réussir 5 attaques Vol en fin de manche.', ok: () => cumulative('vols') >= 5, p: () => [cumulative('vols'), 5] },
  { id: 'mutants', n: 'Adaptable', d: 'Gagner 5 combats avec un mutateur.', t: 'Caméléon', ok: () => cumulative('mutants') >= 5, p: () => [cumulative('mutants'), 5] },
  { id: 'tete', n: 'Tête dure', d: 'Gagner un badge avec un défi de campagne actif.', t: 'Tête dure', ok: c => c.win && c.rew.badgeNew && activeChallenges().length > 0 },
  { id: 'survivant', n: 'Increvable', d: 'Gagner les 8 badges en Nuzlocke.', t: 'Increvable', ok: () => BADGES.length >= 8 && isCamp() && !!(PROFILE.defis && PROFILE.defis.nuzlocke) },
  { id: 'dissonance', n: 'Silence brisé', d: 'Vaincre la Team Dissonance.', t: 'Fléau de la Dissonance', ok: () => (PROFILE.dissonance || 0) >= 4, p: () => [PROFILE.dissonance || 0, 4] },
  { id: 'riche', n: 'Fortune', d: 'Avoir 20 000 ₽.', ok: () => PROFILE.money >= 20000, p: () => [Math.min(PROFILE.money, 20000), 20000] },
  { id: 'victoires50', n: 'Cinquante victoires', d: 'Gagner 50 combats.', t: 'Inarrêtable', ok: () => PROFILE.wins >= 50, p: () => [PROFILE.wins, 50] }
];


/* =====================================================================
   Hooks
   ===================================================================== */
HOOKS.creation.push((S, opt, D0) => {
  const m = (opt && opt.mut) || D0.mut;
  if (m) applyMutator(S, m);
  if (opt && Array.isArray(opt.defis) && opt.defis.includes('sansEveil') && !D0.tuto) S.sansEveil = true;
});


// weather mutators last the whole battle
HOOKS.avantFinManche.push(S => {
  if (S.mut && WEATHER_MUT[S.mut]) S.wx = { k: WEATHER_MUT[S.mut], n: 99 };
});


HOOKS.progres.push((S, rew, win) => {
  const D = SCEN[S.sc] || {};
  let m = 0,
    g = 0;
  // cumulative counters
  PROFILE.cumul = PROFILE.cumul || {};
  ['feu', 'pieges', 'vols', 'parts'].forEach(k => {
    if (S.stats[k]) PROFILE.cumul[k] = cumulative(k) + S.stats[k];
  });
  if (win && S.mut) PROFILE.cumul.mutants = cumulative('mutants') + 1;
  // mutator in Training: +50% Pokédollars
  if (win && S.mut && !D.tower) {
    m += Math.round(((rew.money || 0) * 0.5) / 10) * 10;
    rew.mut = S.mut;
  }
  // campaign challenges
  const df = D.tuto || D.tower ? [] : activeChallenges();
  if (df.length) {
    rew.defis = df;
    if (win) {
      const bonus = df.length * (rew.badgeNew ? 4 : 1);
      g += bonus;
      rew.defiBonus = bonus;
    }
    if (df.includes('nuzlocke')) {
      PROFILE.tombes = PROFILE.tombes || [];
      const deadList = S.units.filter(u => u.side === 'a' && u.ko && BY[u.sp]).map(u => BY[u.sp].base);
      deadList.forEach(b => {
        if (!PROFILE.tombes.includes(b)) {
          PROFILE.tombes.push(b);
          (rew.tombes = rew.tombes || []).push(b);
        }
      });
      if (rew.tombes) {
        __set_squad(squad.filter(id => !isFallen(id)));
        setTimeout(() => {
          try {
            save();
            renderSquad();
          } catch { /* Best effort: failure here is non-fatal. */ }
        }, 0);
      }
    }
  }
  // achievements
  const freshList = verifySuccess({ S, win, rew });
  if (freshList.length) rew.succes = freshList;
  return m || g ? [m, g] : null;
});


HOOKS.resultat.push(r => {
  const o = [];
  if (r.mut)
    {o.push(`<div class="res-l"><h4>Mutateur</h4><div class="rl"><span>${mutInfo(r.mut)[0]} : +50 % de Pokédollars</span><b>×1,5</b></div></div>`);}
  if (r.defis)
    {o.push(
      `<div class="res-l"><h4>Défis</h4><div class="rl"><span>${r.defis.map(k => CHALLENGES[k][0]).join(', ')}${r.defiBonus ? ` : +${r.defiBonus} Éclats` : ''}</span><b>${r.defis.length}</b></div>${(r.tombes || [])
        .map(b => `<div class="rl tombe">${medal(BY[b].t)}<span>${BY[b].n} est tombé au combat.</span><b>✝</b></div>`)
        .join('')}</div>`
    );}
  if (r.succes)
    {o.push(
      `<div class="res-l"><h4>Succès</h4>${r.succes
        .map(id => {
          const s = ACHIEVEMENTS.find(x => x.id === id);
          return `<div class="rl succ"><span><b>${s.n}</b> · ${s.d}${s.t ? ` Titre gagné : « ${s.t} ».` : ''}</span><b>★</b></div>`;
        })
        .join('')}</div>`
    );}
  return o.join('');
});


/* ---------- Settings: the challenges ---------- */
CHALLENGE_CONF = false;


document.addEventListener('change', e => {
  const x = e.target.closest('[data-defi]');
  if (!x || !isCamp()) return;
  PROFILE.defis = PROFILE.defis || REPLAY0().defis;
  const k = x.dataset.defi;
  PROFILE.defis[k] = k === 'mono' ? x.value : x.checked;
  if (k === 'mono' && x.value) toast(`Défi Mono-type ${x.value} : seuls les Pokémon de ce type combattront.`);
  updateChallenges();
});


document.addEventListener('click', e => {
  const n = e.target.closest('[data-nz]');
  if (n && isCamp()) {
    const a = n.dataset.nz;
    PROFILE.defis = PROFILE.defis || REPLAY0().defis;
    if (a === 'on') CHALLENGE_CONF = true;
    else if (a === 'non') CHALLENGE_CONF = false;
    else if (a === 'ok') {
      CHALLENGE_CONF = false;
      PROFILE.defis.nuzlocke = true;
      PROFILE.tombes = [];
      toast('Nuzlocke : chaque K.O. compte désormais.');
    } else if (a === 'stop') {
      PROFILE.defis.nuzlocke = false;
      toast('Nuzlocke abandonné.');
    }
    updateChallenges();
    return;
  }
  const t = e.target.closest('[data-titre]');
  if (t) {
    PROFILE.titre = PROFILE.titre === t.dataset.titre ? '' : t.dataset.titre;
    queueSave();
    renderQuests();
    renderWallet();
  }
});
}
