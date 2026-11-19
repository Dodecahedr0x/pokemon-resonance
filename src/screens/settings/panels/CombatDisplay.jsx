import { PREF } from '../../../engine/026-campaign-tutorial-sound.js';

// Paramètres › Affichage du combat (v4.44) : boutons data-b444 gérés par le moteur (module 077).
export default function BattleDisplay() {
  const fs = document.body.classList.contains('fs444');
  return (
    <section className="v4-panel" id="af444">
      <h3 className="h3">Affichage du combat</h3>
      <p className="v4-note">Plein écran : le navigateur masque ses barres quand il l’autorise, et en combat sur téléphone la barre de navigation du bas s’efface. Plateau contrasté : contours de cases nets et terrains plus colorés. Sur le plateau, un appui long sur une case (ou la loupe) affiche son détail.</p>
      <div className="sv-io">
        <button type="button" className={`b b-sm${fs ? ' b-gold' : ''}`} data-b444="pfs">{fs ? 'Plein écran : activé' : 'Plein écran : désactivé'}</button>
        <button type="button" className={`b b-sm${PREF.ct444 ? ' b-gold' : ''}`} data-b444="pct">{PREF.ct444 ? 'Plateau contrasté : activé' : 'Plateau contrasté : désactivé'}</button>
      </div>
    </section>
  );
}
