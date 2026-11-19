import { useEngineReady } from '../../engineReady.js';
import { DEXS, dexBuilt } from '../../engine/038-pokedex.js';
import { useDexVersion } from './dexStore.js';
import DexCard from './DexCard.jsx';
import { DexCount, DexList } from './DexList.jsx';
import Missions from './Missions.jsx';

// Page « Pokédex » (#dex, v4). Vide jusqu'au premier affichage (renderDex du moteur),
// puis redessinée à chaque renderDex / renderDexCard / renderDexList.
// La recherche, la région et le tri sont des champs non contrôlés : le moteur les écoute
// (écouteurs délégués input / change) et relit V4.dexQ, V4.dexGen, V4.dexSort.
export default function Pokedex() {
  const ready = useEngineReady();
  useDexVersion();
  return (
    <section className="page v4p" id="dex" aria-labelledby="h-dex">
      {ready && dexBuilt && (
        <>
          <div className="ph v4-ph-page">
            <p className="kick">Kanto, Johto et Hoenn</p>
            <h1 className="h1" id="h-dex4">
              Pokédex
            </h1>
            <p className="sub">{`Les ${DEXS.length} Pokémon du jeu, leurs mesures, leur rôle et leurs capacités.`}</p>
          </div>
          {'\n '}
          <Missions />
          <div className="v4-dexbar v4-panel">
            <label className="v4-srch">
              <svg viewBox="0 0 20 20" aria-hidden="true">
                <circle cx="9" cy="9" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.7" />
                <path d="m13.2 13.2 3.6 3.6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              </svg>
              <input id="dex4Q" type="search" placeholder="Nom, numéro ou type" autoComplete="off" aria-label="Rechercher dans le Pokédex" />
            </label>
            {'\n  '}
            <select id="dex4Gen" aria-label="Région">
              <option value="all">Toutes les régions</option>
              <option value="1">Kanto</option>
              <option value="2">Johto</option>
              <option value="3">Hoenn</option>
            </select>
            {'\n  '}
            <select id="dex4Sort" aria-label="Tri">
              <option value="no">Par numéro</option>
              <option value="nom">Par nom</option>
              <option value="type">Par type</option>
            </select>
            {'\n  '}
            <DexCount />
          </div>
          {'\n '}
          <div className="v4-dex">
            <DexCard />
            <DexList />
          </div>
        </>
      )}
    </section>
  );
}
