import { Html } from '../../lib/html.jsx';
import { pokemonArtUrl } from '../../engine/assets/images.js';
import { dexNo } from '../../engine/data/game-data.js';
import { MOVES } from '../../engine/data/moves.js';
import { REGION_NAMES } from '../../engine/data/hoenn.js';
import { POKEMON, familyOf } from '../../engine/pokemon/pokemon.js';
import { ITEMS2, PROFILE, inBox, isCamp, ownedItems } from '../../engine/state/game-state.js';
import { RC, ROLEFX } from '../../engine/pokemon/roles-synergies.js';
import { medal, typeBadge, typeColor } from '../../engine/core/utils.js';
import { squad } from '../../engine/team/team.js';
import { RANKS, stars, rankId } from '../../engine/combat/resonance.js';
import { captureSite } from '../../engine/world/catch-anywhere.js';

// Family grid (#dexGrid), v: visible families (engine's visible()). Clicks (data-stg, data-qa, data-open) and hover reflection:
// engine listeners on #dexGrid, which stays mounted.
export default function Grid({ v }) {
  return (
    <div className="team-grid" id="dexGrid">
      {v &&
        (v.length ? (
          v.map(m => <FamCard key={m.id} m={m} />)
        ) : (
          <p className="team-grid-empty">Aucune famille ne correspond à ces filtres.</p>
        ))}
    </div>
  );
}

// PC cost: four chips.
function Pips({ c }) {
  return [1, 2, 3, 4].map(i => <i key={i} className={i <= c ? 'is-on' : ''} />);
}

// Missing illustration: hide the broken image, the card keeps its frame.
function onArtError(e) {
  e.currentTarget.style.display = 'none';
}

// Family card (formerly famCard).
function FamCard({ m }) {
  const family = familyOf(m.id),
    later = family.filter(x => x.st > 1),
    inS = squad.find(id => POKEMON[id].base === m.id),
    on = !!inS,
    lock = !inBox(m.id),
    fat = isCamp() && !lock ? PROFILE.fatigue[m.id] || 0 : 0,
    it =
      PROFILE.equipment[m.id] && ownedItems().includes(PROFILE.equipment[m.id])
        ? ITEMS2[PROFILE.equipment[m.id]]
        : null,
    maxSt = Math.max(...family.map(x => x.st)),
    rg = rankId(m.id),
    placeLabel = lock && !PROFILE.dex.includes(m.id) ? captureSite(m.id) : '',
    // captured shiny (v4.73 styling)
    shiny = ((PROFILE && PROFILE.shiny) || []).includes(m.id);
  const cls = 'team-card' + (on ? ' is-in-team' : '') + (lock ? ' is-locked' : '') + (shiny ? ' is-shiny' : '');
  return (
    <article className={cls} data-rank={rg} style={{ '--c': typeColor(m.t[0]), '--c2': typeColor(m.t[1] || m.t[0]) }}>
      <div className="team-card-body">
        <div className="team-card-top">
          <span className="team-card-number">{dexNo(m.no)}</span>
          <span className="team-card-region">{REGION_NAMES[m.gen] || 'Johto'}</span>
          <span className={`team-card-rank rank-${rg}`} title={`Rang ${RANKS[rg].n} · ${RANKS[rg].k}`}>
            {stars(rg)}
          </span>
          <span className="team-card-cost" title={`${m.c} PC`}>
            <Pips c={m.c} />
          </span>
        </div>
        <div className="team-card-art">
          <span className="team-card-rays" aria-hidden="true" />
          <img
            className="team-card-sprite"
            src={pokemonArtUrl(m.no)}
            alt={m.n}
            loading="lazy"
            decoding="async"
            onError={onArtError}
          />
          <span className="team-card-stages">{maxSt > 1 ? `${maxSt} stades` : 'Stade unique'}</span>
          {lock && (
            <span className="team-card-lock">
              {PROFILE.dex.includes(m.id) ? 'Vu' : 'À capturer'}
              {placeLabel ? <i>{placeLabel}</i> : null}
            </span>
          )}
          {it && (
            <span className="team-card-item" title={`${it.n} : ${it.d}`}>
              <svg viewBox="0 0 24 24">
                <path d={it.i} />
              </svg>
            </span>
          )}
        </div>
        {fat ? (
          <span className={`team-card-fatigue${fat >= 70 ? ' is-high' : ''}`} title={`Fatigue ${fat} %`}>
            <i style={{ width: `${fat}%` }} />
          </span>
        ) : null}
        <div className="team-card-name">
          <h3>{m.n}</h3>
          <span className="team-card-role" title={ROLEFX[m.r] ? ROLEFX[m.r].d : ''}>
            {m.r}
          </span>
        </div>
        {inS && inS !== m.id && (
          <span className="team-card-squad">
            En équipe : {POKEMON[inS].n} · {RC(inS)} PC
          </span>
        )}
        <div className="team-card-types">
          {m.t.map(t => (
            <Html key={t} html={typeBadge(t)} />
          ))}
        </div>
        <p className="team-card-moves">{m.mv.map(id => MOVES[id].n).join(' · ')}</p>
        {later.length ? null : (
          <div className="team-card-single-stage">
            <em>Stade unique · puissant d’emblée</em>
          </div>
        )}
        {family.length > 1 && (
          <div className={`team-card-stage-room${family.length > 3 ? ' is-double' : ''}`} aria-hidden="true" />
        )}
        <span className="team-card-foil" aria-hidden="true" />
        <span className="team-card-glare" aria-hidden="true" />
        {shiny && (
          <span className="team-card-shiny" aria-hidden="true">
            ✦ Chromatique
          </span>
        )}
      </div>
      <button className="team-card-open" type="button" data-open={m.id} aria-label={`Ouvrir la carte de ${m.n}`} />
      {family.length > 1 && (
        <div className="team-card-stage-picker" role="group" aria-label={`Recruter un stade de ${m.n}`}>
          {family.map(x => {
            const sel = squad.includes(x.id);
            return (
              <button
                key={x.id}
                type="button"
                className={`team-stage${sel ? ' is-selected' : ''}${x.st > 1 ? ' is-evolved' : ''}`}
                data-stg={x.id}
                aria-pressed={sel}
                disabled={!inBox(x.id)}
                title={`${x.n} · ${RC(x.id)} PC${x.st > 1 ? ' · recrue confirmée' : ''}`}
              >
                <Html html={medal(x.t, 'is-tiny')} />
                <b>{x.n}</b>
                <em>{RC(x.id)} PC</em>
              </button>
            );
          })}
        </div>
      )}
      <button
        className="team-card-recruit"
        type="button"
        data-qa={m.id}
        aria-pressed={on}
        aria-label={`${on ? 'Retirer' : 'Recruter'} ${m.n}`}
      >
        <svg>
          <use href="#i-plus" />
        </svg>
      </button>
    </article>
  );
}
