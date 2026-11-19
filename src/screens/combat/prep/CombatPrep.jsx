import { memo } from 'react';
import { usePrepVersion } from './prepStore.js';
import ResumeBox from './Resume.jsx';
import Tip from '../../../components/Tip.jsx';
import { SelList, SelTabs } from './Selection.jsx';
import Detail from './Detail.jsx';
import Team from './Team.jsx';
import { SCEN } from '../../../engine/009-03-pokemon.js';
import { scSel } from '../../../engine/024-17-interface-combat.js';
import { PREPG, nextGoal } from '../../../engine/026-20-campagne-tutoriel-son.js';
import { groupOf } from '../../../engine/031-25-v3-parcours-accueil.js';

// Combats : choix du combat (#cbPrep). Le moteur garde la logique (renderPrep, écouteurs
// sur #selTabs, #scenList, #bLaunch, data-…) et masque #cbPrep pendant un combat
// (attribut hidden posé par le moteur : React ne le rend pas, l'élément reste monté).
// Chaque renderSelection() incrémente la version : les contenus sont reconstruits
// (clé = version), comme l'ancien innerHTML.
function CombatPrep() {
  const v = usePrepVersion();
  const on = v > 0 && !!SCEN[scSel];
  const G = on ? (PREPG && PREPG.sc === scSel ? PREPG.g : groupOf(scSel)) : null;
  return (
    <div id="cbPrep">
      <div className="ph ph-sm">
        <p className="kick">Combats</p>
        <h1 className="h1" id="h-cb">
          Choisir un combat
        </h1>
        <p className="sub">Un onglet, un combat dans la liste, puis « Lancer ». Votre prochaine étape est déjà sélectionnée.</p>
      </div>
      <Tip t="combat" />
      <ResumeBox id="resumePrep" />
      <div className="sel">
        <div className="sel-tabs" id="selTabs" role="tablist" aria-label="Type de combat">
          {on && <SelTabs key={v} G={G} />}
        </div>
        <div className="sel-body">
          <div className="sel-list" id="scenList" role="listbox" aria-label="Combats">
            {on && <SelList key={v} G={G} gk={nextGoal()[0]} />}
          </div>
          <div className="sel-det">
            <div className="sel-card" id="selDet" aria-live="polite">
              {on && <Detail key={v} k={scSel} />}
            </div>
            <Team v={on ? v : 0} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(CombatPrep);
