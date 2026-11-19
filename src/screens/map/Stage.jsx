import { Html } from '../../lib/html.jsx';
import Marks from './Marks.jsx';
import { regionMap } from './MapScreen.jsx';
import { TOD } from '../../engine/017-home-route.js';
import { V4 } from '../../engine/032-v4-foundation.js';
import { CHAIN, MAP_SVG, PL, curvePath, placeState } from '../../engine/037-map.js';
import { JCHAIN, JMAP_SVG } from '../../engine/054-johto.js';
import { weatherDay417 } from '../../engine/057-companions-resonance.js';
import { HCHAIN, HMAP_SVG } from '../../engine/059-hoenn.js';
import { MAP471 } from '../../engine/105-living-map.js';

// Map stage (#mapSt): the three drawn maps, the painting and its layers (v4.71),
// the routes (#mapRoutes), the fog, the markers (#mapMarks), the compass and the title.
export default function Stage({ drawn, marksSel }) {
  const rg = regionMap();
  const Pt = drawn && MAP471 ? MAP471.PAINT[rg] : null;
  const ok = !!(Pt && Pt.state === 'ok');
  let wx;
  if (drawn) {
    try {
      wx = weatherDay417() || '';
    } catch (e) {
      wx = '';
    }
  }
  return (
    <div className={'v4-map-st' + (ok ? ' cv471on' : '')} id="mapSt" data-reg={drawn ? rg : undefined} data-tod={drawn ? TOD : undefined} data-wx={wx}>
      <Html html={MAP_SVG} />
      <Html html={JMAP_SVG} />
      <Html html={HMAP_SVG} />
      {drawn && (
        // region painting: one image per region (the "in" class makes it appear on load)
        <img
          key={ok ? rg : ''}
          className="map-paint471"
          alt=""
          aria-hidden="true"
          decoding="async"
          draggable={false}
          data-r={ok ? rg : undefined}
          src={ok ? Pt.url : undefined}
          onLoad={e => e.currentTarget.classList.add('in')}
        />
      )}
      {drawn && (
        <div className="fx471-wrap" aria-hidden="true">
          <div className="fx471-svg">{ok && <Html html={MAP471.fxSvg(Pt)} />}</div>
          <div className="fx471-anim">{ok && <Html html={MAP471.fxHtml(Pt)} />}</div>
          <div className="fx471-tint t-matin" />
          <div className="fx471-tint t-nuit" />
          <div className="fx471-wx" />
        </div>
      )}
      <div id="mapRoutes">{drawn && <Routes />}</div>
      {drawn && MAP471 && (
        <div className="fog471-wrap" aria-hidden="true">
          <Html html={MAP471.fogSvg(rg)} />
        </div>
      )}
      <div className="map-marks" id="mapMarks">{drawn && <Marks marksSel={marksSel} />}</div>
      <svg className="map-comp" aria-hidden="true"><use href="#i-compass" /></svg>
      <span className="map-title"><Title drawn={drawn} rg={rg} /></span>
    </div>
  );
}

function Title({ drawn, rg }) {
  if (!drawn) return 'Région de la Résonance';
  const R = MAP471 && MAP471.REG[rg];
  if (R)
    return (
      <>
        <b>{R.title}</b>
        <small>{R.sub}</small>
      </>
    );
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
        ['a4', 'safari']
      ];
  return (
    <svg className="map-routes" viewBox="0 0 1000 640" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <g fill="none" strokeLinecap="round">
        {pts.slice(1).map((b, i) => (
          <path d={curvePath(pts[i], b, i)} className={`rt ${placeState(b) === 'lock' ? 'lk' : 'ok'}`} key={'c' + i} />
        ))}
        {side.map(([a, b], i) => (
          <path d={curvePath(PL[a], PL[b], i + 1)} className={`rt side ${placeState(PL[b]) === 'lock' ? 'lk' : 'ok'}`} key={'s' + i} />
        ))}
      </g>
    </svg>
  );
}
