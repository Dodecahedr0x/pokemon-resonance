import { PREFERENCES } from '../../../engine/ui/preferences.js';

import Button from '../../../components/Button.jsx';
// Settings › Battle display (v4.44): data-tool-action buttons handled by the engine (engine/combat/board-tools.js).
export default function BattleDisplay() {
  const fs = document.body.classList.contains('fullscreen-mode');
  return (
    <section className="card" id="battle-display-panel">
      <h3 className="card-title">Affichage du combat</h3>
      <p className="note">
        Plein écran : le navigateur masque ses barres quand il l’autorise, et en combat sur téléphone la barre de
        navigation du bas s’efface. Plateau contrasté : contours de cases nets et terrains plus colorés. Sur le plateau,
        un appui long sur une case (ou la loupe) affiche son détail.
      </p>
      <div className="button-row">
        <Button size="small" variant={fs ? 'primary' : undefined} data-tool-action="pfs">
          {fs ? 'Plein écran : activé' : 'Plein écran : désactivé'}
        </Button>
        <Button size="small" variant={PREFERENCES.boardContrast ? 'primary' : undefined} data-tool-action="pct">
          {PREFERENCES.boardContrast ? 'Plateau contrasté : activé' : 'Plateau contrasté : désactivé'}
        </Button>
      </div>
    </section>
  );
}
