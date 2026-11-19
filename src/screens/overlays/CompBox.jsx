import { Html } from '../../lib/html.jsx';
import { Boite, Dialogue } from './Fenetre.jsx';
import { BY } from '../../engine/009-03-pokemon.js';
import { medal } from '../../engine/014-08-outils.js';

// Choix du compagnon (#compBox). Clics (data-comp, data-comp-p) et hidden : moteur (057).
export default function CompBox() {
  return <Boite nom="comp" className="result exp-box" id="compBox" Carte={Carte} />;
}

function Carte({ L, cur, bonus }) {
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
