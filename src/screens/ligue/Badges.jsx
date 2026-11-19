import { Html } from '../../lib/html.jsx';
import { GYMS } from '../../engine/004-01-donnees.js';
import { BADGES } from '../../engine/013-07-arenes.js';
import { badgeSvg, gymSel } from '../../engine/019-12-ligue.js';

// Les huit badges (#badges) : le choisi est « on », les gagnés « won ».
export default function Badges() {
  return GYMS.map((g, i) => {
    const won = BADGES.includes(i);
    return (
      <button type="button" key={i} className={`bdg${i === gymSel ? ' on' : ''}${won ? ' won' : ''}`} data-g={i} aria-pressed={i === gymSel}>
        <Html html={badgeSvg(i, g.t, 'b' + i)} />
        <span><Html html={g.t} /></span>
        <em>{won ? 'Obtenu' : 'Arène ' + (i + 1)}</em>
      </button>
    );
  });
}
