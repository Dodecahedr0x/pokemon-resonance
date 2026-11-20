import { memo, useEffect } from 'react';
import { placeAlert } from '../../engine/world/home-route.js';
import { useRoute } from '../home/homeStore.js';

// Route 29 (#route), in the Map's « hautes herbes » section: tall grass scene, « ! » alert, time of day.
// The drawing is fixed (styles in map-route-scene.css); only the grass under the pointer moves. The engine keeps:
// - the delegated listeners (#rustle, #rtAlert, #todBtns);
// - placeAlert(), which places #rtAlert (style left/top, « is-shown » class);
// - the « is-shaking » class of #route on each encounter;
// - the text written letter by letter in #dlgTxt (never rendered with children here);
// The rest (data-time, data-saison, pressed buttons, #route-rates banner, route name)
// is pushed by the engine into the store (setRoute).

const W = 1200;
const TIMES_OF_DAY = [
  ['matin', 'Matin'],
  ['jour', 'Jour'],
  ['nuit', 'Nuit'],
];

const tuftD = (x, y, s) =>
  `M${x.toFixed(1)} ${y} l${4 * s} ${-20 * s} l${3 * s} ${20 * s} l${4 * s} ${-26 * s} l${4 * s} ${26 * s} l${4 * s} ${-18 * s} l${3 * s} ${18 * s}Z`;

const STARS = Array.from({ length: 60 }, (_, i) => ({
  cx: ((i * 137.5) % W).toFixed(0),
  cy: ((i * 41.3) % 100).toFixed(0),
  r: i % 5 === 0 ? 1.4 : 0.8,
}));

const CLOUDS = [
  [90, 46, 0.7],
  [460, 30, 0.55],
  [760, 70, 0.8],
];
const PUFFS = [
  [0, 0, 34],
  [32, -12, 28],
  [62, 0, 30],
  [28, 10, 30],
];

const TREES = Array.from({ length: 42 }, (_, i) => {
  const x = i * 29 + ((i * 53) % 13),
    y = 146 - ((i * 29) % 14),
    r = 11 + ((i * 7) % 7);
  return { x, y, r };
});

const LIGHT = 'route-grass-light',
  DARK = 'route-grass-dark';
const GRASS = [];
for (let row = 0; row < 2; row++) {
  const y = 196 + row * 22,
    s = 0.9 + row * 0.25;
  for (let x = -24; x < W; x += 26 * s) {
    if (x > 290 && x < 400) {
      continue;
    }
    if (x > 760 && x < 960) {
      continue;
    }
    GRASS.push({ path: tuftD(x, y, s), shade: row % 2 ? DARK : LIGHT });
  }
}

const RUSTLE = [
  ...Array.from({ length: 8 }, (_, i) => [tuftD(762 + i * 24, 206, 1.25), i % 2 ? DARK : LIGHT]),
  ...Array.from({ length: 7 }, (_, i) => [tuftD(774 + i * 25, 222, 1.4), i % 2 ? LIGHT : DARK]),
];

// Fixed backdrop: never redrawn (the engine has attached its listeners to #rustle).
const RouteSvg = memo(function RouteSvg() {
  return (
    <svg
      id="routeSvg"
      className="route-drawing"
      viewBox="0 0 1200 220"
      preserveAspectRatio="xMidYMax slice"
      role="img"
      aria-label="Route 29 : hautes herbes au pied des collines"
    >
      <defs>
        <linearGradient id="rSky" x1={0} y1={0} x2={0} y2={1}>
          <stop offset="0" style={{ stopColor: 'var(--route-sky-top)' }} />
          <stop offset=".7" style={{ stopColor: 'var(--route-sky-middle)' }} />
          <stop offset="1" style={{ stopColor: 'var(--route-sky-bottom)' }} />
        </linearGradient>
        <radialGradient id="rSun">
          <stop offset="0" style={{ stopColor: 'var(--route-sun)', stopOpacity: 1 }} />
          <stop offset="1" style={{ stopColor: 'var(--route-sun)', stopOpacity: 0 }} />
        </radialGradient>
      </defs>
      <rect width={W} height={220} fill="url(#rSky)" />
      <g className="route-stars">
        {STARS.map((s, i) => (
          <circle key={i} cx={s.cx} cy={s.cy} r={s.r} />
        ))}
      </g>
      <g>
        <circle cx={1010} cy={52} r={80} fill="url(#rSun)" />
        <circle className="route-sun" cx={1010} cy={52} r={20} />
        <circle className="route-moon" cx={1019} cy={45} r={18} />
      </g>
      <g>
        {CLOUDS.map(([x, y, s], i) => (
          <g key={i} transform={`translate(${x} ${y}) scale(${s})`}>
            <g className="route-cloud">
              {PUFFS.map(([cx, cy, r], j) => (
                <circle key={j} cx={cx} cy={cy} r={r} />
              ))}
            </g>
          </g>
        ))}
      </g>
      <path
        className="route-mountains"
        d="M0 120 L110 70 L190 98 L300 48 L392 92 L470 66 L560 104 L660 60 L760 96 L860 52 L960 100 L1060 72 L1200 104 V220 H0Z"
      />
      <path
        className="route-snow"
        d="M282 56 L300 48 L318 60 L306 58 L298 64 L290 58Z M845 60 L860 52 L876 62 L866 60 L858 66 L852 61Z"
      />
      <path className="route-hills" d="M0 140 Q160 108 330 132 T700 126 T1200 118 V220 H0Z" />
      <g className="route-forest">
        {TREES.flatMap(({ x, y, r }, i) => [
          <rect key={'t' + i} className="route-trunk" x={x - 2} y={y} width={4} height={10} />,
          <circle key={'c' + i} cx={x} cy={y - 5} r={r} />,
          <circle key={'h' + i} className="route-tree-light" cx={x - r * 0.3} cy={y - 5 - r * 0.38} r={r * 0.42} />,
        ])}
      </g>
      <path className="route-field" d="M0 168 Q300 150 600 170 T1200 160 V220 H0Z" />
      <path className="route-path" d="M300 220 C330 196 280 184 360 172 L392 170 C340 182 380 198 360 220Z" />
      <g>
        {GRASS.map((g, i) => (
          <path key={i} className={g.shade} d={g.path} />
        ))}
      </g>
      <g
        className="route-rustle"
        id="rustle"
        tabIndex={0}
        role="button"
        aria-label="Les hautes herbes bougent : rencontrer un Pokémon sauvage"
      >
        <rect x={760} y={140} width={200} height={80} fill="transparent" />
        <g className="route-rustle-tufts">
          {RUSTLE.map(([d, c], i) => (
            <path key={i} className={c} d={d} />
          ))}
        </g>
      </g>
    </svg>
  );
});

export default function Route() {
  const { tod, pressed, season, sign, rr } = useRoute();
  // repositions the « ! » alert when the route changes size
  useEffect(() => {
    const r = document.getElementById('route');
    if (!r || !window.ResizeObserver) {
      return;
    }
    const o = new ResizeObserver(() => placeAlert());
    o.observe(r);
    return () => o.disconnect();
  }, []);
  return (
    <div className="route-scene" id="route" data-time={tod} data-saison={season ?? undefined}>
      {rr && (
        <p id="route-rates" className="route-rates">
          <b>{rr.head}</b>
          {rr.list ? ` · plus de chances : ${rr.list}` : ''}
        </p>
      )}
      <RouteSvg />
      <button
        type="button"
        className="route-alert"
        id="rtAlert"
        aria-label="Les hautes herbes bougent : rencontrer un Pokémon sauvage"
      >
        <span>!</span>
      </button>
      <div className="route-overlay">
        <div className="route-top">
          <span className="route-sign">{sign}</span>
          <div className="route-time" id="todBtns" role="group" aria-label="Moment de la journée">
            {TIMES_OF_DAY.map(([k, n]) => (
              <button key={k} type="button" data-tod={k} aria-pressed={pressed ? String(tod === k) : undefined}>
                {n}
              </button>
            ))}
          </div>
        </div>
        <div className="route-dialogue" aria-live="polite">
          <span className="route-dialogue-name">Hautes herbes</span>
          <p id="dlgTxt" />
        </div>
      </div>
    </div>
  );
}
