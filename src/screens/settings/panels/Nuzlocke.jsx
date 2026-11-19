import { NUZLOCKE_ON, nuzlockeConfirm, nuzlockeState } from '../../../engine/modes/nuzlocke.js';

// Settings › Nuzlocke Mode (v4.51): data-nuzlocke-action buttons handled by the engine (engine/modes/nuzlocke.js),
// which toggles nuzlockeConfirm (confirmation) then calls renderParams().
export default function Nuzlocke() {
  const s = nuzlockeState(),
    on = NUZLOCKE_ON();
  return (
    <section className="v4-panel" id="nuzlocke-panel">
      <h3 className="h3">Mode Nuzlocke</h3>
      <p className="v4-note">
        Pour les joueurs qui aiment le risque. Un Pokémon K.O. à la fin d’un combat est perdu pour de bon (le dernier
        compagnon est toujours épargné), et on ne peut tenter qu’une seule rencontre par région et par jour.
        Désactivable à tout moment, sans rien rendre.
      </p>
      <div className="sv-io">
        {on ? (
          <button type="button" className="b b-sm b-gold" data-nuzlocke-action="off">
            Nuzlocke : activé
          </button>
        ) : nuzlockeConfirm ? (
          <>
            <span className="sv-q">Activer ? Les prochains K.O. seront définitifs.</span>
            <button type="button" className="b b-sm b-gold" data-nuzlocke-action="yes">
              Oui, activer
            </button>
            <button type="button" className="b b-sm" data-nuzlocke-action="no">
              Annuler
            </button>
          </>
        ) : (
          <button type="button" className="b b-sm" data-nuzlocke-action="ask">
            Nuzlocke : désactivé
          </button>
        )}
      </div>
      {s.fallen.length > 0 && (
        <p className="v4-note" style={{ marginTop: '10px' }}>
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
