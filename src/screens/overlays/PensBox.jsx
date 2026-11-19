import { Html } from '../../lib/html.jsx';
import { useOverlay } from './dialogsStore.js';
import { BY } from '../../engine/009-03-pokemon.js';
import { medal } from '../../engine/014-08-outils.js';

// Pension du Camp (#pensBox) : choix d'un couple. Le moteur (055) calcule la liste et
// la compatibilité, et garde les clics (data-pens, data-pens-p) et l'attribut hidden.
export default function PensBox() {
  const s = useOverlay('pens');
  return (
    <div className="result exp-box" id="pensBox" hidden>
      {s && <Carte key={s.v} {...s} />}
    </div>
  );
}

function Carte({ L, ok }) {
  return (
    <div className="sv-card exp-card" role="dialog" aria-modal="true" aria-labelledby="pensT">
      <button className="sh-x" type="button" data-pens="x" aria-label="Fermer"><svg><use href="#i-x" /></svg></button>
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
    </div>
  );
}
