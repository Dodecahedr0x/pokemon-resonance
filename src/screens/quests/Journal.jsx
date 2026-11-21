import { Html } from '../../lib/html.jsx';
import { POKEMON } from '../../engine/pokemon/pokemon.js';
import { PROFILE } from '../../engine/state/game-state.js';
import { medal } from '../../engine/core/utils.js';
import { formatNumber } from '../../engine/state/economy.js';
import { CATEGORY_NAMES, log0430 } from '../../engine/progression/tactical-journal.js';

const NL = '\n  ';
const Tile = ({ v, t }) => (
  <div className="stat-tile">
    <b>{v}</b>
    <span>{t}</span>
  </div>
);

// « Journal » tab (v4.30): statistics, battles by type, MVP, latest battles.
export default function Journal() {
  const J = PROFILE.tacticsJournal || log0430(),
    pct = (a, b) => (b ? Math.round((a / b) * 100) + ' %' : '—'),
    top = (m, n) =>
      Object.entries(m)
        .filter(([k]) => POKEMON[k])
        .sort((a, b) => b[1] - a[1])
        .slice(0, n);
  if (!J.n) {
    return <p className="empty-state">Jouez un combat : son rapport et vos statistiques apparaîtront ici.</p>;
  }
  const mvp = top(J.mvp, 5);
  return (
    <div className="journal">
      {NL}
      <div className="journal-tiles">
        <Tile v={J.n} t="Combats suivis" />
        <Tile v={pct(J.w, J.n)} t="Victoires" />
        <Tile v={J.runStreak} t="Série en cours" />
        <Tile v={J.best} t="Meilleure série" />
        <Tile v={formatNumber(J.dealt)} t="Dégâts infligés" />
        <Tile v={J.ko} t="K.O. infligés" />
      </div>
      {NL}
      <section className="card journal-section">
        <h3>Par type de combat</h3>
        {Object.entries(J.category)
          .sort((a, b) => b[1][0] + b[1][1] - (a[1][0] + a[1][1]))
          .map(([k, [w, l]]) => (
            <div key={k} className="journal-category">
              <span>{CATEGORY_NAMES[k] || k}</span>
              <span className="journal-category-bar">
                <i style={{ width: `${Math.round((w / Math.max(1, w + l)) * 100)}%` }} />
              </span>
              <b>
                {w} / {w + l}
              </b>
            </div>
          ))}
      </section>
      {NL}
      <section className="card journal-section">
        <h3>MVP les plus fréquents</h3>
        {mvp.length ? (
          mvp.map(([k, n]) => (
            <div key={k} className="journal-mvp">
              <Html html={medal(POKEMON[k].t, 'is-small')} />
              <span>{POKEMON[k].n}</span>
              <b>{n} × MVP</b>
              <em>{J.use[k] || 0} combats</em>
            </div>
          ))
        ) : (
          <p className="note">Pas encore de MVP.</p>
        )}
      </section>
      {NL}
      <section className="card journal-section">
        <h3>Derniers combats</h3>
        {J.last
          .slice()
          .reverse()
          .map((x, i) => (
            <div key={i} className={'journal-battle' + (x[1] ? ' is-won' : '')}>
              <span className="journal-battle-result">{x[1] ? 'V' : 'D'}</span>
              <span className="journal-battle-name">{x[0]}</span>
              <span>
                {x[2] ? 'Rang ' + x[2] + ' · ' : ''}
                {x[3]} manche{x[3] > 1 ? 's' : ''}
              </span>
              {x[4] && POKEMON[x[4]] ? <em>MVP {POKEMON[x[4]].n}</em> : null}
            </div>
          ))}
      </section>
    </div>
  );
}
