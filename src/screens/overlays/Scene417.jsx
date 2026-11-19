import { Html } from '../../lib/html.jsx';
import { useOverlay } from './dialogsStore.js';

// Scène d'histoire (#scene417) : une réplique à la fois. Clics (data-scene) et hidden :
// moteur (057, 064, 093). Le texte est ensuite tapé lettre par lettre par le moteur
// (v4.73, 109) qui pose .pk-dlg, .pk-fl et des <span> dans la carte : chaque réplique
// est un nouveau rendu (key), donc ces ajouts ne gênent pas React.
export default function Scene417() {
  const s = useOverlay('scene');
  return (
    <div className="scene417" id="scene417" hidden>
      {s && <Carte key={s.v} {...s} />}
    </div>
  );
}

function Carte({ av, n, txt, i, nb, suite }) {
  return (
    <div className="sc-card" role="dialog" aria-modal="true" aria-label="Scène">
      <div className="sc-who"><Html html={av} /><b><Html html={n} /></b></div>
      <p className="sc-tx"><Html html={txt} /></p>
      <div className="sc-a">
        <button type="button" className="b b-sm b-ghost" data-scene="passer">Passer</button>
        <span className="sc-n">{i + 1} / {nb}</span>
        <button type="button" className="b b-sm b-gold" data-scene="suite">{suite}</button>
      </div>
    </div>
  );
}
