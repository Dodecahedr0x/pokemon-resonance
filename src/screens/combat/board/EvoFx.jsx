import { medal, tc } from '../../../engine/014-08-outils.js';
import { Html } from '../../../lib/html.jsx';
import { useEvo } from './boardStore.js';

// #evoFx : cinématique d'évolution (cine), au-dessus du plateau.
export default function EvoFx() {
  const E = useEvo(),
    f = E.fx;
  const style = E.ox != null ? { '--ox': E.ox, '--oy': E.oy } : undefined;
  return (
    <div className={'evofx' + (E.fast ? ' fast' : '')} id="evoFx" hidden={!E.on} aria-live="assertive" style={style}>
      {f && (
        <div className={'efx' + (f.side === 'e' ? ' foe' : '')} style={{ '--c': tc(f.toT[0]), '--c0': tc(f.fromT[0]) }}>
          <div className="efx-rays" />
          <div className="efx-ring" />
          <div className="efx-orb">
            <span className="efx-a">
              <Html html={medal(f.fromT, 'xl')} />
            </span>
            <span className="efx-b">
              <Html html={medal(f.toT, 'xl')} />
            </span>
          </div>
          <p className="efx-t1">{(f.side === 'e' ? 'L’adversaire : ' : 'Quoi ? ') + f.fromN + ' évolue !'}</p>
          <p className="efx-t2">
            <span>{f.fromN}</span> devient <b>{f.toN}</b>
          </p>
          <div className="efx-flash" />
        </div>
      )}
    </div>
  );
}
