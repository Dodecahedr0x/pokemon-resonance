import { memo } from 'react';
import { Html, parseStyle } from '../../lib/html.jsx';
import { useEnc } from './shellOverlays.js';
import { dexNo } from '../../engine/data/game-data.js';
import { REGION_NAMES } from '../../engine/data/hoenn.js';
import { typeBadge, tc } from '../../engine/core/utils.js';
import { crestSmall } from '../../engine/team/team.js';
import { SPARK, shinyStyle } from '../../engine/pokemon/shiny.js';
import { DOMINANT_CROWN_SVG } from '../../engine/world/dominant-pokemon.js';
import { RARE_ENABLED, rareInfo } from '../../engine/world/rare-encounters.js';

import Button from '../../components/Button.jsx';
// Wild encounter (#enc), opened by encounter() (017) with a snapshot of the
// encounter. The buttons (data-enc), the click on the backdrop and Esc are still handled by the engine.
// The sheet stays in the DOM once closed, like the old innerHTML.
export default function Enc() {
  const { open, v, snap } = useEnc();
  return (
    <div className="modal encounter" id="enc" hidden={!open}>
      {snap && <Card key={v} {...snap} />}
    </div>
  );
}

// memo: closing does not redraw the sheet (crestSmall numbers its gradients on every call).
const Card = memo(function Card({ pick, shiny, dom, route, tod, inBox, camp, path }) {
  const style = { '--c': tc(pick.t[0]), ...(shiny ? parseStyle(shinyStyle(pick.id)) : {}) };
  const r = rareInfo(pick.id); // v4.50: rare appearance depending on time and weather
  return (
    <div
      className={'encounter-card' + (shiny ? ' shiny' : '') + (dom ? ' is-dominant' : '')}
      role="dialog"
      aria-modal="true"
      aria-labelledby="encN"
      style={style}
    >
      <p className="kicker">
        {route} · {tod === 'nuit' ? 'nuit' : tod === 'matin' ? 'matin' : 'jour'}
      </p>
      <p className="encounter-title">
        {dom ? (
          <>
            <Html html={DOMINANT_CROWN_SVG} />
            Un {pick.n} Dominant{shiny ? ' chromatique' : ''} surgit !
          </>
        ) : shiny ? (
          <>
            <Html html={SPARK} /> Un {pick.n} chromatique apparaît !
          </>
        ) : (
          `Un ${pick.n} sauvage apparaît !`
        )}
      </p>
      {dom && (
        <p className="encounter-dominant">
          Plus grand, plus fort, escorté. Battu ou capturé, il laisse un trésor rare.
        </p>
      )}
      <div className="encounter-crest">
        <Html html={crestSmall(pick)} />
      </div>
      <h2 className="sh-name" id="encN">
        {pick.n}
      </h2>
      <p className="sh-epi">
        {dexNo(pick.no)} · {REGION_NAMES[pick.gen] || 'Johto'} · {pick.r} · {pick.c} PC
      </p>
      {r.m > 1 && RARE_ENABLED() && <p className="rare-encounter">Apparition rare · {r.w.join(' + ')}</p>}
      <div className="sh-tags">
        {pick.t.map(t => (
          <Html key={t} html={typeBadge(t)} />
        ))}
      </div>
      <p className="encounter-evolution">
        {path ? (
          <>
            <span>Éveil en combat</span>
            <Html html={path} />
          </>
        ) : (
          <>
            <span>Stade unique</span>Puissant dès le départ
          </>
        )}
      </p>
      <div className="encounter-actions">
        <Button data-enc="run">Fuir</Button>
        <Button data-enc="dex">Voir la carte</Button>
        {inBox ? (
          <Button data-enc="fight">Combattre quand même</Button>
        ) : (
          <Button variant="primary" data-enc="fight">
            Combattre pour le capturer
          </Button>
        )}
      </div>
      {camp || inBox ? null : (
        <p className="encounter-note">
          Mode Libre : battez-le, puis capturez-le avec une Poké Ball pour l’ajouter à votre Box.
        </p>
      )}
    </div>
  );
});
