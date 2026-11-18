import { PREF } from '../../../engine/026-20-campagne-tutoriel-son.js';
import { Switch } from '../controls.jsx';

const TAILLES = [
  ['normal', 'Normale'],
  ['grand', 'Grande'],
  ['tgrand', 'Très grande']
];

// Accessibilité (a11yHtml432). Le moteur gère data-txt432 et applique les classes a11y-*.
export default function Accessibilite() {
  const t = PREF.txt432 || 'normal';
  return (
    <section className="v4-panel v4-ps a11y432">
      <header className="v4-ph"><svg><use href="#i-user" /></svg><b>Accessibilité</b></header>
      <div className="v4-fld"><span>Taille du texte</span><div className="v4-seg" role="group" aria-label="Taille du texte">
        {TAILLES.map(([k, n]) => <button key={k} type="button" data-txt432={k} aria-pressed={t === k}>{n}</button>)}
      </div></div>
      <Switch k="hc432" on={PREF.hc432} lab="Contraste renforcé" sub="Textes plus clairs, bordures plus nettes" />
      <Switch k="cb432" on={PREF.cb432} lab="Couleurs pour daltonisme" sub="Vert et rouge remplacés par bleu et orange (PV, dangers, résultats)" />
      <Switch k="lh432" on={PREF.lh432} lab="Mode gaucher" sub="Le bouton de fin de tour passe à gauche" />
      <Switch k="rm432" on={PREF.rm432} lab="Réduire les animations" sub="Supprime les mouvements décoratifs" />
    </section>
  );
}
