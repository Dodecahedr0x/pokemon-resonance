import { Html } from '../../lib/html.jsx';
import { Box, Dialogue } from './Window.jsx';
import { MV } from '../../engine/005-moves.js';
import { BY } from '../../engine/009-pokemon.js';
import { medal, tb, tc } from '../../engine/014-utils.js';

// Learn a TM or HM (#ctBox, opened from the Bag). The engine (045) computes
// the list of families and keeps the clicks (data-ct, data-ctf) and the hidden attribute.
export default function TmBox() {
  return <Box displayName="ct" className="result ct-box" id="ctBox" cardComponent={Card} />;
}

function Card({ M, m, families: families }) {
  return (
    <Dialogue className="sv-card ct-card" titre="ctT" closeAttrs={{ 'data-ct': 'x' }}>
      <p className="kick">{M.cs ? 'CS · réutilisable' : 'CT · usage unique'}</p>
      <h2 className="h2" id="ctT">
        {M.num} · {m.n}
      </h2>
      <p className="d">
        <Html html={tb(m.t)} /> {m.p ? `Puissance ${m.p} · ` : ''}
        <Html html={m.d} />
      </p>
      <p className="d">
        À qui l’apprendre ? Elle devient sa 3e capacité, à tous les stades de sa famille.{' '}
        {M.cs ? 'La CS reste dans le Sac.' : 'La CT disparaît une fois utilisée.'}
      </p>
      <div className="ct-list">
        {families.length ? (
          families.map(({ b, ok, already: already }) => {
            const f = BY[b];
            return (
              <button
                key={b}
                type="button"
                className={'ct-f' + (ok ? '' : ' off')}
                data-ctf={b}
                disabled={!(ok && already !== M.mv)}
                style={{ '--c': tc(f.t[0]) }}
              >
                <Html html={medal(f.t, 'sm')} />
                <span>
                  <b>{f.n}</b>
                  <em>
                    {!ok
                      ? 'Incompatible'
                      : already === M.mv
                        ? 'La connaît déjà'
                        : already
                          ? `Remplace ${MV[already].n}`
                          : 'Compatible'}
                  </em>
                </span>
              </button>
            );
          })
        ) : (
          <p className="v4-empty">Aucun Pokémon dans votre Box.</p>
        )}
      </div>
    </Dialogue>
  );
}
