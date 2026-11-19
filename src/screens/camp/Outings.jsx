import { routeName } from '../../engine/054-johto.js';

// An outing (data-outing, handled by the engine).
function Outing({ k, ic, b, d }) {
  return (
    <button type="button" className="outing-btn" data-outing={k}>
      <span className="outing-btn-ic">
        <svg>
          <use href={`#${ic}`} />
        </svg>
      </span>
      <span>
        <b>{b}</b>
        <em>{d}</em>
      </span>
      <svg className="outing-btn-go">
        <use href="#i-chevr" />
      </svg>
    </button>
  );
}

// Contents of #outingsPanel (v4.30): shortcuts to the tall grass, the Safari, the Tower, friends, the weekly challenge.
export default function Outings() {
  return (
    <>
      <header className="v4-ph">
        <svg>
          <use href="#i-compass" />
        </svg>
        <b>Sorties</b>
      </header>
      <div className="outing-btn-g">
        <Outing k="herbes" ic="i-grass" b="Hautes herbes" d={`${routeName()} · rencontres et captures`} />
        <Outing k="safari" ic="i-map" b="Pêche et Parc Safari" d="Depuis la Carte de chaque région" />
        <Outing k="tour" ic="i-league" b="Tour de Résonance" d="Ascension avec une équipe tirée" />
        <Outing k="amis" ic="i-team" b="Défis entre amis" d="Cartes de dresseur, tournoi, classement" />
        <Outing k="hebdo" ic="i-trophy" b="Défi de la semaine" d="Même équipe pour tous" />
      </div>
    </>
  );
}
