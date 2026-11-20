import { useMap } from './mapStore.js';
import Stage from './Stage.jsx';
import MapInfo from './MapInfo.jsx';
import MapList from './MapList.jsx';
import EvBar from './EvBar.jsx';
import Captures from './Captures.jsx';
import Route from '../home/Route.jsx';
import { V4 } from '../../engine/ui/screen-state.js';
import { routeName } from '../../engine/world/johto.js';

import PageHeader from '../../components/PageHeader.jsx';
const REGIONS = [
  ['kanto', 'Kanto'],
  ['johto', 'Johto'],
  ['hoenn', 'Hoenn'],
];

export const regionMap = () => (V4.region === 'hoenn' ? 'hoenn' : V4.region === 'johto' ? 'johto' : 'kanto');

// "Map" page (#carte). Nothing before buildMap() (engine startup); content that depends
// on the game (routes, markers, panels…) after the first renderMap(), like the old DOM.
// Clicks are still handled by the engine (data-place, data-reg, data-map-scroll, data-v4fight…).
// Still set by the engine on elements rendered here:
// - hidden on the .mapScroll arrows (updateScrollArrows, based on the scroll of #mapSc);
// - data-tod of #mapSt when the time changes (setTod, same value as the one rendered).
export default function MapScreen() {
  const { built, drawn, marksSel } = useMap();
  return (
    <section className="page v4p map-screen" id="carte" aria-labelledby="h-carte">
      {built && <Content drawn={drawn} marksSel={marksSel} />}
    </section>
  );
}

function Content({ drawn, marksSel }) {
  const rg = drawn ? regionMap() : 'kanto';
  return (
    <>
      <PageHeader
        kicker="Explorer"
        title="Carte de la région"
        titleId="h-carte"
        lead="Touchez un lieu pour voir son défi, puis préparez le combat. Rivaux, Ligue et après-jeu sont dans « Tous les combats »."
        wide
      >
        <div className="map-head-row">
          <div className="map-regions" role="tablist" aria-label="Région">
            {REGIONS.map(([k, n]) => (
              <button type="button" role="tab" data-reg={k} aria-selected={rg === k} key={k}>
                {n}
              </button>
            ))}
          </div>
          <a className="button button-small button-primary map-all-fights" data-t="combat" href="#combat">
            <svg>
              <use href="#i-fight" />
            </svg>
            Tous les combats
          </a>
        </div>
      </PageHeader>
      {'\n '}
      <div className="map-layout">
        <div className="map-panel card">
          <div className="map-scroller" id="mapSc">
            <Stage drawn={drawn} marksSel={marksSel} />
          </div>
          {drawn && (
            <>
              <button
                type="button"
                className="map-scroll is-west"
                data-map-scroll="-1"
                aria-label="Voir l’ouest de la carte"
              >
                <svg>
                  <use href="#i-chevl" />
                </svg>
              </button>
              <button
                type="button"
                className="map-scroll is-east"
                data-map-scroll="1"
                aria-label="Voir l’est de la carte"
              >
                <svg>
                  <use href="#i-chevr" />
                </svg>
              </button>
            </>
          )}
        </div>
        {'\n '}
        <aside className="map-side">
          {drawn && <EvBar />}
          <div className="card map-info" id="mapInfo" aria-live="polite">
            {drawn && <MapInfo />}
          </div>
          <div className="card map-list" id="mapList">
            {drawn && <MapList />}
          </div>
        </aside>
      </div>
      {'\n '}
      <section className="v4-wild">
        <header className="v4-sec-h">
          <svg>
            <use href="#i-grass" />
          </svg>
          <b>{drawn ? `${routeName()} · hautes herbes` : 'Route 29 · hautes herbes'}</b>
          <span>Touchez « ! » quand l’herbe bouge</span>
        </header>
        <div className="v4-route-slot">
          <Route />
        </div>
        {drawn && <Captures />}
      </section>
    </>
  );
}
