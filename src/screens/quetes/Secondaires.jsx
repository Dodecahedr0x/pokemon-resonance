import { PROFILE } from '../../engine/011-05-etat-de-partie.js';
import { SQ } from '../../engine/039-v4-07-quetes-boutique.js';
import Recompenses from './Recompenses.jsx';

// Une quête secondaire (ancien sideRow) ; « Réclamer » : data-claim, géré par le moteur.
function Quete({ q }) {
  const v = Math.min(q.v(), q.n),
    done = v >= q.n,
    got = !!PROFILE.qc[q.id];
  return (
    <article className={'v4-qs' + (got ? ' got' : done ? ' ready' : '')}>
      <div className="v4-qs-t"><b>{q.t}</b><em>{q.d}</em><span className="v4-prog"><i style={{ width: `${(v / q.n) * 100}%` }} /></span><small>{v} / {q.n}</small></div>
      <div className="v4-qs-r">
        <div className="v4-rw"><Recompenses r={q.r} /></div>
        {got ? (
          <span className="v4-pill s-done">Reçue</span>
        ) : (
          <button type="button" className={'b b-sm' + (done ? ' b-gold' : '')} data-claim={q.id} disabled={!done}>{done ? 'Réclamer' : 'En cours'}</button>
        )}
      </div>
    </article>
  );
}

export default function Secondaires() {
  return SQ.map(q => <Quete key={q.id} q={q} />);
}
