import { TYPES } from '../../../engine/004-data.js';
import { BY } from '../../../engine/009-pokemon.js';
import { PROFILE, isCamp } from '../../../engine/011-game-state.js';
import { CHALLENGES, CHALLENGE_CONF } from '../../../engine/048-replayability.js';

// Challenge switch (data-defi, handled by the engine).
function Challenge({ k, on }) {
  return (
    <label className="v4-sw">
      <span>
        <b>{CHALLENGES[k][0]}</b>
        <em>{CHALLENGES[k][1]}</em>
      </span>
      <input type="checkbox" data-defi={k} defaultChecked={!!on} />
      <i aria-hidden="true" />
    </label>
  );
}

// Campaign challenges (defisHtml): mono-type, team of 3, no Awakening, Nuzlocke.
export default function CampaignChallenges() {
  if (!isCamp()) {
    return (
      <section className="v4-panel v4-ps">
        <header className="v4-ph">
          <svg>
            <use href="#i-trophy" />
          </svg>
          <b>Défis de campagne</b>
        </header>
        <p className="v4-ps-n">Les défis se jouent en Campagne.</p>
      </section>
    );
  }
  const d = PROFILE.challenges || {},
    tomb = (PROFILE.graves || []).filter(b => BY[b]);
  return (
    <section className="v4-panel v4-ps">
      <header className="v4-ph">
        <svg>
          <use href="#i-trophy" />
        </svg>
        <b>Défis de campagne</b>
      </header>
      <p className="v4-ps-n">Chaque défi actif rapporte 1 Éclat par victoire, 4 par nouveau badge.</p>
      <label className="v4-fld">
        <span>Mono-type</span>
        <select data-defi="mono" aria-label="Mono-type" defaultValue={d.mono || ''}>
          <option value="">Aucun</option>
          {Object.keys(TYPES).map(t => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </label>
      <Challenge k="trio" on={d.trio} />
      <Challenge k="sansEveil" on={d.sansEveil} />
      <div className="v4-sw nz">
        <span>
          <b>Nuzlocke</b>
          <em>{CHALLENGES.nuzlocke[1]}</em>
        </span>
        {d.nuzlocke ? (
          <button type="button" className="b b-sm b-ghost" data-nz="stop">
            Abandonner
          </button>
        ) : CHALLENGE_CONF ? (
          <span className="nz-c">
            <button type="button" className="b b-sm b-gold" data-nz="ok">
              Confirmer
            </button>
            <button type="button" className="b b-sm b-ghost" data-nz="non">
              Annuler
            </button>
          </span>
        ) : (
          <button type="button" className="b b-sm" data-nz="on">
            Activer
          </button>
        )}
      </div>
      {CHALLENGE_CONF && !d.nuzlocke ? (
        <p className="v4-ps-n nz-w">
          Attention : chaque Pokémon mis K.O. ne pourra plus combattre de toute la campagne. Confirmez pour commencer.
        </p>
      ) : null}
      {tomb.length ? (
        <p className="v4-ps-n">
          Tombés au combat : {tomb.map(b => BY[b].n).join(', ')}
          {d.nuzlocke ? '' : ' (le Nuzlocke est abandonné : ils peuvent revenir)'}.
        </p>
      ) : null}
    </section>
  );
}
