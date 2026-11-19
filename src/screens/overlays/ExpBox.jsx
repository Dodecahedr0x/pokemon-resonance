import { Html } from '../../lib/html.jsx';
import { useOverlay } from './dialogsStore.js';
import { BY } from '../../engine/009-03-pokemon.js';
import { medal } from '../../engine/014-08-outils.js';
import { DESTINATIONS } from '../../engine/049-v4-10-01-identite.js';
import { lock461 } from '../../engine/092-4-61-compagnon-ufs-d-elevage-expeditions.js';

// Fenêtre d'expédition du Camp (#expBox) : choix du lieu, puis du Pokémon.
// Clics (data-exp-*) et attribut hidden : moteur (049).
export default function ExpBox() {
  const s = useOverlay('exp');
  return (
    <div className="result exp-box" id="expBox" hidden>
      {s && <Carte key={s.v} {...s} />}
    </div>
  );
}

function Carte({ dest, dispo }) {
  return (
    <div className="sv-card exp-card" role="dialog" aria-modal="true" aria-labelledby="expT">
      <button className="sh-x" type="button" data-exp-x="" aria-label="Fermer"><svg><use href="#i-x" /></svg></button>
      <p className="kick">Expédition</p>
      <h2 className="h2" id="expT">{dest ? DESTINATIONS[dest].n : 'Où partir ?'}</h2>
      {!dest ? (
        <div className="exp-list">
          {Object.entries(DESTINATIONS).map(([k, D]) => {
            // lieu verrouillé avant N badges (v4.61)
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
            {dispo.length ? (
              dispo.map(id => {
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
    </div>
  );
}
