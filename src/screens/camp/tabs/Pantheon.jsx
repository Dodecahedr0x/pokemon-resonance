import { BY } from '../../../engine/009-pokemon.js';
import { DIFFS, PROFILE } from '../../../engine/011-game-state.js';
import { ART } from '../../../engine/032-v4-foundation.js';

// Camp › Pantheon (v4.32): teams engraved after a Champion, a Master or the Echo guardian.
export default function Pantheon() {
  const L = PROFILE.panth432 || [];
  return (
    <section className="v4-panel pa432">
      <header className="v4-ph"><svg><use href="#i-trophy" /></svg><b>Panthéon</b><span className="v4-cnt">{L.length}</span></header>
      <p className="v4-ps-n">Chaque équipe qui bat un Champion ou un Maître, ou le gardien de l’Écho profond, est gravée ici.</p>
      <div className="pa432-l">
        {L.length ? (
          L.map((x, i) => (
            <article key={i} className="pa432-c">
              <div className="pa432-h">
                <b>{x.n}</b>
                <em>{`${x.d ? x.d.split('-').reverse().join('/') : ''} · ${DIFFS[x.df] || ''}${x.r ? ` · ${x.r} manche${x.r > 1 ? 's' : ''}` : ''}${x.rk ? ` · rang ${x.rk}` : ''}${x.md ? ' · ' + (x.md === 'campagne' ? 'Campagne' : 'Libre') : ''}`}</em>
              </div>
              <div className="pa432-t">
                {x.t.map((id, j) => <span key={j} className="pa432-m"><img src={ART(BY[id].no)} alt="" loading="lazy" /><em>{BY[id].n}</em></span>)}
              </div>
            </article>
          ))
        ) : (
          <p className="v4-empty">Le Panthéon attend sa première équipe : battez un Champion, un Maître ou le gardien de l’Écho profond.</p>
        )}
      </div>
    </section>
  );
}
