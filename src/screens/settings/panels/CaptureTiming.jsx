import { PREF } from '../../../engine/ui/preferences.js';

import Button from '../../../components/Button.jsx';
// Settings › Timed capture (v4.53): data-catch-action button handled by the engine (engine/combat/timed-catch.js).
export default function CaptureTiming() {
  const on = PREF.catchTimingEnabled !== 0;
  return (
    <section className="v4-panel" id="capture-timing-panel">
      <h3 className="h3">Capture avec timing</h3>
      <p className="v4-note">
        Quand les conditions de capture sont réunies, un anneau se resserre : touchez au bon moment. Parfait : la Ball
        vous est rendue. Bien : capture normale. Raté : la Ball rebondit et est perdue, mais l’allié n’a pas agi et vous
        gardez vos Voix. Un bouton permet toujours de passer le timing.
      </p>
      <div className="sv-io">
        <Button size="small" variant={on ? 'primary' : undefined} data-catch-action="cap">
          {on ? 'Timing de capture : activé' : 'Timing de capture : désactivé'}
        </Button>
      </div>
    </section>
  );
}
