/* Original section: 4.65: monthly seasonal events */

import { BY, SCEN } from './009-pokemon.js';
import { ARENAS } from './013-gyms.js';
import { writeLS, toast } from './014-utils.js';
import { HOOKS } from './015-hooks.js';
import { esc } from './025-saves.js';
import { sfx, vibe } from './026-campaign-tutorial-sound.js';
import { overlay } from './030-prestige-staging.js';
import { shut } from '../screens/overlays/tempStore.js';
import { savePurse, today } from './032-v4-foundation.js';
import { refreshHome } from '../screens/home/homeStore.js';
import { DAMAGE_PROVIDERS } from './044-tactical-engine.js';
import { applyReward, rewardText } from './084-peddler-route-missions.js';
import { isCountedBattle } from './095-trainer-talent-tree.js';

/** Season banner on the Home page (#seasonEvent, rendering: src/screens/home/Banners.jsx). */
export function seasonBannerData() {
  const S0 = eventSeason(),
    s = seasonState(),
    top = TIER_POINTS[TIER_POINTS.length - 1][0],
    pc = Math.min(100, Math.round((s.pts / top) * 100));
  return { S0, pts: s.pts, top, pc };
}

function seasonOpen() {
  const S0 = eventSeason(),
    s = seasonState(),
    vd = featuredGym();
  const tiers = TIER_POINTS.map(([p, n, R], i) => ({ p, n, txt: rewardText(R), ok: s.pts >= p, got: !!s.got[i] }));
  const gym = SCEN[vd] ? SCEN[vd].n : vd;
  // rendering: src/screens/overlays/transients/Windows.jsx (SeasonEvent)
  const o = overlay('season-event-o', { n: S0.n, d: S0.d, t: S0.t, arene: gym, tiers, won: s.won || 0 });
  o.addEventListener('click', e => {
    if (e.target === o) {
      shut('season-event-o');
    }
  });
}

const SEASON_LIST = [
  { n: 'Grand Froid', t: 'Glace', d: 'L’hiver s’installe : les Pokémon Glace sont à l’honneur.' },
  { n: 'Cœur de Fée', t: 'Fée', d: 'Un mois de douceur et de magie pour les Pokémon Fée.' },
  { n: 'Éveil de la Sève', t: 'Plante', d: 'Le printemps réveille les Pokémon Plante.' },
  { n: 'Grand Bourdonnement', t: 'Insecte', d: 'Les Pokémon Insecte sortent en essaim.' },
  { n: 'Grands Vents', t: 'Vol', d: 'Les courants d’air portent les Pokémon Vol.' },
  { n: 'Marées Vives', t: 'Eau', d: 'Les Pokémon Eau profitent des marées.' },
  { n: 'Canicule', t: 'Feu', d: 'La chaleur met les Pokémon Feu en pleine forme.' },
  { n: 'Orages d’été', t: 'Électrik', d: 'Les orages chargent les Pokémon Électrik.' },
  { n: 'Rochers en fête', t: 'Roche', d: 'Les Pokémon Roche tiennent bon avec l’automne qui arrive.' },
  { n: 'Nuit des Spectres', t: 'Spectre', d: 'Les Pokémon Spectre rôdent à l’approche d’Halloween.' },
  { n: 'Tournoi des Poings', t: 'Combat', d: 'Les Pokémon Combat défient tous les dresseurs.' },
  { n: 'Légende des Dragons', t: 'Dragon', d: 'Les Pokémon Dragon veillent sur les fêtes de fin d’année.' },
];

const TIER_POINTS = [
  [5, 'Premiers pas', { m: 600, b: { potion: 2 } }],
  [10, 'Régulier', { g: 3 }],
  [18, 'Passionné', { m: 1500, b: { superpotion: 2 } }],
  [28, 'Expert', { g: 5, m: 1500 }],
  [40, 'Légende du mois', { g: 10, m: 3000 }],
];

const monthKey = () => today().slice(0, 7);

const monthIndex = () => Math.max(0, Math.min(11, (parseInt(today().slice(5, 7), 10) || 1) - 1));

const eventSeason = () => SEASON_LIST[monthIndex()];

const featuredGym = () => ARENAS[(monthIndex() * 3 + (parseInt(today().slice(0, 4), 10) || 0)) % ARENAS.length].k;

const seasonState = () => {
  let s;
  try {
    s = JSON.parse(localStorage.getItem('res-season-event') || 'null');
  } catch (e) {
    s = null;
  }
  s = s || { won: 0 };
  if (s.m !== monthKey()) {
    if (s.m && s.pts >= TIER_POINTS[TIER_POINTS.length - 1][0]) {
      s.won = (s.won || 0) + 1;
    }
    s = { m: monthKey(), pts: 0, got: {}, won: s.won || 0 };
  }
  s.got = s.got || {};
  return s;
};

const seasonSave = s => {
  writeLS('res-season-event', s);
};

// Startup statements, run in their original order (see index.js).
export function __init() {
  HOOKS.combat.push(S => {
    if (isCountedBattle(S)) {
      S.seasonEvent = eventSeason().t;
    }
  });

  DAMAGE_PROVIDERS.push({
    id: 'season-bonus',
    provide: (c, { S, u }) =>
      !!u &&
      u.side === 'a' &&
      !!S &&
      !!S.seasonEvent &&
      BY[u.id] &&
      BY[u.id].t.includes(S.seasonEvent) && { mul: 1.05, labelText: 'Saison : ' + S.seasonEvent },
  });

  HOOKS.progress.unshift((S, rew, win) => {
    try {
      if (!win || !isCountedBattle(S)) {
        return null;
      }
      const t = eventSeason().t,
        s = seasonState();
      let n = 1;
      if (S.units.some(u => u.side === 'a' && BY[u.id] && BY[u.id].t.includes(t))) {
        n += 1;
      }
      if (S.sc === featuredGym()) {
        n += 2;
      }
      s.pts += n;
      seasonSave(s);
      rew.seasonEvent = { n, tot: s.pts };
    } catch {
      /* Best effort: failure here is non-fatal. */
    }
    return null;
  });

  HOOKS.battleResult.unshift(r =>
    r.seasonEvent
      ? `<div class="res-l"><h4>${esc(eventSeason().n)}</h4><div class="rl"><span>Points de saison : +${r.seasonEvent.n}</span><b>${r.seasonEvent.tot}</b></div></div>`
      : ''
  );

  document.addEventListener(
    'click',
    e => {
      const b = e.target.closest && e.target.closest('[data-season-event]');
      if (!b) {
        return;
      }
      e.stopPropagation();
      e.preventDefault();
      const v = b.dataset.seasonEvent;
      if (v === 'open') {
        return seasonOpen();
      }
      if (v === 'close') {
        return shut('season-event-o');
      }
      if (b.disabled) {
        return;
      }
      const s = seasonState(),
        i = +v,
        T = TIER_POINTS[i];
      if (!T || s.got[i] || s.pts < T[0]) {
        return;
      }
      s.got[i] = 1;
      if (i === TIER_POINTS.length - 1) {
        s.won = (s.won || 0) + 0;
      }
      seasonSave(s);
      applyReward(T[2]);
      sfx('win');
      vibe([30, 40, 30]);
      toast('Récompense de saison : ' + rewardText(T[2]) + '.');
      savePurse();
      seasonOpen();
      refreshHome(); // #seasonEvent banner
    },
    true
  );
}
