import { memo } from 'react';
import { useBoard, useHost } from './boardStore.js';
import Tools444 from './Tools444.jsx';
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
      className={S.bio ? 'bio-' + S.bio : undefined}
    >
      {S.n > 0 && <Layers key={S.n} />}
    </svg>
  );
});
const Evo = memo(EvoFx);

// #bBoard container: classes, variables and data-ph follow the « host » state (boardStore.js).
// Children outside the SVG are in the order of a normal battle start (created on first use).
// The width (style.width, gauge434) is still set by the engine: React does not manage this property.
function Board() {
  const H = useHost();
  return (
    <div className={H.cls.join(' ')} id="bBoard" data-ph={H.ph} style={{ '--ac': H.ac, '--bg477': H.bg477 }}>
      <GameBoard />
      <Evo />
      <div className="b-ciel" aria-hidden="true" />
      {H.cs477 && (
        <div className="cs477" aria-hidden="true">
          <i />
          <i />
        </div>
      )}
      {H.amb477 && (
        <div
          key={H.amb477.k}
          className={'amb477 ' + H.amb477.h}
          data-k={H.amb477.k}
          aria-hidden="true"
          style={{ '--c': H.amb477.c }}
        >
          {H.amb477.items.map((s, i) => (
            <i key={i} style={s} />
          ))}
        </div>
      )}
      {H.ciel && <Sky c={H.ciel} />}
      {H.bt444 && !H.bt444.foot && <Tools444 b={H.bt444} />}
      {H.wx448 && (
        <div id="wx448" aria-hidden="true" data-k={H.wx448} className={'wx448 wx448-' + H.wx448}>
          <i />
          <i />
        </div>
      )}
      {H.amb471 && (
        <div className="amb471" aria-hidden="true" data-k={H.amb471.k}>
          {H.amb471.items.map(([cls, s], i) => (
            <i key={i} className={cls} style={s} />
          ))}
        </div>
      )}
      {/* attack effects canvas: drawn and placed by the engine (028, fxPrep) */}
      {H.fxc && <canvas className="fxc" aria-hidden="true" />}
      {H.skyBanner && <SkyBanner b={H.skyBanner} />}
      {H.tbn && (
        <div
          key={H.tbn.n}
          className={'tbn' + (H.tbn.en ? ' en' : '')}
          style={H.tbn.fast ? { animationDuration: '.8s' } : undefined}
        >
          <b>{H.tbn.txt}</b>
          <span>{H.tbn.sub}</span>
        </div>
      )}
      {H.fade && (
        <div
          key={H.fade.n}
          className={'fondu477' + (H.fade.va ? ' va' : '')}
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
    <div id="ciel430" className="ciel430" aria-live="polite">
      <span className="ci430" style={{ '--c': c.co }} title={c.ti}>
        <svg>
          <use href={'#' + c.ic} />
        </svg>
      </span>
      {c.w && (
        <span className="ci430" style={{ '--c': c.w[1] }} title={c.w[2]}>
          <svg>
            <use href={'#' + c.w[0]} />
          </svg>
        </span>
      )}
      <b>{c.displayName}</b>
      {c.vent && (
        <span className="ci430 v" style={{ '--c': '#cfe6ff' }} title="Vent">
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
    <div id="cielBan430" className={'cielban430' + (b.on ? ' on' : '')}>
      <span className="cb430-ic" style={{ '--c': b.ic[1] }}>
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
