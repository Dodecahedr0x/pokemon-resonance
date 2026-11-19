import { PROFILE } from '../../engine/state/game-state.js';
import { ACHIEVEMENTS } from '../../engine/progression/achievements.js';

// « Succès » (Achievements) tab (v4.9): an achievement that grants a title can be worn (data-titre, engine).
function AchievementRow({ s }) {
  const ok = !!(PROFILE.achievements && PROFILE.achievements[s.id]),
    pr = !ok && s.p ? s.p() : null,
    equipped = ok && PROFILE.titre === s.id;
  return (
    <article className={'v4-panel su-row' + (ok ? ' ok' : '')}>
      <span className="su-ic" aria-hidden="true">
        <svg>
          <use href="#i-trophy" />
        </svg>
      </span>
      <div className="su-t">
        <b>{s.n}</b>
        <em>{s.d}</em>
        {pr ? (
          <>
            <span className="su-p">
              <i style={{ width: `${Math.round((100 * Math.min(pr[0], pr[1])) / pr[1])}%` }} />
            </span>
            <small>
              {Math.min(pr[0], pr[1])} / {pr[1]}
            </small>
          </>
        ) : null}
        {s.t ? <small className="su-ti">Titre : « {s.t} »</small> : null}
      </div>
      {s.t && ok ? (
        <button
          type="button"
          className={'b b-sm' + (equipped ? ' b-gold' : '')}
          data-titre={s.id}
          aria-pressed={equipped}
        >
          {equipped ? 'Porté' : 'Porter'}
        </button>
      ) : ok ? (
        <span className="su-ok">✓</span>
      ) : null}
    </article>
  );
}

export default function Achievements() {
  const n = ACHIEVEMENTS.filter(s => PROFILE.achievements && PROFILE.achievements[s.id]).length;
  return (
    <>
      <p className="v4-note">
        {n} / {ACHIEVEMENTS.length} succès. Ceux qui donnent un titre peuvent être portés : il s’affiche à côté de votre
        nom.
      </p>
      {ACHIEVEMENTS.map(s => (
        <AchievementRow key={s.id} s={s} />
      ))}
    </>
  );
}
