import { Html } from '../../lib/html.jsx';
import Marks from './Marks.jsx';
import { regionMap } from './MapScreen.jsx';
import { TOD } from '../../engine/world/home-route.js';
import { V4 } from '../../engine/ui/screen-state.js';
import { CHAIN, MAP_SVG, PL, curvePath, placeState } from '../../engine/world/map.js';
import { JCHAIN, JMAP_SVG } from '../../engine/world/johto.js';
import { todayWeather } from '../../engine/world/pokegear.js';
import { HCHAIN, HMAP_SVG } from '../../engine/world/hoenn.js';
import { LIVING_MAP } from '../../engine/world/living-map.js';

// Map stage (#mapSt): the three drawn maps, the painting and its layers (v4.71),
// the routes (#mapRoutes), the fog, the markers (#mapMarks), the compass and the title.
export default function Stage({ drawn, marksSel }) {
  const rg = regionMap();
  const Pt = drawn && LIVING_MAP ? LIVING_MAP.PAINT[rg] : null;
  const ok = !!(Pt && Pt.state === 'ok');
  let wx;
  if (drawn) {
    try {
      wx = todayWeather() || '';
    } catch (e) {
      wx = '';
    }
  }
  return (
    <div
      className={'map-stage' + (ok ? ' has-painting' : '')}
      id="mapSt"
      data-reg={drawn ? rg : undefined}
      data-tod={drawn ? TOD : undefined}
      data-wx={wx}
    >
      <Html html={MAP_SVG} />
      <Html html={JMAP_SVG} />
      <Html html={HMAP_SVG} />
      {drawn && (
        // region painting: one image per region (the "in" class makes it appear on load)
        <img
          key={ok ? rg : ''}
          className="map-region-art"
          alt=""
          aria-hidden="true"
          decoding="async"
          draggable={false}
          data-r={ok ? rg : undefined}
          src={ok ? Pt.url : undefined}
          onLoad={e => e.currentTarget.classList.add('is-loaded')}
        />
      )}
      {drawn && (
        <div className="map-fx-wrap" aria-hidden="true">
          <div className="map-fx-svg">{ok && <Html html={LIVING_MAP.fxSvg(Pt)} />}</div>
          <div className="map-fx-anim">{ok && <Html html={LIVING_MAP.fxHtml(Pt)} />}</div>
          <div className="map-fx-tint is-morning" />
          <div className="map-fx-tint is-night" />
          <div className="map-fx-wx" />
        </div>
      )}
      <div id="mapRoutes">{drawn && <Routes />}</div>
      {drawn && LIVING_MAP && (
        <div className="map-fog" aria-hidden="true">
          <Html html={LIVING_MAP.fogSvg(rg)} />
        </div>
      )}
      <div className="map-marks" id="mapMarks">
        {drawn && <Marks marksSel={marksSel} />}
      </div>
      <svg className="map-compass" aria-hidden="true">
        <use href="#i-compass" />
      </svg>
      <span className="map-title">
        <Title drawn={drawn} rg={rg} />
      </span>
    </div>
  );
}

function Title({ drawn, rg }) {
  if (!drawn) {
    return 'Région de la Résonance';
  }
  const R = LIVING_MAP && LIVING_MAP.REG[rg];
  if (R) {
    return (
      <>
        <b>{R.title}</b>
        <small>{R.sub}</small>
      </>
    );
  }
  return rg === 'hoenn' ? 'Hoenn' : rg === 'johto' ? 'Johto' : 'Kanto · Région de la Résonance';
}

// Routes between places (main path, then branches).
function Routes() {
  const J = V4.region === 'johto', // v4.15: two regions
    H = V4.region === 'hoenn'; // v4.19: three
  const pts = (H ? HCHAIN : J ? JCHAIN : CHAIN).map(id => PL[id]);
  const side = H
    ? []
    : J
      ? [['j7', 'jlac']]
      : [
          ['a1', 'gue'],
          ['a1', 'roche'],
          ['a3', 'tour'],
          ['a8', 'ligue'],
          ['a4', 'safari'],
        ];
  return (
    <svg className="map-routes" viewBox="0 0 1000 640" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <g fill="none" strokeLinecap="round">
        {pts.slice(1).map((b, i) => (
          <path
            d={curvePath(pts[i], b, i)}
            className={'map-route' + (placeState(b) === 'lock' ? ' is-locked' : '')}
            key={'c' + i}
          />
        ))}
        {side.map(([a, b], i) => (
          <path
            d={curvePath(PL[a], PL[b], i + 1)}
            className={'map-route is-branch' + (placeState(PL[b]) === 'lock' ? ' is-locked' : '')}
            key={'s' + i}
          />
        ))}
      </g>
    </svg>
  );
}
