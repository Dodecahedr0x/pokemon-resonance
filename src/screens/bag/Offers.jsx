import { ITEMS2 } from '../../engine/state/game-state.js';
import { HELD_IMG, SHOP, fmt } from '../../engine/state/economy.js';
import { ITM } from '../../engine/assets/item-icons.js';
import { costOf0 } from '../../engine/progression/base-camp.js';
import { HELD_SHOP, dailyOffers, dailyDiscount } from '../../engine/combat/resonance.js';
import { Disc } from './Items.jsx';

// Daily offers (v4.14): −30% until midnight; data-offre opens the category (engine).
export default function Offers() {
  return (
    <section className="v4-offres v4-panel" aria-label="Offres du jour">
      <h3>
        <svg>
          <use href="#i-shop" />
        </svg>
        Offres du jour<span>−30 % jusqu’à minuit</span>
      </h3>
      <div className="v4-off-l">
        {dailyOffers().map((k, i) => {
          const h = !!HELD_SHOP[k],
            it = h ? ITEMS2[k] : SHOP[k],
            p0 = h ? HELD_SHOP[k].p : costOf0(k);
          return (
            <button key={i} type="button" className="v4-off-i" data-offre={h ? 'held' : it.category}>
              {!h && it.mv ? <Disc it={it} /> : <img src={ITM(h ? HELD_IMG[k] : it.img)} alt="" loading="lazy" />}
              <b>{it.n}</b>
              <span>
                <s>{fmt(p0)} ₽</s>
                {fmt(dailyDiscount(k, p0))} ₽
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
