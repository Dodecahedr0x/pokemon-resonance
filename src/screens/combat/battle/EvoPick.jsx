import { Html } from '../../../lib/html.jsx';
import { MV, TAL } from '../../../engine/005-moves.js';
import { BY } from '../../../engine/009-pokemon.js';
import { ARR } from '../../../engine/010-in-battle-evolution.js';
import { medal, tb, tc } from '../../../engine/014-utils.js';
import { BRANCHES, branchWhy, evoOpts, mhpOf } from '../../../engine/021-combat-engine.js';
import { B } from '../../../engine/024-combat-ui.js';
import { eeveeWhy434 } from '../../../engine/069-calibration-eevee.js';
import { evoState, useBattleVersion } from './battleStore.js';

// Evolution choice (#evoPick). Opened and closed by the engine (hidden attribute);
// the content is that of the Pokémon passed to openEvoPick and stays in place once closed.
export default function EvoPick() {
  const v = useBattleVersion('evo');
  const u = evoState.u;
  return (
    <div className="evopick" id="evoPick" hidden>
      {v && u && B ? <Card u={u} /> : null}
    </div>
  );
}

function Path({ u, A, id }) {
  const E = BY[id],
    payout = E.mv.filter(x => !u.mv.includes(x)),
    lose = u.mv.filter(x => !E.mv.includes(x) && x !== u.ctm), // the learned move is kept
    tg = E.t.filter(t => !u.t.includes(t)),
    nm = mhpOf(E.s) + (u.hb || 0),
    why = BRANCHES[A.id]
      ? branchWhy(B, u, id)
      : A.nx === 'eevee'
        ? eeveeWhy434(B, u, id)
        : Array.isArray(A.nx)
          ? id === A.nx[1]
            ? 'Appelle la pluie'
            : 'Combattant'
          : '';
  return (
    <button type="button" className="eo" data-pick={id} style={{ '--c': tc(E.t[0]) }}>
      <span className="eo-art">
        <Html html={medal(E.t, 'xl')} />
      </span>
      <span className="eo-b">
        <span className="eo-n">
          <b>{E.n}</b>
          {why ? (
            <em>
              <Html html={why} />
            </em>
          ) : null}
        </span>
        <span className="types">
          {E.t.map((t, i) => (
            <Html key={i} html={tb(t)} />
          ))}
        </span>
        {'\n   '}
        <ul>
          {payout.length ? (
            <li className="gain">
              <span>Gagne</span>
              {payout.map(x => MV[x].n).join(', ')}
            </li>
          ) : null}
          {lose.length ? (
            <li className="lose">
              <span>Perd</span>
              {lose.map(x => MV[x].n).join(', ')} <i>pour toujours</i>
            </li>
          ) : null}
          {tg.length ? (
            <li>
              <span>Type</span>+ {tg.join(', ')}
            </li>
          ) : null}
          {E.ability !== u.ability && TAL[E.ability] ? (
            <li>
              <span>Talent</span>
              {TAL[E.ability][0]}
            </li>
          ) : null}
          <li>
            <span>PV max</span>
            {u.mhp} → {nm}
          </li>
          {ARR[id] ? (
            <li className="arr">
              <span>Arrivée</span>
              <Html html={ARR[id][1]} />
            </li>
          ) : null}
        </ul>
      </span>
      <span className="eo-go">Éveiller</span>
    </button>
  );
}

function Card({ u }) {
  const o = evoOpts(B, u);
  if (!o.length) {
    return null;
  }
  const A = BY[u.id];
  return (
    <div className="ep-card" role="dialog" aria-modal="true" aria-labelledby="epT">
      <p className="kick">Éveil · choix irréversible</p>
      <h2 className="h2" id="epT">
        {u.n} va évoluer
      </h2>
      <p className="sub">
        {o.length > 1 ? 'Plusieurs voies s’ouvrent. Une seule sera prise, ' : 'Il n’y a pas de retour : '}les capacités
        perdues ne reviendront plus de ce combat. L’Éveil coûte 1 Voix et l’action de {u.n}.
      </p>
      {'\n  '}
      <div className="ep-from">
        <Html html={medal(u.t, 'sm')} />
        <span>{u.n}</span>
        <span className="ep-ar">→</span>
      </div>
      <div className="ep-opts">
        {o.map(id => (
          <Path key={id} u={u} A={A} id={id} />
        ))}
      </div>
      <div className="ep-a">
        <button type="button" className="b" data-pick="">
          Pas maintenant
        </button>
      </div>
    </div>
  );
}
