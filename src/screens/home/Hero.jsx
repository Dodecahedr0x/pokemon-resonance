import { Html, parseStyle } from '../../lib/html.jsx';
import { tc } from '../../engine/014-utils.js';
import { squad } from '../../engine/020-team-cards.js';
import { PROF_AV, emblem, goalChips, goalInfo, professorMsg } from '../../engine/031-home-journey.js';
import { ART } from '../../engine/032-v4-foundation.js';
import { shinyStyle } from '../../engine/043-adventure-plus.js';
import { hero428 } from '../../engine/063-combat-catches-home.js';
import { alive450 } from '../../engine/082-living-home-weather.js';

// Home hero (#hmHero): next step (old renderHome), living backdrop depending on the
// region and time with the companion (v4.28), season and weather of the day (v4.52).
export default function Hero({ on }) {
  if (!on) return <div className="v4-hero" id="hmHero" />;
  const g = goalInfo(),
    S = g.S,
    C = g.C,
    V = hero428(g),
    W = alive450(),
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
    <div className="v4-hero hv428on" id="hmHero" style={{ '--ac': g.type ? tc(g.type) : '#FFD45B' }} data-reg={V.reg} data-tod={V.tod}>
      <div className="hv428" aria-hidden="true">
        <span className="hv428-bg" />
        <span className="hv428-tod" />
        <span className="hv428-shade" />
        {W && <span className={'hv450s hv450-' + W.se} data-s={W.se} />}
        {W && W.wx && (
          <span className={'hv450w wx448 wx448-' + W.wx} data-k={W.wx}>
            <i />
            <i />
          </span>
        )}
      </div>
      <span className="hv428-tag">{V.tag}</span>
      {m && (
        <button
          type="button"
          className={'hv428-comp' + (V.sh ? ' shiny' : '')}
          data-hv428={V.comp ? 'calin' : 'choisir'}
          aria-label={V.comp ? `Câliner ${m.n}` : 'Choisir un compagnon'}
          style={V.sh ? parseStyle(shinyStyle(m.base)) : undefined}
        >
          <span className="hv428-sol" />
          <img src={ART(m.no)} alt="" decoding="async" />
          <span className="hv428-n">{V.comp ? `${m.n} ${'♥'.repeat(Math.max(1, V.hearts))}` : 'Un compagnon ?'}</span>
        </button>
      )}
      <div className="v4h-body">
        <p className="v4-kick">
          <span className="v4h-emb">
            <Html html={emblem(g.k, 'xs')} />
          </span>
          Prochaine étape{C ? ' · ' + C.c : ''}
        </p>
        <h2 className="v4h-title">{title}</h2>
        {sub && <p className="v4h-sub">{sub}</p>}
        {'\n  '}
        <div className="v4h-chips">
          <Html html={goalChips(S)} />
        </div>
        {'\n  '}
        <div className="v4h-cta">
          {squad.length ? (
            <button type="button" className="b b-gold b-lg v4-cta" data-goal={g.k}>
              <span className="v4-cta-ic"><svg><use href="#i-play" /></svg></span>
              {g.k === 'tuto' ? 'Commencer l’aventure' : 'Continuer l’aventure'}
              <svg><use href="#i-arrow" /></svg>
            </button>
          ) : (
            <button type="button" className="b b-gold b-lg v4-cta" data-go="pokedex">
              <span className="v4-cta-ic"><svg><use href="#i-team" /></svg></span>
              Choisir mon équipe
              <svg><use href="#i-arrow" /></svg>
            </button>
          )}
          <button type="button" className="b b-ghost" data-guide="debuter">Comment jouer</button>
        </div>
        {'\n  '}
        <div className="v4h-prof">
          <Html html={PROF_AV} />
          <p>
            <span className="dlg-who">Prof. Sorbier</span>
            <Html html={professorMsg()} />
          </p>
        </div>
      </div>
      {W && <span className="hv450c">{W.txt}</span>}
    </div>
  );
}
