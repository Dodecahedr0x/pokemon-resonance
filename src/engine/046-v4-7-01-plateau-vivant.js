/* Section d'origine : v4.7-01-plateau-vivant.js */
import { getHost, hostSet } from '../screens/combat/board/boardStore.js';

import { SCEN } from './009-03-pokemon.js';
import { flies, mDur, nbrK, say, uAt } from './021-14-moteur-combat.js';
import { scSel } from './024-17-interface-combat.js';
import { PREF } from './026-20-campagne-tutoriel-son.js';
import { FOURNISSEURS_DEGATS } from './044-v4-5-01-moteur-tactique.js';
import { pasVent } from './047-v4-8-01-tactique.js';



/** Le réglage du joueur. Le combat guidé du prologue reste toujours classique. */
export function vivantChoisi() {
  return PREF.vivant !== false && !(SCEN[scSel] && SCEN[scSel].tuto);
}


/** Au début d'un combat : l'heure du scénario devient la première heure du cycle. */
export function vivantInit(S, opt) {
  if (!opt || !opt.vivant) return;
  S.vivant = true;
  S.cyc = { ph: S.time === 'nuit' ? 'nuit' : 'jour', n: 0 };
  // vent (v4.8) : deux combats sur trois, dans une des 6 directions
  S.vent = Math.random() < 0.67 ? { d: Math.floor(Math.random() * 6) } : null;
}


/** « jour » ou « nuit » : ce que voit le jeu pour Évoli. Sans plateau vivant, l'heure du scénario. */
export function heureDe(S) {
  return S.cyc ? (S.cyc.ph === 'nuit' ? 'nuit' : 'jour') : S.time === 'nuit' ? 'nuit' : 'jour';
}


/** Portée en moins la nuit (appelée par effR). */
export function nuitPortee(S, u, m) {
  return S && S.cyc && S.cyc.ph === 'nuit' && m.r >= 3 && !voitLaNuit(u) ? 1 : 0;
}


/** Une haute herbe qui prendrait feu à la prochaine fin de manche ? (aussi utilisé pour l'avertir à l'écran) */
export function risqueFeu(S, k) {
  const t = S.tiles[k];
  if (!S.vivant || !t || !t.grass || t.rock || t.w) return false;
  if (S.wx && S.wx.k === 'pluie') return false;
  if (t.mark && t.mark.k === 'trempe') return false; // herbe détrempée
  return nbrK(k).some(n => enFeu(S, n));
}


/** Une haute herbe qui peut brûler (sans regarder les voisines). */
function herbeSeche(S, k) {
  const t = S.tiles[k];
  return !!(S.vivant && t && t.grass && !t.rock && !t.w && !(t.mark && t.mark.k === 'trempe'));
}


export function vivantManche(S, ev) {
  if (!S.vivant) return;
  const W = S.wx && S.wx.k;
  let rebuild = false;
  // la pluie éteint, la grêle gèle
  if (W === 'pluie') {
    let n = 0;
    for (const k in S.tiles)
      if (enFeu(S, k)) {
        S.tiles[k].mark = null;
        n++;
      }
    if (n) {
      say(ev, `La pluie éteint les flammes (${n} case${n > 1 ? 's' : ''}).`);
      rebuild = true;
    }
  }
  if (W === 'grele') {
    let n = 0;
    for (const k in S.tiles) {
      const t = S.tiles[k];
      if (t.mark && t.mark.k === 'trempe') {
        t.mark = { k: 'givre', d: mDur(S, 'givre'), lv: t.mark.lv, by: t.mark.by };
        n++;
      }
    }
    if (n) {
      say(ev, `La grêle gèle les flaques (${n} case${n > 1 ? 's' : ''}).`);
      rebuild = true;
    }
  }
  // le feu court dans les hautes herbes : on photographie d'abord, on applique ensuite
  const gagne = [];
  for (const k in S.tiles) if (risqueFeu(S, k)) gagne.push([k, nbrK(k).find(n => enFeu(S, n))]);
  // sous le vent (v4.8), le feu saute une case de plus dans les hautes herbes
  if (S.vent && W !== 'pluie')
    for (const b in S.tiles) {
      if (!enFeu(S, b)) continue;
      const n1 = pasVent(b, S.vent.d),
        n2 = n1 && pasVent(n1, S.vent.d);
      if (n1 && n2 && risqueFeu(S, n1) && risqueFeu(S, n2) === false && herbeSeche(S, n2) && !gagne.some(g => g[0] === n2))
        gagne.push([n2, n1]);
    }
  if (gagne.length) {
    const aretes = [];
    gagne.forEach(([k, de]) => {
      const t = S.tiles[k];
      t.grass = false;
      t.mark = { k: 'brulant', d: mDur(S, 'brulant'), lv: 1, by: S.tiles[de].mark.by };
      aretes.push([de, k, 1]);
    });
    ev.push({ e: 'chain', edges: aretes, c: 'fire' });
    say(ev, `Le feu court dans les hautes herbes (${gagne.length} case${gagne.length > 1 ? 's' : ''}).`);
    S.stats.feu = (S.stats.feu || 0) + gagne.length; // succès Pyromane (v4.9)
    gagne.forEach(([k]) => {
      const w = uAt(S, k);
      if (!w || flies(w) || w.t.includes('Feu') || w.tal === 'torche') return;
      w.bru = Math.max(w.bru, 2);
      say(ev, `${w.n} est pris dans l’incendie !`);
    });
    rebuild = true;
  }
  // le vent pousse le brouillard d'une case (calculé sur la photo de la manche)
  if (S.vent) {
    const nf = {};
    let n = 0;
    for (const k in S.tiles) {
      const f = S.tiles[k].fog;
      if (!(f > 0)) continue;
      n++;
      const d = pasVent(k, S.vent.d);
      if (d && !S.tiles[d].rock) nf[d] = Math.max(nf[d] || 0, f);
    }
    if (n) {
      for (const k in S.tiles) S.tiles[k].fog = nf[k] || 0;
      say(ev, 'Le vent pousse le brouillard.');
      rebuild = true;
    }
  }
  if (rebuild) ev.push({ e: 'terrain' });
  // l'heure avance
  if (!S.cyc.fige) S.cyc.n++; // Nuit éternelle : l'heure ne passe pas (v4.9)
  if (S.cyc.n >= VIV_PAS) {
    S.cyc = { ph: VIV_ORDRE[(VIV_ORDRE.indexOf(S.cyc.ph) + 1) % VIV_ORDRE.length], n: 0 };
    say(ev, VIV_ANNONCE[S.cyc.ph]);
    ev.push({ e: 'heure', ph: S.cyc.ph });
    if (S.vent) {
      S.vent.d = (S.vent.d + 1) % 6; // le vent tourne avec l'heure
      say(ev, 'Le vent tourne.');
    }
  }
}


/** La pastille de l'heure, à côté de celle de la météo. */
export function chipHeure(S) {
  if (!S || !S.cyc) return '';
  if (S.cyc.fige) return `<span class="chip chip-heure" title="${VIV_DESC.nuit}"><i style="background:${VIV_COUL.nuit}"></i>Nuit éternelle</span>`;
  const p = S.cyc.ph,
    reste = VIV_PAS - S.cyc.n,
    suiv = VIV_ORDRE[(VIV_ORDRE.indexOf(p) + 1) % VIV_ORDRE.length];
  return `<span class="chip chip-heure" title="${VIV_DESC[p]}"><i style="background:${VIV_COUL[p]}"></i>${VIV_NOM[p]} · ${VIV_NOM[suiv].toLowerCase()} ${reste > 1 ? 'dans ' + reste + ' manches' : 'après cette manche'}</span>`;
}


/** Teinte du plateau selon l'heure (l'attribut survit à la reconstruction du plateau). */
export function teinteHeure(S) {
  // data-ph de #bBoard : rendu par React (Board.jsx)
  const ph = S && S.cyc ? S.cyc.ph : undefined;
  if (getHost().ph !== ph) hostSet({ ph });
}

/* =====================================================================
   v4.7 : Plateau vivant
   ---------------------------------------------------------------------
   Le jeu avait déjà ses réactions (Court-circuit, Embrasement, Vapeur…)
   et chaque scénario était marqué « jour » ou « nuit » sans que cela
   change quoi que ce soit en combat. Cette version fait vivre le plateau.

   1. Le temps qui passe (jour, crépuscule, nuit, aube)
      Le combat commence à l'heure du scénario ; toutes les 4 manches,
      l'heure avance d'un cran. Effets :
        - Jour      : Plante et Vol ×1,2
        - Aube      : Plante et Vol ×1,1
        - Crépuscule: Spectre et Ténèbres ×1,1
        - Nuit      : Spectre et Ténèbres ×1,2 ; les attaques de 3 cases de
                      portée ou plus perdent 1 de portée, sauf pour les
                      Spectre, les Ténèbres, Regard Vif et Écholocation.
      Les multiplicateurs passent par le pipeline du moteur tactique
      (fournisseur « heure »), comme la météo.
   2. Le feu court dans les hautes herbes
      À chaque fin de manche, les hautes herbes voisines d'une case
      Brûlante s'embrasent (une case par manche, calculé sur la photo de la
      manche : le feu ne traverse pas tout le plateau d'un coup). Un Pokémon
      terrestre pris dans les flammes est Brûlé. Les herbes détrempées ne
      brûlent pas, et une case fauchée (Coupe) arrête le feu : un pare-feu.
   3. La météo agit sur le plateau
      Pluie : éteint les cases Brûlantes et empêche le feu de courir.
      Grêle : gèle les cases Trempées (elles deviennent Givrées).
      (Le Soleil séchait déjà les cases Trempées et prolonge les flammes.)

   Tout cela est un seul réglage, « Plateau vivant » (Paramètres, activé par
   défaut). Sans lui (ou pour les tests moteur), le combat est celui d'avant.
   ===================================================================== */

const VIV_PAS = 4;

 // manches par heure de la journée
const VIV_ORDRE = ['jour', 'crepuscule', 'nuit', 'aube'];


export const VIV_NOM = { aube: 'Aube', jour: 'Jour', crepuscule: 'Crépuscule', nuit: 'Nuit' };


const VIV_COUL = { aube: '#f0a6a0', jour: '#f2c94c', crepuscule: '#e8774a', nuit: '#6b7bd6' };


export const VIV_DESC = {
  jour: 'Plante et Vol ×1,2.',
  aube: 'Plante et Vol ×1,1.',
  crepuscule: 'Spectre et Ténèbres ×1,1.',
  nuit: 'Spectre et Ténèbres ×1,2. Les attaques de 3 cases ou plus perdent 1 de portée (sauf Spectre, Ténèbres, Regard Vif, Écholocation).'
};


export const VIV_ETAT = { jour: 'Il fait jour', aube: 'C’est l’aube', crepuscule: 'Le crépuscule tombe', nuit: 'Il fait nuit' };


const VIV_ANNONCE = {
  crepuscule: 'Le crépuscule tombe : les Spectres et les Ténèbres se renforcent (×1,1).',
  nuit: 'La nuit tombe : Spectre et Ténèbres ×1,2. Les attaques de 3 cases ou plus perdent 1 de portée.',
  aube: 'L’aube se lève : les Plantes et les Vols se réveillent (×1,1).',
  jour: 'Le jour se lève : Plante et Vol ×1,2.'
};


/** Voit-on bien dans le noir ? */
export const voitLaNuit = u => u.t.includes('Spectre') || u.t.includes('Ténèbres') || u.tal === 'regardvif' || u.tal === 'echolocation';

/* ---------- 2. Fin de manche : le temps, la météo et le feu ---------- */
const enFeu = (S, k) => !!(S.tiles[k] && S.tiles[k].mark && S.tiles[k].mark.k === 'brulant');

// Instructions exécutées au démarrage, dans l'ordre d'origine (voir index.js).
export function __init() {

/* ---------- 1. L'heure, fournisseur de modificateurs de dégâts ---------- */
FOURNISSEURS_DEGATS.push({
  id: 'heure',
  fournir: (c, { S, typ }) => {
    const ph = S.cyc && S.cyc.ph;
    if (!ph) return null;
    const nocturne = typ === 'Spectre' || typ === 'Ténèbres',
      diurne = typ === 'Plante' || typ === 'Vol';
    if (nocturne && ph === 'nuit') return { mul: 1.2, libelle: 'Nuit' };
    if (nocturne && ph === 'crepuscule') return { mul: 1.1, libelle: 'Crépuscule' };
    if (diurne && ph === 'jour') return { mul: 1.2, libelle: 'Jour' };
    if (diurne && ph === 'aube') return { mul: 1.1, libelle: 'Aube' };
    return null;
  }
});


/* ---------- 3. À l'écran ---------- */
// le ciel du plateau (.b-ciel) est rendu par <Board> (src/screens/combat/board/)
}
