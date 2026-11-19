import { isCamp } from '../../../engine/011-game-state.js';

// Game mode (modeHtml430). The engine handles data-mode430 (with confirmation) and data-v4saves.
export default function GameMode() {
  const c = isCamp();
  return (
    <section className="v4-panel v4-ps mode430">
      <header className="v4-ph"><svg><use href="#i-compass" /></svg><b>Mode de jeu</b><span className="v4-cnt">{c ? 'Campagne' : 'Libre'}</span></header>
      <p className="v4-ps-n">{c ? 'Campagne : les chapitres se suivent, la fatigue compte et les défis de campagne sont disponibles.' : 'Libre : tous les combats sont ouverts ; chaque Pokémon se capture dans sa région.'}</p>
      <p className="v4-ps-n mode430-w">Changer de mode commence une nouvelle partie. Une confirmation vous propose de ranger d’abord la partie en cours dans un emplacement.</p>
      <div className="v4-ps-a">
        {c
          ? <button type="button" className="b b-sm" data-mode430="libre">Passer en mode Libre…</button>
          : <button type="button" className="b b-sm b-gold" data-mode430="camp">Commencer une campagne…</button>}
        <button type="button" className="b b-sm" data-v4saves="">Sauvegardes</button>
      </div>
    </section>
  );
}
