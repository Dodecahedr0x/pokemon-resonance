import { Fragment, useState } from 'react';
import { Html } from '../../../lib/html.jsx';
import { BY, SCEN } from '../../../engine/009-pokemon.js';
import { BUDGET } from '../../../engine/010-in-battle-evolution.js';
import { DIFFS, PROFILE } from '../../../engine/011-game-state.js';
import { RC, synOf } from '../../../engine/012-recruits-roles-synergies.js';
import { medal, tc } from '../../../engine/014-utils.js';
import { cost, squad, vBonus } from '../../../engine/020-team-cards.js';
import { startVoice } from '../../../engine/021-combat-engine.js';
import { scenLock } from '../../../engine/022-items-bonds-ai.js';
import { scSel } from '../../../engine/024-combat-ui.js';
import { teamBtns } from '../../../engine/027-gym-on-screen.js';
import { k2n } from '../../../engine/031-home-journey.js';
import { DOCTRINES430 } from '../../../engine/065-camp-tactics.js';

// The four team slots, then the active synergies (#ptList).
function Places() {
  const S = synOf(squad);
  return (
    <>
      <div className="ptc">
        {Array.from({ length: 4 }, (_, i) => {
          const id = squad[i];
          if (!id) {
            return (
              <button key={i} type="button" className="ptc-m add" data-go="pokedex" aria-label="Ajouter un Pokémon">
                <i>+</i>
                <em>Libre</em>
              </button>
            );
          }
          const m = BY[id];
          return (
            <div key={i} className="ptc-m">
              <Html html={medal(m.t, 'sm')} />
              <b>
                <Html html={m.n} />
              </b>
              <em>
                {RC(id)} PC{m.st > 1 ? ' · confirmé' : ''}
              </em>
            </div>
          );
        })}
      </div>
      {S.length ? (
        <div className="pt-syn">
          {S.map((x, i) => (
            <span key={i} className="syn-c" title={x.d}>
              {x.t.map((t, j) => (
                <i key={j} style={{ background: tc(t) }} />
              ))}
              <Html html={x.n} />
            </span>
          ))}
        </div>
      ) : null}
    </>
  );
}

// Doctrine (v4.30): #doc430, before the Start button.
const doctrineHidden = () => {
  const D = SCEN[scSel] || {};
  return !!(D.tuto || D.hebdo429 || D.enigme431);
};

// docSeen: the doctrine has already been drawn once (a hidden block keeps its last content).
function Doctrine({ docSeen }) {
  const hidden = doctrineHidden();
  const k = DOCTRINES430[PROFILE.doc430] ? PROFILE.doc430 : '',
    X = DOCTRINES430[k];
  return (
    <div className="doc430" id="doc430" hidden={hidden}>
      {docSeen && (
        <>
          <div className="doc430-h">
            <svg>
              <use href="#i-doctrine" />
            </svg>
            <span className="lbl-s">Doctrine</span>
          </div>
          <div className="doc430-c" role="group" aria-label="Doctrine">
            {[['', 'Aucune'], ...Object.entries(DOCTRINES430).map(([x, o]) => [x, o.n])].map(([x, n]) => (
              <button key={x} type="button" className="doc430-b" data-doc430={x} aria-pressed={k === x}>
                <Html html={n} />
              </button>
            ))}
          </div>
          <p className="doc430-d">
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

// Saved teams (v4.32): #eqPrep432, under the header.
function Squads() {
  const T = PROFILE.teams432 || [];
  return (
    <div className="eqp432" id="eqPrep432" hidden={!T.length}>
      {T.length ? (
        <>
          <span className="lbl-s">Mes équipes</span>
          {T.map((t, i) => (
            <button key={i} type="button" className="b b-sm" data-eq432="charger" data-i={i}>
              {t.n}
            </button>
          ))}
        </>
      ) : null}
    </div>
  );
}

// Team box (#ptBox). v = 0: starting template, before the first renderPrep().
export default function Team({ v }) {
  const on = v > 0;
  const lk = on && scenLock(scSel);
  const champ = on && scSel === 'champ';
  // As with the old innerHTML, a hidden block keeps its last content.
  const [champWhy, setChampWhy] = useState(null);
  const why = champ ? SCEN.champ.why : null;
  if (why && (!champWhy || champWhy.join('\n') !== why.join('\n'))) {
    setChampWhy(why.slice());
  }
  const [docSeen, setDocSeen] = useState(false);
  const docShown = on && !doctrineHidden();
  if (docShown && !docSeen) {
    setDocSeen(true);
  }
  return (
    <div className="pt" id="ptBox">
      <div className="pt-h">
        <span className="lbl-s">Votre équipe</span>
        <b id="ptCount">{on ? `${squad.length} / 4 · ${cost()} / ${BUDGET} PC` : '0 / 4'}</b>
        <button className="lnk" type="button" data-go="pokedex">
          Modifier
        </button>
      </div>
      {on && <Squads key={'e' + v} />}
      <div className="pt-list" id="ptList">
        {on && <Places key={v} />}
      </div>
      <div className="champ-why" id="champWhy" hidden={!champ}>
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
      <div className="pt-x" hidden>
        <div id="ptTeamX">{on && <Html key={v} html={teamBtns()} />}</div>
      </div>
      {on && <Doctrine key={'d' + v} docSeen={docSeen || docShown} />}
      <div className="pt-go">
        <span id="ptVoix">
          {on && (
            <Fragment key={v}>
              <b>
                <Html html={k2n(scSel)} />
              </b>
              <span>{squad.length ? `${startVoice(vBonus())} Voix · ${DIFFS[PROFILE.diff]}` : 'Équipe vide'}</span>
            </Fragment>
          )}
        </span>
        <button className="b b-gold b-lg" id="bLaunch" type="button" disabled={on && (!squad.length || !!lk)}>
          {on && lk ? (
            'Verrouillé'
          ) : on && !squad.length ? (
            'Équipe vide'
          ) : (
            <>
              {on && scSel === 'tuto' ? 'Commencer' : 'Lancer le combat'}
              <svg>
                <use href="#i-arrow" />
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
