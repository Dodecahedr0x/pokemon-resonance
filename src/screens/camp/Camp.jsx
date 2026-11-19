import { useEngineReady } from '../../engineReady.js';
import { V4 } from '../../engine/032-v4-foundation.js';
import { CAMP_TABS, echoRun } from '../../engine/066-tactical-challenges.js';
import { seenExits, useCampBase, useCampPage } from './campStore.js';
import CampBase from './CampBase.jsx';
import Outings from './Outings.jsx';
import Puzzles from './tabs/Puzzles.jsx';
import Echo from './tabs/Echo.jsx';
import Gyms from './tabs/Gyms.jsx';
import Mastery from './tabs/Mastery.jsx';
import Pantheon from './tabs/Pantheon.jsx';
import Duel from './tabs/Duel.jsx';

const TAB_LIST = { enigmes: Puzzles, echo: Echo, arenes: Gyms, pantheon: Pantheon, duel: Duel, maitrise: Mastery };

// Camp sub-tabs (v4.31): the bar, then the content of the open tab (except « Base »).
function Tabs({ t }) {
  const R = echoRun();
  return (
    <nav className="v4-tabs camp-tab" id="camp-tab-list" role="tablist" aria-label="Camp">
      {CAMP_TABS.map(([k, n]) => (
        <button key={k} type="button" role="tab" aria-selected={t === k} data-camp-tab={k}>
          {n + (k === 'echo' && R ? ' •' : '')}
        </button>
      ))}
    </nav>
  );
}

// #v4Camp alone is rebuilt on each renderCampBase(); the rest of the page is untouched.
function CampBaseHost() {
  const base = useCampBase();
  return <CampBase key={base} filled={base > 0} />;
}

// #campNews: before the first renderCampPage(), only the Base camp and the Outings (empty).
function Content({ page }) {
  const t = V4.campTab; // already validated by renderCampPage()
  const Tab = page > 0 && t !== 'base' ? TAB_LIST[t] : null;
  const cache = page > 0 ? t !== 'base' : undefined;
  return (
    <div className="camp-news" id="camp-news">
      {page > 0 && <Tabs t={t} />}
      <div id="camp-host" hidden={cache}>
        <CampBaseHost />
      </div>
      <section className="v4-panel outings-panel" id="outings-panel" aria-label="Sorties" hidden={cache}>
        {seenExits && <Outings />}
      </section>
      {page > 0 && <div id="camp-tab-body">{Tab && <Tab />}</div>}
    </div>
  );
}

// Camp page (#camp). Each renderCampPage() of the engine rebuilds it (uncontrolled fields,
// delegated handlers in the engine); renderCampBase() only rebuilds #v4Camp.
export default function Camp() {
  const ready = useEngineReady();
  const page = useCampPage();
  return (
    <section className="page v4p" id="camp" aria-labelledby="h-camp">
      {ready && (
        <>
          <div className="ph v4-ph-page">
            <p className="kick">Votre base</p>
            <h1 className="h1" id="h-camp">
              Camp
            </h1>
            <p className="sub">Bâtiments, expéditions, Pension et Potager. Les sorties du dresseur.</p>
          </div>
          <Content key={page} page={page} />
        </>
      )}
    </section>
  );
}
