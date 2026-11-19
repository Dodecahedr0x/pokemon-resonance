import { Fragment } from 'react';
import { Html } from '../../lib/html.jsx';
import { V4 } from '../../engine/032-v4-foundation.js';
import { STATE_N, placeIcon, placeName, placeState, placeSub } from '../../engine/037-map.js';
import { placesR } from '../../engine/054-johto.js';

const G = [
  ['aventure', 'Aventure'],
  ['route', 'Hautes herbes'],
  ['entrainement', 'Entraînement'],
];

// List of the region's locations (#mapList), by group.
export default function MapList() {
  const P = placesR();
  return (
    <>
      <header className="v4-ph">
        <svg>
          <use href="#i-map" />
        </svg>
        <b>Lieux</b>
        <span className="v4-cnt">{`${P.filter(p => placeState(p) === 'done').length} / ${P.length - 1}`}</span>
      </header>
      {G.map(([g, n]) => (
        <Fragment key={g}>
          <p className="v4-lg">{n}</p>
          {P.filter(p => p.grp === g).map(p => {
            const st = placeState(p);
            return (
              <button
                type="button"
                className={'v4-pl' + (V4.mapSel === p.id ? ' on' : '')}
                data-place={p.id}
                key={p.id}
              >
                <Html html={placeIcon(p)} />
                <span>
                  <b>
                    <Html html={placeName(p)} />
                  </b>
                  <em>
                    <Html html={placeSub(p)} />
                  </em>
                </span>
                <em className={`v4-pill s-${st}`}>
                  {st === 'lock' && (
                    <svg>
                      <use href="#i-lock" />
                    </svg>
                  )}
                  {STATE_N[st]}
                </em>
              </button>
            );
          })}
        </Fragment>
      ))}
    </>
  );
}
