import { Html } from '../../lib/html.jsx';
import { useTip429 } from './shellOverlays.js';
import { PROF_AV } from '../../engine/031-home-journey.js';

// Tip from Prof. Sorbier during a battle (#tip429, v4.29): set by tips429(),
// removed by endTip429() or the button (data-tip429, handled by the engine).
// A new block per tip (key): the text is then written letter by letter (v4.73).
export default function Tip429() {
  const { tip, v } = useTip429();
  if (!tip) {
    return null;
  }
  return (
    <aside className="tip429" id="tip429" role="status" aria-live="polite" key={v}>
      <span className="tip429-av">
        <Html html={PROF_AV} />
      </span>
      <div>
        <small>Astuce du Prof. Sorbier</small>
        <b>
          <Html html={tip.t} />
        </b>
        <p>
          <Html html={tip.d} />
        </p>
        <div className="tip429-a">
          <button type="button" className="b b-gold b-sm" data-tip429="ok">
            Compris
          </button>
          <button type="button" className="b b-ghost b-sm" data-tip429="off">
            Plus d’astuces
          </button>
        </div>
      </div>
    </aside>
  );
}
