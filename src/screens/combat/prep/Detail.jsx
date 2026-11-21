import { Html } from '../../../lib/html.jsx';
import { GYMS } from '../../../engine/data/game-data.js';
import { BY, SCEN } from '../../../engine/pokemon/pokemon.js';
import { PROFILE } from '../../../engine/state/game-state.js';
import { ARENAS } from '../../../engine/modes/gyms.js';
import { medal, typeColor } from '../../../engine/core/utils.js';
import { scenLock } from '../../../engine/combat/items-bonds-ai.js';
import { CHAP, leaderOf } from '../../../engine/progression/prestige.js';
import { emblem, goalChips, groupOf, wonOf } from '../../../engine/world/home-journey.js';
import { styleOf } from '../../../engine/combat/leader-styles.js';

// The old template separated its blocks with « \n  »: we keep these text nodes,
// merged when a conditional block is empty (like the old innerHTML).
const SEP = '\n  ';
function joinBlocks(blocks) {
  const out = [];
  let sep = '';
  blocks.forEach((b, i) => {
    if (i) {
      sep += SEP;
    }
    if (!b) {
      return;
    }
    if (sep) {
      out.push(sep);
    }
    sep = '';
    out.push(b);
  });
  if (sep) {
    out.push(sep);
  }
  return out;
}

// Selected battle's sheet (#selDet).
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
    <div key="h" className="prep-card-head" style={{ '--ac': s.at ? typeColor(s.at) : '#E3350D' }}>
      <Html html={emblem(k, 'is-large')} />
      <div>
        <p className="kicker">
          <Html
            html={`${C ? C.c : groupOf(k) === 'terrains' ? 'Entraînement' : 'Ligue'}${won ? ' · réussi' : ''}${r ? ` · rang ${r}` : ''}`}
          />
        </p>
        <h2 className="section-title">
          <Html html={k === 'champ' ? 'Finale de la Ligue' : s.n} />
        </h2>
        {L && (
          <p className="prep-card-leader">
            <b>
              <Html html={L.n} />
            </b>
            <Html html={' · ' + L.t} />
          </p>
        )}
      </div>
    </div>,
    L && (
      <div key="q" className="dialogue-box is-small">
        <p>
          <Html html={L.q} />
        </p>
      </div>
    ),
    gi >= 0 && (
      <p key="r" className="prep-card-rule">
        <b>Règle de l’arène</b>
        <Html html={GYMS[gi].r} />
      </p>
    ),
    st && (
      <p key="s" className="prep-card-rule">
        <b>
          <Html html={'Style · ' + st.n} />
        </b>
        <Html html={st.d} />
      </p>
    ),
    <p key="d" className="prep-card-text">
      <Html html={s.d} />
    </p>,
    <div key="c" className="hh-chips">
      <Html html={goalChips(s)} />
      {s.catch ? <span>Capture possible</span> : null}
    </div>,
    <div key="f" className="prep-card-foes">
      {s.foes.map(([f], i) => (
        <span key={i} className="prep-card-foe">
          <Html html={medal(BY[f].t, 'is-small')} />
          <em>
            <Html html={BY[f].n} />
          </em>
        </span>
      ))}
    </div>,
    lk && (
      <p key="l" className="prep-card-lock">
        <svg>
          <use href="#i-lock" />
        </svg>
        <Html html={lk} />
      </p>
    ),
  ];
  return joinBlocks(blocks);
}
