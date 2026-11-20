import { GYMS } from '../../engine/data/game-data.js';
import { SCEN } from '../../engine/pokemon/pokemon.js';
import { ARENAS } from '../../engine/modes/gyms.js';
import { tc } from '../../engine/core/utils.js';
import { badgeSvg } from '../../engine/modes/league.js';
import { ELITE } from '../../engine/combat/items-bonds-ai.js';
import { CHAMP_L, CHAP, ELITE_L, LEAD, UNIV } from '../../engine/progression/prestige.js';
import { Html } from '../../lib/html.jsx';

function Master({ className, style, mark, kicker, who }) {
  return (
    <article className={className} style={style}>
      {mark}
      <div>
        <p className="uv-k">{kicker}</p>
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
      <div className="gd-intro">
        <h2 className="section-title">L’univers de Résonance</h2>
        <p className="d">
          Une Ligue, un règlement, des maîtres d’arène qui ont chacun leur façon de vous mettre à l’épreuve.
        </p>
      </div>
      <div className="uv-lore">
        {UNIV.map(([h, t]) => (
          <article key={h} className="uv-c">
            <h3 className="card-title">{h}</h3>
            <p>
              <Html html={t} />
            </p>
          </article>
        ))}
      </div>
      <div className="section-header uv-h">
        <div>
          <p className="kicker">Huit arènes</p>
          <h2 className="section-title">Les maîtres d’arène</h2>
        </div>
      </div>
      <div className="uv-cast">
        {GYMS.map((g, i) => (
          <Master
            key={i}
            className="uv-m"
            style={{ '--ac': tc(g.t) }}
            mark={
              <span className="uv-b">
                <Html html={badgeSvg(i, g.t, 'uv' + i)} />
              </span>
            }
            kicker={`Arène ${i + 1} · Badge ${g.t}`}
            who={LEAD[i]}
          />
        ))}
      </div>
      <div className="section-header uv-h">
        <div>
          <p className="kicker">Le sommet</p>
          <h2 className="section-title">Le Conseil 4 et la Championne</h2>
        </div>
      </div>
      <div className="uv-cast">
        {ELITE_L.map((L, i) => (
          <Master
            key={i}
            className="uv-m el"
            style={{ '--ac': tc(SCEN[ELITE[i]].at || 'Normal') }}
            mark={<span className="uv-e">{i + 1}</span>}
            kicker={SCEN[ELITE[i]].n}
            who={L}
          />
        ))}
        <Master
          className="uv-m ch"
          mark={<span className="uv-e">★</span>}
          kicker="Ligue de la Résonance"
          who={CHAMP_L}
        />
      </div>
      <div className="section-header uv-h">
        <div>
          <p className="kicker">Campagne</p>
          <h2 className="section-title">Les chapitres</h2>
        </div>
      </div>
      <ol className="uv-chap">
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
