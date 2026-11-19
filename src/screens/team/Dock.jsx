import { Html } from '../../lib/html.jsx';
import { BUDGET } from '../../engine/010-in-battle-evolution.js';
import { medal } from '../../engine/014-utils.js';
import { TEAM_MAX } from '../../engine/020-team-cards.js';
import { startVoice } from '../../engine/021-combat-engine.js';
import { teamBtns } from '../../engine/027-gym-on-screen.js';
import { useEngineReady } from '../../engineReady.js';
import { useRosterKey } from './teamStore.js';
import { analysis } from './analysis.js';

const N = () => Array.from({ length: TEAM_MAX }, (_, i) => i);

// Team banner at the top of the screen (#dock): slots, budget, Voice, Awakenings, Hint.
export function Dock({ A }) {
  return (
    <div className="dock" id="dock" aria-live="polite">
      {A && (
        <>
          <div className="slots">
            {N().map(i => (
              <span key={i} className={`slot${A.ms[i] ? ' f' : ''}`}>
                {A.ms[i] ? <Html html={medal(A.ms[i].t)} /> : null}
              </span>
            ))}
          </div>
          <div className="bud">
            <div className="bud-h">
              <span>
                Budget · {A.ms.length} / {TEAM_MAX} Pokémon
              </span>
              <b>
                {A.c} / {BUDGET} PC
              </b>
            </div>
            <div className={`gauge g${BUDGET}`}>
              {Array.from({ length: BUDGET }, (_, i) => (
                <i key={i} className={i < A.c ? 'on' : ''} />
              ))}
            </div>
          </div>
          <div className="dk" title="Voix : ordres par manche. Éveils : évolutions possibles. Indice : réactions, rôles couverts, Éveils et Voix réunis.">
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
            <button className="b b-sm b-gold" type="button" data-go="combat">
              Combattre
            </button>
          </div>
          {/* reset, restore, draw (v1.1): generator shared with the preparation */}
          <Html html={teamBtns()} />
        </>
      )}
    </div>
  );
}

// Team in the sidebar (#sideTeam).
export function SideTeam() {
  const A = useTeam();
  return (
    <a className="steam" href="#pokedex" id="sideTeam" aria-label="Mon équipe">
      {A && (
        <>
          <div className="steam-h">
            <span>Mon équipe</span>
            <b>
              {A.c} / {BUDGET} PC
            </b>
          </div>
          <div className="sm-slots four">
            {N().map(i => (
              <span key={i}>{A.ms[i] ? <Html html={medal(A.ms[i].t)} /> : null}</span>
            ))}
          </div>
          <div className="steam-h">
            <span>
              {startVoice(A.bonus)} Voix · {A.stages} Éveils
            </span>
            <span style={{ color: 'var(--gold)' }}>Modifier</span>
          </div>
        </>
      )}
    </a>
  );
}

// Team in the top bar (#tbTeam).
export function TbTeam() {
  const A = useTeam();
  return (
    <a className="tb-team" href="#pokedex" id="tbTeam" aria-label="Mon équipe">
      {A && (
        <>
          <span className="dots">
            {N().map(i => (
              <i key={i} className={i < A.ms.length ? 'on' : ''} />
            ))}
          </span>
          {A.c} PC
        </>
      )}
    </a>
  );
}

// Analysis re-read on every renderTeam; nothing before the first one (like the old empty DOM).
function useTeam() {
  const ready = useEngineReady(),
    v = useRosterKey('team');
  return ready && v ? analysis(v) : null;
}
