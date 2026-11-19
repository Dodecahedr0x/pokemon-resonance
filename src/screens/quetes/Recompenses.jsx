import { ITM, SHOP, fmt } from '../../engine/032-v4-00-socle.js';

// Récompenses d'une quête : Pokédollars, Éclats, objets (ancien rewTxt).
export default function Recompenses({ r }) {
  const o = [];
  if (r.money) o.push(<span key="m"><span className="v4-coin" aria-hidden="true">₽</span>{fmt(r.money)}</span>);
  if (r.gems) o.push(<span key="g"><span className="v4-gemi"><svg><use href="#i-gem" /></svg></span>{r.gems}</span>);
  if (r.bag)
    for (const k in r.bag)
      o.push(<span key={'b' + k}><img src={ITM(SHOP[k].img)} alt="" loading="lazy" />{r.bag[k]} × {SHOP[k].n}</span>);
  return o;
}
