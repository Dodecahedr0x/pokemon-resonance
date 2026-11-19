import { PROFILE } from '../../engine/state/game-state.js';
import { PIX } from '../../engine/state/economy.js';
import { FAMILY_REGION_NAMES, ROUTE_NAMES, regionIndex } from '../../engine/world/catch-anywhere.js';
import { DIPLOMA_REWARDS, familyCaptureStats } from '../../engine/combat/catches.js';

// Families captured in the region (v4.28), below the route. Clicking a Pokémon
// (data-region-dex) is still handled by the engine.
export default function Captures() {
  const r = regionIndex(),
    c = familyCaptureStats(r),
    endStep = c.n >= c.t;
  return (
    <div id="region-dex" className="region-dex">
      <div className="region-dex-h">
        <b>{`${ROUTE_NAMES[r]} · ${c.n} / ${c.t} familles capturées`}</b>
        <span className="region-dex-g">
          {endStep
            ? `Pokédex de ${FAMILY_REGION_NAMES[r]} complet ✓`
            : `Diplôme : +${DIPLOMA_REWARDS[r][0]} ₽ · +${DIPLOMA_REWARDS[r][1]} Éclats`}
        </span>
      </div>
      {'\n '}
      <span className="region-dex-bar" aria-hidden="true">
        <i style={{ width: `${Math.round((c.n / Math.max(1, c.t)) * 100)}%` }} />
      </span>
      {'\n '}
      <div className="region-dex-l">
        {c.L.map(m => {
          const own = PROFILE.box.includes(m.id);
          return (
            <button
              type="button"
              className={'region-dex-m' + (own ? ' on' : '')}
              data-region-dex={m.id}
              aria-label={own ? m.n + ', capturé' : 'Pokémon pas encore capturé'}
              key={m.id}
            >
              <img src={PIX(m.no)} alt="" loading="lazy" decoding="async" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
