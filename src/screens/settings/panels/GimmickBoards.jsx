import { GIM467, gimKey467 } from '../../../engine/098-feats-journal-gimmick-boards.js';

// Gimmick boards (v4.67): a terrain rule added to battles.
// Buttons handled by the engine (delegated click on data-gim467).
export default function GimmickBoards() {
  const c = gimKey467();
  const btn = (k, l) => (
    <button
      key={k}
      type="button"
      className={`b b-sm${c === k ? ' b-gold' : ' b-ghost'}`}
      data-gim467={k}
      aria-pressed={c === k}
    >
      {l}
    </button>
  );
  const d =
    c !== 'off' && c !== 'rand' ? GIM467[c].d : c === 'rand' ? 'Un gimmick différent est tiré à chaque combat.' : '';
  return (
    <section className="v4-panel" id="gm467">
      <h3 className="h3">Plateaux à gimmick</h3>
      <p className="v4-note">{`Ajoute une règle de terrain à vos combats (hors boss, tutoriel et défis à règles fixes). ${d}`}</p>
      <div className="sv-io">
        {btn('off', 'Aucun')}
        {btn('rand', 'Aléatoire')}
        {Object.keys(GIM467).map(k => btn(k, GIM467[k].n))}
      </div>
    </section>
  );
}
