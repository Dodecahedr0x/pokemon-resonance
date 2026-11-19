import { ev454 } from '../../engine/084-peddler-route-missions.js';

// "Rencontre sur la route" (Encounter on the route) banner (v4.54), at the top of the map panel. The click
// (data-ev454) opens the encounter: handled by the engine.
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
          <span>
            <b>{E.t}</b>
            <small>{st.res || 'Rencontre terminée. Une autre demain.'}</small>
          </span>
        </>
      ) : (
        <>
          <span className="ev454-i">!</span>
          <span>
            <b>Rencontre sur la route</b>
            <small>{`${E.t} · touchez pour voir`}</small>
          </span>
        </>
      )}
    </button>
  );
}
