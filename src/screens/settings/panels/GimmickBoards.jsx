import { GIMMICKS, gimmickKey } from '../../../engine/modes/feats-gimmicks.js';

import Button from '../../../components/Button.jsx';
// Gimmick boards (v4.67): a terrain rule added to battles.
// Buttons handled by the engine (delegated click on data-gimmick-board).
export default function GimmickBoards() {
  const c = gimmickKey();
  const btn = (k, l) => (
    <Button key={k} size="small" variant={c === k ? 'primary' : 'ghost'} data-gimmick-board={k} aria-pressed={c === k}>
      {l}
    </Button>
  );
  const d =
    c !== 'off' && c !== 'rand' ? GIMMICKS[c].d : c === 'rand' ? 'Un gimmick différent est tiré à chaque combat.' : '';
  return (
    <section className="card" id="gimmick-boards-panel">
      <h3 className="card-title">Plateaux à gimmick</h3>
      <p className="note">{`Ajoute une règle de terrain à vos combats (hors boss, tutoriel et défis à règles fixes). ${d}`}</p>
      <div className="button-row">
        {btn('off', 'Aucun')}
        {btn('rand', 'Aléatoire')}
        {Object.keys(GIMMICKS).map(k => btn(k, GIMMICKS[k].n))}
      </div>
    </section>
  );
}
