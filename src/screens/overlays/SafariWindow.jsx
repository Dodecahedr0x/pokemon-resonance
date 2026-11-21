import { Html, parseStyle } from '../../lib/html.jsx';
import { Box, Dialogue } from './Window.jsx';
import { POKEMON } from '../../engine/pokemon/pokemon.js';
import { typeBadge } from '../../engine/core/utils.js';
import { crestSmall } from '../../engine/team/team.js';
import { shinyStyle } from '../../engine/pokemon/shiny.js';

import Button from '../../components/Button.jsx';
// Safari Park (#safariPanel). The engine (058) computes the visit state (catch and
// flee chances, message) and keeps the clicks (data-safari-panel) and the hidden attribute.
export default function SafariWindow() {
  return <Box displayName="safari" className="modal is-raised" id="safari-panel" cardComponent={Card} />;
}

// Percentage gauge (catch, flee).
function Gauge({ v, c }) {
  const p = Math.round(v * 100);
  return (
    <span
      className="safari-gauge"
      style={{ background: `linear-gradient(90deg,${c} 0 ${p}%,rgba(255,255,255,.12) ${p}% 100%)` }}
      role="img"
      aria-label={`${p} %`}
    />
  );
}

function Card({
  stepCount: stepSize,
  balls,
  isTaken: takenSet,
  fini: isFinished,
  x,
  mood: hum,
  caughtCount: capt,
  flee: flee,
  msg,
}) {
  const m = x && POKEMON[x.id];
  return (
    <Dialogue className="dialog-card is-compact safari-card" titre="sfT" closeAttrs={{ 'data-safari-panel': 'x' }}>
      <p className="kicker">Parc Safari</p>
      <h2 className="section-title" id="sfT">
        {x ? m.n : 'Les herbes du Parc'}
      </h2>
      <div className="safari-counters">
        <span>{stepSize} pas</span>
        <span>{balls} Safari Balls</span>
        <span>
          {takenSet} capture{takenSet > 1 ? 's' : ''}
        </span>
      </div>
      {x ? (
        <>
          <div
            className={'safari-pokemon' + (x.sh ? ' shiny' : '')}
            style={x.sh ? parseStyle(shinyStyle(x.id)) : undefined}
          >
            <Html html={crestSmall(m)} />
          </div>
          <div className="sh-tags">
            {m.t.map(t => (
              <Html key={t} html={typeBadge(t)} />
            ))}
          </div>
          <p className="safari-mood">{hum}</p>
          <div className="safari-gauges">
            <span>Capture</span>
            <Gauge v={capt} c="#7ac74c" />
            <span>Fuite</span>
            <Gauge v={flee} c="#ee8130" />
          </div>
        </>
      ) : (
        <div className="safari-grass" aria-hidden="true" />
      )}
      <p className="safari-message" aria-live="polite">
        <Html html={msg} />
      </p>
      <div className="safari-actions">
        {isFinished ? (
          <Button variant="primary" data-safari-panel="sortir">
            Quitter le Parc
          </Button>
        ) : x ? (
          <>
            <Button size="small" variant="primary" data-safari-panel="ball" disabled={!balls}>
              Safari Ball
            </Button>
            <Button size="small" data-safari-panel="appat">
              Appât
            </Button>
            <Button size="small" data-safari-panel="caillou">
              Caillou
            </Button>
            <Button size="small" variant="ghost" data-safari-panel="fuir">
              Fuir
            </Button>
          </>
        ) : (
          <>
            <Button variant="primary" data-safari-panel="marcher">
              Avancer dans les herbes
            </Button>
            <Button variant="ghost" data-safari-panel="sortir">
              Quitter le Parc
            </Button>
          </>
        )}
      </div>
    </Dialogue>
  );
}
