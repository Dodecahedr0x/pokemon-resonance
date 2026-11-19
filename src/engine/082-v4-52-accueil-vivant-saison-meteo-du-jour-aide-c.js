/* Section d'origine : v4.52 : accueil vivant (saison, météo du jour) · aide contextuelle en combat */

import { RX, WEATHER } from './004-01-donnees.js';
import { TAL } from './005-02-capacites.js';
import { BY, WXN } from './009-03-pokemon.js';
import { ROLEFX } from './012-06-recrues-roles-synergies.js';
import { byUid } from './021-14-moteur-combat.js';
import { B, ui } from './024-17-interface-combat.js';
import { tileTip } from './026-20-campagne-tutoriel-son.js';
import { overlay } from './030-24-prestige-mise-en-scene.js';
import { fermer } from '../screens/overlays/tempStore.js';
import { meteoJour417 } from './057-v4-17-01-compagnons-et-resonance.js';
import { FX448 } from './079-v4-48-immersion-sons-par-type-cris-vibrations-en.js';



/* ---------- 1. accueil vivant ---------- */
function saison450() {
  const m = new Date().getMonth();
  return m >= 2 && m <= 4 ? 'printemps' : m >= 5 && m <= 7 ? 'ete' : m >= 8 && m <= 10 ? 'automne' : 'hiver';
}


/** Saison et météo du jour sur le héros de l'Accueil (rendu : src/screens/accueil/Heros.jsx). */
export function vivant450() {
  const wx = FX448() ? meteoJour417() : null,
    se = FX448() ? saison450() : '';
  if (!se) return null;
  return { se, wx, txt: SNOM450[se] + (wx ? ' · ' + CIEL450[wx] : '') };
}


/* ---------- 2. aide contextuelle en combat ---------- */
// données de l'aide (rendu : src/screens/overlays/temporaires/Fenetres.jsx, Aide452)
function aide452() {
  const u = ui.sel != null ? byUid(B, ui.sel) : null,
    out = { sel: null, terr: [], wx: null, rx: [] };
  if (u && BY[u.id]) {
    const m = BY[u.id],
      roles = [m.r, m.r2].filter((r, k, a) => r && a.indexOf(r) === k),
      tl = TAL[u.tal];
    out.sel = { n: u.n, roles: roles.map(r => [r, ROLEFX[r] ? [ROLEFX[r].k, ROLEFX[r].d] : null]), tal: tl ? [tl[0], tl[1]] : null };
  }
  const seen = [];
  Object.keys(B.tiles || {}).forEach(k => {
    const t = B.tiles[k];
    const kind = t.pil ? 'pil' : t.rock ? 'rock' : t.w ? 'w' : t.lava > 0 ? 'lava' : t.mud > 0 ? 'mud' : t.fog > 0 ? 'fog' : t.grass ? 'grass' : t.sand ? 'sand' : t.trap ? 'trap' : t.mark ? 'mark' : '';
    if (kind && !seen.some(x => x[0] === kind)) seen.push([kind, k]);
  });
  const nom = { pil: 'Pilier', rock: 'Rocher', w: 'Eau', lava: 'Lave', mud: 'Boue', fog: 'Brouillard', grass: 'Hautes herbes', sand: 'Sable', trap: 'Piège', mark: 'Marque' };
  out.terr = seen.map(([kd, k]) => [nom[kd], tileTip(k)]);
  if (B.wx && B.wx.k) {
    const W = WEATHER.find(x => (WXN[B.wx.k] || '').toLowerCase().startsWith(x.n.toLowerCase().slice(0, 4)));
    if (W) out.wx = { n: W.n, tours: B.wx.n, d: W.d };
  }
  out.rx = Object.keys(RX).map(k => [RX[k].n, RX[k].d]);
  return out;
}


function ouvrirAide452() {
  if (!B) return;
  const o = overlay('hp452', aide452());
  o.addEventListener('click', e => {
    if (e.target === o) fermer('hp452');
  });
}

const SNOM450 = { printemps: 'Printemps', ete: 'Été', automne: 'Automne', hiver: 'Hiver' };


const CIEL450 = { pluie: 'pluie', soleil: 'soleil', grele: 'grêle', sable: 'sable' };

// Instructions exécutées au démarrage, dans l'ordre d'origine (voir index.js).
export function __init() {

document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('[data-b452]');
  if (!b) return;
  if (b.dataset.b452 === 'help') ouvrirAide452();
  else if (b.dataset.b452 === 'close') fermer('hp452');
});


document.addEventListener('keydown', e => {
  if (e.key === 'Escape') fermer('hp452');
});

}
