import { Fragment } from 'react';
import { Html } from '../../../lib/html.jsx';
import { BY, SCEN } from '../../../engine/009-03-pokemon.js';
import { BUDGET } from '../../../engine/010-04-evolution-en-combat.js';
import { DIFFS, PROFILE } from '../../../engine/011-05-etat-de-partie.js';
import { RC, synOf } from '../../../engine/012-06-recrues-roles-synergies.js';
import { medal, tc } from '../../../engine/014-08-outils.js';
import { cost, squad, vBonus } from '../../../engine/020-13-equipe-cartes.js';
import { scenLock } from '../../../engine/022-15-systemes-objets-liens-ia.js';
import { scSel } from '../../../engine/024-17-interface-combat.js';
import { teamBtns } from '../../../engine/027-21-arene-a-lecran.js';
import { k2n } from '../../../engine/031-25-v3-parcours-accueil.js';
import { DOCTRINES430 } from '../../../engine/065-v4-30-01-camp-et-tactique.js';

// Comme avec l'ancien innerHTML, un bloc masqué garde son dernier contenu.
let champWhy = null, // raisons du Champion affichées en dernier
  docVu = false; // la doctrine a déjà été dessinée une fois

// Les quatre places de l'équipe, puis les synergies actives (#ptList).
function Places() {
  const S = synOf(squad);
  return (
    <>
      <div className="ptc">
        {Array.from({ length: 4 }, (_, i) => {
          const id = squad[i];
          if (!id)
            return (
              <button key={i} type="button" className="ptc-m add" data-go="pokedex" aria-label="Ajouter un Pokémon">
                <i>+</i>
                <em>Libre</em>
              </button>
            );
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

// Doctrine (v4.30) : #doc430, avant le bouton Lancer.
function Doctrine() {
  const D = SCEN[scSel] || {},
    hidden = !!(D.tuto || D.hebdo429 || D.enigme431);
  if (!hidden) docVu = true;
  const k = DOCTRINES430[PROFILE.doc430] ? PROFILE.doc430 : '',
    X = DOCTRINES430[k];
  return (
    <div className="doc430" id="doc430" hidden={hidden}>
      {docVu && (
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

// Équipes enregistrées (v4.32) : #eqPrep432, sous l'en-tête.
function Equipes() {
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

// Encadré de l'équipe (#ptBox). v = 0 : gabarit de départ, avant le premier renderPrep().
export default function Team({ v }) {
  const on = v > 0;
  const lk = on && scenLock(scSel);
  const champ = on && scSel === 'champ';
  if (champ) champWhy = SCEN.champ.why.slice();
  return (
    <div className="pt" id="ptBox">
      <div className="pt-h">
        <span className="lbl-s">Votre équipe</span>
        <b id="ptCount">{on ? `${squad.length} / 4 · ${cost()} / ${BUDGET} PC` : '0 / 4'}</b>
        <button className="lnk" type="button" data-go="pokedex">
          Modifier
        </button>
      </div>
      {on && <Equipes key={'e' + v} />}
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
      {on && <Doctrine key={'d' + v} />}
      <div className="pt-go">
        <span id="ptVoix">
          {on && (
            <Fragment key={v}>
              <b>
                <Html html={k2n(scSel)} />
              </b>
              <span>{squad.length ? `${3 + vBonus()} Voix · ${DIFFS[PROFILE.diff]}` : 'Équipe vide'}</span>
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
