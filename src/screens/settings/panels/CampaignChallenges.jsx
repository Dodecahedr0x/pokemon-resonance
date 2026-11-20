import { TYPES } from '../../../engine/data/game-data.js';
import { BY } from '../../../engine/pokemon/pokemon.js';
import { PROFILE, isCamp } from '../../../engine/state/game-state.js';
import { CHALLENGES, CHALLENGE_CONF } from '../../../engine/progression/campaign-challenges.js';

import Button from '../../../components/Button.jsx';
// Challenge switch (data-defi, handled by the engine).
function Challenge({ k, on }) {
  return (
    <label className="settings-switch">
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
      <div className="settings-switch nuzlocke-switch">
        <span>
          <b>Nuzlocke</b>
          <em>{CHALLENGES.nuzlocke[1]}</em>
        </span>
        {d.nuzlocke ? (
          <Button size="small" variant="ghost" data-nz="stop">
            Abandonner
          </Button>
        ) : CHALLENGE_CONF ? (
          <span className="nuzlocke-confirm">
            <Button size="small" variant="primary" data-nz="ok">
              Confirmer
            </Button>
            <Button size="small" variant="ghost" data-nz="non">
              Annuler
            </Button>
          </span>
        ) : (
          <Button size="small" data-nz="on">
            Activer
          </Button>
        )}
      </div>
      {CHALLENGE_CONF && !d.nuzlocke ? (
        <p className="v4-ps-n nuzlocke-warning">
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
