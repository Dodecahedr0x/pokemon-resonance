import { useLayoutEffect, useRef } from 'react';
import { DIA, L } from '../../../engine/024-17-interface-combat.js';
import { tokArtErr, tokArtOk } from '../../../engine/041-v4-1-01-illustrations.js';
import { useBoard } from './boardStore.js';
import { PE, lref } from './Terrain.jsx';

// Jetons des Pokémon (calque L.units) : un <g class="tok"> par unité, lu dans le modèle que le
// moteur tient à jour (L.u[uid], voir mkTok / updTokCore). L'ordre suit L.uo (trier() du plateau
// incliné v4.77 : ceux du fond d'abord). Les noms du plateau incliné passent dans le calque .nms477.
// Références gardées par le moteur : T.g (jeton), T.b (groupe animé), T.ring, T.im.

const XL = 'http://www.w3.org/1999/xlink';
const REFS = new WeakMap();
function refs(T) {
  let r = REFS.get(T);
  if (!r)
    REFS.set(
      T,
      (r = {
        g: n => n && (T.g = n),
        b: n => n && (T.b = n),
        ring: n => n && (T.ring = n),
        im: n => (T.im = n)
      })
    );
  return r;
}

/** illustration du Pokémon (tokenArt) ; xlink:href posé comme avant (setAttributeNS sans préfixe) */
function Art({ T, r }) {
  const im = useRef(null),
    [x, y, w] = T.geo;
  useLayoutEffect(() => {
    if (T.href && im.current) im.current.setAttributeNS(XL, 'href', T.href);
  }, [T, T.href]);
  return (
    <image
      ref={n => {
        im.current = n;
        r.im(n);
      }}
      className="tok-im"
      x={x}
      y={y}
      width={w}
      height={w}
      preserveAspectRatio="xMidYMid meet"
      href={T.href || undefined}
      onLoad={() => tokArtOk(T)}
      onError={() => tokArtErr(T)}
    />
  );
}

/* v4.53 : bulles, éclair, glaçons, « z » des statuts */
function St453() {
  return (
    <g className="st453" aria-hidden="true">
      <circle className="b1" cx="-9" cy="2" r="2" />
      <circle className="b2" cx="0" cy="4" r="1.6" />
      <circle className="b3" cx="9" cy="1" r="2.2" />
      <path className="zap" d="M2 -22 -3 -13 1 -13 -2 -5 5 -15 1 -15Z" />
      <polygon className="ice i1" points="-14,-4 -11,-14 -8,-4" />
      <polygon className="ice i2" points="8,-5 11,-15 14,-5" />
      <text className="zz" x="12" y="-16">
        z
      </text>
    </g>
  );
}

const cls = c => (c == null ? undefined : c); // null : pas d'attribut class ; '' : class="" (classList vidé)

function Jeton({ T }) {
  const r = refs(T);
  // style du jeton : teinte chromatique posée à la création, puis la position
  let sty;
  if (T.sh != null || T.tr != null) {
    sty = {};
    if (T.sh != null) sty['--sh'] = T.sh;
    if (T.tr != null) sty.transform = T.tr;
  }
  const art = T.imOn && <Art T={T} r={r} />;
  return (
    <g ref={r.g} className={T.c.join(' ')} style={sty} data-s453={T.s453 || undefined}>
      <g ref={r.b} className="tok-b" style={{ animationDelay: T.dl }}>
        <ellipse className="tok-sh" cx="0" cy="14" rx="12" ry="3.6" />
        <circle className="tok-rdy" r="21" />
        <circle className="tok-halo" r="19" />
        <circle className="hp-bg" r="16" />
        <circle className="hp-arc" r="16" transform="rotate(-90)" style={T.ad != null ? { strokeDasharray: T.ad, stroke: T.as } : undefined} />
        <circle ref={r.ring} className={'tok-ring' + (T.hit ? ' hit' : '')} r="12.5" style={T.rs != null ? { stroke: T.rs, fill: T.rf } : undefined} />
        <circle className="tok-rim" r="12.5" />
        <path transform="translate(-7,-7) scale(.5833)" fillRule="evenodd" d={T.gd} style={T.gf != null ? { fill: T.gf } : undefined} />
        <ellipse className="tok-gloss" cx="-3.5" cy="-6" rx="6" ry="3.2" />
        <g className="tok-en">
          {T.pc.map((c, i) => (
            <path key={i} d={DIA} transform={`translate(-21,${-8 + i * 8})`} className={cls(c)} />
          ))}
        </g>
        <g className="tok-ew" transform="translate(18,-14)">
          <circle r="5.6" />
          <path d="M-2.6 1.4 0 -1.6 2.6 1.4" />
        </g>
        {T.w477 && (
          <g className="tok-st477" style={{ animationDelay: T.dl }}>
            {!T.imLoose && art}
          </g>
        )}
        {(T.imLoose || !T.w477) && art}
        <g className={T.bdc} transform="translate(0,-22) rotate(-7)">
          <rect x="-12" y="-4.8" width="24" height="9" rx="1" />
          <rect className="in" x="-10.6" y="-3.4" width="21.2" height="6.2" rx="0.5" />
          <text y="1.7">{T.bt}</text>
        </g>
        {!T.nmO && (
          <text className="tok-nm" y="27">
            {T.n}
          </text>
        )}
        <g className="tok-nt">
          {T.nc.map((c, i) => (
            <circle key={i} cx="22" cy={-2 + i * 8} r="2.9" className={cls(c)} />
          ))}
        </g>
      </g>
      {T.st && <St453 />}
    </g>
  );
}

const ordre = () => (L.uo || []).map(id => L.u && L.u[id]).filter(Boolean);

export function Units() {
  useBoard('units');
  return (
    <g style={PE} ref={lref('units')}>
      {ordre().map(T => (
        <Jeton key={T.uid} T={T} />
      ))}
    </g>
  );
}

/* v4.77 : noms au-dessus de tous les Pokémon (plateau incliné), dans l'ordre où ils y sont passés */
const NMW = ['enemy', 'ally', 'ko', 'hid', 'fog431', 'pk-wait'];
export function NomsHauts() {
  useBoard('units');
  return ordre()
    .filter(T => T.nmO)
    .sort((a, b) => a.nmO - b.nmO)
    .map(T => (
      <g key={T.uid} className={'nmw477' + NMW.map(n => (T.c.includes(n) ? ' ' + n : '')).join('')} style={T.tr != null ? { transform: T.tr } : undefined}>
        <text className="tok-nm" y="27">
          {T.n}
        </text>
      </g>
    ));
}
