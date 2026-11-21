/* Living home (season, weather of the day) · contextual help in battle (added in v4.52). */

import { REACTIONS, WEATHER } from '../data/game-data.js';
import { ABILITIES } from '../data/moves.js';
import { POKEMON, WEATHER_NAME } from '../pokemon/pokemon.js';
import { ROLE_EFFECTS } from '../pokemon/roles-synergies.js';
import { byUid } from '../combat/engine.js';
import { battle, ui } from '../combat/ui.js';
import { tileTip } from '../combat/battle-panel.js';
import { overlay } from '../progression/prestige.js';
import { shut } from '../../screens/overlays/tempStore.js';
import { todayWeather } from './pokegear.js';
import { effectsEnabled } from '../audio/immersion.js';

/* ---------- 1. living home ---------- */
function currentSeason() {
  const m = new Date().getMonth();
  return m >= 2 && m <= 4 ? 'printemps' : m >= 5 && m <= 7 ? 'ete' : m >= 8 && m <= 10 ? 'automne' : 'hiver';
}

/** Season and weather of the day on the Home hero (rendering: src/screens/home/Hero.jsx). */
export function homeSkyInfo() {
  const wx = effectsEnabled() ? todayWeather() : null,
    se = effectsEnabled() ? currentSeason() : '';
  if (!se) {
    return null;
  }
  return { se, wx, txt: SEASON_NAMES[se] + (wx ? ' · ' + WEATHER_NAMES[wx] : '') };
}

/* ---------- 2. contextual help in battle ---------- */
// help data (rendering: src/screens/overlays/transients/Windows.jsx, BattleHelp)
function battleHelpData() {
  const u = ui.sel != null ? byUid(battle, ui.sel) : null,
    out = { sel: null, terrainList: [], wx: null, rx: [] };
  if (u && POKEMON[u.id]) {
    const m = POKEMON[u.id],
      roles = [m.r, m.r2].filter((r, k, a) => r && a.indexOf(r) === k),
      tl = ABILITIES[u.ability];
    out.sel = {
      n: u.n,
      roles: roles.map(r => [r, ROLE_EFFECTS[r] ? [ROLE_EFFECTS[r].k, ROLE_EFFECTS[r].d] : null]),
      ability: tl ? [tl[0], tl[1]] : null,
    };
  }
  const seen = [];
  Object.keys(battle.tiles || {}).forEach(k => {
    const t = battle.tiles[k];
    const kind = t.pil
      ? 'pil'
      : t.rock
        ? 'rock'
        : t.w
          ? 'w'
          : t.lava > 0
            ? 'lava'
            : t.mud > 0
              ? 'mud'
              : t.fog > 0
                ? 'fog'
                : t.grass
                  ? 'grass'
                  : t.sand
                    ? 'sand'
                    : t.trap
                      ? 'trap'
                      : t.mark
                        ? 'mark'
                        : '';
    if (kind && !seen.some(x => x[0] === kind)) {
      seen.push([kind, k]);
    }
  });
  const displayName = {
    pil: 'Pilier',
    rock: 'Rocher',
    w: 'Eau',
    lava: 'Lave',
    mud: 'Boue',
    fog: 'Brouillard',
    grass: 'Hautes herbes',
    sand: 'Sable',
    trap: 'Piège',
    mark: 'Marque',
  };
  out.terrainList = seen.map(([kd, k]) => [displayName[kd], tileTip(k)]);
  if (battle.wx && battle.wx.k) {
    const W = WEATHER.find(x =>
      (WEATHER_NAME[battle.wx.k] || '').toLowerCase().startsWith(x.n.toLowerCase().slice(0, 4))
    );
    if (W) {
      out.wx = { n: W.n, roundCount: battle.wx.n, d: W.d };
    }
  }
  out.rx = Object.keys(REACTIONS).map(k => [REACTIONS[k].n, REACTIONS[k].d]);
  return out;
}

function openBattleHelp() {
  if (!battle) {
    return;
  }
  const o = overlay('battle-help', battleHelpData());
  o.addEventListener('click', e => {
    if (e.target === o) {
      shut('battle-help');
    }
  });
}

const SEASON_NAMES = { printemps: 'Printemps', ete: 'Été', automne: 'Automne', hiver: 'Hiver' };

const WEATHER_NAMES = { pluie: 'pluie', soleil: 'soleil', grele: 'grêle', sable: 'sable' };

// Instructions run at startup, in the original order (see index.js).
export function init() {
  document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('[data-help-action]');
    if (!b) {
      return;
    }
    if (b.dataset.helpAction === 'help') {
      openBattleHelp();
    } else if (b.dataset.helpAction === 'close') {
      shut('battle-help');
    }
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      shut('battle-help');
    }
  });
}
