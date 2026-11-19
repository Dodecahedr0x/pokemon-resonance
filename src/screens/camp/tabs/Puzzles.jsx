import { BY } from '../../../engine/pokemon/pokemon.js';
import { medal } from '../../../engine/core/utils.js';
import { today } from '../../../engine/state/economy.js';
import { PUZZLES, puzzleOfDay, puzzleState } from '../../../engine/modes/tactical-challenges.js';
import { Html } from '../../../lib/html.jsx';

function Stars({ n }) {
  return (
    <span className="puzzle-tab-st" aria-label={`${n} étoile${n > 1 ? 's' : ''} sur 3`}>
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
    <section className="v4-panel puzzle-tab">
      <header className="v4-ph">
        <svg>
          <use href="#i-quest" />
        </svg>
        <b>Énigmes tactiques</b>
        <span className="v4-cnt">{`${total} / ${PUZZLES.length * 3} ★`}</span>
      </header>
      <p className="v4-ps-n">
        Positions figées, PV au plus juste : mettez tous les adversaires K.O. <b>en une seule manche</b>. Ils ne jouent
        pas, tout se décide pendant votre tour. ★ réussie · ★★ sans dépenser de Voix ou du premier coup · ★★★ les deux.
      </p>
      <h3 className="puzzle-tab-h">
        Énigmes du jour <em>+3 Éclats chacune</em>
      </h3>
      <div className="puzzle-tab-j">
        {dayKey.map(i => {
          const P = PUZZLES[i];
          return (
            <button key={i} type="button" className={`puzzle-tab-c${doneFlag(i) ? ' ok' : ''}`} data-riddle-button={i}>
              <span className="puzzle-tab-n">{`n° ${i + 1}`}</span>
              <span className="puzzle-tab-m">
                {P[2].map((f, j) => (
                  <Html key={j} html={medal(BY[f[0]].t, 'xs')} />
                ))}
              </span>
              <em>{P[1].map(a => BY[a[0]].n).join(' · ')}</em>
              {et(i)}
            </button>
          );
        })}
      </div>
      <h3 className="puzzle-tab-h">Toutes les énigmes</h3>
      <div className="puzzle-tab-g">
        {PUZZLES.map((x, i) => (
          <button
            key={i}
            type="button"
            className={`puzzle-tab-b${E.s[String(i)] ? ' ok' : ''}`}
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
