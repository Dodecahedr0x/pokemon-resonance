import { Html } from '../../lib/html.jsx';
import { useOverlay } from './dialogsStore.js';
import { BY } from '../../engine/009-03-pokemon.js';
import { medal } from '../../engine/014-08-outils.js';

// Choix du compagnon (#compBox). Clics (data-comp, data-comp-p) et hidden : moteur (057).
export default function CompBox() {
  const s = useOverlay('comp');
  return (
    <div className="result exp-box" id="compBox" hidden>
      {s && <Carte key={s.v} {...s} />}
    </div>
  );
}

function Carte({ L, cur, bonus }) {
  return (
    <div className="sv-card exp-card" role="dialog" aria-modal="true" aria-labelledby="compT">
      <button className="sh-x" type="button" data-comp="x" aria-label="Fermer"><svg><use href="#i-x" /></svg></button>
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
    </div>
  );
}
