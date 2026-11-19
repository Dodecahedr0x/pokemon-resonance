import { IM448 } from '../../../engine/079-v4-48-immersion-sons-par-type-cris-vibrations-en.js';

// Paramètres › Immersion (v4.48) : bouton data-b448 géré par le moteur (module 079).
export default function Immersion() {
  const on = IM448();
  return (
    <section className="v4-panel" id="ai448">
      <h3 className="h3">Immersion</h3>
      <p className="v4-note">Bruitages par type d’attaque, cris, entrée en combat animée, particules, tremblement des gros coups, météo animée sur le plateau, cartes holographiques et musique plus vive quand un allié est presque K.O. Les vibrations et le son se règlent plus bas.</p>
      <div className="sv-io">
        <button type="button" className={`b b-sm${on ? ' b-gold' : ''}`} data-b448="im">{on ? 'Immersion : activée' : 'Immersion : désactivée'}</button>
      </div>
    </section>
  );
}
