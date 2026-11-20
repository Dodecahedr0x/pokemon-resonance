import { Html, parseStyle } from '../../lib/html.jsx';
import { Box, Dialogue } from './Window.jsx';
import { BY } from '../../engine/pokemon/pokemon.js';
import { tb } from '../../engine/core/utils.js';
import { crestSmall } from '../../engine/team/team.js';
import { shinyStyle } from '../../engine/pokemon/shiny.js';

import Button from '../../components/Button.jsx';
// Safari Park (#safariPanel). The engine (058) computes the visit state (catch and
// flee chances, message) and keeps the clicks (data-safari-panel) and the hidden attribute.
export default function SafariWindow() {
  return <Box displayName="safari" className="result exp-box" id="safari-panel" cardComponent={Card} />;
}

// Percentage gauge (catch, flee).
function Gauge({ v, c }) {
  const p = Math.round(v * 100);
  return (
    <span
      className="sf-j"
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
  const m = x && BY[x.id];
  return (
    <Dialogue className="sv-card exp-card sf-card" titre="sfT" closeAttrs={{ 'data-safariPanel': 'x' }}>
      <p className="kicker">Parc Safari</p>
      <h2 className="h2" id="sfT">
        {x ? m.n : 'Les herbes du Parc'}
      </h2>
      <div className="sf-k">
        <span>{stepSize} pas</span>
        <span>{balls} Safari Balls</span>
        <span>
          {takenSet} capture{takenSet > 1 ? 's' : ''}
        </span>
      </div>
      {x ? (
        <>
          <div className={'sf-poke' + (x.sh ? ' shiny' : '')} style={x.sh ? parseStyle(shinyStyle(x.id)) : undefined}>
            <Html html={crestSmall(m)} />
          </div>
          <div className="sh-tags">
            {m.t.map(t => (
              <Html key={t} html={tb(t)} />
            ))}
          </div>
          <p className="sf-h">{hum}</p>
          <div className="sf-m">
            <span>Capture</span>
            <Gauge v={capt} c="#7ac74c" />
            <span>Fuite</span>
            <Gauge v={flee} c="#ee8130" />
          </div>
        </>
      ) : (
        <div className="sf-herbe" aria-hidden="true" />
      )}
      <p className="sf-msg" aria-live="polite">
        <Html html={msg} />
      </p>
      <div className="sf-a">
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
