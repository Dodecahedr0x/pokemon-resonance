import { useEffect, useRef } from 'react';
import { MOVES } from '../../engine/data/moves.js';
import { POKEMON, SYS3 } from '../../engine/pokemon/pokemon.js';
import { ARR } from '../../engine/pokemon/evolution.js';
import { RM, medal } from '../../engine/core/utils.js';
import { Html } from '../../lib/html.jsx';
import { setRuleOpen, useGuide } from './guideStore.js';

// Awakening energy diamonds.
function Diamonds({ n }) {
  return (
    <span className="energy-pips is-large">
      {[0, 1, 2].map(i => (
        <i key={i} className={i < n ? 'is-filled' : ''} />
      ))}
    </span>
  );
}

function Stadium({ mon, lost = [] }) {
  return (
    <div className="guide-anatomy-pokemon">
      <Html html={medal(mon.t)} />
      <b>{mon.n}</b>
      <div className="guide-anatomy-moves">
        {mon.mv.map(id => (
          <span key={id} className={lost.includes(id) ? 'guide-anatomy-move is-lost' : 'guide-anatomy-move'}>
            {MOVES[id].n}
          </span>
        ))}
      </div>
    </div>
  );
}

// Anatomy of an Awakening: five cards, from Caterpie to Butterfree.
export function Anatomy() {
  const C = POKEMON.chenipan,
    Y = POKEMON.chrysacier,
    Pp = POKEMON.papilusion,
    T = POKEMON.tetarte;
  return (
    <>
      <article className="guide-anatomy-card orn">
        <span className="guide-anatomy-number">01</span>
        <h3 className="card-title">Remplir</h3>
        <Diamonds n={2} />
        <p>Trois losanges par Pokémon. Chacun se gagne en jouant.</p>
        <ul className="guide-anatomy-sources">
          <li>
            <b>+1</b>fin de manche
          </li>
          <li>
            <b>+1</b>réaction préparée ou déclenchée
          </li>
          <li>
            <b>+1</b>coup encaissé de 30 % des PV
          </li>
          <li>
            <b>+1</b>pour tous quand un allié tombe
          </li>
        </ul>
      </article>
      <article className="guide-anatomy-card orn">
        <span className="guide-anatomy-number">02</span>
        <h3 className="card-title">Choisir</h3>
        <div className="guide-anatomy-branch">
          <Html html={medal(T.t)} />
          <span className="guide-anatomy-fork">
            <i />
            <i />
          </span>
          <span className="guide-anatomy-options">
            <span>
              <Html html={medal(POKEMON.tartard.t, 'is-small')} />
              Tartard
            </span>
            <span>
              <Html html={medal(POKEMON.tarpaud.t, 'is-small')} />
              Tarpaud
            </span>
          </span>
        </div>
        <p>
          Têtarte devient Tarpaud sur l’eau ou sous la pluie, Tartard au contact d’un adversaire. Ramoloss et Debugant
          ont aussi plusieurs voies. Évoli lit la marque sous ses pieds et l’heure.
        </p>
      </article>
      <article className="guide-anatomy-card orn">
        <span className="guide-anatomy-number">03</span>
        <h3 className="card-title">Arrivée</h3>
        <div className="guide-anatomy-arrival">
          <Html html={medal(Pp.t, 'is-large')} />
          <span className="guide-anatomy-ring" />
          <span className="guide-anatomy-ring is-delayed" />
        </div>
        <p>
          <b>Papilusion :</b> <Html html={ARR.papilusion[1]} /> <b>Léviator :</b> <Html html={ARR.leviator[1]} />
        </p>
      </article>
      <article className="guide-anatomy-card orn is-wide">
        <span className="guide-anatomy-number">04</span>
        <h3 className="card-title">Renoncer</h3>
        <div className="guide-anatomy-line">
          <Stadium mon={C} lost={['charge']} />
          <span className="guide-anatomy-arrow">→</span>
          <Stadium mon={Y} lost={['armure', 'secretion']} />
          <span className="guide-anatomy-arrow">→</span>
          <Stadium mon={Pp} />
        </div>
        <p>
          Chaque stade remplace les capacités. Papilusion frappe à distance et soigne, mais{' '}
          <b>Sécrétion est perdue pour toujours</b> : plus personne ne ralentit l’ennemi.
        </p>
      </article>
      <article className="guide-anatomy-card orn is-danger">
        <span className="guide-anatomy-number">05</span>
        <h3 className="card-title">L’ennemi aussi</h3>
        <div className="guide-anatomy-foe">
          <span className="hp-bar is-segmented">
            <i className="is-half" style={{ width: '48%' }} />
          </span>
          <em>48 %</em>
        </div>
        <p>
          Un ennemi qui finit la manche sous 50 % de PV évolue. Achevez-le d’un coup, ou gardez-le au-dessus de la
          moitié.
        </p>
      </article>
    </>
  );
}

// The eight rule systems. A code (« S-03 ») elsewhere in the game expands the rule and scrolls to it.
export function Rules() {
  const { openRules, focusRule } = useGuide();
  const refs = useRef({});
  useEffect(() => {
    if (!focusRule) {
      return;
    }
    refs.current[focusRule.code]?.scrollIntoView?.({ behavior: RM ? 'auto' : 'smooth', block: 'center' });
  }, [focusRule]);
  return SYS3.map(s => (
    <details
      key={s.c}
      className="guide-rule"
      id={'r-' + s.c}
      ref={el => {
        refs.current[s.c] = el;
      }}
      open={openRules.has(s.c)}
      onToggle={e => setRuleOpen(s.c, e.currentTarget.open)}
    >
      <summary>
        <span className="guide-rule-code">{s.c}</span>
        <span>
          <span className="guide-rule-name">{s.n}</span>
          <span className="guide-rule-summary">
            <Html html={s.one} />
          </span>
        </span>
        <svg className="guide-rule-chevron">
          <use href="#i-chev" />
        </svg>
      </summary>
      <div className="guide-rule-body">
        <ul className="guide-rule-points">
          {s.pts.map(([t, n], i) => (
            <li key={i} className={n ? 'is-new' : undefined}>
              <Html html={t} />
            </li>
          ))}
        </ul>
        <div className="guide-rule-feeds">
          <span className="guide-rule-feeds-label">Alimente</span>
          {s.f.map(c => (
            <button key={c} className="chip code-link" type="button" data-code={c}>
              {c}
            </button>
          ))}
        </div>
      </div>
    </details>
  ));
}

// « Combat » (Battle) tab: a four-beat turn, anatomy of an Awakening, rules.
export default function Basics() {
  return (
    <>
      <div className="guide-intro">
        <h2 className="section-title">Un tour en quatre temps</h2>
      </div>
      <div className="guide-turn">
        <div>
          <span className="guide-turn-number">1</span>
          <b>Lire</b>
          <p>Touchez un adversaire : la zone rouge montre sa portée.</p>
        </div>
        <div>
          <span className="guide-turn-number">2</span>
          <b>Bouger</b>
          <p>Touchez un Pokémon, puis une case bleue.</p>
        </div>
        <div>
          <span className="guide-turn-number">3</span>
          <b>Agir</b>
          <p>Capacité, case dorée, aperçu exact, confirmer.</p>
        </div>
        <div>
          <span className="guide-turn-number">4</span>
          <b>Éveiller</b>
          <p>Trois losanges pleins : choisissez l’évolution. Il n’y a pas de retour.</p>
        </div>
      </div>
      <div className="guide-section">
        <div className="guide-section-header">
          <div>
            <p className="kicker">Le cœur du jeu</p>
            <h2 className="section-title">Anatomie d’un Éveil</h2>
            <p className="d">
              Chenipan sait entraver. Papilusion frappe fort. Aucun des deux ne fait les deux. Tout le combat tient dans
              ce choix.
            </p>
          </div>
        </div>
        <div className="guide-anatomy" id="anat">
          <Anatomy />
        </div>
      </div>
      <div className="guide-section" id="regles">
        <div className="guide-section-header">
          <div>
            <p className="kicker">Règles</p>
            <h2 className="section-title">Huit systèmes imbriqués</h2>
            <p className="d">Ouvrez une règle, touchez un code pour suivre le fil. Les points dorés sont nouveaux.</p>
          </div>
        </div>
        <div className="guide-rules" id="rules">
          <Rules />
        </div>
      </div>
    </>
  );
}
