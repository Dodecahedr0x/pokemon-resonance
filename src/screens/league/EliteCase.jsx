import { Html } from '../../lib/html.jsx';
import { BY, SCEN } from '../../engine/009-pokemon.js';
import { PROFILE } from '../../engine/011-game-state.js';
import { medal, tc } from '../../engine/014-utils.js';
import { ELITE, scenLock } from '../../engine/022-items-bonds-ai.js';
import { CHAMP_L, ELITE_L } from '../../engine/030-prestige-staging.js';
import { wonOf } from '../../engine/031-home-journey.js';

// Conseil 4 et Champion (#eliteCase) : nom du dresseur (v4.20) et meilleur rang (v4.24).
export default function EliteCell() {
  return (
    <>
      <div className="case-h"><span>Conseil 4 et Champion</span><span>{`${Math.min(PROFILE.elite, 4)} / 4 · ${PROFILE.elite >= 5 ? 'Champion battu' : 'Champion à défier'}`}</span></div>
      <div className="el-grid">
        {[...ELITE, 'champ'].map((k, i) => (
          <MapScreen key={k} k={k} L={i < 4 ? ELITE_L[i] : CHAMP_L} />
        ))}
      </div>
    </>
  );
}

function MapScreen({ k, L }) {
  const s = SCEN[k],
    lk = scenLock(k),
    won = wonOf(k),
    r = (PROFILE.ranks || {})[k];
  return (
    <article className={`el-c${won ? ' won' : ''}${lk ? ' locked' : ''}`} style={{ '--ac': s.at ? tc(s.at) : 'var(--gold)' }}>
      <span className="el-k">{k === 'champ' ? '★' : s.elite}</span>
      <b><Html html={s.n.replace('Conseil 4 · ', '')} /></b>
      <span className="el-ld"><Html html={L.n} /></span>
      <span className="el-f">{s.foes.map(([f], j) => <Html key={j} html={medal(BY[f].t, 'sm')} />)}</span>
      <em><Html html={lk || (won ? 'Vaincu' : `N.${s.lv} · ${s.lim} manches`)} /></em>
      <button type="button" className={`b b-sm${lk ? '' : ' b-gold'}`} data-chal={k} disabled={!!lk}>{won ? 'Rejouer' : 'Défier'}</button>
      {r && <span className={`rk-t rk-${r}`} title={`Meilleur rang : ${r}`}>{r}</span>}
    </article>
  );
}
