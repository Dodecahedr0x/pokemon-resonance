import { Html } from '../../lib/html.jsx';
import { GYMS } from '../../engine/data/game-data.js';
import { SCENARIOS } from '../../engine/pokemon/pokemon.js';
import { PROFILE } from '../../engine/state/game-state.js';
import { ARENAS } from '../../engine/modes/gyms.js';
import { TOD } from '../../engine/world/home-route.js';
import { ELITE, scenLock } from '../../engine/combat/items-bonds-ai.js';
import { chapterOf, ELITE_L, leaderOf } from '../../engine/progression/prestige.js';
import { avatar, goalChips } from '../../engine/world/home-journey.js';
import { itemIcon } from '../../engine/assets/item-icons.js';
import { SCREEN_STATE } from '../../engine/ui/screen-state.js';
import { bagCount } from '../../engine/state/economy.js';
import { dailyKey } from '../../engine/modes/daily-battle.js';
import { PLACE_BY_ID, placeIcon, placeName, placeState, rewardLine } from '../../engine/world/map.js';
import { johtoOpen, routeName } from '../../engine/world/johto.js';
import { SAFARI_BALLS, SAFARI_STEPS, SAFARI_PRICE, safariLocked } from '../../engine/modes/safari.js';
import { hoennOpen } from '../../engine/world/hoenn.js';
import { regionIndex } from '../../engine/world/catch-anywhere.js';
import { familyCaptureStats } from '../../engine/progression/regional-dex.js';

import Button from '../../components/Button.jsx';
import StatePill from '../../components/StatePill.jsx';
const Lock = ({ children }) => (
  <p className="map-info-lock">
    <svg>
      <use href="#i-lock" />
    </svg>
    {children}
  </p>
);

const Arrow = () => (
  <svg>
    <use href="#i-arrow" />
  </svg>
);

// Panel of the selected location (#mapInfo).
export default function MapInfo() {
  const p = PLACE_BY_ID[SCREEN_STATE.mapSel] || PLACE_BY_ID.tuto,
    st = placeState(p);
  if (p.id === 'safari') {
    return <SafariInfo p={p} />;
  }
  if (p.id === 'jwild' && !johtoOpen()) {
    return (
      <>
        <header className="map-info-header">
          <Html html={placeIcon(p)} />
          <span>
            <small>Route 32</small>
            <b>Hautes herbes de Johto</b>
          </span>
          <StatePill state="lock" />
        </header>
        <p className="map-info-text">Vingt Pokémon de Johto vivent ici : Hoothoot, Marill, Granivol, Scarhino…</p>
        <div className="map-info-actions">
          <Lock>Johto s’ouvre après votre victoire sur la Championne Auriane Vale.</Lock>
        </div>
      </>
    );
  }
  if (p.id === 'hwild' && !hoennOpen()) {
    return (
      <>
        <header className="map-info-header">
          <Html html={placeIcon(p)} />
          <span>
            <small>Route 104</small>
            <b>Hautes herbes de Hoenn</b>
          </span>
          <StatePill state="lock" />
        </header>
        <p className="map-info-text">Vingt Pokémon de Hoenn vivent ici : Arcko, Poussifeu, Gobou, Tarsal, Draby…</p>
        <div className="map-info-actions">
          <Lock>Hoenn s’ouvre après votre titre de Maître de Johto.</Lock>
        </div>
      </>
    );
  }
  if (p.id === 'wild' || p.id === 'jwild' || p.id === 'hwild') {
    const balls = bagCount('poke'),
      family = familyCaptureStats(regionIndex());
    return (
      <>
        <header className="map-info-header">
          <Html html={placeIcon(p)} />
          <span>
            <small>{`${routeName()} · ${TOD === 'nuit' ? 'nuit' : TOD === 'matin' ? 'matin' : 'jour'}`}</small>
            <b>Hautes herbes</b>
          </span>
        </header>
        <p className="map-info-text">
          Des Pokémon sauvages s’y cachent. Selon l’heure, ce ne sont pas les mêmes types. Affaiblissez-les,
          immobilisez-les, puis lancez une Ball au contact.
        </p>
        <div className="map-info-stats">
          <span>
            <img src={itemIcon('poke-ball')} alt="" />
            {`${balls} Poké Ball${balls > 1 ? 's' : ''}`}
          </span>
          <span>{`${family.n} / ${family.t} familles`}</span>
          <span>{`${PROFILE.caught} capture${PROFILE.caught > 1 ? 's' : ''}`}</span>
        </div>
        <div className="map-info-actions">
          <Button variant="primary" data-v4wild="">
            Explorer les hautes herbes
            <Arrow />
          </Button>
          <Button data-fishing-start="">Pêcher</Button>
        </div>
      </>
    );
  }
  if (p.id === 'elite') {
    return (
      <>
        <header className="map-info-header">
          <Html html={placeIcon(p)} />
          <span>
            <small>Chapitre 9 · Plateau de la Ligue</small>
            <b>Le Conseil 4</b>
          </span>
          <StatePill state={st} />
        </header>
        <p className="map-info-text">
          Quatre maîtres à battre dans l’ordre, avec les huit badges. Chacun lit le plateau à sa manière.
        </p>
        <div className="map-elite">
          {ELITE.map((k, i) => {
            const L = ELITE_L[i],
              lk = scenLock(k),
              won = PROFILE.elite >= i + 1;
            return (
              <button
                type="button"
                className={'map-elite-member' + (won ? ' is-won' : '')}
                data-v4fight={k}
                disabled={!!lk}
                key={k}
              >
                <Html html={avatar(L.n, SCENARIOS[k].at || 'Dragon', 'is-tiny')} />
                <span>
                  <b>
                    <Html html={L.n} />
                  </b>
                  <em>
                    <Html html={L.t} />
                  </em>
                </span>
                {won ? (
                  <svg className="map-elite-won">
                    <use href="#i-check" />
                  </svg>
                ) : lk ? (
                  <svg className="map-elite-lock">
                    <use href="#i-lock" />
                  </svg>
                ) : (
                  <span className="srw-lv">{`N.${SCENARIOS[k].lv}`}</span>
                )}
              </button>
            );
          })}
        </div>
      </>
    );
  }
  const k = p.id,
    S = SCENARIOS[k],
    L = leaderOf(k),
    C = chapterOf(k),
    lk = scenLock(k),
    r = (PROFILE.ranks || {})[k],
    gi = ARENAS.findIndex(a => a.k === k);
  return (
    <>
      <header className="map-info-header">
        <Html html={placeIcon(p)} />
        <span>
          <small>{`${C ? C.c : 'Entraînement'}${k === dailyKey() ? ' · Défi du jour' : ''}`}</small>
          <b>
            <Html html={placeName(p)} />
          </b>
        </span>
        <StatePill state={st} />
      </header>
      {'\n  '}
      {L && (
        <>
          <p className="map-info-leader">
            <b>
              <Html html={L.n} />
            </b>
            , <Html html={L.t} />
          </p>
          <blockquote className="map-info-quote">
            <Html html={L.q} />
          </blockquote>
        </>
      )}
      {'\n  '}
      <p className="map-info-text">
        <Html html={`${gi >= 0 ? GYMS[gi].r + ' ' : ''}${S.d || ''}`} />
      </p>
      {'\n  '}
      <div className="map-info-chips">
        <Html html={goalChips(S)} />
        {r ? <span className={`best-rank is-${r}`}>{`Rang ${r}`}</span> : null}
      </div>
      <Html html={rewardLine(k)} />
      {'\n  '}
      <div className="map-info-actions">
        {lk ? (
          <Lock>
            <Html html={lk} />
          </Lock>
        ) : (
          <Button variant="primary" data-v4fight={k}>
            {st === 'done' ? 'Rejouer' : 'Préparer le combat'}
            <Arrow />
          </Button>
        )}
      </div>
    </>
  );
}

// Safari Park (v4.18).
function SafariInfo({ p }) {
  const lk = safariLocked(),
    S2 = PROFILE.safari,
    takenSet = PROFILE.safariTaken || 0;
  return (
    <>
      <header className="map-info-header">
        <Html html={placeIcon(p)} />
        <span>
          <small>Kanto · détente</small>
          <b>Parc Safari</b>
        </span>
        <StatePill state={lk ? 'lock' : 'open'} />
      </header>
      <p className="map-info-text">
        Ici, pas de combat : on avance dans les herbes, on lance des Safari Balls, des appâts (il reste plus longtemps)
        et des cailloux (plus facile à attraper, mais il s’agace). Les Pokémon rares y sont plus fréquents, et les
        chromatiques deux fois plus.
      </p>
      <div className="map-info-stats">
        <span>{`${SAFARI_STEPS} pas`}</span>
        <span>{`${SAFARI_BALLS} Safari Balls`}</span>
        <span>{`${takenSet} capture${takenSet > 1 ? 's' : ''} au Parc`}</span>
      </div>
      <div className="map-info-actions">
        {lk ? (
          <Lock>
            <Html html={lk} />
          </Lock>
        ) : (
          <Button variant="primary" data-safari-panel-entrer="">
            {S2 ? 'Reprendre la visite' : `Entrer · ${SAFARI_PRICE} ₽`}
            <Arrow />
          </Button>
        )}
      </div>
    </>
  );
}
