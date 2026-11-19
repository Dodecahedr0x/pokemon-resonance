import { useEngineReady } from '../../engineReady.js';
import { useSettingsVersion } from './settingsStore.js';
import AffichageCombat from './panels/AffichageCombat.jsx';
import Immersion from './panels/Immersion.jsx';
import HabillagePokemon from './panels/HabillagePokemon.jsx';
import JournalDresseur from './panels/JournalDresseur.jsx';
import Avatar from './panels/Avatar.jsx';
import LieuxSecrets from './panels/LieuxSecrets.jsx';
import PlateauxGimmick from './panels/PlateauxGimmick.jsx';
import JournalExploits from './panels/JournalExploits.jsx';
import Chroniques from './panels/Chroniques.jsx';
import HorsLigne from './panels/HorsLigne.jsx';
import Nuzlocke from './panels/Nuzlocke.jsx';
import ThemesPlateau from './panels/ThemesPlateau.jsx';
import CaptureTiming from './panels/CaptureTiming.jsx';
import Dresseur from './panels/Dresseur.jsx';
import ModeDeJeu from './panels/ModeDeJeu.jsx';
import Son from './panels/Son.jsx';
import Combat from './panels/Combat.jsx';
import DefisCampagne from './panels/DefisCampagne.jsx';
import Telephone from './panels/Telephone.jsx';
import Accessibilite from './panels/Accessibilite.jsx';
import ActionReplay from './panels/ActionReplay.jsx';
import TelechargerJeu from './panels/TelechargerJeu.jsx';
import AtelierDesign from './panels/AtelierDesign.jsx';

// Panneaux, dans l'ordre où l'ancien jeu les affichait : d'abord ceux ajoutés par les versions
// successives (insérés en tête), puis les réglages de base, puis les outils.
const PANNEAUX = [
  AffichageCombat, Immersion, HabillagePokemon, JournalDresseur, Avatar, LieuxSecrets,
  PlateauxGimmick, JournalExploits, Chroniques, HorsLigne, Nuzlocke, ThemesPlateau, CaptureTiming,
  Dresseur, ModeDeJeu, Son, Combat, DefisCampagne, Telephone, Accessibilite, ActionReplay,
  TelechargerJeu, AtelierDesign,
];

function Contenu() {
  return (
    <>
      <div className="ph v4-ph-page"><p className="kick">Réglages</p><h1 className="h1" id="h-params">Paramètres</h1><p className="sub">Réglages de cet appareil et de votre partie.</p></div>
      <div className="v4-params">
        {PANNEAUX.map((P, i) => <P key={i} />)}
      </div>
    </>
  );
}

// Page Paramètres (#params). Rien n'est rendu avant le premier renderParams() du moteur
// (premier affichage de la page). Ensuite, chaque renderParams() reconstruit le contenu :
// les champs sont non contrôlés et les gestionnaires restent dans le moteur (délégation).
export default function Settings() {
  const ready = useEngineReady();
  const version = useSettingsVersion();
  return (
    <section className="page v4p" id="params" aria-labelledby="h-params">
      {ready && version > 0 && <Contenu key={version} />}
    </section>
  );
}
