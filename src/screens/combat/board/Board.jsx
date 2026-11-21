import { memo } from 'react';
import { useBoard, useHost } from './boardStore.js';
import BoardTools from './BoardTools.jsx';
import { Cells, Decor, Water, Light, Painting, Landmarks, Pedestals, Terrain, Textures } from './Terrain.jsx';
import { PE, lref } from './shared.js';
import { PkLayer, Intentions, Magnifier, Markers, Names, Obstacles, Highlights } from './Layers.jsx';
import Defs from './Defs.jsx';
import EvoFx from './EvoFx.jsx';
import { Units } from './Units.jsx';

// Battle board (#bBoard): the SVG of tiles and Pokémon, the evolution cutscene.
// The layers are remounted on each build (buildBoard), like the old svg.innerHTML = ''.
// The Pokémon tokens are rendered by Units.jsx; the empty layers (effects, floating
// numbers) receive the engine's one-off effects, which React never redraws.

function Layers() {
  return (
    <>
      <Defs />
      <Painting />
      <Pedestals />
      <Cells />
      <Textures />
      <Terrain />
      <Decor />
      <Water />
      <Light />
      <Landmarks />
      <Markers />
      <Obstacles />
      <Highlights />
      <Intentions />
      <g style={PE} ref={lref('fx')} />
      <Units />
      <Obstacles front />
      <Names />
      <g style={PE} ref={lref('fl')} />
      <Magnifier />
      <PkLayer />
    </>
  );
}

// memo: a render of the container (classes, children) does not redraw the board
const GameBoard = memo(function GameBoard() {
  const S = useBoard('svg');
  return (
    <svg
      id="bSvg"
      viewBox={'0 0 ' + S.vb.join(' ')}
      role="img"
      aria-label="Plateau de combat"
      className={'board-svg' + (S.bio ? ' biome-' + S.bio : '')}
    >
      {S.n > 0 && <Layers key={S.n} />}
    </svg>
  );
});
const Evo = memo(EvoFx);

// weather shown over the board (#board-weather), by weather id
const WEATHER_CLASS = { pluie: 'is-rain', grele: 'is-hail', sable: 'is-sandstorm', soleil: 'is-sun' };

// #bBoard container: classes, variables and data-ph follow the « host » state (boardStore.js).
// Children outside the SVG are in the order of a normal battle start (created on first use).
function Board() {
  const H = useHost();
  return (
    <div className={H.cls.join(' ')} id="bBoard" data-ph={H.ph} style={{ '--ac': H.ac, '--boardBg': H.boardBg }}>
      <GameBoard />
      <Evo />
      <div className="board-sky-tint" aria-hidden="true" />
      {H.cloudShade && (
        <div className="cloud-shade" aria-hidden="true">
          <i />
          <i />
        </div>
      )}
      {H.ambience && (
        <div
          key={H.ambience.k}
          className={'ambience' + (H.ambience.h === 'nuit' ? ' is-night' : '')}
          data-k={H.ambience.k}
          aria-hidden="true"
          style={{ '--c': H.ambience.c }}
        >
          {H.ambience.items.map((s, i) => (
            <i key={i} style={s} />
          ))}
        </div>
      )}
      {H.ciel && <Sky c={H.ciel} />}
      {H.boardTools && !H.boardTools.foot && <BoardTools b={H.boardTools} />}
      {H.boardWeather && (
        <div
          id="board-weather"
          aria-hidden="true"
          data-k={H.boardWeather}
          className={'board-weather' + (WEATHER_CLASS[H.boardWeather] ? ' ' + WEATHER_CLASS[H.boardWeather] : '')}
        >
          <i />
          <i />
        </div>
      )}
      {H.ambientFx && (
        <div className="ambient-fx" aria-hidden="true" data-k={H.ambientFx.k}>
          {H.ambientFx.items.map(([cls, s], i) => (
            <i key={i} className={cls} style={s} />
          ))}
        </div>
      )}
      {/* attack effects canvas: drawn and placed by the engine (028, fxPrep) */}
      {H.fxc && <canvas className="attack-effects-canvas" aria-hidden="true" />}
      {H.skyBanner && <SkyBanner b={H.skyBanner} />}
      {H.roundBanner && (
        <div
          key={H.roundBanner.n}
          className={'round-banner' + (H.roundBanner.isEnemy ? ' is-enemy' : '')}
          style={H.roundBanner.fast ? { animationDuration: '.8s' } : undefined}
        >
          <b>{H.roundBanner.title}</b>
          <span>{H.roundBanner.sub}</span>
        </div>
      )}
      {H.fade && (
        <div
          key={H.fade.n}
          className={'board-backdrop-fade' + (H.fade.va ? ' is-leaving' : '')}
          aria-hidden="true"
          style={{ backgroundImage: H.fade.bg }}
        />
      )}
    </div>
  );
}

// Battle sky (v4.30): time, weather, wind.
function Sky({ c }) {
  return (
    <div id="sky-banner" className="sky-banner" aria-live="polite">
      <span className="sky-chip" style={{ '--c': c.co }} title={c.ti}>
        <svg>
          <use href={'#' + c.ic} />
        </svg>
      </span>
      {c.w && (
        <span className="sky-chip" style={{ '--c': c.w[1] }} title={c.w[2]}>
          <svg>
            <use href={'#' + c.w[0]} />
          </svg>
        </span>
      )}
      <b>{c.displayName}</b>
      {c.vent && (
        <span className="sky-chip is-wind" style={{ '--c': '#cfe6ff' }} title="Vent">
          <svg>
            <use href="#i-vent" />
          </svg>
        </span>
      )}
    </div>
  );
}

// Sky announcement (v4.30): the time or weather changes.
function SkyBanner({ b }) {
  return (
    <div id="sky-banner-box" className={'sky-banner-strip' + (b.on ? ' is-shown' : '')}>
      <span className="sky-banner-icon" style={{ '--c': b.ic[1] }}>
        <svg>
          <use href={'#' + b.ic[0]} />
        </svg>
      </span>
      <b>{b.titre}</b>
      {b.bodyText ? <em>{b.bodyText}</em> : null}
    </div>
  );
}

export default memo(Board);
