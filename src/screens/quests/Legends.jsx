import { BY } from '../../engine/009-pokemon.js';
import { PROFILE } from '../../engine/011-game-state.js';
import { tc } from '../../engine/014-utils.js';
import { ART } from '../../engine/032-v4-foundation.js';
import { LEGS } from '../../engine/043-adventure-plus.js';
import { hoennOpen } from '../../engine/059-hoenn.js';
import { stepsLeg429 } from '../../engine/064-quality.js';
import { HLEG435, steps435, inBox435 } from '../../engine/071-hoenn-legendaries.js';

// Card of a legend: steps of its quest, then capture (data-v4fight lc… / hc…).
function Legend({ L, et, isTaken: takenSet, fight, condition: cond }) {
  const m = BY[L.id],
    isReady = !takenSet && et.every(x => x.ok);
  return (
    <article className={'lq429-c v4-panel' + (takenSet ? ' pris' : isReady ? ' pret' : '')} style={{ '--c': tc(m.t[0]) }}>
      <img src={ART(m.no)} alt="" loading="lazy" />
      <div className="lq429-t">
        <small>{L.title}</small><b>{m.n}</b>
        <ul>
          {et.map((x, i) => <li key={i} className={x.ok ? 'ok' : ''}>{x.ok ? '✓' : '○'} {x.t}</li>)}
          {cond !== undefined ? <li className="cond435">Condition de capture : {cond}</li> : null}
        </ul>
        {takenSet ? (
          <span className="lq429-ok">Dans votre Box ✓</span>
        ) : (
          <button type="button" className={`b b-sm ${isReady ? 'b-gold' : 'b-ghost'}`} data-v4fight={fight} disabled={!isReady}>{isReady ? 'Tenter la capture' : 'Quête en cours'}</button>
        )}
      </div>
    </article>
  );
}

// "Legends" tab (v4.29); Hoenn's legends follow, only when Hoenn is open (v4.38).
export default function Legends() {
  return (
    <>
      <p className="v4-note">Une légende vaincue peut être capturée une fois sa quête terminée. Elle rejoint votre Box et coûte 8 PC dans l’équipe.</p>
      <div className="lq429">
        {LEGS.map(L => <Legend key={L.id} L={L} et={stepsLeg429(L)} isTaken={PROFILE.box.includes(L.id)} fight={'lc' + L.id} />)}
      </div>
      {hoennOpen() ? (
        <>
          <p className="v4-note">Légendes de Hoenn : vainquez-les d’abord (Combats › Après-jeu), puis remplissez leur quête. Chacune a une condition de capture propre.</p>
          <div className="lq429">
            {HLEG435.map(L => <Legend key={L.id} L={L} et={steps435(L)} isTaken={inBox435(L.id)} fight={'hc' + L.id} condition={L.cap.t} />)}
          </div>
        </>
      ) : null}
    </>
  );
}
