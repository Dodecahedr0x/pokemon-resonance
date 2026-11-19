import { useEngineReady } from '../../engineReady.js';
import { useLeagueVersion } from './leagueStore.js';
import { BADGES } from '../../engine/013-gyms.js';
import Badges from './Badges.jsx';
import Arena from './Arena.jsx';
import EliteCell from './EliteCase.jsx';

// Page « Ligue » (#ligue) : boîte à badges, fiche de l'arène choisie, Conseil 4 et Champion.
// Les clics restent gérés par le moteur (écouteurs sur #badges, #arena, data-chal).
export default function League() {
  const ready = useEngineReady();
  const v = useLeagueVersion();
  // v > 0 : renderLigue() a été appelé au moins une fois (étape « Ligue » du démarrage)
  const on = ready && v > 0;
  return (
    <section className="page" id="ligue" aria-labelledby="h-lg">
      <div className="ph">
        <p className="kick">Campagne · Arènes, Conseil 4, Champion</p>
        <h1 className="h1" id="h-lg">Huit badges, huit leçons</h1>
        <p className="sub">Les badges dans l’ordre, puis le Conseil 4 et le Champion. Touchez un badge pour lire la règle de son arène.</p>
      </div>
      <div className="case">
        <div className="case-h"><span>Boîte à badges</span><span id="caseCount">{on ? `${BADGES.length} / 8 badges` : '8 Arènes'}</span></div>
        <div className="badges" id="badges">{on && <Badges key={v} />}</div>
        <div className="arena" id="arena">{on && <Arena key={v} />}</div>
      </div>
      <div className="case elite-case" id="eliteCase">{on && <EliteCell key={v} />}</div>
    </section>
  );
}
