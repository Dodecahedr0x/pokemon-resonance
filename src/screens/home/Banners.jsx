import { Html } from '../../lib/html.jsx';
import { medal, typeColor } from '../../engine/core/utils.js';
import { dailyGiftData } from '../../engine/items/workshop.js';
import { seasonBannerData } from '../../engine/modes/seasonal-events.js';
import { bossRushData } from '../../engine/modes/boss-rush.js';
import { defenseBannerText } from '../../engine/modes/defense-gym.js';

// Banners under the hero, in the old DOM's order (each was inserted right after
// the hero or after the previous one): season (v4.65), Boss Rush (v4.66), Defense Gym
// (v4.68), Challenges (v4.71), More challenges (v4.71), daily gift (v4.57).
// Grouped in .activity-bar (a grid of activities with the same design, home-activities.css).
// Clicks (data-season-event, data-boss-rush, data-defense-gym, data-daily-challenges, data-x2470, data-dailygift) stay with the engine.
export default function Banners() {
  const sa = seasonBannerData(),
    br = bossRushData(),
    cd = dailyGiftData();
  return (
    <div className="activity-bar" role="group" aria-label="Activités">
      <button type="button" id="season-event" data-season-event="open" className="activity activity-season">
        <span className="activity-medal" style={{ '--c': typeColor(sa.S0.t) }}>
          <Html html={medal([sa.S0.t], 'is-small')} />
        </span>
        <span className="activity-text">
          <b>{sa.S0.n}</b>
          <small>
            {sa.pts} / {sa.top} points de saison
          </small>
          <span className="progress-bar">
            <i style={{ width: `${sa.pc}%` }} />
          </span>
        </span>
      </button>
      <button type="button" id="boss-rush" data-boss-rush="open" className="activity activity-boss-rush">
        <span className="activity-badge">{br.i}</span>
        <span className="activity-text">
          <b>Boss Rush</b>
          <small>{br.txt}</small>
        </span>
      </button>
      <button type="button" id="defense-gym" data-defense-gym="open" className="activity activity-defense-gym">
        <span className="activity-badge">5</span>
        <span className="activity-text">
          <b>Arène de défense</b>
          <small>{defenseBannerText()}</small>
        </span>
      </button>
      <button
        type="button"
        id="daily-challenges"
        data-daily-challenges="open"
        className="activity activity-daily-challenges"
      >
        <span className="activity-badge">★</span>
        <span className="activity-text">
          <b>Défis du jour</b>
          <small>Quotidien · Laboratoire · Prestige</small>
        </span>
      </button>
      <button type="button" id="x2470" data-x2470="open" className="activity activity-trainer-challenges">
        <span className="activity-badge">+</span>
        <span className="activity-text">
          <b>Défis de dresseur</b>
          <small>Rivalité · Dresseur · Vitrine · Entraînement</small>
        </span>
      </button>
      <button
        type="button"
        id="dailygift"
        data-dailygift="1"
        className={'activity activity-daily-gift' + (cd.fait ? ' is-done' : '')}
      >
        <span className="activity-badge">{cd.fait ? '✓' : '★'}</span>
        <span className="activity-text">
          <b>{cd.fait ? 'Cadeau du jour récupéré' : 'Cadeau du jour'}</b>
          <small>{cd.fait ? `Jour ${cd.j + 1} sur 7 · revenez demain` : `Jour ${cd.j + 1} sur 7 : ${cd.txt}`}</small>
        </span>
      </button>
    </div>
  );
}
