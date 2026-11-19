import { memo, useEffect } from 'react';
import { placeAlert } from '../../engine/017-home-route.js';
import { useRoute } from './homeStore.js';

// Route 29 (#route), montée sous la carte (page Carte, .v4-route-slot) : décor des hautes herbes, alerte « ! », moment de la journée.
// Le décor est fixe (ancien buildRoute) : ses animations (herbes, nuages, étoiles,
// lucioles) sont en CSS, rien n'est redessiné image par image. Le moteur garde :
// - les écouteurs délégués (#rustle, #rtAlert, #todBtns) ;
// - placeAlert(), qui place #rtAlert (style left/top, classe « on ») ;
// - la classe « shake » de #route à chaque rencontre ;
// - le texte qui s'écrit lettre à lettre dans #dlgTxt (jamais rendu avec des enfants ici) ;
// Le reste (data-time, data-saison, boutons pressés, bandeau #rr450, nom de la route)
// est poussé par le moteur dans le store (setRoute).

const W = 1200;
const TODB = [
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
  d: `${(i % 9) * 0.45}s`,
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

const GRASS = [];
for (let row = 0; row < 2; row++) {
  const y = 196 + row * 22,
    s = 0.9 + row * 0.25;
  for (let x = -24; x < W; x += 26 * s) {
    if (x > 290 && x < 400) continue;
    if (x > 760 && x < 960) continue;
    GRASS.push({ d: `${((((x * 7 + row * 13) % 30) + 30) % 30) / 10}s`, path: tuftD(x, y, s), c: row % 2 ? 'g2' : 'g1' });
  }
}

const RUSTLE = [
  ...Array.from({ length: 8 }, (_, i) => [tuftD(762 + i * 24, 206, 1.25), i % 2 ? 'g2' : 'g1']),
  ...Array.from({ length: 7 }, (_, i) => [tuftD(774 + i * 25, 222, 1.4), i % 2 ? 'g1' : 'g2']),
];

const FIRE = Array.from({ length: 16 }, (_, i) => ({ cx: (i * 71) % W, cy: 150 + ((i * 37) % 60), d: `${(i % 7) * 0.7}s` }));

// Décor fixe : jamais redessiné (le moteur a branché ses écouteurs sur #rustle).
const RouteSvg = memo(function RouteSvg() {
  return (
    <svg id="routeSvg" viewBox="0 0 1200 220" preserveAspectRatio="xMidYMax slice" role="img" aria-label="Route 29 : hautes herbes au pied des collines">
      <defs>
        <linearGradient id="rSky" x1={0} y1={0} x2={0} y2={1}>
          <stop offset="0" style={{ stopColor: 'var(--sk1)' }} />
          <stop offset=".7" style={{ stopColor: 'var(--sk2)' }} />
          <stop offset="1" style={{ stopColor: 'var(--sk3)' }} />
        </linearGradient>
        <radialGradient id="rSun">
          <stop offset="0" style={{ stopColor: 'var(--sun)', stopOpacity: 1 }} />
          <stop offset="1" style={{ stopColor: 'var(--sun)', stopOpacity: 0 }} />
        </radialGradient>
      </defs>
      <rect width={W} height={220} fill="url(#rSky)" />
      <g className="sc-stars">
        {STARS.map((s, i) => (
          <circle key={i} cx={s.cx} cy={s.cy} r={s.r} style={{ animationDelay: s.d }} />
        ))}
      </g>
      <g>
        <circle cx={1010} cy={52} r={80} fill="url(#rSun)" />
        <circle className="sc-sun" cx={1010} cy={52} r={20} />
        <circle className="sc-moonc" cx={1019} cy={45} r={18} />
      </g>
      <g className="sc-clouds">
        {CLOUDS.map(([x, y, s], i) => (
          <g key={i} transform={`translate(${x} ${y}) scale(${s})`}>
            <g className="sc-cloud" style={{ animationDuration: `${70 + i * 16}s`, animationDelay: `${-i * 13}s` }}>
              {PUFFS.map(([cx, cy, r], j) => (
                <circle key={j} cx={cx} cy={cy} r={r} />
              ))}
            </g>
          </g>
        ))}
      </g>
      <path className="sc-m1" d="M0 120 L110 70 L190 98 L300 48 L392 92 L470 66 L560 104 L660 60 L760 96 L860 52 L960 100 L1060 72 L1200 104 V220 H0Z" />
      <path className="sc-snow" d="M282 56 L300 48 L318 60 L306 58 L298 64 L290 58Z M845 60 L860 52 L876 62 L866 60 L858 66 L852 61Z" />
      <path className="sc-h1" d="M0 140 Q160 108 330 132 T700 126 T1200 118 V220 H0Z" />
      <g className="sc-forest">
        {TREES.flatMap(({ x, y, r }, i) => [
          <rect key={'t' + i} className="trunk" x={x - 2} y={y} width={4} height={10} />,
          <circle key={'c' + i} cx={x} cy={y - 5} r={r} />,
          <circle key={'h' + i} className="hl" cx={x - r * 0.3} cy={y - 5 - r * 0.38} r={r * 0.42} />,
        ])}
      </g>
      <path className="sc-field" d="M0 168 Q300 150 600 170 T1200 160 V220 H0Z" />
      <path className="sc-path" d="M300 220 C330 196 280 184 360 172 L392 170 C340 182 380 198 360 220Z" />
      <g className="sc-grass">
        {GRASS.map((g, i) => (
          <g key={i} className="sway" style={{ animationDelay: g.d }}>
            <path className={g.c} d={g.path} />
          </g>
        ))}
      </g>
      <g className="sc-rustle" id="rustle" tabIndex={0} role="button" aria-label="Les hautes herbes bougent : rencontrer un Pokémon sauvage">
        <rect x={760} y={140} width={200} height={80} fill="transparent" />
        <g className="rs">
          {RUSTLE.map(([d, c], i) => (
            <path key={i} className={c} d={d} />
          ))}
        </g>
        <g transform="translate(860 132)">
          <g className="sc-alert">
            <rect x={-13} y={-15} width={26} height={28} rx={6} />
            <text y={6} textAnchor="middle">!</text>
          </g>
        </g>
      </g>
      <g className="sc-fire">
        {FIRE.map((f, i) => (
          <circle key={i} cx={f.cx} cy={f.cy} r={1.8} style={{ animationDelay: f.d }} />
        ))}
      </g>
    </svg>
  );
});

export default function Route() {
  const { tod, pressed, saison: season, sign, rr } = useRoute();
  // replace l'alerte « ! » quand la route change de taille
  useEffect(() => {
    const r = document.getElementById('route');
    if (!r || !window.ResizeObserver) return;
    const o = new ResizeObserver(() => placeAlert());
    o.observe(r);
    return () => o.disconnect();
  }, []);
  return (
    <div className="route" id="route" data-time={tod} data-saison={season ?? undefined}>
      {rr && (
        <p id="rr450" className="rr450">
          <b>{rr.head}</b>
          {rr.list ? ` · plus de chances : ${rr.list}` : ''}
        </p>
      )}
      <RouteSvg />
      <button type="button" className="rt-alert" id="rtAlert" aria-label="Les hautes herbes bougent : rencontrer un Pokémon sauvage"><span>!</span></button>
      <div className="rt-ui">
        <div className="rt-top">
          <span className="rt-sign">{sign}</span>
          <div className="tod" id="todBtns" role="group" aria-label="Moment de la journée">
            {TODB.map(([k, n]) => (
              <button key={k} type="button" data-tod={k} aria-pressed={pressed ? String(tod === k) : undefined}>{n}</button>
            ))}
          </div>
        </div>
        <div className="dlg" aria-live="polite"><span className="dlg-n">Hautes herbes</span><p id="dlgTxt" /></div>
      </div>
    </div>
  );
}
