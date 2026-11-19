/* Original section: 11-types.js
   The Guide's "Types" page is rendered by React (src/screens/guide/Reactions.jsx).
   What remains here is the entry point used by the rest of the game: opening a specific reaction. */

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
