import { Html } from '../../../lib/html.jsx';
import { GYMS } from '../../../engine/004-01-donnees.js';
import { BY, SCEN } from '../../../engine/009-03-pokemon.js';
import { PROFILE } from '../../../engine/011-05-etat-de-partie.js';
import { ARENAS } from '../../../engine/013-07-arenes.js';
import { medal, tc } from '../../../engine/014-08-outils.js';
import { scenLock } from '../../../engine/022-15-systemes-objets-liens-ia.js';
import { CHAP, leaderOf } from '../../../engine/030-24-prestige-mise-en-scene.js';
import { emblem, goalChips, groupOf, wonOf } from '../../../engine/031-25-v3-parcours-accueil.js';
import { styleOf } from '../../../engine/043-v4-4-01-aventure-plus.js';

// L'ancien gabarit séparait ses blocs par « \n  » : on garde ces nœuds texte,
// fusionnés quand un bloc conditionnel est vide (comme l'ancien innerHTML).
const SEP = '\n  ';
function joinBlocks(blocks) {
  const out = [];
  let sep = '';
  blocks.forEach((b, i) => {
    if (i) sep += SEP;
    if (!b) return;
    if (sep) out.push(sep);
    sep = '';
    out.push(b);
  });
  if (sep) out.push(sep);
  return out;
}

// Fiche du combat sélectionné (#selDet).
export default function Detail({ k }) {
  const s = SCEN[k],
    lk = scenLock(k),
    L = leaderOf(k),
    C = CHAP(k),
    gi = ARENAS.findIndex(a => a.k === k),
    won = wonOf(k),
    r = (PROFILE.ranks || {})[k],
    st = styleOf(k);
  const blocks = [
    <div key="h" className="sx-h" style={{ '--ac': s.at ? tc(s.at) : '#E3350D' }}>
      <Html html={emblem(k, 'lg')} />
      <div>
        <p className="kick">
          <Html html={`${C ? C.c : groupOf(k) === 'terrains' ? 'Entraînement' : 'Ligue'}${won ? ' · réussi' : ''}${r ? ` · rang ${r}` : ''}`} />
        </p>
        <h2 className="h2">
          <Html html={k === 'champ' ? 'Finale de la Ligue' : s.n} />
        </h2>
        {L && (
          <p className="sx-who">
            <b>
              <Html html={L.n} />
            </b>
            <Html html={' · ' + L.t} />
          </p>
        )}
      </div>
    </div>,
    L && (
      <div key="q" className="dlgbox sm">
        <p>
          <Html html={L.q} />
        </p>
      </div>
    ),
    gi >= 0 && (
      <p key="r" className="sx-rule">
        <b>Règle de l’arène</b>
        <Html html={GYMS[gi].r} />
      </p>
    ),
    st && (
      <p key="s" className="sx-rule">
        <b>
          <Html html={'Style · ' + st.n} />
        </b>
        <Html html={st.d} />
      </p>
    ),
    <p key="d" className="sx-d">
      <Html html={s.d} />
    </p>,
    <div key="c" className="hh-chips">
      <Html html={goalChips(s)} />
      {s.catch ? <span>Capture possible</span> : null}
    </div>,
    <div key="f" className="sx-foes">
      {s.foes.map(([f], i) => (
        <span key={i} className="sx-f">
          <Html html={medal(BY[f].t, 'sm')} />
          <em>
            <Html html={BY[f].n} />
          </em>
        </span>
      ))}
    </div>,
    lk && (
      <p key="l" className="sx-lock">
        <svg>
          <use href="#i-lock" />
        </svg>
        <Html html={lk} />
      </p>
    )
  ];
  return joinBlocks(blocks);
}
