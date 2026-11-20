import { PREF } from '../../../engine/ui/preferences.js';
import { Switch } from '../controls.jsx';

import Button from '../../../components/Button.jsx';
// Phone: vibrations, gestures, aids. The engine handles data-hm, data-guide and data-v4reset.
export default function Phone() {
  return (
    <section className="v4-panel v4-ps">
      <header className="v4-ph">
        <svg>
          <use href="#i-phone" />
        </svg>
        <b>Téléphone</b>
      </header>
      <Switch k="vibe" on={PREF.vibe} lab="Vibrations" sub="Coups encaissés, K.O. et récompenses" />
      <Switch
        k="swipeNav"
        on={PREF.swipeNav !== false}
        lab="Glisser entre les onglets"
        sub="Accueil, Équipe, Combat, Carte. Appui long sur un Pokémon : sa fiche."
      />
      <div className="settings-actions">
        <Button size="small" data-hm="intro">
          Revoir l’accueil de la Professeure
        </Button>
        <Button size="small" data-guide="debuter">
          Comment jouer
        </Button>
        <Button size="small" data-guide="tuto433">
          Tutoriel complet
        </Button>
      </div>
      <Button size="small" variant="ghost" className="settings-reset" data-v4reset="">
        Réinitialiser les paramètres
      </Button>
    </section>
  );
}
