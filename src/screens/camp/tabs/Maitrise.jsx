import { BY } from '../../../engine/009-03-pokemon.js';
import { PROFILE } from '../../../engine/011-05-etat-de-partie.js';
import { medal } from '../../../engine/014-08-outils.js';
import { fmt } from '../../../engine/032-v4-00-socle.js';
import { MAIT431, MAIT_SEUIL431, maitChoix431 } from '../../../engine/066-v4-31-01-defis-tactiques.js';
import { Html } from '../../../lib/html.jsx';

// Une famille : progression, puis le choix entre deux maîtrises (data-mait431).
function Famille({ b, x }) {
  const m = BY[b],
    [c1, c2] = maitChoix431(b),
    pret = x.n >= MAIT_SEUIL431,
    bt = k => (
      <button type="button" className={`b b-sm${x.p === k ? ' b-gold' : ''}`} data-mait431={b} data-k={k} disabled={x.p === k}>{MAIT431[k][0]}<em>{MAIT431[k][1]}</em></button>
    );
  return (
    <article className={`mt431-r${x.p ? ' on' : ''}`}>
      <Html html={medal(m.t, 'sm')} />
      <div className="mt431-t">
        <b>{m.n}</b>
        <span className="mt431-b"><i style={{ width: `${Math.min(100, Math.round((x.n / MAIT_SEUIL431) * 100))}%` }} /></span>
        <em>{pret ? (x.p ? `${MAIT431[x.p][0]} : ${MAIT431[x.p][1]}` : 'Bonus à choisir') : `${x.n} / ${MAIT_SEUIL431} combats`}</em>
      </div>
      {pret ? <div className="mt431-c">{bt(c1)}{bt(c2)}</div> : null}
    </article>
  );
}

// Camp › Maîtrise (v4.31) : un bonus permanent par famille après assez de combats.
export default function Maitrise() {
  const M = PROFILE.mait431 || {},
    L = [...new Set(PROFILE.box.map(id => (BY[id] ? BY[id].base : null)).filter(Boolean))]
      .map(b => ({ b, x: M[b] || { n: 0, p: '' } }))
      .sort((a, c) => !!c.x.p - !!a.x.p || c.x.n - a.x.n);
  const prix = 500;
  return (
    <section className="v4-panel mt431">
      <header className="v4-ph"><svg><use href="#i-star" /></svg><b>Maîtrise des familles</b><span className="v4-cnt">{`${L.filter(y => y.x.p).length} / ${L.length}`}</span></header>
      <p className="v4-ps-n">{`Après ${MAIT_SEUIL431} combats dans l’équipe, une famille débloque un bonus permanent, à choisir entre deux. Vous pouvez en changer pour ${fmt(prix)} ₽.`}</p>
      <div className="mt431-l">
        {L.length ? L.map(({ b, x }) => <Famille key={b} b={b} x={x} />) : <p className="v4-empty">Votre Box est vide.</p>}
      </div>
    </section>
  );
}
