import { MOVES } from '../../engine/data/moves.js';
import { REACTIONS } from '../../engine/data/game-data.js';
import { FAMS30, POKEMON_LIST, NEWS } from '../../engine/pokemon/pokemon.js';
import { ARRIVAL_EFFECTS } from '../../engine/pokemon/evolution.js';
import { strokeIcon } from '../../engine/core/utils.js';
import { Html } from '../../lib/html.jsx';
import { space } from '../../lib/theme.js';

import Button from '../../components/Button.jsx';
export function Pillars() {
  return NEWS.map(o => (
    <article key={o.n} className="guide-pillar" style={{ '--c': o.c }}>
      <span className="guide-pillar-icon">
        <Html html={strokeIcon(o.i)} />
      </span>
      <span className="guide-pillar-tag">{o.tg}</span>
      <h3 className="card-title">{o.n}</h3>
      <p>
        <Html html={o.d} />
      </p>
    </article>
  ));
}

export function Digits() {
  return [
    [FAMS30.length, 'Familles à recruter'],
    [POKEMON_LIST.filter(m => !m.isEnemy).length, 'Pokémon en combat'],
    [Object.keys(ARRIVAL_EFFECTS).length, 'Arrivées uniques'],
    [Object.keys(MOVES).length, 'Capacités'],
    [Object.keys(REACTIONS).length - 1, 'Réactions'],
    ['0 %', 'De hasard'],
  ].map(([n, l]) => (
    <div key={l} className="guide-figure">
      <b>{n}</b>
      <span>{l}</span>
    </div>
  ));
}

// "Project" panel (no tab: opened only by link): pillars, figures, studio.
export default function Project() {
  return (
    <>
      <div className="guide-section">
        <div className="guide-section-header">
          <div>
            <p className="kicker">Concept</p>
            <h2 className="section-title">Les piliers de Résonance</h2>
          </div>
          <Button size="small" data-go="pokedex">
            Voir les familles
          </Button>
        </div>
        <div className="guide-pillars" id="newsGrid">
          <Pillars />
        </div>
      </div>
      <div className="guide-figures" id="kpis">
        <Digits />
      </div>
      <div className="guide-section" id="studio">
        <div className="guide-section-header">
          <div>
            <p className="kicker">Studio</p>
            <h2 className="section-title">Du papier au prototype</h2>
            <p className="d">
              Le cœur du jeu est déterministe : il se teste d’abord sur papier, avec des jetons et un plateau imprimé.
            </p>
          </div>
        </div>
        <div className="guide-studio">
          <div className="guide-studio-card">
            <p className="kicker">Tranche verticale</p>
            <h3 className="card-title">Le contenu minimal</h3>
            <ul className="guide-scope">
              <li>
                Pokémon jouables<b>82</b>
              </li>
              <li>
                Marques · réactions<b>6 · 14</b>
              </li>
              <li>
                Météos · objets<b>4 · 6</b>
              </li>
              <li>
                Arènes · Conseil 4<b>8 · 4</b>
              </li>
              <li>
                Terrains avec capture<b>4</b>
              </li>
              <li>
                Techniques combinées<b>8</b>
              </li>
            </ul>
          </div>
          <div className="guide-studio-card">
            <p className="kicker">Architecture · Godot 4</p>
            <h3 className="card-title">Les règles séparées de l’image</h3>
            <div className="guide-layers">
              <div className="guide-layer">
                <div>
                  <b>Données</b>
                  <span>Espèces, capacités, matrice, météos</span>
                </div>
                <span className="guide-layer-tag">JSON</span>
              </div>
              <div className="guide-layer is-core">
                <div>
                  <b>Moteur de règles</b>
                  <span>Déterministe, testable, rejouable</span>
                </div>
                <span className="guide-layer-tag">GDScript</span>
              </div>
              <div className="guide-layer">
                <div>
                  <b>IA adverse</b>
                  <span>Choisit sa cible au moment d’agir</span>
                </div>
                <span className="guide-layer-tag">Recherche</span>
              </div>
              <div className="guide-layer">
                <div>
                  <b>Présentation</b>
                  <span>Plateau hex, animations, interface</span>
                </div>
                <span className="guide-layer-tag">Scènes</span>
              </div>
            </div>
          </div>
        </div>
        <div className="guide-roadmap" style={{ marginTop: space.md }}>
          <div className="guide-roadmap-step">
            <span className="guide-roadmap-number">1</span>
            <span className="guide-roadmap-duration">2 semaines</span>
            <h3 className="card-title">Papier</h3>
            <p>Plateau imprimé, jetons, 8 Pokémon. On valide que les réactions créent de vrais choix.</p>
          </div>
          <div className="guide-roadmap-step">
            <span className="guide-roadmap-number">2</span>
            <span className="guide-roadmap-duration">6 semaines</span>
            <h3 className="card-title">Prototype gris</h3>
            <p>Moteur de règles sans graphismes. Tests automatiques de chaque réaction.</p>
          </div>
          <div className="guide-roadmap-step">
            <span className="guide-roadmap-number">3</span>
            <span className="guide-roadmap-duration">3 mois</span>
            <h3 className="card-title">Tranche verticale</h3>
            <p>Interface complète, 16 Pokémon, 2 Arènes, capture, Liens et météo.</p>
          </div>
          <div className="guide-roadmap-step">
            <span className="guide-roadmap-number">4</span>
            <span className="guide-roadmap-duration">Ensuite</span>
            <h3 className="card-title">Contenu</h3>
            <p>Région complète, 8 Arènes, Ligue et Champion adaptatif.</p>
          </div>
        </div>
        <div className="guide-legal" style={{ marginTop: space.md }}>
          <span className="guide-legal-icon">!</span>
          <p>
            <b>Point juridique.</b> Pokémon est une marque de Nintendo, Creatures Inc. et GAME FREAK. Un fangame avec
            noms et visuels officiels doit rester gratuit et non commercial, et peut tout de même recevoir une demande
            de retrait. Les règles de Résonance ne dépendent d’aucune espèce précise : elles se transposent telles
            quelles sur des créatures originales.
          </p>
        </div>
      </div>
    </>
  );
}
