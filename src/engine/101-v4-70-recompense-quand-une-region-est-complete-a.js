/* Section d'origine : v4.70 : récompense quand une région est complète au Pokédex */

import { PROFILE } from './011-05-etat-de-partie.js';
import { ecrireLS, toast } from './014-08-outils.js';
import { CROCHETS } from './015-v4-8-00-crochets.js';
import { save } from './020-13-equipe-cartes.js';
import { renderAll } from './024-17-interface-combat.js';
import { ownedFam } from './032-v4-00-socle.js';
import { DEXS } from './038-v4-06-pokedex.js';
import { annonce430 } from './065-v4-30-01-camp-et-tactique.js';

// Instructions exécutées au démarrage, dans l'ordre d'origine (voir index.js).
export function __init() {

(() => {
  const KEY = 'res-pdx470';
  // Une seule récompense par région, même si le joueur rouvre le jeu
  const lire470 = () => {
    try {
      return JSON.parse(localStorage.getItem(KEY)) || [];
    } catch (e) {
      return [];
    }
  };
  const ecrire470 = a => {
    ecrireLS(KEY, a);
  };
  const REGIONS470 = [
    { g: 1, nom: 'Kanto' },
    { g: 2, nom: 'Johto' },
    { g: 3, nom: 'Hoenn' },
  ];
  const complete470 = g => {
    const ms = DEXS.filter(m => m.gen === g);
    return ms.length > 0 && ms.every(m => ownedFam(m.id));
  };
  const verifier470 = () => {
    if (!PROFILE || !PROFILE.dex) return;
    const deja = lire470();
    let change = false;
    REGIONS470.forEach(r => {
      if (deja.includes(r.g) || !complete470(r.g)) return;
      deja.push(r.g);
      change = true;
      PROFILE.money += 3000;
      PROFILE.gems = (PROFILE.gems || 0) + 10;
      toast(`Pokédex de ${r.nom} complet : 3 000 ₽ et 10 Éclats !`);
      annonce430('🏆', 'Pokédex complet', `${r.nom} est entièrement capturé.`);
    });
    if (change) {
      ecrire470(deja);
      save();
    }
  };
  CROCHETS.rendu.push(verifier470);
  window.__pdx470 = { verifier: verifier470, lire: lire470, P: () => PROFILE, dex: () => DEXS, ownedFam, renderAll };
})();
}
