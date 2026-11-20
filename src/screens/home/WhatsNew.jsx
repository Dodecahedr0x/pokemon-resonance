import { NEWS_ENTRIES, hasNewsToView } from '../../engine/ui/whats-new.js';

import Button from '../../components/Button.jsx';
import CardHeader from '../../components/CardHeader.jsx';
// "Nouveau" (New) panel on the Home page (#v4News, v4.16.1), before the shortcuts.
// Removed once the player has tapped "Compris" (Understood) (data-news="ok", handled by the engine).
export default function WhatsNew() {
  if (hasNewsToView()) {
    return null;
  }
  return (
    <section id="v4News" className="home-news card" aria-label="Nouveautés">
      <CardHeader icon="star" title="Nouveau">
        <Button size="small" variant="ghost" className="home-news-dismiss" data-news="ok">
          Compris
        </Button>
      </CardHeader>
      <ul className="home-news-list">
        {NEWS_ENTRIES.map(([ic, t, d, go], i) => {
          const body = (
            <>
              <span className="home-news-icon">
                <svg>
                  <use href={`#${ic}`} />
                </svg>
              </span>
              <span className="home-news-text">
                <b>{t}</b>
                <em>{d}</em>
              </span>
            </>
          );
          return (
            <li key={i}>
              {go ? (
                <button type="button" className="home-news-item" data-news={go}>
                  {body}
                  <svg className="home-news-chevron">
                    <use href="#i-chevr" />
                  </svg>
                </button>
              ) : (
                <div className="home-news-item">{body}</div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
