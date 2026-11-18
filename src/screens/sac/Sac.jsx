import { useEngineReady } from '../../engineReady.js';
import { useSacVersion } from './sacStore.js';
import { ITEMS2, PROFILE } from '../../engine/011-05-etat-de-partie.js';
import { SHOP, V4, bagN, fmt } from '../../engine/032-v4-00-socle.js';
import { ctJour456 } from '../../engine/089-4-58-objets-tenus-en-plus-ct-a-gagner.js';
import { Article, Tenu } from './Articles.jsx';
import Offres from './Offres.jsx';
import Tenus from './Tenus.jsx';
import Colporteur from './Colporteur.jsx';
import OngletAtelier from './Atelier.jsx';
import Comptoir from './Comptoir.jsx';

const NL = '\n ';
const ATELIER = ['ate', 'jeux', 'quetes', 'trophees', 'oeufs', 'talents'];

// Liste de la catégorie choisie (V4.sacC), en Boutique ou dans le Sac.
function Liste({ v, keys }) {
  const c = V4.sacC;
  if (v === 'boutique' && c === 'ambu') return <Colporteur />; // v4.54
  if (v === 'boutique' && ATELIER.includes(c)) return <OngletAtelier c={c} />; // v4.57 et suivantes
  if (v === 'boutique' && (c === 'held' || c === 'rares')) return <Tenus cat={c} />; // v4.14
  if (c === 'held') return keys.map(k => <Tenu key={k} k={k} />);
  if (v === 'sac') {
    const L = keys.filter(k => bagN(k));
    return L.length ? L.map(k => <Article key={k} k={k} mode="sac" />) : <p className="v4-empty">Rien ici pour l’instant. Faites un tour à la Boutique.</p>;
  }
  return keys.map(k => <Article key={k} k={k} mode="boutique" />);
}

// Vendeur de CT du jour (v4.58) : −20 % sur deux CT, en Boutique › CT et CS.
function VendeurCT() {
  const J = ctJour456();
  return (
    <p id="ctj456" className="v4-note"><b>Vendeur de CT de {J.reg}</b> : −20 % aujourd’hui sur {J.o.map(k => SHOP[k].n).join(' et ')}.</p>
  );
}

function Contenu() {
  const v = V4.sacV;
  const cats = [
    ['balls', 'Poké Balls', 'i-fight'],
    ['soins', 'Soins', 'i-heal'],
    ['combat', 'Combat', 'i-medal'],
    ['held', 'Objets tenus', 'i-star'],
    ['machines', 'CT et CS', 'i-bolt'],
    ...(v === 'boutique' ? [['rares', 'Marchand rare', 'i-gem'], ['ambu', 'Colporteur', 'i-shop'], ['ate', 'Atelier', 'i-bolt'], ['jeux', 'Tirage', 'i-star'], ['quetes', 'Quêtes', 'i-medal'], ['trophees', 'Trophées', 'i-star'], ['oeufs', 'Œufs', 'i-star'], ['talents', 'Talents', 'i-medal']] : [])
  ]; // v4.14 : objets de combat, objets tenus en vente, marchand rare
  const keys = V4.sacC === 'held' ? Object.keys(ITEMS2) : Object.keys(SHOP).filter(k => SHOP[k].cat === V4.sacC);
  // objets de la poche ouverte, pour le bandeau du Sac
  const n = v === 'sac' ? (V4.sacC === 'held' ? keys.length : keys.filter(k => bagN(k)).length) : 0;
  return (
    <>
      <div className="ph v4-ph-page"><p className="kick">Objets</p><h1 className="h1" id="h-sac">Sac et Boutique</h1><p className="sub">Les Pokédollars se gagnent en combat, les Éclats avec les rangs S, les badges et les quêtes.</p></div>
      {NL}
      <div className="v4-walbig v4-panel">
        <div><span className="v4-coin big" aria-hidden="true">₽</span><span><small>Pokédollars</small><b data-wallet="money">{fmt(PROFILE.money)}</b></span></div>
        <div><span className="v4-gemi big"><svg><use href="#i-gem" /></svg></span><span><small>Éclats de Résonance</small><b data-wallet="gems">{fmt(PROFILE.gems)}</b></span></div>
      </div>
      {NL}
      <div className="v4-tabs" role="tablist">
        <button type="button" role="tab" data-sacv="boutique" aria-selected={v === 'boutique'}><svg><use href="#i-shop" /></svg>Boutique</button>
        <button type="button" role="tab" data-sacv="sac" aria-selected={v === 'sac'}><svg><use href="#i-bag" /></svg>Sac</button>
      </div>
      <Comptoir n={n} />
      {'\n'}
      {v === 'boutique' ? <Offres /> : null}
      {NL}
      <div className="v4-sac">
        {v === 'boutique' && V4.sacC === 'machines' ? <VendeurCT /> : null}
        <nav className="v4-cats" aria-label="Catégories">
          {cats.map(([k, nom, i]) => (
            <button key={k} type="button" data-sacc={k} aria-pressed={V4.sacC === k}><svg><use href={'#' + i} /></svg>{nom}</button>
          ))}
        </nav>
        <div className="v4-items"><Liste v={v} keys={keys} /></div>
      </div>
    </>
  );
}

// Page Sac et Boutique (#sac). Rien n'est rendu avant le premier renderBag() du moteur ; chaque
// renderBag() reconstruit le contenu (gestionnaires délégués dans le moteur : data-sacv,
// data-sacc, data-qk, data-buy, data-buyh, data-offre, data-am454, data-at455…). Les classes
// pk-mart / pk-bag de la section sont posées par le moteur (renderBag).
export default function Sac() {
  const ready = useEngineReady();
  const version = useSacVersion();
  return (
    <section className="page v4p" id="sac" aria-labelledby="h-sac">
      {ready && version > 0 && <Contenu key={version} />}
    </section>
  );
}
