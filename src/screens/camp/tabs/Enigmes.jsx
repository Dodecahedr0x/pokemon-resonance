import { BY } from '../../../engine/009-03-pokemon.js';
import { medal } from '../../../engine/014-08-outils.js';
import { today } from '../../../engine/032-v4-00-socle.js';
import { ENIGMES431, enigDuJour431, enigEtat431 } from '../../../engine/066-v4-31-01-defis-tactiques.js';
import { Html } from '../../../lib/html.jsx';

function Etoiles({ n }) {
  return <span className="eg431-st" aria-label={`${n} étoile${n > 1 ? 's' : ''} sur 3`}>{'★'.repeat(n) + '☆'.repeat(3 - n)}</span>;
}

// Camp › Énigmes (v4.31) : les 3 énigmes du jour, puis toutes les énigmes (data-enig431).
export default function Enigmes() {
  const E = enigEtat431(),
    jour = enigDuJour431(),
    et = i => <Etoiles n={E.s[String(i)] || 0} />,
    total = Object.values(E.s).reduce((a, b) => a + b, 0),
    fait = jd => E.j === today() && (E.jd || []).includes(jd);
  return (
    <section className="v4-panel eg431">
      <header className="v4-ph"><svg><use href="#i-quest" /></svg><b>Énigmes tactiques</b><span className="v4-cnt">{`${total} / ${ENIGMES431.length * 3} ★`}</span></header>
      <p className="v4-ps-n">Positions figées, PV au plus juste : mettez tous les adversaires K.O. <b>en une seule manche</b>. Ils ne jouent pas, tout se décide pendant votre tour. ★ réussie · ★★ sans dépenser de Voix ou du premier coup · ★★★ les deux.</p>
      <h3 className="eg431-h">Énigmes du jour <em>+3 Éclats chacune</em></h3>
      <div className="eg431-j">
        {jour.map(i => {
          const P = ENIGMES431[i];
          return (
            <button key={i} type="button" className={`eg431-c${fait(i) ? ' ok' : ''}`} data-enig431={i}>
              <span className="eg431-n">{`n° ${i + 1}`}</span>
              <span className="eg431-m">{P[2].map((f, j) => <Html key={j} html={medal(BY[f[0]].t, 'xs')} />)}</span>
              <em>{P[1].map(a => BY[a[0]].n).join(' · ')}</em>
              {et(i)}
            </button>
          );
        })}
      </div>
      <h3 className="eg431-h">Toutes les énigmes</h3>
      <div className="eg431-g">
        {ENIGMES431.map((x, i) => (
          <button key={i} type="button" className={`eg431-b${E.s[String(i)] ? ' ok' : ''}`} data-enig431={i} aria-label={`Énigme ${i + 1}`}><b>{i + 1}</b>{et(i)}</button>
        ))}
      </div>
    </section>
  );
}
