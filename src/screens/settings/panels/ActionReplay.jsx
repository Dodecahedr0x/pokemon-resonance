import { isCreator } from '../../../engine/tools/action-replay.js';

import Button from '../../../components/Button.jsx';
import CardHeader from '../../../components/CardHeader.jsx';
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
      <section className="card v4-ps cheat-code">
        <CardHeader icon="lock" title="Action Replay" />
        <div className="cheat-code-form">
          <input
            type="password"
            id="cheat-code"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            placeholder="Code Action Replay"
            aria-label="Code Action Replay"
          />
          <Button size="small" data-cheat-code="ok">
            Valider
          </Button>
        </div>
      </section>
    );
  }
  return (
    <section className="card v4-ps cheat-code is-active">
      <CardHeader icon="star" title="Action Replay" count="actif sur cet appareil" />
      <p className="v4-ps-n">
        Raccourcis de test. Ils modifient la partie en cours : rangez-la d’abord dans un emplacement si besoin.
      </p>
      <div className="cheat-code-grid">
        {CHEATS.map(([k, t]) => (
          <Button key={k} size="small" data-cheat={k}>
            {t}
          </Button>
        ))}
      </div>
      <Button size="small" variant="ghost" data-cheat="off">
        Désactiver Action Replay sur cet appareil
      </Button>
    </section>
  );
}
