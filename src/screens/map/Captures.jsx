import { PROFILE } from '../../engine/011-game-state.js';
import { PIX } from '../../engine/032-v4-foundation.js';
import { REGN421, ROUTE421, regionNo421 } from '../../engine/061-catch-anywhere.js';
import { DIPL428, familyCapt428 } from '../../engine/063-combat-catches-home.js';

// Familles capturées dans la région (v4.28), sous la route. Le clic sur un Pokémon
// (data-cp428) reste géré par le moteur.
export default function Captures() {
  const r = regionNo421(),
    c = familyCapt428(r),
    endStep = c.n >= c.t;
  return (
    <div id="cp428" className="cp428">
      <div className="cp428-h"><b>{`${ROUTE421[r]} · ${c.n} / ${c.t} familles capturées`}</b><span className="cp428-g">{endStep ? `Pokédex de ${REGN421[r]} complet ✓` : `Diplôme : +${DIPL428[r][0]} ₽ · +${DIPL428[r][1]} Éclats`}</span></div>
      {'\n '}
      <span className="cp428-bar" aria-hidden="true"><i style={{ width: `${Math.round((c.n / Math.max(1, c.t)) * 100)}%` }} /></span>
      {'\n '}
      <div className="cp428-l">
        {c.L.map(m => {
          const own = PROFILE.box.includes(m.id);
          return (
            <button type="button" className={'cp428-m' + (own ? ' on' : '')} data-cp428={m.id} aria-label={own ? m.n + ', capturé' : 'Pokémon pas encore capturé'} key={m.id}>
              <img src={PIX(m.no)} alt="" loading="lazy" decoding="async" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
