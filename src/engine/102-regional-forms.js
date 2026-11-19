/* Section d'origine : v4.70 : formes régionales (Pokédex) */

import { BY, SCEN } from './009-pokemon.js';
import { CROCHETS } from './015-hooks.js';
import { V4 } from './032-v4-foundation.js';
import { renderDexCard } from './038-pokedex.js';

// Formes régionales : lues par la fiche du Pokédex (src/screens/dex/DexCard.jsx).
export let FR470 = [];

// Instructions exécutées au démarrage, dans l'ordre d'origine (voir index.js).
export function __init() {

(() => {
  // Teinte et type propres à une région, affichés dans la fiche du Pokédex.
  const FR = [
    { id: 'pikachu', reg: 'Kanto insulaire', plus: 'Vol', hue: 200, g: 1 },
    { id: 'abra', reg: 'Kanto mystique', plus: 'Fée', hue: 300, g: 1 },
    { id: 'magicarpe', reg: 'Kanto des rapides', plus: 'Dragon', hue: 20, g: 1 },
    { id: 'evoli', reg: 'Kanto sylvestre', plus: 'Fée', hue: 320, g: 1 },
    { id: 'ronflex', reg: 'Kanto montagnard', plus: 'Combat', hue: 10, g: 1 },
    { id: 'chenipan', reg: 'Kanto toxique', plus: 'Poison', hue: 270, g: 1 },
    { id: 'kicklee', reg: 'Kanto rocheux', plus: 'Sol', hue: 35, g: 1 },
    { id: 'germignon', reg: 'Johto des cimes', plus: 'Vol', hue: 60, g: 2 },
    { id: 'hericendre', reg: 'Johto des dojos', plus: 'Combat', hue: 350, g: 2 },
    { id: 'kaiminus', reg: 'Johto des lacs', plus: 'Dragon', hue: 230, g: 2 },
    { id: 'pichu', reg: 'Johto des nuées', plus: 'Vol', hue: 190, g: 2 },
    { id: 'mentali', reg: 'Johto de l’aube', plus: 'Fée', hue: 310, g: 2 },
    { id: 'phanpy', reg: 'Johto des marais', plus: 'Eau', hue: 170, g: 2 },
    { id: 'debugant', reg: 'Johto de la nuit', plus: 'Ténèbres', hue: 260, g: 2 },
    { id: 'poussifeu', reg: 'Hoenn marin', plus: 'Eau', hue: 190, g: 3 },
    { id: 'arcko', reg: 'Hoenn draconique', plus: 'Dragon', hue: 280, g: 3 },
    { id: 'gobou', reg: 'Hoenn des sables', plus: 'Sol', hue: 40, g: 3 },
    { id: 'absol', reg: 'Hoenn mentale', plus: 'Psy', hue: 300, g: 3 },
    { id: 'draby', reg: 'Hoenn céleste', plus: 'Vol', hue: 200, g: 3 },
    { id: 'massko', reg: 'Hoenn des dunes', plus: 'Dragon', hue: 90, g: 3 },
  ].filter(f => BY[f.id]);
  FR470 = FR; // bandeau .fr470 et teinte de l'illustration : rendus par React
  const regionOf = sc => {
    const c = SCEN[sc] || {};
    return c.hoenn != null ? 3 : c.johto != null ? 2 : 1;
  };
  CROCHETS.creation.push(S => {
    const g = regionOf(S.sc);
    S.units.forEach(u => {
      if (u.side !== 'a') return;
      const f = FR.find(x => x.id === u.id && x.g === g);
      if (f && !u.t.includes(f.plus)) u.t.push(f.plus);
    });
  });
  window.__fr470 = FR;
  window.__fr470.regionDe = regionOf;
  window.__fr470.V4 = () => V4;
  window.__fr470.rend = () => renderDexCard();
})();
}
