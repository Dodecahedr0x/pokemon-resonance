import { useEngineReady } from '../../engineReady.js';
import { TYPES, ROLES } from '../../engine/004-01-donnees.js';
import { RECRUIT } from '../../engine/010-04-evolution-en-combat.js';
import { ROLEFX } from '../../engine/012-06-recrues-roles-synergies.js';
import { filt, gen, visible } from '../../engine/020-13-equipe-cartes.js';
import { useEquipeKey } from './equipeStore.js';
import { analyse } from './analyse.js';
import { Dock } from './Dock.jsx';
import DexCall from './DexCall.jsx';
import Grille from './Grille.jsx';
import Analyse from './Analyse.jsx';
import Tip from '../../components/Tip.jsx';

// Écran « Mon équipe » (#pokedex). La logique reste dans le moteur (020-13-equipe-cartes.js) :
// renderGrid, renderFilters, renderTeam incrémentent les versions de equipeStore.js.
// Les champs #dexQ, #dexType, #dexRole sont non contrôlés : le moteur les écoute et les relit,
// ils ne sont jamais remontés (le focus reste dans la recherche pendant la saisie).
export default function Equipe() {
  const ready = useEngineReady();
  const vGrid = useEquipeKey('grid'),
    vTeam = useEquipeKey('team');
  useEquipeKey('filters');
  const A = ready && vTeam ? analyse(vTeam) : null;
  const g = ready && gen ? gen : 'all';
  const v = ready && vGrid ? visible() : null;
  return (
    <section className="page" id="pokedex" aria-labelledby="h-dex">
      <div className="ph">
        <p className="kick">Kanto et Johto</p>
        <h1 className="h1" id="h-dex">
          Mon équipe
        </h1>
        <p className="sub">
          Choisissez 4 Pokémon avec 12 points de commandement (PC). Touchez « Recruter » sous une carte ; les premiers stades coûtent moins cher et
          évoluent en combat.
        </p>
      </div>
      <Tip t="pokedex" />
      <Dock A={A} />
      <div className="dexbar">
        <label className="srch">
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <circle cx={9} cy={9} r="5.5" fill="none" stroke="currentColor" strokeWidth="1.7" />
            <path d="m13.2 13.2 3.6 3.6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
          <input id="dexQ" type="search" placeholder="Pokémon ou capacité" autoComplete="off" aria-label="Rechercher un Pokémon ou une capacité" />
        </label>
        <div className="seg" id="genSeg" role="group" aria-label="Génération">
          {[
            ['all', 'Tous'],
            ['1', 'Kanto'],
            ['2', 'Johto'],
            ['3', 'Hoenn']
          ].map(([k, n]) => (
            <button key={k} type="button" data-gen={k} aria-pressed={g === k}>
              {n}
            </button>
          ))}
        </div>
        <select id="dexType" aria-label="Filtrer par type">
          {ready && (
            <>
              <option value="">Tous les types</option>
              {Object.keys(TYPES).map(t => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </>
          )}
        </select>
        {/* valeur posée par renderFilters (r.value = filt) */}
        <select id="dexRole" aria-label="Filtrer par rôle">
          {ready && (
            <>
              <option value="Tous">Tous les rôles</option>
              {ROLES.map(x => (
                <option key={x.n} value={x.n}>
                  {`${x.n} · ${ROLEFX[x.n].k}`}
                </option>
              ))}
            </>
          )}
        </select>
        <span className="cnt" id="dexCount">
          {v ? `${v.length} / ${RECRUIT.length} familles` : null}
        </span>
      </div>
      <div className="filters" id="filters" role="group" aria-label="Filtrer par rôle">
        {ready &&
          ['Tous', ...ROLES.map(r => r.n)].map(n => (
            <button key={n} type="button" className="b b-sm" data-f={n} aria-pressed={n === filt}>
              {n}
            </button>
          ))}
      </div>
      {ready && vGrid ? <DexCall v={vGrid} /> : null}
      <Grille v={v} />
      <Analyse A={A} />
    </section>
  );
}
