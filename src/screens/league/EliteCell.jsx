import { Html } from '../../lib/html.jsx';
import { BY, SCEN } from '../../engine/pokemon/pokemon.js';
import { PROFILE } from '../../engine/state/game-state.js';
import { medal, tc } from '../../engine/core/utils.js';
import { ELITE, scenLock } from '../../engine/combat/items-bonds-ai.js';
import { CHAMP_L, ELITE_L } from '../../engine/progression/prestige.js';
import { wonOf } from '../../engine/world/home-journey.js';

import Button from '../../components/Button.jsx';
// Elite 4 and Champion (#eliteCase): trainer name (v4.20) and best rank (v4.24).
export default function EliteCell() {
  return (
    <>
      <div className="case-h">
        <span>Conseil 4 et Champion</span>
        <span>{`${Math.min(PROFILE.elite, 4)} / 4 · ${PROFILE.elite >= 5 ? 'Champion battu' : 'Champion à défier'}`}</span>
      </div>
      <div className="el-grid">
        {[...ELITE, 'champ'].map((k, i) => (
          <Card key={k} k={k} L={i < 4 ? ELITE_L[i] : CHAMP_L} />
        ))}
      </div>
    </>
  );
}

function Card({ k, L }) {
  const s = SCEN[k],
    lk = scenLock(k),
    won = wonOf(k),
    r = (PROFILE.ranks || {})[k];
  return (
    <article
      className={`el-c${won ? ' won' : ''}${lk ? ' locked' : ''}`}
      style={{ '--ac': s.at ? tc(s.at) : 'var(--gold)' }}
    >
      <span className="el-k">{k === 'champ' ? '★' : s.elite}</span>
      <b>
        <Html html={s.n.replace('Conseil 4 · ', '')} />
      </b>
      <span className="el-ld">
        <Html html={L.n} />
      </span>
      <span className="el-f">
        {s.foes.map(([f], j) => (
          <Html key={j} html={medal(BY[f].t, 'sm')} />
        ))}
      </span>
      <em>
        <Html html={lk || (won ? 'Vaincu' : `N.${s.lv} · ${s.lim} manches`)} />
      </em>
      <Button size="small" variant={lk ? undefined : 'primary'} data-chal={k} disabled={!!lk}>
        {won ? 'Rejouer' : 'Défier'}
      </Button>
      {r && (
        <span className={`rk-t rk-${r}`} title={`Meilleur rang : ${r}`}>
          {r}
        </span>
      )}
    </article>
  );
}
