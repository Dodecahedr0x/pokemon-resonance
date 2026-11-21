import { useEngineReady } from '../../engineReady.js';
import { SCREEN_STATE } from '../../engine/ui/screen-state.js';
import { CAMP_TABS } from '../../engine/modes/camp-challenges.js';
import { echoRun } from '../../engine/modes/deep-echo.js';
import { useCampBase, useCampPage } from './campStore.js';
import CampBase from './CampBase.jsx';
import Puzzles from './tabs/Puzzles.jsx';
import Echo from './tabs/Echo.jsx';
import Gyms from './tabs/Gyms.jsx';
import Mastery from './tabs/Mastery.jsx';
import Pantheon from './tabs/Pantheon.jsx';
import Duel from './tabs/Duel.jsx';

import PageHeader from '../../components/PageHeader.jsx';
const TAB_LIST = { enigmes: Puzzles, echo: Echo, arenes: Gyms, pantheon: Pantheon, duel: Duel, maitrise: Mastery };

// Camp sub-tabs (v4.31): the bar, then the content of the open tab (except « Base »).
function Tabs({ t }) {
  const R = echoRun();
  return (
    <nav className="tabs page-tabs camp-tabs" id="camp-tab-list" role="tablist" aria-label="Camp">
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

// #campNews: before the first renderCampPage(), only the Base camp.
function Content({ page }) {
  const t = SCREEN_STATE.campTab; // already validated by renderCampPage()
  const Tab = page > 0 && t !== 'base' ? TAB_LIST[t] : null;
  const cache = page > 0 ? t !== 'base' : undefined;
  return (
    <div className="camp-content" id="camp-news">
      {page > 0 && <Tabs t={t} />}
      <div id="camp-host" hidden={cache}>
        <CampBaseHost />
      </div>
      {page > 0 && (
        <div className="camp-tab-body" id="camp-tab-body">
          {Tab && <Tab />}
        </div>
      )}
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
          <PageHeader
            kicker="Votre base"
            title="Camp"
            titleId="h-camp"
            lead="Bâtiments, expéditions, Pension et Potager."
          />
          <Content key={page} page={page} />
        </>
      )}
    </section>
  );
}
