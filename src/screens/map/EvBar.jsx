import { routeEvent } from '../../engine/world/route-events.js';

// "Rencontre sur la route" (Encounter on the route) banner (v4.54), at the top of the map panel. The click
// (data-route-event) opens the encounter: handled by the engine.
export default function EvBar() {
  let ev;
  try {
    ev = routeEvent();
  } catch (e) {
    return null;
  }
  const { E, st } = ev;
  return (
    <button type="button" id="route-event" data-route-event="open" className={'route-event' + (st.done ? ' done' : '')}>
      {st.done ? (
        <>
          <span className="route-event-i">✓</span>
          <span>
            <b>{E.t}</b>
            <small>{st.res || 'Rencontre terminée. Une autre demain.'}</small>
          </span>
        </>
      ) : (
        <>
          <span className="route-event-i">!</span>
          <span>
            <b>Rencontre sur la route</b>
            <small>{`${E.t} · touchez pour voir`}</small>
          </span>
        </>
      )}
    </button>
  );
}
