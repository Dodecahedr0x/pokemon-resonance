import { GYMS } from '../../engine/data/game-data.js';
import { BY } from '../../engine/pokemon/pokemon.js';
import {
  BADGE_REWARD,
  ITEMS2,
  LINK_N,
  LINK_T,
  isCamp,
  linkPts,
  lvlOfPts,
  ownedItems,
} from '../../engine/state/game-state.js';
import { ico, medal, tc } from '../../engine/core/utils.js';
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
  return Object.entries(ITEMS2).map(([k, it]) => {
    const has = own.includes(k);
    return (
      <div key={k} className={`it${has ? '' : ' off'}`}>
        <span className="ic">
          <Html html={ico(it.i)} />
        </span>
        <span>
          <b>{it.n}</b>
          <Html html={it.d} />
          <em className="it-src">{has ? (isCamp() ? 'Obtenu' : 'Disponible') : 'Récompense : ' + sourceObject(k)}</em>
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
      a = BY[x],
      b = BY[y];
    if (!a || !b) {
      return null;
    }
    const v = linkPts(x, y),
      l = lvlOfPts(v),
      pc = Math.min(100, Math.round((v / LINK_T[2]) * 100));
    return (
      <article key={k} className={`duo${l >= 3 ? ' on' : ''}`} style={{ '--a': tc(a.t[0]), '--b': tc(b.t[0]) }}>
        <div className="duo-h">
          <Html html={medal(a.t)} />
          <Html html={medal(b.t)} />
        </div>
        <span className="pair">
          {a.n} et {b.n}
        </span>
        <h3>{d.n}</h3>
        <p>
          <Html html={d.d} />
        </p>
        <div className="duo-st">
          <span className="lk-bar">
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
      <div className="section">
        <div className="section-header">
          <div>
            <p className="kicker">Entre les combats</p>
            <h2 className="section-title">Liens, capture, fatigue, objets</h2>
            <p className="d">
              Quatre systèmes de campagne qui obligent à faire tourner tout le Box, petits Pokémon compris.
            </p>
          </div>
        </div>
        <div className="quad">
          <div className="qc">
            <span className="lab">Liens</span>
            <h3 className="card-title">Trois paliers</h3>
            <p>
              Une réaction préparée par un allié et déclenchée par un autre donne +1 Lien au duo. Si aucun des deux n’a
              évolué pendant le combat, les points comptent double.
            </p>
            <div className="pal">
              <div className="seg">
                <i className="on" />
                <i />
                <i />
              </div>
              <span>
                <b>Soutien</b> · 2 pts · −1 dégât subi côte à côte
              </span>
            </div>
            <div className="pal">
              <div className="seg">
                <i className="on" />
                <i className="on" />
                <i />
              </div>
              <span>
                <b>Synchro</b> · 5 pts · +25 % sur les réactions préparées l’un pour l’autre
              </span>
            </div>
            <div className="pal">
              <div className="seg">
                <i className="on" />
                <i className="on" />
                <i className="on" />
              </div>
              <span>
                <b>Duo</b> · 9 pts · technique combinée
              </span>
            </div>
          </div>
          <div className="qc">
            <span className="lab">Capture</span>
            <h3 className="card-title">Convaincre sans assommer</h3>
            <p>Dans les hautes herbes et sur les terrains d’entraînement. Un Pokémon K.O. s’enfuit.</p>
            <ol className="cap">
              <li>Affaiblir sous 25 % des PV.</li>
              <li>Immobiliser : Gel, Paralysie, Sommeil, Racines ou Toile.</li>
              <li>Un allié au contact, qui n’a pas encore agi, dépense 2 Voix.</li>
            </ol>
          </div>
          <div className="qc">
            <span className="lab">Fatigue · campagne</span>
            <h3 className="card-title">Faire tourner le Box</h3>
            <p>
              Chaque combat ajoute 30 % à ceux qui y ont pris part, les autres récupèrent 25 %. À 70 %, un Pokémon perd
              1 Mouvement. L’Éveil efface la fatigue sur-le-champ.
            </p>
            <div className="fat">
              <div className="fr hi">
                <span>Dracaufeu</span>
                <div className="bar">
                  <i style={{ width: '84%' }} />
                </div>
                <span>84 %</span>
              </div>
              <div className="fr">
                <span>Pikachu</span>
                <div className="bar">
                  <i style={{ width: '52%' }} />
                </div>
                <span>52 %</span>
              </div>
              <div className="fr lo">
                <span>Chenipan</span>
                <div className="bar">
                  <i style={{ width: '12%' }} />
                </div>
                <span>12 %</span>
              </div>
            </div>
          </div>
          <div className="qc">
            <span className="lab">Objets tenus</span>
            <h3 className="card-title">Un objet par Pokémon</h3>
            <p>Gagnés avec les badges d’arène, équipés depuis la fiche du Pokémon dans le Pokédex.</p>
            <div className="items" id="items">
              <Items />
            </div>
          </div>
        </div>
      </div>
      <div className="section">
        <div className="section-header">
          <div>
            <p className="kicker">Palier 3</p>
            <h2 className="section-title">Techniques combinées</h2>
            <p className="d">
              Propres à un duo précis, débloquées au palier Duo (9 points de Lien). En combat : les deux Pokémon à 2
              cases au plus, aucun n’a encore agi, 2 Voix. Ils frappent l’un après l’autre.
            </p>
          </div>
        </div>
        <div className="duos" id="duos">
          <Duos />
        </div>
      </div>
      <div className="section">
        <div className="champ">
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
            <div className="stat-l">
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
