import { Html } from '../../lib/html.jsx';
import { useOverlay } from './dialogsStore.js';

// Couches d'effet que le moteur posait sur <body>. Nœuds toujours montés : le moteur y
// garde ses bascules impératives (classes, hidden), que React ne rend pas :
// - #pk-fond : décor fixe (v4.72, 107), aucune bascule ;
// - #pk-iris : ouverture en Poké Ball ; 107 ajoute/retire la classe .go ;
// - #pk-btr : entrée en combat ; 108 pose sa classe (go, boss|dresseur|sauvage, vite),
//   les bandes sont rendues ici entre paintOverlay('btr') et clearOverlay('btr') ;
// - #pk-badge : cérémonie du badge ; 108 gère hidden et .out, le contenu vient du store ;
// - #tr448 : flash d'entrée en combat (v4.48, 079), présent 1,25 s.

// Grande Poké Ball au trait du fond (premier élément du corps à l'origine).
export function PkBackground() {
  return (
    <div id="pk-fond" aria-hidden="true"><i /></div>
  );
}

export function PkIris() {
  return (
    <div id="pk-iris" aria-hidden="true">
      <i className="pk-h pk-ht" />
      <i className="pk-h pk-hb" />
      <i className="pk-hc" />
    </div>
  );
}

const BANDES = [0, 1, 2, 3, 4, 5, 6, 7];

export function PkBtr() {
  const s = useOverlay('btr');
  return (
    <div id="pk-btr" aria-hidden="true">
      {s && (
        <>
          <i className="pk-fls" />
          {BANDES.map(n => <i key={n} className="pk-bd" style={{ '--n': n }} />)}
          <i className="pk-bc" />
        </>
      )}
    </div>
  );
}

const GERBE = Array.from({ length: 14 }, (_, k) => Math.round(k * 25.7));

export function PkBadge() {
  const s = useOverlay('badge');
  return (
    <div id="pk-badge" hidden role="dialog" aria-modal="true" aria-label="Nouveau badge">
      {s && (
        <div className="pk-bc-in" key={s.v}>
          <div className="pk-bc-case">
            <span className="pk-bc-bdg"><Html html={s.svg} /></span>
            <span className="pk-bc-gerbe" aria-hidden="true">
              {GERBE.map(a => <i key={a} style={{ '--a': a + 'deg' }} />)}
            </span>
          </div>
          <p className="pk-bc-t">{s.chef ? s.chef + ' vous remet le' : 'Vous obtenez le'}<b>Badge {s.nom}</b></p>
          <p className="pk-bc-s">{s.n} / 8 badges dans la boîte</p>
          <p className="pk-bc-k">Touchez pour continuer</p>
        </div>
      )}
    </div>
  );
}

export function Tr448() {
  const s = useOverlay('tr448');
  if (!s) return null;
  return (
    <div id="tr448" aria-hidden="true" key={s.v}>
      <i className="tr448-f" />
      <i className="tr448-i" />
    </div>
  );
}
