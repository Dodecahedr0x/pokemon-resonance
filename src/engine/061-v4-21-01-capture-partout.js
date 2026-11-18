/* Section d'origine : v4.21-01-capture-partout.js */

import { BY, PRESETS, famOf } from './009-03-pokemon.js';
import { RECRUIT } from './010-04-evolution-en-combat.js';
import { BADGE_REWARD, PROFILE, isCamp } from './011-05-etat-de-partie.js';
import { regionJ415 } from './054-v4-15-01-johto.js';
import { NEWS416 } from './056-v4-16-1-01-finitions.js';
import { regionH419 } from './059-v4-19-01-hoenn.js';
import { boxN429 } from './064-v4-29-01-qualite.js';

export let regionNo421, ROUTE421, REGN421, lieuCapture421, poolRegion421, libreBox421;
let REG421, estRecrue421;


/* =====================================================================
   v4.21 : capture partout
   1. Libre aussi : les Pokémon ne se choisissent plus librement, ils se
      capturent. Les combats (arènes, Ligue, Johto, Hoenn) restent ouverts.
   2. Chaque famille se capture dans sa région : Kanto sur la Route 29 et
      au Parc Safari, Johto sur la Route 32, Hoenn sur la Route 104, pêche
      comprise (Magicarpe mord partout). Une famille appartient à la
      région de son premier membre connu : Pichu → Pikachu est de Kanto.
   3. Les joueurs Libre gardent leur équipe, leurs captures, leur
      compagnon et les cadeaux de leurs badges (migration unique, lib421).
   ===================================================================== */
export function V421_0() {
  return { lib421: 0 };
}


export function v421Clean(p) {
  return { lib421: p && p.lib421 ? 1 : 0 };
}


/** Région d'une famille : 1 Kanto, 2 Johto, 3 Hoenn (premier membre connu). */
export function regFam421(id) {
  const m = BY[id];
  if (!m) return 1;
  const b = m.base || id;
  if (REG421[b] == null) REG421[b] = Math.min(...famOf(b).map(x => x.gen || 1));
  return REG421[b];
}


/**
 * Libre : la Box remplace le « tout est ouvert ». Une seule fois par profil,
 * on y range l'équipe, les captures déjà faites, le compagnon et les cadeaux
 * des badges déjà gagnés. Une Box vide reçoit l'équipe de départ.
 */
export function libre421(sq, badges) {
  if (isCamp()) return false;
  const box = PROFILE.box,
    add = id => {
      const m = BY[id],
        b = m && m.base;
      if (b && estRecrue421(b) && !box.includes(b)) box.push(b);
    };
  let ch = false;
  if (!PROFILE.lib421) {
    (sq || []).forEach(add);
    (PROFILE.dex || []).forEach(add);
    if (PROFILE.comp && PROFILE.comp.id) add(PROFILE.comp.id);
    (badges || []).forEach(i => {
      const R = BADGE_REWARD[i],
        g = R && R.gift.find(id => !box.includes(id));
      if (g) add(g);
    });
    PROFILE.lib421 = 1;
    ch = true;
  }
  if (!box.length) {
    PRESETS.orage.ids.forEach(add);
    ch = true;
  }
  return ch;
}

// Instructions exécutées au démarrage, dans l'ordre d'origine (voir index.js).
export function __init() {

REG421 = {};


regionNo421 = () => (regionH419() ? 3 : regionJ415() ? 2 : 1);


ROUTE421 = ['', 'Route 29', 'Route 32', 'Route 104'];


REGN421 = ['', 'Kanto', 'Johto', 'Hoenn'];


estRecrue421 = id => !!BY[id] && RECRUIT.some(x => x.id === BY[id].base);


/** Où capturer une famille (vide pour les légendes, jamais recrutables). */
lieuCapture421 = id => (estRecrue421(id) ? ROUTE421[regFam421(id)] : '');


/** Les familles sauvages de la région affichée. */
poolRegion421 = (r = regionNo421()) => RECRUIT.filter(m => regFam421(m.id) === r);


/** Texte court pour les écrans Libre. */
libreBox421 = () => `Box ${boxN429()} / ${RECRUIT.length}`;


NEWS416.unshift([
  'i-grass',
  'Capture partout',
  'Même en Libre, chaque Pokémon se capture dans sa région : Kanto sur la Route 29, Johto sur la Route 32, Hoenn sur la Route 104. Les combats restent ouverts et votre équipe est conservée.',
  'herbes'
]);
}
