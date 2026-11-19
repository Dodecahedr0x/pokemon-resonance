import { Html } from '../../lib/html.jsx';
import { Box, Dialogue } from './Window.jsx';
import { BY } from '../../engine/009-pokemon.js';
import { medal } from '../../engine/014-utils.js';
import { DESTINATIONS } from '../../engine/049-identity.js';
import { lock461 } from '../../engine/092-companion-eggs-expeditions.js';

// Camp expedition window (#expBox): choice of location, then of Pokémon.
// Clicks (data-exp-*) and hidden attribute: engine (049).
export default function ExpBox() {
  return <Box nom="exp" className="result exp-box" id="expBox" Carte={MapScreen} />;
}

function MapScreen({ dest, dispo: available }) {
  return (
    <Dialogue className="sv-card exp-card" titre="expT" fermer={{ 'data-exp-x': '' }}>
      <p className="kick">Expédition</p>
      <h2 className="h2" id="expT">{dest ? DESTINATIONS[dest].n : 'Où partir ?'}</h2>
      {!dest ? (
        <div className="exp-list">
          {Object.entries(DESTINATIONS).map(([k, D]) => {
            // location locked until N badges (v4.61)
            const lk = !!lock461 && lock461(D);
            return (
              <button key={k} type="button" className="exp-d" data-exp-d={k} disabled={lk}>
                <b>{D.n}</b>
                <em>{lk ? `Accessible après ${D.min} badges` : `${D.duree} combats · ${D.types.slice(0, 4).join(', ')} ×2`}</em>
              </button>
            );
          })}
        </div>
      ) : (
        <>
          <p className="d">Qui part ? Les Pokémon dont un type convient au lieu rapportent le double. Les membres de l’équipe ne peuvent pas partir.</p>
          <div className="exp-list">
            {available.length ? (
              available.map(id => {
                const bon = BY[id].t.some(t => DESTINATIONS[dest].types.includes(t));
                return (
                  <button key={id} type="button" className="exp-d" data-exp-p={id}>
                    <Html html={medal(BY[id].t, 'sm')} />
                    <b>{BY[id].n}</b>
                    <em>{bon ? 'Terrain idéal · ×2' : 'Gains normaux'}</em>
                  </button>
                );
              })
            ) : (
              <p className="v4-empty">Aucun Pokémon disponible : ceux de l’équipe restent au camp.</p>
            )}
          </div>
          <button type="button" className="b b-sm b-ghost" data-exp-d="">Choisir un autre lieu</button>
        </>
      )}
    </Dialogue>
  );
}
