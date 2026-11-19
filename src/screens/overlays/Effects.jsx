import { Html } from '../../lib/html.jsx';
import { useOverlay } from './dialogsStore.js';

// Effect layers the engine used to place on <body>. Always-mounted nodes: the engine
// keeps its imperative toggles there (classes, hidden), which React does not render:
// - #pk-fond: fixed backdrop (v4.72, 107), no toggles;
// - #pk-iris: Poké Ball opening; 107 adds/removes the .go class;
// - #pk-btr: battle entrance; 108 sets its class (go, boss|dresseur|sauvage, vite),
//   the bands are rendered here between paintOverlay('btr') and clearOverlay('btr');
// - #pk-badge: badge ceremony; 108 manages hidden and .out, the content comes from the store;
// - #tr448: battle-entry flash (v4.48, 079), present for 1.25 s.

// Large line-art Poké Ball of the backdrop (originally the first element of the body).
export function PkBackground() {
  return (
    <div id="pk-fond" aria-hidden="true"><i /></div>
  );
}

export function PkIris() {
  return (
    <div id="pk-iris" aria-hidden="true">
      <i className="pk-h pk-ht" />
      <i className="pk-h pk-hb" />
      <i className="pk-hc" />
    </div>
  );
}

const BANDS = [0, 1, 2, 3, 4, 5, 6, 7];

export function PkBtr() {
  const s = useOverlay('btr');
  return (
    <div id="pk-btr" aria-hidden="true">
      {s && (
        <>
          <i className="pk-fls" />
          {BANDS.map(n => <i key={n} className="pk-bd" style={{ '--n': n }} />)}
          <i className="pk-bc" />
        </>
      )}
    </div>
  );
}

const SPRAY = Array.from({ length: 14 }, (_, k) => Math.round(k * 25.7));

export function PkBadge() {
  const s = useOverlay('badge');
  return (
    <div id="pk-badge" hidden role="dialog" aria-modal="true" aria-label="Nouveau badge">
      {s && (
        <div className="pk-bc-in" key={s.v}>
          <div className="pk-bc-case">
            <span className="pk-bc-bdg"><Html html={s.svg} /></span>
            <span className="pk-bc-gerbe" aria-hidden="true">
              {SPRAY.map(a => <i key={a} style={{ '--a': a + 'deg' }} />)}
            </span>
          </div>
          <p className="pk-bc-t">{s.leader ? s.leader + ' vous remet le' : 'Vous obtenez le'}<b>Badge {s.displayName}</b></p>
          <p className="pk-bc-s">{s.n} / 8 badges dans la boîte</p>
          <p className="pk-bc-k">Touchez pour continuer</p>
        </div>
      )}
    </div>
  );
}

export function Tr448() {
  const s = useOverlay('tr448');
  if (!s) return null;
  return (
    <div id="tr448" aria-hidden="true" key={s.v}>
      <i className="tr448-f" />
      <i className="tr448-i" />
    </div>
  );
}
