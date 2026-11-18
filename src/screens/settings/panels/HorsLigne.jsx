import { OFF462, offOk462, pistes462 } from '../../../engine/093-4-62-chroniques-histoire-en-chapitres-et-mode-ho.js';

// Mode hors ligne (v4.62) : musique mise en cache sur l'appareil.
// Boutons gérés par le moteur (clic délégué sur data-off462).
export default function HorsLigne() {
  const ok = offOk462(),
    n = OFF462.n,
    tot = pistes462().length,
    pret = OFF462.etat === 'prêt';
  const etat = OFF462.etat === 'chargement' ? `Téléchargement : ${n} / ${tot}…` : pret ? `Musique hors ligne prête (${n} / ${tot} pistes).` : OFF462.etat === 'erreur' ? 'Le téléchargement a échoué.' : 'Musique non téléchargée.';
  return (
    <section className="v4-panel" id="of462">
      <h3 className="h3">Mode hors ligne</h3>
      <p className="v4-note">Le jeu et votre progression sont déjà sur votre appareil. Ce mode enregistre aussi la musique pour qu’elle joue sans connexion. Pour rouvrir le jeu sans réseau, enregistrez la page ou ajoutez-la à l’écran d’accueil depuis le menu du navigateur.</p>
      <p className="v4-note"><b>{navigator.onLine === false ? 'Hors ligne' : 'En ligne'}</b>{` · ${etat}${ok ? '' : ' Stockage indisponible sur cet appareil.'}`}</p>
      <div className="sv-io">
        <button type="button" className={`b b-sm${pret ? '' : ' b-gold'}`} data-off462="dl" disabled={!(ok && OFF462.etat !== 'chargement')}>{pret ? 'Mettre à jour la musique' : 'Télécharger la musique'}</button>
        <button type="button" className="b b-sm b-ghost" data-off462="rm" disabled={!pret}>Supprimer</button>
        <button type="button" className="b b-sm b-ghost" data-off462="jeu">Enregistrer le jeu</button>
      </div>
    </section>
  );
}
