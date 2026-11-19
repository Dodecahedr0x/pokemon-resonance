import { BY } from '../../engine/009-03-pokemon.js';
import { PROFILE } from '../../engine/011-05-etat-de-partie.js';
import { tc } from '../../engine/014-08-outils.js';
import { ART } from '../../engine/032-v4-00-socle.js';
import { LEGS } from '../../engine/043-v4-4-01-aventure-plus.js';
import { hoennOuvert } from '../../engine/059-v4-19-01-hoenn.js';
import { etapesLeg429 } from '../../engine/064-v4-29-01-qualite.js';
import { HLEG435, etapes435, inBox435 } from '../../engine/071-v4-38-les-legendaires-de-hoenn.js';

// Carte d'une légende : étapes de sa quête, puis capture (data-v4fight lc… / hc…).
function Legende({ L, et, pris, fight, cond }) {
  const m = BY[L.id],
    pret = !pris && et.every(x => x.ok);
  return (
    <article className={'lq429-c v4-panel' + (pris ? ' pris' : pret ? ' pret' : '')} style={{ '--c': tc(m.t[0]) }}>
      <img src={ART(m.no)} alt="" loading="lazy" />
      <div className="lq429-t">
        <small>{L.title}</small><b>{m.n}</b>
        <ul>
          {et.map((x, i) => <li key={i} className={x.ok ? 'ok' : ''}>{x.ok ? '✓' : '○'} {x.t}</li>)}
          {cond !== undefined ? <li className="cond435">Condition de capture : {cond}</li> : null}
        </ul>
        {pris ? (
          <span className="lq429-ok">Dans votre Box ✓</span>
        ) : (
          <button type="button" className={`b b-sm ${pret ? 'b-gold' : 'b-ghost'}`} data-v4fight={fight} disabled={!pret}>{pret ? 'Tenter la capture' : 'Quête en cours'}</button>
        )}
      </div>
    </article>
  );
}

// Onglet « Légendes » (v4.29) ; les légendes de Hoenn suivent, seulement quand Hoenn est ouverte (v4.38).
export default function Legendes() {
  return (
    <>
      <p className="v4-note">Une légende vaincue peut être capturée une fois sa quête terminée. Elle rejoint votre Box et coûte 8 PC dans l’équipe.</p>
      <div className="lq429">
        {LEGS.map(L => <Legende key={L.id} L={L} et={etapesLeg429(L)} pris={PROFILE.box.includes(L.id)} fight={'lc' + L.id} />)}
      </div>
      {hoennOuvert() ? (
        <>
          <p className="v4-note">Légendes de Hoenn : vainquez-les d’abord (Combats › Après-jeu), puis remplissez leur quête. Chacune a une condition de capture propre.</p>
          <div className="lq429">
            {HLEG435.map(L => <Legende key={L.id} L={L} et={etapes435(L)} pris={inBox435(L.id)} fight={'hc' + L.id} cond={L.cap.t} />)}
          </div>
        </>
      ) : null}
    </>
  );
}
