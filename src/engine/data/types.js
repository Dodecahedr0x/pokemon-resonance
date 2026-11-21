/*
   The Guide's "Types" page is rendered by React (src/screens/guide/Reactions.jsx).
   What remains here is the entry point used by the rest of the game: opening a specific reaction. */

import { MARKS, MARK_REACTIONS } from './game-data.js';
import { goTo } from '../core/navigation.js';
import { selectReaction, setGuideTab } from '../../screens/guide/guideStore.js';

export function openRx(id) {
  for (const m of MARKS) {
    const i = MARK_REACTIONS[m.id].indexOf(id);
    if (i > -1) {
      selectReaction(m.id, i);
      break;
    }
  }
  goTo('types');
  setGuideTab('reactions');
}
