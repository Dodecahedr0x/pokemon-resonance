import { Html } from '../../../lib/html.jsx';
import { useResumeVersion } from './prepStore.js';
import { SCEN } from '../../../engine/009-pokemon.js';
import { medal } from '../../../engine/014-utils.js';
import { badgeSvg } from '../../../engine/019-league.js';
import { B } from '../../../engine/024-combat-ui.js';
import { SV, battleLine, validBattle } from '../../../engine/025-saves.js';

// "Combat en cours" (Battle in progress) card (formerly renderResume), shared by #resumePrep (Battles) and
// #resumeHome (Home). The data-resume / data-drop buttons are still handled by the engine.
// As with the old innerHTML, a hidden card keeps its last content: we remember
// the last battle displayed for each container.
const last = {};

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
  if (b) {
    const D = SCEN[b.sc];
    last[id] = { gym: D.gym, at: D.at, line: battleLine(b), v };
  }
  const c = last[id];
  return (
    <div className="resume" id={id} hidden={!b}>
      {c && <SummaryCard key={c.v} id={id} c={c} />}
    </div>
  );
}
