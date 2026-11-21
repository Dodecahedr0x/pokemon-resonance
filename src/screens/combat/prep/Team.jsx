import { Fragment, useState } from 'react';
import { Html } from '../../../lib/html.jsx';
import { POKEMON, SCENARIOS } from '../../../engine/pokemon/pokemon.js';
import { BUDGET } from '../../../engine/pokemon/evolution.js';
import { DIFFICULTY_NAMES, PROFILE } from '../../../engine/state/game-state.js';
import { rosterCost, synergiesOf } from '../../../engine/pokemon/roles-synergies.js';
import { medal, typeColor } from '../../../engine/core/utils.js';
import { squadCost, squad, vBonus } from '../../../engine/team/team.js';
import { startVoice } from '../../../engine/combat/engine.js';
import { scenLock } from '../../../engine/combat/items-bonds-ai.js';
import { selectedScenario } from '../../../engine/combat/ui.js';
import { teamBtns } from '../../../engine/modes/gym-screen.js';
import { scenarioName } from '../../../engine/world/home-journey.js';
import { DOCTRINE_DEFS } from '../../../engine/combat/doctrines.js';

import Button from '../../../components/Button.jsx';
// The four team slots, then the active synergies (#ptList).
function Places() {
  const S = synergiesOf(squad);
  return (
    <>
      <div className="prep-team-slots">
        {Array.from({ length: 4 }, (_, i) => {
          const id = squad[i];
          if (!id) {
            return (
              <button
                key={i}
                type="button"
                className="prep-team-slot is-empty"
                data-go="pokedex"
                aria-label="Ajouter un Pokémon"
              >
                <i>+</i>
                <em>Libre</em>
              </button>
            );
          }
          const m = POKEMON[id];
          return (
            <div key={i} className="prep-team-slot">
              <Html html={medal(m.t, 'is-small')} />
              <b>
                <Html html={m.n} />
              </b>
              <em>
                {rosterCost(id)} PC{m.st > 1 ? ' · confirmé' : ''}
              </em>
            </div>
          );
        })}
      </div>
      {S.length ? (
        <div className="prep-team-synergies">
          {S.map((x, i) => (
            <span key={i} className="synergy-chip" title={x.d}>
              {x.t.map((t, j) => (
                <i key={j} style={{ background: typeColor(t) }} />
              ))}
              <Html html={x.n} />
            </span>
          ))}
        </div>
      ) : null}
    </>
  );
}

// Doctrine (v4.30): #doctrineChoice, before the Start button.
const doctrineHidden = () => {
  const D = SCENARIOS[selectedScenario] || {};
  return !!(D.tuto || D.hebdo429 || D.enigme431);
};

// docSeen: the doctrine has already been drawn once (a hidden block keeps its last content).
function Doctrine({ docSeen }) {
  const hidden = doctrineHidden();
  const k = DOCTRINE_DEFS[PROFILE.doctrineChoice] ? PROFILE.doctrineChoice : '',
    X = DOCTRINE_DEFS[k];
  return (
    <div className="prep-doctrine" id="doctrine-choice" hidden={hidden}>
      {docSeen && (
        <>
          <div className="prep-doctrine-head">
            <svg>
              <use href="#i-doctrine" />
            </svg>
            <span className="caption">Doctrine</span>
          </div>
          <div className="prep-doctrine-options" role="group" aria-label="Doctrine">
            {[['', 'Aucune'], ...Object.entries(DOCTRINE_DEFS).map(([x, o]) => [x, o.n])].map(([x, n]) => (
              <button
                key={x}
                type="button"
                className="prep-doctrine-option"
                data-doctrine-choice={x}
                aria-pressed={k === x}
              >
                <Html html={n} />
              </button>
            ))}
          </div>
          <p className="prep-doctrine-text">
            {X ? (
              <>
                <b>
                  <Html html={X.d} />
                </b>
                <Html html={' ' + X.c} />
              </>
            ) : (
              'Sans doctrine : aucun bonus, aucune contrepartie.'
            )}
          </p>
        </>
      )}
    </div>
  );
}

// Saved teams (v4.32): #savedSquadsBox, under the header.
function Squads() {
  const T = PROFILE.savedTeams || [];
  return (
    <div className="prep-saved-teams" id="saved-squads-box" hidden={!T.length}>
      {T.length ? (
        <>
          <span className="caption">Mes équipes</span>
          {T.map((t, i) => (
            <Button key={i} size="small" data-team-save="charger" data-i={i}>
              {t.n}
            </Button>
          ))}
        </>
      ) : null}
    </div>
  );
}

// Team box (#ptBox). v = 0: starting template, before the first renderPrep().
export default function Team({ v }) {
  const on = v > 0;
  const lk = on && scenLock(selectedScenario);
  const champ = on && selectedScenario === 'champ';
  // As with the old innerHTML, a hidden block keeps its last content.
  const [champWhy, setChampWhy] = useState(null);
  const why = champ ? SCENARIOS.champ.why : null;
  if (why && (!champWhy || champWhy.join('\n') !== why.join('\n'))) {
    setChampWhy(why.slice());
  }
  const [docSeen, setDocSeen] = useState(false);
  const docShown = on && !doctrineHidden();
  if (docShown && !docSeen) {
    setDocSeen(true);
  }
  return (
    <div className="prep-team" id="ptBox">
      <div className="prep-team-head">
        <span className="caption">Votre équipe</span>
        <b id="ptCount" className="prep-team-count">
          {on ? `${squad.length} / 4 · ${squadCost()} / ${BUDGET} PC` : '0 / 4'}
        </b>
        <button className="lnk" type="button" data-go="pokedex">
          Modifier
        </button>
      </div>
      {on && <Squads key={'e' + v} />}
      <div className="prep-team-list" id="ptList">
        {on && <Places key={v} />}
      </div>
      <div className="prep-champion-notes" id="champWhy" hidden={!champ}>
        {champWhy && (
          <Fragment key={v}>
            <b>Ce que le Champion a lu</b>
            {champWhy.map((w, i) => (
              <p key={i}>
                <Html html={w} />
              </p>
            ))}
          </Fragment>
        )}
      </div>
      <div className="prep-team-extra" hidden>
        <div id="ptTeamX">{on && <Html key={v} html={teamBtns()} />}</div>
      </div>
      {on && <Doctrine key={'d' + v} docSeen={docSeen || docShown} />}
      <div className="prep-launch">
        <span id="ptVoix" className="prep-launch-summary">
          {on && (
            <Fragment key={v}>
              <b>
                <Html html={scenarioName(selectedScenario)} />
              </b>
              <span>
                {squad.length ? `${startVoice(vBonus())} Voix · ${DIFFICULTY_NAMES[PROFILE.diff]}` : 'Équipe vide'}
              </span>
            </Fragment>
          )}
        </span>
        <Button size="large" variant="primary" id="bLaunch" disabled={on && (!squad.length || !!lk)}>
          {on && lk ? (
            'Verrouillé'
          ) : on && !squad.length ? (
            'Équipe vide'
          ) : (
            <>
              {on && selectedScenario === 'tuto' ? 'Commencer' : 'Lancer le combat'}
              <svg>
                <use href="#i-arrow" />
              </svg>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
