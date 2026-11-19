import { PROFILE } from '../../../engine/011-game-state.js';
import { SCENES } from '../../../engine/057-companions-resonance.js';
import { badgeCount459 } from '../../../engine/090-item-quests-trophies.js';
import { CHAP462, NOMSC462, chSt462 } from '../../../engine/093-chronicles-chapters.js';

// Chroniques (v4.62) : chapitres débloqués par les badges, puis scènes déjà vues.
// Boutons gérés par le moteur (clic délégué sur data-ch462).
export default function Chronicles() {
  const s = chSt462(),
    nb = badgeCount459(),
    n = CHAP462.filter((c, i) => s.read[i]).length;
  const seenSet = Object.keys(NOMSC462).filter(k => SCENES[k] && PROFILE.scenes && PROFILE.scenes[k]);
  return (
    <section className="v4-panel" id="hi462">
      <h3 className="h3">Chroniques</h3>
      <p className="v4-note">L’histoire de la Résonance, chapitre après chapitre, au fil de vos badges. <b>{n} / {CHAP462.length}</b> lus.</p>
      <div className="ch462-g">
        {CHAP462.map((c, i) => {
          const lock = nb < c.min,
            lu = s.read[i];
          return (
            <button key={i} type="button" className={`ch462${lu ? ' lu' : ''}${lock ? ' lock' : ''}`} data-ch462={i} disabled={lock}>
              <b>{lock ? 'Chapitre ' + (i + 1) + ' · ???' : c.t}</b>
              <small>{lock ? `Après ${c.min} badge${c.min > 1 ? 's' : ''}.` : lu ? 'Relire' : 'Nouveau · +2 Éclats'}</small>
            </button>
          );
        })}
      </div>
      {seenSet.length > 0 && (
        <>
          <h4 className="h3" style={{ marginTop: '12px' }}>Scènes déjà vues</h4>
          <div className="ch462-g">
            {seenSet.map(k => (
              <button key={k} type="button" className="ch462 lu" data-ch462={`s${k}`}><b>{NOMSC462[k]}</b><small>Revoir</small></button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
