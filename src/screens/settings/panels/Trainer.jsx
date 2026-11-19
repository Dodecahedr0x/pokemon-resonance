import { DIFFS, PROFILE, isCamp } from '../../../engine/011-game-state.js';
import { BADGES } from '../../../engine/013-gyms.js';
import { tLevel } from '../../../engine/032-v4-foundation.js';
import { boxCapacityLabel } from '../../../engine/061-catch-anywhere.js';

// Trainer: first name, difficulty, game state. The engine handles #v4Nm, data-diff and data-v4saves.
export default function Trainer() {
  return (
    <section className="v4-panel v4-ps">
      <header className="v4-ph">
        <svg>
          <use href="#i-user" />
        </svg>
        <b>Dresseur</b>
      </header>
      <label className="v4-fld">
        <span>Prénom</span>
        <input
          type="text"
          id="v4Nm"
          maxLength={14}
          autoComplete="off"
          defaultValue={PROFILE.name || ''}
          placeholder="Votre prénom"
        />
      </label>
      <div className="v4-fld">
        <span>Difficulté</span>
        <div className="v4-seg" role="group" aria-label="Difficulté">
          {Object.entries(DIFFS).map(([k, n]) => (
            <button key={k} type="button" data-diff={k} aria-pressed={PROFILE.diff === k}>
              {n}
            </button>
          ))}
        </div>
      </div>
      <p className="v4-ps-n">
        {isCamp()
          ? `Campagne en cours · ${BADGES.length} badge${BADGES.length > 1 ? 's' : ''} · Nv. ${tLevel()}`
          : `Mode Libre : arènes ouvertes · ${boxCapacityLabel()}`}
      </p>
      <div className="v4-ps-a">
        <button type="button" className="b b-sm" data-v4saves="">
          Sauvegardes
        </button>
      </div>
    </section>
  );
}
