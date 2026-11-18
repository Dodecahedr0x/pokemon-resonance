import { ownedFam } from '../../engine/032-v4-00-socle.js';
import { DEXS } from '../../engine/038-v4-06-pokedex.js';
import { PAL454, msSt454, sem454, txt454, typesMs454 } from '../../engine/084-4-54-colporteur-rencontres-de-route-missions-de.js';

// Missions du Pokédex (#ms454, v4.54) : paliers d'espèces et spécialistes de la semaine.
// La réclamation (data-ms454) reste gérée par le moteur.
export default function Missions() {
  const S = msSt454(),
    n = DEXS.filter(m => ownedFam(m.id)).length;
  const pals = PAL454.filter(p => !S.pal[p[0]]).slice(0, 2);
  const w = sem454();
  return (
    <section id="ms454" className="ms454 v4-panel">
      <h3>Missions du Pokédex</h3>
      {pals.map(([k, r]) => {
        const ok = n >= k;
        return (
          <div className={`ms454-r${ok ? ' ok' : ''}`} key={'p' + k}>
            <div>
              <b>{`Capturer ${k} espèces`}</b>
              <i>
                <u style={{ width: Math.min(100, (n / k) * 100) + '%' }} />
              </i>
              <small>{`${Math.min(n, k)} / ${k} · ${txt454(r)}`}</small>
            </div>
            <button type="button" className="v4-btn" data-ms454={`p:${k}`} disabled={!ok}>
              {ok ? 'Réclamer' : '—'}
            </button>
          </div>
        );
      })}
      {typesMs454().map(({ t, n: need, own }) => {
        const done = S.ty[w + t],
          ok = own >= need;
        return (
          <div className={`ms454-r${ok && !done ? ' ok' : ''}${done ? ' done' : ''}`} key={'t' + t}>
            <div>
              <b>
                {`Spécialiste ${t} `}
                <em>cette semaine</em>
              </b>
              <i>
                <u style={{ width: Math.min(100, (own / need) * 100) + '%' }} />
              </i>
              <small>{`${Math.min(own, need)} / ${need} Pokémon de type ${t} · +1 Éclat`}</small>
            </div>
            <button type="button" className="v4-btn" data-ms454={`t:${t}`} disabled={!(ok && !done)}>
              {done ? 'Fait' : ok ? 'Réclamer' : '—'}
            </button>
          </div>
        );
      })}
    </section>
  );
}
