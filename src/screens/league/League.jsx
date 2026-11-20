import { useEngineReady } from '../../engineReady.js';
import { useLeagueVersion } from './leagueStore.js';
import { BADGES } from '../../engine/modes/gyms.js';
import Badges from './Badges.jsx';
import Arena from './Arena.jsx';
import EliteCell from './EliteCell.jsx';

import PageHeader from '../../components/PageHeader.jsx';
// "League" page (#ligue): badge case, chosen gym's sheet, Elite Four and Champion.
// Clicks are still handled by the engine (listeners on #badges, #arena, data-chal).
export default function League() {
  const ready = useEngineReady();
  const v = useLeagueVersion();
  // v > 0: renderLeague() has been called at least once ("League" startup step)
  const on = ready && v > 0;
  return (
    <section className="page" id="ligue" aria-labelledby="h-lg">
      <PageHeader
        kicker="Campagne · Arènes, Conseil 4, Champion"
        title="Huit badges, huit leçons"
        titleId="h-lg"
        lead="Les badges dans l’ordre, puis le Conseil 4 et le Champion. Touchez un badge pour lire la règle de son arène."
      />
      <div className="case">
        <div className="case-h">
          <span>Boîte à badges</span>
          <span id="caseCount">{on ? `${BADGES.length} / 8 badges` : '8 Arènes'}</span>
        </div>
        <div className="badges" id="badges">
          {on && <Badges key={v} />}
        </div>
        <div className="arena" id="arena">
          {on && <Arena key={v} />}
        </div>
      </div>
      <div className="case elite-case" id="eliteCase">
        {on && <EliteCell key={v} />}
      </div>
    </section>
  );
}
