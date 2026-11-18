import { useEngineReady } from '../../engineReady.js';
import { V4 } from '../../engine/032-v4-00-socle.js';
import { CAMPT431, echoRun431 } from '../../engine/066-v4-31-01-defis-tactiques.js';
import { sortiesVues, useCampBase, useCampPage } from './campStore.js';
import CampBase from './CampBase.jsx';
import Sorties from './Sorties.jsx';
import Enigmes from './tabs/Enigmes.jsx';
import Echo from './tabs/Echo.jsx';
import Arenes from './tabs/Arenes.jsx';
import Maitrise from './tabs/Maitrise.jsx';
import Pantheon from './tabs/Pantheon.jsx';
import Duel from './tabs/Duel.jsx';

const ONGLETS = { enigmes: Enigmes, echo: Echo, arenes: Arenes, pantheon: Pantheon, duel: Duel, maitrise: Maitrise };

// Sous-onglets du Camp (v4.31) : la barre, puis le contenu de l'onglet ouvert (hors « Base »).
function Onglets({ t }) {
  const R = echoRun431();
  return (
    <nav className="v4-tabs ct431" id="campTabs431" role="tablist" aria-label="Camp">
      {CAMPT431.map(([k, n]) => (
        <button key={k} type="button" role="tab" aria-selected={t === k} data-ct431={k}>{n + (k === 'echo' && R ? ' •' : '')}</button>
      ))}
    </nav>
  );
}

// #v4Camp seul se reconstruit à chaque renderCampBase() ; le reste de la page n'est pas touché.
function CampBaseHote() {
  const base = useCampBase();
  return <CampBase key={base} rempli={base > 0} />;
}

// #camp430 : avant le premier renderCampPage431(), seulement le Camp de base et les Sorties (vides).
function Contenu({ page }) {
  const t = V4.campTab; // déjà validé par renderCampPage431()
  const Onglet = page > 0 && t !== 'base' ? ONGLETS[t] : null;
  const cache = page > 0 ? t !== 'base' : undefined;
  return (
    <div className="camp430" id="camp430">
      {page > 0 && <Onglets t={t} />}
      <div id="campHost430" hidden={cache}>
        <CampBaseHote />
      </div>
      <section className="v4-panel sort430" id="sort430" aria-label="Sorties" hidden={cache}>
        {sortiesVues && <Sorties />}
      </section>
      {page > 0 && <div id="campTab431">{Onglet && <Onglet />}</div>}
    </div>
  );
}

// Page Camp (#camp). Chaque renderCampPage431() du moteur la reconstruit (champs non contrôlés,
// gestionnaires délégués dans le moteur) ; renderCampBase() ne reconstruit que #v4Camp.
export default function Camp() {
  const ready = useEngineReady();
  const page = useCampPage();
  return (
    <section className="page v4p" id="camp" aria-labelledby="h-camp">
      {ready && (
        <>
          <div className="ph v4-ph-page"><p className="kick">Votre base</p><h1 className="h1" id="h-camp">Camp</h1><p className="sub">Bâtiments, expéditions, Pension et Potager. Les sorties du dresseur.</p></div>
          <Contenu key={page} page={page} />
        </>
      )}
    </section>
  );
}
