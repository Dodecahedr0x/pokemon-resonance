import { HELD_ITEMS, PROFILE, isCamp, ownedItems } from '../../engine/state/game-state.js';
import { BADGES } from '../../engine/modes/gyms.js';
import { HELD_IMG, SHOP, formatNumber } from '../../engine/state/economy.js';
import { itemIcon } from '../../engine/assets/item-icons.js';
import { HELD_SHOP, heldItemCost } from '../../engine/combat/resonance.js';
import { Article, Shards } from './Items.jsx';

import Button from '../../components/Button.jsx';
// Held item for sale (v4.14): one-time purchase, data-buyh (engine).
function OutfitForSale({ k }) {
  const it = HELD_ITEMS[k],
    H = HELD_SHOP[k],
    own = ownedItems().includes(k),
    price = H.g || heldItemCost(k),
    can = H.g ? PROFILE.gems >= price : PROFILE.money >= price;
  return (
    <article className={'item-row' + (own ? ' is-owned' : '')}>
      <span className="item-row-icon">
        <img src={itemIcon(HELD_IMG[k])} alt="" loading="lazy" />
      </span>
      <div className="item-row-text">
        <b>{it.n}</b>
        <p>{it.d}</p>
        <em>
          {own
            ? isCamp()
              ? 'Déjà à vous · à confier depuis la fiche d’un Pokémon'
              : 'Disponible en mode Libre'
            : 'Objet tenu · un seul exemplaire'}
        </em>
      </div>
      <div className="item-row-actions">
        {own ? null : (
          <Button size="small" variant="primary" data-buyh={k} disabled={!can}>
            {H.g ? (
              <>
                <Shards />
                {price}
              </>
            ) : (
              `${formatNumber(price)} ₽`
            )}
          </Button>
        )}
      </div>
    </article>
  );
}

// Shop › Held items, or › Rare merchant (for Shards, after the 2nd badge).
export default function HeldItems({ category: cat }) {
  if (cat === 'rares' && isCamp() && BADGES.length < 2) {
    return (
      <p className="empty-state">
        Le marchand rare s’installe après votre 2e badge. Il ne vend que contre des Éclats de Résonance.
      </p>
    );
  }
  return (
    <>
      {cat === 'rares' ? (
        <p className="note">Le marchand rare n’accepte que les Éclats de Résonance.</p>
      ) : (
        <p className="note">
          Un objet tenu s’achète une fois, puis se confie depuis la fiche d’un Pokémon. Un seul Pokémon le tient à la
          fois.
        </p>
      )}
      {Object.keys(HELD_SHOP)
        .filter(k => (cat === 'rares') === !!HELD_SHOP[k].g)
        .map(k => (
          <OutfitForSale key={k} k={k} />
        ))}
      {cat === 'rares'
        ? Object.keys(SHOP)
            .filter(k => SHOP[k].g)
            .map(k => <Article key={'s' + k} k={k} mode="boutique" />)
        : null}
    </>
  );
}
