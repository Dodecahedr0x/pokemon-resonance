import { OFFLINE_STATE, offlineSupported, chapterTracks } from '../../../engine/progression/chronicles.js';

// Offline mode (v4.62): music cached on the device.
// Buttons handled by the engine (delegated click on data-offline-pack).
export default function Offline() {
  const ok = offlineSupported(),
    n = OFFLINE_STATE.n,
    tot = chapterTracks().length,
    isReady = OFFLINE_STATE.status === 'prêt';
  const state =
    OFFLINE_STATE.status === 'chargement'
      ? `Téléchargement : ${n} / ${tot}…`
      : isReady
        ? `Musique hors ligne prête (${n} / ${tot} pistes).`
        : OFFLINE_STATE.status === 'erreur'
          ? 'Le téléchargement a échoué.'
          : 'Musique non téléchargée.';
  return (
    <section className="v4-panel" id="offline-panel">
      <h3 className="h3">Mode hors ligne</h3>
      <p className="v4-note">
        Le jeu et votre progression sont déjà sur votre appareil. Ce mode enregistre aussi la musique pour qu’elle joue
        sans connexion. Pour rouvrir le jeu sans réseau, enregistrez la page ou ajoutez-la à l’écran d’accueil depuis le
        menu du navigateur.
      </p>
      <p className="v4-note">
        <b>{navigator.onLine === false ? 'Hors ligne' : 'En ligne'}</b>
        {` · ${state}${ok ? '' : ' Stockage indisponible sur cet appareil.'}`}
      </p>
      <div className="sv-io">
        <button
          type="button"
          className={`b b-sm${isReady ? '' : ' b-gold'}`}
          data-offline-pack="dl"
          disabled={!(ok && OFFLINE_STATE.status !== 'chargement')}
        >
          {isReady ? 'Mettre à jour la musique' : 'Télécharger la musique'}
        </button>
        <button type="button" className="b b-sm b-ghost" data-offline-pack="rm" disabled={!isReady}>
          Supprimer
        </button>
        <button type="button" className="b b-sm b-ghost" data-offline-pack="jeu">
          Enregistrer le jeu
        </button>
      </div>
    </section>
  );
}
