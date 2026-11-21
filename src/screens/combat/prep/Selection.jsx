import { Html } from '../../../lib/html.jsx';
import { PROFILE } from '../../../engine/state/game-state.js';
import { SCEN } from '../../../engine/pokemon/pokemon.js';
import { ARENAS, BADGES } from '../../../engine/modes/gyms.js';
import { tc } from '../../../engine/core/utils.js';
import { scenLock } from '../../../engine/combat/items-bonds-ai.js';
import { scSel } from '../../../engine/combat/ui.js';
import { leaderOf } from '../../../engine/progression/prestige.js';
import { SELG, emblem, selItems, wonOf } from '../../../engine/world/home-journey.js';
import { FINALE_N } from '../../../engine/world/map.js';

// Tabs (#selTabs): Training, Gyms, League, Postgame. Clicks: engine (data-pg).
export function SelTabs({ G }) {
  const nA = BADGES.length,
    nL = Math.min(4, PROFILE.elite);
  const cnt = {
    terrains: `${selItems('terrains').length} combats`,
    arenes: `${nA} / 8 badges`,
    ligue: `${nL} / 4${PROFILE.elite >= 5 ? ' · ★' : ''}`,
    apres: `${PROFILE.legends.length} / 6 · étage ${PROFILE.tdr.best}`,
  };
  return SELG.map(([g, n, ic]) => (
    <button key={g} type="button" role="tab" data-pg={g} aria-selected={G === g}>
      <svg>
        <use href={'#' + ic} />
      </svg>
      <span>
        <b>{n}</b>
        <em>{cnt[g]}</em>
      </span>
    </button>
  ));
}

// A row of the list (#scenList): emblem, name, and on the right lock, step, rank or level.
function Row({ k, gk }) {
  const s = SCEN[k],
    lk = scenLock(k),
    won = wonOf(k),
    L = leaderOf(k),
    r = (PROFILE.ranks || {})[k],
    gi = ARENAS.findIndex(a => a.k === k);
  const right = lk ? (
    <svg className="prep-row-lock" aria-label="Verrouillé">
      <use href="#i-lock" />
    </svg>
  ) : k === gk ? (
    <span className="pill nx">Prochaine étape</span>
  ) : r ? (
    <span className={`best-rank is-${r}`} title="Meilleur rang">
      {r}
    </span>
  ) : won ? (
    <svg className="prep-row-won" aria-label="Réussi">
      <use href="#i-check" />
    </svg>
  ) : (
    <span className="srw-lv">N.{s.lv}</span>
  );
  return (
    <button
      type="button"
      role="option"
      className={`prep-row${scSel === k ? ' is-selected' : ''}${lk ? ' is-locked' : ''}${won ? ' is-won' : ''}`}
      data-sc={k}
      aria-selected={scSel === k}
      style={{ '--ac': s.at ? tc(s.at) : '#E3350D' }}
    >
      <Html html={emblem(k, 'is-small' + (gi >= 0 && !won ? ' is-dim' : ''))} />
      <span className="prep-row-text">
        <b>
          <Html html={k === 'champ' ? FINALE_N : s.n} />
        </b>
        <em>
          <Html html={L ? L.n : s.tuto ? 'Combat guidé · 7 étapes' : s.lvl || ''} />
        </em>
      </span>
      <span className="prep-row-side">{right}</span>
    </button>
  );
}

export function SelList({ G, gk }) {
  return selItems(G).map((k, i) => <Row key={i} k={k} gk={gk} />);
}
