import { useState } from 'react';
import { Html } from '../../../lib/html.jsx';
import { useResumeVersion } from './prepStore.js';
import { SCEN } from '../../../engine/009-pokemon.js';
import { medal } from '../../../engine/014-utils.js';
import { badgeSvg } from '../../../engine/019-league.js';
import { B } from '../../../engine/024-combat-ui.js';
import { SV, battleLine, validBattle } from '../../../engine/025-saves.js';

// "Combat en cours" (Battle in progress) card (formerly renderResume), shared by #resumePrep (Battles) and
// #resumeHome (Home). The data-resume / data-drop buttons are still handled by the engine.

export function SummaryCard({ id, c }) {
  return (
    <>
      <span className="rs-ic">
        <Html html={c.gym != null ? badgeSvg(c.gym, c.at, 'rs' + id) : medal(['Normal'], 'sm')} />
      </span>
      <span className="rs-tx">
        <b>Combat en cours</b>
        <em>
          <Html html={c.line} />
        </em>
      </span>
      <span className="rs-a">
        <button type="button" className="b b-gold b-sm" data-resume="1">
          Reprendre
        </button>
        <button type="button" className="b b-sm" data-drop="1">
          Abandonner
        </button>
      </span>
    </>
  );
}

// <SummaryBox id="resumePrep" />: the container and its card, redrawn on every renderSummary().
export default function SummaryBox({ id }) {
  const v = useResumeVersion();
  const b = v && !B && validBattle(SV.lastBattle) ? SV.lastBattle : null;
  // As with the old innerHTML, a hidden card keeps its last content.
  const [last, setLast] = useState(null);
  let cur = null;
  if (b) {
    const D = SCEN[b.sc];
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
