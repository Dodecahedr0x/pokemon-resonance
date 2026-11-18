import { B } from '../../../engine/024-17-interface-combat.js';
import { DEF_VAGUES, DEF_VIES } from '../../../engine/099-4-68-arene-de-defense.js';
import { useBattleVersion } from './battleStore.js';
import { BtTop, Frise, Regle, Synergies } from './TopBar.jsx';
import { PlaquesA, PlaquesE } from './Plates.jsx';
import Panel from './Panel.jsx';
import Foot from './Foot.jsx';
import Log from './Log.jsx';
import EvoPick from './EvoPick.jsx';
import Fiche444 from './Fiche444.jsx';

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
          <Regle />
          <Frise />
          <PlaquesE />
          <Defense />
          {children}
          <PlaquesA />
        </div>
        <aside className="bt-side" aria-label="Commandes">
          <Panel />
          <Foot />
          <Log />
        </aside>
      </div>
      <EvoPick />
      <Fiche444 />
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
