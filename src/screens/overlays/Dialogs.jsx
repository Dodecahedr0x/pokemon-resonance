import TdrBox from './TdrBox.jsx';
import CtBox from './CtBox.jsx';
import ExpBox from './ExpBox.jsx';
import PensBox from './PensBox.jsx';
import AmiBox from './AmiBox.jsx';
import CompBox from './CompBox.jsx';
import Scene417 from './Scene417.jsx';
import Peche418 from './Peche418.jsx';
import Safari418 from './Safari418.jsx';
import Conf430 from './Conf430.jsx';
import { PkBadge, PkBtr, PkIris, Tr448 } from './Effets.jsx';

// Fenêtres et couches d'effet que le moteur ajoutait à la fin de <body>, dans l'ordre
// d'origine. #conf430 et #tr448 n'existaient qu'une fois créés (premier appel), donc après.
export default function Dialogs() {
  return (
    <>
      <TdrBox />
      <CtBox />
      <ExpBox />
      <PensBox />
      <AmiBox />
      <CompBox />
      <Scene417 />
      <Peche418 />
      <Safari418 />
      <PkIris />
      <PkBtr />
      <PkBadge />
      <Conf430 />
      <Tr448 />
    </>
  );
}
