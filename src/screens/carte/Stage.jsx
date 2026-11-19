import { Html } from '../../lib/html.jsx';
import Marks from './Marks.jsx';
import { regionCarte } from './Carte.jsx';
import { TOD } from '../../engine/017-10-accueil-route.js';
import { V4 } from '../../engine/032-v4-00-socle.js';
import { CHAIN, MAP_SVG, PL, curvePath, placeState } from '../../engine/037-v4-05-carte.js';
import { JCHAIN, JMAP_SVG } from '../../engine/054-v4-15-01-johto.js';
import { meteoJour417 } from '../../engine/057-v4-17-01-compagnons-et-resonance.js';
import { HCHAIN, HMAP_SVG } from '../../engine/059-v4-19-01-hoenn.js';
import { CARTE471 } from '../../engine/105-v4-71-carte-vivante-refonte-profonde-de-la-carte.js';

// Plateau de la carte (#mapSt) : les trois cartes dessinées, la peinture et ses calques (v4.71),
// les tracés (#mapRoutes), le brouillard, les marqueurs (#mapMarks), la boussole et le titre.
export default function Stage({ drawn, marksSel }) {
  const rg = regionCarte();
  const Pt = drawn && CARTE471 ? CARTE471.PAINT[rg] : null;
  const ok = !!(Pt && Pt.state === 'ok');
  let wx;
  if (drawn) {
    try {
      wx = meteoJour417() || '';
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
        // peinture de la région : une image par région (la classe « in » la fait apparaître au chargement)
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
          <div className="fx471-svg">{ok && <Html html={CARTE471.fxSvg(Pt)} />}</div>
          <div className="fx471-anim">{ok && <Html html={CARTE471.fxHtml(Pt)} />}</div>
          <div className="fx471-tint t-matin" />
          <div className="fx471-tint t-nuit" />
          <div className="fx471-wx" />
        </div>
      )}
      <div id="mapRoutes">{drawn && <Routes />}</div>
      {drawn && CARTE471 && (
        <div className="fog471-wrap" aria-hidden="true">
          <Html html={CARTE471.fogSvg(rg)} />
        </div>
      )}
      <div className="map-marks" id="mapMarks">{drawn && <Marks marksSel={marksSel} />}</div>
      <svg className="map-comp" aria-hidden="true"><use href="#i-compass" /></svg>
      <span className="map-title"><Titre drawn={drawn} rg={rg} /></span>
    </div>
  );
}

function Titre({ drawn, rg }) {
  if (!drawn) return 'Région de la Résonance';
  const R = CARTE471 && CARTE471.REG[rg];
  if (R)
    return (
      <>
        <b>{R.title}</b>
        <small>{R.sub}</small>
      </>
    );
  return rg === 'hoenn' ? 'Hoenn' : rg === 'johto' ? 'Johto' : 'Kanto · Région de la Résonance';
}

// Tracés entre les lieux (chemin principal, puis embranchements).
function Routes() {
  const J = V4.region === 'johto', // v4.15 : deux régions
    H = V4.region === 'hoenn'; // v4.19 : trois
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
