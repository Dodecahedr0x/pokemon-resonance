import { Html } from '../../lib/html.jsx';
import { BY, MON, SCEN } from '../../engine/009-pokemon.js';
import { PROFILE } from '../../engine/011-game-state.js';
import { medal } from '../../engine/014-utils.js';
import { dailyDone, dailyKey, dailyLeft, familyOwned, fmt, trophies } from '../../engine/032-v4-foundation.js';
import { SQ } from '../../engine/039-quests-shop.js';
import { seasonData } from '../../engine/050-world.js';
import { radio417 } from '../../engine/057-companions-resonance.js';
import { weeklyBuild429 } from '../../engine/064-quality.js';

// Bottom of the Home page (.v4-bottom): season (#v4Saison, v4.11), Pokématos (#v4Radio, v4.17),
// daily challenge (#v4Event), counters (#v4Stats), weekly challenge (#v4Hebdo, v4.29).
export default function Footer({ on }) {
  return (
    <div className="v4-bottom">
      {on && <Season />}
      {on && <Radio />}
      <div className="v4-event" id="v4Event">
        {on && <Event />}
      </div>
      <div className="v4-stats" id="v4Stats">
        {on && <Stats />}
      </div>
      {on && <Weekly />}
    </div>
  );
}

function Season() {
  const d = seasonData();
  if (!d) {
    return <div className="v4-saison" id="v4Saison" hidden />;
  }
  const { s, isTaken: takenSet } = d;
  return (
    <div className="v4-saison" id="v4Saison" style={{ '--c': s.c }}>
      <div className="v4-panel sa-card">
        <span className="sa-ic" aria-hidden="true">
          <svg>
            <use href="#i-star" />
          </svg>
        </span>
        <span className="sa-t">
          <small>Événement de saison</small>
          <b>{s.n}</b>
          <em>{s.d}</em>
          {s.types.length ? (
            <span className="sa-ty">
              <Html html={s.types.map(t => medal([t], 'sm')).join('')} />
            </span>
          ) : null}
        </span>
        {s.giftFlag ? (
          takenSet ? (
            <span className="sa-ok">Cadeau reçu ✓</span>
          ) : (
            <button type="button" className="b b-gold b-sm" data-cadeau="">
              Ouvrir le cadeau
            </button>
          )
        ) : null}
      </div>
    </div>
  );
}

function Radio() {
  return (
    <section id="v4Radio" className="v4-radio v4-panel" aria-label="Pokématos">
      <header className="v4-ph">
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
        <span className="v4-cnt">Radio du jour</span>
      </header>
      <ul className="rd-l">
        {radio417().map(([t, x, go], i) => (
          <li key={i}>
            {go ? (
              <button type="button" className="rd-i" data-news={go}>
                <b>{t}</b>
                <em>{x}</em>
              </button>
            ) : (
              <div className="rd-i">
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
    <button type="button" className={'v4-ev' + (done ? ' done' : '')} data-v4fight={k}>
      <span className="v4-ev-art">
        <span className="v4t-scene" style={{ backgroundPosition: `${(k.charCodeAt(0) * 7) % 100}% 50%` }} />
      </span>
      <span className="v4-ev-t">
        <small>{done ? 'Défi du jour relevé' : 'Événement · Défi du jour'}</small>
        <b>{S.n}</b>
        <em>{done ? 'Revenez demain pour un nouveau défi.' : `Gains ×2 et +3 Éclats · encore ${dailyLeft()}`}</em>
      </span>
      <svg className="v4q-go">
        <use href="#i-chevr" />
      </svg>
    </button>
  );
}

function Stats() {
  const sq = SQ.filter(q => PROFILE.qc[q.id]).length;
  return (
    <>
      <a className="v4-st" data-t="dex" href="#dex">
        <svg>
          <use href="#i-dex" />
        </svg>
        <span>
          <small>Pokédex</small>
          <b>
            {familyOwned()} / {MON.filter(m => m.st === 1 && !m.isEnemy && m.base === m.id).length}
          </b>
        </span>
      </a>
      <a className="v4-st" data-t="quetes" href="#quetes">
        <svg>
          <use href="#i-trophy" />
        </svg>
        <span>
          <small>Trophées</small>
          <b>{trophies()} / 31</b>
        </span>
      </a>
      <a className="v4-st" data-t="quetes" href="#quetes">
        <svg>
          <use href="#i-medal" />
        </svg>
        <span>
          <small>Succès</small>
          <b>
            {sq} / {SQ.length}
          </b>
        </span>
      </a>
    </>
  );
}

function Weekly() {
  const H = weeklyBuild429(),
    h = PROFILE.hebdo429 && PROFILE.hebdo429.w === H.w ? PROFILE.hebdo429 : null;
  return (
    <button type="button" id="v4Hebdo" className="v4-hebdo v4-panel" data-hebdo429="1">
      <span className="hb429-ic">
        <svg>
          <use href="#i-trophy" />
        </svg>
      </span>
      <span className="hb429-x">
        <small>Défi de la semaine · {H.R.n}</small>
        <b>{h ? `Record : ${fmt(h.best)}${h.rec ? ' ✓' : ''}` : 'Même équipe pour tous'}</b>
        <em>{H.team.map(id => BY[id].n).join(' · ')}</em>
      </span>
      <svg className="hb429-go">
        <use href="#i-chevr" />
      </svg>
    </button>
  );
}
