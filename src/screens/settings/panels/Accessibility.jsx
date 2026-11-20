import { PREF } from '../../../engine/ui/preferences.js';
import { Switch } from '../controls.jsx';

import CardHeader from '../../../components/CardHeader.jsx';
const SIZES = [
  ['normal', 'Normale'],
  ['grand', 'Grande'],
  ['tgrand', 'Très grande'],
];

// Accessibility. The engine handles data-text-size and applies the a11y-* classes.
export default function Accessibility() {
  const t = PREF.textSize || 'normal';
  return (
    <section className="card v4-ps accessibility-panel">
      <CardHeader icon="user" title="Accessibilité" />
      <div className="form-field">
        <span>Taille du texte</span>
        <div className="tabs segmented-control" role="group" aria-label="Taille du texte">
          {SIZES.map(([k, n]) => (
            <button key={k} type="button" data-text-size={k} aria-pressed={t === k}>
              {n}
            </button>
          ))}
        </div>
      </div>
      <Switch
        k="highContrast"
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
      <Switch k="leftHand" on={PREF.leftHand} lab="Mode gaucher" sub="Le bouton de fin de tour passe à gauche" />
      <Switch
        k="reduceMotion"
        on={PREF.reduceMotion}
        lab="Réduire les animations"
        sub="Supprime les mouvements décoratifs"
      />
    </section>
  );
}
