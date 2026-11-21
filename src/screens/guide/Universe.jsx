import { GYMS } from '../../engine/data/game-data.js';
import { SCEN } from '../../engine/pokemon/pokemon.js';
import { ARENAS } from '../../engine/modes/gyms.js';
import { typeColor } from '../../engine/core/utils.js';
import { badgeSvg } from '../../engine/modes/league.js';
import { ELITE } from '../../engine/combat/items-bonds-ai.js';
import { CHAMP_L, CHAP, ELITE_L, LEAD, UNIV } from '../../engine/progression/prestige.js';
import { Html } from '../../lib/html.jsx';

function Master({ className, style, mark, kicker, who }) {
  return (
    <article className={className} style={style}>
      {mark}
      <div>
        <p className="guide-master-kicker">{kicker}</p>
        <b>{who.n}</b>
        <em>{who.t}</em>
        <q>
          <Html html={who.q} />
        </q>
      </div>
    </article>
  );
}

// "Univers" (Universe) tab: the League, gym leaders, the Elite 4 and chapters.
export default function Universe() {
  return (
    <>
      <div className="guide-intro">
        <h2 className="section-title">L’univers de Résonance</h2>
        <p className="d">
          Une Ligue, un règlement, des maîtres d’arène qui ont chacun leur façon de vous mettre à l’épreuve.
        </p>
      </div>
      <div className="guide-lore">
        {UNIV.map(([h, t]) => (
          <article key={h} className="guide-lore-card">
            <h3 className="card-title">{h}</h3>
            <p>
              <Html html={t} />
            </p>
          </article>
        ))}
      </div>
      <div className="guide-section-header guide-cast-header">
        <div>
          <p className="kicker">Huit arènes</p>
          <h2 className="section-title">Les maîtres d’arène</h2>
        </div>
      </div>
      <div className="guide-cast">
        {GYMS.map((g, i) => (
          <Master
            key={i}
            className="guide-master"
            style={{ '--ac': typeColor(g.t) }}
            mark={
              <span className="guide-master-badge">
                <Html html={badgeSvg(i, g.t, 'uv' + i)} />
              </span>
            }
            kicker={`Arène ${i + 1} · Badge ${g.t}`}
            who={LEAD[i]}
          />
        ))}
      </div>
      <div className="guide-section-header guide-cast-header">
        <div>
          <p className="kicker">Le sommet</p>
          <h2 className="section-title">Le Conseil 4 et la Championne</h2>
        </div>
      </div>
      <div className="guide-cast">
        {ELITE_L.map((L, i) => (
          <Master
            key={i}
            className="guide-master is-elite"
            style={{ '--ac': typeColor(SCEN[ELITE[i]].at || 'Normal') }}
            mark={<span className="guide-master-mark">{i + 1}</span>}
            kicker={SCEN[ELITE[i]].n}
            who={L}
          />
        ))}
        <Master
          className="guide-master is-champion"
          mark={<span className="guide-master-mark">★</span>}
          kicker="Ligue de la Résonance"
          who={CHAMP_L}
        />
      </div>
      <div className="guide-section-header guide-cast-header">
        <div>
          <p className="kicker">Campagne</p>
          <h2 className="section-title">Les chapitres</h2>
        </div>
      </div>
      <ol className="guide-chapters">
        {['tuto', ...ARENAS.map(a => a.k), 'c1', 'champ'].map(k => {
          const C = CHAP(k);
          return (
            <li key={k}>
              <span>{C.c}</span>
              <b>{C.t}</b>
              <em>{C.who}</em>
            </li>
          );
        })}
      </ol>
    </>
  );
}
