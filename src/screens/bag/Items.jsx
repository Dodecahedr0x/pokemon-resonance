import { MOVES } from '../../engine/data/moves.js';
import { POKEMON } from '../../engine/pokemon/pokemon.js';
import { ITEMS2, PROFILE, ownedItems } from '../../engine/state/game-state.js';
import { typeColor } from '../../engine/core/utils.js';
import { HELD_IMG, SHOP, bagN, formatNumber } from '../../engine/state/economy.js';
import { itemIcon } from '../../engine/assets/item-icons.js';
import { SCREEN_STATE } from '../../engine/ui/screen-state.js';
import { costOf } from '../../engine/progression/base-camp.js';
import { HELD_SHOP } from '../../engine/combat/resonance.js';

import Button from '../../components/Button.jsx';
// TM / HM disc: initials on the color of the move's type.
export const Disc = ({ it }) => (
  <span className="item-row-icon item-row-disc" style={{ '--c': typeColor(MOVES[it.mv].t) }}>
    <b>{it.sn.slice(0, 2)}</b>
  </span>
);

// Price chip in Shards.
export const Shards = () => (
  <span className="gem-icon">
    <svg>
      <use href="#i-gem" />
    </svg>
  </span>
);

// A Shop or Bag item (old itemRow): quantity data-qk, purchase data-buy,
// TM to learn data-apprendre, all handled by the engine.
export function Article({ k, mode }) {
  const it = SHOP[k],
    cs = it.cs, // an HM is bought once and kept
    q = cs ? 1 : SCREEN_STATE.qty[k] || 1,
    n = bagN(k),
    price = it.g ? it.g * q : costOf(k) * q, // Workshop (v4.10)
    can = it.g ? PROFILE.gems >= price : PROFILE.money >= price,
    full = cs ? n > 0 : n + q > 99;
  return (
    <article className="item-row">
      {it.mv ? (
        <Disc it={it} />
      ) : (
        <span className="item-row-icon">
          <img src={itemIcon(it.img)} alt="" loading="lazy" />
        </span>
      )}
      <div className="item-row-text">
        <b>{it.n}</b>
        <p>{it.d}</p>
        <em>{cs && n ? 'Dans le Sac' : `Dans le Sac : ${n}`}</em>
      </div>
      {mode === 'boutique' ? (
        <div className="item-row-actions">
          {cs ? null : (
            <div className="item-row-quantity" role="group" aria-label="Quantité">
              <button type="button" data-qk={k} data-qd="-1" aria-label="Moins" disabled={q <= 1}>
                −
              </button>
              <b>{q}</b>
              <button type="button" data-qk={k} data-qd="1" aria-label="Plus" disabled={q >= 10}>
                +
              </button>
            </div>
          )}
          <Button size="small" variant="primary" data-buy={k} disabled={!(can && !full)}>
            {cs && n ? (
              'Déjà achetée'
            ) : it.g ? (
              <>
                <Shards />
                {price}
              </>
            ) : (
              `${formatNumber(price)} ₽`
            )}
          </Button>
        </div>
      ) : it.mv ? (
        <div className="item-row-actions">
          <Button size="small" variant="primary" data-apprendre={k}>
            Apprendre
          </Button>
        </div>
      ) : null}
    </article>
  );
}

// A held item in the Bag (old heldRow): who holds it, or where to find it.
export function HeldItem({ k }) {
  const it = ITEMS2[k],
    own = ownedItems().includes(k),
    holder = Object.keys(PROFILE.equipment).find(id => PROFILE.equipment[id] === k);
  return (
    <article className={'item-row' + (own ? '' : ' is-locked')}>
      <span className="item-row-icon">
        <img src={itemIcon(HELD_IMG[k])} alt="" loading="lazy" />
      </span>
      <div className="item-row-text">
        <b>{it.n}</b>
        <p>{it.d}</p>
        <em>
          {own
            ? holder
              ? `Tenu par ${POKEMON[holder].n}`
              : 'Libre · à confier depuis la fiche d’un Pokémon'
            : HELD_SHOP[k]
              ? HELD_SHOP[k].g
                ? 'Chez le marchand rare'
                : 'En vente à la Boutique'
              : 'Récompense d’arène à gagner'}
        </em>
      </div>
      {own && holder ? (
        <div className="item-row-actions">
          <Button size="small" data-v4sheet={holder}>
            Voir {POKEMON[holder].n}
          </Button>
        </div>
      ) : null}
    </article>
  );
}
