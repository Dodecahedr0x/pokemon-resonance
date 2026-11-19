import { NEWS_ENTRIES, hasNewsToView } from '../../engine/056-polish-v4-16.js';

// "Nouveau" (New) panel on the Home page (#v4News, v4.16.1), before the shortcuts.
// Removed once the player has tapped "Compris" (Understood) (data-news="ok", handled by the engine).
export default function WhatsNew() {
  if (hasNewsToView()) {
    return null;
  }
  return (
    <section id="v4News" className="v4-news v4-panel" aria-label="Nouveautés">
      <header className="v4-ph">
        <svg>
          <use href="#i-star" />
        </svg>
        <b>Nouveau</b>
        <button type="button" className="b b-sm b-ghost nw-x" data-news="ok">
          Compris
        </button>
      </header>
      <ul className="nw-l">
        {NEWS_ENTRIES.map(([ic, t, d, go], i) => {
          const body = (
            <>
              <span className="nw-ic">
                <svg>
                  <use href={`#${ic}`} />
                </svg>
              </span>
              <span>
                <b>{t}</b>
                <em>{d}</em>
              </span>
            </>
          );
          return (
            <li key={i}>
              {go ? (
                <button type="button" className="nw-i" data-news={go}>
                  {body}
                  <svg className="nw-go">
                    <use href="#i-chevr" />
                  </svg>
                </button>
              ) : (
                <div className="nw-i">{body}</div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
