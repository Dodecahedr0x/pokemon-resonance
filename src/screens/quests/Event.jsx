import { POKEMON, SCEN } from '../../engine/pokemon/pokemon.js';
import { PROFILE } from '../../engine/state/game-state.js';
import { pokemonArtUrl } from '../../engine/assets/images.js';
import { dailyDone, dailyKey, dailyLeft } from '../../engine/modes/daily-battle.js';
import { formatNumber } from '../../engine/state/economy.js';
import { buildWeeklyChallenge } from '../../engine/modes/weekly-challenge.js';
import Rewards from './Rewards.jsx';

import Button from '../../components/Button.jsx';
import CardHeader from '../../components/CardHeader.jsx';
const NL = '\n ';

// Challenge of the week (v4.29): same rental team for everyone, ranking among friends.
function Weekly() {
  const H = buildWeeklyChallenge(),
    D = SCEN.hebdo429,
    h = PROFILE.hebdo429 && PROFILE.hebdo429.w === H.w ? PROFILE.hebdo429 : null,
    friends = (PROFILE.friends || []).filter(a => a.wk && a.wk.w === H.w).map(a => ({ n: a.n, s: a.wk.s })),
    rows = [...(h ? [{ n: (PROFILE.name || 'Vous') + ' (vous)', s: h.best, me: 1 }] : []), ...friends].sort(
      (a, b) => b.s - a.s
    );
  return (
    <article className="weekly-challenge card">
      <CardHeader icon="trophy" title="Défi de la semaine" count={D.lvl} />
      {NL}
      <p className="weekly-challenge-rules">{D.d}</p>
      {NL}
      <div className="weekly-challenge-team">
        {H.team.map((id, i) => (
          <span key={i} className="weekly-challenge-member" data-species-sheet={id} title={POKEMON[id].n}>
            <img src={pokemonArtUrl(POKEMON[id].no)} alt="" loading="lazy" />
            <em>{POKEMON[id].n}</em>
          </span>
        ))}
      </div>
      {NL}
      <div className="weekly-challenge-facts">
        <span>
          Record <b>{h ? formatNumber(h.best) : '—'}</b>
        </span>
        <span>
          Essais <b>{h ? h.n : 0}</b>
        </span>
        <span>{h && h.rec ? 'Récompense reçue ✓' : 'Première victoire : +2 500 ₽ · +25 Éclats'}</span>
      </div>
      {NL}
      <Button variant="primary" data-v4fight="hebdo429">
        Relever le défi
      </Button>
      {NL}
      {rows.length > 1 ? (
        <table className="weekly-challenge-ranking">
          <caption>Classement entre amis</caption>
          <tbody>
            {rows.map((x, i) => (
              <tr key={i} className={x.me ? 'is-me' : ''}>
                <td>{i + 1}</td>
                <td>{x.n}</td>
                <td>
                  <b>{formatNumber(x.s)}</b>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="weekly-challenge-hint">
          Partagez votre carte de dresseur après le défi : vos amis verront votre score de la semaine.
        </p>
      )}
      {'\n'}
    </article>
  );
}

// "Événement" (Event) tab: challenge of the week first (v4.29), then the daily challenge.
export default function Event() {
  const dk = dailyKey(),
    S = dk && SCEN[dk],
    done = dailyDone();
  return (
    <>
      <Weekly />
      {S ? (
        <>
          <article className={'quests-daily card' + (done ? ' is-done' : '')}>
            <span className="landscape-scene" style={{ backgroundPosition: `${(dk.charCodeAt(0) * 7) % 100}% 50%` }} />
            <div className="quests-daily-text">
              <small>Défi du jour · se renouvelle dans {dailyLeft()}</small>
              <b>{S.n}</b>
              <em>{S.d || ''}</em>
              <div className="reward-list">
                {done ? (
                  <span>Relevé aujourd’hui ✓</span>
                ) : (
                  <>
                    <span>Gains ×2</span>
                    <Rewards r={{ gems: 3 }} />
                  </>
                )}
              </div>
            </div>
            {done ? null : (
              <Button variant="primary" data-v4fight={dk}>
                Relever le défi
                <svg>
                  <use href="#i-arrow" />
                </svg>
              </Button>
            )}
          </article>
          <p className="note">
            Chaque jour, un terrain déjà ouvert devient le défi du jour. La première victoire double la prime et
            rapporte 3 Éclats.
          </p>
        </>
      ) : (
        <p className="empty-state">Aucun défi disponible.</p>
      )}
    </>
  );
}
