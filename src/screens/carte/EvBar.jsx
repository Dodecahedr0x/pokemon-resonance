import { ev454 } from '../../engine/084-4-54-colporteur-rencontres-de-route-missions-de.js';

// Bandeau « Rencontre sur la route » (v4.54), en tête du panneau de la carte. Le clic
// (data-ev454) ouvre la rencontre : géré par le moteur.
export default function EvBar() {
  let ev;
  try {
    ev = ev454();
  } catch (e) {
    return null;
  }
  const { E, st } = ev;
  return (
    <button type="button" id="ev454" data-ev454="open" className={'ev454' + (st.done ? ' done' : '')}>
      {st.done ? (
        <>
          <span className="ev454-i">✓</span>
          <span><b>{E.t}</b><small>{st.res || 'Rencontre terminée. Une autre demain.'}</small></span>
        </>
      ) : (
        <>
          <span className="ev454-i">!</span>
          <span><b>Rencontre sur la route</b><small>{`${E.t} · touchez pour voir`}</small></span>
        </>
      )}
    </button>
  );
}
