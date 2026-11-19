import { Html } from '../../lib/html.jsx';
import { useTip429 } from './shellOverlays.js';
import { PROF_AV } from '../../engine/031-25-v3-parcours-accueil.js';

// Astuce du Prof. Sorbier pendant un combat (#tip429, v4.29) : posée par astuces429(),
// retirée par finTip429() ou le bouton (data-tip429, géré par le moteur).
// Un nouveau bloc par astuce (key) : le texte est ensuite écrit lettre par lettre (v4.73).
export default function Tip429() {
  const { tip, v } = useTip429();
  if (!tip) return null;
  return (
    <aside className="tip429" id="tip429" role="status" aria-live="polite" key={v}>
      <span className="tip429-av"><Html html={PROF_AV} /></span>
      <div>
        <small>Astuce du Prof. Sorbier</small>
        <b><Html html={tip.t} /></b>
        <p><Html html={tip.d} /></p>
        <div className="tip429-a"><button type="button" className="b b-gold b-sm" data-tip429="ok">Compris</button><button type="button" className="b b-ghost b-sm" data-tip429="off">Plus d’astuces</button></div>
      </div>
    </aside>
  );
}
