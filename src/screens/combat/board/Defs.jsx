import { B, BOARD_GEOMETRY, cellCenter, cellPoints } from '../../../engine/combat/ui.js';
import { useBoard } from './boardStore.js';

// board <defs>: terrain patterns (texDefs), gradients, intent arrow;
// v4.77: painted textures instead of patterns, horizon haze, cutouts (pedestals, water).

// terrain pattern; painted texture loaded (v4.77): the image replaces the drawing
function Pat({ id, t, w, h, tr, on, children }) {
  return (
    <pattern
      id={id}
      width={on ? 72 : w}
      height={on ? 72 : h}
      patternUnits="userSpaceOnUse"
      patternTransform={on ? 'scale(1 .78)' : tr}
    >
      {on ? <image href={`img/tex-${t}.webp`} width="72" height="72" preserveAspectRatio="none" /> : children}
    </pattern>
  );
}

// painted textures with no original pattern (mud, lava): created at the end of the <defs>
function NewPat({ t }) {
  return (
    <pattern id={'tx-' + t} patternUnits="userSpaceOnUse" width="72" height="72" patternTransform="scale(1 .78)">
      <image href={`img/tex-${t}.webp`} width="72" height="72" preserveAspectRatio="none" />
    </pattern>
  );
}

const BASE = ['grass', 'stone', 'water', 'sand', 'ash', 'marble', 'rune'];

// water reflection: gradient of the light band and cutout at the water cells
function WaterDefs({ E, vb }) {
  const [W] = vb,
    c = E.nuit ? '#cfe0ff' : '#ffffff',
    dx = W * 0.2,
    dy = W * 0.06,
    st = [
      [0, 0],
      [0.36, 0],
      [0.47, E.nuit ? 0.18 : 0.28],
      [0.5, E.nuit ? 0.38 : 0.55],
      [0.53, E.nuit ? 0.18 : 0.28],
      [0.64, 0],
      [1, 0],
    ];
  return (
    <>
      <linearGradient
        id="lake-g"
        gradientUnits="userSpaceOnUse"
        spreadMethod="repeat"
        x1="0"
        y1="0"
        x2={dx.toFixed(1)}
        y2={dy.toFixed(1)}
      >
        {st.map(([o, a], i) => (
          <stop key={i} offset={o} stopColor={c} stopOpacity={a} />
        ))}
      </linearGradient>
      <clipPath id="lake-c">
        {E.keyList.map(k => {
          const [x, y] = cellCenter(k);
          return <polygon key={k} points={cellPoints(x, y, BOARD_GEOMETRY.S - 1)} />;
        })}
      </clipPath>
    </>
  );
}

export default function Defs() {
  const S = useBoard('defs');
  const on = t => S.paintedTextures.includes(t),
    hzc = S.night ? '120,140,200' : '255,236,206';
  return (
    <defs>
      <pattern id="fogP" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <line className="pattern-fog-line" x1="0" y1="0" x2="0" y2="6" />
      </pattern>
      <marker
        id="iArr"
        viewBox="0 0 10 10"
        refX="8"
        refY="5"
        markerWidth="5"
        markerHeight="5"
        orient="auto-start-reverse"
      >
        <path d="M0 0 10 5 0 10Z" className="intent-arrow-head" />
      </marker>
      <Pat id="tx-grass" t="grass" w="16" h="14" on={on('grass')}>
        <path d="M2 13l1.6-6 1 6M8 12l1-7 1.4 7M12.5 13.5l1.2-5 .8 5" className="pattern-blade" />
        <circle cx="6" cy="4" r=".7" className="pattern-seed" />
      </Pat>
      <Pat id="tx-stone" t="stone" w="30" h="22" on={on('stone')}>
        <path d="M0 7h12l4 3h14M4 18h9l3-3h10M20 0v5M9 10v8" className="pattern-crack" />
        <circle cx="25" cy="16" r="1" className="pattern-speck" />
      </Pat>
      <Pat id="tx-ash" t="ash" w="12" h="12" on={on('ash')}>
        <circle cx="3" cy="4" r=".8" className="pattern-ash" />
        <circle cx="9" cy="9" r=".6" className="pattern-ash" />
        <path d="M6 1l1 3-2 2" className="pattern-ash-crack" />
      </Pat>
      <Pat id="tx-marble" t="marble" w="64" h="64" on={on('marble')}>
        <path d="M-4 20C10 14 18 30 34 22S56 6 70 14M-4 52C14 44 24 60 40 50S60 38 70 44" className="pattern-vein" />
        <path d="M20 0C24 10 18 18 26 30" className="pattern-vein-faint" />
      </Pat>
      <Pat id="tx-water" t="water" w="22" h="10" on={on('water')}>
        <path d="M0 5q2.75-3 5.5 0t5.5 0 5.5 0 5.5 0" className="pattern-wave" />
      </Pat>
      <linearGradient id="bev" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="rgba(255,255,255,.22)" />
        <stop offset=".45" stopColor="rgba(255,255,255,0)" />
        <stop offset="1" stopColor="rgba(0,0,0,.45)" />
      </linearGradient>
      <radialGradient id="rockG" cx="38%" cy="30%" r="80%">
        <stop offset="0" stopColor="#8A8F99" />
        <stop offset=".55" stopColor="#4A4F59" />
        <stop offset="1" stopColor="#22252C" />
      </radialGradient>
      <Pat id="tx-rune" t="rune" w="54" h="46.8" on={on('rune')}>
        <path d="M27 4l6 6-6 6-6-6Z M27 9v12 M21 30h12 M24 34l3 4 3-4" className="pattern-rune" />
        <circle cx="6" cy="40" r=".8" className="pattern-speck" />
      </Pat>
      {/* v1.1 · sand and pillars */}
      <Pat id="tx-sand" t="sand" w="18" h="12" on={on('sand')}>
        <rect width="18" height="12" className="pattern-sand" />
        <path d="M0 8q4.5-3 9 0t9 0" className="pattern-sand-ripple" />
        <circle cx="4" cy="3" r=".8" className="pattern-sand-grain" />
        <circle cx="13" cy="4.5" r=".6" className="pattern-sand-grain" />
      </Pat>
      <linearGradient id="pilG" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#24252B" />
        <stop offset=".32" stopColor="#6E6F77" />
        <stop offset=".52" stopColor="#B0B0B7" />
        <stop offset=".78" stopColor="#45464D" />
        <stop offset="1" stopColor="#17181C" />
      </linearGradient>
      {/* v4.77 · tilted board */}
      {S.paintedTextures
        .filter(t => !BASE.includes(t))
        .map(t => (
          <NewPat key={t} t={t} />
        ))}
      {S.hz && (
        <linearGradient id="haze-gradient" x1="0" y1={S.hz[0]} x2="0" y2={S.hz[1]} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={`rgba(${hzc},${S.night ? 0.38 : 0.42})`} />
          <stop offset="1" stopColor={`rgba(${hzc},0)`} />
        </linearGradient>
      )}
      {S.lip && B && (
        <clipPath id="lip-clip">
          {S.lip.map((p, i) => (
            <polygon key={'l' + i} points={p} />
          ))}
          {Object.keys(B.tiles).map(k => {
            const [x, y] = cellCenter(k);
            return <polygon key={k} points={cellPoints(x, y, BOARD_GEOMETRY.S - 1)} />;
          })}
        </clipPath>
      )}
      {S.eau && <WaterDefs E={S.eau} vb={S.vb} />}
    </defs>
  );
}
