import { Html } from '../../../lib/html.jsx';
import { MV, TAL } from '../../../engine/data/moves.js';
import { BY } from '../../../engine/pokemon/pokemon.js';
import { ARR } from '../../../engine/pokemon/evolution.js';
import { medal, typeBadge, tc } from '../../../engine/core/utils.js';
import { BRANCHES, branchWhy, evoOpts, mhpOf } from '../../../engine/combat/engine.js';
import { B } from '../../../engine/combat/ui.js';
import { eeveeWhy } from '../../../engine/pokemon/eevee.js';
import { evoState, useBattleVersion } from './battleStore.js';

import Button from '../../../components/Button.jsx';
// Evolution choice (#evoPick). Opened and closed by the engine (hidden attribute);
// the content is that of the Pokémon passed to openEvoPick and stays in place once closed.
export default function EvoPick() {
  const v = useBattleVersion('evo');
  const u = evoState.u;
  return (
    <div className="evolution-choice" id="evoPick" hidden>
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
        ? eeveeWhy(B, u, id)
        : Array.isArray(A.nx)
          ? id === A.nx[1]
            ? 'Appelle la pluie'
            : 'Combattant'
          : '';
  return (
    <button type="button" className="evolution-option" data-pick={id} style={{ '--evolution-color': tc(E.t[0]) }}>
      <span className="evolution-option-art">
        <Html html={medal(E.t, 'is-huge')} />
      </span>
      <span className="evolution-option-body">
        <span className="evolution-option-name">
          <b>{E.n}</b>
          {why ? (
            <em>
              <Html html={why} />
            </em>
          ) : null}
        </span>
        <span className="types">
          {E.t.map((t, i) => (
            <Html key={i} html={typeBadge(t)} />
          ))}
        </span>
        {'\n   '}
        <ul>
          {payout.length ? (
            <li className="is-gain">
              <span>Gagne</span>
              {payout.map(x => MV[x].n).join(', ')}
            </li>
          ) : null}
          {lose.length ? (
            <li className="is-loss">
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
            <li className="is-arrival">
              <span>Arrivée</span>
              <Html html={ARR[id][1]} />
            </li>
          ) : null}
        </ul>
      </span>
      <span className="evolution-option-go">Éveiller</span>
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
    <div className="evolution-choice-card" role="dialog" aria-modal="true" aria-labelledby="epT">
      <p className="kicker">Éveil · choix irréversible</p>
      <h2 className="section-title" id="epT">
        {u.n} va évoluer
      </h2>
      <p className="lead">
        {o.length > 1 ? 'Plusieurs voies s’ouvrent. Une seule sera prise, ' : 'Il n’y a pas de retour : '}les capacités
        perdues ne reviendront plus de ce combat. L’Éveil coûte 1 Voix et l’action de {u.n}.
      </p>
      {'\n  '}
      <div className="evolution-choice-from">
        <Html html={medal(u.t, 'is-small')} />
        <span>{u.n}</span>
        <span className="evolution-choice-arrow">→</span>
      </div>
      <div className="evolution-choice-options">
        {o.map(id => (
          <Path key={id} u={u} A={A} id={id} />
        ))}
      </div>
      <div className="evolution-choice-actions">
        <Button data-pick="">Pas maintenant</Button>
      </div>
    </div>
  );
}
