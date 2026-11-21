import { Html, parseStyle } from '../../lib/html.jsx';
import { POKEMON } from '../../engine/pokemon/pokemon.js';
import { PROFILE } from '../../engine/state/game-state.js';
import { medal } from '../../engine/core/utils.js';
import { formatNumber } from '../../engine/state/economy.js';
import { shinyStyle } from '../../engine/pokemon/shiny.js';
import { friendsPanelData } from '../../engine/modes/friend-challenges.js';
import { tournamentPanelHtml } from '../../engine/modes/friends-tournament.js';

import Button from '../../components/Button.jsx';
import CardHeader from '../../components/CardHeader.jsx';
// Friend challenges (#v4Amis, home-friends.css), under the hidden Home shortcuts.
// data-ami, data-ami-fight, data-ami-del and tournoi buttons: handled by the engine.
export default function Friends({ on }) {
  return (
    <section className="home-friends card" id="v4Amis" aria-label="Défis entre amis">
      {on && <Content />}
    </section>
  );
}

function Content() {
  const { L, rows, jour: dayKey, del } = friendsPanelData();
  return (
    <>
      <CardHeader icon="team" title="Défis entre amis" count={L.length} />
      {'\n  '}
      <p className="v4-ps-n">
        Partagez votre carte de dresseur (un code à coller), ajoutez celles de vos amis, et affrontez leurs équipes. Le
        classement compare vos progrès.
      </p>
      {'\n  '}
      <div className="home-friends-actions">
        <Button size="small" variant="primary" data-ami="carte">
          Ma carte de dresseur
        </Button>
        <Button size="small" data-ami="ajout">
          Ajouter un ami
        </Button>
      </div>
      <Html html={tournamentPanelHtml()} />
      {'\n  '}
      {L.length ? (
        <div className="home-friends-list">
          {L.map((a, i) => (
            <div key={i} className="home-friends-row">
              <span className="home-friends-team">
                {a.t.map((x, j) => (
                  <span
                    key={j}
                    className={'home-friends-pokemon' + (x[3] ? ' is-shiny' : '')}
                    style={x[3] ? parseStyle(shinyStyle(POKEMON[x[0]].base)) : undefined}
                  >
                    <Html html={medal(POKEMON[x[0]].t, 'is-small')} />
                  </span>
                ))}
              </span>
              <span className="home-friends-name">
                <b>{a.n}</b>
                <em>
                  {a.t.map(x => POKEMON[x[0]].n).join(', ')} · {a.w}–{a.l}
                </em>
              </span>
              <span className="home-friends-buttons">
                <Button size="small" variant="primary" data-ami-fight={i}>
                  Affronter
                </Button>
                <Button
                  size="small"
                  variant="ghost"
                  className={'home-friends-remove' + (del === i ? ' is-confirming' : '')}
                  data-ami-del={i}
                  aria-label={`Retirer ${a.n}`}
                >
                  {del === i ? 'Retirer ?' : '×'}
                </Button>
              </span>
            </div>
          ))}
        </div>
      ) : null}
      {'\n  '}
      <details className="home-friends-ranking" open={!!L.length}>
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
              <tr key={i} className={a.me ? 'is-me' : ''}>
                <td>{i + 1}</td>
                <td>{a.me ? (PROFILE.name ? PROFILE.name + ' (vous)' : 'Vous') : a.n}</td>
                <td>
                  <b>{formatNumber(a.sc)}</b>
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
        <p className="home-friends-note">
          Score : badges, Ligue, Johto, Pokédex, Tour de Résonance et chromatiques. « Jour » : Défi du jour relevé
          aujourd’hui (rang, manches). Le classement d’un ami se met à jour quand il vous renvoie sa carte.
        </p>
      </details>
    </>
  );
}
