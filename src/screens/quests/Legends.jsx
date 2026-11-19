import { BY } from '../../engine/pokemon/pokemon.js';
import { PROFILE } from '../../engine/state/game-state.js';
import { tc } from '../../engine/core/utils.js';
import { ART } from '../../engine/assets/item-icons.js';
import { LEGS } from '../../engine/modes/legendaries.js';
import { hoennOpen } from '../../engine/world/hoenn.js';
import { legendSteps } from '../../engine/modes/legendary-captures.js';
import { HOENN_LEGEND_DEFS, hoennLegendSteps, isInBox } from '../../engine/world/hoenn-legendaries.js';

// Card of a legend: steps of its quest, then capture (data-v4fight lc… / hc…).
function Legend({ L, et, isTaken: takenSet, fight, condition: cond }) {
  const m = BY[L.id],
    isReady = !takenSet && et.every(x => x.ok);
  return (
    <article
      className={'legend-quest-c v4-panel' + (takenSet ? ' pris' : isReady ? ' pret' : '')}
      style={{ '--c': tc(m.t[0]) }}
    >
      <img src={ART(m.no)} alt="" loading="lazy" />
      <div className="legend-quest-t">
        <small>{L.title}</small>
        <b>{m.n}</b>
        <ul>
          {et.map((x, i) => (
            <li key={i} className={x.ok ? 'ok' : ''}>
              {x.ok ? '✓' : '○'} {x.t}
            </li>
          ))}
          {cond !== undefined ? <li className="capture-condition">Condition de capture : {cond}</li> : null}
        </ul>
        {takenSet ? (
          <span className="legend-quest-ok">Dans votre Box ✓</span>
        ) : (
          <button
            type="button"
            className={`b b-sm ${isReady ? 'b-gold' : 'b-ghost'}`}
            data-v4fight={fight}
            disabled={!isReady}
          >
            {isReady ? 'Tenter la capture' : 'Quête en cours'}
          </button>
        )}
      </div>
    </article>
  );
}

// "Legends" tab (v4.29); Hoenn's legends follow, only when Hoenn is open (v4.38).
export default function Legends() {
  return (
    <>
      <p className="v4-note">
        Une légende vaincue peut être capturée une fois sa quête terminée. Elle rejoint votre Box et coûte 8 PC dans
        l’équipe.
      </p>
      <div className="legend-quest">
        {LEGS.map(L => (
          <Legend key={L.id} L={L} et={legendSteps(L)} isTaken={PROFILE.box.includes(L.id)} fight={'lc' + L.id} />
        ))}
      </div>
      {hoennOpen() ? (
        <>
          <p className="v4-note">
            Légendes de Hoenn : vainquez-les d’abord (Combats › Après-jeu), puis remplissez leur quête. Chacune a une
            condition de capture propre.
          </p>
          <div className="legend-quest">
            {HOENN_LEGEND_DEFS.map(L => (
              <Legend
                key={L.id}
                L={L}
                et={hoennLegendSteps(L)}
                isTaken={isInBox(L.id)}
                fight={'hc' + L.id}
                condition={L.cap.t}
              />
            ))}
          </div>
        </>
      ) : null}
    </>
  );
}
