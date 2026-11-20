import { Html } from '../../lib/html.jsx';
import { Box, Dialogue } from './Window.jsx';
import { BY } from '../../engine/pokemon/pokemon.js';
import { medal } from '../../engine/core/utils.js';

import Button from '../../components/Button.jsx';
// Camp Daycare (#pensBox): choice of a pair. The engine (055) computes the list and
// the compatibility, and keeps the clicks (data-pens, data-pens-p) and the hidden attribute.
export default function DaycareBox() {
  return <Box displayName="pens" className="result exp-box" id="pensBox" cardComponent={Card} />;
}

function Card({ L, ok }) {
  return (
    <Dialogue className="sv-card exp-card" titre="pensT" closeAttrs={{ 'data-pens': 'x' }}>
      <p className="kick">Pension</p>
      <h2 className="h2" id="pensT">
        Choisissez un couple
      </h2>
      <p className="d">
        Deux Pokémon qui partagent un type, ou Métamorph avec n’importe qui. Le premier choisi donne la famille de
        l’œuf, le second lui transmet une attaque. Les membres de l’équipe restent au camp.
      </p>
      <div className="exp-list">
        {L.length ? (
          L.map(({ id, i, cp }) => (
            <button key={id} type="button" className={'exp-d' + (i >= 0 ? ' on' : '')} data-pens-p={id}>
              <Html html={medal(BY[id].t, 'sm')} />
              <b>{BY[id].n}</b>
              <em>
                {i === 0
                  ? 'Mère : donne la famille'
                  : i === 1
                    ? 'Transmet une attaque'
                    : cp === true
                      ? 'Compatible'
                      : cp === false
                        ? 'Pas de type commun'
                        : BY[id].t.join(' · ')}
              </em>
            </button>
          ))
        ) : (
          <p className="v4-empty">Aucun Pokémon disponible au camp.</p>
        )}
      </div>
      <Button variant="primary" data-pens="ok" disabled={!ok}>
        Confier le couple
      </Button>
    </Dialogue>
  );
}
