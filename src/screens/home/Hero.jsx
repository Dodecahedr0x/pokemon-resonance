import { Html, parseStyle } from '../../lib/html.jsx';
import { tc } from '../../engine/core/utils.js';
import { squad } from '../../engine/team/team.js';
import { PROF_AV, emblem, goalChips, goalInfo, professorMsg } from '../../engine/world/home-journey.js';
import { ART } from '../../engine/assets/item-icons.js';
import { shinyStyle } from '../../engine/pokemon/shiny.js';
import { heroView } from '../../engine/world/living-home.js';
import { homeSkyInfo } from '../../engine/world/home-weather.js';

import Button from '../../components/Button.jsx';

// season ids (French, from home-weather.js) → class modifier
const SEASON_CLASS = { printemps: 'spring', ete: 'summer', automne: 'autumn', hiver: 'winter' };

// Home hero (#hmHero): next step (old renderHome), living backdrop depending on the
// region and time with the companion (v4.28), season and weather of the day (v4.52).
export default function Hero({ on }) {
  if (!on) {
    return <div className="home-hero" id="hmHero" />;
  }
  const g = goalInfo(),
    S = g.S,
    C = g.C,
    V = heroView(g),
    W = homeSkyInfo(),
    m = V.m;
  const title = g.k === 'tuto' ? 'L’aventure commence ici…' : (C && C.t) || S.n;
  const sub =
    g.k === 'tuto' ? (
      'Explorez, capturez, éveillez vos Pokémon en plein combat et devenez Champion de la Résonance !'
    ) : g.L ? (
      <>
        <b>{g.L.n}</b>, {g.L.t}
      </>
    ) : null;
  return (
    <div
      className="home-hero has-backdrop"
      id="hmHero"
      style={{ '--ac': g.type ? tc(g.type) : '#FFD45B' }}
      data-reg={V.reg}
      data-tod={V.tod}
    >
      <div className="home-hero-backdrop" aria-hidden="true">
        <span className="home-hero-landscape" />
        <span className="home-hero-daylight" />
        <span className="home-hero-shade" />
        {W && <span className={'home-hero-season is-' + SEASON_CLASS[W.se]} data-s={W.se} />}
        {W && W.wx && (
          <span className={'home-hero-weather board-weather board-weather-' + W.wx} data-k={W.wx}>
            <i />
            <i />
          </span>
        )}
      </div>
      <span className="home-hero-place">{V.tag}</span>
      {m && (
        <button
          type="button"
          className={'home-hero-companion' + (V.sh ? ' shiny' : '')}
          data-hero-banner={V.comp ? 'calin' : 'choisir'}
          aria-label={V.comp ? `Câliner ${m.n}` : 'Choisir un compagnon'}
          style={V.sh ? parseStyle(shinyStyle(m.base)) : undefined}
        >
          <span className="home-hero-companion-shadow" />
          <img src={ART(m.no)} alt="" decoding="async" />
          <span className="home-hero-companion-name">
            {V.comp ? `${m.n} ${'♥'.repeat(Math.max(1, V.hearts))}` : 'Un compagnon ?'}
          </span>
        </button>
      )}
      <div className="home-hero-body">
        <p className="home-hero-kicker">
          <span className="home-hero-emblem">
            <Html html={emblem(g.k, 'xs')} />
          </span>
          Prochaine étape{C ? ' · ' + C.c : ''}
        </p>
        <h2 className="home-hero-title">{title}</h2>
        {sub && <p className="home-hero-lead">{sub}</p>}
        {'\n  '}
        <div className="home-hero-chips">
          <Html html={goalChips(S)} />
        </div>
        {'\n  '}
        <div className="home-hero-actions">
          {squad.length ? (
            <Button size="large" variant="primary" className="home-hero-start" data-goal={g.k}>
              <span className="home-hero-start-icon">
                <svg>
                  <use href="#i-play" />
                </svg>
              </span>
              {g.k === 'tuto' ? 'Commencer l’aventure' : 'Continuer l’aventure'}
              <svg>
                <use href="#i-arrow" />
              </svg>
            </Button>
          ) : (
            <Button size="large" variant="primary" className="home-hero-start" data-go="pokedex">
              <span className="home-hero-start-icon">
                <svg>
                  <use href="#i-team" />
                </svg>
              </span>
              Choisir mon équipe
              <svg>
                <use href="#i-arrow" />
              </svg>
            </Button>
          )}
          <Button variant="ghost" data-guide="debuter">
            Comment jouer
          </Button>
        </div>
        {'\n  '}
        <div className="home-hero-professor">
          <Html html={PROF_AV} />
          <p>
            <span className="dialogue-speaker">Prof. Sorbier</span>
            <Html html={professorMsg()} />
          </p>
        </div>
      </div>
      {W && <span className="home-hero-forecast">{W.txt}</span>}
    </div>
  );
}
