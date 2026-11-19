import Guide from '../screens/guide/Guide.jsx';
import Accueil from '../screens/accueil/Accueil.jsx';
import ObjectifLateral from '../screens/accueil/ObjectifLateral.jsx';
import Settings from '../screens/settings/Settings.jsx';
import Saves from '../screens/saves/Saves.jsx';
import Carte from '../screens/carte/Carte.jsx';
import Pokedex from '../screens/dex/Pokedex.jsx';
import Equipe from '../screens/equipe/Equipe.jsx';
import Fiche from '../screens/equipe/Fiche.jsx';
import { SideTeam, TbTeam } from '../screens/equipe/Dock.jsx';
import Quetes from '../screens/quetes/Quetes.jsx';
import Sac from '../screens/sac/Sac.jsx';
import Camp from '../screens/camp/Camp.jsx';
import Ligue from '../screens/ligue/Ligue.jsx';
import CombatPrep from '../screens/combat/prep/CombatPrep.jsx';
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
import Tip429 from '../screens/overlays/Tip429.jsx';
import Dialogs from '../screens/overlays/Dialogs.jsx';
import Temporaires from '../screens/overlays/Temporaires.jsx';
import { PkFond } from '../screens/overlays/Effets.jsx';
import Garde from './Garde.jsx';

// Logo (barre latérale, en-tête) ; `children` : ajouts après le nom (voyants de l'en-tête).
function Logo({ taille, children }) {
  return <a className="logo" href="#accueil"><span className="lg-ic"><svg width={taille} height={taille}><use href="#i-logo" /></svg></span><span><small>Pokémon</small><b>Résonance</b></span>{children}</a>;
}

// Coquille de l’application : navigation, conteneurs des écrans et surcouches.
// Chaque écran est un composant de src/screens ; le moteur (src/engine) garde la logique.
export default function Shell() {
  return (
    <>
      <PkFond />
      <div className="ambient" aria-hidden="true" />
      <div className="app">
        <aside className="side" aria-label="Navigation principale">
          <Logo taille={30} />
          <Garde><SideNav /></Garde>
          <Garde><ObjectifLateral /></Garde>
          <Garde><SideTeam /></Garde>
          <p className="side-foot">Fangame non officiel, sans affiliation.<br />Pokémon © Nintendo · Creatures · GAME FREAK.</p>
        </aside>
        <div className="main">
          <header className="topbar"><div className="topbar-in">
              <Logo taille={24}><span className="pk-leds" aria-hidden="true"><i /><i /><i /></span></Logo>
              <Garde><TbSec /></Garde>
              <Garde><TbSave /></Garde>
              <Garde><TbTeam /></Garde>
              <Garde><TopTrainer /></Garde>
            </div></header>
          <main className="content"><div className="wrap">
              {/* ================= ACCUEIL ================= */}
              <Garde><Accueil /></Garde>
              {/* ================= POKÉDEX ================= */}
              <Garde><Equipe /></Garde>
              {/* ================= COMBAT ================= */}
              <section className="page" id="combat" aria-labelledby="h-cb">
                <Garde><CombatPrep /></Garde>
                <Garde><Battle>
                  <Board />
                </Battle></Garde>
                <Garde><Result /></Garde>
              </section>
              {/* ================= TYPES ================= */}
              <Garde><Guide /></Garde>
              <Garde><Carte /></Garde>
              <Garde><Pokedex /></Garde>
              <Garde><Quetes /></Garde>
              <Garde><Sac /></Garde>
              <Garde><Settings /></Garde>
              <Garde><Camp /></Garde>
              {/* ================= LIGUE ================= */}
              <Garde><Ligue /></Garde>
            </div></main>
          <footer className="foot"><div className="wrap"><span>Pokémon Résonance · fangame non officiel · v4.77</span><span>Pokémon © Nintendo · Creatures Inc. · GAME FREAK · fangame sans affiliation</span></div></footer>
        </div>
        <Garde><BottomNav /></Garde>
      </div>
      <Garde><Fiche /></Garde>
      <Garde><Enc /></Garde>
      <Garde><Saves /></Garde>
      <Garde><Starter /></Garde>
      <Garde><Coach /></Garde>
      <Garde><Toast /></Garde>
      {/* surcouches ajoutées à la fin de <body> par le moteur, dans leur ordre d'apparition */}
      <Garde><V4Menu /></Garde>
      <Garde><Intro /></Garde>
      <Garde><Tip429 /></Garde>
      <Garde><Dialogs /></Garde>
      <Garde><Temporaires /></Garde>
    </>
  );
}
