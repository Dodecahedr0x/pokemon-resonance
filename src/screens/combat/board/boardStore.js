import { channel } from '../../../lib/store.js';

// Battle board (#bSvg): one channel per layer, so a render only rebuilds what
// changed. The engine keeps its functions (buildBoard, renderBoard…) which call this
// store; rendering is synchronous (flushSync): the engine re-reads the board right after.
//   svg    : board construction (new game, rotation…) → all layers remounted
//   tiles  : cells (classes, tooltips) and textures; marks, hl, obs: per-render layers
//   pv     : v4.71 painting (classes tex471/deco471); paint: painted image and waves
//   tilt   : v4.77 dressing (bases, markers, light); eau: water reflections
//   insp   : magnifier cell (v4.44); pk: Poké Ball layer (v4.73); evo: #evoFx

const fresh = (n, patch) => ({
  n, // build number
  vb: [430, 286],
  bio: null,
  stadium: false,
  tilt: false,
  pv: false, // v4.71 painting layers placed
  pvHref: null,
  waves: [],
  tex477: [], // painted textures loaded (patterns replaced by the image)
  lip: null, // cell bases (points)
  ax: null, // markers realigned on the tilted board: [text, x, y]
  hz: null, // horizon haze: [y1, y2]
  night: false,
  eau: null, // { id, keys, isNight, isFixed }
  insp: undefined, // undefined: layer absent; null: empty; otherwise the cell
  pk: false,
  ...patch
});

let S = fresh(0);
let EVO = { on: false, fast: false, ox: null, oy: null, fx: null };

const versions = {}; // one version per layer
const chan = channel();
function emit(names) {
  names.forEach(n => (versions[n] = (versions[n] || 0) + 1));
  chan.emit();
}
const follow = name => chan.use(() => versions[name] || 0);

export const getBoard = () => S;
export function useBoard(name) {
  follow(name);
  return S;
}

/** New board: like the old svg.innerHTML = '', all layers restart from zero. */
export function boardBuild(patch) {
  S = fresh(S.n + 1, patch);
  emit(['svg']);
}

/** Changes part of the board state and redraws the named layers. */
export function boardSet(patch, ...names) {
  S = { ...S, ...patch };
  emit(names);
}

/** renderBoard: cells, marks, highlights, intents, obstacles. */
export function boardRender() {
  emit(['tiles', 'marks', 'hl', 'obs']);
}

/* ---------- #bBoard: the container and its children outside the SVG ---------- */
// cls: #bBoard classes in the order classList used to place them (an addition goes to the end);
// ac, bg477: variables --ac and --bg477; ph: data-ph (time of the live board).
// Children: clouds and dust (v4.77), sky (v4.30), toolbar (v4.44, if it is not
// in the bottom bar), weather (v4.48), particles (v4.71), effects canvas, sky announcement,
// round banner, backdrop fade. Each is created on first use, as before.
let H = {
  cls: ['board'],
  ac: undefined,
  bg477: undefined,
  ph: undefined,
  cs477: false,
  amb477: null, // { k, h, c, items }
  ciel: null, // { co, ic, ti, w, displayName, wind }
  bt444: null, // { foot, fs, lp, ct }
  wx448: null, // animated weather: key
  amb471: null, // { k, items }
  fxc: false,
  skyBanner: null, // { ic, heading, text, on }
  tbn: null, // { n, en, fast, txt, sub }
  fade: null // { n, bg, va }
};

export const getHost = () => H;
export function useHost() {
  follow('host');
  return H;
}
export function hostSet(patch) {
  H = { ...H, ...patch };
  emit(['host']);
}

/** classList.toggle(name, on) on #bBoard, rendered by React (class order preserved). */
export function bdClass(displayName, on) {
  const a = H.cls.includes(displayName);
  if (on === undefined) on = !a;
  if (on === a) return;
  hostSet({ cls: on ? [...H.cls, displayName] : H.cls.filter(c => c !== displayName) });
}

/** Restarts a class-based animation: removed, layout forced, re-added. */
export function bdReplay(...displayNames) {
  displayNames.forEach(n => bdClass(n, false));
  const bd = document.getElementById('bBoard');
  if (bd) void bd.offsetWidth;
}

/** buildBoard: classes restart from zero (formerly className = …). */
export function bdReset(cls) {
  hostSet({ cls });
}

/* ---------- Pokémon tokens (L.units layer, Units.jsx) ----------
   The engine keeps one model per token (L.u[uid]): classes in the original DOM order,
   transform, ring, HP… Each change redraws the layer, except during a batch
   (renderBoard) which redraws it only once at the end. */
let UB = 0,
  UD = false;
export function unitsDirty() {
  if (UB) UD = true;
  else emit(['units']);
}
export function unitsBatch(f) {
  UB++;
  try {
    return f();
  } finally {
    if (!--UB && UD) {
      UD = false;
      emit(['units']);
    }
  }
}
/** classList.toggle on a token's model: an added class goes to the end, as in the DOM. */
export function tokCl(T, c, on) {
  if (!T || !T.c) return;
  const i = T.c.indexOf(c);
  on = on === undefined ? i < 0 : !!on; // like toggle(c, force): force absent = flip
  if (on === i >= 0) return;
  if (on) T.c.push(c);
  else T.c.splice(i, 1);
  unitsDirty();
}
/** classList.contains on a token's model */
export const tokHas = (T, c) => !!(T && T.c && T.c.includes(c));

/* ---------- #evoFx: evolution cinematic ---------- */
export function useEvo() {
  follow('evo');
  return EVO;
}
export function evoSet(patch) {
  EVO = { ...EVO, ...patch };
  emit(['evo']);
}
