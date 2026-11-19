/* Section d'origine : 11-types.js
   La page « Types » du Guide est rendue par React (src/screens/guide/Reactions.jsx).
   Il reste ici l'entrée utilisée par le reste du jeu : ouvrir une réaction précise. */

import { MK, MX } from './004-data.js';
import { go } from './016-navigation.js';
import { selectReaction, setGuideTab } from '../screens/guide/guideStore.js';


export function openRx(id) {
  for (const m of MK) {
    const i = MX[m.id].indexOf(id);
    if (i > -1) {
      selectReaction(m.id, i);
      break;
    }
  }
  go('types');
  setGuideTab('reactions');
}
