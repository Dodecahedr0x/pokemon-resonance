import { Html } from '../../lib/html.jsx';
import { useTipOverlay } from './shellOverlays.js';
import { PROF_AV } from '../../engine/world/home-journey.js';

// Tip from Prof. Sorbier during a battle (#tipCard, v4.29): set by seenTips(),
// removed by endTooltip() or the button (data-tip-card, handled by the engine).
// A new block per tip (key): the text is then written letter by letter (v4.73).
export default function BattleTip() {
  const { tip, v } = useTipOverlay();
  if (!tip) {
    return null;
  }
  return (
    <aside className="tip-card" id="tip-card" role="status" aria-live="polite" key={v}>
      <span className="tip-card-av">
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
        <div className="tip-card-a">
          <button type="button" className="b b-gold b-sm" data-tip-card="ok">
            Compris
          </button>
          <button type="button" className="b b-ghost b-sm" data-tip-card="off">
            Plus d’astuces
          </button>
        </div>
      </div>
    </aside>
  );
}
