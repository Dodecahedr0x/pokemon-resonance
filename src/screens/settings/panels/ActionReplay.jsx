import { createur430 } from '../../../engine/065-v4-30-01-camp-et-tactique.js';

const TRICHES = [
  ['argent', '+10 000 ₽'],
  ['eclats', '+100 Éclats'],
  ['sac', 'Sac rempli'],
  ['box', 'Tous les Pokémon'],
  ['badges', 'Tous les badges et Maîtres'],
  ['legendes', 'Quêtes légendaires prêtes'],
  ['fatigue', 'Fatigue à zéro'],
  ['gagner', 'Gagner le combat en cours']
];

// Action Replay (atelierHtml430) : saisie du code, puis raccourcis de test.
// Le moteur gère data-code430, Entrée dans #code430 et data-triche430.
export default function ActionReplay() {
  if (!createur430())
    return (
      <section className="v4-panel v4-ps code430">
        <header className="v4-ph"><svg><use href="#i-lock" /></svg><b>Action Replay</b></header>
        <div className="code430-f">
          <input type="password" id="code430" autoComplete="off" autoCapitalize="characters" spellCheck={false} placeholder="Code Action Replay" aria-label="Code Action Replay" />
          <button type="button" className="b b-sm" data-code430="ok">Valider</button>
        </div>
      </section>
    );
  return (
    <section className="v4-panel v4-ps code430 on">
      <header className="v4-ph"><svg><use href="#i-star" /></svg><b>Action Replay</b><span className="v4-cnt">actif sur cet appareil</span></header>
      <p className="v4-ps-n">Raccourcis de test. Ils modifient la partie en cours : rangez-la d’abord dans un emplacement si besoin.</p>
      <div className="code430-g">
        {TRICHES.map(([k, t]) => <button key={k} type="button" className="b b-sm" data-triche430={k}>{t}</button>)}
      </div>
      <button type="button" className="b b-sm b-ghost" data-triche430="off">Désactiver Action Replay sur cet appareil</button>
    </section>
  );
}
