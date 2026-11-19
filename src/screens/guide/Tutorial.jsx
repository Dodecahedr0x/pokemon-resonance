import { useReducer } from 'react';
import { PROFILE } from '../../engine/011-game-state.js';
import { queueSave } from '../../engine/025-saves.js';
import { TUTORIAL_STEPS433 } from '../../engine/068-duel-tutorial.js';
import { Html } from '../../lib/html.jsx';
import { useGuide } from './guideStore.js';

// « Tutoriel » (Tutorial) tab: grouped chapters, marked « read » on first open (saved).
// The « try » buttons keep their data-t433 attributes: the engine handles them.
export default function Tutorial() {
  useGuide();
  const [, rerender] = useReducer(x => x + 1, 0);
  const readFlags = new Set(PROFILE.tuto433 || []);
  const n = TUTORIAL_STEPS433.filter(c => readFlags.has(c.k)).length;
  const groupList = [...new Set(TUTORIAL_STEPS433.map(c => c.g))];

  const markRead = k => {
    const L = (PROFILE.tuto433 = PROFILE.tuto433 || []);
    if (L.includes(k)) return;
    L.push(k);
    queueSave();
    rerender();
  };
  const resetToZero = () => {
    PROFILE.tuto433 = [];
    queueSave();
    rerender();
  };

  return (
    <>
      <div className="gd-intro"><h2 className="h2">Tutoriel complet</h2><p className="d">Toutes les mécaniques du jeu, chapitre par chapitre. Ouvrez un chapitre pour le lire, puis essayez-le.</p></div>
      <div className="tu433-p">
        <span><b>{n}</b> / {TUTORIAL_STEPS433.length} chapitres lus</span>
        <i style={{ '--w': Math.round((n / TUTORIAL_STEPS433.length) * 100) + '%' }} />
        {n > 0 && <button type="button" className="lnk" onClick={resetToZero}>Tout remettre à zéro</button>}
      </div>
      {groupList.map(g => [
        <h3 key={'g-' + g} className="tu433-g">{g}</h3>,
        ...TUTORIAL_STEPS433.filter(c => c.g === g).map(c => {
          const isRead = readFlags.has(c.k);
          return (
            <details key={c.k} className={`tu433-c${isRead ? ' lu' : ''}`} data-tu433={c.k} onToggle={e => e.currentTarget.open && markRead(c.k)}>
              <summary>
                <span className="tu433-i"><svg><use href={'#' + c.ic} /></svg></span>
                <b>{c.t}</b>
                <span className="tu433-ok" aria-label={isRead ? 'lu' : 'à lire'}>{isRead ? '✓' : ''}</span>
              </summary>
              <p><Html html={typeof c.d === 'function' ? c.d() : c.d} /></p>
              {c.a.length > 0 && (
                <div className="tu433-a">
                  {c.a.map(([l, at], i) => <Html key={i} html={`<button type="button" class="b b-sm" ${at}>${l}</button>`} />)}
                </div>
              )}
            </details>
          );
        }),
      ])}
    </>
  );
}
