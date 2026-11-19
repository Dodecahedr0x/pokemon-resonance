import { useEngineReady } from '../../engineReady.js';
import { useSettingsVersion } from './settingsStore.js';
import BattleDisplay from './panels/CombatDisplay.jsx';
import Immersion from './panels/Immersion.jsx';
import PokemonSkin from './panels/PokemonSkin.jsx';
import TrainerJournal from './panels/TrainerJournal.jsx';
import Avatar from './panels/Avatar.jsx';
import SecretPlaces from './panels/SecretPlaces.jsx';
import BoardGimmicks from './panels/GimmickBoards.jsx';
import FeatsJournal from './panels/FeatsJournal.jsx';
import Chronicles from './panels/Chronicles.jsx';
import Offline from './panels/Offline.jsx';
import Nuzlocke from './panels/Nuzlocke.jsx';
import BoardThemes from './panels/BoardThemes.jsx';
import CaptureTiming from './panels/CaptureTiming.jsx';
import Trainer from './panels/Trainer.jsx';
import GameMode from './panels/GameMode.jsx';
import Sound from './panels/Sound.jsx';
import Combat from './panels/Combat.jsx';
import CampaignChallenges from './panels/CampaignChallenges.jsx';
import Phone from './panels/Phone.jsx';
import Accessibility from './panels/Accessibility.jsx';
import ActionReplay from './panels/ActionReplay.jsx';
import DownloadGame from './panels/DownloadGame.jsx';
import WorkshopDesign from './panels/DesignWorkshop.jsx';

// Panels, in the order the old game displayed them: first those added by the
// successive versions (inserted at the top), then the base settings, then the tools.
const PANELS = [
  BattleDisplay, Immersion, PokemonSkin, TrainerJournal, Avatar, SecretPlaces,
  BoardGimmicks, FeatsJournal, Chronicles, Offline, Nuzlocke, BoardThemes, CaptureTiming,
  Trainer, GameMode, Sound, Combat, CampaignChallenges, Phone, Accessibility, ActionReplay,
  DownloadGame, WorkshopDesign,
];

function Content() {
  return (
    <>
      <div className="ph v4-ph-page"><p className="kick">Réglages</p><h1 className="h1" id="h-params">Paramètres</h1><p className="sub">Réglages de cet appareil et de votre partie.</p></div>
      <div className="v4-params">
        {PANELS.map((P, i) => <P key={i} />)}
      </div>
    </>
  );
}

// Settings page (#params). Nothing is rendered before the engine's first renderParams()
// (first display of the page). After that, each renderParams() rebuilds the content:
// the fields are uncontrolled and the handlers stay in the engine (delegation).
export default function Settings() {
  const ready = useEngineReady();
  const version = useSettingsVersion();
  return (
    <section className="page v4p" id="params" aria-labelledby="h-params">
      {ready && version > 0 && <Content key={version} />}
    </section>
  );
}
