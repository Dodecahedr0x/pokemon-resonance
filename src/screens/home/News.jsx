import { NEWS416, newsView416 } from '../../engine/056-polish-v4-16.js';

// Panneau « Nouveau » de l'Accueil (#v4News, v4.16.1), avant les raccourcis.
// Retiré quand le joueur a touché « Compris » (data-news="ok", géré par le moteur).
export default function WhatsNew() {
  if (newsView416()) return null;
  return (
    <section id="v4News" className="v4-news v4-panel" aria-label="Nouveautés">
      <header className="v4-ph">
        <svg><use href="#i-star" /></svg>
        <b>Nouveau</b>
        <button type="button" className="b b-sm b-ghost nw-x" data-news="ok">Compris</button>
      </header>
      <ul className="nw-l">
        {NEWS416.map(([ic, t, d, go], i) => {
          const body = (
            <>
              <span className="nw-ic"><svg><use href={`#${ic}`} /></svg></span>
              <span><b>{t}</b><em>{d}</em></span>
            </>
          );
          return (
            <li key={i}>
              {go ? (
                <button type="button" className="nw-i" data-news={go}>
                  {body}
                  <svg className="nw-go"><use href="#i-chevr" /></svg>
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
