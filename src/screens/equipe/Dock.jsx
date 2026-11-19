import { Html } from '../../lib/html.jsx';
import { BUDGET } from '../../engine/010-04-evolution-en-combat.js';
import { medal } from '../../engine/014-08-outils.js';
import { TEAM_MAX } from '../../engine/020-13-equipe-cartes.js';
import { voixDepart } from '../../engine/021-14-moteur-combat.js';
import { teamBtns } from '../../engine/027-21-arene-a-lecran.js';
import { useEngineReady } from '../../engineReady.js';
import { useEquipeKey } from './equipeStore.js';
import { analyse } from './analyse.js';

const N = () => Array.from({ length: TEAM_MAX }, (_, i) => i);

// Bandeau de l'équipe en tête de l'écran (#dock) : emplacements, budget, Voix, Éveils, Indice.
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
              <b>{voixDepart(A.bonus)}</b>
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
          {/* réinitialiser, rétablir, tirage (v1.1) : générateur partagé avec la préparation */}
          <Html html={teamBtns()} />
        </>
      )}
    </div>
  );
}

// Équipe dans la barre latérale (#sideTeam).
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
              {voixDepart(A.bonus)} Voix · {A.stages} Éveils
            </span>
            <span style={{ color: 'var(--gold)' }}>Modifier</span>
          </div>
        </>
      )}
    </a>
  );
}

// Équipe dans la barre du haut (#tbTeam).
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

// Analyse relue à chaque renderTeam ; rien avant le premier (comme l'ancien DOM vide).
function useTeam() {
  const ready = useEngineReady(),
    v = useEquipeKey('team');
  return ready && v ? analyse(v) : null;
}
