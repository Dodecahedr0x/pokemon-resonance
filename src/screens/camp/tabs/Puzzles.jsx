import { POKEMON } from '../../../engine/pokemon/pokemon.js';
import { medal } from '../../../engine/core/utils.js';
import { today } from '../../../engine/state/economy.js';
import { PUZZLES, puzzleOfDay, puzzleState } from '../../../engine/modes/riddles.js';
import { Html } from '../../../lib/html.jsx';

import CardHeader from '../../../components/CardHeader.jsx';
function Stars({ n }) {
  return (
    <span className="camp-puzzle-stars" aria-label={`${n} étoile${n > 1 ? 's' : ''} sur 3`}>
      {'★'.repeat(n) + '☆'.repeat(3 - n)}
    </span>
  );
}

// Camp › Riddles (v4.31): today's 3 riddles, then all the riddles (data-riddle-button).
export default function Puzzles() {
  const E = puzzleState(),
    dayKey = puzzleOfDay(),
    et = i => <Stars n={E.s[String(i)] || 0} />,
    total = Object.values(E.s).reduce((a, b) => a + b, 0),
    doneFlag = jd => E.j === today() && (E.jd || []).includes(jd);
  return (
    <section className="card camp-puzzles">
      <CardHeader icon="quest" title="Énigmes tactiques" count={`${total} / ${PUZZLES.length * 3} ★`} />
      <p className="v4-ps-n">
        Positions figées, PV au plus juste : mettez tous les adversaires K.O. <b>en une seule manche</b>. Ils ne jouent
        pas, tout se décide pendant votre tour. ★ réussie · ★★ sans dépenser de Voix ou du premier coup · ★★★ les deux.
      </p>
      <h3 className="camp-puzzles-heading">
        Énigmes du jour <em>+3 Éclats chacune</em>
      </h3>
      <div className="camp-puzzles-daily">
        {dayKey.map(i => {
          const P = PUZZLES[i];
          return (
            <button
              key={i}
              type="button"
              className={`camp-puzzle-daily${doneFlag(i) ? ' is-solved' : ''}`}
              data-riddle-button={i}
            >
              <span className="camp-puzzle-number">{`n° ${i + 1}`}</span>
              <span className="camp-puzzle-foes">
                {P[2].map((f, j) => (
                  <Html key={j} html={medal(POKEMON[f[0]].t, 'is-tiny')} />
                ))}
              </span>
              <em>{P[1].map(a => POKEMON[a[0]].n).join(' · ')}</em>
              {et(i)}
            </button>
          );
        })}
      </div>
      <h3 className="camp-puzzles-heading">Toutes les énigmes</h3>
      <div className="camp-puzzles-grid">
        {PUZZLES.map((x, i) => (
          <button
            key={i}
            type="button"
            className={`camp-puzzle${E.s[String(i)] ? ' is-solved' : ''}`}
            data-riddle-button={i}
            aria-label={`Énigme ${i + 1}`}
          >
            <b>{i + 1}</b>
            {et(i)}
          </button>
        ))}
      </div>
    </section>
  );
}
