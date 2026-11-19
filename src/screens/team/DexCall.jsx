import { useState } from 'react';
import { Html } from '../../lib/html.jsx';
import { BY, PRESETS } from '../../engine/pokemon/pokemon.js';
import { PROFILE, inBox } from '../../engine/state/game-state.js';
import { RC } from '../../engine/pokemon/roles-synergies.js';
import { medal } from '../../engine/core/utils.js';
import { squad } from '../../engine/team/team.js';
import { STARS } from '../../engine/modes/gym-screen.js';
import { LEGS } from '../../engine/modes/adventure.js';
import { TEAM_NAME_EDIT } from '../../engine/team/individuals.js';

// Panel above the grid (#dexCall, old renderDexCall): confirmed recruits,
// captured legends (v4.29), saved teams (v4.32), formations.
// Clicks: engine listeners (#dexCall [data-stg], data-pf, data-team-save, data-species-sheet).
export default function DexCall({ v }) {
  const [isOpen, setOpen] = useState(
    () => !(typeof matchMedia === 'function' && matchMedia('(max-width:700px)').matches)
  );
  return (
    <div className="dex-call" id="dexCall">
      <div className="dc-row">
        <span
          className="lbl-s"
          title="Formes déjà évoluées, recrutées directement : plus puissantes tout de suite, mais plus chères."
        >
          Recrues confirmées
        </span>
        <div className="dc-stars">
          {STARS.map(id => {
            const m = BY[id],
              sel = squad.includes(id);
            return (
              <button
                key={id}
                type="button"
                className={`dc-s${sel ? ' on' : ''}`}
                data-stg={id}
                aria-pressed={sel}
                disabled={!inBox(id)}
                title={`${m.n} · ${m.r} · ${RC(id)} PC`}
              >
                <Html html={medal(m.t, 'xs')} />
                <b>{m.n}</b>
                <em>{RC(id)}</em>
              </button>
            );
          })}
        </div>
      </div>
      <Legends />
      {/* Saved teams and formations: collapsed on phone, where they pushed the grid below the screen */}
      <details className="dc-more" open={isOpen} onToggle={e => setOpen(e.currentTarget.open)}>
        <summary>Équipes enregistrées et formations</summary>
        {/* rebuilt on every render, like the old innerHTML: « Sûr ? » (Sure?) is written by the engine */}
        <SavedSquads key={v} />
        <div className="dc-row">
          <span className="lbl-s">Formations</span>
          <div className="dc-f">
            {Object.entries(PRESETS).map(([k, p]) => (
              <button
                key={k}
                type="button"
                className={`b b-sm${p.f ? ' form' : ''}`}
                data-pf={k}
                title={p.synergyText ? 'Synergies : ' + p.synergyText : ''}
              >
                {p.n}
              </button>
            ))}
          </div>
        </div>
      </details>
    </div>
  );
}

// Captured legends.
function Legends() {
  const L = LEGS.filter(x => PROFILE.box.includes(x.id));
  if (!L.length) {
    return null;
  }
  return (
    <div className="dc-row">
      <span className="lbl-s" title="Légendes capturées : 8 PC chacune.">
        Légendes
      </span>
      <div className="dc-stars">
        {L.map(x => {
          const m = BY[x.id],
            sel = squad.includes(x.id);
          return (
            <button
              key={x.id}
              type="button"
              className={`dc-s${sel ? ' on' : ''}`}
              data-stg={x.id}
              data-species-sheet={x.id}
              aria-pressed={sel}
              title={`${m.n} · ${RC(x.id)} PC`}
            >
              <Html html={medal(m.t, 'xs')} />
              <b>{m.n}</b>
              <em>{RC(x.id)}</em>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Saved teams. Uncontrolled #teamName field, re-read by the engine.
function SavedSquads() {
  const T = PROFILE.savedTeams || [];
  return (
    <div className="dc-row team-save">
      <span className="lbl-s">Mes équipes</span>
      <div className="dc-f">
        {T.map((t, i) => (
          <span key={i} className="team-save-c">
            <button
              type="button"
              className="b b-sm"
              data-team-save="charger"
              data-i={i}
              title={t.ids.map(id => (BY[id] ? BY[id].n : id)).join(', ')}
            >
              {t.n}
            </button>
            <button
              type="button"
              className="team-save-x"
              data-team-save="suppr"
              data-i={i}
              aria-label={`Supprimer ${t.n}`}
            >
              ×
            </button>
          </span>
        ))}
        {TEAM_NAME_EDIT ? (
          <span className="team-save-n">
            <input
              type="text"
              id="team-name"
              maxLength={20}
              placeholder="Nom de l’équipe"
              aria-label="Nom de l’équipe"
            />
            <button type="button" className="b b-sm b-gold" data-team-save="ok">
              OK
            </button>
          </span>
        ) : (
          <button
            type="button"
            className="b b-sm b-ghost"
            data-team-save="nouv"
            disabled={!(squad.length && T.length < 8)}
          >
            + Enregistrer l’équipe
          </button>
        )}
      </div>
    </div>
  );
}
