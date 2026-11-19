import { SECRETS460, scSt460 } from '../../../engine/091-phase-bosses-secret-places.js';
import { badgeCount459 } from '../../../engine/090-item-quests-trophies.js';

// Lieux secrets (v4.60) : ceux déjà découverts, et un indice pour les autres.
export default function SecretPlaces() {
  const st = scSt460();
  const n = SECRETS460.filter(s => st.found[s.id]).length;
  return (
    <section className="v4-panel" id="sc460j">
      <h3 className="h3">Lieux secrets</h3>
      <p className="v4-note">Des lieux n’apparaissent sur la carte qu’à certaines heures ou sous certaines météos. <b>{n} / {SECRETS460.length}</b> découverts. Un habitant itinérant passe aussi chaque jour sur la carte.</p>
      <ul className="sc460-l">
        {SECRETS460.map(s => {
          const f = st.found[s.id];
          return (
            <li key={s.id} className={`sc460-r${f ? ' on' : ''}`}>
              <b>{f ? s.n : '???'}</b>
              <small>{f ? 'Découvert.' : badgeCount459() < s.min ? 'Se révélera avec plus de badges.' : s.ind}</small>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
