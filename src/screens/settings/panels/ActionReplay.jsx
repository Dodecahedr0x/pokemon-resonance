import { isCreator } from '../../../engine/progression/camp.js';

const CHEATS = [
  ['argent', '+10 000 ₽'],
  ['eclats', '+100 Éclats'],
  ['sac', 'Sac rempli'],
  ['box', 'Tous les Pokémon'],
  ['badges', 'Tous les badges et Maîtres'],
  ['legendes', 'Quêtes légendaires prêtes'],
  ['fatigue', 'Fatigue à zéro'],
  ['gagner', 'Gagner le combat en cours'],
];

// Action Replay: code entry, then test shortcuts.
// The engine handles data-cheat-code, Enter in #cheatCode and data-cheat.
export default function ActionReplay() {
  if (!isCreator()) {
    return (
      <section className="v4-panel v4-ps cheat-code">
        <header className="v4-ph">
          <svg>
            <use href="#i-lock" />
          </svg>
          <b>Action Replay</b>
        </header>
        <div className="cheat-code-f">
          <input
            type="password"
            id="cheat-code"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            placeholder="Code Action Replay"
            aria-label="Code Action Replay"
          />
          <button type="button" className="b b-sm" data-cheat-code="ok">
            Valider
          </button>
        </div>
      </section>
    );
  }
  return (
    <section className="v4-panel v4-ps cheat-code on">
      <header className="v4-ph">
        <svg>
          <use href="#i-star" />
        </svg>
        <b>Action Replay</b>
        <span className="v4-cnt">actif sur cet appareil</span>
      </header>
      <p className="v4-ps-n">
        Raccourcis de test. Ils modifient la partie en cours : rangez-la d’abord dans un emplacement si besoin.
      </p>
      <div className="cheat-code-g">
        {CHEATS.map(([k, t]) => (
          <button key={k} type="button" className="b b-sm" data-cheat={k}>
            {t}
          </button>
        ))}
      </div>
      <button type="button" className="b b-sm b-ghost" data-cheat="off">
        Désactiver Action Replay sur cet appareil
      </button>
    </section>
  );
}
