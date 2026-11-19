import { parseStyle } from '../../lib/html.jsx';
import { tc } from '../../engine/core/utils.js';
import { ART } from '../../engine/state/economy.js';
import { shinyStyle } from '../../engine/modes/adventure.js';
import { companionPanelData } from '../../engine/progression/companions.js';
import { buddyData } from '../../engine/progression/companion-eggs.js';

// Companion (#v4Comp, v4.17) and its Berry, Gift and Memories buttons (.buddy, v4.61).
// Clicks (data-comp, data-buddy) are still handled by the engine.
export default function Companion() {
  const d = companionPanelData();
  return (
    <section
      id="v4Comp"
      className="v4-comp v4-panel"
      aria-label="Compagnon"
      style={d ? { '--c': tc(d.m.t[0]) } : undefined}
    >
      {d ? <Sheet d={d} /> : <Empty />}
    </section>
  );
}

function Empty() {
  return (
    <div className="cp-vide">
      <span className="cp-ic">
        <svg>
          <use href="#i-team" />
        </svg>
      </span>
      <span>
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
      <div className={'cp-art' + (sh ? ' shiny' : '')} style={sh ? parseStyle(shinyStyle(m.base)) : undefined}>
        <img src={ART(m.no)} alt="" loading="lazy" />
      </div>
      <div className="cp-t">
        <small>Compagnon</small>
        <b>{m.n}</b>
        <span className="cp-h" aria-label={`${h} cœur${h > 1 ? 's' : ''} sur 5`}>
          {[1, 2, 3, 4, 5].map(i => (
            <i key={i} className={i <= h ? 'on' : ''}>
              ♥
            </i>
          ))}
        </span>
        <span className="cp-bar">
          <i style={{ width: `${pr}%` }} />
        </span>
        <em>{hum}</em>
        <em className="cp-bn">{bonus || '2 cœurs : premier bonus en combat'}</em>
      </div>
      <div className="cp-a">
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
        <div className="buddy">
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
