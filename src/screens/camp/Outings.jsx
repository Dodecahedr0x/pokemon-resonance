import { routeName } from '../../engine/054-johto.js';

// Une sortie (data-sortie430, gérée par le moteur).
function Outing({ k, ic, b, d }) {
  return (
    <button type="button" className="so430" data-sortie430={k}>
      <span className="so430-ic"><svg><use href={`#${ic}`} /></svg></span>
      <span><b>{b}</b><em>{d}</em></span>
      <svg className="so430-go"><use href="#i-chevr" /></svg>
    </button>
  );
}

// Contenu de #sort430 (v4.30) : raccourcis vers les herbes, le Safari, la Tour, les amis, le défi hebdo.
export default function Outings() {
  return (
    <>
      <header className="v4-ph"><svg><use href="#i-compass" /></svg><b>Sorties</b></header>
      <div className="so430-g">
        <Outing k="herbes" ic="i-grass" b="Hautes herbes" d={`${routeName()} · rencontres et captures`} />
        <Outing k="safari" ic="i-map" b="Pêche et Parc Safari" d="Depuis la Carte de chaque région" />
        <Outing k="tour" ic="i-league" b="Tour de Résonance" d="Ascension avec une équipe tirée" />
        <Outing k="amis" ic="i-team" b="Défis entre amis" d="Cartes de dresseur, tournoi, classement" />
        <Outing k="hebdo" ic="i-trophy" b="Défi de la semaine" d="Même équipe pour tous" />
      </div>
    </>
  );
}
