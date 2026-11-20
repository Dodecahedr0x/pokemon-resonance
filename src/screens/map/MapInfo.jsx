import { Html } from '../../lib/html.jsx';
import { GYMS } from '../../engine/data/game-data.js';
import { SCEN } from '../../engine/pokemon/pokemon.js';
import { PROFILE } from '../../engine/state/game-state.js';
import { ARENAS } from '../../engine/modes/gyms.js';
import { TOD } from '../../engine/world/home-route.js';
import { ELITE, scenLock } from '../../engine/combat/items-bonds-ai.js';
import { CHAP, ELITE_L, leaderOf } from '../../engine/progression/prestige.js';
import { avatar, goalChips } from '../../engine/world/home-journey.js';
import { ITM } from '../../engine/assets/item-icons.js';
import { V4 } from '../../engine/ui/screen-state.js';
import { bagN } from '../../engine/state/economy.js';
import { dailyKey } from '../../engine/modes/daily-battle.js';
import { PL, STATE_N, placeIcon, placeName, placeState, rewardLine } from '../../engine/world/map.js';
import { johtoOpen, routeName } from '../../engine/world/johto.js';
import { SAFARI_BALLS, SAFARI_STEPS, SAFARI_PRICE, safariLocked } from '../../engine/modes/safari.js';
import { hoennOpen } from '../../engine/world/hoenn.js';
import { regionIndex } from '../../engine/world/catch-anywhere.js';
import { familyCaptureStats } from '../../engine/progression/regional-dex.js';

import Button from '../../components/Button.jsx';
const Lock = ({ children }) => (
  <p className="v4-lock">
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
  const p = PL[V4.mapSel] || PL.tuto,
    st = placeState(p);
  if (p.id === 'safari') {
    return <SafariInfo p={p} />;
  }
  if (p.id === 'jwild' && !johtoOpen()) {
    return (
      <>
        <header className="v4-mi-h">
          <Html html={placeIcon(p)} />
          <span>
            <small>Route 32</small>
            <b>Hautes herbes de Johto</b>
          </span>
          <em className="v4-pill s-lock">{STATE_N.lock}</em>
        </header>
        <p className="v4-mi-d">Vingt Pokémon de Johto vivent ici : Hoothoot, Marill, Granivol, Scarhino…</p>
        <div className="v4-mi-a">
          <Lock>Johto s’ouvre après votre victoire sur la Championne Auriane Vale.</Lock>
        </div>
      </>
    );
  }
  if (p.id === 'hwild' && !hoennOpen()) {
    return (
      <>
        <header className="v4-mi-h">
          <Html html={placeIcon(p)} />
          <span>
            <small>Route 104</small>
            <b>Hautes herbes de Hoenn</b>
          </span>
          <em className="v4-pill s-lock">{STATE_N.lock}</em>
        </header>
        <p className="v4-mi-d">Vingt Pokémon de Hoenn vivent ici : Arcko, Poussifeu, Gobou, Tarsal, Draby…</p>
        <div className="v4-mi-a">
          <Lock>Hoenn s’ouvre après votre titre de Maître de Johto.</Lock>
        </div>
      </>
    );
  }
  if (p.id === 'wild' || p.id === 'jwild' || p.id === 'hwild') {
    const balls = bagN('poke'),
      family = familyCaptureStats(regionIndex());
    return (
      <>
        <header className="v4-mi-h">
          <Html html={placeIcon(p)} />
          <span>
            <small>{`${routeName()} · ${TOD === 'nuit' ? 'nuit' : TOD === 'matin' ? 'matin' : 'jour'}`}</small>
            <b>Hautes herbes</b>
          </span>
        </header>
        <p className="v4-mi-d">
          Des Pokémon sauvages s’y cachent. Selon l’heure, ce ne sont pas les mêmes types. Affaiblissez-les,
          immobilisez-les, puis lancez une Ball au contact.
        </p>
        <div className="v4-mi-k">
          <span>
            <img src={ITM('poke-ball')} alt="" />
            {`${balls} Poké Ball${balls > 1 ? 's' : ''}`}
          </span>
          <span>{`${family.n} / ${family.t} familles`}</span>
          <span>{`${PROFILE.caught} capture${PROFILE.caught > 1 ? 's' : ''}`}</span>
        </div>
        <div className="v4-mi-a">
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
        <header className="v4-mi-h">
          <Html html={placeIcon(p)} />
          <span>
            <small>Chapitre 9 · Plateau de la Ligue</small>
            <b>Le Conseil 4</b>
          </span>
          <em className={`v4-pill s-${st}`}>{STATE_N[st]}</em>
        </header>
        <p className="v4-mi-d">
          Quatre maîtres à battre dans l’ordre, avec les huit badges. Chacun lit le plateau à sa manière.
        </p>
        <div className="v4-elite">
          {ELITE.map((k, i) => {
            const L = ELITE_L[i],
              lk = scenLock(k),
              won = PROFILE.elite >= i + 1;
            return (
              <button type="button" className={'v4-el' + (won ? ' won' : '')} data-v4fight={k} disabled={!!lk} key={k}>
                <Html html={avatar(L.n, SCEN[k].at || 'Dragon', 'xs')} />
                <span>
                  <b>
                    <Html html={L.n} />
                  </b>
                  <em>
                    <Html html={L.t} />
                  </em>
                </span>
                {won ? (
                  <svg className="ok">
                    <use href="#i-check" />
                  </svg>
                ) : lk ? (
                  <svg className="lk">
                    <use href="#i-lock" />
                  </svg>
                ) : (
                  <span className="srw-lv">{`N.${SCEN[k].lv}`}</span>
                )}
              </button>
            );
          })}
        </div>
      </>
    );
  }
  const k = p.id,
    S = SCEN[k],
    L = leaderOf(k),
    C = CHAP(k),
    lk = scenLock(k),
    r = (PROFILE.ranks || {})[k],
    gi = ARENAS.findIndex(a => a.k === k);
  return (
    <>
      <header className="v4-mi-h">
        <Html html={placeIcon(p)} />
        <span>
          <small>{`${C ? C.c : 'Entraînement'}${k === dailyKey() ? ' · Défi du jour' : ''}`}</small>
          <b>
            <Html html={placeName(p)} />
          </b>
        </span>
        <em className={`v4-pill s-${st}`}>{STATE_N[st]}</em>
      </header>
      {'\n  '}
      {L && (
        <>
          <p className="v4-mi-who">
            <b>
              <Html html={L.n} />
            </b>
            , <Html html={L.t} />
          </p>
          <blockquote className="v4-mi-q">
            <Html html={L.q} />
          </blockquote>
        </>
      )}
      {'\n  '}
      <p className="v4-mi-d">
        <Html html={`${gi >= 0 ? GYMS[gi].r + ' ' : ''}${S.d || ''}`} />
      </p>
      {'\n  '}
      <div className="v4h-chips">
        <Html html={goalChips(S)} />
        {r ? <span className={`rk-t rk-${r}`}>{`Rang ${r}`}</span> : null}
      </div>
      <Html html={rewardLine(k)} />
      {'\n  '}
      <div className="v4-mi-a">
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
      <header className="v4-mi-h">
        <Html html={placeIcon(p)} />
        <span>
          <small>Kanto · détente</small>
          <b>Parc Safari</b>
        </span>
        <em className={`v4-pill s-${lk ? 'lock' : 'open'}`}>{STATE_N[lk ? 'lock' : 'open']}</em>
      </header>
      <p className="v4-mi-d">
        Ici, pas de combat : on avance dans les herbes, on lance des Safari Balls, des appâts (il reste plus longtemps)
        et des cailloux (plus facile à attraper, mais il s’agace). Les Pokémon rares y sont plus fréquents, et les
        chromatiques deux fois plus.
      </p>
      <div className="v4-mi-k">
        <span>{`${SAFARI_STEPS} pas`}</span>
        <span>{`${SAFARI_BALLS} Safari Balls`}</span>
        <span>{`${takenSet} capture${takenSet > 1 ? 's' : ''} au Parc`}</span>
      </div>
      <div className="v4-mi-a">
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
