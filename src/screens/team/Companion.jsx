import { parseStyle } from '../../lib/html.jsx';
import { tc } from '../../engine/core/utils.js';
import { ART } from '../../engine/assets/item-icons.js';
import { shinyStyle } from '../../engine/pokemon/shiny.js';
import { companionPanelData } from '../../engine/progression/companion-pokemon.js';
import { buddyData } from '../../engine/progression/companion-eggs.js';
import { useHomeVersion } from '../home/homeStore.js';

// Companion (#v4Comp) and its Berry, Gift and Memories buttons, on the Team page (styles: team-companion.css).
// Clicks (data-comp, data-buddy) are still handled by the engine, which redraws through refreshHome().
export default function Companion() {
  useHomeVersion();
  const d = companionPanelData();
  return (
    <section
      id="v4Comp"
      className="team-companion v4-panel"
      aria-label="Compagnon"
      style={d ? { '--c': tc(d.m.t[0]) } : undefined}
    >
      {d ? <Sheet d={d} /> : <Empty />}
    </section>
  );
}

function Empty() {
  return (
    <div className="team-companion-empty">
      <span className="team-companion-icon">
        <svg>
          <use href="#i-team" />
        </svg>
      </span>
      <span className="team-companion-empty-text">
        <b>Un compagnon ?</b>
        <em>
          Choisissez le Pokémon qui vous accompagne partout. Son affection grandit à chaque combat et lui donne des
          bonus.
        </em>
      </span>
      <button type="button" className="b b-sm b-gold" data-comp="choisir">
        Choisir
      </button>
    </div>
  );
}

function Sheet({ d }) {
  const { m, h, pr, petting: petting, mood: hum, sh, bonus } = d,
    x = buddyData();
  return (
    <>
      <div
        className={'team-companion-art' + (sh ? ' is-shiny' : '')}
        style={sh ? parseStyle(shinyStyle(m.base)) : undefined}
      >
        <img src={ART(m.no)} alt="" loading="lazy" />
      </div>
      <div className="team-companion-text">
        <small>Compagnon</small>
        <b>{m.n}</b>
        <span className="team-companion-hearts" aria-label={`${h} cœur${h > 1 ? 's' : ''} sur 5`}>
          {[1, 2, 3, 4, 5].map(i => (
            <i key={i} className={i <= h ? 'is-on' : undefined}>
              ♥
            </i>
          ))}
        </span>
        <span className="team-companion-bar">
          <i style={{ width: `${pr}%` }} />
        </span>
        <em>{hum}</em>
        <em className="team-companion-bonus">{bonus || '2 cœurs : premier bonus en combat'}</em>
      </div>
      <div className="team-companion-actions">
        <button
          type="button"
          className={`b b-sm ${petting ? 'b-ghost' : 'b-gold'}`}
          data-comp="caresser"
          disabled={petting}
        >
          {petting ? 'Câliné ✓' : 'Câliner'}
        </button>
        <button type="button" className="b b-sm b-ghost" data-comp="choisir">
          Changer
        </button>
      </div>
      {x && (
        <div className="team-companion-buddy">
          <button type="button" className="b b-sm" data-buddy="baie" disabled={!!(x.feed || !x.baie)}>
            {x.feed ? 'Baie offerte ✓' : x.baie ? 'Offrir une Baie' : 'Pas de Baie'}
          </button>
          <button
            type="button"
            className={'b b-sm' + (x.h >= 3 && !x.gift ? ' b-gold' : ' b-ghost')}
            data-buddy="cadeau"
            disabled={!(x.h >= 3 && !x.gift)}
          >
            {x.h < 3 ? 'Cadeau à 3 ♥' : x.gift ? 'Cadeau reçu ✓' : 'Cadeau du jour'}
          </button>
          <button
            type="button"
            className={'b b-sm' + (x.isNew ? ' b-gold' : ' b-ghost')}
            data-buddy="souv"
            disabled={!x.h}
          >
            Souvenirs{x.isNew ? ' · nouveau' : ''}
          </button>
        </div>
      )}
    </>
  );
}
