import { Html } from '../../lib/html.jsx';
import { SCEN } from '../../engine/pokemon/pokemon.js';
import { medal } from '../../engine/core/utils.js';
import { dailyDone, dailyKey, dailyLeft } from '../../engine/modes/daily-battle.js';
import { seasonData } from '../../engine/world/seasons.js';
import { radioLines } from '../../engine/world/pokegear.js';

import Button from '../../components/Button.jsx';
// Bottom of the Home page (.home-footer, home.css): season (#v4Saison, v4.11), Pokématos (#v4Radio, v4.17),
// daily challenge (#v4Event). Counters live in the Pokédex and Quests pages, the weekly
// challenge in Quests (Event tab).
export default function Footer({ on }) {
  return (
    <div className="home-footer">
      {on && <Season />}
      {on && <Radio />}
      <div className="home-daily" id="v4Event">
        {on && <Event />}
      </div>
    </div>
  );
}

function Season() {
  const d = seasonData();
  if (!d) {
    return <div className="home-season" id="v4Saison" hidden />;
  }
  const { s, isTaken: takenSet } = d;
  return (
    <div className="home-season" id="v4Saison" style={{ '--c': s.c }}>
      <div className="card home-season-card">
        <span className="home-season-icon" aria-hidden="true">
          <svg>
            <use href="#i-star" />
          </svg>
        </span>
        <span className="home-season-text">
          <small>Événement de saison</small>
          <b>{s.n}</b>
          <em>{s.d}</em>
          {s.types.length ? (
            <span className="home-season-types">
              <Html html={s.types.map(t => medal([t], 'is-small')).join('')} />
            </span>
          ) : null}
        </span>
        {s.giftFlag ? (
          takenSet ? (
            <span className="home-season-received">Cadeau reçu ✓</span>
          ) : (
            <Button size="small" variant="primary" data-cadeau="">
              Ouvrir le cadeau
            </Button>
          )
        ) : null}
      </div>
    </div>
  );
}

function Radio() {
  return (
    <section id="v4Radio" className="home-radio card" aria-label="Pokématos">
      <header className="card-header">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M5 9h14v11H5zM8 9l9-5M9 14a2 2 0 1 0 0 .1M14 13h3M14 16h3"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
        <b>Pokématos</b>
        <span className="card-count">Radio du jour</span>
      </header>
      <ul className="home-radio-list">
        {radioLines().map(([t, x, go], i) => (
          <li key={i}>
            {go ? (
              <button type="button" className="home-radio-item" data-news={go}>
                <b>{t}</b>
                <em>{x}</em>
              </button>
            ) : (
              <div className="home-radio-item">
                <b>{t}</b>
                <em>{x}</em>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function Event() {
  const k = dailyKey();
  if (!k) {
    return null;
  }
  const S = SCEN[k],
    done = dailyDone();
  return (
    <button type="button" className={'home-daily-button' + (done ? ' is-done' : '')} data-v4fight={k}>
      <span className="home-daily-art">
        <span className="landscape-scene" style={{ backgroundPosition: `${(k.charCodeAt(0) * 7) % 100}% 50%` }} />
      </span>
      <span className="home-daily-text">
        <small>{done ? 'Défi du jour relevé' : 'Événement · Défi du jour'}</small>
        <b>{S.n}</b>
        <em>{done ? 'Revenez demain pour un nouveau défi.' : `Gains ×2 et +3 Éclats · encore ${dailyLeft()}`}</em>
      </span>
      <svg className="home-daily-chevron">
        <use href="#i-chevr" />
      </svg>
    </button>
  );
}
