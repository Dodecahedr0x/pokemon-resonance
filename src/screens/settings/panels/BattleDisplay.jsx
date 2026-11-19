import { PREF } from '../../../engine/ui/preferences.js';

// Settings › Battle display (v4.44): data-tool-action buttons handled by the engine (engine/combat/board-tools.js).
export default function BattleDisplay() {
  const fs = document.body.classList.contains('fullscreen-mode');
  return (
    <section className="v4-panel" id="battle-display-panel">
      <h3 className="h3">Affichage du combat</h3>
      <p className="v4-note">
        Plein écran : le navigateur masque ses barres quand il l’autorise, et en combat sur téléphone la barre de
        navigation du bas s’efface. Plateau contrasté : contours de cases nets et terrains plus colorés. Sur le plateau,
        un appui long sur une case (ou la loupe) affiche son détail.
      </p>
      <div className="sv-io">
        <button type="button" className={`b b-sm${fs ? ' b-gold' : ''}`} data-tool-action="pfs">
          {fs ? 'Plein écran : activé' : 'Plein écran : désactivé'}
        </button>
        <button type="button" className={`b b-sm${PREF.boardContrast ? ' b-gold' : ''}`} data-tool-action="pct">
          {PREF.boardContrast ? 'Plateau contrasté : activé' : 'Plateau contrasté : désactivé'}
        </button>
      </div>
    </section>
  );
}
