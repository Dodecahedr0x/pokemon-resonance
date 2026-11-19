import { memo } from 'react';
import { Html } from '../lib/html.jsx';
import { useTip } from './tipStore.js';
import { PROF_AV, TIPS } from '../engine/031-25-v3-parcours-accueil.js';

// Conseil de la Professeure (.tip), juste après l'en-tête .ph de l'écran `t` (pokedex, combat, types).
function Tip({ t }) {
  const on = useTip(t);
  if (!on) return null;
  return (
    <div className="tip" data-tip={t}>
      <Html html={PROF_AV} />
      <div className="dlgbox sm"><span className="dlg-who">Prof. Sorbier</span><p><Html html={TIPS[t]} /></p></div>
      <button type="button" className="b b-sm" data-tipok={t}>Compris</button>
    </div>
  );
}

export default memo(Tip);
