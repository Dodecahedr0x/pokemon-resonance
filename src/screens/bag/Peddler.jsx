import { ITEMS2, PROFILE } from '../../engine/state/game-state.js';
import { ITM } from '../../engine/assets/item-icons.js';
import { SHOP, bagN, formatNumber } from '../../engine/state/economy.js';
import { costOf0 } from '../../engine/progression/base-camp.js';
import { heldItemCost } from '../../engine/combat/resonance.js';
import { todaysPeddler } from '../../engine/world/route-events.js';
import { Disc } from './Items.jsx';

// Shop › Peddler (v4.54): limited stock of the day, data-wanderer (engine).
export default function Peddler() {
  const A = todaysPeddler();
  if (!A.present) {
    return (
      <p className="note">
        Le colporteur n’est pas passé aujourd’hui. Il revient certains jours, avec des prix réduits.
      </p>
    );
  }
  const row = k => {
    const it = SHOP[k],
      px = Math.max(50, Math.round((costOf0(k) * 0.75) / 50) * 50),
      left = (it.mv ? 1 : 3) - (A.st.got[k] || 0);
    return (
      <article key={k} className="item-row">
        {it.mv ? (
          <Disc it={it} />
        ) : (
          <span className="item-row-icon">
            <img src={ITM(it.img)} alt="" loading="lazy" />
          </span>
        )}
        <div className="item-row-text">
          <b>{it.n}</b>
          <p>{it.d}</p>
          <em>
            Reste {left} · Dans le Sac : {bagN(k)}
          </em>
        </div>
        <div>
          <button
            type="button"
            className="pill-button"
            data-wanderer={k}
            disabled={left <= 0 || PROFILE.money < px || bagN(k) >= 99}
          >
            {formatNumber(px)} ₽
          </button>
        </div>
      </article>
    );
  };
  let th = null;
  if (A.th) {
    const px = Math.round((heldItemCost(A.th) * 0.8) / 50) * 50,
      takenSet = A.st.got['h:' + A.th];
    th = (
      <article className="item-row">
        <span className="item-row-icon">
          <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d={ITEMS2[A.th].i} />
          </svg>
        </span>
        <div className="item-row-text">
          <b>{ITEMS2[A.th].n}</b>
          <p>{ITEMS2[A.th].d}</p>
          <em>Objet tenu, un seul exemplaire</em>
        </div>
        <div>
          <button
            type="button"
            className="pill-button"
            data-wanderer={'h:' + A.th}
            disabled={!!takenSet || PROFILE.money < px}
          >
            {formatNumber(px)} ₽
          </button>
        </div>
      </article>
    );
  }
  return (
    <>
      <p className="note bag-peddler-intro">
        <b>{A.displayName}, le colporteur</b> a posé sa carriole aujourd’hui. Stock limité, il repart à minuit.
      </p>
      {A.pick.map(row)}
      {th}
    </>
  );
}
