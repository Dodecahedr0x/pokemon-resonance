import { Html } from '../../lib/html.jsx';
import { useOverlay } from './dialogsStore.js';
import { Dialogue } from './Fenetre.jsx';
import { BY } from '../../engine/009-03-pokemon.js';
import { medal, tc } from '../../engine/014-08-outils.js';
import { HELD_IMG, ITM } from '../../engine/032-v4-00-socle.js';

// Tour de Résonance (#tdrBox) : choix de l'équipe, puis récompense entre deux étages.
// Le moteur (043) garde les clics (écouteur sur #tdrBox) et l'attribut hidden : React ne
// rend `hidden` qu'au montage et ne le modifie plus.
export default function TdrBox() {
  const s = useOverlay('tdr');
  return (
    <div className="result tdr-box" id="tdrBox" hidden>
      {s && (s.mode === 'reward' ? <Recompense key={s.v} {...s} /> : <Choix key={s.v} {...s} />)}
    </div>
  );
}

// Choix des 4 Pokémon de l'ascension.
function Choix({ cands, pick }) {
  const n = pick.length;
  return (
    <Dialogue className="sv-card st-card tdr-card" titre="tdrT" fermer={{ 'data-tdr': 'x' }}>
      <p className="kick">Après-jeu</p>
      <h2 className="h2" id="tdrT">Tour de Résonance</h2>
      <p className="d">Choisissez 4 Pokémon pour cette ascension. Pas de budget ici : à vous de trouver les bonnes synergies.</p>
      <div className="st-grid tdr-grid">
        {cands.map(id => {
          const m = BY[id],
            on = pick.includes(id);
          return (
            <button key={id} type="button" className={'st-o tdr-o' + (on ? ' on' : '')} data-tdrp={id} aria-pressed={on} style={{ '--c': tc(m.t[0]) }}>
              <Html html={medal(m.t, 'lg')} />
              <b>{m.n}</b>
              <em>{m.t.join(' / ')} · {m.r}</em>
            </button>
          );
        })}
      </div>
      <div className="tdr-a">
        <button type="button" className="b b-gold" data-tdr="go" disabled={n !== 4}>Commencer l’ascension · {n} / 4</button>
      </div>
    </Dialogue>
  );
}

// Récompense après un étage franchi.
function Recompense({ floor, offer }) {
  return (
    <Dialogue className="sv-card st-card tdr-card" titre="tdrT">
      <p className="kick">Tour de Résonance · étage {floor - 1} franchi</p>
      <h2 className="h2" id="tdrT">Choisissez une récompense</h2>
      <div className="tdr-rw">
        {offer.map((x, i) => (
          <button key={i} type="button" className="tdr-r" data-tdrr={i}>
            {x.k === 'voix' ? (
              <span className="tdr-ic">+1</span>
            ) : x.k === 'item' ? (
              <span className="tdr-ic"><img src={ITM(HELD_IMG[x.it])} alt="" /></span>
            ) : (
              <Html html={medal(BY[x.to].t, 'sm')} />
            )}
            <span><b>{x.t}</b><em>{x.d}</em></span>
          </button>
        ))}
      </div>
      <p className="d">Ensuite : étage {floor}{floor % 5 === 0 ? ', gardé par une légende' : ''}.</p>
    </Dialogue>
  );
}
