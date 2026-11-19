import { Html } from '../../lib/html.jsx';
import { medal, tc } from '../../engine/014-08-outils.js';
import { cdData455 } from '../../engine/088-4-57-atelier-recettes-commandes-tirage-vitrine-c.js';
import { saData465 } from '../../engine/096-4-65-evenements-saisonniers-mensuels.js';
import { brData466 } from '../../engine/097-4-66-boss-rush-et-reliques-de-run.js';
import { dfTxt468 } from '../../engine/099-4-68-arene-de-defense.js';

// Bannières sous le héros, dans l'ordre de l'ancien DOM (chacune était insérée juste après
// le héros ou après la précédente) : saison (v4.65), Boss Rush (v4.66), Arène de défense
// (v4.68), Défis (v4.71), Plus de défis (v4.71), cadeau du jour (v4.57).
// Regroupées dans .act470 (une grille d'activités au même dessin).
// Les clics (data-sa465, data-br466, data-df468, data-x470, data-x2470, data-cd455) restent au moteur.
export default function Bannieres() {
  const sa = saData465(),
    br = brData466(),
    cd = cdData455();
  return (
    <div className="act470" role="group" aria-label="Activités">
      <button type="button" id="sa465" data-sa465="open" className="sa465">
        <span className="sa465-i" style={{ '--c': tc(sa.S0.t) }}>
          <Html html={medal([sa.S0.t], 'sm')} />
        </span>
        <span className="sa465-t">
          <b>{sa.S0.n}</b>
          <small>{sa.pts} / {sa.top} points de saison</small>
          <span className="cp-bar"><i style={{ width: `${sa.pc}%` }} /></span>
        </span>
      </button>
      <button type="button" id="br466" data-br466="open" className="br466">
        <span className="br466-i">{br.i}</span>
        <span className="br466-t"><b>Boss Rush</b><small>{br.txt}</small></span>
      </button>
      <button type="button" id="df468" data-df468="open" className="df468">
        <span className="df468-i">5</span>
        <span className="df468-t"><b>Arène de défense</b><small>{dfTxt468()}</small></span>
      </button>
      <button type="button" id="x470" data-x470="open" className="df468">
        <span className="df468-i">★</span>
        <span className="df468-t"><b>Défis du jour</b><small>Quotidien · Laboratoire · Prestige</small></span>
      </button>
      <button type="button" id="x2470" data-x2470="open" className="df468">
        <span className="df468-i">+</span>
        <span className="df468-t"><b>Défis de dresseur</b><small>Rivalité · Dresseur · Vitrine · Entraînement</small></span>
      </button>
      <button type="button" id="cd455" data-cd455="1" className={'cd455' + (cd.fait ? ' done' : '')}>
        <span className="cd455-i">{cd.fait ? '✓' : '★'}</span>
        <span>
          <b>{cd.fait ? 'Cadeau du jour récupéré' : 'Cadeau du jour'}</b>
          <small>{cd.fait ? `Jour ${cd.j + 1} sur 7 · revenez demain` : `Jour ${cd.j + 1} sur 7 : ${cd.txt}`}</small>
        </span>
      </button>
    </div>
  );
}
