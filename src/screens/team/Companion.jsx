import { parseStyle } from '../../lib/html.jsx';
import { typeColor } from '../../engine/core/utils.js';
import { ART } from '../../engine/assets/item-icons.js';
import { shinyStyle } from '../../engine/pokemon/shiny.js';
import { companionPanelData } from '../../engine/progression/companion-pokemon.js';
import { buddyData } from '../../engine/progression/companion-eggs.js';
import { useHomeVersion } from '../home/homeStore.js';

import Button from '../../components/Button.jsx';
// Companion (#v4Comp) and its Berry, Gift and Memories buttons, on the Team page (styles: team-companion.css).
// Clicks (data-comp, data-buddy) are still handled by the engine, which redraws through refreshHome().
export default function Companion() {
  useHomeVersion();
  const d = companionPanelData();
  return (
    <section
      id="v4Comp"
      className="team-companion card"
      aria-label="Compagnon"
      style={d ? { '--c': typeColor(d.m.t[0]) } : undefined}
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
      <Button size="small" variant="primary" data-comp="choisir">
        Choisir
      </Button>
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
        <Button size="small" variant={petting ? 'ghost' : 'primary'} data-comp="caresser" disabled={petting}>
          {petting ? 'Câliné ✓' : 'Câliner'}
        </Button>
        <Button size="small" variant="ghost" data-comp="choisir">
          Changer
        </Button>
      </div>
      {x && (
        <div className="team-companion-buddy">
          <Button size="small" data-buddy="baie" disabled={!!(x.feed || !x.baie)}>
            {x.feed ? 'Baie offerte ✓' : x.baie ? 'Offrir une Baie' : 'Pas de Baie'}
          </Button>
          <Button
            size="small"
            variant={x.h >= 3 && !x.gift ? 'primary' : 'ghost'}
            data-buddy="cadeau"
            disabled={!(x.h >= 3 && !x.gift)}
          >
            {x.h < 3 ? 'Cadeau à 3 ♥' : x.gift ? 'Cadeau reçu ✓' : 'Cadeau du jour'}
          </Button>
          <Button size="small" variant={x.isNew ? 'primary' : 'ghost'} data-buddy="souv" disabled={!x.h}>
            Souvenirs{x.isNew ? ' · nouveau' : ''}
          </Button>
        </div>
      )}
    </>
  );
}
