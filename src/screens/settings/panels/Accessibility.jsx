import { PREF } from '../../../engine/026-campaign-tutorial-sound.js';
import { Switch } from '../controls.jsx';

const SIZES = [
  ['normal', 'Normale'],
  ['grand', 'Grande'],
  ['tgrand', 'Très grande'],
];

// Accessibility. The engine handles data-text-size and applies the a11y-* classes.
export default function Accessibility() {
  const t = PREF.textSize || 'normal';
  return (
    <section className="v4-panel v4-ps a11y432">
      <header className="v4-ph">
        <svg>
          <use href="#i-user" />
        </svg>
        <b>Accessibilité</b>
      </header>
      <div className="v4-fld">
        <span>Taille du texte</span>
        <div className="v4-seg" role="group" aria-label="Taille du texte">
          {SIZES.map(([k, n]) => (
            <button key={k} type="button" data-text-size={k} aria-pressed={t === k}>
              {n}
            </button>
          ))}
        </div>
      </div>
      <Switch
        k="high-contrast"
        on={PREF.highContrast}
        lab="Contraste renforcé"
        sub="Textes plus clairs, bordures plus nettes"
      />
      <Switch
        k="colorBlind"
        on={PREF.colorBlind}
        lab="Couleurs pour daltonisme"
        sub="Vert et rouge remplacés par bleu et orange (PV, dangers, résultats)"
      />
      <Switch k="left-hand" on={PREF.leftHand} lab="Mode gaucher" sub="Le bouton de fin de tour passe à gauche" />
      <Switch
        k="reduce-motion"
        on={PREF.reduceMotion}
        lab="Réduire les animations"
        sub="Supprime les mouvements décoratifs"
      />
    </section>
  );
}
