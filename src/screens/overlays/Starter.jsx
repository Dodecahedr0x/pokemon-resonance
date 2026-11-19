import { useEngineReady } from '../../engineReady.js';
import { Html } from '../../lib/html.jsx';
import { useStarter } from './shellOverlays.js';
import { Dialogue } from './Fenetre.jsx';
import { BY } from '../../engine/009-03-pokemon.js';
import { DIFFS, PROFILE, STARTERS } from '../../engine/011-05-etat-de-partie.js';
import { medal, tc } from '../../engine/014-08-outils.js';
import { evoPath } from '../../engine/017-10-accueil-route.js';

// Nouvelle campagne : choix du partenaire (#starter). openStarter() (026) l'ouvre ;
// les clics (data-st, data-sd) et la fermeture restent gérés par le moteur.
// Le contenu reste dans le DOM une fois la fenêtre refermée, comme l'ancien innerHTML.
export default function Starter() {
  const ready = useEngineReady();
  const { open, v } = useStarter();
  return (
    <div className="result starter" id="starter" hidden={!open}>
      {ready && v > 0 && <Carte />}
    </div>
  );
}

function Carte() {
  return (
    <Dialogue className="sv-card st-card" titre="stT" fermer={{ 'data-st': 'x' }}>
      <p className="kick">Nouvelle campagne</p>
      <h2 className="h2" id="stT">Choisissez votre partenaire</h2>
      <p className="sub">Il rejoint Magicarpe, Métamorph et Chenipan dans votre Box. Les autres se capturent dans les hautes herbes et sur les terrains. Vos emplacements de sauvegarde restent intacts.</p>
      <div className="st-grid">
        {STARTERS.map(id => {
          const m = BY[id];
          return (
            <button key={id} type="button" className="st-o" data-st={id} style={{ '--c': tc(m.t[0]) }}>
              <Html html={medal(m.t, 'lg')} />
              <b>{m.n}</b>
              <em>{m.r} · {m.c} PC</em>
              <span>Éveil : <Html html={evoPath(id)} /></span>
            </button>
          );
        })}
      </div>
      <div className="st-diff">
        <span>Difficulté</span>
        {Object.entries(DIFFS).map(([k, n]) => (
          <button key={k} type="button" className="b b-sm" data-sd={k} aria-pressed={PROFILE.diff === k}>{n}</button>
        ))}
      </div>
    </Dialogue>
  );
}
