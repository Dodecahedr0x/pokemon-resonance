import { Html } from '../../lib/html.jsx';
import { BY } from '../../engine/009-pokemon.js';
import { PROFILE } from '../../engine/011-game-state.js';
import { medal } from '../../engine/014-utils.js';
import { fmt } from '../../engine/032-v4-foundation.js';
import { CATN430, log0430 } from '../../engine/065-camp-tactics.js';

const NL = '\n  ';
const Tile = ({ v, t }) => <div className="jt430"><b>{v}</b><span>{t}</span></div>;

// Onglet « Journal » (v4.30) : statistiques, combats par type, MVP, derniers combats.
export default function Journal() {
  const J = PROFILE.journal430 || log0430(),
    pct = (a, b) => (b ? Math.round((a / b) * 100) + ' %' : '—'),
    top = (m, n) =>
      Object.entries(m)
        .filter(([k]) => BY[k])
        .sort((a, b) => b[1] - a[1])
        .slice(0, n);
  if (!J.n) return <p className="v4-empty">Jouez un combat : son rapport et vos statistiques apparaîtront ici.</p>;
  const mvp = top(J.mvp, 5);
  return (
    <div className="jr430">
      {NL}
      <div className="jt430-g">
        <Tile v={J.n} t="Combats suivis" />
        <Tile v={pct(J.w, J.n)} t="Victoires" />
        <Tile v={J.serie} t="Série en cours" />
        <Tile v={J.best} t="Meilleure série" />
        <Tile v={fmt(J.dealt)} t="Dégâts infligés" />
        <Tile v={J.ko} t="K.O. infligés" />
      </div>
      {NL}
      <section className="v4-panel jr430-s">
        <h3>Par type de combat</h3>
        {Object.entries(J.cat)
          .sort((a, b) => b[1][0] + b[1][1] - (a[1][0] + a[1][1]))
          .map(([k, [w, l]]) => (
            <div key={k} className="jc430"><span>{CATN430[k] || k}</span><span className="jc430-b"><i style={{ width: `${Math.round((w / Math.max(1, w + l)) * 100)}%` }} /></span><b>{w} / {w + l}</b></div>
          ))}
      </section>
      {NL}
      <section className="v4-panel jr430-s">
        <h3>MVP les plus fréquents</h3>
        {mvp.length ? (
          mvp.map(([k, n]) => (
            <div key={k} className="jm430"><Html html={medal(BY[k].t, 'sm')} /><span>{BY[k].n}</span><b>{n} × MVP</b><em>{J.use[k] || 0} combats</em></div>
          ))
        ) : (
          <p className="v4-note">Pas encore de MVP.</p>
        )}
      </section>
      {NL}
      <section className="v4-panel jr430-s">
        <h3>Derniers combats</h3>
        {J.last
          .slice()
          .reverse()
          .map((x, i) => (
            <div key={i} className={'jl430' + (x[1] ? ' w' : '')}>
              <span className="jl430-r">{x[1] ? 'V' : 'D'}</span>
              <span className="jl430-n">{x[0]}</span>
              <span>{x[2] ? 'Rang ' + x[2] + ' · ' : ''}{x[3]} manche{x[3] > 1 ? 's' : ''}</span>
              {x[4] && BY[x[4]] ? <em>MVP {BY[x[4]].n}</em> : null}
            </div>
          ))}
      </section>
    </div>
  );
}
