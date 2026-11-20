import { PROFILE } from '../../../engine/state/game-state.js';
import { PREF } from '../../../engine/ui/preferences.js';
import { BOARD_THEMES, rivalState, isThemeUnlocked, dominantType } from '../../../engine/modes/rival-board-themes.js';

// Board themes (v4.55), bought with Shards, then the rival Kael's report.
// Buttons handled by the engine (delegated click on data-board-theme-action).
export default function BoardThemes() {
  const cur = BOARD_THEMES[PREF.boardTheme] ? PREF.boardTheme : 'classique';
  const rv = rivalState();
  const T = dominantType();
  const rival = rv.w
    ? ` Il apprend de ses défaites${T ? ` et prépare des Pokémon contre le type ${T}, le plus présent dans votre équipe` : ''}.`
    : ' Battez-le : il s’adaptera à votre style.';
  return (
    <section className="card" id="craft-bench">
      <h3 className="card-title">Thèmes de plateau</h3>
      <p className="note">Change seulement les couleurs du plateau. Éclats de Résonance : {PROFILE.gems}.</p>
      <div className="board-theme-grid">
        {Object.keys(BOARD_THEMES).map(k => {
          const th = BOARD_THEMES[k],
            ok = isThemeUnlocked(k);
          return (
            <button
              key={k}
              type="button"
              className={`board-theme-b${cur === k ? ' on' : ''}`}
              data-board-theme-action={`${ok ? 'set' : 'buy'}:${k}`}
              aria-pressed={cur === k}
            >
              <span className="board-theme-swatch">
                <i style={{ background: th.c[0] }} />
                <i style={{ background: th.c[1] }} />
              </span>
              <b>{th.n}</b>
              <small>{ok ? (cur === k ? 'Actif' : 'Choisir') : th.p + ' Éclats'}</small>
            </button>
          );
        })}
      </div>
      <h3 className="card-title settings-subhead">Votre rival</h3>
      <p className="note">{`Kael : ${rv.w} défaite${rv.w > 1 ? 's' : ''} contre vous, ${rv.l} victoire${rv.l > 1 ? 's' : ''}.${rival}`}</p>
    </section>
  );
}
