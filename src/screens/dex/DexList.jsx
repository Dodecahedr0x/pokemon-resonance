import { Html } from '../../lib/html.jsx';
import { PROFILE } from '../../engine/011-game-state.js';
import { tc } from '../../engine/014-utils.js';
import { PIX, V4, ownedFam } from '../../engine/032-v4-foundation.js';
import { DEXS, dexList } from '../../engine/038-pokedex.js';
import { SPARK, isShinyOwned, shinyHue } from '../../engine/043-adventure-plus.js';
import { REGION_NAMES421 } from '../../engine/061-catch-anywhere.js';
import { familyCapt428 } from '../../engine/063-combat-catches-home.js';

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
      <span className="cnt428">
        {[1, 2, 3].map(r => {
          const c = familyCapt428(r),
            ok = (PROFILE.dipl428 || []).includes(r);
          return (
            <span className={ok ? 'ok' : ''} key={r}>
              {`${REGION_NAMES421[r]} `}
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
          if (sh) style['--sh'] = shinyHue(m.id) + 'deg';
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
