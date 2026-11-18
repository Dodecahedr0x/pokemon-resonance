import { Html } from '../../lib/html.jsx';
import { useEngineReady } from '../../engineReady.js';
import { useAccueilVersion } from './accueilStore.js';
import { tc } from '../../engine/014-08-outils.js';
import { squad } from '../../engine/020-13-equipe-cartes.js';
import { S2n, emblem, goalInfo } from '../../engine/031-25-v3-parcours-accueil.js';

// « Prochaine étape » de la barre latérale (#sideGoal, ancien renderSideGoal) : reflète
// l'objectif de l'Accueil. Le clic (data-goal / data-go) reste géré par le moteur.
export default function ObjectifLateral() {
  const ready = useEngineReady(),
    v = useAccueilVersion();
  return <div className="side-goal" id="sideGoal">{(ready || v > 0) && <Contenu />}</div>;
}

function Contenu() {
  const g = goalInfo();
  return (
    <>
      <span className="sg-k">Prochaine étape</span>
      <button type="button" className="sg-b" data-goal={squad.length ? g.k : undefined} data-go={squad.length ? undefined : 'pokedex'} style={{ '--ac': g.type ? tc(g.type) : '#FFCB05' }}>
        <Html html={emblem(g.k, 'xs')} />
        <span>
          <b>{g.k === 'tuto' ? 'Combat guidé' : g.k === 'champ' ? 'Finale' : S2n(g)}</b>
          <em>{squad.length ? (g.L ? g.L.n : 'Touchez pour y aller') : 'Choisir mon équipe'}</em>
        </span>
      </button>
    </>
  );
}
