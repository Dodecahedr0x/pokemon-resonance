import { GYMS } from '../../engine/004-01-donnees.js';
import { SCEN } from '../../engine/009-03-pokemon.js';
import { ARENAS } from '../../engine/013-07-arenes.js';
import { tc } from '../../engine/014-08-outils.js';
import { badgeSvg } from '../../engine/019-12-ligue.js';
import { ELITE } from '../../engine/022-15-systemes-objets-liens-ia.js';
import { CHAMP_L, CHAP, ELITE_L, LEAD, UNIV } from '../../engine/030-24-prestige-mise-en-scene.js';
import { Html } from '../../lib/html.jsx';

function Maitre({ className, style, mark, kicker, who }) {
  return (
    <article className={className} style={style}>
      {mark}
      <div><p className="uv-k">{kicker}</p><b>{who.n}</b><em>{who.t}</em><q><Html html={who.q} /></q></div>
    </article>
  );
}

// Onglet « Univers » : la Ligue, les maîtres d'arène, le Conseil 4 et les chapitres.
export default function Univers() {
  return (
    <>
      <div className="gd-intro"><h2 className="h2">L’univers de Résonance</h2><p className="d">Une Ligue, un règlement, des maîtres d’arène qui ont chacun leur façon de vous mettre à l’épreuve.</p></div>
      <div className="uv-lore">{UNIV.map(([h, t]) => <article key={h} className="uv-c"><h3 className="h3">{h}</h3><p><Html html={t} /></p></article>)}</div>
      <div className="sec-h uv-h"><div><p className="kick">Huit arènes</p><h2 className="h2">Les maîtres d’arène</h2></div></div>
      <div className="uv-cast">
        {GYMS.map((g, i) => (
          <Maitre key={i} className="uv-m" style={{ '--ac': tc(g.t) }} mark={<span className="uv-b"><Html html={badgeSvg(i, g.t, 'uv' + i)} /></span>} kicker={`Arène ${i + 1} · Badge ${g.t}`} who={LEAD[i]} />
        ))}
      </div>
      <div className="sec-h uv-h"><div><p className="kick">Le sommet</p><h2 className="h2">Le Conseil 4 et la Championne</h2></div></div>
      <div className="uv-cast">
        {ELITE_L.map((L, i) => (
          <Maitre key={i} className="uv-m el" style={{ '--ac': tc(SCEN[ELITE[i]].at || 'Normal') }} mark={<span className="uv-e">{i + 1}</span>} kicker={SCEN[ELITE[i]].n} who={L} />
        ))}
        <Maitre className="uv-m ch" mark={<span className="uv-e">★</span>} kicker="Ligue de la Résonance" who={CHAMP_L} />
      </div>
      <div className="sec-h uv-h"><div><p className="kick">Campagne</p><h2 className="h2">Les chapitres</h2></div></div>
      <ol className="uv-chap">
        {['tuto', ...ARENAS.map(a => a.k), 'c1', 'champ'].map(k => {
          const C = CHAP(k);
          return <li key={k}><span>{C.c}</span><b>{C.t}</b><em>{C.who}</em></li>;
        })}
      </ol>
    </>
  );
}
