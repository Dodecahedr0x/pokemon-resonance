import { PROFILE } from '../../engine/state/game-state.js';
import { SQ } from '../../engine/progression/quests-shop.js';
import Rewards from './Rewards.jsx';

import Button from '../../components/Button.jsx';
import StatePill from '../../components/StatePill.jsx';
// A side quest (formerly sideRow); "Réclamer" (Claim): data-claim, handled by the engine.
function Quest({ q }) {
  const v = Math.min(q.v(), q.n),
    done = v >= q.n,
    got = !!PROFILE.qc[q.id];
  return (
    <article className={'quests-side' + (got ? ' is-claimed' : done ? ' is-ready' : '')}>
      <div className="quests-side-text">
        <b>{q.t}</b>
        <em>{q.d}</em>
        <span className="quests-side-progress">
          <i style={{ width: `${(v / q.n) * 100}%` }} />
        </span>
        <small>
          {v} / {q.n}
        </small>
      </div>
      <div className="quests-side-actions">
        <div className="reward-list">
          <Rewards r={q.r} />
        </div>
        {got ? (
          <StatePill state="done">Reçue</StatePill>
        ) : (
          <Button size="small" variant={done ? 'primary' : undefined} data-claim={q.id} disabled={!done}>
            {done ? 'Réclamer' : 'En cours'}
          </Button>
        )}
      </div>
    </article>
  );
}

export default function SideQuests() {
  return SQ.map(q => <Quest key={q.id} q={q} />);
}
