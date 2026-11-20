import { Html } from '../../lib/html.jsx';
import { GYMS } from '../../engine/data/game-data.js';
import { BADGES } from '../../engine/modes/gyms.js';
import { badgeSvg, gymSel } from '../../engine/modes/league.js';

// The eight badges (#badges): the chosen one is-selected, the won ones is-won.
export default function Badges() {
  return GYMS.map((g, i) => {
    const won = BADGES.includes(i);
    return (
      <button
        type="button"
        key={i}
        className={`league-badge${i === gymSel ? ' is-selected' : ''}${won ? ' is-won' : ''}`}
        data-g={i}
        aria-pressed={i === gymSel}
      >
        <Html html={badgeSvg(i, g.t, 'b' + i)} />
        <span>
          <Html html={g.t} />
        </span>
        <em>{won ? 'Obtenu' : 'Arène ' + (i + 1)}</em>
      </button>
    );
  });
}
