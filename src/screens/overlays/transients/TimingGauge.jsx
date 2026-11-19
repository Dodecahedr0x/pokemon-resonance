// Capture gauge with timing (#timedCatch, v4.53 · startCatchTiming in 083). The engine animates
// the ring (.timedCatch-g, style.transform at each frame) and attaches its listeners to the node;
// `q` (result) changes the text and the class.
const TXT = { perfect: 'Parfait !', ok: 'Bien joué !', skip: 'Lancer direct', miss: 'Trop tôt ou trop tard…' };

export default function TimingGauge({ d }) {
  return (
    <div
      id="timed-catch"
      role="dialog"
      aria-label="Lancer la Ball : touchez au bon moment"
      className={d.q ? 'res-' + d.q : undefined}
    >
      <div className="timed-catch-c">
        <p className="timed-catch-t">{d.q ? TXT[d.q] : 'Touchez quand l’anneau touche la cible'}</p>
        <div className="timed-catch-r">
          <i className="timed-catch-z" />
          <i className="timed-catch-g" />
          <i className="timed-catch-d" />
        </div>
        <button type="button" className="b b-gold timed-catch-b">
          Lancer !
        </button>
        <button type="button" className="timed-catch-s">
          Passer le timing
        </button>
      </div>
    </div>
  );
}
