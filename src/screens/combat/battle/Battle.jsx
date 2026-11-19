import { B } from '../../../engine/024-combat-ui.js';
import { DEF_VAGUES, DEF_VIES } from '../../../engine/099-defense-gym.js';
import { useBattleVersion } from './battleStore.js';
import { BtTop, Timeline, Rule, Synergies } from './TopBar.jsx';
import { PlatesA, PlatesE } from './Plates.jsx';
import Panel from './Panel.jsx';
import Footer from './Foot.jsx';
import Log from './Log.jsx';
import EvoPick from './EvoPick.jsx';
import Sheet444 from './Sheet444.jsx';

// Écran du combat (#cbBattle) autour du plateau : le plateau (#bBoard) est passé en enfant.
// Montré et masqué par le moteur (attribut hidden) ; chaque partie suit sa version (battleStore.js).
// Les écouteurs du moteur visent #bPanel, #bPlE, #bPlA, #bEnd, #bQuit, #evoPick : ils restent montés.
export default function Battle({ children }) {
  return (
    <div id="cbBattle" hidden>
      <div className="battle">
        <div className="bt">
          <BtTop />
          <Synergies />
          <Rule />
          <Timeline />
          {/* scène (vue compacte) : le plateau plein cadre, les plaques posées sur le décor */}
          <div className="bt-stage">
            <PlatesE />
            <Defense />
            {children}
            <PlatesA />
          </div>
        </div>
        <aside className="bt-side" aria-label="Commandes">
          <Panel />
          <Footer />
          <Log />
        </aside>
      </div>
      <EvoPick />
      <Sheet444 />
    </div>
  );
}

// Arène de défense (v4.68) : vagues et vies, juste au-dessus du plateau.
function Defense() {
  useBattleVersion('top');
  const D = B && B.def468;
  if (!D) return null;
  return (
    <div id="df468hud">
      <b>
        Vague {D.w} / {DEF_VAGUES}
      </b>
      <span>
        {'♥'.repeat(Math.max(0, D.vies))}
        {'♡'.repeat(Math.max(0, DEF_VIES - D.vies))}
      </span>
      <small>En fin de manche, aucun adversaire ne doit se trouver sur les lignes A ou B.</small>
    </div>
  );
}
