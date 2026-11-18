import { Html } from '../../lib/html.jsx';
import { useOverlay } from './dialogsStore.js';
import { MV } from '../../engine/005-02-capacites.js';
import { BY } from '../../engine/009-03-pokemon.js';
import { medal, tb, tc } from '../../engine/014-08-outils.js';

// Apprendre une CT ou une CS (#ctBox, ouverte depuis le Sac). Le moteur (045) calcule
// la liste des familles et garde les clics (data-ct, data-ctf) et l'attribut hidden.
export default function CtBox() {
  const s = useOverlay('ct');
  return (
    <div className="result ct-box" id="ctBox" hidden>
      {s && <Carte key={s.v} {...s} />}
    </div>
  );
}

function Carte({ M, m, fams }) {
  return (
    <div className="sv-card ct-card" role="dialog" aria-modal="true" aria-labelledby="ctT">
      <button className="sh-x" type="button" data-ct="x" aria-label="Fermer"><svg><use href="#i-x" /></svg></button>
      <p className="kick">{M.cs ? 'CS · réutilisable' : 'CT · usage unique'}</p>
      <h2 className="h2" id="ctT">{M.num} · {m.n}</h2>
      <p className="d"><Html html={tb(m.t)} /> {m.p ? `Puissance ${m.p} · ` : ''}<Html html={m.d} /></p>
      <p className="d">À qui l’apprendre ? Elle devient sa 3e capacité, à tous les stades de sa famille. {M.cs ? 'La CS reste dans le Sac.' : 'La CT disparaît une fois utilisée.'}</p>
      <div className="ct-list">
        {fams.length ? (
          fams.map(({ b, ok, deja }) => {
            const f = BY[b];
            return (
              <button key={b} type="button" className={'ct-f' + (ok ? '' : ' off')} data-ctf={b} disabled={!(ok && deja !== M.mv)} style={{ '--c': tc(f.t[0]) }}>
                <Html html={medal(f.t, 'sm')} />
                <span>
                  <b>{f.n}</b>
                  <em>{!ok ? 'Incompatible' : deja === M.mv ? 'La connaît déjà' : deja ? `Remplace ${MV[deja].n}` : 'Compatible'}</em>
                </span>
              </button>
            );
          })
        ) : (
          <p className="v4-empty">Aucun Pokémon dans votre Box.</p>
        )}
      </div>
    </div>
  );
}
