import { Html } from '../../lib/html.jsx';
import { GYMS } from '../../engine/data/game-data.js';
import { POKEMON, SCENARIOS } from '../../engine/pokemon/pokemon.js';
import { ARENAS, BADGES } from '../../engine/modes/gyms.js';
import { medal } from '../../engine/core/utils.js';
import { badgeSvg, gymSel } from '../../engine/modes/league.js';
import { LEAGUE_MASTERS } from '../../engine/progression/prestige.js';

import Button from '../../components/Button.jsx';
// Sheet of the chosen gym (#arena), with its gym Champion's line (v4.24).
export default function Arena() {
  const g = GYMS[gymSel],
    a = ARENAS[gymSel],
    D = SCENARIOS[a.k],
    won = BADGES.includes(gymSel),
    L = LEAGUE_MASTERS[gymSel];
  return (
    <>
      <div className="league-gym-badge">
        <Html html={badgeSvg(gymSel, g.t, 'bx')} />
      </div>
      <div>
        <p className="kicker">{`Arène ${gymSel + 1} sur 8 · N.${D.lv}${won ? ' · badge obtenu' : ''}`}</p>
        <h3 className="section-title">
          <Html html={g.n} />
        </h3>
        {L && (
          <div className="league-leader">
            <span className="league-leader-name">
              <b>
                <Html html={L.n} />
              </b>
              <em>
                <Html html={L.t} />
              </em>
            </span>
            <q>
              <Html html={L.q} />
            </q>
          </div>
        )}
        <p className="league-gym-text">
          <Html html={D.d} />
        </p>
        <div className="league-gym-foes">
          {D.foes.map(([f], i) => (
            <span key={i}>
              <Html html={medal(POKEMON[f].t, 'is-small')} />
              <em>
                <Html html={POKEMON[f].n} />
              </em>
            </span>
          ))}
        </div>
      </div>
      {'\n  '}
      <dl>
        <div>
          <dt>Règle de plateau</dt>
          <dd>
            <Html html={g.r} />
          </dd>
        </div>
        <div>
          <dt>Leçon</dt>
          <dd>
            <Html html={g.l} />
          </dd>
        </div>
        <div>
          <dt>Conditions</dt>
          <dd>{`${D.time === 'nuit' ? 'Nuit' : 'Jour'} · ${D.lim} manches · ${D.foes.length} adversaires`}</dd>
        </div>
        <div className="league-gym-action">
          <Button size="large" variant="primary" data-arena={a.k}>
            {won ? 'Rejouer l’arène' : 'Défier l’arène'}
            <svg>
              <use href="#i-arrow" />
            </svg>
          </Button>
        </div>
      </dl>
    </>
  );
}
