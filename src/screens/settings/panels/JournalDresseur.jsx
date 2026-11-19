import { BY } from '../../../engine/009-03-pokemon.js';
import { PROFILE } from '../../../engine/011-05-etat-de-partie.js';
import { PIX, ownedFam } from '../../../engine/032-v4-00-socle.js';
import { DEXS } from '../../../engine/038-v4-06-pokedex.js';
import { jr448 } from '../../../engine/079-v4-48-immersion-sons-par-type-cris-vibrations-en.js';

// Paramètres › Journal de dresseur (v4.48) : statistiques enregistrées sur cet appareil.
const Case = ({ n, l }) => <div className="j448-c"><b>{n}</b><span>{l}</span></div>;

export default function JournalDresseur() {
  const j = jr448(),
    P = PROFILE,
    fav = Object.entries(j.use).sort((a, b) => b[1] - a[1])[0],
    fm = fav && BY[fav[0]],
    taux = P.battles ? Math.round((100 * P.wins) / P.battles) : 0,
    own = DEXS.filter(m => ownedFam(m.id)).length;
  return (
    <section className="v4-panel" id="aj448">
      <h3 className="h3">Journal de dresseur</h3>
      <p className="v4-note">Vos exploits, tels qu’ils sont enregistrés sur cet appareil.</p>
      <div className="j448">
        <Case n={P.battles} l="Combats" />
        <Case n={P.wins} l="Victoires" />
        <Case n={taux + ' %'} l="Réussite" />
        <Case n={j.best} l="Meilleure série" />
        <Case n={P.kos} l="K.O. infligés" />
        <Case n={P.caught} l="Captures" />
        <Case n={P.evos} l="Éveils" />
        <Case n={P.rx} l="Réactions" />
        <Case n={own + ' / ' + DEXS.length} l="Pokédex" />
      </div>
      {fm && (
        <p className="j448-f"><img src={PIX(fm.no)} alt="" width="40" height="40" /><span>Pokémon le plus engagé<b>{fm.n}</b><em>{fav[1]} combat{fav[1] > 1 ? 's' : ''}</em></span></p>
      )}
    </section>
  );
}
