import { BY } from '../../../engine/pokemon/pokemon.js';
import { PROFILE } from '../../../engine/state/game-state.js';
import { medal } from '../../../engine/core/utils.js';
import { fmt } from '../../../engine/state/economy.js';
import { MASTERY_DEFS, MASTERY_THRESHOLD, masteryChoice } from '../../../engine/modes/tactical-challenges.js';
import { Html } from '../../../lib/html.jsx';

// A family: progression, then the choice between two masteries (data-mastery-track).
function Family({ b, x }) {
  const m = BY[b],
    [c1, c2] = masteryChoice(b),
    isReady = x.n >= MASTERY_THRESHOLD,
    bt = k => (
      <button
        type="button"
        className={`b b-sm${x.p === k ? ' b-gold' : ''}`}
        data-mastery-track={b}
        data-k={k}
        disabled={x.p === k}
      >
        {MASTERY_DEFS[k][0]}
        <em>{MASTERY_DEFS[k][1]}</em>
      </button>
    );
  return (
    <article className={`mastery-tab-r${x.p ? ' on' : ''}`}>
      <Html html={medal(m.t, 'sm')} />
      <div className="mastery-tab-t">
        <b>{m.n}</b>
        <span className="mastery-tab-b">
          <i style={{ width: `${Math.min(100, Math.round((x.n / MASTERY_THRESHOLD) * 100))}%` }} />
        </span>
        <em>
          {isReady
            ? x.p
              ? `${MASTERY_DEFS[x.p][0]} : ${MASTERY_DEFS[x.p][1]}`
              : 'Bonus à choisir'
            : `${x.n} / ${MASTERY_THRESHOLD} combats`}
        </em>
      </div>
      {isReady ? (
        <div className="mastery-tab-c">
          {bt(c1)}
          {bt(c2)}
        </div>
      ) : null}
    </article>
  );
}

// Camp › Mastery (v4.31): a permanent bonus per family after enough battles.
export default function Mastery() {
  const M = PROFILE.masteryTrack || {},
    L = [...new Set(PROFILE.box.map(id => (BY[id] ? BY[id].base : null)).filter(Boolean))]
      .map(b => ({ b, x: M[b] || { n: 0, p: '' } }))
      .sort((a, c) => !!c.x.p - !!a.x.p || c.x.n - a.x.n);
  const priceAmount = 500;
  return (
    <section className="v4-panel mastery-tab">
      <header className="v4-ph">
        <svg>
          <use href="#i-star" />
        </svg>
        <b>Maîtrise des familles</b>
        <span className="v4-cnt">{`${L.filter(y => y.x.p).length} / ${L.length}`}</span>
      </header>
      <p className="v4-ps-n">{`Après ${MASTERY_THRESHOLD} combats dans l’équipe, une famille débloque un bonus permanent, à choisir entre deux. Vous pouvez en changer pour ${fmt(priceAmount)} ₽.`}</p>
      <div className="mastery-tab-l">
        {L.length ? (
          L.map(({ b, x }) => <Family key={b} b={b} x={x} />)
        ) : (
          <p className="v4-empty">Votre Box est vide.</p>
        )}
      </div>
    </section>
  );
}
