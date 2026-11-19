import { Html } from '../../lib/html.jsx';
import { useCoach } from './shellOverlays.js';
import { PROF_AV } from '../../engine/031-home-journey.js';

// Guided battle coach (#coach): the Professor gives the step's instruction.
// renderCoach() (026) picks the step; the buttons (data-co) are still handled by the engine.
// A new block per step (key): the letter-by-letter text (v4.73) replaces the
// paragraph's text nodes, so React must never update it in place.
export default function Coach() {
  const { hidden, k, step, v } = useCoach();
  return (
    <div className="coach" id="coach" hidden={hidden} data-k={k}>
      {step && (
        <div className="co-in" key={v}>
          <Html html={PROF_AV} />
          <span className="co-n">{step.n} / {step.total}</span>
          <b><Html html={step.t} /></b>
          <p><Html html={step.d} /></p>
          <div className="co-a"><button type="button" className="b b-sm b-ghost" data-co="skip">Passer le tutoriel</button><button type="button" className="b b-sm b-gold" data-co="next">{step.last ? 'Terminer' : 'Suivant'}</button></div>
        </div>
      )}
    </div>
  );
}
