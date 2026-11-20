import { Html } from '../../lib/html.jsx';
import { BUDGET } from '../../engine/pokemon/evolution.js';
import { medal } from '../../engine/core/utils.js';
import { TEAM_MAX } from '../../engine/team/team.js';
import { startVoice } from '../../engine/combat/engine.js';
import { teamBtns } from '../../engine/modes/gym-screen.js';

import Button from '../../components/Button.jsx';
const N = () => Array.from({ length: TEAM_MAX }, (_, i) => i);

// Team banner at the top of the screen (#dock): slots, budget, Voice, Awakenings, Hint.
export function Dock({ A }) {
  return (
    <div className="team-dock" id="dock" aria-live="polite">
      {A && (
        <>
          <div className="team-dock-slots">
            {N().map(i => (
              <span key={i} className={`team-dock-slot${A.ms[i] ? ' is-filled' : ''}`}>
                {A.ms[i] ? <Html html={medal(A.ms[i].t)} /> : null}
              </span>
            ))}
          </div>
          <div className="team-dock-budget">
            <div className="team-dock-budget-head">
              <span>
                Budget · {A.ms.length} / {TEAM_MAX} Pokémon
              </span>
              <b>
                {A.c} / {BUDGET} PC
              </b>
            </div>
            <div className="team-dock-gauge" style={{ '--segments': BUDGET }}>
              {Array.from({ length: BUDGET }, (_, i) => (
                <i key={i} className={i < A.c ? 'is-on' : ''} />
              ))}
            </div>
          </div>
          <div
            className="team-dock-stats"
            title="Voix : ordres par manche. Éveils : évolutions possibles. Indice : réactions, rôles couverts, Éveils et Voix réunis."
          >
            <div>
              <b>{startVoice(A.bonus)}</b>
              <span>Voix</span>
            </div>
            <div>
              <b>{A.stages}</b>
              <span>Éveils</span>
            </div>
            <div>
              <b>{A.score}</b>
              <span>Indice</span>
            </div>
            <Button size="small" variant="primary" data-go="combat">
              Combattre
            </Button>
          </div>
          {/* reset, restore, draw (v1.1): generator shared with the preparation */}
          <Html html={teamBtns()} />
        </>
      )}
    </div>
  );
}
