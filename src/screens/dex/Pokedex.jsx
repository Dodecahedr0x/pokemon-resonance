import { useEngineReady } from '../../engineReady.js';
import { DEX_SPECIES, dexBuilt } from '../../engine/progression/pokedex.js';
import { useDexVersion } from './dexStore.js';
import DexCard from './DexCard.jsx';
import { DexCount, DexList } from './DexList.jsx';
import Missions from './Missions.jsx';

import PageHeader from '../../components/PageHeader.jsx';
// "Pokédex" page (#dex, v4). Empty until the first display (the engine's renderDex),
// then redrawn on every renderDex / renderDexCard / renderDexList.
// Search, region and sort are uncontrolled fields: the engine listens to them
// (delegated input / change listeners) and re-reads V4.dexQ, V4.dexGen, V4.dexSort.
export default function Pokedex() {
  const ready = useEngineReady();
  useDexVersion();
  return (
    <section className="page v4p" id="dex" aria-labelledby="h-dex">
      {ready && dexBuilt && (
        <>
          <PageHeader
            kicker="Kanto, Johto et Hoenn"
            title="Pokédex"
            titleId="h-dex4"
            lead={`Les ${DEX_SPECIES.length} Pokémon du jeu, leurs mesures, leur rôle et leurs capacités.`}
          />
          {'\n '}
          <Missions />
          <div className="dex-toolbar card">
            <label className="dex-search">
              <svg viewBox="0 0 20 20" aria-hidden="true">
                <circle cx="9" cy="9" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.7" />
                <path d="m13.2 13.2 3.6 3.6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              </svg>
              <input
                id="dex4Q"
                type="search"
                placeholder="Nom, numéro ou type"
                autoComplete="off"
                aria-label="Rechercher dans le Pokédex"
              />
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
          <div className="dex-layout">
            <DexCard />
            <DexList />
          </div>
        </>
      )}
    </section>
  );
}
