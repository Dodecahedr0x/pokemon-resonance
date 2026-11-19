import { useEngineReady } from '../../engineReady.js';
import { useQuestsVersion } from './questsStore.js';
import { Html } from '../../lib/html.jsx';
import { GYMS } from '../../engine/004-data.js';
import { PROFILE } from '../../engine/011-game-state.js';
import { BADGES } from '../../engine/013-gyms.js';
import { badgeSvg } from '../../engine/019-league.js';
import { V4, trophies } from '../../engine/032-v4-foundation.js';
import { SQ } from '../../engine/039-quests-shop.js';
import MainQuest from './MainQuest.jsx';
import SideQuests from './SideQuests.jsx';
import Event from './Event.jsx';
import Legends from './Legends.jsx';
import Journal from './Journal.jsx';
import Achievements from './Achievements.jsx';

const NL = '\n ';

// Content of the chosen tab (V4.qTab); any other value shows the Event tab.
function Tab() {
  if (V4.questTab === 'main') return <MainQuest />;
  if (V4.questTab === 'side') return <SideQuests />;
  if (V4.questTab === 'succes') return <Achievements />; // achievements and titles (v4.9)
  if (V4.questTab === 'leg') return <Legends />; // v4.29
  if (V4.questTab === 'journal') return <Journal />; // v4.30
  return <Event />;
}

function Content() {
  const ready = SQ.filter(q => !PROFILE.qc[q.id] && q.v() >= q.n).length;
  const tabs = [
    ['main', 'Principale'],
    ['side', <>Secondaires{ready ? <> <i className="v4-dot">{ready}</i></> : null}</>],
    ['event', 'Événement'],
    ['leg', 'Légendes'], // legendary quests (v4.29)
    ['journal', 'Journal'], // tactical journal (v4.30)
    ['succes', 'Succès'] // v4.9
  ];
  return (
    <>
      <div className="ph v4-ph-page"><p className="kick">Aventure</p><h1 className="h1" id="h-quetes">Quêtes</h1><p className="sub">Suivez les chapitres, relevez les défis et réclamez vos récompenses.</p></div>
      {NL}
      <div className="v4-trophy v4-panel">
        <div className="v4-tr-b">
          {GYMS.map((g, i) => (
            <span key={i} className={'v4-tbg' + (BADGES.includes(i) ? ' on' : '')} title={`Badge ${g.t}`}><Html html={badgeSvg(i, g.t, 'qt' + i)} /></span>
          ))}
        </div>
        <div className="v4-tr-k">
          <div><b>{trophies()}</b><span>Trophées / 31</span></div>
          <div><b>{SQ.filter(q => PROFILE.qc[q.id]).length}</b><span>Secondaires / {SQ.length}</span></div>
          <div><b>{PROFILE.wins}</b><span>Victoires</span></div>
        </div>
      </div>
      {NL}
      <div className="v4-tabs" role="tablist">
        {tabs.map(([k, n]) => (
          <button key={k} type="button" role="tab" data-qtab={k} aria-selected={V4.questTab === k}>{n}</button>
        ))}
      </div>
      {NL}
      <div className="v4-qlist"><Tab /></div>
    </>
  );
}

// Quests page (#quetes). Nothing is rendered before the engine's first renderQuests(); each
// renderQuests() rebuilds the content (delegated handlers in the engine: data-qtab,
// data-claim, data-v4fight, data-titre…).
export default function Quests() {
  const ready = useEngineReady();
  const version = useQuestsVersion();
  return (
    <section className="page v4p" id="quetes" aria-labelledby="h-quetes">
      {ready && version > 0 && <Content key={version} />}
    </section>
  );
}
