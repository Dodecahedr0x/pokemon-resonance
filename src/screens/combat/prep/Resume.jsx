import { Html } from '../../../lib/html.jsx';
import { useResumeVersion } from './prepStore.js';
import { SCEN } from '../../../engine/009-03-pokemon.js';
import { medal } from '../../../engine/014-08-outils.js';
import { badgeSvg } from '../../../engine/019-12-ligue.js';
import { B } from '../../../engine/024-17-interface-combat.js';
import { SV, battleLine, validBattle } from '../../../engine/025-19-sauvegardes.js';

// Carte « Combat en cours » (ancien renderResume), partagée par #resumePrep (Combats) et
// #resumeHome (Accueil). Les boutons data-resume / data-drop restent gérés par le moteur.
// Comme avec l'ancien innerHTML, une carte masquée garde son dernier contenu : on retient
// le dernier combat affiché pour chaque conteneur.
const last = {};

export function ResumeCard({ id, c }) {
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

// <ResumeBox id="resumePrep" /> : le conteneur et sa carte, redessinés à chaque renderResume().
export default function ResumeBox({ id }) {
  const v = useResumeVersion();
  const b = v && !B && validBattle(SV.lastBattle) ? SV.lastBattle : null;
  if (b) {
    const D = SCEN[b.sc];
    last[id] = { gym: D.gym, at: D.at, line: battleLine(b), v };
  }
  const c = last[id];
  return (
    <div className="resume" id={id} hidden={!b}>
      {c && <ResumeCard key={c.v} id={id} c={c} />}
    </div>
  );
}
