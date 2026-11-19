import { Html } from '../../lib/html.jsx';
import { Box, Dialogue } from './Window.jsx';
import { BY } from '../../engine/009-pokemon.js';
import { medal } from '../../engine/014-utils.js';

// Companion choice (#compBox). Clicks (data-comp, data-comp-p) and hidden: engine (057).
export default function CompanionBox() {
  return <Box nom="comp" className="result exp-box" id="compBox" Carte={Card} />;
}

function Card({ L, cur, bonus }) {
  return (
    <Dialogue className="sv-card exp-card" titre="compT" fermer={{ 'data-comp': 'x' }}>
      <p className="kick">Compagnon</p>
      <h2 className="h2" id="compT">Qui vous accompagne ?</h2>
      <p className="d">Son affection grandit quand il combat avec vous (+2, +1 de plus en cas de victoire) et quand vous le câlinez (une fois par jour). En changer remet l’affection à zéro.</p>
      <div className="exp-list">
        {L.map(id => {
          const m = BY[id];
          return (
            <button key={id} type="button" className={'exp-d' + (cur === id ? ' on' : '')} data-comp-p={id}>
              <Html html={medal(m.t, 'sm')} />
              <b>{m.n}</b>
              <em>{m.t.join(' · ')}</em>
            </button>
          );
        })}
      </div>
      <div className="cp-bl">
        <b>Bonus d’affection</b>
        {bonus.map(([n, t, d]) => (
          <span key={n}>{'♥'.repeat(n)} <b>{t}</b> : {d}</span>
        ))}
      </div>
    </Dialogue>
  );
}
