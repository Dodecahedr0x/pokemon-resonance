import { ITEMS2, PROFILE, isCamp, ownedItems } from '../../engine/011-game-state.js';
import { BADGES } from '../../engine/013-gyms.js';
import { HELD_IMG, ITM, SHOP, fmt } from '../../engine/032-v4-foundation.js';
import { HELD_SHOP, offer414, costHeld414 } from '../../engine/053-resonance.js';
import { Article, Shards } from './Items.jsx';

// Held item for sale (v4.14): one-time purchase, data-buyh (engine).
function OutfitForSale({ k }) {
  const it = ITEMS2[k],
    H = HELD_SHOP[k],
    own = ownedItems().includes(k),
    price = H.g || costHeld414(k),
    can = H.g ? PROFILE.gems >= price : PROFILE.money >= price;
  return (
    <article className={'v4-it' + (own ? ' own' : '')}>
      <span className="v4-it-im">
        <img src={ITM(HELD_IMG[k])} alt="" loading="lazy" />
      </span>
      <div className="v4-it-t">
        <b>
          {it.n}
          {!own && offer414(k) ? (
            <>
              {' '}
              <span className="v4-off">−30 %</span>
            </>
          ) : null}
        </b>
        <p>{it.d}</p>
        <em>
          {own
            ? isCamp()
              ? 'Déjà à vous · à confier depuis la fiche d’un Pokémon'
              : 'Disponible en mode Libre'
            : 'Objet tenu · un seul exemplaire'}
        </em>
      </div>
      <div className="v4-it-b">
        {own ? null : (
          <button type="button" className="b b-gold b-sm" data-buyh={k} disabled={!can}>
            {H.g ? (
              <>
                <Shards />
                {price}
              </>
            ) : (
              `${fmt(price)} ₽`
            )}
          </button>
        )}
      </div>
    </article>
  );
}

// Shop › Held items, or › Rare merchant (for Shards, after the 2nd badge).
export default function HeldItems({ category: cat }) {
  if (cat === 'rares' && isCamp() && BADGES.length < 2) {
    return (
      <p className="v4-empty">
        Le marchand rare s’installe après votre 2e badge. Il ne vend que contre des Éclats de Résonance.
      </p>
    );
  }
  return (
    <>
      {cat === 'rares' ? (
        <p className="v4-note">Le marchand rare n’accepte que les Éclats de Résonance.</p>
      ) : (
        <p className="v4-note">
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
