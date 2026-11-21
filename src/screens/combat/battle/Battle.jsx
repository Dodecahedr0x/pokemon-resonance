import { battle } from '../../../engine/combat/ui.js';
import { DEF_WAVES, DEF_LIVES } from '../../../engine/modes/defense-gym.js';
import { useBattleVersion } from './battleStore.js';
import { BtTop, Timeline, Rule, Synergies } from './TopBar.jsx';
import { PlatesA, PlatesE } from './Plates.jsx';
import Panel from './Panel.jsx';
import Footer from './Footer.jsx';
import Log from './Log.jsx';
import EvoPick from './EvoPick.jsx';
import CellSheet from './CellSheet.jsx';

// Battle screen (#cbBattle) around the board: the board (#bBoard) is passed as a child.
// Shown and hidden by the engine (hidden attribute); each part follows its version (battleStore.js).
// The engine's listeners target #bPanel, #bPlE, #bPlA, #bEnd, #bQuit, #evoPick: they stay mounted.
export default function Battle({ children }) {
  return (
    <div id="cbBattle" hidden>
      <div className="battle">
        <div className="battle-main">
          <BtTop />
          <Synergies />
          <Rule />
          <Timeline />
          {/* scene (compact view): the board full-frame, the plates laid over the scenery */}
          <div className="battle-stage">
            <PlatesE />
            <Defense />
            {children}
            <PlatesA />
          </div>
        </div>
        <aside className="battle-side" aria-label="Commandes">
          <Panel />
          <Footer />
          <Log />
        </aside>
      </div>
      <EvoPick />
      <CellSheet />
    </div>
  );
}

// Defense arena (v4.68): waves and lives, just above the board.
function Defense() {
  useBattleVersion('top');
  const D = battle && battle.def468;
  if (!D) {
    return null;
  }
  return (
    <div id="defense-gym-hud" className="battle-defense">
      <b>
        Vague {D.w} / {DEF_WAVES}
      </b>
      <span>
        {'♥'.repeat(Math.max(0, D.lives))}
        {'♡'.repeat(Math.max(0, DEF_LIVES - D.lives))}
      </span>
      <small>En fin de manche, aucun adversaire ne doit se trouver sur les lignes A ou B.</small>
    </div>
  );
}
