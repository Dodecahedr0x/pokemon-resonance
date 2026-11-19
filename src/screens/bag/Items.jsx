import { MV } from '../../engine/005-moves.js';
import { BY } from '../../engine/009-pokemon.js';
import { ITEMS2, PROFILE, ownedItems } from '../../engine/011-game-state.js';
import { tc } from '../../engine/014-utils.js';
import { HELD_IMG, ITM, SHOP, V4, bagN, fmt } from '../../engine/032-v4-foundation.js';
import { costOf } from '../../engine/049-identity.js';
import { HELD_SHOP, offer414 } from '../../engine/053-resonance.js';

// Disque de CT / CS : initiales sur la couleur du type de la capacité.
export const Disc = ({ it }) => (
  <span className="v4-it-im ct-disc" style={{ '--c': tc(MV[it.mv].t) }}><b>{it.sn.slice(0, 2)}</b></span>
);

// Pastille de prix en Éclats.
export const Shards = () => <span className="v4-gemi"><svg><use href="#i-gem" /></svg></span>;

// Un objet de la Boutique ou du Sac (ancien itemRow) : quantité data-qk, achat data-buy,
// CT à apprendre data-apprendre, tous gérés par le moteur.
export function Article({ k, mode }) {
  const it = SHOP[k],
    cs = it.cs, // une CS s'achète une fois et se garde
    q = cs ? 1 : V4.qty[k] || 1,
    n = bagN(k),
    price = it.g ? it.g * q : costOf(k) * q, // Atelier (v4.10)
    can = it.g ? PROFILE.gems >= price : PROFILE.money >= price,
    full = cs ? n > 0 : n + q > 99;
  return (
    <article className="v4-it">
      {it.mv ? <Disc it={it} /> : <span className="v4-it-im"><img src={ITM(it.img)} alt="" loading="lazy" /></span>}
      <div className="v4-it-t">
        <b>{it.n}{offer414(k) ? <> <span className="v4-off">−30 %</span></> : null}</b>
        <p>{it.d}</p>
        <em>{cs && n ? 'Dans le Sac' : `Dans le Sac : ${n}`}</em>
      </div>
      {mode === 'boutique' ? (
        <div className="v4-it-b">
          {cs ? null : (
            <div className="v4-qty" role="group" aria-label="Quantité">
              <button type="button" data-qk={k} data-qd="-1" aria-label="Moins" disabled={q <= 1}>−</button>
              <b>{q}</b>
              <button type="button" data-qk={k} data-qd="1" aria-label="Plus" disabled={q >= 10}>+</button>
            </div>
          )}
          <button type="button" className="b b-gold b-sm" data-buy={k} disabled={!(can && !full)}>
            {cs && n ? 'Déjà achetée' : it.g ? <><Shards />{price}</> : `${fmt(price)} ₽`}
          </button>
        </div>
      ) : it.mv ? (
        <div className="v4-it-b"><button type="button" className="b b-gold b-sm" data-apprendre={k}>Apprendre</button></div>
      ) : null}
    </article>
  );
}

// Un objet tenu dans le Sac (ancien heldRow) : qui le tient, ou où le trouver.
export function Outfit({ k }) {
  const it = ITEMS2[k],
    own = ownedItems().includes(k),
    holder = Object.keys(PROFILE.equip).find(id => PROFILE.equip[id] === k);
  return (
    <article className={'v4-it' + (own ? '' : ' off')}>
      <span className="v4-it-im"><img src={ITM(HELD_IMG[k])} alt="" loading="lazy" /></span>
      <div className="v4-it-t">
        <b>{it.n}</b>
        <p>{it.d}</p>
        <em>{own ? (holder ? `Tenu par ${BY[holder].n}` : 'Libre · à confier depuis la fiche d’un Pokémon') : HELD_SHOP[k] ? (HELD_SHOP[k].g ? 'Chez le marchand rare' : 'En vente à la Boutique') : 'Récompense d’arène à gagner'}</em>
      </div>
      {own && holder ? <div className="v4-it-b"><button type="button" className="b b-sm" data-v4sheet={holder}>Voir {BY[holder].n}</button></div> : null}
    </article>
  );
}
