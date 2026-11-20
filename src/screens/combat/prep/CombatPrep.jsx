import { memo } from 'react';
import { usePrepVersion } from './prepStore.js';
import SummaryBox from './Summary.jsx';
import Tip from '../../../components/Tip.jsx';
import { SelList, SelTabs } from './Selection.jsx';
import Detail from './Detail.jsx';
import Team from './Team.jsx';
import { SCEN } from '../../../engine/pokemon/pokemon.js';
import { scSel } from '../../../engine/combat/ui.js';
import { PREPG } from '../../../engine/combat/battle-prep.js';
import { nextGoal } from '../../../engine/progression/campaign.js';
import { groupOf } from '../../../engine/world/home-journey.js';

// Battles: battle choice (#cbPrep). The engine keeps the logic (renderPrep, listeners
// on #selTabs, #scenList, #bLaunch, data-…) and hides #cbPrep during a battle
// (hidden attribute set by the engine: React does not render it, the element stays mounted).
// Each renderSelection() increments the version: contents are rebuilt
// (key = version), like the old innerHTML.
function BattlePrep() {
  const v = usePrepVersion();
  const on = v > 0 && !!SCEN[scSel];
  const G = on ? (PREPG && PREPG.sc === scSel ? PREPG.g : groupOf(scSel)) : null;
  return (
    <div id="cbPrep" className="prep-page">
      <div className="ph ph-sm">
        <p className="kick">Combats</p>
        <h1 className="h1" id="h-cb">
          Choisir un combat
        </h1>
        <p className="sub">
          Un onglet, un combat dans la liste, puis « Lancer ». Votre prochaine étape est déjà sélectionnée.
        </p>
      </div>
      <Tip t="combat" />
      <SummaryBox id="resumePrep" />
      <div className="prep-layout">
        <div className="prep-tabs" id="selTabs" role="tablist" aria-label="Type de combat">
          {on && <SelTabs key={v} G={G} />}
        </div>
        <div className="prep-body">
          <div className="prep-list" id="scenList" role="listbox" aria-label="Combats">
            {on && <SelList key={v} G={G} gk={nextGoal()[0]} />}
          </div>
          <div className="prep-side">
            <div className="prep-card" id="selDet" aria-live="polite">
              {on && <Detail key={v} k={scSel} />}
            </div>
            <Team v={on ? v : 0} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(BattlePrep);
