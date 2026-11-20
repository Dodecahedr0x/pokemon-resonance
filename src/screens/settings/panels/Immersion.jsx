import { IMMERSION_ON } from '../../../engine/audio/immersion.js';

import Button from '../../../components/Button.jsx';
// Settings › Immersion (v4.48): data-immersion-action button handled by the engine (engine/audio/immersion.js).
export default function Immersion() {
  const on = IMMERSION_ON();
  return (
    <section className="card" id="immersion-panel">
      <h3 className="card-title">Immersion</h3>
      <p className="note">
        Bruitages par type d’attaque, cris, entrée en combat animée, particules, tremblement des gros coups, météo
        animée sur le plateau, cartes holographiques et musique plus vive quand un allié est presque K.O. Les vibrations
        et le son se règlent plus bas.
      </p>
      <div className="button-row">
        <Button size="small" variant={on ? 'primary' : undefined} data-immersion-action="im">
          {on ? 'Immersion : activée' : 'Immersion : désactivée'}
        </Button>
      </div>
    </section>
  );
}
