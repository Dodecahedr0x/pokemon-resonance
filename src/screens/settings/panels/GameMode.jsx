import { isCamp } from '../../../engine/state/game-state.js';

import Button from '../../../components/Button.jsx';
// Game mode. The engine handles data-game-mode (with confirmation) and data-v4saves.
export default function GameMode() {
  const c = isCamp();
  return (
    <section className="v4-panel v4-ps game-mode">
      <header className="v4-ph">
        <svg>
          <use href="#i-compass" />
        </svg>
        <b>Mode de jeu</b>
        <span className="v4-cnt">{c ? 'Campagne' : 'Libre'}</span>
      </header>
      <p className="v4-ps-n">
        {c
          ? 'Campagne : les chapitres se suivent, la fatigue compte et les défis de campagne sont disponibles.'
          : 'Libre : tous les combats sont ouverts ; chaque Pokémon se capture dans sa région.'}
      </p>
      <p className="v4-ps-n game-mode-warning">
        Changer de mode commence une nouvelle partie. Une confirmation vous propose de ranger d’abord la partie en cours
        dans un emplacement.
      </p>
      <div className="settings-actions">
        {c ? (
          <Button size="small" data-game-mode="libre">
            Passer en mode Libre…
          </Button>
        ) : (
          <Button size="small" variant="primary" data-game-mode="camp">
            Commencer une campagne…
          </Button>
        )}
        <Button size="small" data-v4saves="">
          Sauvegardes
        </Button>
      </div>
    </section>
  );
}
