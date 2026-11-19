import { Html, parseStyle } from '../../lib/html.jsx';
import { Box, Dialogue } from './Window.jsx';
import { BY } from '../../engine/pokemon/pokemon.js';
import { tb } from '../../engine/core/utils.js';
import { crestSmall } from '../../engine/team/team.js';
import { SPARK, shinyStyle } from '../../engine/pokemon/shiny.js';
import { DOMINANT_CROWN_SVG } from '../../engine/world/dominant-pokemon.js';

// Fishing (#fishingPanel): waiting, bite, catch. The engine (058) keeps the timers,
// the clicks (data-fishing-panel) and the hidden attribute; after a shiny catch, it
// recolors the illustration (.pe-prise img, applyShinyArt) right after rendering.
export default function FishingWindow() {
  return <Box displayName="peche" className="result exp-box fishing-box" id="fishing-panel" cardComponent={Card} />;
}

function Body({ status: state, id, sh, dom, known: known }) {
  if (state === 'attente') {
    return (
      <>
        <div className="pe-eau">
          <span className="pe-bouchon" />
        </div>
        <p className="d">La ligne est à l’eau… Attendez que ça morde, puis ferrez vite !</p>
        <button type="button" className="b b-lg" disabled>
          Ça ne mord pas encore…
        </button>
      </>
    );
  }
  if (state === 'mord') {
    return (
      <>
        <div className="pe-eau mord">
          <span className="pe-bouchon" />
        </div>
        <p className="pe-alerte">Ça mord !</p>
        <button type="button" className="b b-gold b-lg" data-fishing-panel="ferrer">
          Ferrer !
        </button>
      </>
    );
  }
  if (state === 'rate') {
    return (
      <>
        <div className="pe-eau" />
        <p className="d">Trop tard : il s’est échappé.</p>
        <button type="button" className="b b-gold" data-fishing-panel="lancer">
          Relancer la ligne
        </button>
      </>
    );
  }
  if (state !== 'prise') {
    return null;
  }
  const m = BY[id];
  return (
    <>
      <div className={'pe-prise' + (sh ? ' shiny' : '')} style={sh ? parseStyle(shinyStyle(id)) : undefined}>
        <Html html={crestSmall(m)} />
      </div>
      <p className="enc-t">
        {dom ? (
          <>
            <Html html={DOMINANT_CROWN_SVG} />
            Un gros {m.n} Dominant !
          </>
        ) : sh ? (
          <>
            <Html html={SPARK} /> Un {m.n} chromatique mord à l’hameçon !
          </>
        ) : (
          `Un ${m.n} mord à l’hameçon !`
        )}
      </p>
      <div className="sh-tags">
        {m.t.map(t => (
          <Html key={t} html={tb(t)} />
        ))}
      </div>
      <div className="enc-a">
        <button type="button" className="b" data-fishing-panel="relacher">
          Relâcher
        </button>
        <button type="button" className="b b-gold" data-fishing-panel="combat">
          {known ? 'Combattre' : 'Combattre pour le capturer'}
        </button>
      </div>
    </>
  );
}

function Card({ route, catches: catches, ...p }) {
  return (
    <Dialogue className="sv-card exp-card pe-card" titre="peT" closeAttrs={{ 'data-fishingPanel': 'x' }}>
      <p className="kick">{route} · pêche</p>
      <h2 className="h2" id="peT">
        Pêche
      </h2>
      <Body {...p} />
      <p className="pe-n">
        {catches} prise{catches > 1 ? 's' : ''} au total
      </p>
    </Dialogue>
  );
}
