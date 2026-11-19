import { Html } from '../../lib/html.jsx';
import { PROFILE } from '../../engine/state/game-state.js';
import { tc } from '../../engine/core/utils.js';
import { PIX } from '../../engine/assets/item-icons.js';
import { V4 } from '../../engine/ui/screen-state.js';
import { ownedFam } from '../../engine/progression/trainer-stats.js';
import { DEXS, dexList } from '../../engine/progression/pokedex.js';
import { SPARK, isShinyOwned, shinyHue } from '../../engine/pokemon/shiny.js';
import { FAMILY_REGION_NAMES } from '../../engine/world/catch-anywhere.js';
import { familyCaptureStats } from '../../engine/progression/regional-dex.js';

// Bar counter (#dex4Cnt): obtained, shiny, then per region (v4.28).
export function DexCount() {
  const n = PROFILE.shiny.length;
  return (
    <span className="v4-dexcnt" id="dex4Cnt">
      <b>{DEXS.filter(m => ownedFam(m.id)).length}</b>
      {` / ${DEXS.length} obtenus`}
      {n ? ' · ' : null}
      {n ? (
        <span className="v4-shc">
          <Html html={SPARK} />
          {`${n} chromatique${n > 1 ? 's' : ''}`}
        </span>
      ) : null}
      <span className="diploma-count">
        {[1, 2, 3].map(r => {
          const c = familyCaptureStats(r),
            ok = (PROFILE.regionDiplomas || []).includes(r);
          return (
            <span className={ok ? 'ok' : ''} key={r}>
              {`${FAMILY_REGION_NAMES[r]} `}
              <b>{c.n}</b>
              {`/${c.t}${ok ? ' ✓' : ''}`}
            </span>
          );
        })}
      </span>
    </span>
  );
}

// Pokédex list (#dex4List). Shiny thumbnails (v4.25) are added by the engine.
export function DexList() {
  const L = dexList();
  return (
    <div className="v4-dexlist v4-panel" id="dex4List" role="listbox" aria-label="Liste du Pokédex">
      {L.length ? (
        L.map(m => {
          const own = ownedFam(m.id),
            sh = isShinyOwned(m.id),
            on = V4.dexSel === m.id;
          const style = { '--c': tc(m.t[0]) };
          if (sh) {
            style['--sh'] = shinyHue(m.id) + 'deg';
          }
          return (
            <button
              type="button"
              className={`v4-dl${own ? '' : ' unk'}${sh ? ' shiny' : ''}${on ? ' on' : ''}`}
              data-dex={m.id}
              role="option"
              aria-selected={on}
              style={style}
              key={m.id}
            >
              {sh ? <Html html={SPARK} /> : null}
              <img src={PIX(m.no)} alt="" loading="lazy" width="48" height="48" />
              <span className="v4-dl-no">{String(m.no).padStart(3, '0')}</span>
              <b>{m.n}</b>
              {own ? null : (
                <svg className="v4-dl-lk">
                  <use href="#i-lock" />
                </svg>
              )}
            </button>
          );
        })
      ) : (
        <p className="v4-empty">Aucun Pokémon ne correspond.</p>
      )}
    </div>
  );
}
