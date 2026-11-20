import { NUZLOCKE_ON, nuzlockeConfirm, nuzlockeState } from '../../../engine/modes/nuzlocke.js';
import { space } from '../../../lib/theme.js';

import Button from '../../../components/Button.jsx';
// Settings › Nuzlocke Mode (v4.51): data-nuzlocke-action buttons handled by the engine (engine/modes/nuzlocke.js),
// which toggles nuzlockeConfirm (confirmation) then calls renderParams().
export default function Nuzlocke() {
  const s = nuzlockeState(),
    on = NUZLOCKE_ON();
  return (
    <section className="card" id="nuzlocke-panel">
      <h3 className="card-title">Mode Nuzlocke</h3>
      <p className="v4-note">
        Pour les joueurs qui aiment le risque. Un Pokémon K.O. à la fin d’un combat est perdu pour de bon (le dernier
        compagnon est toujours épargné), et on ne peut tenter qu’une seule rencontre par région et par jour.
        Désactivable à tout moment, sans rien rendre.
      </p>
      <div className="sv-io">
        {on ? (
          <Button size="small" variant="primary" data-nuzlocke-action="off">
            Nuzlocke : activé
          </Button>
        ) : nuzlockeConfirm ? (
          <>
            <span className="sv-q">Activer ? Les prochains K.O. seront définitifs.</span>
            <Button size="small" variant="primary" data-nuzlocke-action="yes">
              Oui, activer
            </Button>
            <Button size="small" data-nuzlocke-action="no">
              Annuler
            </Button>
          </>
        ) : (
          <Button size="small" data-nuzlocke-action="ask">
            Nuzlocke : désactivé
          </Button>
        )}
      </div>
      {s.fallen.length > 0 && (
        <p className="v4-note" style={{ marginTop: space.sm }}>
          <b>Tombés au combat ({s.fallen.length})</b> :{' '}
          {s.fallen
            .slice(-12)
            .map(m => m.n)
            .join(', ')}
          .
        </p>
      )}
    </section>
  );
}
