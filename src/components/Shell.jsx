import Guide from '../screens/guide/Guide.jsx';
import Home from '../screens/home/Home.jsx';
import SideObjective from '../screens/home/SideObjective.jsx';
import Settings from '../screens/settings/Settings.jsx';
import Saves from '../screens/saves/Saves.jsx';
import MapScreen from '../screens/map/MapScreen.jsx';
import Pokedex from '../screens/dex/Pokedex.jsx';
import Team from '../screens/team/Team.jsx';
import Sheet from '../screens/team/Sheet.jsx';
import Quests from '../screens/quests/Quests.jsx';
import Bag from '../screens/bag/Bag.jsx';
import Camp from '../screens/camp/Camp.jsx';
import League from '../screens/league/League.jsx';
import BattlePrep from '../screens/combat/prep/CombatPrep.jsx';
import Board from '../screens/combat/board/Board.jsx';
import Battle from '../screens/combat/battle/Battle.jsx';
import Result from '../screens/combat/battle/Result.jsx';
import { BottomNav, SideNav, V4Menu } from './Nav.jsx';
import { TbSave, TbSec, TopTrainer } from './TopBar.jsx';
import Toast from '../screens/overlays/Toast.jsx';
import Coach from '../screens/overlays/Coach.jsx';
import Starter from '../screens/overlays/Starter.jsx';
import Enc from '../screens/overlays/Enc.jsx';
import Intro from '../screens/overlays/Intro.jsx';
import BattleTip from '../screens/overlays/BattleTip.jsx';
import Dialogs from '../screens/overlays/Dialogs.jsx';
import Transients from '../screens/overlays/Transients.jsx';
import { PkBackground } from '../screens/overlays/Effects.jsx';
import Guard from './Guard.jsx';

// Logo (sidebar, header); `children`: additions after the name (header indicators).
function Logo({ sizeValue: size, children }) {
  return (
    <a className="logo" href="#accueil">
      <span className="lg-ic">
        <svg width={size} height={size}>
          <use href="#i-logo" />
        </svg>
      </span>
      <span>
        <small>Pokémon</small>
        <b>Résonance</b>
      </span>
      {children}
    </a>
  );
}

// Application shell: navigation, screen containers and overlays.
// Each screen is a component of src/screens; the engine (src/engine) keeps the logic.
export default function Shell() {
  return (
    <>
      <PkBackground />
      <div className="ambient" aria-hidden="true" />
      <div className="app">
        <aside className="side" aria-label="Navigation principale">
          <Logo sizeValue={30} />
          <Guard>
            <SideNav />
          </Guard>
          <Guard>
            <SideObjective />
          </Guard>
          <p className="side-foot">
            Fangame non officiel, sans affiliation.
            <br />
            Pokémon © Nintendo · Creatures · GAME FREAK.
          </p>
        </aside>
        <div className="main">
          <header className="topbar">
            <div className="topbar-in">
              <Logo sizeValue={24}>
                <span className="pk-leds" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </span>
              </Logo>
              <Guard>
                <TbSec />
              </Guard>
              <Guard>
                <TbSave />
              </Guard>
              <Guard>
                <TopTrainer />
              </Guard>
            </div>
          </header>
          <main className="content">
            <div className="wrap">
              {/* ================= HOME ================= */}
              <Guard>
                <Home />
              </Guard>
              {/* ================= POKÉDEX ================= */}
              <Guard>
                <Team />
              </Guard>
              {/* ================= BATTLE ================= */}
              <section className="page" id="combat" aria-labelledby="h-cb">
                <Guard>
                  <BattlePrep />
                </Guard>
                <Guard>
                  <Battle>
                    <Board />
                  </Battle>
                </Guard>
                <Guard>
                  <Result />
                </Guard>
              </section>
              {/* ================= TYPES ================= */}
              <Guard>
                <Guide />
              </Guard>
              <Guard>
                <MapScreen />
              </Guard>
              <Guard>
                <Pokedex />
              </Guard>
              <Guard>
                <Quests />
              </Guard>
              <Guard>
                <Bag />
              </Guard>
              <Guard>
                <Settings />
              </Guard>
              <Guard>
                <Camp />
              </Guard>
              {/* ================= LEAGUE ================= */}
              <Guard>
                <League />
              </Guard>
            </div>
          </main>
          <footer className="foot">
            <div className="wrap">
              <span>Pokémon Résonance · fangame non officiel · v4.77</span>
              <span>Pokémon © Nintendo · Creatures Inc. · GAME FREAK · fangame sans affiliation</span>
            </div>
          </footer>
        </div>
        <Guard>
          <BottomNav />
        </Guard>
      </div>
      <Guard>
        <Sheet />
      </Guard>
      <Guard>
        <Enc />
      </Guard>
      <Guard>
        <Saves />
      </Guard>
      <Guard>
        <Starter />
      </Guard>
      <Guard>
        <Coach />
      </Guard>
      <Guard>
        <Toast />
      </Guard>
      {/* overlays added at the end of <body> by the engine, in their order of appearance */}
      <Guard>
        <V4Menu />
      </Guard>
      <Guard>
        <Intro />
      </Guard>
      <Guard>
        <BattleTip />
      </Guard>
      <Guard>
        <Dialogs />
      </Guard>
      <Guard>
        <Transients />
      </Guard>
    </>
  );
}
