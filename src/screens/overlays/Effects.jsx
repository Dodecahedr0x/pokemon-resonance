import { Html } from '../../lib/html.jsx';
import { useOverlay } from './dialogsStore.js';

// Effect layers the engine used to place on <body>. Always-mounted nodes: the engine
// keeps its imperative toggles there (classes, hidden), which React does not render:
// - #pk-fond: fixed backdrop (v4.72, 107), no toggles;
// - #pk-iris: Poké Ball opening; 107 adds/removes the .is-playing class;
// - #pk-btr: battle entrance; 108 sets its class (is-playing, is-boss | is-trainer | is-wild, is-fast),
//   the bands are rendered here between paintOverlay('btr') and clearOverlay('btr');
// - #pk-badge: badge ceremony; 108 manages hidden and .is-leaving, the content comes from the store;
// - #battleTransition: battle-entry flash (v4.48, 079), present for 1.25 s.

// Large line-art Poké Ball of the backdrop (originally the first element of the body).
export function PkBackground() {
  return (
    <div id="pk-fond" className="pokeball-backdrop" aria-hidden="true">
      <i />
    </div>
  );
}

export function PkIris() {
  return (
    <div id="pk-iris" className="pokeball-iris" aria-hidden="true">
      <i className="pokeball-iris-half is-top" />
      <i className="pokeball-iris-half is-bottom" />
      <i className="pokeball-iris-button" />
    </div>
  );
}

const BANDS = [0, 1, 2, 3, 4, 5, 6, 7];

export function PkBtr() {
  const s = useOverlay('btr');
  return (
    <div id="pk-btr" className="battle-entrance" aria-hidden="true">
      {s && (
        <>
          <i className="battle-entrance-flash" />
          {BANDS.map(n => (
            <i key={n} className="battle-entrance-band" style={{ '--band-index': n }} />
          ))}
          <i className="battle-entrance-ball" />
        </>
      )}
    </div>
  );
}

const SPRAY = Array.from({ length: 14 }, (_, k) => Math.round(k * 25.7));

export function PkBadge() {
  const s = useOverlay('badge');
  return (
    <div id="pk-badge" className="badge-ceremony" hidden role="dialog" aria-modal="true" aria-label="Nouveau badge">
      {s && (
        <div className="badge-ceremony-content" key={s.v}>
          <div className="badge-ceremony-case">
            <span className="badge-ceremony-badge">
              <Html html={s.svg} />
            </span>
            <span className="badge-ceremony-spray" aria-hidden="true">
              {SPRAY.map(a => (
                <i key={a} style={{ '--a': a + 'deg' }} />
              ))}
            </span>
          </div>
          <p className="badge-ceremony-title">
            {s.leader ? s.leader + ' vous remet le' : 'Vous obtenez le'}
            <b>Badge {s.displayName}</b>
          </p>
          <p className="badge-ceremony-count">{s.n} / 8 badges dans la boîte</p>
          <p className="badge-ceremony-hint">Touchez pour continuer</p>
        </div>
      )}
    </div>
  );
}

export function ScreenTransition() {
  const s = useOverlay('battle-transition');
  if (!s) {
    return null;
  }
  return (
    <div id="battle-transition" className="battle-transition" aria-hidden="true" key={s.v}>
      <i className="battle-transition-flash" />
      <i className="battle-transition-iris" />
    </div>
  );
}
