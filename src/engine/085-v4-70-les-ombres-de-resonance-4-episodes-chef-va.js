/* Section d'origine : v4.70 : Les Ombres de Résonance (4 épisodes, chef Vaskar) */

import { PROFILE } from './011-05-etat-de-partie.js';
import { ecrireLS } from './014-08-outils.js';
import { CROCHETS } from './015-v4-8-00-crochets.js';
import { ev454, evPick454 } from './084-4-54-colporteur-rencontres-de-route-missions-de.js';

// Instructions exécutées au démarrage, dans l'ordre d'origine (voir index.js).
export function __init() {

(() => {
  const KEY = 'res-ombre470';
  const lire = () => {
    try {
      return Object.assign({ etape: 0 }, JSON.parse(localStorage.getItem(KEY)));
    } catch (e) {
      return { etape: 0 };
    }
  };
  const ecrire = o => {
    ecrireLS(KEY, o);
  };
  const has = v => Array.isArray(v) ? v.length > 0 : !!v;
  // Chaque épisode remplace la rencontre du jour quand sa condition est remplie.
  const EPS = [
    {
      ok: () => true,
      t: 'Sabotage au Centre Pokémon',
      x: 'Les câbles de soins sont coupés et une caisse de Potions a disparu. Une trace de peinture noire mène vers l’est.',
      c: [
        { l: 'Affronter les sbires', fight: 1 },
        { l: 'Suivre la trace', p: 0.7, ok: { g: 2, m: 500 }, okT: 'Vous retrouvez la caisse et un carnet : « Vaskar attend les Ombres ».', ko: { m: -200 }, koT: 'La trace se perd dans les hautes herbes.' },
        { l: 'Prévenir l’infirmière', ok: { b: { potion: 2 } }, okT: 'Elle vous confie 2 Potions et vous demande de rester vigilant.' },
        { l: 'Ignorer l’affaire' },
      ],
    },
    {
      ok: () => has(PROFILE.johto),
      t: 'Les Ombres à Johto',
      x: 'Des sbires vêtus de noir démontent le balisage d’un sentier. L’un d’eux vous reconnaît et prend la fuite en laissant un sac.',
      c: [
        { l: 'Affronter les sbires', fight: 1 },
        { l: 'Rattraper le fuyard', p: 0.6, ok: { g: 3, m: 600 }, okT: 'Il lâche son butin : 3 Éclats. Il murmure le nom de Vaskar.', ko: { m: -300 }, koT: 'Il vous distance et disparaît.' },
        { l: 'Fouiller le sac', ok: { m: 400 }, okT: 'Une carte annotée et de l’argent : leur base est à Hoenn.' },
        { l: 'Rebalancer le balisage' },
      ],
    },
    {
      ok: () => has(PROFILE.hoenn),
      t: 'La base des Ombres',
      x: 'Une grotte de Hoenn grouille de sbires. Leur plan : détourner l’énergie de Résonance des Pokémon.',
      c: [
        { l: 'Affronter les sbires', fight: 1 },
        { l: 'Couper l’alimentation', p: 0.65, ok: { g: 4, m: 800 }, okT: 'Le dispositif s’éteint. Vous récupérez 4 Éclats.', ko: { m: -400 }, koT: 'Alarme ! Il faut fuir en laissant du matériel.' },
        { l: 'Observer sans se montrer', ok: { g: 1, m: 300 }, okT: 'Vous notez leurs horaires de garde : un Éclat vous est glissé par un déserteur.' },
        { l: 'Rebrousser chemin' },
      ],
    },
    {
      ok: () => true,
      t: 'Vaskar, chef des Ombres',
      x: 'Vaskar vous attend, seul, devant le dispositif. « Votre Résonance m’intéresse, dresseur. »',
      c: [
        { l: 'Affronter les sbires', fight: 1 },
        { l: 'Le défier', p: 0.75, ok: { g: 8, m: 3000 }, okT: 'Vaskar s’incline et détruit le dispositif. Les Ombres se dispersent : 8 Éclats et 3 000 ₽.', ko: { m: -500 }, koT: 'Il repart avec son butin. Vous le retrouverez.' },
        { l: 'Négocier', ok: { g: 2, m: 1000 }, okT: 'Il quitte la région, en vous laissant un dédommagement.' },
        { l: 'Se retirer' },
      ],
    },
  ];
  const courant = () => {
    const e = lire().etape;
    return e < EPS.length && EPS[e].ok() ? EPS[e] : null;
  };
  // l'épisode en cours remplace la rencontre du jour ; le choisir fait avancer l'histoire
  CROCHETS.rencontreRoute.push(r => {
    const E = courant();
    return E && !r.st.done ? { ...r, E: { ...E, ombre: 1 }, i: -1 } : r;
  });
  let etaitEpisode = false;
  CROCHETS.avantChoixRoute.push(() => {
    const { E, st } = ev454();
    etaitEpisode = !!(E && E.ombre && !st.done);
  });
  CROCHETS.choixRoute.push(() => {
    if (etaitEpisode) ecrire({ etape: lire().etape + 1 });
  });
  window.__ombre470 = { lire, ecrire, dispo: () => !!courant(), titre: () => (courant() || {}).t, req: () => (lire().etape === 1 ? 'Commencez Johto' : lire().etape === 2 ? 'Commencez Hoenn' : ''), ev: () => ev454(), pick: j => evPick454(j), nb: EPS.length };
})();
}
