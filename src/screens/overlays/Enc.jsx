import { memo } from 'react';
import { Html, parseStyle } from '../../lib/html.jsx';
import { useEnc } from './shellOverlays.js';
import { dexNo } from '../../engine/004-data.js';
import { REGION_NAMES } from '../../engine/008-hoenn-data.js';
import { tb, tc } from '../../engine/014-utils.js';
import { crestSmall } from '../../engine/020-team-cards.js';
import { SPARK, shinyStyle } from '../../engine/043-adventure-plus.js';
import { CROWN416 } from '../../engine/055-living-johto.js';
import { IM450, rareInfo450 } from '../../engine/080-trainer-avatar-rare-encounters.js';

// Wild encounter (#enc), opened by encounter() (017) with a snapshot of the
// encounter. The buttons (data-enc), the click on the backdrop and Esc are still handled by the engine.
// The sheet stays in the DOM once closed, like the old innerHTML.
export default function Enc() {
  const { open, v, snap } = useEnc();
  return (
    <div className="result enc" id="enc" hidden={!open}>
      {snap && <MapScreen key={v} {...snap} />}
    </div>
  );
}

// memo: closing does not redraw the sheet (crestSmall numbers its gradients on every call).
const MapScreen = memo(({ pick, shiny, dom, route, tod, inBox, camp, path }) => {
  const style = { '--c': tc(pick.t[0]), ...(shiny ? parseStyle(shinyStyle(pick.id)) : {}) };
  const r = rareInfo450(pick.id); // v4.50: rare appearance depending on time and weather
  return (
    <div className={'enc-card' + (shiny ? ' shiny' : '') + (dom ? ' dom' : '')} role="dialog" aria-modal="true" aria-labelledby="encN" style={style}>
      <p className="kick">{route} · {tod === 'nuit' ? 'nuit' : tod === 'matin' ? 'matin' : 'jour'}</p>
      <p className="enc-t">
        {dom ? (
          <><Html html={CROWN416} />Un {pick.n} Dominant{shiny ? ' chromatique' : ''} surgit !</>
        ) : shiny ? (
          <><Html html={SPARK} /> Un {pick.n} chromatique apparaît !</>
        ) : (
          `Un ${pick.n} sauvage apparaît !`
        )}
      </p>
      {dom && <p className="enc-dom">Plus grand, plus fort, escorté. Battu ou capturé, il laisse un trésor rare.</p>}
      <div className="enc-cr"><Html html={crestSmall(pick)} /></div>
      <h2 className="sh-name" id="encN">{pick.n}</h2>
      <p className="sh-epi">{dexNo(pick.no)} · {REGION_NAMES[pick.gen] || 'Johto'} · {pick.r} · {pick.c} PC</p>
      {r.m > 1 && IM450() && <p className="rare450">Apparition rare · {r.w.join(' + ')}</p>}
      <div className="sh-tags">{pick.t.map(t => <Html key={t} html={tb(t)} />)}</div>
      <p className="enc-evo">{path ? <><span>Éveil en combat</span><Html html={path} /></> : <><span>Stade unique</span>Puissant dès le départ</>}</p>
      <div className="enc-a">
        <button type="button" className="b" data-enc="run">Fuir</button>
        <button type="button" className="b" data-enc="dex">Voir la carte</button>
        {inBox ? <button type="button" className="b" data-enc="fight">Combattre quand même</button> : <button type="button" className="b b-gold" data-enc="fight">Combattre pour le capturer</button>}
      </div>
      {camp || inBox ? null : <p className="enc-lib">Mode Libre : battez-le, puis capturez-le avec une Poké Ball pour l’ajouter à votre Box.</p>}
    </div>
  );
});
