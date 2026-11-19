import { NZ450, nzConf450, nzSt450 } from '../../../engine/081-v4-51-mode-nuzlocke-option.js';

// Paramètres › Mode Nuzlocke (v4.51) : boutons data-b451 gérés par le moteur (module 081),
// qui bascule nzConf450 (confirmation) puis appelle renderParams().
export default function Nuzlocke() {
  const s = nzSt450(),
    on = NZ450();
  return (
    <section className="v4-panel" id="an451">
      <h3 className="h3">Mode Nuzlocke</h3>
      <p className="v4-note">Pour les joueurs qui aiment le risque. Un Pokémon K.O. à la fin d’un combat est perdu pour de bon (le dernier compagnon est toujours épargné), et on ne peut tenter qu’une seule rencontre par région et par jour. Désactivable à tout moment, sans rien rendre.</p>
      <div className="sv-io">
        {on ? (
          <button type="button" className="b b-sm b-gold" data-b451="off">Nuzlocke : activé</button>
        ) : nzConf450 ? (
          <>
            <span className="sv-q">Activer ? Les prochains K.O. seront définitifs.</span>
            <button type="button" className="b b-sm b-gold" data-b451="yes">Oui, activer</button>
            <button type="button" className="b b-sm" data-b451="no">Annuler</button>
          </>
        ) : (
          <button type="button" className="b b-sm" data-b451="ask">Nuzlocke : désactivé</button>
        )}
      </div>
      {s.mort.length > 0 && (
        <p className="v4-note" style={{ marginTop: '10px' }}><b>Tombés au combat ({s.mort.length})</b> : {s.mort.slice(-12).map(m => m.n).join(', ')}.</p>
      )}
    </section>
  );
}
