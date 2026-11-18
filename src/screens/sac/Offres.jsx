import { ITEMS2 } from '../../engine/011-05-etat-de-partie.js';
import { HELD_IMG, ITM, SHOP, fmt } from '../../engine/032-v4-00-socle.js';
import { prixDe0 } from '../../engine/049-v4-10-01-identite.js';
import { HELD_SHOP, offresDuJour, remise414 } from '../../engine/053-v4-14-01-resonance.js';
import { Disque } from './Articles.jsx';

// Offres du jour (v4.14) : −30 % jusqu'à minuit ; data-offre ouvre la catégorie (moteur).
export default function Offres() {
  return (
    <section className="v4-offres v4-panel" aria-label="Offres du jour">
      <h3><svg><use href="#i-shop" /></svg>Offres du jour<span>−30 % jusqu’à minuit</span></h3>
      <div className="v4-off-l">
        {offresDuJour().map((k, i) => {
          const h = !!HELD_SHOP[k],
            it = h ? ITEMS2[k] : SHOP[k],
            p0 = h ? HELD_SHOP[k].p : prixDe0(k);
          return (
            <button key={i} type="button" className="v4-off-i" data-offre={h ? 'held' : it.cat}>
              {!h && it.mv ? <Disque it={it} /> : <img src={ITM(h ? HELD_IMG[k] : it.img)} alt="" loading="lazy" />}
              <b>{it.n}</b>
              <span><s>{fmt(p0)} ₽</s>{fmt(remise414(k, p0))} ₽</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
