import { PROFILE } from '../../../engine/state/game-state.js';
import { SCENES } from '../../../engine/progression/story-dialogues.js';
import { badgeTotal } from '../../../engine/progression/item-quests.js';
import { CHAPTERS, CHAPTER_NAMES, chapterState } from '../../../engine/progression/chronicles.js';
import { space } from '../../../lib/theme.js';

// Chronicles (v4.62): chapters unlocked by badges, then scenes already seen.
// Buttons handled by the engine (delegated click on data-chronicle).
export default function Chronicles() {
  const s = chapterState(),
    nb = badgeTotal(),
    n = CHAPTERS.filter((c, i) => s.read[i]).length;
  const seenSet = Object.keys(CHAPTER_NAMES).filter(k => SCENES[k] && PROFILE.scenes && PROFILE.scenes[k]);
  return (
    <section className="card" id="chronicles-panel">
      <h3 className="card-title">Chroniques</h3>
      <p className="note">
        L’histoire de la Résonance, chapitre après chapitre, au fil de vos badges.{' '}
        <b>
          {n} / {CHAPTERS.length}
        </b>{' '}
        lus.
      </p>
      <div className="chronicle-grid">
        {CHAPTERS.map((c, i) => {
          const lock = nb < c.min,
            isRead = s.read[i];
          return (
            <button
              key={i}
              type="button"
              className={`chronicle${isRead ? ' is-read' : ''}${lock ? ' is-locked' : ''}`}
              data-chronicle={i}
              disabled={lock}
            >
              <b>{lock ? 'Chapitre ' + (i + 1) + ' · ???' : c.t}</b>
              <small>
                {lock ? `Après ${c.min} badge${c.min > 1 ? 's' : ''}.` : isRead ? 'Relire' : 'Nouveau · +2 Éclats'}
              </small>
            </button>
          );
        })}
      </div>
      {seenSet.length > 0 && (
        <>
          <h4 className="card-title" style={{ marginTop: space.md }}>
            Scènes déjà vues
          </h4>
          <div className="chronicle-grid">
            {seenSet.map(k => (
              <button key={k} type="button" className="chronicle is-read" data-chronicle={`s${k}`}>
                <b>{CHAPTER_NAMES[k]}</b>
                <small>Revoir</small>
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
