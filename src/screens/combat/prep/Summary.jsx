import { useState } from 'react';
import { Html } from '../../../lib/html.jsx';
import { useResumeVersion } from './prepStore.js';
import { SCENARIOS } from '../../../engine/pokemon/pokemon.js';
import { medal } from '../../../engine/core/utils.js';
import { badgeSvg } from '../../../engine/modes/league.js';
import { battle } from '../../../engine/combat/ui.js';
import { CLOUD_SAVE, battleLine, validBattle } from '../../../engine/state/saves.js';

import Button from '../../../components/Button.jsx';
// "Combat en cours" (Battle in progress) card (formerly renderResume), shared by #resumePrep (Battles) and
// #resumeHome (Home). The data-resume / data-drop buttons are still handled by the engine.

export function SummaryCard({ id, c }) {
  return (
    <>
      <span className="rs-ic">
        <Html html={c.gym != null ? badgeSvg(c.gym, c.at, 'rs' + id) : medal(['Normal'], 'is-small')} />
      </span>
      <span className="rs-tx">
        <b>Combat en cours</b>
        <em>
          <Html html={c.line} />
        </em>
      </span>
      <span className="rs-a">
        <Button size="small" variant="primary" data-resume="1">
          Reprendre
        </Button>
        <Button size="small" data-drop="1">
          Abandonner
        </Button>
      </span>
    </>
  );
}

// <SummaryBox id="resumePrep" />: the container and its card, redrawn on every renderSummary().
export default function SummaryBox({ id }) {
  const v = useResumeVersion();
  const b = v && !battle && validBattle(CLOUD_SAVE.lastBattle) ? CLOUD_SAVE.lastBattle : null;
  // As with the old innerHTML, a hidden card keeps its last content.
  const [last, setLast] = useState(null);
  let cur = null;
  if (b) {
    const D = SCENARIOS[b.sc];
    cur = { gym: D.gym, at: D.at, line: battleLine(b), v };
  }
  if (cur && (!last || last.v !== cur.v)) {
    setLast(cur);
  }
  const c = cur || last;
  return (
    <div className="resume" id={id} hidden={!b}>
      {c && <SummaryCard key={c.v} id={id} c={c} />}
    </div>
  );
}
