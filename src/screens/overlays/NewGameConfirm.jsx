import { Html } from '../../lib/html.jsx';
import { useOverlay } from './dialogsStore.js';

import Button from '../../components/Button.jsx';
// Confirmation before a new game (#newGame). As before, the window only exists
// from the first call of confirmDialog (065); the engine then keeps its hidden attribute
// (React doesn't render it), the clicks (data-new-game) and the focus on "Annuler" (Cancel).
export default function NewGameConfirm() {
  const s = useOverlay('new-game');
  if (!s) {
    return null;
  }
  const { titre: heading, bodyText: text, combats: battles, badges, sl } = s;
  return (
    <div id="new-game" className="new-game">
      <div className="new-game-s" data-new-game="non" key={'s' + s.v} />
      <div className="new-game-c card" role="dialog" aria-modal="true" aria-labelledby="new-game-t" key={'c' + s.v}>
        <p className="kicker">Attention</p>
        <h2 className="section-title" id="new-game-t">
          <Html html={heading} />
        </h2>
        <p>
          <Html html={text} />
        </p>
        <p className="new-game-w">
          La partie en cours ({battles} combats, {badges} badge{badges > 1 ? 's' : ''}) sera remplacée.
        </p>
        <div className="new-game-a">
          {sl ? (
            <Button variant="primary" data-new-game="ranger">
              Ranger dans l’emplacement {sl.slice(1)}, puis continuer
            </Button>
          ) : (
            <Button data-new-game="saves">Emplacements pleins : ouvrir les Sauvegardes</Button>
          )}
          <Button data-new-game="oui">Continuer sans ranger</Button>
          <Button variant="ghost" data-new-game="non">
            Annuler
          </Button>
        </div>
      </div>
    </div>
  );
}
