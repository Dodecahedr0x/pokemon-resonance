import { PREF } from '../../../engine/026-campaign-tutorial-sound.js';

// Paramètres › Capture avec timing (v4.53) : bouton data-b453 géré par le moteur (module 083).
export default function CaptureTiming() {
  const on = PREF.capT453 !== 0;
  return (
    <section className="v4-panel" id="ac453">
      <h3 className="h3">Capture avec timing</h3>
      <p className="v4-note">Quand les conditions de capture sont réunies, un anneau se resserre : touchez au bon moment. Parfait : la Ball vous est rendue. Bien : capture normale. Raté : la Ball rebondit et est perdue, mais l’allié n’a pas agi et vous gardez vos Voix. Un bouton permet toujours de passer le timing.</p>
      <div className="sv-io">
        <button type="button" className={`b b-sm${on ? ' b-gold' : ''}`} data-b453="cap">{on ? 'Timing de capture : activé' : 'Timing de capture : désactivé'}</button>
      </div>
    </section>
  );
}
