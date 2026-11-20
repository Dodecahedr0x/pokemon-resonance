import { TYPES } from '../../../engine/data/game-data.js';
import { gp, tc } from '../../../engine/core/utils.js';
import { TRAINER_AVATAR, RARE_ENABLED } from '../../../engine/world/rare-encounters.js';

import Button from '../../../components/Button.jsx';
// Settings › Trainer avatar and Rare encounters (v4.50): data-avatar-action buttons handled by the engine (engine/world/rare-encounters.js).
export default function Avatar() {
  const a = TRAINER_AVATAR(),
    types = Object.keys(TYPES),
    on = RARE_ENABLED();
  return (
    <section className="v4-panel" id="avatar-panel">
      <h3 className="h3">Avatar de dresseur</h3>
      <p className="v4-note">
        Choisissez l’emblème de votre type : il colore votre pastille en haut de l’écran et s’affiche sur l’écran « VS
        ».
      </p>
      <div className="avatar-grid">
        {types.map(t => {
          const sel = !!(a && a.e === t);
          return (
            <button
              key={t}
              type="button"
              className={`type-avatar-b${sel ? ' on' : ''}`}
              data-avatar-action="av"
              data-t={t}
              style={{ '--c': tc(t) }}
              aria-label={t}
              aria-pressed={sel}
            >
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path d={gp(t)} fill="currentColor" fillRule="evenodd" />
              </svg>
            </button>
          );
        })}
      </div>
      <div className="sv-io">
        <Button size="small" variant={a && a.hex ? 'primary' : undefined} data-avatar-action="hex">
          {a && a.hex ? 'Cadre carré arrondi : activé' : 'Cadre carré arrondi : désactivé'}
        </Button>
        <Button size="small" data-avatar-action="avreset">
          Retirer l’avatar
        </Button>
      </div>
      <h3 className="h3 settings-subhead">Rencontres rares</h3>
      <p className="v4-note">
        Certains Pokémon sortent plus souvent la nuit, le matin ou selon la météo du jour (pluie, soleil, grêle, sable).
        Des trouvailles scintillent aussi sur la carte, une fois par jour.
      </p>
      <div className="sv-io">
        <Button size="small" variant={on ? 'primary' : undefined} data-avatar-action="rare">
          {on ? 'Rencontres rares : activées' : 'Rencontres rares : désactivées'}
        </Button>
      </div>
    </section>
  );
}
