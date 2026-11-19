import { canal } from '../../../lib/store.js';

// Plateau de combat (#bSvg) : un canal par calque, pour qu'un rendu ne reconstruise que ce
// qui a changé. Le moteur garde ses fonctions (buildBoard, renderBoard…) qui appellent ce
// store ; le rendu est synchrone (flushSync) : le moteur relit le plateau juste après.
//   svg    : construction du plateau (nouvelle partie, rotation…) → tous les calques remontés
//   tiles  : cases (classes, infobulles) et textures ; marks, hl, obs : calques par rendu
//   pv     : peinture v4.71 (classes tex471/deco471) ; paint : image peinte et vagues
//   tilt   : habillage v4.77 (socles, repères, lumière) ; eau : reflets sur l'eau
//   insp   : case de la loupe (v4.44) ; pk : calque des Poké Balls (v4.73) ; evo : #evoFx

const fresh = (n, patch) => ({
  n, // numéro de construction
  vb: [430, 286],
  bio: null,
  stadium: false,
  tilt: false,
  pv: false, // calques de la peinture v4.71 posés
  pvHref: null,
  waves: [],
  tex477: [], // textures peintes chargées (motifs remplacés par l'image)
  lip: null, // socles des cases (points)
  ax: null, // repères recalés du plateau incliné : [texte, x, y]
  hz: null, // brume de l'horizon : [y1, y2]
  night: false,
  eau: null, // { id, cles, nuit, fixe }
  insp: undefined, // undefined : calque absent ; null : vide ; sinon la case
  pk: false,
  ...patch
});

let S = fresh(0);
let EVO = { on: false, fast: false, ox: null, oy: null, fx: null };

const versions = {}; // une version par calque
const c = canal();
function emit(names) {
  names.forEach(n => (versions[n] = (versions[n] || 0) + 1));
  c.emit();
}
const suivre = name => c.use(() => versions[name] || 0);

export const getBoard = () => S;
export function useBoard(name) {
  suivre(name);
  return S;
}

/** Nouveau plateau : comme l'ancien svg.innerHTML = '', tous les calques repartent de zéro. */
export function boardBuild(patch) {
  S = fresh(S.n + 1, patch);
  emit(['svg']);
}

/** Change une partie de l'état du plateau et redessine les calques nommés. */
export function boardSet(patch, ...names) {
  S = { ...S, ...patch };
  emit(names);
}

/** renderBoard : cases, marques, surbrillances, intentions, obstacles. */
export function boardRender() {
  emit(['tiles', 'marks', 'hl', 'obs']);
}

/* ---------- #bBoard : le conteneur et ses enfants hors du SVG ---------- */
// cls : classes de #bBoard dans l'ordre où classList les posait (un ajout va à la fin) ;
// ac, bg477 : variables --ac et --bg477 ; ph : data-ph (heure du plateau vivant).
// Enfants : nuages et poussière (v4.77), ciel (v4.30), barre d'outils (v4.44, si elle n'est pas
// dans la barre du bas), météo (v4.48), particules (v4.71), toile des effets, annonce du ciel,
// bandeau de manche, fondu du décor. Chacun est créé au premier usage, comme avant.
let H = {
  cls: ['board'],
  ac: undefined,
  bg477: undefined,
  ph: undefined,
  cs477: false,
  amb477: null, // { k, h, c, items }
  ciel: null, // { co, ic, ti, w, nom, vent }
  bt444: null, // { foot, fs, lp, ct }
  wx448: null, // météo animée : clé
  amb471: null, // { k, items }
  fxc: false,
  cielBan: null, // { ic, titre, texte, on }
  tbn: null, // { n, en, fast, txt, sub }
  fondu: null // { n, bg, va }
};

export const getHost = () => H;
export function useHost() {
  suivre('host');
  return H;
}
export function hostSet(patch) {
  H = { ...H, ...patch };
  emit(['host']);
}

/** classList.toggle(nom, on) sur #bBoard, rendu par React (ordre des classes conservé). */
export function bdClass(nom, on) {
  const a = H.cls.includes(nom);
  if (on === undefined) on = !a;
  if (on === a) return;
  hostSet({ cls: on ? [...H.cls, nom] : H.cls.filter(c => c !== nom) });
}

/** Relance une animation par classe : retirée, mise en page forcée, reposée. */
export function bdRejouer(...noms) {
  noms.forEach(n => bdClass(n, false));
  const bd = document.getElementById('bBoard');
  if (bd) void bd.offsetWidth;
}

/** buildBoard : les classes repartent de zéro (ancien className = …). */
export function bdReset(cls) {
  hostSet({ cls });
}

/* ---------- jetons des Pokémon (calque L.units, Units.jsx) ----------
   Le moteur garde un modèle par jeton (L.u[uid]) : classes dans l'ordre du DOM d'origine,
   transformation, anneau, PV… Chaque changement redessine le calque, sauf pendant un lot
   (renderBoard) qui ne le redessine qu'une fois à la fin. */
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
/** classList.toggle sur le modèle d'un jeton : une classe ajoutée va à la fin, comme dans le DOM. */
export function tokCl(T, c, on) {
  if (!T || !T.c) return;
  const i = T.c.indexOf(c);
  on = on === undefined ? i < 0 : !!on; // comme toggle(c, force) : force absente = bascule
  if (on === i >= 0) return;
  if (on) T.c.push(c);
  else T.c.splice(i, 1);
  unitsDirty();
}
/** classList.contains sur le modèle d'un jeton */
export const tokHas = (T, c) => !!(T && T.c && T.c.includes(c));

/* ---------- #evoFx : cinématique d'évolution ---------- */
export function useEvo() {
  suivre('evo');
  return EVO;
}
export function evoSet(patch) {
  EVO = { ...EVO, ...patch };
  emit(['evo']);
}
