import { useEngineReady } from '../../engineReady.js';
import { useBagVersion } from './bagStore.js';
import { ITEMS2, PROFILE } from '../../engine/state/game-state.js';
import { SHOP, bagN, formatNumber } from '../../engine/state/economy.js';
import { V4 } from '../../engine/ui/screen-state.js';
import { dailyTm } from '../../engine/items/extra-held-items.js';
import { Article, HeldItem } from './Items.jsx';
import Offers from './Offers.jsx';
import HeldItems from './HeldItems.jsx';
import Peddler from './Peddler.jsx';
import WorkshopTab from './Workshop.jsx';
import Counter from './Counter.jsx';

import PageHeader from '../../components/PageHeader.jsx';
const NL = '\n ';
const WORKSHOP = ['ate', 'jeux', 'quetes', 'trophees', 'oeufs', 'talents'];

// List of the chosen category (V4.sacC), in the Shop or the Bag.
function List({ v, keys }) {
  const c = V4.bagCategory;
  if (v === 'boutique' && c === 'ambu') {
    return <Peddler />;
  } // v4.54
  if (v === 'boutique' && WORKSHOP.includes(c)) {
    return <WorkshopTab c={c} />;
  } // v4.57 and later
  if (v === 'boutique' && (c === 'held' || c === 'rares')) {
    return <HeldItems category={c} />;
  } // v4.14
  if (c === 'held') {
    return keys.map(k => <HeldItem key={k} k={k} />);
  }
  if (v === 'sac') {
    const L = keys.filter(k => bagN(k));
    return L.length ? (
      L.map(k => <Article key={k} k={k} mode="sac" />)
    ) : (
      <p className="empty-state">Rien ici pour l’instant. Faites un tour à la Boutique.</p>
    );
  }
  return keys.map(k => <Article key={k} k={k} mode="boutique" />);
}

// TM vendor of the day (v4.58): −20% on two TMs, in Shop › TMs and HMs.
function TmVendor() {
  const J = dailyTm();
  return (
    <p id="tm-vendor" className="note">
      <b>Vendeur de CT de {J.reg}</b> : −20 % aujourd’hui sur {J.o.map(k => SHOP[k].n).join(' et ')}.
    </p>
  );
}

function Content() {
  const v = V4.bagView;
  const cats = [
    ['balls', 'Poké Balls', 'i-fight'],
    ['soins', 'Soins', 'i-heal'],
    ['combat', 'Combat', 'i-medal'],
    ['held', 'Objets tenus', 'i-star'],
    ['machines', 'CT et CS', 'i-bolt'],
    ...(v === 'boutique'
      ? [
          ['rares', 'Marchand rare', 'i-gem'],
          ['ambu', 'Colporteur', 'i-shop'],
          ['ate', 'Atelier', 'i-bolt'],
          ['jeux', 'Tirage', 'i-star'],
          ['quetes', 'Quêtes', 'i-medal'],
          ['trophees', 'Trophées', 'i-star'],
          ['oeufs', 'Œufs', 'i-star'],
          ['talents', 'Talents', 'i-medal'],
        ]
      : []),
  ]; // v4.14: battle items, held items for sale, rare merchant
  const keys =
    V4.bagCategory === 'held'
      ? Object.keys(ITEMS2)
      : Object.keys(SHOP).filter(k => SHOP[k].category === V4.bagCategory);
  // items of the open pocket, for the Bag banner
  const n = v === 'sac' ? (V4.bagCategory === 'held' ? keys.length : keys.filter(k => bagN(k)).length) : 0;
  return (
    <>
      <PageHeader
        kicker="Objets"
        title="Sac et Boutique"
        titleId="h-sac"
        lead="Les Pokédollars se gagnent en combat, les Éclats avec les rangs S, les badges et les quêtes."
      />
      {NL}
      <div className="bag-wallet card">
        <div>
          <span className="coin-icon" aria-hidden="true">
            ₽
          </span>
          <span>
            <small>Pokédollars</small>
            <b data-wallet="money">{formatNumber(PROFILE.money)}</b>
          </span>
        </div>
        <div>
          <span className="gem-icon">
            <svg>
              <use href="#i-gem" />
            </svg>
          </span>
          <span>
            <small>Éclats de Résonance</small>
            <b data-wallet="gems">{formatNumber(PROFILE.gems)}</b>
          </span>
        </div>
      </div>
      {NL}
      <div className="tabs page-tabs" role="tablist">
        <button type="button" role="tab" data-sacv="boutique" aria-selected={v === 'boutique'}>
          <svg>
            <use href="#i-shop" />
          </svg>
          Boutique
        </button>
        <button type="button" role="tab" data-sacv="sac" aria-selected={v === 'sac'}>
          <svg>
            <use href="#i-bag" />
          </svg>
          Sac
        </button>
      </div>
      <Counter n={n} />
      {'\n'}
      {v === 'boutique' ? <Offers /> : null}
      {NL}
      <div className="bag-shelf">
        {v === 'boutique' && V4.bagCategory === 'machines' ? <TmVendor /> : null}
        <nav className="bag-categories" aria-label="Catégories">
          {cats.map(([k, displayName, i]) => (
            <button key={k} type="button" data-sacc={k} aria-pressed={V4.bagCategory === k}>
              <svg>
                <use href={'#' + i} />
              </svg>
              {displayName}
            </button>
          ))}
        </nav>
        <div className="bag-items">
          <List v={v} keys={keys} />
        </div>
      </div>
    </>
  );
}

// Bag and Shop page (#sac). Nothing is rendered before the engine's first renderBag(); each
// renderBag() rebuilds the content (delegated handlers in the engine: data-sacv,
// data-sacc, data-qk, data-buy, data-buyh, data-offre, data-wanderer, data-craft-bench…). The
// is-shop / is-bag classes of the section are set by the engine (renderBag). Styles: bag.css, bag-categories.css,
// bag-counter.css and the shared item row (styles/components/item-row.css).
export default function Bag() {
  const ready = useEngineReady();
  const version = useBagVersion();
  return (
    <section className="page v4p bag-page" id="sac" aria-labelledby="h-sac">
      {ready && version > 0 && <Content key={version} />}
    </section>
  );
}
