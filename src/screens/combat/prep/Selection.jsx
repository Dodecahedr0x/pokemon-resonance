import { Html } from '../../../lib/html.jsx';
import { PROFILE } from '../../../engine/011-05-etat-de-partie.js';
import { SCEN } from '../../../engine/009-03-pokemon.js';
import { ARENAS, BADGES } from '../../../engine/013-07-arenes.js';
import { tc } from '../../../engine/014-08-outils.js';
import { scenLock } from '../../../engine/022-15-systemes-objets-liens-ia.js';
import { scSel } from '../../../engine/024-17-interface-combat.js';
import { leaderOf } from '../../../engine/030-24-prestige-mise-en-scene.js';
import { SELG, emblem, selItems, wonOf } from '../../../engine/031-25-v3-parcours-accueil.js';
import { FINALE_N } from '../../../engine/037-v4-05-carte.js';

// Onglets (#selTabs) : Entraînement, Arènes, Ligue, Après-jeu. Clics : moteur (data-pg).
export function SelTabs({ G }) {
  const nA = BADGES.length,
    nL = Math.min(4, PROFILE.elite);
  const cnt = {
    terrains: `${selItems('terrains').length} combats`,
    arenes: `${nA} / 8 badges`,
    ligue: `${nL} / 4${PROFILE.elite >= 5 ? ' · ★' : ''}`,
    apres: `${PROFILE.legends.length} / 6 · étage ${PROFILE.tdr.best}`
  };
  return SELG.map(([g, n, ic]) => (
    <button key={g} type="button" role="tab" data-pg={g} aria-selected={G === g}>
      <svg>
        <use href={'#' + ic} />
      </svg>
      <span>
        <b>{n}</b>
        <em>{cnt[g]}</em>
      </span>
    </button>
  ));
}

// Une ligne de la liste (#scenList) : emblème, nom, et à droite verrou, étape, rang ou niveau.
function Row({ k, gk }) {
  const s = SCEN[k],
    lk = scenLock(k),
    won = wonOf(k),
    L = leaderOf(k),
    r = (PROFILE.ranks || {})[k],
    gi = ARENAS.findIndex(a => a.k === k);
  const right = lk ? (
    <svg className="srw-lk" aria-label="Verrouillé">
      <use href="#i-lock" />
    </svg>
  ) : k === gk ? (
    <span className="pill nx">Prochaine étape</span>
  ) : r ? (
    <span className={`rk-t rk-${r}`} title="Meilleur rang">
      {r}
    </span>
  ) : won ? (
    <svg className="srw-ok" aria-label="Réussi">
      <use href="#i-check" />
    </svg>
  ) : (
    <span className="srw-lv">N.{s.lv}</span>
  );
  return (
    <button
      type="button"
      role="option"
      className={`srw${scSel === k ? ' on' : ''}${lk ? ' locked' : ''}${won ? ' won' : ''}`}
      data-sc={k}
      aria-selected={scSel === k}
      style={{ '--ac': s.at ? tc(s.at) : '#E3350D' }}
    >
      <Html html={emblem(k, 'sm' + (gi >= 0 && !won ? ' dim' : ''))} />
      <span className="srw-t">
        <b>
          <Html html={k === 'champ' ? FINALE_N : s.n} />
        </b>
        <em>
          <Html html={L ? L.n : s.tuto ? 'Combat guidé · 7 étapes' : s.lvl || ''} />
        </em>
      </span>
      <span className="srw-r">{right}</span>
    </button>
  );
}

export function SelList({ G, gk }) {
  return selItems(G).map((k, i) => <Row key={i} k={k} gk={gk} />);
}
