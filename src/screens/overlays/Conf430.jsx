import { Html } from '../../lib/html.jsx';
import { useOverlay } from './dialogsStore.js';

// Confirmation before a new game (#conf430). As before, the window only exists
// from the first call of confirm430 (065); the engine then keeps its hidden attribute
// (React doesn't render it), the clicks (data-conf430) and the focus on "Annuler" (Cancel).
export default function Conf430() {
  const s = useOverlay('conf430');
  if (!s) return null;
  const { titre: heading, bodyText: text, combats: battles, badges, sl } = s;
  return (
    <div id="conf430" className="conf430">
      <div className="conf430-s" data-conf430="non" key={'s' + s.v} />
      <div className="conf430-c v4-panel" role="dialog" aria-modal="true" aria-labelledby="conf430T" key={'c' + s.v}>
        <p className="kick">Attention</p>
        <h2 className="h2" id="conf430T"><Html html={heading} /></h2>
        <p><Html html={text} /></p>
        <p className="conf430-w">La partie en cours ({battles} combats, {badges} badge{badges > 1 ? 's' : ''}) sera remplacée.</p>
        <div className="conf430-a">
          {sl ? (
            <button type="button" className="b b-gold" data-conf430="ranger">Ranger dans l’emplacement {sl.slice(1)}, puis continuer</button>
          ) : (
            <button type="button" className="b" data-conf430="saves">Emplacements pleins : ouvrir les Sauvegardes</button>
          )}
          <button type="button" className="b" data-conf430="oui">Continuer sans ranger</button>
          <button type="button" className="b b-ghost" data-conf430="non">Annuler</button>
        </div>
      </div>
    </div>
  );
}
