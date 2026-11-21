import { MV } from '../../../engine/data/moves.js';
import { MKT } from '../../../engine/pokemon/pokemon.js';
import { arenaNext, veiled } from '../../../engine/modes/gyms.js';
import { INK, typeGlyphPath, typeColor } from '../../../engine/core/utils.js';
import { affected, byUid, nbrK, reach, targets, unitAt, unitKey, threatZone } from '../../../engine/combat/engine.js';
import { duoTargets } from '../../../engine/combat/items-bonds-ai.js';
import { coverOf, ricoTgt } from '../../../engine/combat/synergies-obstacles.js';
import { B, BG, HC, HP, TILT, tiltS, ui } from '../../../engine/combat/ui.js';
import { fireHazard } from '../../../engine/combat/living-board.js';
import { chargesOnBoard, tacticalDrawing, linksColossi } from '../../../engine/combat/tactics.js';
import { foresightOnBoard } from '../../../engine/moves/epic-tms.js';
import { useBoard } from './boardStore.js';
import { SvgHtml } from './svgHtml.jsx';
import { NamesHigh } from './Units.jsx';
import { PE, lref } from './shared.js';

// Layers redrawn on every renderBoard: elemental marks, rocks, fog, traps,
// obstacles (pillars, tall grass), highlights, covers, ricochets, enemy intents.

const f1 = v => v.toFixed(1);

/** The engine's poly(k, c): thick outline then colored tile. */
export function Poly({ k, c }) {
  const [x, y] = HC(k),
    pt = HP(x, y, BG.S - 3);
  return (
    <>
      <polygon points={pt} className={c + ' highlight-glow'} />
      <polygon points={pt} className={c} />
    </>
  );
}
// tiles to highlight: [tile, class] (React keys are added at the end, since a tile may come back)
const polys = (ks, c, on) => ks.map(k => [k, on ? c + (k === ui.pk ? ' is-picked' : '') : c]);
const toPolys = (l, p) => l.map(([k, c], i) => <Poly key={p + i} k={k} c={c} />);

/* marks, rocks, fog, traps, fire risk; colossus links (v4.8) */
export function Markers() {
  useBoard('marks');
  const o = [];
  if (B) {
    for (const k in B.tiles) {
      const t = B.tiles[k],
        [x, y] = HC(k);
      if (t.mark) {
        const tt = MKT[t.mark.k],
          col = typeColor(tt);
        // tilted board (v4.77): the badge shrinks toward the back and stays within its tile, instead of biting into the tile behind
        const ms = TILT.on ? tiltS(x, y) : 0,
          mz = TILT.on ? 0.37 * ms : 0.46,
          mx = TILT.on ? x + 11.5 * ms - 12 * mz : x + 11,
          my = TILT.on ? y - 6 * ms - 12 * mz : y - 21,
          pt = HP(x, y, BG.S - 5);
        o.push(
          <polygon key={k + 'mf'} points={pt} className="mark-fill" style={{ fill: col }} />,
          <polygon key={k + 'me'} points={pt} className="mark-edge" style={{ stroke: col }} />,
          <g
            key={k + 'mb'}
            className="mark-badge"
            transform={`translate(${mx.toFixed(1)},${my.toFixed(1)}) scale(${mz.toFixed(3)})`}
          >
            <circle cx="12" cy="12" r="12" fill={col} stroke="#0B0D12" strokeWidth="2" />
            <path d={typeGlyphPath(tt)} fill={INK} fillRule="evenodd" transform="translate(4.8 4.8) scale(.6)" />
          </g>
        );
        if (t.mark.lv === 2) {
          o.push(
            <text
              key={k + 'ml'}
              className="mark-level"
              x={(TILT.on ? x - 14 * ms : x - 15).toFixed(1)}
              y={(TILT.on ? y - 3 * ms : y - 11).toFixed(1)}
            >
              ×2
            </text>
          );
        }
      }
      // rock (under a pillar, the pillar replaces it: drawObstacles)
      if (t.rock && !t.pil) {
        o.push(
          <path
            key={k + 'bo'}
            className="boulder"
            d={`M${(x - 14).toFixed(1)} ${(y + 8).toFixed(1)}q-2-12 8-17q8-5 15 1q7 6 5 16q-14 6-28 0Z`}
          />,
          <path
            key={k + 'bh'}
            className="boulder-highlight"
            d={`M${(x - 6).toFixed(1)} ${(y - 6).toFixed(1)}q5-4 11-1`}
          />
        );
      }
      if (t.fog > 0) {
        o.push(
          <polygon
            key={k + 'fg'}
            points={HP(x, y, BG.S - 1)}
            className={'fog-cloud' + (t.fog > 2 ? ' is-toxic' : '')}
          />
        );
      }
      o.push(<SvgHtml key={k + 'dt'} html={tacticalDrawing(B, k, x, y)} />); // traps (v4.8)
      if (B.livingBoard && fireHazard(B, k)) {
        o.push(<polygon key={k + 'fr'} points={HP(x, y, BG.S - 4)} className="fire-risk" />);
      } // the grass about to burn (v4.7-01)
    }
  }
  return (
    <g style={PE} ref={lref('marks')}>
      {B && <SvgHtml html={linksColossi(B)} />}
      {o}
    </g>
  );
}

/* obstacles: pillars and tall grass (behind, then in front of the Pokémon) */
function Pillar({ x, y }) {
  return (
    <g className="pillar-obstacle">
      <ellipse className="pillar-shadow" cx={f1(x)} cy={f1(y + 12)} rx="16" ry="4.6" />
      <path className="pillar-base" d={`M${f1(x - 14)} ${f1(y + 13)}h28l-2.4-5.4h-23.2Z`} />
      <rect className="pillar-shaft" x={f1(x - 9)} y={f1(y - 21)} width="18" height="29.5" />
      <path
        className="pillar-flutes"
        d={`M${f1(x - 4.5)} ${f1(y - 20)}v27M${f1(x)} ${f1(y - 20)}v27M${f1(x + 4.5)} ${f1(y - 20)}v27`}
      />
      <rect className="pillar-ring" x={f1(x - 9)} y={f1(y - 7)} width="18" height="2.6" />
      <path className="pillar-capital" d={`M${f1(x - 12.5)} ${f1(y - 20.5)}h25l2.2-5.2h-29.4Z`} />
      <ellipse className="pillar-top" cx={f1(x)} cy={f1(y - 25.8)} rx="14.8" ry="3.6" />
    </g>
  );
}
function BackGrass({ x, y }) {
  const s = [];
  for (let i = 0; i < 9; i++) {
    const bx = x - 14 + i * 3.4,
      h = 10 + ((i * 7) % 5) * 2.2,
      lean = (((i * 5) % 3) - 1) * 1.6;
    s.push(
      <path
        key={i}
        className={'grass-blade-back' + (i % 2 ? ' is-alternate' : '')}
        d={`M${f1(bx)} ${f1(y + 9)}L${f1(bx + 1.6 + lean)} ${f1(y + 9 - h)}L${f1(bx + 3.3)} ${f1(y + 9)}Z`}
      />
    );
  }
  return <g className="grass-back">{s}</g>;
}
function FrontGrass({ x, y }) {
  const s = [];
  for (let i = 0; i < 7; i++) {
    const bx = x - 14 + i * 4.4,
      h = 5 + ((i * 3) % 4) * 1.6,
      lean = (((i * 7) % 3) - 1) * 1.4;
    s.push(
      <path
        key={i}
        className={'grass-blade-front' + (i % 2 ? ' is-alternate' : '')}
        d={`M${f1(bx)} ${f1(y + 15)}L${f1(bx + 1.5 + lean)} ${f1(y + 15 - h)}L${f1(bx + 3)} ${f1(y + 15)}Z`}
      />
    );
  }
  return <g className="grass-front">{s}</g>;
}

export function Obstacles({ front }) {
  useBoard('obs');
  const o = [];
  if (B) {
    for (const k in B.tiles) {
      const t = B.tiles[k];
      if (!t.pil && !(t.grass && !t.rock)) {
        continue;
      }
      const [x, y] = HC(k);
      if (front) {
        if (!t.pil) {
          o.push(<FrontGrass key={k} x={x} y={y} />);
        }
      } else {
        o.push(t.pil ? <Pillar key={k} x={x} y={y} /> : <BackGrass key={k} x={x} y={y} />);
      }
    }
  }
  return (
    <g style={PE} ref={lref(front ? 'obsF' : 'obs')}>
      {o}
    </g>
  );
}

// cover behind a rock or a pillar (drawObstacles)
function Shield({ k, cls }) {
  const [x, y] = HC(k);
  return (
    <g className={'cover-shield ' + cls} transform={`translate(${f1(x - 18)},${f1(y - 15)})`}>
      <path d="M0 -5.5 5 -3.4V1c0 3.4-2.2 5.4-5 6.6C-2.8 6.4-5 4.4-5 1V-3.4Z" />
    </g>
  );
}

// covers, ricochets, post-hit movement reminder (drawObstacles)
function extras() {
  const ex = [];
  const u = ui.sel && byUid(B, ui.sel),
    vl = veiled(B);
  if (u && !u.ko && B.phase === 'player' && !ui.busy && !B.over) {
    B.units.forEach(e => {
      if (e.side === 'e' && !e.ko && coverOf(B, u.pos, e.pos)) {
        ex.push(<Shield key={'ce' + e.uid} k={unitKey(e)} cls="is-enemy" />);
      }
    });
    if (ui.mode === 'target') {
      const m = MV[u.mv[ui.mi]];
      if (m.sh === 'one') {
        targets(B, u, m).forEach(k => {
          if (!B.tiles[k].rock) {
            return;
          }
          const r = ricoTgt(B, u, k);
          if (!r) {
            return;
          }
          const A = HC(unitKey(u)),
            R = HC(k),
            T = HC(r);
          ex.push(
            <polyline
              key={'ri' + k}
              className={'ricochet-line' + (ui.pk === k ? ' is-picked' : '')}
              points={`${f1(A[0])},${f1(A[1])} ${f1(R[0])},${f1(R[1])} ${f1(T[0])},${f1(T[1])}`}
            />,
            <circle key={'rp' + k} className="ricochet-point" cx={f1(R[0])} cy={f1(R[1] - 4)} r="2.6" />
          );
        });
      }
    }
    if (u.hr && u.acted && !u.moved && !ui.mode) {
      ex.push(...toPolys(polys(Object.keys(reach(B, u)), 'highlight-reach'), 'hr'));
    }
  }
  if (!vl) {
    B.units.forEach(e => {
      if (e.side !== 'e' || e.ko || !e.intent) {
        return;
      }
      const m = MV[e.intent.mv];
      if (m.sh !== 'one' && m.sh !== 'line') {
        return;
      }
      affected(B, e, m, e.intent.k).forEach(k => {
        const v = unitAt(B, k);
        if (v && v.side === 'a' && coverOf(B, e.pos, v.pos)) {
          ex.push(<Shield key={'ca' + e.uid + k} k={k} cls="is-ally" />);
        }
      });
    });
  }
  return ex;
}

/* highlights: gym rule, dangers, threat, targets, preview, dodge, movement */
export function Highlights() {
  useBoard('hl');
  const hl = [];
  if (B) {
    const u = ui.sel && byUid(B, ui.sel),
      vl = veiled(B),
      an = arenaNext(B);
    if (an) {
      hl.push(...polys(an.tiles, 'highlight-arena'));
    }
    B.units.forEach(e => {
      if (!vl && e.side === 'e' && !e.ko && e.intent) {
        hl.push(...polys(affected(B, e, MV[e.intent.mv], e.intent.k), 'highlight-danger'));
      }
    });
    // v4.12: the hit opponent shows its threat zone (everything it can strike after moving)
    const eSel = B.jit && ui.selE && byUid(B, ui.selE);
    if (eSel && !eSel.ko && eSel.side === 'e' && !eSel.done && !B.over) {
      hl.push(...polys(threatZone(B, eSel), 'highlight-threat'));
    }
    if (u && !u.ko && B.phase === 'player' && !ui.busy && !B.over) {
      if (ui.mode === 'duo' && ui.duo) {
        hl.push(...polys(duoTargets(B, u, byUid(B, ui.duo)), 'highlight-target', true));
        if (ui.pv) {
          hl.push(...polys(ui.pv.aff, 'highlight-affected'));
        }
      } else if (ui.mode === 'target') {
        hl.push(...polys(targets(B, u, MV[u.mv[ui.mi]]), 'highlight-target', true));
        if (ui.pv) {
          hl.push(...polys(ui.pv.aff, 'highlight-affected'));
        }
      } else if (ui.mode === 'dodge') {
        hl.push(
          ...polys(
            nbrK(unitKey(u)).filter(k => !B.tiles[k].rock && !unitAt(B, k)),
            'highlight-dodge'
          )
        );
      } else if (!u.moved && !u.acted) {
        hl.push(...polys(Object.keys(reach(B, u)), 'highlight-reach'));
      }
    }
  }
  return (
    <g style={PE} ref={lref('hl')}>
      {toPolys(hl, 'h')}
      {B && <SvgHtml html={chargesOnBoard(B) + foresightOnBoard(B)} />}
      {B && extras()}
    </g>
  );
}

/* enemy intents: curved arrows toward the targeted tile */
export function Intentions() {
  useBoard('hl');
  const o = [];
  if (B && !veiled(B)) {
    B.units.forEach(e => {
      if (e.side !== 'e' || e.ko || !e.intent) {
        return;
      }
      const a = HC(unitKey(e)),
        b = HC(e.intent.k),
        dx = b[0] - a[0],
        dy = b[1] - a[1],
        Ln = Math.hypot(dx, dy) || 1,
        ux = dx / Ln,
        uy = dy / Ln;
      const sx = a[0] + ux * 18,
        sy = a[1] + uy * 18,
        ex = b[0] - ux * 8,
        ey = b[1] - uy * 8,
        mx = (sx + ex) / 2 - uy * 12,
        my = (sy + ey) / 2 + ux * 12;
      o.push(
        <path
          key={e.uid}
          className={'intent-arrow' + (ui.selE === e.uid ? ' is-selected' : '')}
          d={`M${sx.toFixed(1)} ${sy.toFixed(1)}Q${mx.toFixed(1)} ${my.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}`}
          markerEnd="url(#iArr)"
        />
      );
    });
  }
  return (
    <g style={PE} ref={lref('int')}>
      {o}
    </g>
  );
}

/* v4.44: tile shown by the magnifier (layer created on first use) */
export function Magnifier() {
  const S = useBoard('insp');
  if (S.insp === undefined) {
    return null;
  }
  return (
    <g id="inspect-tile" style={PE}>
      {S.insp != null && B && <Poly k={S.insp} c="highlight-inspected" />}
    </g>
  );
}

/* v4.73: entry and recall Poké Balls (one-off effects placed by the engine) */
export function PkLayer() {
  const S = useBoard('pk');
  return S.pk ? <g className="pokeball-layer" ref={lref('pk73')} /> : null;
}

/* v4.77: Pokémon names above all tokens (NamesHigh, Units.jsx) */
export function Names() {
  const S = useBoard('svg');
  return S.tilt ? (
    <g className="names-high" style={PE} ref={lref('nameTags')}>
      <NamesHigh />
    </g>
  ) : null;
}
