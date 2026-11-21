import { Html } from '../../../lib/html.jsx';
import { battleLog } from '../../../engine/combat/ui.js';
import { useBattleVersion } from './battleStore.js';

// line kind given to log() (kept in the battle state) → class
const LINE_CLASS = { sys: 'is-system', arn: 'is-arena', evo: 'is-evolution' };

// Battle log, collapsed: the last line in the summary, the list on demand.
// The open/closed state of the <details> stays the player's (React does not touch it).
export default function Log() {
  const v = useBattleVersion('log');
  const L = v && battleLog ? battleLog : [];
  return (
    <details className="battle-log" id="bLogD">
      <summary>
        <span className="caption">Journal</span>
        <em id="bLogLast">{L.length ? L[0].s : ''}</em>
      </summary>
      <ol id="bLog">
        {L.map((x, i) => (
          <li key={i} className={LINE_CLASS[x.c] || x.c || undefined}>
            <span>{x.r}</span>
            <Html html={x.s} />
          </li>
        ))}
      </ol>
    </details>
  );
}
