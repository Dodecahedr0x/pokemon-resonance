import { useMap } from './mapStore.js';
import Stage from './Stage.jsx';
import MapInfo from './MapInfo.jsx';
import MapList from './MapList.jsx';
import EvBar from './EvBar.jsx';
import Captures from './Captures.jsx';
import Route from '../home/Route.jsx';
import { V4 } from '../../engine/032-v4-foundation.js';
import { routeName } from '../../engine/054-johto.js';

const REGIONS = [
  ['kanto', 'Kanto'],
  ['johto', 'Johto'],
  ['hoenn', 'Hoenn']
];

export const regionMap = () => (V4.region === 'hoenn' ? 'hoenn' : V4.region === 'johto' ? 'johto' : 'kanto');

// "Map" page (#carte). Nothing before buildMap() (engine startup); content that depends
// on the game (routes, markers, panels…) after the first renderMap(), like the old DOM.
// Clicks are still handled by the engine (data-place, data-reg, data-mf430, data-v4fight…).
// Still set by the engine on elements rendered here:
// - hidden on the .mf430 arrows (arrows430, based on the scroll of #mapSc);
// - data-tod of #mapSt when the time changes (setTod, same value as the one rendered).
export default function MapScreen() {
  const { built, drawn, marksSel } = useMap();
  return (
    <section className="page v4p" id="carte" aria-labelledby="h-carte">
      {built && <Content drawn={drawn} marksSel={marksSel} />}
    </section>
  );
}

function Content({ drawn, marksSel }) {
  const rg = drawn ? regionMap() : 'kanto';
  return (
    <>
      <div className="ph v4-ph-page">
        <p className="kick">Explorer</p>
        <h1 className="h1" id="h-carte">Carte de la région</h1>
        <p className="sub">Touchez un lieu pour voir son défi, puis préparez le combat.</p>
        <div className="v4-reg" role="tablist" aria-label="Région">
          {REGIONS.map(([k, n]) => (
            <button type="button" role="tab" data-reg={k} aria-selected={rg === k} key={k}>{n}</button>
          ))}
        </div>
      </div>
      {'\n '}
      <div className="v4-map-wrap">
        <div className="v4-map v4-panel">
          <div className="v4-map-sc" id="mapSc"><Stage drawn={drawn} marksSel={marksSel} /></div>
          {drawn && (
            <>
              <button type="button" className="mf430 g" data-mf430="-1" aria-label="Voir l’ouest de la carte"><svg><use href="#i-chevl" /></svg></button>
              <button type="button" className="mf430 d" data-mf430="1" aria-label="Voir l’est de la carte"><svg><use href="#i-chevr" /></svg></button>
            </>
          )}
        </div>
        {'\n '}
        <aside className="v4-map-side">
          {drawn && <EvBar />}
          <div className="v4-panel v4-mapinfo" id="mapInfo" aria-live="polite">{drawn && <MapInfo />}</div>
          <div className="v4-panel v4-maplist" id="mapList">{drawn && <MapList />}</div>
        </aside>
      </div>
      {'\n '}
      <section className="v4-wild">
        <header className="v4-sec-h"><svg><use href="#i-grass" /></svg><b>{drawn ? `${routeName()} · hautes herbes` : 'Route 29 · hautes herbes'}</b><span>Touchez « ! » quand l’herbe bouge</span></header>
        <div className="v4-route-slot"><Route /></div>
        {drawn && <Captures />}
      </section>
    </>
  );
}
