import { Html, parseStyle } from '../../lib/html.jsx';
import { BY } from '../../engine/009-pokemon.js';
import { PROFILE } from '../../engine/011-game-state.js';
import { medal } from '../../engine/014-utils.js';
import { fmt } from '../../engine/032-v4-foundation.js';
import { shinyStyle } from '../../engine/043-adventure-plus.js';
import { friendsPanelData } from '../../engine/055-living-johto.js';
import { tournamentPanelHtml } from '../../engine/057-companions-resonance.js';

// Friend challenges (#v4Amis, v4.16), under the hidden Home shortcuts.
// data-ami, data-ami-fight, data-ami-del and tournoi buttons: handled by the engine.
export default function Friends({ on }) {
  return (
    <section className="v4-amis v4-panel" id="v4Amis" aria-label="Défis entre amis">
      {on && <Content />}
    </section>
  );
}

function Content() {
  const { L, rows, jour: dayKey, del } = friendsPanelData();
  return (
    <>
      <header className="v4-ph">
        <svg>
          <use href="#i-team" />
        </svg>
        <b>Défis entre amis</b>
        <span className="v4-cnt">{L.length}</span>
      </header>
      {'\n  '}
      <p className="v4-ps-n">
        Partagez votre carte de dresseur (un code à coller), ajoutez celles de vos amis, et affrontez leurs équipes. Le
        classement compare vos progrès.
      </p>
      {'\n  '}
      <div className="am-a">
        <button type="button" className="b b-gold b-sm" data-ami="carte">
          Ma carte de dresseur
        </button>
        <button type="button" className="b b-sm" data-ami="ajout">
          Ajouter un ami
        </button>
      </div>
      <Html html={tournamentPanelHtml()} />
      {'\n  '}
      {L.length ? (
        <div className="am-l">
          {L.map((a, i) => (
            <div key={i} className="am-r">
              <span className="am-t">
                {a.t.map((x, j) => (
                  <span
                    key={j}
                    className={'am-m' + (x[3] ? ' shn' : '')}
                    style={x[3] ? parseStyle(shinyStyle(BY[x[0]].base)) : undefined}
                  >
                    <Html html={medal(BY[x[0]].t, 'sm')} />
                  </span>
                ))}
              </span>
              <span className="am-n">
                <b>{a.n}</b>
                <em>
                  {a.t.map(x => BY[x[0]].n).join(', ')} · {a.w}–{a.l}
                </em>
              </span>
              <span className="am-b">
                <button type="button" className="b b-sm b-gold" data-ami-fight={i}>
                  Affronter
                </button>
                <button
                  type="button"
                  className={'b b-sm b-ghost am-del' + (del === i ? ' on' : '')}
                  data-ami-del={i}
                  aria-label={`Retirer ${a.n}`}
                >
                  {del === i ? 'Retirer ?' : '×'}
                </button>
              </span>
            </div>
          ))}
        </div>
      ) : null}
      {'\n  '}
      <details className="am-cl" open={!!L.length}>
        <summary>Classement</summary>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Dresseur</th>
              <th>Score</th>
              <th>Badges</th>
              <th>Tour</th>
              <th>Jour</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a, i) => (
              <tr key={i} className={a.me ? 'me' : ''}>
                <td>{i + 1}</td>
                <td>{a.me ? (PROFILE.name ? PROFILE.name + ' (vous)' : 'Vous') : a.n}</td>
                <td>
                  <b>{fmt(a.sc)}</b>
                </td>
                <td>
                  {a.s.b}
                  {a.s.j ? ' + ' + a.s.j : ''}
                </td>
                <td>{a.s.tb}</td>
                <td>{dayKey(a)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="am-nt">
          Score : badges, Ligue, Johto, Pokédex, Tour de Résonance et chromatiques. « Jour » : Défi du jour relevé
          aujourd’hui (rang, manches). Le classement d’un ami se met à jour quand il vous renvoie sa carte.
        </p>
      </details>
    </>
  );
}
