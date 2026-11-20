import { medal, tc } from '../../../engine/core/utils.js';
import { Html } from '../../../lib/html.jsx';
import { useEvo } from './boardStore.js';

// #evoFx: evolution cinematic (cine), above the board.
export default function EvoFx() {
  const E = useEvo(),
    f = E.fx;
  const style = E.ox != null ? { '--ox': E.ox, '--oy': E.oy } : undefined;
  return (
    <div
      className={'evolution-scene' + (E.fast ? ' is-fast' : '')}
      id="evoFx"
      hidden={!E.on}
      aria-live="assertive"
      style={style}
    >
      {f && (
        <div
          className={'evolution-scene-burst' + (f.side === 'e' ? ' is-foe' : '')}
          style={{ '--c': tc(f.toT[0]), '--c0': tc(f.fromT[0]) }}
        >
          <div className="evolution-scene-rays" />
          <div className="evolution-scene-ring" />
          <div className="evolution-scene-orb">
            <span className="evolution-scene-from">
              <Html html={medal(f.fromT, 'is-huge')} />
            </span>
            <span className="evolution-scene-to">
              <Html html={medal(f.toT, 'is-huge')} />
            </span>
          </div>
          <p className="evolution-scene-title">
            {(f.side === 'e' ? 'L’adversaire : ' : 'Quoi ? ') + f.fromN + ' évolue !'}
          </p>
          <p className="evolution-scene-caption">
            <span>{f.fromN}</span> devient <b>{f.toN}</b>
          </p>
          <div className="evolution-scene-flash" />
        </div>
      )}
    </div>
  );
}
