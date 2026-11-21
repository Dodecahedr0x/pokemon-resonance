import { Html } from '../../lib/html.jsx';
import { Box, Dialogue } from './Window.jsx';
import { POKEMON } from '../../engine/pokemon/pokemon.js';
import { medal } from '../../engine/core/utils.js';

import Button from '../../components/Button.jsx';
// Camp Daycare (#pensBox): choice of a pair. The engine (055) computes the list and
// the compatibility, and keeps the clicks (data-pens, data-pens-p) and the hidden attribute.
export default function DaycareBox() {
  return <Box displayName="pens" className="modal is-raised" id="pensBox" cardComponent={Card} />;
}

function Card({ L, ok }) {
  return (
    <Dialogue className="dialog-card is-compact" titre="pensT" closeAttrs={{ 'data-pens': 'x' }}>
      <p className="kicker">Pension</p>
      <h2 className="section-title" id="pensT">
        Choisissez un couple
      </h2>
      <p className="d">
        Deux Pokémon qui partagent un type, ou Métamorph avec n’importe qui. Le premier choisi donne la famille de
        l’œuf, le second lui transmet une attaque. Les membres de l’équipe restent au camp.
      </p>
      <div className="picker-list">
        {L.length ? (
          L.map(({ id, i, cp }) => (
            <button
              key={id}
              type="button"
              className={'picker-option' + (i >= 0 ? ' is-selected' : '')}
              data-pens-p={id}
            >
              <Html html={medal(POKEMON[id].t, 'is-small')} />
              <b>{POKEMON[id].n}</b>
              <em>
                {i === 0
                  ? 'Mère : donne la famille'
                  : i === 1
                    ? 'Transmet une attaque'
                    : cp === true
                      ? 'Compatible'
                      : cp === false
                        ? 'Pas de type commun'
                        : POKEMON[id].t.join(' · ')}
              </em>
            </button>
          ))
        ) : (
          <p className="empty-state">Aucun Pokémon disponible au camp.</p>
        )}
      </div>
      <Button variant="primary" data-pens="ok" disabled={!ok}>
        Confier le couple
      </Button>
    </Dialogue>
  );
}
