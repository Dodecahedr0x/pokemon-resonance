import { Fragment } from 'react';
import { Html } from '../../lib/html.jsx';
import { V4 } from '../../engine/ui/screen-state.js';
import { STATE_N, placeIcon, placeName, placeState, placeSub } from '../../engine/world/map.js';
import { placesR } from '../../engine/world/johto.js';

import CardHeader from '../../components/CardHeader.jsx';
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
      <CardHeader
        icon="map"
        title="Lieux"
        count={`${P.filter(p => placeState(p) === 'done').length} / ${P.length - 1}`}
      />
      {G.map(([g, n]) => (
        <Fragment key={g}>
          <p className="map-list-group">{n}</p>
          {P.filter(p => p.grp === g).map(p => {
            const st = placeState(p);
            return (
              <button
                type="button"
                className={'map-place' + (V4.mapSel === p.id ? ' is-selected' : '')}
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
