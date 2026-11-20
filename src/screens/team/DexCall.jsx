import { useState } from 'react';
import { Html } from '../../lib/html.jsx';
import { BY, PRESETS } from '../../engine/pokemon/pokemon.js';
import { PROFILE, inBox } from '../../engine/state/game-state.js';
import { RC } from '../../engine/pokemon/roles-synergies.js';
import { medal } from '../../engine/core/utils.js';
import { squad } from '../../engine/team/team.js';
import { STARS } from '../../engine/modes/gym-screen.js';
import { LEGS } from '../../engine/modes/legendaries.js';
import { TEAM_NAME_EDIT } from '../../engine/team/saved-teams.js';

import Button from '../../components/Button.jsx';
// Panel above the grid (#dexCall, old renderDexCall): confirmed recruits,
// captured legends (v4.29), saved teams (v4.32), formations.
// Clicks: engine listeners (#dexCall [data-stg], data-pf, data-team-save, data-species-sheet).
export default function DexCall({ v }) {
  const [isOpen, setOpen] = useState(
    () => !(typeof matchMedia === 'function' && matchMedia('(max-width:700px)').matches)
  );
  return (
    <div className="team-recruits" id="dexCall">
      <div className="team-recruits-row">
        <span
          className="caption"
          title="Formes déjà évoluées, recrutées directement : plus puissantes tout de suite, mais plus chères."
        >
          Recrues confirmées
        </span>
        <div className="team-recruits-list">
          {STARS.map(id => {
            const m = BY[id],
              sel = squad.includes(id);
            return (
              <button
                key={id}
                type="button"
                className={`team-recruit${sel ? ' is-selected' : ''}`}
                data-stg={id}
                aria-pressed={sel}
                disabled={!inBox(id)}
                title={`${m.n} · ${m.r} · ${RC(id)} PC`}
              >
                <Html html={medal(m.t, 'is-tiny')} />
                <b>{m.n}</b>
                <em>{RC(id)}</em>
              </button>
            );
          })}
        </div>
      </div>
      <Legends />
      {/* Saved teams and formations: collapsed on phone, where they pushed the grid below the screen */}
      <details className="team-recruits-more" open={isOpen} onToggle={e => setOpen(e.currentTarget.open)}>
        <summary>Équipes enregistrées et formations</summary>
        {/* rebuilt on every render, like the old innerHTML: « Sûr ? » (Sure?) is written by the engine */}
        <SavedSquads key={v} />
        <div className="team-recruits-row">
          <span className="caption">Formations</span>
          <div className="team-recruits-buttons">
            {Object.entries(PRESETS).map(([k, p]) => (
              <Button key={k} size="small" data-pf={k} title={p.synergyText ? 'Synergies : ' + p.synergyText : ''}>
                {p.n}
              </Button>
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
    <div className="team-recruits-row">
      <span className="caption" title="Légendes capturées : 8 PC chacune.">
        Légendes
      </span>
      <div className="team-recruits-list">
        {L.map(x => {
          const m = BY[x.id],
            sel = squad.includes(x.id);
          return (
            <button
              key={x.id}
              type="button"
              className={`team-recruit${sel ? ' is-selected' : ''}`}
              data-stg={x.id}
              data-species-sheet={x.id}
              aria-pressed={sel}
              title={`${m.n} · ${RC(x.id)} PC`}
            >
              <Html html={medal(m.t, 'is-tiny')} />
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
    <div className="team-recruits-row team-saved-teams">
      <span className="caption">Mes équipes</span>
      <div className="team-recruits-buttons">
        {T.map((t, i) => (
          <span key={i} className="team-saved-team">
            <Button
              size="small"
              data-team-save="charger"
              data-i={i}
              title={t.ids.map(id => (BY[id] ? BY[id].n : id)).join(', ')}
            >
              {t.n}
            </Button>
            <button
              type="button"
              className="team-saved-team-delete"
              data-team-save="suppr"
              data-i={i}
              aria-label={`Supprimer ${t.n}`}
            >
              ×
            </button>
          </span>
        ))}
        {TEAM_NAME_EDIT ? (
          <span className="team-saved-team-new">
            <input
              type="text"
              id="team-name"
              maxLength={20}
              placeholder="Nom de l’équipe"
              aria-label="Nom de l’équipe"
            />
            <Button size="small" variant="primary" data-team-save="ok">
              OK
            </Button>
          </span>
        ) : (
          <Button size="small" variant="ghost" data-team-save="nouv" disabled={!(squad.length && T.length < 8)}>
            + Enregistrer l’équipe
          </Button>
        )}
      </div>
    </div>
  );
}
