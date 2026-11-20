import { Html } from '../../lib/html.jsx';
import { BY } from '../../engine/pokemon/pokemon.js';
import { PROFILE } from '../../engine/state/game-state.js';
import { medal } from '../../engine/core/utils.js';
import { fmt } from '../../engine/state/economy.js';
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
        .filter(([k]) => BY[k])
        .sort((a, b) => b[1] - a[1])
        .slice(0, n);
  if (!J.n) {
    return <p className="v4-empty">Jouez un combat : son rapport et vos statistiques apparaîtront ici.</p>;
  }
  const mvp = top(J.mvp, 5);
  return (
    <div className="journal-report">
      {NL}
      <div className="stat-tile-g">
        <Tile v={J.n} t="Combats suivis" />
        <Tile v={pct(J.w, J.n)} t="Victoires" />
        <Tile v={J.runStreak} t="Série en cours" />
        <Tile v={J.best} t="Meilleure série" />
        <Tile v={fmt(J.dealt)} t="Dégâts infligés" />
        <Tile v={J.ko} t="K.O. infligés" />
      </div>
      {NL}
      <section className="card journal-report-s">
        <h3>Par type de combat</h3>
        {Object.entries(J.category)
          .sort((a, b) => b[1][0] + b[1][1] - (a[1][0] + a[1][1]))
          .map(([k, [w, l]]) => (
            <div key={k} className="category-row">
              <span>{CATEGORY_NAMES[k] || k}</span>
              <span className="category-row-b">
                <i style={{ width: `${Math.round((w / Math.max(1, w + l)) * 100)}%` }} />
              </span>
              <b>
                {w} / {w + l}
              </b>
            </div>
          ))}
      </section>
      {NL}
      <section className="card journal-report-s">
        <h3>MVP les plus fréquents</h3>
        {mvp.length ? (
          mvp.map(([k, n]) => (
            <div key={k} className="mvp-row">
              <Html html={medal(BY[k].t, 'is-small')} />
              <span>{BY[k].n}</span>
              <b>{n} × MVP</b>
              <em>{J.use[k] || 0} combats</em>
            </div>
          ))
        ) : (
          <p className="v4-note">Pas encore de MVP.</p>
        )}
      </section>
      {NL}
      <section className="card journal-report-s">
        <h3>Derniers combats</h3>
        {J.last
          .slice()
          .reverse()
          .map((x, i) => (
            <div key={i} className={'last-fight' + (x[1] ? ' w' : '')}>
              <span className="last-fight-r">{x[1] ? 'V' : 'D'}</span>
              <span className="last-fight-n">{x[0]}</span>
              <span>
                {x[2] ? 'Rang ' + x[2] + ' · ' : ''}
                {x[3]} manche{x[3] > 1 ? 's' : ''}
              </span>
              {x[4] && BY[x[4]] ? <em>MVP {BY[x[4]].n}</em> : null}
            </div>
          ))}
      </section>
    </div>
  );
}
