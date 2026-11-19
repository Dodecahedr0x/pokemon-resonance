import { Html } from '../../lib/html.jsx';
import { Box, Dialogue } from './Window.jsx';
import { BY } from '../../engine/009-pokemon.js';
import { medal } from '../../engine/014-utils.js';

// Pension du Camp (#pensBox) : choix d'un couple. Le moteur (055) calcule la liste et
// la compatibilité, et garde les clics (data-pens, data-pens-p) et l'attribut hidden.
export default function DaycareBox() {
  return <Box nom="pens" className="result exp-box" id="pensBox" Carte={MapScreen} />;
}

function MapScreen({ L, ok }) {
  return (
    <Dialogue className="sv-card exp-card" titre="pensT" fermer={{ 'data-pens': 'x' }}>
      <p className="kick">Pension</p>
      <h2 className="h2" id="pensT">Choisissez un couple</h2>
      <p className="d">Deux Pokémon qui partagent un type, ou Métamorph avec n’importe qui. Le premier choisi donne la famille de l’œuf, le second lui transmet une attaque. Les membres de l’équipe restent au camp.</p>
      <div className="exp-list">
        {L.length ? (
          L.map(({ id, i, cp }) => (
            <button key={id} type="button" className={'exp-d' + (i >= 0 ? ' on' : '')} data-pens-p={id}>
              <Html html={medal(BY[id].t, 'sm')} />
              <b>{BY[id].n}</b>
              <em>{i === 0 ? 'Mère : donne la famille' : i === 1 ? 'Transmet une attaque' : cp === true ? 'Compatible' : cp === false ? 'Pas de type commun' : BY[id].t.join(' · ')}</em>
            </button>
          ))
        ) : (
          <p className="v4-empty">Aucun Pokémon disponible au camp.</p>
        )}
      </div>
      <button type="button" className="b b-gold" data-pens="ok" disabled={!ok}>Confier le couple</button>
    </Dialogue>
  );
}
