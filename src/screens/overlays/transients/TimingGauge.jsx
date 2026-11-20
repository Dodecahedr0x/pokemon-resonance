import Button from '../../../components/Button.jsx';
// Capture gauge with timing (#timedCatch, v4.53 · startCatchTiming in 083). The engine animates
// the ring (.timed-catch-closing-ring, style.transform at each frame) and attaches its listeners to the node;
// `q` (result) changes the text and the class.
const TXT = { perfect: 'Parfait !', ok: 'Bien joué !', skip: 'Lancer direct', miss: 'Trop tôt ou trop tard…' };

export default function TimingGauge({ d }) {
  return (
    <div
      id="timed-catch"
      role="dialog"
      aria-label="Lancer la Ball : touchez au bon moment"
      className={'timed-catch' + (d.q ? ' is-' + d.q : '')}
    >
      <div className="timed-catch-card">
        <p className="timed-catch-text">{d.q ? TXT[d.q] : 'Touchez quand l’anneau touche la cible'}</p>
        <div className="timed-catch-rings">
          <i className="timed-catch-target" />
          <i className="timed-catch-closing-ring" />
          <i className="timed-catch-center" />
        </div>
        <Button variant="primary" className="timed-catch-throw">
          Lancer !
        </Button>
        <button type="button" className="timed-catch-skip">
          Passer le timing
        </button>
      </div>
    </div>
  );
}
