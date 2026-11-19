import { Html } from '../../lib/html.jsx';
import { GYMS } from '../../engine/data/game-data.js';
import { BY } from '../../engine/pokemon/pokemon.js';
import { badgeSvg } from '../../engine/modes/league.js';
import { squad } from '../../engine/team/team.js';
import { goalInfo } from '../../engine/world/home-journey.js';
import { ART, ITM } from '../../engine/assets/item-icons.js';

// Illustrated shortcuts on the Home page (#v4Tiles, old renderTiles).
const TILES = [
  ['carte', 'Explorer', 'Parcourez la région et ses hautes herbes', 'i-map', 't-exp'],
  ['combat', 'Combats', 'Affrontez dresseurs et maîtres d’arène', 'i-fight', 't-cb'],
  ['pokedex', 'Équipe', 'Recrutez, composez, faites évoluer', 'i-team', 't-team'],
  ['sac', 'Boutique', 'Poké Balls, Potions et objets', 'i-shop', 't-shop'],
  ['ligue', 'Défis', 'Arènes, Conseil 4 et Championne', 'i-league', 't-defi'],
];

const Scene = ({ pos }) => <span className="v4t-scene" style={{ backgroundPosition: pos }} />;

const ART_TUILE = {
  carte: () => <Scene pos="38% 46%" />,
  combat: () => {
    const g = goalInfo(),
      f = (g.S.foes || []).slice(-1)[0],
      m = (f && BY[f[0]]) || BY.dracaufeu;
    return (
      <>
        <Scene pos="72% 40%" />
        <img className="v4t-art" src={ART(m.no)} alt="" loading="lazy" />
      </>
    );
  },
  pokedex: () => (
    <>
      <Scene pos="12% 70%" />
      <img className="v4t-art" src={ART(BY[squad[0] || 'pikachu'].no)} alt="" loading="lazy" />
    </>
  ),
  sac: () => (
    <>
      <span className="v4t-shop" />
      <img className="v4t-item i1" src={ITM('poke-ball')} alt="" loading="lazy" />
      <img className="v4t-item i2" src={ITM('great-ball')} alt="" loading="lazy" />
      <img className="v4t-item i3" src={ITM('potion')} alt="" loading="lazy" />
    </>
  ),
  ligue: () => {
    const g = goalInfo();
    return (
      <>
        <span className="v4t-aura" />
        <span className="v4t-badge">
          {g.gi >= 0 ? (
            <Html html={badgeSvg(g.gi, GYMS[g.gi].t, 'v4t' + g.gi)} />
          ) : (
            <svg viewBox="0 0 24 24">
              <use href="#i-trophy" />
            </svg>
          )}
        </span>
      </>
    );
  },
};

export default function Tiles({ on }) {
  return (
    <nav className="v4-tiles" id="v4Tiles" aria-label="Raccourcis">
      {on &&
        TILES.map(([k, t, d, i, c]) => (
          <a key={k} className={`v4-tile ${c}`} data-t={k} href={`#${k}`}>
            {ART_TUILE[k]()}
            <span className="v4t-shade" />
            <span className="v4t-ic">
              <svg>
                <use href={`#${i}`} />
              </svg>
            </span>
            <span className="v4t-tx">
              <b>{t}</b>
              <em>{d}</em>
            </span>
          </a>
        ))}
    </nav>
  );
}
