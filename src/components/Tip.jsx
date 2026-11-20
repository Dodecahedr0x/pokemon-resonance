import { memo } from 'react';
import { Html } from '../lib/html.jsx';
import { useTip } from './tipStore.js';
import { PROF_AV, TIPS } from '../engine/world/home-journey.js';

import Button from './Button.jsx';
// Professor's tip (.tip), right after the .page-header of the `t` screen (pokedex, battle, types).
function Tip({ t }) {
  const on = useTip(t);
  if (!on) {
    return null;
  }
  return (
    <div className="professor-tip" data-tip={t}>
      <Html html={PROF_AV} />
      <div className="dialogue-box is-small">
        <span className="dialogue-speaker">Prof. Sorbier</span>
        <p>
          <Html html={TIPS[t]} />
        </p>
      </div>
      <Button size="small" data-tipok={t}>
        Compris
      </Button>
    </div>
  );
}

export default memo(Tip);
