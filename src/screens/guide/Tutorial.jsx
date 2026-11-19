import { useReducer } from 'react';
import { PROFILE } from '../../engine/state/game-state.js';
import { queueSave } from '../../engine/state/saves.js';
import { TUTORIAL_LIST } from '../../engine/ui/tutorial-chapters.js';
import { Html } from '../../lib/html.jsx';
import { useGuide } from './guideStore.js';

// « Tutoriel » (Tutorial) tab: grouped chapters, marked « read » on first open (saved).
// The « try » buttons keep their data-try-it attributes: the engine handles them.
// PROFILE is engine state: it is changed here, outside the component.
function markTutorialRead(k) {
  const L = (PROFILE.tuto433 = PROFILE.tuto433 || []);
  if (L.includes(k)) {
    return false;
  }
  L.push(k);
  queueSave();
  return true;
}
function resetTutorial() {
  PROFILE.tuto433 = [];
  queueSave();
}

export default function Tutorial() {
  useGuide();
  const [, rerender] = useReducer(x => x + 1, 0);
  const readFlags = new Set(PROFILE.tuto433 || []);
  const n = TUTORIAL_LIST.filter(c => readFlags.has(c.k)).length;
  const groupList = [...new Set(TUTORIAL_LIST.map(c => c.g))];

  const markRead = k => {
    if (markTutorialRead(k)) {
      rerender();
    }
  };
  const resetToZero = () => {
    resetTutorial();
    rerender();
  };

  return (
    <>
      <div className="gd-intro">
        <h2 className="h2">Tutoriel complet</h2>
        <p className="d">
          Toutes les mécaniques du jeu, chapitre par chapitre. Ouvrez un chapitre pour le lire, puis essayez-le.
        </p>
      </div>
      <div className="tutorial-ch-p">
        <span>
          <b>{n}</b> / {TUTORIAL_LIST.length} chapitres lus
        </span>
        <i style={{ '--w': Math.round((n / TUTORIAL_LIST.length) * 100) + '%' }} />
        {n > 0 && (
          <button type="button" className="lnk" onClick={resetToZero}>
            Tout remettre à zéro
          </button>
        )}
      </div>
      {groupList.map(g => [
        <h3 key={'g-' + g} className="tutorial-ch-g">
          {g}
        </h3>,
        ...TUTORIAL_LIST.filter(c => c.g === g).map(c => {
          const isRead = readFlags.has(c.k);
          return (
            <details
              key={c.k}
              className={`tutorial-ch-c${isRead ? ' lu' : ''}`}
              data-tutorial-ch={c.k}
              onToggle={e => e.currentTarget.open && markRead(c.k)}
            >
              <summary>
                <span className="tutorial-ch-i">
                  <svg>
                    <use href={'#' + c.ic} />
                  </svg>
                </span>
                <b>{c.t}</b>
                <span className="tutorial-ch-ok" aria-label={isRead ? 'lu' : 'à lire'}>
                  {isRead ? '✓' : ''}
                </span>
              </summary>
              <p>
                <Html html={typeof c.d === 'function' ? c.d() : c.d} />
              </p>
              {c.a.length > 0 && (
                <div className="tutorial-ch-a">
                  {c.a.map(([l, at], i) => (
                    <Html key={i} html={`<button type="button" class="b b-sm" ${at}>${l}</button>`} />
                  ))}
                </div>
              )}
            </details>
          );
        }),
      ])}
    </>
  );
}
