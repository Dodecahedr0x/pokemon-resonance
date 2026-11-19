import TdrBox from './TdrBox.jsx';
import TmBox from './CtBox.jsx';
import ExpBox from './ExpBox.jsx';
import DaycareBox from './BoardingBox.jsx';
import FriendBox from './FriendBox.jsx';
import CompanionBox from './CompBox.jsx';
import Scene417 from './Scene417.jsx';
import Fishing418 from './Fishing418.jsx';
import Safari418 from './Safari418.jsx';
import Conf430 from './Conf430.jsx';
import { PkBadge, PkBtr, PkIris, Tr448 } from './Effects.jsx';

// Fenêtres et couches d'effet que le moteur ajoutait à la fin de <body>, dans l'ordre
// d'origine. #conf430 et #tr448 n'existaient qu'une fois créés (premier appel), donc après.
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
