import { Fragment, useMemo } from 'react';
import { BH, BW, K, P } from '../../../engine/021-combat-engine.js';
import { B, BG, HC, HP, L, VERT, tiltS } from '../../../engine/024-combat-ui.js';
import { tileTip } from '../../../engine/026-campaign-tutorial-sound.js';
import { fieldSvg } from '../../../engine/027-gym-on-screen.js';
import { useBoard } from './boardStore.js';
import { SvgHtml } from './svgHtml.jsx';
import { PE, lref } from './shared.js';

// Board floor: v4.71 painting, v4.77 bases, cells, textures, stadium terrain, scenery,
// water reflections, light, A–H / 1–6 markers.

// cell references kept by the engine (L.t[k], L.tx[k]): stable functions
const tRefs = {},
  txRefs = {};
const tRef = k => tRefs[k] || (tRefs[k] = n => n && (L.t[k] = n));
const txRef = k => txRefs[k] || (txRefs[k] = n => n && (L.tx[k] = n));

/* v4.71: painted terrain image and waves (before the cells) */
export function Painting() {
  const S = useBoard('paint');
  if (!S.pv) return null;
  const [W, H] = S.vb;
  return (
    <>
      <image className="pv471" x="0" y="0" preserveAspectRatio="none" style={PE} width={W} height={H} href={S.pvHref || undefined} />
      <g className="wv471" style={PE}>
        {S.waves.map(([x, y], i) => (
          <Fragment key={i}>
            <path className="wv" style={{ animationDelay: (-i * 0.9).toFixed(1) + 's' }} d={`M${(x - 9).toFixed(1)} ${(y - 2).toFixed(1)}q3-2.4 6 0t6 0`} />
            <path className="wv" style={{ animationDelay: (-i * 0.9 - 1.6).toFixed(1) + 's' }} d={`M${(x - 3).toFixed(1)} ${(y + 7).toFixed(1)}q3-2.4 6 0t6 0`} />
          </Fragment>
        ))}
      </g>
    </>
  );
}

/* v4.77: earth slab under each cell */
export function Pedestals() {
  const S = useBoard('tilt');
  if (!S.lip) return null;
  return (
    <g className="lip477" style={PE}>
      {S.lip.map((p, i) => (
        <polygon key={i} points={p} />
      ))}
    </g>
  );
}

// class of a cell (renderBoard), with obstacles (drawObstacles: pillar, grass, sand)
function tileClass(k) {
  const t = B.tiles[k],
    pp = P(k);
  let c = 'hx' + ((pp[0] + pp[1]) % 2 ? ' alt' : '');
  if (t.rock) c += ' rock';
  else if (t.w) c += ' river';
  if (t.mud > 0) c += ' mud';
  if (t.lava > 0) c += ' lava';
  if (t.pil) c += ' pillar';
  else if (t.grass && !t.rock) c += ' grass';
  if (t.sand && !t.w && !t.rock) c += ' sand';
  return c;
}

export function Cells() {
  useBoard('tiles');
  return (
    <g ref={lref('tiles')}>
      {B &&
        Object.keys(B.tiles).map(k => {
          const [x, y] = HC(k);
          return (
            <polygon key={k} ref={tRef(k)} points={HP(x, y, BG.S - 1)} data-k={k} className={tileClass(k)}>
              <title>{tileTip(k)}</title>
            </polygon>
          );
        })}
    </g>
  );
}

// texture of a cell: water, sand (drawObstacles) or the location's terrain
function texFill(k) {
  const t = B.tiles[k];
  if (t.sand && !t.w && !t.rock) return 'url(#tx-sand)';
  return `url(#${t.w ? 'tx-water' : L.txId})`;
}

/* textures (the tx class is copied from the cell's states by the engine, v4.77) */
export function Textures() {
  useBoard('tiles');
  const S = useBoard('pv');
  return (
    <g style={PE} className={S.pv ? 'tex471' : undefined} ref={lref('tex')}>
      {B &&
        Object.keys(B.tiles).map(k => {
          const [x, y] = HC(k);
          return (
            <Fragment key={k}>
              <polygon ref={txRef(k)} points={HP(x, y, BG.S - 1.5)} className="tx" fill={texFill(k)} />
              <polygon points={HP(x, y, BG.S - 2.2)} className="bv" />
              <polygon points={HP(x, y, BG.S - 7)} className="gl" />
            </Fragment>
          );
        })}
    </g>
  );
}

/* stadium terrain (gyms, League, canyon) */
export function Terrain() {
  const S = useBoard('svg');
  const h = useMemo(() => (S.stadium ? fieldSvg() : ''), [S.n]);
  return (
    <g className="field" style={PE}>
      <SvgHtml html={h} />
    </g>
  );
}

/* tufts, embers, pebbles, shards: placed once per board */
export function Decor() {
  const S = useBoard('pv');
  const items = useMemo(() => {
    const o = [];
    if (!B) return o;
    for (const k in B.tiles) {
      const t = B.tiles[k],
        [c, r] = P(k),
        [x, y] = HC(k);
      if (t.rock || t.w || (c * 7 + r * 13) % 5) continue;
      if (S.bio === 'gue')
        o.push(<path key={k} className="tuft" d={`M${(x - 7).toFixed(1)} ${(y + 14).toFixed(1)} l3 -9 l2 9 l3 -12 l3 12 l2 -8 l2 8Z`} />);
      else if (S.bio === 'tour') o.push(<circle key={k} className="ember" cx={(x + 8).toFixed(1)} cy={(y + 10).toFixed(1)} r="1.6" />);
      else if (S.bio === 'roche')
        o.push(<path key={k} className="pebble" d={`M${(x - 8).toFixed(1)} ${(y + 13).toFixed(1)} q3 -4 6 0 q3 -3 5 0Z`} />);
      else o.push(<path key={k} className="glint" d={`M${(x + 9).toFixed(1)} ${(y - 12).toFixed(1)}l1 3 3 1-3 1-1 3-1-3-3-1 3-1Z`} />);
    }
    return o;
  }, [S.n]);
  return (
    <g style={PE} className={S.pv ? 'deco471' : undefined}>
      {items}
    </g>
  );
}

/* v4.77: water reflection (light band cut out at the water cells, glints) */
export function Water() {
  const S = useBoard('eau');
  const E = S.eau;
  if (!E) return null;
  const [W, H] = S.vb,
    dx = W * 0.2,
    dy = W * 0.06;
  const gl = [];
  E.cles.forEach(k => {
    const [x, y] = HC(k),
      s = tiltS(x, y),
      n = parseInt(k.replace(/\D/g, ''), 10) || 0;
    for (let i = 0; i < 2; i++) {
      const r = j => ((Math.sin(n * 91.3 + i * 47.7 + j * 13.1) * 43758.5453) % 1 + 1) % 1,
        gx = x + (r(1) - 0.5) * BG.S * 1.1 * s,
        gy = y + (r(2) - 0.5) * BG.S * 0.6 * s,
        rx = (3.6 + r(3) * 2.4) * s;
      gl.push(
        <ellipse
          key={k + i}
          className="gl477"
          cx={gx.toFixed(1)}
          cy={gy.toFixed(1)}
          rx={rx.toFixed(1)}
          ry={(rx * 0.2).toFixed(2)}
          style={{ animationDuration: (2.6 + r(4) * 2.2).toFixed(1) + 's', animationDelay: '-' + (r(5) * 4).toFixed(1) + 's' }}
        />
      );
    }
  });
  return (
    <g className={'eau477' + (E.fixe ? ' fixe' : '')} style={E.cles.length ? PE : { ...PE, display: 'none' }} aria-hidden="true" data-k={E.id}>
      <g clipPath="url(#eau477c)">
        <rect
          className="bande477"
          x={(-dx).toFixed(1)}
          y={(-dy).toFixed(1)}
          width={(W + 2 * dx).toFixed(1)}
          height={(H + 2 * dy).toFixed(1)}
          fill="url(#eau477g)"
          style={{ '--dx': dx.toFixed(1) + 'px', '--dy': dy.toFixed(1) + 'px' }}
        />
      </g>
      <g>{gl}</g>
    </g>
  );
}

/* v4.77: horizon haze and moon tint, cut out to the board */
export function Light() {
  const S = useBoard('tilt');
  if (!S.hz) return null;
  const [W, H] = S.vb;
  return (
    <g className={'lum477' + (S.night ? ' n' : '')} style={PE} clipPath="url(#cp477)">
      <rect className="nuit477" x="0" y="0" width={W} height={H} />
      <rect x="0" y="0" width={W} height={H} fill="url(#hz477)" />
    </g>
  );
}

/* A–H / 1–6 markers; tilted board: realigned to the edge (v4.77) */
export function Landmarks() {
  const S = useBoard('tilt');
  const base = useMemo(() => {
    const o = [];
    if (VERT) {
      for (let r = 0; r < BH; r++) o.push([r + 1, HC(K(0, r))[0], 8]);
      for (let c = 0; c < BW; c++) o.push(['ABCDEFGH'[c], 7, HC(K(c, 0))[1] + 2.5]);
    } else {
      for (let r = 0; r < BH; r++) o.push([r + 1, 8, HC(K(0, r))[1] + 2.5]);
      for (let c = 0; c < BW; c++) o.push(['ABCDEFGH'[c], HC(K(c, 0))[0], 10]);
    }
    return o;
  }, [S.n]);
  return (
    <g style={PE}>
      {(S.ax || base).map(([t, x, y], i) => (
        <text key={i} className="axl" x={x} y={y}>
          {t}
        </text>
      ))}
    </g>
  );
}
