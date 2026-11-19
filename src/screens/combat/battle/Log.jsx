import { Html } from '../../../lib/html.jsx';
import { LOG } from '../../../engine/024-combat-ui.js';
import { useBattleVersion } from './battleStore.js';

// Journal du combat, replié : la dernière ligne dans le résumé, la liste à la demande.
// L'état ouvert/fermé du <details> reste celui du joueur (React n'y touche pas).
export default function Log() {
  const v = useBattleVersion('log');
  const L = v && LOG ? LOG : [];
  return (
    <details className="panel blog" id="bLogD">
      <summary>
        <span className="lbl-s">Journal</span>
        <em id="bLogLast">{L.length ? L[0].s : ''}</em>
      </summary>
      <ol id="bLog">
        {L.map((x, i) => (
          <li key={i} className={x.c}>
            <span>{x.r}</span>
            <Html html={x.s} />
          </li>
        ))}
      </ol>
    </details>
  );
}
