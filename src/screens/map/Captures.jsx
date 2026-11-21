import { PROFILE } from '../../engine/state/game-state.js';
import { pokemonArtUrl } from '../../engine/assets/images.js';
import { FAMILY_REGION_NAMES, ROUTE_NAMES, regionIndex } from '../../engine/world/catch-anywhere.js';
import { DIPLOMA_REWARDS, familyCaptureStats } from '../../engine/progression/regional-dex.js';

// Families captured in the region, below the route. Clicking a Pokémon
// (data-region-dex) is still handled by the engine.
export default function Captures() {
  const r = regionIndex(),
    c = familyCaptureStats(r),
    endStep = c.n >= c.t;
  return (
    <div id="region-dex" className="map-captures">
      <div className="map-captures-header">
        <b>{`${ROUTE_NAMES[r]} · ${c.n} / ${c.t} familles capturées`}</b>
        <span className="map-captures-reward">
          {endStep
            ? `Pokédex de ${FAMILY_REGION_NAMES[r]} complet ✓`
            : `Diplôme : +${DIPLOMA_REWARDS[r][0]} ₽ · +${DIPLOMA_REWARDS[r][1]} Éclats`}
        </span>
      </div>
      {'\n '}
      <span className="map-captures-bar" aria-hidden="true">
        <i style={{ width: `${Math.round((c.n / Math.max(1, c.t)) * 100)}%` }} />
      </span>
      {'\n '}
      <div className="map-captures-list">
        {c.L.map(m => {
          const own = PROFILE.box.includes(m.id);
          return (
            <button
              type="button"
              className={'map-captures-pokemon' + (own ? ' is-caught' : '')}
              data-region-dex={m.id}
              aria-label={own ? m.n + ', capturé' : 'Pokémon pas encore capturé'}
              key={m.id}
            >
              <img src={pokemonArtUrl(m.no)} alt="" loading="lazy" decoding="async" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
