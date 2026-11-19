import { BY } from '../../../engine/pokemon/pokemon.js';
import { PROFILE } from '../../../engine/state/game-state.js';
import { medal } from '../../../engine/core/utils.js';
import { squad } from '../../../engine/team/team.js';
import { ECHO_EVENTS, ECHO_NODES, RELIC_DEFS, randomRelic } from '../../../engine/modes/deep-echo.js';
import { Html } from '../../../lib/html.jsx';

function Head({ X }) {
  return (
    <header className="v4-ph">
      <svg>
        <use href="#i-compass" />
      </svg>
      <b>Écho profond</b>
      <span className="v4-cnt">{`record ${X.best || 0} / 8${X.wins ? ` · ${X.wins} victoire${X.wins > 1 ? 's' : ''}` : ''}`}</span>
    </header>
  );
}

// The current event: choice of a relic, merchant or event (data-echo431).
function Event({ R }) {
  if (R.ev === 'relique') {
    return (
      <div className="echo-tab-ev">
        <h3>Choisissez une relique</h3>
        {randomRelic(R, 3).map(k => (
          <button key={k} type="button" className="b" data-echo431={`rel-${k}`}>
            <b>{RELIC_DEFS[k][0]}</b>
            <em>{RELIC_DEFS[k][1]}</em>
          </button>
        ))}
      </div>
    );
  }
  if (R.ev === 'marchand') {
    return (
      <div className="echo-tab-ev">
        <h3>
          Le Marchand <em>{`${R.echoes} Échos`}</em>
        </h3>
        <button type="button" className="b" data-echo431="achat-potion">
          <b>Potion d’équipe · 20</b>
          <em>+30 % de PV pour tous.</em>
        </button>
        <button type="button" className="b" data-echo431="achat-relique">
          <b>Relique · 45</b>
          <em>Une relique au hasard.</em>
        </button>
        <button type="button" className="b" data-echo431="achat-rappel">
          <b>Rappel · 60</b>
          <em>Un Pokémon K.O. revient à 30 % de PV.</em>
        </button>
        <button type="button" className="b b-gold" data-echo431="passer">
          Reprendre la route
        </button>
      </div>
    );
  }
  if (ECHO_EVENTS[R.ev]) {
    const [t, d, C] = ECHO_EVENTS[R.ev];
    return (
      <div className="echo-tab-ev">
        <h3>{t}</h3>
        <p>{d}</p>
        {C.map(([l, k]) => (
          <button key={k} type="button" className="b" data-echo431={k}>
            {l}
          </button>
        ))}
      </div>
    );
  }
  return null;
}

// The expedition map, from the guardian (top) to the first floor.
function Card({ R }) {
  return (
    <div className="echo-tab-c">
      {R.map
        .map((L, f) => {
          const doneFlag = f < R.f,
            hereNow = f === R.f && !R.ev;
          return (
            <div key={f} className={`echo-tab-f${doneFlag ? ' fait' : ''}${hereNow ? ' ici' : ''}`}>
              <span className="echo-tab-fn">{f + 1}</span>
              {L.map((t, i) => {
                const takenSet = doneFlag && R.path[f] === i;
                return (
                  <button
                    key={i}
                    type="button"
                    className={`echo-tab-n t-${t}${takenSet ? ' pris' : ''}`}
                    data-echo431={hereNow ? `n${i}` : undefined}
                    disabled={!hereNow}
                    aria-label={`${ECHO_NODES[t][0]}, étage ${f + 1}`}
                  >
                    <svg>
                      <use href={`#${ECHO_NODES[t][1]}`} />
                    </svg>
                    <span>{ECHO_NODES[t][0]}</span>
                  </button>
                );
              })}
            </div>
          );
        })
        .reverse()}
    </div>
  );
}

// Camp › Deep Echo (v4.31): 8 floors, a single life, relics.
export default function Echo() {
  const X = PROFILE.echo431 || { best: 0, wins: 0 },
    R = X.run;
  if (!R) {
    return (
      <section className="v4-panel echo-tab">
        <Head X={X} />
        <p className="v4-ps-n">
          Une expédition de 8 étages. À chaque étage, choisissez votre chemin : combat, élite (une relique à la clé),
          source, marchand ou événement.{' '}
          <b>Les PV sont conservés d’un combat à l’autre et un Pokémon K.O. quitte l’expédition.</b> Au bout : le
          gardien.
        </p>
        <div className="echo-tab-t">
          {squad
            .slice(0, 4)
            .filter(id => BY[id])
            .map(id => (
              <span key={id} className="echo-tab-m">
                <Html html={medal(BY[id].t, 'sm')} />
                <b>{BY[id].n}</b>
              </span>
            ))}
        </div>
        <p className="v4-ps-n">
          Récompense : 300 ₽ et 2 Éclats par étage franchi, 2 500 ₽ et 20 Éclats de plus si le gardien tombe.
        </p>
        <button type="button" className="b b-gold" data-echo431="partir">
          Partir avec cette équipe
        </button>
      </section>
    );
  }
  return (
    <section className="v4-panel echo-tab">
      <Head X={X} />
      <div className="echo-tab-k">
        <span>
          Étage <b>{`${Math.min(8, R.f + 1)} / 8`}</b>
        </span>
        <span>
          <b>{R.echoes}</b> Échos
        </span>
        {R.pv ? <span>{`PV max +${Math.round(R.pv * 100)} %`}</span> : null}
      </div>
      <div className="echo-tab-t">
        {R.team.map(([id, h], i) => (
          <span key={i} className={`echo-tab-m${h <= 0 ? ' ko' : ''}`}>
            <Html html={medal(BY[id].t, 'sm')} />
            <b>{BY[id].n}</b>
            <span className="echo-tab-hp">
              <i style={{ width: `${Math.round(h * 100)}%` }} />
            </span>
            <em>{h <= 0 ? 'K.O.' : Math.round(h * 100) + ' %'}</em>
          </span>
        ))}
      </div>
      <div className="echo-tab-rl">
        {R.relics.length ? (
          R.relics.map(k => (
            <span key={k} className="echo-tab-r" title={RELIC_DEFS[k][1]}>
              {RELIC_DEFS[k][0]}
            </span>
          ))
        ) : (
          <em>Aucune relique.</em>
        )}
      </div>
      <Event R={R} />
      <Card R={R} />
      <button type="button" className="b b-sm b-ghost" data-echo431="abandon">
        Abandonner l’expédition
      </button>
    </section>
  );
}
