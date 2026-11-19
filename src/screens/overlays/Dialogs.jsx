import TdrBox from './TdrBox.jsx';
import TmBox from './TmBox.jsx';
import ExpBox from './ExpBox.jsx';
import DaycareBox from './DaycareBox.jsx';
import FriendBox from './FriendBox.jsx';
import CompanionBox from './CompanionBox.jsx';
import StoryScene from './StoryScene.jsx';
import FishingWindow from './FishingWindow.jsx';
import SafariWindow from './SafariWindow.jsx';
import NewGameConfirm from './NewGameConfirm.jsx';
import { PkBadge, PkBtr, PkIris, ScreenTransition } from './Effects.jsx';

// Windows and effect layers that the engine appended to the end of <body>, in the original
// order. #newGame and #battleTransition only existed once created (first call), hence after.
export default function Dialogs() {
  return (
    <>
      <TdrBox />
      <TmBox />
      <ExpBox />
      <DaycareBox />
      <FriendBox />
      <CompanionBox />
      <StoryScene />
      <FishingWindow />
      <SafariWindow />
      <PkIris />
      <PkBtr />
      <PkBadge />
      <NewGameConfirm />
      <ScreenTransition />
    </>
  );
}
