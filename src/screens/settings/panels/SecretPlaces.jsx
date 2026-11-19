import { SECRET_PLACES, secretState } from '../../../engine/world/secret-places.js';
import { badgeTotal } from '../../../engine/progression/item-quests.js';

// Secret places (v4.60): those already discovered, and a hint for the others.
export default function SecretPlaces() {
  const st = secretState();
  const n = SECRET_PLACES.filter(s => st.found[s.id]).length;
  return (
    <section className="v4-panel" id="secret-places-j">
      <h3 className="h3">Lieux secrets</h3>
      <p className="v4-note">
        Des lieux n’apparaissent sur la carte qu’à certaines heures ou sous certaines météos.{' '}
        <b>
          {n} / {SECRET_PLACES.length}
        </b>{' '}
        découverts. Un habitant itinérant passe aussi chaque jour sur la carte.
      </p>
      <ul className="secret-places-l">
        {SECRET_PLACES.map(s => {
          const f = st.found[s.id];
          return (
            <li key={s.id} className={`secret-places-r${f ? ' on' : ''}`}>
              <b>{f ? s.n : '???'}</b>
              <small>{f ? 'Découvert.' : badgeTotal() < s.min ? 'Se révélera avec plus de badges.' : s.ind}</small>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
