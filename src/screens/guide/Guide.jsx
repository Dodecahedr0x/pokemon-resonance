import { useEffect, useState } from 'react';
import { useEngineReady } from '../../engineReady.js';
import { setGuideTab, useGuide } from './guideStore.js';
import Bases from './Basics.jsx';
import GettingStarted from './GettingStarted.jsx';
import League from './LeagueGuide.jsx';
import Projet from './Project.jsx';
import Reactions from './Reactions.jsx';
import Tactics from './Tactics.jsx';
import Tutorial from './Tutorial.jsx';
import Universe from './Universe.jsx';
import Tip from '../../components/Tip.jsx';

// Visible tabs, in bar order ("Projet" (Project) has no tab: it is opened via a link).
const TAB_LIST = [
  ['debuter', 'Débuter'],
  ['tuto433', 'Tutoriel'],
  ['bases', 'Combat'],
  ['reactions', 'Types'],
  ['tactique', 'Équipe'],
  ['ligue', 'Ligue'],
  ['univers', 'Univers'],
];

// Panels, in DOM order. `lazy`: rendered only once the tab is opened.
const PANELS = [
  { k: 'tuto433', C: Tutorial, lazy: true },
  { k: 'debuter', C: GettingStarted },
  { k: 'bases', C: Bases },
  { k: 'reactions', C: Reactions },
  { k: 'tactique', C: Tactics, lazy: true },
  { k: 'ligue', C: League },
  { k: 'univers', C: Universe, lazy: true },
  { k: 'projet', C: Projet },
];

// Guide screen (#types). The section's "on" class is set by the engine's navigation.
export default function Guide() {
  const ready = useEngineReady();
  const { tab } = useGuide();
  const [openItems, setOpened] = useState(() => new Set([tab]));
  useEffect(() => {
    setOpened(s => (s.has(tab) ? s : new Set(s).add(tab)));
  }, [tab]);

  return (
    <section className="page" id="types" aria-labelledby="h-ty">
      <div className="ph">
        <p className="kick">Guide du dresseur</p>
        <h1 className="h1" id="h-ty">Guide du dresseur</h1>
        <p className="sub">Commencez par « Débuter » : cinq étapes suffisent pour gagner votre premier combat.</p>
      </div>
      <Tip t="types" />
      <div className="gd-tabs" role="tablist" aria-label="Rubriques du guide">
        {TAB_LIST.map(([k, label]) => (
          <button key={k} type="button" role="tab" className="gd-t" aria-selected={String(tab === k)} onClick={() => setGuideTab(k)}>
            {label}
          </button>
        ))}
      </div>
      {PANELS.map(({ k, C, lazy }) => (
        <div key={k} className="gd-p" data-gp={k} role="tabpanel" hidden={tab !== k}>
          {ready && (!lazy || openItems.has(k) || tab === k) && <C />}
        </div>
      ))}
    </section>
  );
}
