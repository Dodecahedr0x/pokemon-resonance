import { BY } from '../../../engine/pokemon/pokemon.js';
import { PROFILE } from '../../../engine/state/game-state.js';
import { PIX } from '../../../engine/assets/item-icons.js';
import { ownedFam } from '../../../engine/progression/trainer-stats.js';
import { DEXS } from '../../../engine/progression/pokedex.js';
import { readJournal } from '../../../engine/audio/immersion.js';

// Settings › Trainer Journal (v4.48): statistics recorded on this device.
const Cell = ({ n, l }) => (
  <div className="trainer-journal-c">
    <b>{n}</b>
    <span>{l}</span>
  </div>
);

export default function TrainerJournal() {
  const j = readJournal(),
    P = PROFILE,
    fav = Object.entries(j.use).sort((a, b) => b[1] - a[1])[0],
    fm = fav && BY[fav[0]],
    rate = P.battles ? Math.round((100 * P.wins) / P.battles) : 0,
    own = DEXS.filter(m => ownedFam(m.id)).length;
  return (
    <section className="v4-panel" id="trainer-journal-panel">
      <h3 className="h3">Journal de dresseur</h3>
      <p className="v4-note">Vos exploits, tels qu’ils sont enregistrés sur cet appareil.</p>
      <div className="trainer-journal">
        <Cell n={P.battles} l="Combats" />
        <Cell n={P.wins} l="Victoires" />
        <Cell n={rate + ' %'} l="Réussite" />
        <Cell n={j.best} l="Meilleure série" />
        <Cell n={P.kos} l="K.O. infligés" />
        <Cell n={P.caught} l="Captures" />
        <Cell n={P.awakenings} l="Éveils" />
        <Cell n={P.rx} l="Réactions" />
        <Cell n={own + ' / ' + DEXS.length} l="Pokédex" />
      </div>
      {fm && (
        <p className="trainer-journal-f">
          <img src={PIX(fm.no)} alt="" width="40" height="40" />
          <span>
            Pokémon le plus engagé<b>{fm.n}</b>
            <em>
              {fav[1]} combat{fav[1] > 1 ? 's' : ''}
            </em>
          </span>
        </p>
      )}
    </section>
  );
}
