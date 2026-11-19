import { BY } from '../../../engine/009-pokemon.js';
import { PROFILE } from '../../../engine/011-game-state.js';
import { medal } from '../../../engine/014-utils.js';
import { fmt } from '../../../engine/032-v4-foundation.js';
import { MASTERY431, MASTERY_THRESHOLD431, masterChoice431 } from '../../../engine/066-tactical-challenges.js';
import { Html } from '../../../lib/html.jsx';

// A family: progression, then the choice between two masteries (data-mait431).
function Family({ b, x }) {
  const m = BY[b],
    [c1, c2] = masterChoice431(b),
    isReady = x.n >= MASTERY_THRESHOLD431,
    bt = k => (
      <button
        type="button"
        className={`b b-sm${x.p === k ? ' b-gold' : ''}`}
        data-mait431={b}
        data-k={k}
        disabled={x.p === k}
      >
        {MASTERY431[k][0]}
        <em>{MASTERY431[k][1]}</em>
      </button>
    );
  return (
    <article className={`mt431-r${x.p ? ' on' : ''}`}>
      <Html html={medal(m.t, 'sm')} />
      <div className="mt431-t">
        <b>{m.n}</b>
        <span className="mt431-b">
          <i style={{ width: `${Math.min(100, Math.round((x.n / MASTERY_THRESHOLD431) * 100))}%` }} />
        </span>
        <em>
          {isReady
            ? x.p
              ? `${MASTERY431[x.p][0]} : ${MASTERY431[x.p][1]}`
              : 'Bonus à choisir'
            : `${x.n} / ${MASTERY_THRESHOLD431} combats`}
        </em>
      </div>
      {isReady ? (
        <div className="mt431-c">
          {bt(c1)}
          {bt(c2)}
        </div>
      ) : null}
    </article>
  );
}

// Camp › Mastery (v4.31): a permanent bonus per family after enough battles.
export default function Mastery() {
  const M = PROFILE.mait431 || {},
    L = [...new Set(PROFILE.box.map(id => (BY[id] ? BY[id].base : null)).filter(Boolean))]
      .map(b => ({ b, x: M[b] || { n: 0, p: '' } }))
      .sort((a, c) => !!c.x.p - !!a.x.p || c.x.n - a.x.n);
  const priceAmount = 500;
  return (
    <section className="v4-panel mt431">
      <header className="v4-ph">
        <svg>
          <use href="#i-star" />
        </svg>
        <b>Maîtrise des familles</b>
        <span className="v4-cnt">{`${L.filter(y => y.x.p).length} / ${L.length}`}</span>
      </header>
      <p className="v4-ps-n">{`Après ${MASTERY_THRESHOLD431} combats dans l’équipe, une famille débloque un bonus permanent, à choisir entre deux. Vous pouvez en changer pour ${fmt(priceAmount)} ₽.`}</p>
      <div className="mt431-l">
        {L.length ? (
          L.map(({ b, x }) => <Family key={b} b={b} x={x} />)
        ) : (
          <p className="v4-empty">Votre Box est vide.</p>
        )}
      </div>
    </section>
  );
}
