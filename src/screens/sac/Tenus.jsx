import { ITEMS2, PROFILE, isCamp, ownedItems } from '../../engine/011-05-etat-de-partie.js';
import { BADGES } from '../../engine/013-07-arenes.js';
import { HELD_IMG, ITM, SHOP, fmt } from '../../engine/032-v4-00-socle.js';
import { HELD_SHOP, offre414, prixHeld414 } from '../../engine/053-v4-14-01-resonance.js';
import { Article, Eclats } from './Articles.jsx';

// Objet tenu en vente (v4.14) : achat unique, data-buyh (moteur).
function TenuEnVente({ k }) {
  const it = ITEMS2[k],
    H = HELD_SHOP[k],
    own = ownedItems().includes(k),
    price = H.g || prixHeld414(k),
    can = H.g ? PROFILE.gems >= price : PROFILE.money >= price;
  return (
    <article className={'v4-it' + (own ? ' own' : '')}>
      <span className="v4-it-im"><img src={ITM(HELD_IMG[k])} alt="" loading="lazy" /></span>
      <div className="v4-it-t">
        <b>{it.n}{!own && offre414(k) ? <> <span className="v4-off">−30 %</span></> : null}</b>
        <p>{it.d}</p>
        <em>{own ? (isCamp() ? 'Déjà à vous · à confier depuis la fiche d’un Pokémon' : 'Disponible en mode Libre') : 'Objet tenu · un seul exemplaire'}</em>
      </div>
      <div className="v4-it-b">
        {own ? null : <button type="button" className="b b-gold b-sm" data-buyh={k} disabled={!can}>{H.g ? <><Eclats />{price}</> : `${fmt(price)} ₽`}</button>}
      </div>
    </article>
  );
}

// Boutique › Objets tenus, ou › Marchand rare (contre des Éclats, après le 2e badge).
export default function Tenus({ cat }) {
  if (cat === 'rares' && isCamp() && BADGES.length < 2)
    return <p className="v4-empty">Le marchand rare s’installe après votre 2e badge. Il ne vend que contre des Éclats de Résonance.</p>;
  return (
    <>
      {cat === 'rares' ? (
        <p className="v4-note">Le marchand rare n’accepte que les Éclats de Résonance.</p>
      ) : (
        <p className="v4-note">Un objet tenu s’achète une fois, puis se confie depuis la fiche d’un Pokémon. Un seul Pokémon le tient à la fois.</p>
      )}
      {Object.keys(HELD_SHOP)
        .filter(k => (cat === 'rares') === !!HELD_SHOP[k].g)
        .map(k => <TenuEnVente key={k} k={k} />)}
      {cat === 'rares' ? Object.keys(SHOP).filter(k => SHOP[k].g).map(k => <Article key={'s' + k} k={k} mode="boutique" />) : null}
    </>
  );
}
