import { GYMS } from '../../engine/data/game-data.js';
import { POKEMON } from '../../engine/pokemon/pokemon.js';
import {
  BADGE_REWARD,
  HELD_ITEMS,
  LINK_N,
  LINK_T,
  isCamp,
  linkPts,
  lvlOfPts,
  ownedItems,
} from '../../engine/state/game-state.js';
import { strokeIcon, medal, typeColor } from '../../engine/core/utils.js';
import { listDuos } from '../../engine/combat/duo-techniques.js';
import { Html } from '../../lib/html.jsx';
import { useGuide } from './guideStore.js';
import { space } from '../../lib/theme.js';

function sourceObject(k) {
  const i = BADGE_REWARD.findIndex(r => r.item === k);
  return i < 0 ? '' : `Badge ${GYMS[i].t} · Arène ${i + 1}`;
}

// Held items: obtained (campaign), available (Free mode) or upcoming gym reward.
export function Items() {
  useGuide();
  const own = ownedItems();
  return Object.entries(HELD_ITEMS).map(([k, it]) => {
    const has = own.includes(k);
    return (
      <div key={k} className={`guide-item${has ? '' : ' is-missing'}`}>
        <span className="guide-item-icon">
          <Html html={strokeIcon(it.i)} />
        </span>
        <span>
          <b>{it.n}</b>
          <Html html={it.d} />
          <em className="guide-item-source">
            {has ? (isCamp() ? 'Obtenu' : 'Disponible') : 'Récompense : ' + sourceObject(k)}
          </em>
        </span>
      </div>
    );
  });
}

// Combined techniques: progression of each duo's Bond (re-read on every display of the Guide).
export function Duos() {
  useGuide();
  return Object.entries(listDuos()).map(([k, d]) => {
    const [x, y] = k.split('|'),
      a = POKEMON[x],
      b = POKEMON[y];
    if (!a || !b) {
      return null;
    }
    const v = linkPts(x, y),
      l = lvlOfPts(v),
      pc = Math.min(100, Math.round((v / LINK_T[2]) * 100));
    return (
      <article
        key={k}
        className={`guide-combo${l >= 3 ? ' is-unlocked' : ''}`}
        style={{ '--a': typeColor(a.t[0]), '--b': typeColor(b.t[0]) }}
      >
        <div className="guide-combo-header">
          <Html html={medal(a.t)} />
          <Html html={medal(b.t)} />
        </div>
        <span className="guide-combo-pair">
          {a.n} et {b.n}
        </span>
        <h3>{d.n}</h3>
        <p>
          <Html html={d.d} />
        </p>
        <div className="guide-combo-status">
          <span className="guide-combo-bar">
            <i style={{ width: pc + '%' }} />
          </span>
          <em>{l >= 3 ? 'Débloquée' : `Lien ${v} / ${LINK_T[2]}${l ? ' · ' + LINK_N[l] : ''}`}</em>
        </div>
      </article>
    );
  });
}

// « Ligue » (League) tab: links, capture, fatigue, items, combined techniques, Champion.
export default function League() {
  return (
    <>
      <div className="guide-section">
        <div className="guide-section-header">
          <div>
            <p className="kicker">Entre les combats</p>
            <h2 className="section-title">Liens, capture, fatigue, objets</h2>
            <p className="description">
              Quatre systèmes de campagne qui obligent à faire tourner tout le Box, petits Pokémon compris.
            </p>
          </div>
        </div>
        <div className="guide-topics">
          <div className="guide-topic">
            <span className="guide-topic-label">Liens</span>
            <h3 className="card-title">Trois paliers</h3>
            <p>
              Une réaction préparée par un allié et déclenchée par un autre donne +1 Lien au duo. Si aucun des deux n’a
              évolué pendant le combat, les points comptent double.
            </p>
            <div className="guide-bond-tier">
              <div className="guide-bond-pips">
                <i className="is-filled" />
                <i />
                <i />
              </div>
              <span>
                <b>Soutien</b> · 2 pts · −1 dégât subi côte à côte
              </span>
            </div>
            <div className="guide-bond-tier">
              <div className="guide-bond-pips">
                <i className="is-filled" />
                <i className="is-filled" />
                <i />
              </div>
              <span>
                <b>Synchro</b> · 5 pts · +25 % sur les réactions préparées l’un pour l’autre
              </span>
            </div>
            <div className="guide-bond-tier">
              <div className="guide-bond-pips">
                <i className="is-filled" />
                <i className="is-filled" />
                <i className="is-filled" />
              </div>
              <span>
                <b>Duo</b> · 9 pts · technique combinée
              </span>
            </div>
          </div>
          <div className="guide-topic">
            <span className="guide-topic-label">Capture</span>
            <h3 className="card-title">Convaincre sans assommer</h3>
            <p>Dans les hautes herbes et sur les terrains d’entraînement. Un Pokémon K.O. s’enfuit.</p>
            <ol className="guide-capture-steps">
              <li>Affaiblir sous 25 % des PV.</li>
              <li>Immobiliser : Gel, Paralysie, Sommeil, Racines ou Toile.</li>
              <li>Un allié au contact, qui n’a pas encore agi, dépense 2 Voix.</li>
            </ol>
          </div>
          <div className="guide-topic">
            <span className="guide-topic-label">Fatigue · campagne</span>
            <h3 className="card-title">Faire tourner le Box</h3>
            <p>
              Chaque combat ajoute 30 % à ceux qui y ont pris part, les autres récupèrent 25 %. À 70 %, un Pokémon perd
              1 Mouvement. L’Éveil efface la fatigue sur-le-champ.
            </p>
            <div className="guide-fatigue">
              <div className="guide-fatigue-row is-high">
                <span>Dracaufeu</span>
                <div className="guide-fatigue-bar">
                  <i style={{ width: '84%' }} />
                </div>
                <span>84 %</span>
              </div>
              <div className="guide-fatigue-row">
                <span>Pikachu</span>
                <div className="guide-fatigue-bar">
                  <i style={{ width: '52%' }} />
                </div>
                <span>52 %</span>
              </div>
              <div className="guide-fatigue-row is-low">
                <span>Chenipan</span>
                <div className="guide-fatigue-bar">
                  <i style={{ width: '12%' }} />
                </div>
                <span>12 %</span>
              </div>
            </div>
          </div>
          <div className="guide-topic">
            <span className="guide-topic-label">Objets tenus</span>
            <h3 className="card-title">Un objet par Pokémon</h3>
            <p>Gagnés avec les badges d’arène, équipés depuis la fiche du Pokémon dans le Pokédex.</p>
            <div className="guide-items" id="items">
              <Items />
            </div>
          </div>
        </div>
      </div>
      <div className="guide-section">
        <div className="guide-section-header">
          <div>
            <p className="kicker">Palier 3</p>
            <h2 className="section-title">Techniques combinées</h2>
            <p className="description">
              Propres à un duo précis, débloquées au palier Duo (9 points de Lien). En combat : les deux Pokémon à 2
              cases au plus, aucun n’a encore agi, 2 Voix. Ils frappent l’un après l’autre.
            </p>
          </div>
        </div>
        <div className="guide-combos" id="duos">
          <Duos />
        </div>
      </div>
      <div className="guide-section">
        <div className="guide-champion">
          <div>
            <p className="kicker">Ligue Pokémon</p>
            <h2 className="title" style={{ marginTop: space.md }}>
              Un Champion qui a vu vos combats
            </h2>
          </div>
          <div>
            <p>
              Le Champion lit vos dix derniers combats : les types que vous attaquez, ceux de vos Pokémon, vos réactions
              favorites. Il compose une équipe de cinq Pokémon pour vous contrer et vous explique ses choix avant le
              combat. Il n’ouvre ses portes qu’après le Conseil 4. Pour gagner, il faut un Box large et des plans de
              rechange.
            </p>
            <div className="guide-champion-stats">
              <div>
                <b>10</b>
                <span>combats étudiés</span>
              </div>
              <div>
                <b>5</b>
                <span>Pokémon contre vous</span>
              </div>
              <div>
                <b>4</b>
                <span>membres du Conseil avant lui</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
