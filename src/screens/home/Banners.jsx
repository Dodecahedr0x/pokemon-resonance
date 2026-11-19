import { Html } from '../../lib/html.jsx';
import { medal, tc } from '../../engine/014-utils.js';
import { dailyGiftData } from '../../engine/088-workshop-recipes.js';
import { seasonBannerData } from '../../engine/096-seasonal-events.js';
import { bossRushData } from '../../engine/097-boss-rush-relics.js';
import { defenseBannerText } from '../../engine/099-defense-gym.js';

// Banners under the hero, in the old DOM's order (each was inserted right after
// the hero or after the previous one): season (v4.65), Boss Rush (v4.66), Defense Gym
// (v4.68), Challenges (v4.71), More challenges (v4.71), daily gift (v4.57).
// Grouped in .activityBar (a grid of activities with the same design).
// Clicks (data-season-event, data-boss-rush, data-defense-gym, data-daily-challenges, data-x2470, data-dailygift) stay with the engine.
export default function Banners() {
  const sa = seasonBannerData(),
    br = bossRushData(),
    cd = dailyGiftData();
  return (
    <div className="activity-bar" role="group" aria-label="Activités">
      <button type="button" id="season-event" data-season-event="open" className="season-event">
        <span className="season-event-i" style={{ '--c': tc(sa.S0.t) }}>
          <Html html={medal([sa.S0.t], 'sm')} />
        </span>
        <span className="season-event-t">
          <b>{sa.S0.n}</b>
          <small>
            {sa.pts} / {sa.top} points de saison
          </small>
          <span className="cp-bar">
            <i style={{ width: `${sa.pc}%` }} />
          </span>
        </span>
      </button>
      <button type="button" id="boss-rush" data-boss-rush="open" className="boss-rush">
        <span className="boss-rush-i">{br.i}</span>
        <span className="boss-rush-t">
          <b>Boss Rush</b>
          <small>{br.txt}</small>
        </span>
      </button>
      <button type="button" id="defense-gym" data-defense-gym="open" className="defense-gym">
        <span className="defense-gym-i">5</span>
        <span className="defense-gym-t">
          <b>Arène de défense</b>
          <small>{defenseBannerText()}</small>
        </span>
      </button>
      <button type="button" id="daily-challenges" data-daily-challenges="open" className="defense-gym">
        <span className="defense-gym-i">★</span>
        <span className="defense-gym-t">
          <b>Défis du jour</b>
          <small>Quotidien · Laboratoire · Prestige</small>
        </span>
      </button>
      <button type="button" id="x2470" data-x2470="open" className="defense-gym">
        <span className="defense-gym-i">+</span>
        <span className="defense-gym-t">
          <b>Défis de dresseur</b>
          <small>Rivalité · Dresseur · Vitrine · Entraînement</small>
        </span>
      </button>
      <button type="button" id="dailygift" data-dailygift="1" className={'dailygift' + (cd.fait ? ' done' : '')}>
        <span className="dailygift-i">{cd.fait ? '✓' : '★'}</span>
        <span>
          <b>{cd.fait ? 'Cadeau du jour récupéré' : 'Cadeau du jour'}</b>
          <small>{cd.fait ? `Jour ${cd.j + 1} sur 7 · revenez demain` : `Jour ${cd.j + 1} sur 7 : ${cd.txt}`}</small>
        </span>
      </button>
    </div>
  );
}
