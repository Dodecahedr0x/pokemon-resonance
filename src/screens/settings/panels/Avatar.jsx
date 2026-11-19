import { TYPES } from '../../../engine/004-data.js';
import { gp, tc } from '../../../engine/014-utils.js';
import { AVT450, IM450 } from '../../../engine/080-trainer-avatar-rare-encounters.js';

// Settings › Trainer avatar and Rare encounters (v4.50): data-b450 buttons handled by the engine (module 080).
export default function Avatar() {
  const a = AVT450(),
    types = Object.keys(TYPES),
    on = IM450();
  return (
    <section className="v4-panel" id="aa450">
      <h3 className="h3">Avatar de dresseur</h3>
      <p className="v4-note">Choisissez l’emblème de votre type : il colore votre pastille en haut de l’écran et s’affiche sur l’écran « VS ».</p>
      <div className="av450-g">
        {types.map(t => {
          const sel = !!(a && a.e === t);
          return (
            <button key={t} type="button" className={`av450-b${sel ? ' on' : ''}`} data-b450="av" data-t={t} style={{ '--c': tc(t) }} aria-label={t} aria-pressed={sel}>
              <svg viewBox="0 0 24 24" width="20" height="20"><path d={gp(t)} fill="currentColor" fillRule="evenodd" /></svg>
            </button>
          );
        })}
      </div>
      <div className="sv-io">
        <button type="button" className={`b b-sm${a && a.hex ? ' b-gold' : ''}`} data-b450="hex">{a && a.hex ? 'Cadre carré arrondi : activé' : 'Cadre carré arrondi : désactivé'}</button>
        <button type="button" className="b b-sm" data-b450="avreset">Retirer l’avatar</button>
      </div>
      <h3 className="h3" style={{ marginTop: '16px' }}>Rencontres rares</h3>
      <p className="v4-note">Certains Pokémon sortent plus souvent la nuit, le matin ou selon la météo du jour (pluie, soleil, grêle, sable). Des trouvailles scintillent aussi sur la carte, une fois par jour.</p>
      <div className="sv-io">
        <button type="button" className={`b b-sm${on ? ' b-gold' : ''}`} data-b450="rare">{on ? 'Rencontres rares : activées' : 'Rencontres rares : désactivées'}</button>
      </div>
    </section>
  );
}
