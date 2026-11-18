import { Html } from '../../lib/html.jsx';
import { useOverlay } from './dialogsStore.js';

// Confirmation avant une nouvelle partie (#conf430). Comme avant, la fenêtre n'existe
// qu'à partir du premier appel de confirmer430 (065) ; le moteur garde ensuite son attribut
// hidden (React ne le rend pas), les clics (data-conf430) et le focus sur « Annuler ».
export default function Conf430() {
  const s = useOverlay('conf430');
  if (!s) return null;
  const { titre, texte, combats, badges, sl } = s;
  return (
    <div id="conf430" className="conf430">
      <div className="conf430-s" data-conf430="non" key={'s' + s.v} />
      <div className="conf430-c v4-panel" role="dialog" aria-modal="true" aria-labelledby="conf430T" key={'c' + s.v}>
        <p className="kick">Attention</p>
        <h2 className="h2" id="conf430T"><Html html={titre} /></h2>
        <p><Html html={texte} /></p>
        <p className="conf430-w">La partie en cours ({combats} combats, {badges} badge{badges > 1 ? 's' : ''}) sera remplacée.</p>
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
