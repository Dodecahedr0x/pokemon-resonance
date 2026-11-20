import { BY } from '../../../engine/pokemon/pokemon.js';
import { DIFFS, PROFILE } from '../../../engine/state/game-state.js';
import { ART } from '../../../engine/assets/item-icons.js';

import CardHeader from '../../../components/CardHeader.jsx';
// Camp › Pantheon (v4.32): teams engraved after a Champion, a Master or the Echo guardian.
export default function Pantheon() {
  const L = PROFILE.pantheonlist || [];
  return (
    <section className="card pantheon-tab">
      <CardHeader icon="trophy" title="Panthéon" count={L.length} />
      <p className="v4-ps-n">
        Chaque équipe qui bat un Champion ou un Maître, ou le gardien de l’Écho profond, est gravée ici.
      </p>
      <div className="pantheon-tab-l">
        {L.length ? (
          L.map((x, i) => (
            <article key={i} className="pantheon-tab-c">
              <div className="pantheon-tab-h">
                <b>{x.n}</b>
                <em>{`${x.d ? x.d.split('-').reverse().join('/') : ''} · ${DIFFS[x.df] || ''}${x.r ? ` · ${x.r} manche${x.r > 1 ? 's' : ''}` : ''}${x.rk ? ` · rang ${x.rk}` : ''}${x.md ? ' · ' + (x.md === 'campagne' ? 'Campagne' : 'Libre') : ''}`}</em>
              </div>
              <div className="pantheon-tab-t">
                {x.t.map((id, j) => (
                  <span key={j} className="pantheon-tab-m">
                    <img src={ART(BY[id].no)} alt="" loading="lazy" />
                    <em>{BY[id].n}</em>
                  </span>
                ))}
              </div>
            </article>
          ))
        ) : (
          <p className="v4-empty">
            Le Panthéon attend sa première équipe : battez un Champion, un Maître ou le gardien de l’Écho profond.
          </p>
        )}
      </div>
    </section>
  );
}
