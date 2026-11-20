import { useEngineReady } from '../../engineReady.js';
import { Html } from '../../lib/html.jsx';
import { useStarter } from './shellOverlays.js';
import { Dialogue } from './Window.jsx';
import { BY } from '../../engine/pokemon/pokemon.js';
import { DIFFS, PROFILE, STARTERS } from '../../engine/state/game-state.js';
import { medal, tc } from '../../engine/core/utils.js';
import { evoPath } from '../../engine/world/home-route.js';

import Button from '../../components/Button.jsx';
// New campaign: partner choice (#starter). openStarter() (026) opens it;
// clicks (data-st, data-sd) and closing are still handled by the engine.
// The content stays in the DOM once the window is closed, like the old innerHTML.
export default function Starter() {
  const ready = useEngineReady();
  const { open, v } = useStarter();
  return (
    <div className="result starter" id="starter" hidden={!open}>
      {ready && v > 0 && <Card />}
    </div>
  );
}

function Card() {
  return (
    <Dialogue className="sv-card st-card" titre="stT" closeAttrs={{ 'data-st': 'x' }}>
      <p className="kick">Nouvelle campagne</p>
      <h2 className="h2" id="stT">
        Choisissez votre partenaire
      </h2>
      <p className="sub">
        Il rejoint Magicarpe, Métamorph et Chenipan dans votre Box. Les autres se capturent dans les hautes herbes et
        sur les terrains. Vos emplacements de sauvegarde restent intacts.
      </p>
      <div className="st-grid">
        {STARTERS.map(id => {
          const m = BY[id];
          return (
            <button key={id} type="button" className="st-o" data-st={id} style={{ '--c': tc(m.t[0]) }}>
              <Html html={medal(m.t, 'lg')} />
              <b>{m.n}</b>
              <em>
                {m.r} · {m.c} PC
              </em>
              <span>
                Éveil : <Html html={evoPath(id)} />
              </span>
            </button>
          );
        })}
      </div>
      <div className="st-diff">
        <span>Difficulté</span>
        {Object.entries(DIFFS).map(([k, n]) => (
          <Button key={k} size="small" data-sd={k} aria-pressed={PROFILE.diff === k}>
            {n}
          </Button>
        ))}
      </div>
    </Dialogue>
  );
}
