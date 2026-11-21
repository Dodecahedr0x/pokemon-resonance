/* Calendar events (device date, works offline): Night of Specters, December Frost, Spring Bloom, Summer Heatwave and the Shiny Weekend (added in v4.11). */

import { POKEMON } from '../pokemon/pokemon.js';
import { PROFILE } from '../state/game-state.js';
import { toast } from '../core/utils.js';
import { refreshHome, setRoute } from '../../screens/home/homeStore.js';
import { HOOKS } from '../core/hooks.js';
import { queueSave } from '../state/saves.js';
import { sfx, vibe } from '../audio/sound-effects.js';
import { SHOP, bagN } from '../state/economy.js';

/* The season's types appear more often in tall grass, capturing them yields
   1 Shard, weather shows up in wild battles, and a gift awaits on the Home
   screen (once per season). */

/* ---------- profile: Team Dissonance progress and seasonal gifts (declared functions: called as soon as the file loads) ---------- */
export function MON0() {
  return { dissonance: 0, giftsClaimed: {} };
}

export function monClean(p) {
  const o = MON0();
  if (!p || typeof p !== 'object') {
    return o;
  }
  if (Number.isFinite(p.dissonance)) {
    o.dissonance = Math.max(0, Math.min(4, Math.floor(p.dissonance)));
  }
  if (p.giftsClaimed && typeof p.giftsClaimed === 'object') {
    for (const k in p.giftsClaimed) {
      if (/^[a-z]+-\d{4}$/.test(k)) {
        o.giftsClaimed[k] = 1;
      }
    }
  }
  return o;
}

/** Today's season (declared function: encounter rolls need it). */
function seasonOf(d) {
  d = d || new Date();
  const md = (d.getMonth() + 1) * 100 + d.getDate();
  if (md >= 1020 && md <= 1105) {
    return 'halloween';
  }
  if (md >= 1215 || md <= 105) {
    return 'hiver';
  }
  if (md >= 320 && md <= 430) {
    return 'printemps';
  }
  if (md >= 701 && md <= 831) {
    return 'ete';
  }
  if (d.getDay() === 0 || d.getDay() === 6) {
    return 'weekend';
  }
  return null;
}

/** A species' weight in tall grass, depending on the season. */
export function seasonWeight(m) {
  const s = season();
  return s && s.types.length && m.t.some(t => s.types.includes(t)) ? 3 : 1;
}

/** Shiny chance, depending on the season. */
export function multChroma() {
  const s = season();
  return ((s && s.shiny) || 1) * (bagN('charme') ? 3 : 1); // Shiny Charm (v4.15)
}

function giftTaken() {
  return !!(PROFILE.giftsClaimed && PROFILE.giftsClaimed[giftKey()]);
}

function takeGift() {
  const s = season();
  if (!s || !s.giftFlag || giftTaken()) {
    return;
  }
  PROFILE.giftsClaimed = PROFILE.giftsClaimed || {};
  PROFILE.giftsClaimed[giftKey()] = 1;
  const txt = [];
  for (const k in s.giftFlag) {
    if (!SHOP[k]) {
      continue;
    }
    PROFILE.bag[k] = Math.min(99, bagN(k) + s.giftFlag[k]);
    txt.push(`${s.giftFlag[k]} × ${SHOP[k].n}`);
  }
  sfx('ui');
  vibe(30);
  toast(`Cadeau de la saison : ${txt.join(', ')} !`);
  queueSave();
  renderSeason();
}

/** Today's season on the route (data-saison of #route). */
export function seasonRoute() {
  setRoute({ season: season() ? seasonOf() : '' });
}

/** #v4Saison block of the Home screen (src/screens/home/Footer.jsx): the season and its gift. */
export function seasonData() {
  const s = season();
  return s ? { s, isTaken: giftTaken() } : null;
}

export function renderSeason() {
  seasonRoute();
  refreshHome();
}

const SEASONS = {
  halloween: {
    n: 'Nuit des Spectres',
    d: 'Les Pokémon Spectre, Ténèbres et Poison sortent des hautes herbes, la nuit tombe sur les combats sauvages, et chaque capture de ces types rapporte 1 Éclat.',
    types: ['Spectre', 'Ténèbres', 'Poison'],
    nuit: true,
    giftFlag: { hyper: 3 },
    c: '#8a5cf6',
  },
  hiver: {
    n: 'Givre de décembre',
    d: 'Les Pokémon Glace et Eau sortent des hautes herbes, la grêle tombe sur les combats sauvages, et chaque capture de ces types rapporte 1 Éclat.',
    types: ['Glace', 'Eau'],
    wx: 'grele',
    giftFlag: { super: 3, superpotion: 2 },
    c: '#8fd8ff',
  },
  printemps: {
    n: 'Floraison de printemps',
    d: 'Les Pokémon Plante, Fée et Insecte sortent des hautes herbes, et chaque capture de ces types rapporte 1 Éclat.',
    types: ['Plante', 'Fée', 'Insecte'],
    giftFlag: { potion: 5 },
    c: '#7ac74c',
  },
  ete: {
    n: 'Canicule d’été',
    d: 'Les Pokémon Feu, Eau et Électrik sortent des hautes herbes, le soleil tape sur les combats sauvages, et chaque capture de ces types rapporte 1 Éclat.',
    types: ['Feu', 'Eau', 'Électrik'],
    wx: 'soleil',
    giftFlag: { super: 5 },
    c: '#ee8130',
  },
  weekend: {
    n: 'Week-end chromatique',
    d: 'Le samedi et le dimanche, les Pokémon chromatiques sont deux fois plus fréquents.',
    types: [],
    shiny: 2,
    c: '#ffd75e',
  },
};

const season = () => SEASONS[seasonOf()] || null;

const giftKey = () => `${seasonOf()}-${new Date().getFullYear()}`;

// Instructions run at startup, in the original order (see index.js).
export function init() {
  document.addEventListener('click', e => {
    if (e.target.closest('[data-cadeau]')) {
      takeGift();
    }
  });

  // captures of the season's types: +1 Shard each
  HOOKS.progress.push((S, rew) => {
    const s = season();
    if (s && s.types.length && rew.caught && rew.caught.length) {
      const n = rew.caught.filter(c => POKEMON[c.id] && POKEMON[c.id].t.some(t => s.types.includes(t))).length;
      if (n) {
        rew.season = n;
        return [0, n];
      }
    }
    return null;
  });

  HOOKS.battleResult.push(r =>
    r.season
      ? `<div class="result-list"><h4>${season() ? season().n : 'Saison'}</h4><div class="result-row"><span>Capture de saison : +${r.season} Éclat${r.season > 1 ? 's' : ''}</span><b>✦</b></div></div>`
      : ''
  );

  // the season shows up in wild battles
  HOOKS.creation.push(S => {
    const s = season();
    if (!s || S.sc !== 'sauvage') {
      return;
    }
    if (s.wx && !S.wx) {
      S.wx = { k: s.wx, n: 5 };
    }
    if (s.nuit) {
      S.time = 'nuit';
      if (S.cycle && !S.cycle.frozen) {
        S.cycle = { ph: 'nuit', n: 0 };
      }
    }
  });
}
