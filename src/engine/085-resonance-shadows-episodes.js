/* Original section: v4.70: The Resonance Shadows (4 episodes, boss Vaskar) */

import { PROFILE } from './011-game-state.js';
import { writeLS } from './014-utils.js';
import { HOOKS } from './015-hooks.js';
import { ev454, evPick454 } from './084-peddler-route-missions.js';

// Statements run at startup, in the original order (see index.js).
export function __init() {
  (() => {
    const KEY = 'res-ombre470';
    const readValue = () => {
      try {
        return Object.assign({ stepOf: 0 }, JSON.parse(localStorage.getItem(KEY)));
      } catch (e) {
        return { stepOf: 0 };
      }
    };
    const write = o => {
      writeLS(KEY, o);
    };
    const has = v => (Array.isArray(v) ? v.length > 0 : !!v);
    // Each episode replaces the day's encounter when its condition is met.
    const EPS = [
      {
        ok: () => true,
        t: 'Sabotage au Centre Pokémon',
        x: 'Les câbles de soins sont coupés et une caisse de Potions a disparu. Une trace de peinture noire mène vers l’est.',
        c: [
          { l: 'Affronter les sbires', fight: 1 },
          {
            l: 'Suivre la trace',
            p: 0.7,
            ok: { g: 2, m: 500 },
            successText: 'Vous retrouvez la caisse et un carnet : « Vaskar attend les Ombres ».',
            ko: { m: -200 },
            failText: 'La trace se perd dans les hautes herbes.',
          },
          {
            l: 'Prévenir l’infirmière',
            ok: { b: { potion: 2 } },
            successText: 'Elle vous confie 2 Potions et vous demande de rester vigilant.',
          },
          { l: 'Ignorer l’affaire' },
        ],
      },
      {
        ok: () => has(PROFILE.johto),
        t: 'Les Ombres à Johto',
        x: 'Des sbires vêtus de noir démontent le balisage d’un sentier. L’un d’eux vous reconnaît et prend la fuite en laissant un sac.',
        c: [
          { l: 'Affronter les sbires', fight: 1 },
          {
            l: 'Rattraper le fuyard',
            p: 0.6,
            ok: { g: 3, m: 600 },
            successText: 'Il lâche son butin : 3 Éclats. Il murmure le nom de Vaskar.',
            ko: { m: -300 },
            failText: 'Il vous distance et disparaît.',
          },
          {
            l: 'Fouiller le sac',
            ok: { m: 400 },
            successText: 'Une carte annotée et de l’argent : leur base est à Hoenn.',
          },
          { l: 'Rebalancer le balisage' },
        ],
      },
      {
        ok: () => has(PROFILE.hoenn),
        t: 'La base des Ombres',
        x: 'Une grotte de Hoenn grouille de sbires. Leur plan : détourner l’énergie de Résonance des Pokémon.',
        c: [
          { l: 'Affronter les sbires', fight: 1 },
          {
            l: 'Couper l’alimentation',
            p: 0.65,
            ok: { g: 4, m: 800 },
            successText: 'Le dispositif s’éteint. Vous récupérez 4 Éclats.',
            ko: { m: -400 },
            failText: 'Alarme ! Il faut fuir en laissant du matériel.',
          },
          {
            l: 'Observer sans se montrer',
            ok: { g: 1, m: 300 },
            successText: 'Vous notez leurs horaires de garde : un Éclat vous est glissé par un déserteur.',
          },
          { l: 'Rebrousser chemin' },
        ],
      },
      {
        ok: () => true,
        t: 'Vaskar, chef des Ombres',
        x: 'Vaskar vous attend, seul, devant le dispositif. « Votre Résonance m’intéresse, dresseur. »',
        c: [
          { l: 'Affronter les sbires', fight: 1 },
          {
            l: 'Le défier',
            p: 0.75,
            ok: { g: 8, m: 3000 },
            successText: 'Vaskar s’incline et détruit le dispositif. Les Ombres se dispersent : 8 Éclats et 3 000 ₽.',
            ko: { m: -500 },
            failText: 'Il repart avec son butin. Vous le retrouverez.',
          },
          {
            l: 'Négocier',
            ok: { g: 2, m: 1000 },
            successText: 'Il quitte la région, en vous laissant un dédommagement.',
          },
          { l: 'Se retirer' },
        ],
      },
    ];
    const current = () => {
      const e = readValue().stepOf;
      return e < EPS.length && EPS[e].ok() ? EPS[e] : null;
    };
    // the current episode replaces the day's encounter; choosing it advances the story
    HOOKS.routeEncounter.push(r => {
      const E = current();
      return E && !r.st.done ? { ...r, E: { ...E, ombre: 1 }, i: -1 } : r;
    });
    let wasEpisode = false;
    HOOKS.beforeRouteChoice.push(() => {
      const { E, st } = ev454();
      wasEpisode = !!(E && E.ombre && !st.done);
    });
    HOOKS.routeChoice.push(() => {
      if (wasEpisode) {
        write({ stepOf: readValue().stepOf + 1 });
      }
    });
    window.__shadow470 = {
      readValue,
      write,
      available: () => !!current(),
      titre: () => (current() || {}).t,
      req: () => (readValue().stepOf === 1 ? 'Commencez Johto' : readValue().stepOf === 2 ? 'Commencez Hoenn' : ''),
      ev: () => ev454(),
      pick: j => evPick454(j),
      nb: EPS.length,
    };
  })();
}
