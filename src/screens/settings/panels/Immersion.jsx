import { IMMERSION_ON } from '../../../engine/audio/immersion.js';

// Settings › Immersion (v4.48): data-immersion-action button handled by the engine (engine/audio/immersion.js).
export default function Immersion() {
  const on = IMMERSION_ON();
  return (
    <section className="v4-panel" id="immersion-panel">
      <h3 className="h3">Immersion</h3>
      <p className="v4-note">
        Bruitages par type d’attaque, cris, entrée en combat animée, particules, tremblement des gros coups, météo
        animée sur le plateau, cartes holographiques et musique plus vive quand un allié est presque K.O. Les vibrations
        et le son se règlent plus bas.
      </p>
      <div className="sv-io">
        <button type="button" className={`b b-sm${on ? ' b-gold' : ''}`} data-immersion-action="im">
          {on ? 'Immersion : activée' : 'Immersion : désactivée'}
        </button>
      </div>
    </section>
  );
}
