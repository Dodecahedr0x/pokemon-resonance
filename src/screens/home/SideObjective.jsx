import { Html } from '../../lib/html.jsx';
import { useEngineReady } from '../../engineReady.js';
import { useHomeVersion } from './homeStore.js';
import { typeColor } from '../../engine/core/utils.js';
import { squad } from '../../engine/team/team.js';
import { goalName, emblem, goalInfo } from '../../engine/world/home-journey.js';

// "Prochaine étape" (Next step) in the sidebar (#sideGoal, formerly renderSideGoal): mirrors
// the Home objective. The click (data-goal / data-go) is still handled by the engine.
export default function SideObjective() {
  const ready = useEngineReady(),
    v = useHomeVersion();
  return (
    <div className="side-goal" id="sideGoal">
      {(ready || v > 0) && <Content />}
    </div>
  );
}

function Content() {
  const g = goalInfo();
  return (
    <>
      <span className="sg-k">Prochaine étape</span>
      <button
        type="button"
        className="sg-b"
        data-goal={squad.length ? g.k : undefined}
        data-go={squad.length ? undefined : 'pokedex'}
        style={{ '--ac': g.type ? typeColor(g.type) : '#FFCB05' }}
      >
        <Html html={emblem(g.k, 'is-tiny')} />
        <span>
          <b>{g.k === 'tuto' ? 'Combat guidé' : g.k === 'champ' ? 'Finale' : goalName(g)}</b>
          <em>{squad.length ? (g.L ? g.L.n : 'Touchez pour y aller') : 'Choisir mon équipe'}</em>
        </span>
      </button>
    </>
  );
}
