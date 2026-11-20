import { Html } from '../../lib/html.jsx';
import { useOverlay } from './dialogsStore.js';
import { Dialogue } from './Window.jsx';
import { BY } from '../../engine/pokemon/pokemon.js';
import { medal, tc } from '../../engine/core/utils.js';
import { HELD_IMG } from '../../engine/state/economy.js';
import { ITM } from '../../engine/assets/item-icons.js';

import Button from '../../components/Button.jsx';
// Resonance Tower (#tdrBox): team choice, then reward between two floors.
// The engine (043) keeps the clicks (listener on #tdrBox) and the hidden attribute: React only
// renders `hidden` at mount and no longer changes it.
export default function TdrBox() {
  const s = useOverlay('tdr');
  return (
    <div className="result tdr-box" id="tdrBox" hidden>
      {s && (s.mode === 'reward' ? <Reward key={s.v} {...s} /> : <Choice key={s.v} {...s} />)}
    </div>
  );
}

// Choice of the 4 Pokémon for the ascent.
function Choice({ cands, pick }) {
  const n = pick.length;
  return (
    <Dialogue className="dialog-card st-card tdr-card" titre="tdrT" closeAttrs={{ 'data-tdr': 'x' }}>
      <p className="kicker">Après-jeu</p>
      <h2 className="section-title" id="tdrT">
        Tour de Résonance
      </h2>
      <p className="d">
        Choisissez 4 Pokémon pour cette ascension. Pas de budget ici : à vous de trouver les bonnes synergies.
      </p>
      <div className="st-grid tdr-grid">
        {cands.map(id => {
          const m = BY[id],
            on = pick.includes(id);
          return (
            <button
              key={id}
              type="button"
              className={'st-o tdr-o' + (on ? ' on' : '')}
              data-tdrp={id}
              aria-pressed={on}
              style={{ '--c': tc(m.t[0]) }}
            >
              <Html html={medal(m.t, 'is-large')} />
              <b>{m.n}</b>
              <em>
                {m.t.join(' / ')} · {m.r}
              </em>
            </button>
          );
        })}
      </div>
      <div className="tdr-a">
        <Button variant="primary" data-tdr="go" disabled={n !== 4}>
          Commencer l’ascension · {n} / 4
        </Button>
      </div>
    </Dialogue>
  );
}

// Reward after a floor is cleared.
function Reward({ floor, offer }) {
  return (
    <Dialogue className="dialog-card st-card tdr-card" titre="tdrT">
      <p className="kicker">Tour de Résonance · étage {floor - 1} franchi</p>
      <h2 className="section-title" id="tdrT">
        Choisissez une récompense
      </h2>
      <div className="tdr-rw">
        {offer.map((x, i) => (
          <button key={i} type="button" className="tdr-r" data-tdrr={i}>
            {x.k === 'voix' ? (
              <span className="tdr-ic">+1</span>
            ) : x.k === 'item' ? (
              <span className="tdr-ic">
                <img src={ITM(HELD_IMG[x.it])} alt="" />
              </span>
            ) : (
              <Html html={medal(BY[x.to].t, 'is-small')} />
            )}
            <span>
              <b>{x.t}</b>
              <em>{x.d}</em>
            </span>
          </button>
        ))}
      </div>
      <p className="d">
        Ensuite : étage {floor}
        {floor % 5 === 0 ? ', gardé par une légende' : ''}.
      </p>
    </Dialogue>
  );
}
