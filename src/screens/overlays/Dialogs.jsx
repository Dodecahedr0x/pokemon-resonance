import TdrBox from './TdrBox.jsx';
import TmBox from './TmBox.jsx';
import ExpBox from './ExpBox.jsx';
import DaycareBox from './DaycareBox.jsx';
import FriendBox from './FriendBox.jsx';
import CompanionBox from './CompanionBox.jsx';
import Scene417 from './Scene417.jsx';
import Fishing418 from './Fishing418.jsx';
import Safari418 from './Safari418.jsx';
import Conf430 from './Conf430.jsx';
import { PkBadge, PkBtr, PkIris, Tr448 } from './Effects.jsx';

// Windows and effect layers that the engine appended to the end of <body>, in the original
// order. #conf430 and #tr448 only existed once created (first call), hence after.
export default function Dialogs() {
  return (
    <>
      <TdrBox />
      <TmBox />
      <ExpBox />
      <DaycareBox />
      <FriendBox />
      <CompanionBox />
      <Scene417 />
      <Fishing418 />
      <Safari418 />
      <PkIris />
      <PkBtr />
      <PkBadge />
      <Conf430 />
      <Tr448 />
    </>
  );
}
