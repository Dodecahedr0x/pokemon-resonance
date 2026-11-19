import { PROFILE } from '../../engine/011-game-state.js';
import { SQ } from '../../engine/039-quests-shop.js';
import Rewards from './Rewards.jsx';

// A side quest (formerly sideRow); "Réclamer" (Claim): data-claim, handled by the engine.
function Quest({ q }) {
  const v = Math.min(q.v(), q.n),
    done = v >= q.n,
    got = !!PROFILE.qc[q.id];
  return (
    <article className={'v4-qs' + (got ? ' got' : done ? ' ready' : '')}>
      <div className="v4-qs-t"><b>{q.t}</b><em>{q.d}</em><span className="v4-prog"><i style={{ width: `${(v / q.n) * 100}%` }} /></span><small>{v} / {q.n}</small></div>
      <div className="v4-qs-r">
        <div className="v4-rw"><Rewards r={q.r} /></div>
        {got ? (
          <span className="v4-pill s-done">Reçue</span>
        ) : (
          <button type="button" className={'b b-sm' + (done ? ' b-gold' : '')} data-claim={q.id} disabled={!done}>{done ? 'Réclamer' : 'En cours'}</button>
        )}
      </div>
    </article>
  );
}

export default function Secondary() {
  return SQ.map(q => <Quest key={q.id} q={q} />);
}
