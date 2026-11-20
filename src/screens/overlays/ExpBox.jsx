import { Html } from '../../lib/html.jsx';
import { Box, Dialogue } from './Window.jsx';
import { BY } from '../../engine/pokemon/pokemon.js';
import { medal } from '../../engine/core/utils.js';
import { DESTINATIONS } from '../../engine/progression/expeditions.js';
import { lockedByBadges } from '../../engine/progression/companion-eggs.js';

import Button from '../../components/Button.jsx';
// Camp expedition window (#expBox): choice of location, then of Pokémon.
// Clicks (data-exp-*) and hidden attribute: engine (049).
export default function ExpBox() {
  return <Box displayName="exp" className="result exp-box" id="expBox" cardComponent={Card} />;
}

function Card({ destinationId: dest, available: available }) {
  return (
    <Dialogue className="sv-card exp-card" titre="expT" closeAttrs={{ 'data-exp-x': '' }}>
      <p className="kicker">Expédition</p>
      <h2 className="section-title" id="expT">
        {dest ? DESTINATIONS[dest].n : 'Où partir ?'}
      </h2>
      {!dest ? (
        <div className="exp-list">
          {Object.entries(DESTINATIONS).map(([k, D]) => {
            // location locked until N badges (v4.61)
            const lk = !!lockedByBadges && lockedByBadges(D);
            return (
              <button key={k} type="button" className="exp-d" data-exp-d={k} disabled={lk}>
                <b>{D.n}</b>
                <em>
                  {lk
                    ? `Accessible après ${D.min} badges`
                    : `${D.duration} combats · ${D.types.slice(0, 4).join(', ')} ×2`}
                </em>
              </button>
            );
          })}
        </div>
      ) : (
        <>
          <p className="d">
            Qui part ? Les Pokémon dont un type convient au lieu rapportent le double. Les membres de l’équipe ne
            peuvent pas partir.
          </p>
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
          <Button size="small" variant="ghost" data-exp-d="">
            Choisir un autre lieu
          </Button>
        </>
      )}
    </Dialogue>
  );
}
