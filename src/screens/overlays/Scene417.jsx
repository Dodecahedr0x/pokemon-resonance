import { Html } from '../../lib/html.jsx';
import { useOverlay } from './dialogsStore.js';

// Story scene (#scene417): one line at a time. Clicks (data-scene) and hidden:
// engine (057, 064, 093). The text is then typed letter by letter by the engine
// (v4.73, 109), which adds .pk-dlg, .pk-fl and <span>s in the card: each line
// is a new render (key), so these additions do not bother React.
export default function Scene417() {
  const s = useOverlay('scene');
  return (
    <div className="scene417" id="scene417" hidden>
      {s && <MapScreen key={s.v} {...s} />}
    </div>
  );
}

function MapScreen({ av, n, txt, i, nb, suite: next }) {
  return (
    <div className="sc-card" role="dialog" aria-modal="true" aria-label="Scène">
      <div className="sc-who"><Html html={av} /><b><Html html={n} /></b></div>
      <p className="sc-tx"><Html html={txt} /></p>
      <div className="sc-a">
        <button type="button" className="b b-sm b-ghost" data-scene="passer">Passer</button>
        <span className="sc-n">{i + 1} / {nb}</span>
        <button type="button" className="b b-sm b-gold" data-scene="suite">{next}</button>
      </div>
    </div>
  );
}
